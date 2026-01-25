# Quick Update Guide - For Existing Database

## ⚠️ If you have existing data, run ONLY this:

### Single Migration File
Run **`supabase/migrations/0007_update_existing_schema.sql`** in Supabase SQL Editor.

This migration:
- ✅ **Preserves all your existing data**
- ✅ Adds new columns (IF NOT EXISTS - won't break if already there)
- ✅ Creates new RPC functions
- ✅ Ensures inventory table exists
- ✅ Updates location geography for existing records that have lat/lng
- ✅ Refreshes schema cache

---

## What This Migration Does

### 1. Adds New Columns (Safe - uses IF NOT EXISTS)
- `blood_requests`: `request_latitude`, `request_longitude`, `request_city`
- `donors`: `is_available` (defaults to `true`), `latitude`, `longitude`, `location`
- `hospitals`: `latitude`, `longitude`, `location`

### 2. Creates Location Triggers
- Automatically sets `location` geography when `latitude`/`longitude` are updated
- Updates existing records that have lat/lng but no location

### 3. Creates New RPC Functions
- `hospitals_within_10km(lat, lng)` - for request routing
- `hospitals_in_city(city)` - fallback when no hospitals in 10km
- `match_donors_within_5km_of_point(lat, lng, blood_group)` - location-based matching
- `match_donors_in_city(city, blood_group)` - city-based matching
- `find_nearest_hospital_to_donor(donor_id)` - for donation feature
- `hospitals_near_point(lat, lng, max_distance)` - for donor "Available" flow

### 4. Ensures Inventory Table Exists
- Creates table if it doesn't exist
- Creates indexes and triggers
- **Your existing inventory data is preserved**

---

## After Running Migration

### Optional: Update Existing Records

If your existing donors/hospitals have `latitude` and `longitude` but no `location` geography, the migration will update them automatically. But you can also manually update:

```sql
-- Update donors with lat/lng to have location
UPDATE donors 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- Update hospitals with lat/lng to have location
UPDATE hospitals 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;
```

### Set is_available for Existing Donors

If you want all existing donors to be available by default:

```sql
UPDATE donors SET is_available = true WHERE is_available IS NULL;
```

---

## What You DON'T Need to Run

❌ **Don't run:**
- `0001_initial_postgis_schema.sql` (you already have tables)
- `0002_inventory_and_dispatch.sql` (only if inventory table doesn't exist)
- `0003_performance_indexes.sql` (optional)
- `0004_blood_requests_fulfillment_columns.sql` (only if columns missing)
- `0005_request_location_and_10km.sql` (use 0007 instead)
- `0006_ensure_inventory_table.sql` (included in 0007)
- `seed_data.sql` (you have your own data)

---

## Verify Migration Success

After running `0007_update_existing_schema.sql`, check:

```sql
-- Check if new columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'blood_requests' AND column_name IN ('request_latitude', 'request_longitude', 'request_city');

-- Check if RPCs exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('hospitals_within_10km', 'find_nearest_hospital_to_donor', 'hospitals_near_point');

-- Check if inventory table exists
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory');
```

---

## That's It!

After running `0007_update_existing_schema.sql`, your system will have:
- ✅ All new features enabled
- ✅ All existing data preserved
- ✅ New RPCs for location-based features
- ✅ Inventory table ready

No need to run any other migrations or seed data!
