-- ============================================================
-- Performance Optimization Indexes
-- Run this after 0001 and 0002 migrations
-- ============================================================

-- Indexes for blood_requests table
CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_status ON blood_requests(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_patient_status ON blood_requests(patient_id, status) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blood_requests_status_created ON blood_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency);

-- Indexes for notifications table (already has recipient_key index, adding more)
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_key, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_request ON notifications(request_id) WHERE request_id IS NOT NULL;

-- Indexes for donations table
CREATE INDEX IF NOT EXISTS idx_donations_donor_date ON donations(donor_id, donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_hospital_date ON donations(hospital_id, donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_request ON donations(request_id) WHERE request_id IS NOT NULL;

-- Composite index for donor_responses
CREATE INDEX IF NOT EXISTS idx_donor_responses_request_response ON donor_responses(request_id, response);
CREATE INDEX IF NOT EXISTS idx_donor_responses_donor_response ON donor_responses(donor_id, response);

-- Index for inventory lookups (already has hospital_id index, adding composite)
CREATE INDEX IF NOT EXISTS idx_inventory_lookup_composite ON inventory(hospital_id, blood_group, component);

-- Index for hospitals location queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);

-- Analyze tables to update statistics
ANALYZE donors;
ANALYZE hospitals;
ANALYZE patients;
ANALYZE blood_requests;
ANALYZE notifications;
ANALYZE inventory;
ANALYZE donor_responses;
ANALYZE donations;
