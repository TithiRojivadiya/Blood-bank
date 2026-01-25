# Real-Time Blood Donation System - Setup Instructions

## ✅ All Features Implemented

### Core Features
1. **Instant Dispatch** - Location-based request routing (10km hospitals, then city)
2. **Smart Matching** - PostGIS geofencing for 5km donor matching
3. **Real-time Notifications** - Supabase Realtime subscriptions

### Additional Features
- ✅ Notifications: Available/Unavailable for donors (replaces Mark Read)
- ✅ Request form: Location (my location + map, or manual city)
- ✅ Request flow: Hospitals first (10km/city), then donors if no inventory
- ✅ Profile: Fetches from DB and displays correct data
- ✅ History: For all user roles (Patient, Donor, Hospital, Admin)
- ✅ Donation: Donors can donate to nearest hospital
- ✅ Inventory: Tabular format (components as columns, blood groups as rows)
- ✅ Admin: Can manage Donors, Users, Hospitals (Admin signup removed)

---

## 🚀 Setup Steps

### 1. Database Setup (Supabase)

Run these migrations in order in Supabase SQL Editor:

1. `supabase/migrations/0001_initial_postgis_schema.sql`
2. `supabase/migrations/0002_inventory_and_dispatch.sql`
3. `supabase/migrations/0003_performance_indexes.sql` (if exists)
4. `supabase/migrations/0004_blood_requests_fulfillment_columns.sql`
5. `supabase/migrations/0005_request_location_and_10km.sql` ⚠️ **Fixed duplicate function**
6. `supabase/migrations/0006_ensure_inventory_table.sql` ⚠️ **Fixes schema cache issue**

**Important:** After running migrations, run:
```sql
-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

### 2. Seed Data

Run `supabase/seed_data.sql` in Supabase SQL Editor to populate:
- 5 Hospitals (with locations)
- 8 Donors (with locations near hospitals)
- 3 Patients
- 1 Admin
- Sample inventory
- Sample requests and notifications

**Login Credentials:**
- **Donor:** `donor1@test.com` / `password123`
- **Patient:** `patient1@test.com` / `password123`
- **Hospital:** `apex@example.com` / `changeme`
- **Admin:** `admin@test.com` / `password123`

### 3. Environment Variables

**Backend (`backend/.env`):**
```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 5. Run the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📋 Key Features Summary

### Hospital Dashboard
- Shows **top 3 recent requests** only
- Link to view full history
- Inventory summary by blood group

### Inventory Management
- **Tabular format:** Components as columns, Blood Groups as rows
- **Real-time updates** via Supabase Realtime
- Edit/Remove buttons for each inventory item
- Totals row and column

### Donor "Available" Flow
1. Donor clicks "Available" on notification
2. Modal opens asking for location:
   - "Use my location" (geolocation API)
   - "Enter city" (manual search)
3. Shows nearby hospitals (within 50km)
4. Donor selects hospital
5. System:
   - Updates donor response to "accepted"
   - Adds 1 unit to selected hospital's inventory
   - Notifies patient that blood is available
   - Marks notification as read

### Patient/Donor Dashboards
- Show **top 3 recent entries** only
- Link to view full history

### Admin Features
- **Donors page:** Lists all donors with details
- **Users page:** Tabs for Patients, Donors, Hospitals
- **Admin signup removed** (only existing admin can login)
- **Notifications:** Works via `admin_<id>` recipient key

---

## 🔧 Troubleshooting

### "Could not find the table 'public.inventory' in the schema cache"
**Solution:** Run migration `0006_ensure_inventory_table.sql` and refresh schema:
```sql
NOTIFY pgrst, 'reload schema';
```

### "Could not find the function public.find_nearest_hospital_to_donor"
**Solution:** Ensure migration `0005_request_location_and_10km.sql` ran successfully (duplicate function removed).

### "column 'location' does not exist"
**Solution:** Ensure migration `0001_initial_postgis_schema.sql` ran and PostGIS extension is enabled.

### "column 'is_available' does not exist"
**Solution:** Ensure migration `0001_initial_postgis_schema.sql` ran (adds `is_available` to donors).

### Foreign key type mismatch (bigint vs uuid)
**Solution:** Check your existing schema. The migrations assume `bigint` for IDs. If your tables use `uuid`, you'll need to adjust the migrations.

---

## 📝 Notes

- **PostGIS Required:** All geofencing features require PostGIS extension
- **Location Data:** Donors and Hospitals need `latitude`/`longitude` for geofencing to work
- **Real-time:** Requires Supabase Realtime enabled for notifications and inventory
- **Map:** Uses OpenStreetMap iframe (no dependencies, works with React 19)

---

## 🎯 Testing Checklist

- [ ] Login as each role (Donor, Patient, Hospital, Admin)
- [ ] Create blood request (with location)
- [ ] Donor receives notification
- [ ] Donor clicks "Available" → selects hospital → inventory updates
- [ ] Hospital dashboard shows top 3 requests
- [ ] Inventory shows tabular format
- [ ] Admin can view Donors and Users
- [ ] History works for all roles
- [ ] Profile displays correct data (not null)

---

## 📞 Support

If you encounter issues:
1. Check all migrations ran successfully
2. Verify PostGIS extension is enabled
3. Check environment variables are set
4. Ensure Supabase Realtime is enabled for `notifications` and `inventory` tables
