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

  const needsDonors = !fulfillingHospital;
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
    status: needsDonors ? 'pending' : 'fulfilled',
    units_fulfilled: needsDonors ? 0 : uReq,
    fulfilled_at: needsDonors ? null : new Date().toISOString(),
  };

  const { data: request, error: errReq } = await supabase
    .from('blood_requests')
    .insert(insertPayload)
    .select('id, hospital_id, blood_group, urgency, created_at, status')
    .single();

  if (errReq) return res.status(500).json({ error: errReq.message });

  const donors = [];
  const notifs = [];

  if (!needsDonors) {
    // 4a) Fulfill from inventory
    await supabase
      .from('inventory')
      .update({ units_available: availableUnits - uReq })
      .eq('hospital_id', fulfillingHospital.id)
      .eq('blood_group', bg)
      .eq('component', comp);

    notifs.push({
      recipient_key: `hospital_${fulfillingHospital.id}`,
      title: '✅ Request Fulfilled from Inventory',
      body: `${bg} ${comp} request fulfilled from available inventory.`,
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
    // 4b) Match donors: by point (5km) if coords, else by city
    let matchedDonors = [];
    if (hasCoords) {
      const { data: m } = await supabase.rpc('match_donors_within_5km_of_point', {
        p_lat: lat,
        p_lng: lng,
        p_blood_group: bg,
      });
      matchedDonors = m || [];
    } else {
      const { data: m } = await supabase.rpc('match_donors_in_city', { p_city: city, p_blood_group: bg });
      matchedDonors = m || [];
    }
    donors.push(...matchedDonors);

    const hospitalName = assignedHospital.name || 'Nearby Hospital';
    for (const d of donors) {
      notifs.push({
        recipient_key: `donor_${d.id}`,
        title: urg === 'Emergency' ? '🚨 URGENT: Emergency Blood Request' : '🩸 Blood Request',
        body: `${bg} ${comp} needed - ${reason}. Hospital: ${hospitalName}. Please respond Available or Unavailable.`,
        request_id: request.id,
      });
      const { error: respErr } = await supabase
        .from('donor_responses')
        .insert({ request_id: request.id, donor_id: d.id, response: 'pending' });
      if (respErr) console.warn('Donor response insert error:', respErr);
    }

    const invAtAssigned = (await supabase
      .from('inventory')
      .select('units_available')
      .eq('hospital_id', assignedHospital.id)
      .eq('blood_group', bg)
      .eq('component', comp)
      .single()).data?.units_available || 0;

    notifs.push({
      recipient_key: `hospital_${assignedHospital.id}`,
      title: 'New blood request',
      body: `${bg} ${comp}, ${uReq} unit(s) needed. ${donors.length} donor(s) notified. ${invAtAssigned > 0 ? `Inventory: ${invAtAssigned} units.` : 'No inventory.'}`,
      request_id: request.id,
    });
    if (patient_id) {
      notifs.push({
        recipient_key: `patient_${patient_id}`,
        title: 'Request received',
        body: `Hospitals checked; ${donors.length} donor(s) notified. ${invAtAssigned > 0 ? `Hospital has ${invAtAssigned} units.` : 'Searching for donors.'}`,
        request_id: request.id,
      });
    }
  }

  if (notifs.length > 0) {
    await supabase.from('notifications').insert(notifs).then(({ error: errN }) => {
      if (errN) console.warn('Notification insert error:', errN);
    });
  }

  clearCache('/api/requests');
  clearCache('/api/inventory');
  if (patient_id) clearCache(`/api/requests?patient_id=${patient_id}`);

  res.status(201).json({
    request: { ...request, status: needsDonors ? 'pending' : 'fulfilled' },
    matchedDonors: donors,
    notificationCount: notifs.length,
    inventoryAvailable: fulfillingHospital ? availableUnits : 0,
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
