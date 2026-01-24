const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/notifications/:recipientKey – list for donor_5, patient_3, hospital_2, admin_0
router.get('/:recipientKey', async (req, res) => {
  const { recipientKey } = req.params;
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, request_id, read_at, created_at')
    .eq('recipient_key', recipientKey)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// PATCH /api/notifications/:id/read – mark as read
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
