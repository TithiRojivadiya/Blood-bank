const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

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

  if (error) return res.status(500).json({ error: error.message });

  // If donor accepted, notify hospital and patient
  if (response === 'accepted') {
    const { data: request } = await supabase
      .from('blood_requests')
      .select('hospital_id, patient_id, blood_group, component, units_required')
      .eq('id', request_id)
      .single();

    if (request) {
      const notifications = [];
      
      // Notify hospital
      notifications.push({
        recipient_key: `hospital_${request.hospital_id}`,
        title: '✅ Donor Accepted Request',
        body: `A donor has accepted your blood request for ${request.blood_group} ${request.component}.`,
        request_id: Number(request_id),
      });

      // Notify patient if exists
      if (request.patient_id) {
        notifications.push({
          recipient_key: `patient_${request.patient_id}`,
          title: '✅ Donor Found',
          body: `A donor has accepted your blood request. The hospital will contact you soon.`,
          request_id: Number(request_id),
        });
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
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

  if (error) return res.status(500).json({ error: error.message });
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

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
