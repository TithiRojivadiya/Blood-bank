const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// POST /api/donations - Record a donation
// Now only requires: donor_id, hospital_id, donation_date
// blood_group is fetched from donor profile, component defaults to "Whole Blood", units defaults to 1
router.post('/', async (req, res) => {
  const { donor_id, request_id, hospital_id, donation_date } = req.body;

  if (!donor_id || !hospital_id) {
    return res.status(400).json({ error: 'donor_id and hospital_id are required' });
  }

  // Validate hospital exists
  const hospitalIdNum = Number(hospital_id);
  const { data: hospital, error: hospitalError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', hospitalIdNum)
    .single();

  if (hospitalError || !hospital) {
    return res.status(400).json({ error: 'Hospital not found. Invalid hospital_id' });
  }

  // Get donor's blood group from profile
  const { data: donor, error: donorError } = await supabase
    .from('donors')
    .select('blood_group')
    .eq('id', Number(donor_id))
    .single();

  if (donorError || !donor || !donor.blood_group) {
    return res.status(400).json({ error: 'Donor not found or blood group not set in profile. Please update your profile.' });
  }

  // Validate donation date is not in the past
  const donationDate = donation_date || new Date().toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  if (donationDate < today) {
    return res.status(400).json({ error: 'Donation date cannot be in the past. Please select today or a future date.' });
  }

  const { data, error } = await supabase
    .from('donations')
    .insert({
      donor_id: Number(donor_id),
      request_id: request_id ? Number(request_id) : null,
      hospital_id: hospitalIdNum,
      blood_group: donor.blood_group, // Get from donor profile
      component: 'Whole Blood', // Default component
      units: 1, // Default to 1 unit
      donation_date: donationDate,
    })
    .select()
    .single();

  if (error) {
    // Handle schema cache error specifically
    if (error.message && error.message.includes('schema cache')) {
      return res.status(500).json({ 
        error: 'Database schema cache needs to be refreshed. Please run "NOTIFY pgrst, \'reload schema\';" in Supabase SQL Editor.' 
      });
    }
    return res.status(500).json({ error: error.message });
  }

  // Update donor's last donation date
  await supabase
    .from('donors')
    .update({ last_donation_date: donationDate })
    .eq('id', Number(donor_id));

  // If linked to a request, update request status
  if (request_id) {
    const { data: request } = await supabase
      .from('blood_requests')
      .select('units_required, units_fulfilled')
      .eq('id', Number(request_id))
      .single();

    if (request) {
      const newFulfilled = (request.units_fulfilled || 0) + 1; // Always 1 unit
      const updates = {
        units_fulfilled: newFulfilled,
        donor_id: Number(donor_id),
      };

      if (newFulfilled >= request.units_required) {
        updates.status = 'fulfilled';
        updates.fulfilled_at = new Date().toISOString();
      } else {
        updates.status = 'partially_fulfilled';
      }

      await supabase
        .from('blood_requests')
        .update(updates)
        .eq('id', Number(request_id));
    }
  }

  res.status(201).json(data);
});

// GET /api/donations/donor/:donorId - Get donation history for a donor
router.get('/donor/:donorId', async (req, res) => {
  const { donorId } = req.params;

  const { data, error } = await supabase
    .from('donations')
    .select(`
      *,
      hospitals:hospital_id (name, city),
      blood_requests:request_id (id, urgency, reason)
    `)
    .eq('donor_id', Number(donorId))
    .order('donation_date', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/donations/hospital/:hospitalId - Get donations for a hospital
router.get('/hospital/:hospitalId', async (req, res) => {
  const { hospitalId } = req.params;

  const { data, error } = await supabase
    .from('donations')
    .select(`
      *,
      donors:donor_id (id, full_name, email, phone, blood_group)
    `)
    .eq('hospital_id', Number(hospitalId))
    .order('donation_date', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/donations/nearest-hospital/:donorId - Find nearest hospital to a donor
router.get('/nearest-hospital/:donorId', async (req, res) => {
  const { donorId } = req.params;

  const { data, error } = await supabase.rpc('find_nearest_hospital_to_donor', {
    p_donor_id: Number(donorId),
  });

  if (error) {
    // Handle schema cache error specifically
    if (error.message && error.message.includes('schema cache')) {
      return res.status(500).json({ 
        error: 'Database schema cache needs to be refreshed. Please run "NOTIFY pgrst, \'reload schema\';" in Supabase SQL Editor.' 
      });
    }
    return res.status(500).json({ error: error.message });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'No hospital found within 50km. Please update your location or contact support.' });
  }
  res.json(data[0]);
});

module.exports = router;
