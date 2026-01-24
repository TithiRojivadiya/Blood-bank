-- Seed a few hospitals with location (run after 0001_initial_postgis_schema.sql)
-- Update latitude/longitude to your region; these are example (India-like) coordinates.

-- Run once. Duplicate runs will create duplicate rows. Password for testing: changeme
INSERT INTO hospitals (name, email, phone, password, city, contact_person, latitude, longitude) VALUES
  ('Apex Heart & Trauma Centre', 'apex@example.com', '9876543210', 'changeme', 'Mumbai', 'Dr. Sharma', 19.0760, 72.8777),
  ('CityCare Multispeciality Hospital', 'citycare@example.com', '9876543211', 'changeme', 'Delhi', 'Dr. Verma', 28.6139, 77.2090),
  ('Green Valley Medical Institute', 'greenvalley@example.com', '9876543212', 'changeme', 'Bangalore', 'Dr. Reddy', 12.9716, 77.5946);
