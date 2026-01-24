const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// POST /api/requests – create request + Instant Dispatch (notify donors in 5km + hospital + patient)
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

  // 1) Insert blood request (hospital_id is bigint)
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
      status: 'pending',
    })
    .select('id, hospital_id, blood_group, urgency, created_at')
    .single();

  if (errReq) return res.status(500).json({ error: errReq.message });

  // 2) Smart Matching: donors within 5km (p_hospital_id is bigint)
  const { data: matchedDonors } = await supabase.rpc('match_donors_within_5km', {
    p_hospital_id: Number(hospital_id),
    p_blood_group: String(blood_group).trim(),
  });

  const donors = matchedDonors || [];
  const notifs = [];

  // 3) Notify each matched donor (Real-time: inserts into notifications; Supabase Realtime pushes to subscribers)
  for (const d of donors) {
    notifs.push({
      recipient_key: `donor_${d.id}`,
      title: '🩸 Emergency blood request',
      body: `${blood_group} needed - ${reason}. Please respond if you can help.`,
      request_id: request.id,
    });
  }

  // 4) Notify hospital
  notifs.push({
    recipient_key: `hospital_${hospital_id}`,
    title: 'New blood request',
    body: `${blood_group}, ${component}, ${units_required} unit(s). ${reason}`,
    request_id: request.id,
  });

  // 5) Notify patient if known
  if (patient_id) {
    notifs.push({
      recipient_key: `patient_${patient_id}`,
      title: 'Request received',
      body: `We’re contacting ${donors.length} donor(s) within 5km. You’ll be notified when matched.`,
      request_id: request.id,
    });
  }

  if (notifs.length > 0) {
    const { error: errN } = await supabase.from('notifications').insert(notifs);
    if (errN) {
      // still return 201; request was created
      console.warn('Notification insert error:', errN);
    }
  }

  res.status(201).json({
    request,
    matchedDonors: donors,
    notificationCount: notifs.length,
  });
});

module.exports = router;
