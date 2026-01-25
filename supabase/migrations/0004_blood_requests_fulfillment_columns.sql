-- ============================================================
-- Fix: Add fulfillment columns to blood_requests if missing
-- Run this in Supabase SQL Editor if you see:
--   "Could not find the 'fulfilled_at' column of 'blood_requests' in the schema cache"
-- ============================================================

ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS units_fulfilled int DEFAULT 0;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS donor_id bigint REFERENCES donors(id);

-- Optional: add check constraint if not already present (e.g. from 0002)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_units_fulfilled'
    AND conrelid = 'blood_requests'::regclass
  ) THEN
    ALTER TABLE blood_requests
    ADD CONSTRAINT check_units_fulfilled
    CHECK (units_fulfilled >= 0 AND units_fulfilled <= units_required);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- ignore if constraint already exists or check fails
END $$;
