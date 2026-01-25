const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /api/history?role=DONOR|PATIENT|HOSPITAL|ADMIN&id=<id>
// Returns role-specific history.
router.get('/', async (req, res) => {
  const { role, id } = req.query;
  if (!role || !id) {
    return res.status(400).json({ error: 'role and id are required' });
  }
  const numId = Number(id);
  if (!numId) return res.status(400).json({ error: 'id must be a number' });

  const r = String(role).toUpperCase();

  if (r === 'PATIENT') {
    const { data, error } = await supabase
      .from('blood_requests')
      .select(`
        id, blood_group, component, units_required, units_fulfilled, urgency, status, reason,
        created_at, required_by, fulfilled_at, request_city,
        hospitals:hospital_id (id, name, city, phone)
      `)
      .eq('patient_id', numId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ requests: data || [] });
  }

  if (r === 'DONOR') {
    const [respRes, donRes] = await Promise.all([
      supabase
        .from('donor_responses')
        .select(`
          id, response, created_at, updated_at,
          blood_requests:request_id (
            id, blood_group, component, units_required, urgency, status, reason, created_at,
            hospitals:hospital_id (id, name, city)
          )
        `)
        .eq('donor_id', numId)
        .order('created_at', { ascending: false }),
      supabase
        .from('donations')
        .select(`
          id, blood_group, component, units, donation_date, created_at,
          hospitals:hospital_id (id, name, city),
          blood_requests:request_id (id, blood_group, component, units_required)
        `)
        .eq('donor_id', numId)
        .order('donation_date', { ascending: false }),
    ]);

    if (respRes.error) return res.status(500).json({ error: respRes.error.message });
    if (donRes.error) return res.status(500).json({ error: donRes.error.message });

    return res.json({
      responses: respRes.data || [],
      donations: donRes.data || [],
    });
  }

  if (r === 'HOSPITAL') {
    const { data, error } = await supabase
      .from('blood_requests')
      .select(`
        id, blood_group, component, units_required, units_fulfilled, urgency, status, reason,
        created_at, required_by, fulfilled_at, request_city,
        patients:patient_id (id, full_name, phone),
        donors:donor_id (id, full_name, phone)
      `)
      .eq('hospital_id', numId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ requests: data || [] });
  }

  if (r === 'ADMIN') {
    const { limit, offset } = req.query;
    const lim = Math.min(Number(limit) || 50, 100);
    const off = Number(offset) || 0;

    const { data, error, count } = await supabase
      .from('blood_requests')
      .select(`
        id, blood_group, component, units_required, units_fulfilled, urgency, status, reason,
        created_at, required_by, fulfilled_at, request_city,
        patients:patient_id (id, full_name, email, phone),
        hospitals:hospital_id (id, name, city),
        donors:donor_id (id, full_name, phone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(off, off + lim - 1);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ requests: data || [], total: count ?? 0 });
  }

  return res.status(400).json({ error: 'role must be DONOR, PATIENT, HOSPITAL, or ADMIN' });
});

module.exports = router;
