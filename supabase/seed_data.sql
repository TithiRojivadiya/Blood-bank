-- ============================================================
-- Seed data for Real-Time Blood Donation System
-- Run in Supabase SQL Editor AFTER 0001_initial_postgis_schema.sql
-- All passwords: password123  (hospitals: changeme if you ran seed_hospitals)
-- ============================================================

-- 1) HOSPITALS (skip if already seeded — e.g. from seed_hospitals.sql)
INSERT INTO hospitals (name, email, phone, password, city, contact_person, latitude, longitude)
SELECT * FROM (VALUES
  ('Apex Heart & Trauma Centre', 'apex@example.com', '9876543210', 'changeme', 'Mumbai', 'Dr. Sharma', 19.0760, 72.8777),
  ('CityCare Multispeciality Hospital', 'citycare@example.com', '9876543211', 'changeme', 'Delhi', 'Dr. Verma', 28.6139, 77.2090),
  ('Green Valley Medical Institute', 'greenvalley@example.com', '9876543212', 'changeme', 'Bangalore', 'Dr. Reddy', 12.9716, 77.5946)
) AS v(name, email, phone, password, city, contact_person, latitude, longitude)
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE email = 'apex@example.com');

-- 2) DONORS (within ~2km of Apex, Mumbai — so 5km matching works). Password: password123
INSERT INTO donors (full_name, email, phone, password, blood_group, city, age, is_available, latitude, longitude)
VALUES
  ('Raj Kumar', 'donor1@test.com', '9876500001', 'password123', 'O+', 'Mumbai', 28, true, 19.0780, 72.8790),
  ('Priya Singh', 'donor2@test.com', '9876500002', 'password123', 'O+', 'Mumbai', 32, true, 19.0770, 72.8780),
  ('Amit Patel', 'donor3@test.com', '9876500003', 'password123', 'A+', 'Mumbai', 25, true, 19.0755, 72.8770),
  ('Sneha Reddy', 'donor4@test.com', '9876500004', 'password123', 'B+', 'Mumbai', 30, true, 19.0790, 72.8800)
ON CONFLICT (email) DO NOTHING;

-- 3) PATIENTS. Password: password123
INSERT INTO patients (full_name, email, phone, password, city)
VALUES
  ('Vikram Mehta', 'patient1@test.com', '9876500011', 'password123', 'Mumbai'),
  ('Anita Desai', 'patient2@test.com', '9876500012', 'password123', 'Delhi')
ON CONFLICT (email) DO NOTHING;

-- 4) ADMINS. Password: password123
INSERT INTO admins (name, email, password)
VALUES
  ('System Admin', 'admin@test.com', 'password123')
ON CONFLICT (email) DO NOTHING;

-- 5) BLOOD_REQUESTS (1 sample — links patient1, Apex hospital)
INSERT INTO blood_requests (patient_id, hospital_id, blood_group, component, units_required, urgency, reason, status)
SELECT
  (SELECT id FROM patients WHERE email = 'patient1@test.com' LIMIT 1),
  (SELECT id FROM hospitals WHERE email = 'apex@example.com' LIMIT 1),
  'O+',
  'Whole Blood',
  2,
  'Urgent',
  'Surgery – sample request',
  'pending'
WHERE EXISTS (SELECT 1 FROM patients WHERE email = 'patient1@test.com')
  AND EXISTS (SELECT 1 FROM hospitals WHERE email = 'apex@example.com')
  AND NOT EXISTS (SELECT 1 FROM blood_requests LIMIT 1);

-- 6) NOTIFICATIONS (sample for donor and patient)
INSERT INTO notifications (recipient_key, title, body, request_id)
SELECT 'donor_' || d.id, 'Blood request near you', 'O+ needed at Apex. Please check if you can help.', (SELECT id FROM blood_requests ORDER BY id DESC LIMIT 1)
FROM donors d WHERE d.email = 'donor1@test.com' AND EXISTS (SELECT 1 FROM blood_requests LIMIT 1);

INSERT INTO notifications (recipient_key, title, body, request_id)
SELECT 'patient_' || p.id, 'Request received', 'We are finding donors within 5km. You will be notified.', (SELECT id FROM blood_requests ORDER BY id DESC LIMIT 1)
FROM patients p WHERE p.email = 'patient1@test.com' AND EXISTS (SELECT 1 FROM blood_requests LIMIT 1);

INSERT INTO notifications (recipient_key, title, body, request_id)
SELECT 'hospital_' || h.id, 'New blood request', 'O+, 2 units – Urgent. Patient: Vikram Mehta.', (SELECT id FROM blood_requests ORDER BY id DESC LIMIT 1)
FROM hospitals h WHERE h.email = 'apex@example.com' AND EXISTS (SELECT 1 FROM blood_requests LIMIT 1);

-- ============================================================
-- LOGIN CREDENTIALS (Role | Email              | Password)
-- ============================================================
-- DONOR    | donor1@test.com   | password123
-- DONOR    | donor2@test.com   | password123
-- PATIENT  | patient1@test.com | password123
-- PATIENT  | patient2@test.com | password123
-- HOSPITAL | apex@example.com  | changeme
-- HOSPITAL | citycare@example.com | changeme
-- HOSPITAL | greenvalley@example.com | changeme
-- ADMIN    | admin@test.com    | password123
