const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

const router = express.Router();

// GET /api/requests - Get all requests (with optional filters) - Cached & Paginated
router.get('/', cacheMiddleware(30000), async (req, res) => {
  const { hospital_id, patient_id, status } = req.query;
  const { limit, offset } = req.pagination || { limit: 20, offset: 0 };
  
  // Build count query for pagination
  let countQuery = supabase
    .from('blood_requests')
    .select('*', { count: 'exact', head: true });

  // Build data query
  let query = supabase
    .from('blood_requests')
    .select(`
      *,
      hospitals:hospital_id (id, name, city, phone),
      patients:patient_id (id, full_name, email, phone),
      donors:donor_id (id, full_name, email, phone)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (hospital_id) {
    query = query.eq('hospital_id', Number(hospital_id));
    countQuery = countQuery.eq('hospital_id', Number(hospital_id));
  }
  if (patient_id) {
    query = query.eq('patient_id', Number(patient_id));
    countQuery = countQuery.eq('patient_id', Number(patient_id));
  }
  if (status) {
    query = query.eq('status', String(status));
    countQuery = countQuery.eq('status', String(status));
  }

  const [{ data, error, count }, { count: totalCount }] = await Promise.all([
    query,
    countQuery,
  ]);

  if (error) return res.status(500).json({ error: error.message });
  
  // Use paginated response if pagination middleware is active
  if (res.paginated) {
    return res.paginated(data || [], totalCount || 0);
  }
  
  res.json(data || []);
});

// GET /api/requests/:id - Get single request with responses
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('blood_requests')
    .select(`
      *,
      hospitals:hospital_id (id, name, city, phone, contact_person),
      patients:patient_id (id, full_name, email, phone),
      donors:donor_id (id, full_name, email, phone)
    `)
    .eq('id', Number(id))
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Request not found' });

  // Get donor responses
  const { data: responses } = await supabase
    .from('donor_responses')
    .select(`
      *,
      donors:donor_id (id, full_name, email, phone, blood_group, city)
    `)
    .eq('request_id', Number(id));

  res.json({ ...data, donor_responses: responses || [] });
});

// POST /api/requests – Enhanced Instant Dispatch with inventory checking
// Body: { hospital_id, blood_group, component, units_required, urgency, required_by?, reason, patient_id? }
router.post('/', async (req, res) => {
  const {
    hospital_id,
    blood_group,
    component,
    units_required,
    urgency,
    required_by,
    reason,
    patient_id,
  } = req.body;

  if (!hospital_id || !blood_group || !component || !units_required || !urgency || !reason) {
    return res.status(400).json({
      error: 'hospital_id, blood_group, component, units_required, urgency, reason are required',
    });
  }

  // 1) Check inventory first - if available, fulfill immediately
  const { data: inventory } = await supabase
    .from('inventory')
    .select('units_available')
    .eq('hospital_id', Number(hospital_id))
    .eq('blood_group', String(blood_group).trim())
    .eq('component', String(component).trim())
    .single();

  const availableUnits = inventory?.units_available || 0;
  const needsDonors = availableUnits < Number(units_required);

  // 2) Insert blood request
  const { data: request, error: errReq } = await supabase
    .from('blood_requests')
    .insert({
      patient_id: patient_id || null,
      hospital_id: Number(hospital_id),
      blood_group: String(blood_group).trim(),
      component: String(component).trim(),
      units_required: Number(units_required),
      urgency: String(urgency).trim(),
      required_by: required_by || null,
      reason: String(reason).trim(),
      status: needsDonors ? 'pending' : 'fulfilled',
      units_fulfilled: needsDonors ? 0 : Number(units_required),
      fulfilled_at: needsDonors ? null : new Date().toISOString(),
    })
    .select('id, hospital_id, blood_group, urgency, created_at, status')
    .single();

  if (errReq) return res.status(500).json({ error: errReq.message });

  const donors = [];
  const notifs = [];

  // 3) If inventory available, use it and update inventory
  if (!needsDonors) {
    await supabase
      .from('inventory')
      .update({ units_available: availableUnits - Number(units_required) })
      .eq('hospital_id', Number(hospital_id))
      .eq('blood_group', String(blood_group).trim())
      .eq('component', String(component).trim());

    notifs.push({
      recipient_key: `hospital_${hospital_id}`,
      title: '✅ Request Fulfilled from Inventory',
      body: `${blood_group} ${component} request fulfilled from available inventory.`,
      request_id: request.id,
    });

    if (patient_id) {
      notifs.push({
        recipient_key: `patient_${patient_id}`,
        title: '✅ Blood Available',
        body: `Your blood request has been fulfilled from hospital inventory.`,
        request_id: request.id,
      });
    }
  } else {
    // 4) Smart Matching: donors within 5km
    const { data: matchedDonors } = await supabase.rpc('match_donors_within_5km', {
      p_hospital_id: Number(hospital_id),
      p_blood_group: String(blood_group).trim(),
    });

    donors.push(...(matchedDonors || []));

    // 5) Notify each matched donor
    const hospitalName = (await supabase.from('hospitals').select('name').eq('id', hospital_id).single()).data?.name || 'Nearby Hospital';
    
    for (const d of donors) {
      notifs.push({
        recipient_key: `donor_${d.id}`,
        title: urgency === 'Emergency' ? '🚨 URGENT: Emergency Blood Request' : '🩸 Blood Request',
        body: `${blood_group} ${component} needed urgently - ${reason}. Hospital: ${hospitalName}. Please respond if you can help.`,
        request_id: request.id,
      });

      // Create pending response record
      await supabase
        .from('donor_responses')
        .insert({
          request_id: request.id,
          donor_id: d.id,
          response: 'pending',
        })
        .catch(() => {}); // Ignore if already exists
    }

    // 6) Notify hospital
    notifs.push({
      recipient_key: `hospital_${hospital_id}`,
      title: 'New blood request',
      body: `${blood_group} ${component}, ${units_required} unit(s) needed. ${donors.length} donor(s) notified within 5km. ${availableUnits > 0 ? `Inventory: ${availableUnits} units available.` : 'No inventory available.'}`,
      request_id: request.id,
    });

    // 7) Notify patient if known
    if (patient_id) {
      notifs.push({
        recipient_key: `patient_${patient_id}`,
        title: 'Request received',
        body: `We're contacting ${donors.length} donor(s) within 5km. ${availableUnits > 0 ? `Hospital has ${availableUnits} units in inventory.` : 'Searching for donors...'}`,
        request_id: request.id,
      });
    }
  }

  if (notifs.length > 0) {
    const { error: errN } = await supabase.from('notifications').insert(notifs);
    if (errN) {
      console.warn('Notification insert error:', errN);
    }
  }

  // Clear relevant caches
  clearCache('/api/requests');
  clearCache('/api/inventory');
  if (patient_id) clearCache(`/api/requests?patient_id=${patient_id}`);

  res.status(201).json({
    request: { ...request, status: needsDonors ? 'pending' : 'fulfilled' },
    matchedDonors: donors,
    notificationCount: notifs.length,
    inventoryAvailable: availableUnits,
    fulfilledFromInventory: !needsDonors,
  });
});

// PATCH /api/requests/:id/status - Update request status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, units_fulfilled, donor_id } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const updates = { status: String(status).trim() };
  if (units_fulfilled != null) updates.units_fulfilled = Number(units_fulfilled);
  if (donor_id) updates.donor_id = Number(donor_id);
  if (status === 'fulfilled') {
    updates.fulfilled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('blood_requests')
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
