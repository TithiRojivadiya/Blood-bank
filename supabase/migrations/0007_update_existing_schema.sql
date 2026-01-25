-- ============================================================
-- Update Existing Schema - Preserves All Existing Data
-- Run this ONLY if you have existing data and want to add new features
-- ============================================================

-- 1) Add location columns to blood_requests (if not exist)
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_latitude float;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_longitude float;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_city text;

-- 2) Ensure donors have is_available column
ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- 3) Ensure donors have location columns (if not exist)
ALTER TABLE donors ADD COLUMN IF NOT EXISTS latitude float;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS longitude float;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 4) Ensure hospitals have location columns (if not exist)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS latitude float;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS longitude float;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 5) Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_donors_location ON donors USING GIST (location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donors_blood_available ON donors(blood_group, is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals USING GIST (location) WHERE location IS NOT NULL;

-- 6) Create/update triggers for location (if not exist)
CREATE OR REPLACE FUNCTION donors_set_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_donors_set_location ON donors;
CREATE TRIGGER tr_donors_set_location 
  BEFORE INSERT OR UPDATE OF latitude, longitude ON donors
  FOR EACH ROW 
  EXECUTE FUNCTION donors_set_location();

CREATE OR REPLACE FUNCTION hospitals_set_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_hospitals_set_location ON hospitals;
CREATE TRIGGER tr_hospitals_set_location 
  BEFORE INSERT OR UPDATE OF latitude, longitude ON hospitals
  FOR EACH ROW 
  EXECUTE FUNCTION hospitals_set_location();

-- 7) Update existing donors/hospitals to set location if they have lat/lng but no location
UPDATE donors 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

UPDATE hospitals 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- 8) Create/Replace RPCs for new features
CREATE OR REPLACE FUNCTION hospitals_within_10km(p_lat float, p_lng float)
RETURNS TABLE (
  id bigint,
  name text,
  city text,
  latitude float,
  longitude float,
  distance_meters float
)
LANGUAGE sql
STABLE
AS $$
  WITH pt AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT
    h.id,
    h.name,
    h.city,
    h.latitude,
    h.longitude,
    ST_Distance(h.location::geography, pt.g)::float AS distance_meters
  FROM hospitals h
  CROSS JOIN pt
  WHERE h.location IS NOT NULL
    AND ST_DWithin(h.location::geography, pt.g, 10000)
  ORDER BY distance_meters;
$$;

CREATE OR REPLACE FUNCTION hospitals_in_city(p_city text)
RETURNS TABLE (
  id bigint,
  name text,
  city text,
  latitude float,
  longitude float
)
LANGUAGE sql
STABLE
AS $$
  SELECT h.id, h.name, h.city, h.latitude, h.longitude
  FROM hospitals h
  WHERE LOWER(TRIM(h.city)) = LOWER(TRIM(p_city))
  ORDER BY h.name;
$$;

CREATE OR REPLACE FUNCTION match_donors_within_5km_of_point(p_lat float, p_lng float, p_blood_group text)
RETURNS TABLE (
  id bigint,
  full_name text,
  email text,
  phone text,
  blood_group text,
  city text,
  age int,
  last_donation_date date,
  is_available boolean,
  distance_meters float
)
LANGUAGE sql
STABLE
AS $$
  WITH pt AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT
    d.id,
    d.full_name,
    d.email,
    d.phone,
    d.blood_group,
    d.city,
    d.age,
    d.last_donation_date,
    d.is_available,
    ST_Distance(d.location::geography, pt.g)::float AS distance_meters
  FROM donors d
  CROSS JOIN pt
  WHERE d.blood_group = p_blood_group
    AND d.is_available = true
    AND d.location IS NOT NULL
    AND ST_DWithin(d.location::geography, pt.g, 5000)
  ORDER BY distance_meters;
$$;

CREATE OR REPLACE FUNCTION match_donors_in_city(p_city text, p_blood_group text)
RETURNS TABLE (
  id bigint,
  full_name text,
  email text,
  phone text,
  blood_group text,
  city text,
  age int,
  last_donation_date date,
  is_available boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.full_name,
    d.email,
    d.phone,
    d.blood_group,
    d.city,
    d.age,
    d.last_donation_date,
    d.is_available
  FROM donors d
  WHERE d.blood_group = p_blood_group
    AND d.is_available = true
    AND LOWER(TRIM(d.city)) = LOWER(TRIM(p_city))
  ORDER BY d.last_donation_date NULLS FIRST;
$$;

CREATE OR REPLACE FUNCTION find_nearest_hospital_to_donor(p_donor_id bigint)
RETURNS TABLE (
  id bigint,
  name text,
  city text,
  latitude float,
  longitude float,
  distance_meters float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    h.id,
    h.name,
    h.city,
    h.latitude,
    h.longitude,
    ST_Distance(d.location::geography, h.location::geography)::float AS distance_meters
  FROM donors d
  CROSS JOIN hospitals h
  WHERE d.id = p_donor_id
    AND d.location IS NOT NULL
    AND h.location IS NOT NULL
    AND ST_DWithin(d.location::geography, h.location::geography, 50000)
  ORDER BY distance_meters
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION hospitals_near_point(p_lat float, p_lng float, p_max_distance_meters int DEFAULT 50000)
RETURNS TABLE (
  id bigint,
  name text,
  city text,
  latitude float,
  longitude float,
  distance_meters float
)
LANGUAGE sql
STABLE
AS $$
  WITH pt AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT
    h.id,
    h.name,
    h.city,
    h.latitude,
    h.longitude,
    ST_Distance(h.location::geography, pt.g)::float AS distance_meters
  FROM hospitals h
  CROSS JOIN pt
  WHERE h.location IS NOT NULL
    AND ST_DWithin(h.location::geography, pt.g, p_max_distance_meters)
  ORDER BY distance_meters;
$$;

-- 9) Ensure inventory table exists (if not exist)
CREATE TABLE IF NOT EXISTS inventory (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  hospital_id bigint REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  blood_group text NOT NULL,
  component text NOT NULL,
  units_available int DEFAULT 0 CHECK (units_available >= 0),
  units_reserved int DEFAULT 0 CHECK (units_reserved >= 0),
  last_updated timestamptz DEFAULT now(),
  UNIQUE(hospital_id, blood_group, component)
);

CREATE INDEX IF NOT EXISTS idx_inventory_hospital ON inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory(hospital_id, blood_group, component);

CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_inventory_timestamp ON inventory;
CREATE TRIGGER tr_inventory_timestamp
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_timestamp();

-- 10) Refresh schema cache
NOTIFY pgrst, 'reload schema';
