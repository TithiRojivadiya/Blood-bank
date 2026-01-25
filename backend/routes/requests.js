const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

const router = express.Router();

async function notifyAdmins({ title, body, request_id }) {
  try {
    const { data: admins, error } = await supabase.from('admins').select('id');
    if (error || !admins || admins.length === 0) return;
    const rows = admins.map((a) => ({
      recipient_key: `admin_${a.id}`,
      title,
      body: body || null,
      request_id: request_id ? Number(request_id) : null,
    }));
    await supabase.from('notifications').insert(rows);
  } catch (e) {
    console.warn('Admin notify failed:', e?.message || e);
  }
}

async function notifyRecipients(rows) {
  const filtered = (rows || []).filter((r) => r && r.recipient_key && r.title);
  if (filtered.length === 0) return;
  const { error } = await supabase.from('notifications').insert(filtered);
  if (error) console.warn('Notification insert error:', error);
}

async function dispatchDonorsInCity({ requestId, requestCity, bloodGroup, component, urgency, reason, hospitalId, hospitalName }) {
  const { data: matched } = await supabase.rpc('match_donors_in_city', {
    p_city: String(requestCity || '').trim(),
    p_blood_group: String(bloodGroup || '').trim(),
  });
  const donors = matched || [];

  // Avoid duplicate donor_responses inserts if dispatch already happened
  const { count: existingCount } = await supabase
    .from('donor_responses')
    .select('id', { count: 'exact', head: true })
    .eq('request_id', Number(requestId));

  const shouldInsertResponses = !existingCount || existingCount === 0;

  const notifs = [];
  if (shouldInsertResponses) {
    for (const d of donors) {
      notifs.push({
        recipient_key: `donor_${d.id}`,
        title: urgency === 'Emergency' ? '🚨 URGENT: Blood Needed (Same City)' : '🩸 Blood Needed (Same City)',
        body: `${bloodGroup} ${component} needed - ${reason}. Please click Donate if you can help. Hospital: ${hospitalName || 'Hospital'}.`,
        request_id: Number(requestId),
      });
    }
  }

  if (shouldInsertResponses && donors.length > 0) {
    const inserts = donors.map((d) => ({ request_id: Number(requestId), donor_id: d.id, response: 'pending' }));
    const { error } = await supabase.from('donor_responses').insert(inserts);
    if (error) console.warn('Donor responses bulk insert error:', error);
  }

  await notifyRecipients(notifs);

  await notifyRecipients([
    {
      recipient_key: `hospital_${hospitalId}`,
      title: 'New blood request (Donors notified)',
      body: `${bloodGroup} ${component}, request needs ${donors.length} donor(s) in city ${requestCity}.`,
      request_id: Number(requestId),
    },
  ]);

  await notifyAdmins({
    title: 'New blood request created',
    body: `${bloodGroup} ${component} request created in ${requestCity}. Donors notified: ${donors.length}.`,
    request_id: Number(requestId),
  });

  return donors;
}

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

// GET /api/requests/suggest-hospitals - Suggest hospitals with sufficient blood
// Query: request_latitude?, request_longitude?, request_city, blood_group, component, units_required
router.get('/suggest-hospitals', async (req, res) => {
  const {
    request_latitude,
    request_longitude,
    request_city,
    blood_group,
    component,
    units_required,
  } = req.query;

  if (!blood_group || !component || !units_required) {
    return res.status(400).json({
      error: 'blood_group, component, and units_required are required',
    });
  }

  const city = request_city ? String(request_city).trim() : null;
  const lat = request_latitude != null ? Number(request_latitude) : null;
  const lng = request_longitude != null ? Number(request_longitude) : null;
  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const uReq = Number(units_required);
  const bg = String(blood_group).trim();
  const comp = String(component).trim();

  if (isNaN(uReq) || uReq <= 0) {
    return res.status(400).json({ error: 'units_required must be a positive number' });
  }

  // Get hospital list: within 10km if coords, else fallback to city
  let hospitalList = [];
  if (hasCoords) {
    const { data: within10 } = await supabase.rpc('hospitals_within_10km', { p_lat: lat, p_lng: lng });
    hospitalList = within10 || [];
    if (hospitalList.length === 0 && city) {
      const { data: inCity } = await supabase.rpc('hospitals_in_city', { p_city: city });
      hospitalList = inCity || [];
    }
  } else if (city) {
    const { data: inCity } = await supabase.rpc('hospitals_in_city', { p_city: city });
    hospitalList = inCity || [];
  }

  if (hospitalList.length === 0) {
    return res.json({ suggestions: [], message: 'No hospitals found in the specified location' });
  }

  // Check inventory for each hospital and return suggestions with availability
  const suggestions = [];
  for (const h of hospitalList) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('units_available')
      .eq('hospital_id', h.id)
      .eq('blood_group', bg)
      .eq('component', comp)
      .single();
    
    const available = inv?.units_available || 0;
    const hasEnough = available >= uReq;
    
    suggestions.push({
      ...h,
      units_available: available,
      has_sufficient: hasEnough,
      status: hasEnough ? 'available' : available > 0 ? 'insufficient' : 'unavailable',
    });
  }

  // Sort: sufficient first, then by distance/name
  suggestions.sort((a, b) => {
    if (a.has_sufficient !== b.has_sufficient) {
      return b.has_sufficient ? 1 : -1;
    }
    if (a.distance_meters != null && b.distance_meters != null) {
      return a.distance_meters - b.distance_meters;
    }
    return a.name.localeCompare(b.name);
  });

  res.json({ suggestions, total: suggestions.length });
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

// POST /api/requests – Location-based: 10km hospitals or city, inventory first, then donors
// Body: { request_latitude?, request_longitude?, request_city, blood_group, component, units_required, urgency, required_by?, reason, patient_id? }
// hospital_id is chosen by backend: 10km then city; inventory checked first; donors only if no hospital has enough.
router.post('/', async (req, res) => {
  const {
    request_latitude,
    request_longitude,
    request_city,
    blood_group,
    component,
    units_required,
    urgency,
    required_by,
    reason,
    patient_id,
  } = req.body;

  if (!blood_group || !component || !units_required || !urgency || !reason) {
    return res.status(400).json({
      error: 'blood_group, component, units_required, urgency, reason are required',
    });
  }
  const city = request_city ? String(request_city).trim() : null;
  if (!city) {
    return res.status(400).json({ error: 'request_city is required' });
  }

  const lat = request_latitude != null ? Number(request_latitude) : null;
  const lng = request_longitude != null ? Number(request_longitude) : null;
  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const uReq = Number(units_required);
  const bg = String(blood_group).trim();
  const comp = String(component).trim();
  const urg = String(urgency).trim();

  // 1) Get hospital list: within 10km if coords, else fallback to city; if 10km empty, use city
  let hospitalList = [];
  if (hasCoords) {
    const { data: within10 } = await supabase.rpc('hospitals_within_10km', { p_lat: lat, p_lng: lng });
    hospitalList = within10 || [];
    if (hospitalList.length === 0) {
      const { data: inCity } = await supabase.rpc('hospitals_in_city', { p_city: city });
      hospitalList = inCity || [];
    }
  } else {
    const { data: inCity } = await supabase.rpc('hospitals_in_city', { p_city: city });
    hospitalList = inCity || [];
  }

  if (hospitalList.length === 0) {
    return res.status(400).json({
      error: 'No hospital found within 10 km or in your city. Please try a different location or city.',
    });
  }

  // 2) Check each hospital's inventory; if any has enough, fulfill from that hospital and stop
  let fulfillingHospital = null;
  let availableUnits = 0;
  for (const h of hospitalList) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('units_available')
      .eq('hospital_id', h.id)
      .eq('blood_group', bg)
      .eq('component', comp)
      .single();
    const u = inv?.units_available || 0;
    if (u >= uReq) {
      fulfillingHospital = h;
      availableUnits = u;
      break;
    }
  }

  const hospitalHasEnough = !!fulfillingHospital;
  const needsDonors = !hospitalHasEnough;
  const assignedHospital = fulfillingHospital || hospitalList[0]; // pick first (or closest from 10km) when going to donors

  // 3) Insert blood request
  const insertPayload = {
    patient_id: patient_id || null,
    hospital_id: assignedHospital.id,
    blood_group: bg,
    component: comp,
    units_required: uReq,
    urgency: urg,
    required_by: required_by || null,
    reason: String(reason).trim(),
    request_latitude: hasCoords ? lat : null,
    request_longitude: hasCoords ? lng : null,
    request_city: city,
    // Always start pending. If a hospital has enough inventory, hospital must approve.
    status: 'pending',
    units_fulfilled: 0,
    fulfilled_at: null,
  };

  const { data: request, error: errReq } = await supabase
    .from('blood_requests')
    .insert(insertPayload)
    .select('id, hospital_id, blood_group, urgency, created_at, status')
    .single();

  if (errReq) return res.status(500).json({ error: errReq.message });

  const donors = [];
  const notifs = [];

  if (hospitalHasEnough) {
    // Hospital has sufficient inventory, but must approve before patient is notified as fulfilled.
    notifs.push({
      recipient_key: `hospital_${fulfillingHospital.id}`,
      title: '🩸 Approval Needed: Blood Available',
      body: `${bg} ${comp}, ${uReq} unit(s) requested. Inventory is available (${availableUnits} units). Please approve to fulfill.`,
      request_id: request.id,
    });
    if (patient_id) {
      notifs.push({
        recipient_key: `patient_${patient_id}`,
        title: 'Request sent to hospital',
        body: `A nearby hospital has blood available. Waiting for hospital approval.`,
        request_id: request.id,
      });
    }
    await notifyAdmins({
      title: 'New request awaiting hospital approval',
      body: `${bg} ${comp} request created in ${city}. Hospital ${fulfillingHospital.name || fulfillingHospital.id} has enough inventory; approval required.`,
      request_id: request.id,
    });
    await notifyRecipients(notifs);
  } else {
    // No hospital has enough -> dispatch to donors in the same city
    const hospitalName = assignedHospital.name || 'Nearby Hospital';
    const matchedDonors = await dispatchDonorsInCity({
      requestId: request.id,
      requestCity: city,
      bloodGroup: bg,
      component: comp,
      urgency: urg,
      reason: String(reason).trim(),
      hospitalId: assignedHospital.id,
      hospitalName,
    });
    donors.push(...matchedDonors);

    if (patient_id) {
      await notifyRecipients([
        {
          recipient_key: `patient_${patient_id}`,
          title: 'Request received (Donors notified)',
          body: `No hospital had enough inventory. ${donors.length} donor(s) in your city have been notified.`,
          request_id: request.id,
        },
      ]);
    }
  }

  clearCache('/api/requests');
  clearCache('/api/inventory');
  if (patient_id) clearCache(`/api/requests?patient_id=${patient_id}`);

  res.status(201).json({
    request: { ...request, status: 'pending' },
    matchedDonors: donors,
    notificationCount: (donors.length > 0 ? donors.length : notifs.length),
    inventoryAvailable: hospitalHasEnough ? availableUnits : 0,
    awaitingHospitalApproval: hospitalHasEnough,
    dispatchedToDonors: needsDonors,
  });
});

// POST /api/requests/:id/approve - Hospital approves fulfillment from inventory
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const hospitalIdFromBody = req.body?.hospital_id != null ? Number(req.body.hospital_id) : null;

  const { data: reqRow, error: reqErr } = await supabase
    .from('blood_requests')
    .select('id, status, hospital_id, patient_id, blood_group, component, units_required, units_fulfilled, request_city')
    .eq('id', Number(id))
    .single();

  if (reqErr) return res.status(500).json({ error: reqErr.message });
  if (!reqRow) return res.status(404).json({ error: 'Request not found' });
  if (hospitalIdFromBody && Number(reqRow.hospital_id) !== hospitalIdFromBody) {
    return res.status(403).json({ error: 'This request is not assigned to your hospital' });
  }

  const remaining = Math.max(0, Number(reqRow.units_required || 0) - Number(reqRow.units_fulfilled || 0));
  if (remaining <= 0) {
    return res.json({ ok: true, message: 'Request already fully fulfilled', request: reqRow });
  }

  const { data: inv, error: invErr } = await supabase
    .from('inventory')
    .select('units_available')
    .eq('hospital_id', Number(reqRow.hospital_id))
    .eq('blood_group', String(reqRow.blood_group).trim())
    .eq('component', String(reqRow.component).trim())
    .single();
  if (invErr) return res.status(500).json({ error: invErr.message });
  const available = inv?.units_available || 0;

  if (available < remaining) {
    // Not enough anymore: keep pending and dispatch donors in same city as fallback
    const { data: hosp } = await supabase
      .from('hospitals')
      .select('id, name, city')
      .eq('id', Number(reqRow.hospital_id))
      .single();
    const matchedDonors = await dispatchDonorsInCity({
      requestId: reqRow.id,
      requestCity: reqRow.request_city || hosp?.city,
      bloodGroup: reqRow.blood_group,
      component: reqRow.component,
      urgency: 'Urgent',
      reason: 'Inventory insufficient after approval attempt',
      hospitalId: reqRow.hospital_id,
      hospitalName: hosp?.name,
    });

    if (reqRow.patient_id) {
      await notifyRecipients([
        {
          recipient_key: `patient_${reqRow.patient_id}`,
          title: 'Hospital inventory insufficient',
          body: `Hospital does not have enough inventory right now. ${matchedDonors.length} donor(s) in your city have been notified.`,
          request_id: reqRow.id,
        },
      ]);
    }
    return res.status(409).json({ error: 'Not enough inventory. Donors have been notified.', donorsNotified: matchedDonors.length });
  }

  // Approve + fulfill
  const { data: updated, error: upErr } = await supabase
    .from('blood_requests')
    .update({
      status: 'fulfilled',
      units_fulfilled: Number(reqRow.units_required),
      fulfilled_at: new Date().toISOString(),
    })
    .eq('id', Number(reqRow.id))
    .select()
    .single();
  if (upErr) return res.status(500).json({ error: upErr.message });

  // Notify patient only after approval
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('id, name, city, phone, contact_person')
    .eq('id', Number(reqRow.hospital_id))
    .single();

  const msgs = [
    {
      recipient_key: `hospital_${reqRow.hospital_id}`,
      title: '✅ Approved & Fulfilled',
      body: `Request #${reqRow.id} marked as fulfilled. Inventory will be decremented automatically.`,
      request_id: reqRow.id,
    },
  ];
  if (reqRow.patient_id) {
    msgs.push({
      recipient_key: `patient_${reqRow.patient_id}`,
      title: '✅ Request Approved',
      body: `Your request is fulfilled. Collect from ${hospital?.name || 'the hospital'} (${hospital?.city || ''}).`,
      request_id: reqRow.id,
    });
  }
  await notifyRecipients(msgs);
  await notifyAdmins({
    title: 'Request fulfilled (hospital approved)',
    body: `Request #${reqRow.id} fulfilled by hospital ${hospital?.name || reqRow.hospital_id}.`,
    request_id: reqRow.id,
  });

  clearCache('/api/requests');
  clearCache('/api/inventory');

  res.json({ ok: true, request: updated });
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
