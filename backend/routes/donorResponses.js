const express = require('express');
const supabase = require('../lib/supabase');

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

// POST /api/donor-responses - Create or update donor response
router.post('/', async (req, res) => {
  const { request_id, donor_id, response, notes } = req.body;

  if (!request_id || !donor_id || !response) {
    return res.status(400).json({ error: 'request_id, donor_id, and response are required' });
  }

  if (!['accepted', 'declined', 'pending'].includes(response)) {
    return res.status(400).json({ error: 'response must be accepted, declined, or pending' });
  }

  const { data, error } = await supabase
    .from('donor_responses')
    .upsert({
      request_id: Number(request_id),
      donor_id: Number(donor_id),
      response: String(response).trim(),
      notes: notes || null,
    }, {
      onConflict: 'request_id,donor_id'
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

  // If donor accepted, notify hospital and patient
  if (response === 'accepted') {
    const rid = Number(request_id);
    const did = Number(donor_id);

    // Fetch request details
    const { data: request } = await supabase
      .from('blood_requests')
      .select('id, hospital_id, patient_id, donor_id, blood_group, component, units_required, units_fulfilled, status, request_city')
      .eq('id', rid)
      .single();

    if (request) {
      const currentFulfilled = Number(request.units_fulfilled || 0);
      const required = Number(request.units_required || 0);
      const nextFulfilled = Math.min(required, currentFulfilled + 1);
      const nextStatus = nextFulfilled >= required ? 'fulfilled' : 'partial';

      // Update request status to partial/fulfilled on donor acceptance
      const updates = {
        units_fulfilled: nextFulfilled,
        status: nextStatus,
      };
      if (nextStatus === 'fulfilled') {
        updates.fulfilled_at = new Date().toISOString();
      }
      // Track first donor (optional)
      if (!request.donor_id) {
        updates.donor_id = did;
      }
      await supabase.from('blood_requests').update(updates).eq('id', rid);

      // Fetch hospital details for donor instructions
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('id, name, city, phone, contact_person')
        .eq('id', Number(request.hospital_id))
        .single();

      const hospitalDetails = [
        `🏥 Hospital: ${hospital?.name || 'Hospital'}`,
        `📍 City: ${hospital?.city || request.request_city || 'N/A'}`,
        hospital?.phone ? `📞 Phone: ${hospital.phone}` : '',
        hospital?.contact_person ? `👤 Contact: ${hospital.contact_person}` : '',
      ].filter(Boolean).join('\n');

      const notifications = [
        {
          recipient_key: `donor_${did}`,
          title: '✅ Donation Accepted - Where to Donate',
          body: `Thank you for helping. Please donate at:\n\n${hospitalDetails}\n\nRequest: ${request.blood_group} ${request.component} • #${rid}`,
          request_id: rid,
        },
        {
          recipient_key: `hospital_${request.hospital_id}`,
          title: '🩸 Donor Accepted (Partial)',
          body: `A donor accepted for ${request.blood_group} ${request.component}. Request #${rid} is now ${nextStatus.toUpperCase()} (${nextFulfilled}/${required}).`,
          request_id: rid,
        },
      ];

      if (request.patient_id) {
        notifications.push({
          recipient_key: `patient_${request.patient_id}`,
          title: nextStatus === 'fulfilled' ? '✅ Request Fulfilled' : '🩸 Request Partially Fulfilled',
          body: nextStatus === 'fulfilled'
            ? `Your request is now fulfilled. Collect from ${hospital?.name || 'the hospital'} (${hospital?.city || ''}).`
            : `A donor accepted your request. Status updated to PARTIAL (${nextFulfilled}/${required}). Hospital: ${hospital?.name || 'the hospital'}.`,
          request_id: rid,
        });
      }

      await supabase.from('notifications').insert(notifications);
      await notifyAdmins({
        title: nextStatus === 'fulfilled' ? 'Request fulfilled (donor accepted)' : 'Request updated to partial (donor accepted)',
        body: `Request #${rid} is ${nextStatus.toUpperCase()} after donor ${did} accepted.`,
        request_id: rid,
      });
    }
  }

  res.json(data);
});

// GET /api/donor-responses/request/:requestId - Get all responses for a request
router.get('/request/:requestId', async (req, res) => {
  const { requestId } = req.params;

  const { data, error } = await supabase
    .from('donor_responses')
    .select(`
      *,
      donors:donor_id (id, full_name, email, phone, blood_group, city)
    `)
    .eq('request_id', Number(requestId))
    .order('created_at', { ascending: false });

  if (error) {
    if (error.message && error.message.includes('schema cache')) {
      return res.status(500).json({ 
        error: 'Database schema cache needs to be refreshed. Please run "NOTIFY pgrst, \'reload schema\';" in Supabase SQL Editor.' 
      });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data || []);
});

// GET /api/donor-responses/donor/:donorId - Get all responses by a donor
router.get('/donor/:donorId', async (req, res) => {
  const { donorId } = req.params;

  const { data, error } = await supabase
    .from('donor_responses')
    .select(`
      *,
      blood_requests:request_id (
        id, blood_group, component, units_required, urgency, status, 
        hospitals:hospital_id (name, city)
      )
    `)
    .eq('donor_id', Number(donorId))
    .order('created_at', { ascending: false });

  if (error) {
    if (error.message && error.message.includes('schema cache')) {
      return res.status(500).json({ 
        error: 'Database schema cache needs to be refreshed. Please run "NOTIFY pgrst, \'reload schema\';" in Supabase SQL Editor.' 
      });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data || []);
});

module.exports = router;
