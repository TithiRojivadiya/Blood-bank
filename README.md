# RedHope - Real-Time Blood Donation System

A digital platform connecting blood donors, patients, hospitals, and blood banks during medical emergencies. Enables quick donor discovery, **5km geofencing (PostGIS)**, live availability, and instant notifications.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Geo:** PostGIS (5km donor matching)

## Features

1. **Instant Dispatch** – On blood request, the system immediately finds donors within 5km of the hospital (PostGIS), creates the request, and sends notifications to matched donors, the hospital, and (when known) the patient.

2. **Smart Matching** – Donors are matched by:
   - Blood group
   - **5km radius** from the hospital (PostGIS `ST_DWithin`)
   - Availability
   - Optional eligibility by last donation (e.g. 56 days for whole blood)

3. **Real-time Notifications** – Supabase Realtime subscriptions on the `notifications` table. Donors, patients, and hospitals see new alerts instantly without refresh.

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Enable PostGIS:** Database → Extensions → enable `postgis`.
3. **Run migrations:** SQL Editor → run `supabase/migrations/0001_initial_postgis_schema.sql`.
4. **Seed hospitals (optional):** run `supabase/seed_hospitals.sql` (edit `latitude`/`longitude` for your region).
5. **Realtime:** Database → Replication → add `notifications` to the `supabase_realtime` publication (or run `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`).

### 2. Backend

```bash
cd backend
cp .env.example .env   # set SUPABASE_URL, SUPABASE_KEY (service role)
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 4. Donors & hospitals for 5km matching

- **Donors:** Sign up with **Blood group** and **“Use my location”** (or `latitude`/`longitude`) so they can be matched within 5km.
- **Hospitals:** Sign up with **“Use my location”** so the 5km radius is centered on the hospital.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | `{ role, email, password }` → `{ user, recipient_key }` |
| POST | `/api/auth/signup` | `{ role, ...fields }` (donor/hospital: `latitude`, `longitude`) |
| GET | `/api/hospitals` | List hospitals |
| POST | `/api/requests` | Create request + **Instant Dispatch** + notifications |
| GET | `/api/match/donors?hospital_id=&blood_group=` | **Smart Matching** (5km PostGIS) |
| GET | `/api/notifications/:recipientKey` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark read |

---

## Project layout

```
├── backend/           # Express + Supabase
│   ├── routes/        # auth, hospitals, requests, match, notifications
│   └── index.js
├── frontend/          # React (Vite)
│   ├── Components/    # Patient, Donor, Admin, Blood_bank, Common
│   └── src/           # App, AuthContext, lib (env, supabase)
├── supabase/
│   ├── migrations/    # PostGIS schema, match_donors_within_5km
│   └── seed_hospitals.sql
└── README.md
```
