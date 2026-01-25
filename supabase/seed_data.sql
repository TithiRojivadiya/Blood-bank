-- ============================================================
-- Seed data for Real-Time Blood Donation System
-- Run in Supabase SQL Editor AFTER all migrations
-- All passwords: password123  (hospitals: changeme)
-- ============================================================

-- 1) HOSPITALS (with locations for geofencing)
INSERT INTO hospitals (name, email, phone, password, city, contact_person, latitude, longitude)
SELECT * FROM (VALUES
  ('Apex Heart & Trauma Centre', 'apex@example.com', '9876543210', 'changeme', 'Mumbai', 'Dr. Sharma', 19.0760, 72.8777),
  ('CityCare Multispeciality Hospital', 'citycare@example.com', '9876543211', 'changeme', 'Delhi', 'Dr. Verma', 28.6139, 77.2090),
  ('Green Valley Medical Institute', 'greenvalley@example.com', '9876543212', 'changeme', 'Bangalore', 'Dr. Reddy', 12.9716, 77.5946),
  ('Metro General Hospital', 'metro@example.com', '9876543213', 'changeme', 'Mumbai', 'Dr. Kapoor', 19.0750, 72.8760),
  ('Central Blood Bank', 'central@example.com', '9876543214', 'changeme', 'Delhi', 'Dr. Singh', 28.6140, 77.2100)
) AS v(name, email, phone, password, city, contact_person, latitude, longitude)
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE email = 'apex@example.com');

-- 2) DONORS (within ~2km of hospitals for 5km matching). Password: password123
INSERT INTO donors (full_name, email, phone, password, blood_group, city, age, is_available, latitude, longitude)
VALUES
  ('Raj Kumar', 'donor1@test.com', '9876500001', 'password123', 'O+', 'Mumbai', 28, true, 19.0780, 72.8790),
  ('Priya Singh', 'donor2@test.com', '9876500002', 'password123', 'O+', 'Mumbai', 32, true, 19.0770, 72.8780),
  ('Amit Patel', 'donor3@test.com', '9876500003', 'password123', 'A+', 'Mumbai', 25, true, 19.0755, 72.8770),
  ('Sneha Reddy', 'donor4@test.com', '9876500004', 'password123', 'B+', 'Mumbai', 30, true, 19.0790, 72.8800),
  ('Rahul Mehta', 'donor5@test.com', '9876500005', 'password123', 'AB+', 'Delhi', 27, true, 28.6145, 77.2105),
  ('Kavita Desai', 'donor6@test.com', '9876500006', 'password123', 'O-', 'Delhi', 29, true, 28.6142, 77.2102),
  ('Vikram Joshi', 'donor7@test.com', '9876500007', 'password123', 'A-', 'Bangalore', 31, true, 12.9720, 77.5950),
  ('Anjali Nair', 'donor8@test.com', '9876500008', 'password123', 'B-', 'Bangalore', 26, true, 12.9718, 77.5948)
ON CONFLICT (email) DO NOTHING;

-- 3) PATIENTS. Password: password123
INSERT INTO patients (full_name, email, phone, password, city)
VALUES
  ('Vikram Mehta', 'patient1@test.com', '9876500011', 'password123', 'Mumbai'),
  ('Anita Desai', 'patient2@test.com', '9876500012', 'password123', 'Delhi'),
  ('Rohit Sharma', 'patient3@test.com', '9876500013', 'password123', 'Bangalore')
ON CONFLICT (email) DO NOTHING;

-- 4) ADMINS. Password: password123
INSERT INTO admins (name, email, password)
VALUES
  ('System Admin', 'admin@test.com', 'password123')
ON CONFLICT (email) DO NOTHING;

-- 5) INVENTORY (sample inventory for hospitals)
INSERT INTO inventory (hospital_id, blood_group, component, units_available, units_reserved)
SELECT
  h.id,
  bg,
  comp,
  CASE WHEN bg = 'O+' THEN 10 WHEN bg = 'A+' THEN 8 WHEN bg = 'B+' THEN 6 ELSE 4 END,
  0
FROM hospitals h
CROSS JOIN (VALUES ('O+'), ('A+'), ('B+'), ('AB+'), ('O-'), ('A-'), ('B-'), ('AB-')) AS bg(bg)
CROSS JOIN (VALUES ('Whole Blood'), ('RBC'), ('Platelets'), ('Plasma')) AS comp(comp)
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE hospital_id = h.id LIMIT 1)
LIMIT 100;

-- 6) BLOOD_REQUESTS (sample requests)
INSERT INTO blood_requests (patient_id, hospital_id, blood_group, component, units_required, urgency, reason, status, request_city)
SELECT
  (SELECT id FROM patients WHERE email = 'patient1@test.com' LIMIT 1),
  (SELECT id FROM hospitals WHERE email = 'apex@example.com' LIMIT 1),
  'O+',
  'Whole Blood',
  2,
  'Urgent',
  'Surgery – sample request',
  'pending',
  'Mumbai'
WHERE EXISTS (SELECT 1 FROM patients WHERE email = 'patient1@test.com')
  AND EXISTS (SELECT 1 FROM hospitals WHERE email = 'apex@example.com')
  AND NOT EXISTS (SELECT 1 FROM blood_requests WHERE patient_id = (SELECT id FROM patients WHERE email = 'patient1@test.com' LIMIT 1) LIMIT 1);

-- 7) NOTIFICATIONS (sample notifications)
INSERT INTO notifications (recipient_key, title, body, request_id)
SELECT 'donor_' || d.id, '🩸 Blood Request', 'O+ Whole Blood needed urgently at Apex Heart & Trauma Centre. Please respond Available or Unavailable.', (SELECT id FROM blood_requests ORDER BY id DESC LIMIT 1)
FROM donors d 
WHERE d.blood_group = 'O+' AND d.is_available = true
  AND EXISTS (SELECT 1 FROM blood_requests ORDER BY id DESC LIMIT 1)
LIMIT 5;

INSERT INTO notifications (recipient_key, title, body, request_id)
SELECT 'patient_' || p.id, 'Request received', 'We are finding donors within 5km. You will be notified.', (SELECT id FROM blood_requests ORDER BY id DESC LIMIT 1)
FROM patients p WHERE p.email = 'patient1@test.com' 
  AND EXISTS (SELECT 1 FROM blood_requests ORDER BY id DESC LIMIT 1);

INSERT INTO notifications (recipient_key, title, body, request_id)
SELECT 'hospital_' || h.id, 'New blood request', 'O+ Whole Blood, 2 units – Urgent. Patient: Vikram Mehta.', (SELECT id FROM blood_requests ORDER BY id DESC LIMIT 1)
FROM hospitals h WHERE h.email = 'apex@example.com' 
  AND EXISTS (SELECT 1 FROM blood_requests ORDER BY id DESC LIMIT 1);

-- ============================================================
-- LOGIN CREDENTIALS (Role | Email              | Password)
-- ============================================================
-- DONOR    | donor1@test.com   | password123
-- DONOR    | donor2@test.com   | password123
-- DONOR    | donor3@test.com   | password123
-- DONOR    | donor4@test.com   | password123
-- DONOR    | donor5@test.com   | password123
-- DONOR    | donor6@test.com   | password123
-- DONOR    | donor7@test.com   | password123
-- DONOR    | donor8@test.com   | password123
-- PATIENT  | patient1@test.com | password123
-- PATIENT  | patient2@test.com | password123
-- PATIENT  | patient3@test.com | password123
-- HOSPITAL | apex@example.com  | changeme
-- HOSPITAL | citycare@example.com | changeme
-- HOSPITAL | greenvalley@example.com | changeme
-- HOSPITAL | metro@example.com | changeme
-- HOSPITAL | central@example.com | changeme
-- ADMIN    | admin@test.com    | password123
