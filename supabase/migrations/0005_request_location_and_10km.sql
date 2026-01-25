-- ============================================================
-- Request location (lat/lng/city) and 10km hospital / city donor logic
-- ============================================================

-- Add request location columns to blood_requests
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_latitude float;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_longitude float;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_city text;

-- ------------------------------------------------------------
-- RPC: Hospitals within 10km of a point (using PostGIS)
-- Returns id, name, city, distance_meters (ordered by distance)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- RPC: Hospitals in a city (by case-insensitive city match)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- RPC: Donors within 5km of a point (for request location-based matching)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- RPC: Donors in a city (when request has no coordinates)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- RPC: Find nearest hospital to a donor (by donor_id)
-- Returns the closest hospital within 50km, or null if none
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- RPC: Find hospitals near a point (for donor Available flow)
-- Returns hospitals within 50km of a lat/lng point
-- ------------------------------------------------------------
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
