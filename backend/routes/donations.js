const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// POST /api/donations - Record a donation
router.post('/', async (req, res) => {
  const { donor_id, request_id, hospital_id, blood_group, component, units, donation_date } = req.body;

  if (!donor_id || !hospital_id || !blood_group || !component) {
    return res.status(400).json({ error: 'donor_id, hospital_id, blood_group, and component are required' });
  }

  const { data, error } = await supabase
    .from('donations')
    .insert({
      donor_id: Number(donor_id),
      request_id: request_id ? Number(request_id) : null,
      hospital_id: Number(hospital_id),
      blood_group: String(blood_group).trim(),
      component: String(component).trim(),
      units: units ? Number(units) : 1,
      donation_date: donation_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Update donor's last donation date
  await supabase
    .from('donors')
    .update({ last_donation_date: donation_date || new Date().toISOString().split('T')[0] })
    .eq('id', Number(donor_id));

  // If linked to a request, update request status
  if (request_id) {
    const { data: request } = await supabase
      .from('blood_requests')
      .select('units_required, units_fulfilled')
      .eq('id', Number(request_id))
      .single();

    if (request) {
      const newFulfilled = (request.units_fulfilled || 0) + (units || 1);
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

module.exports = router;
