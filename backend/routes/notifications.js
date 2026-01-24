const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// GET /api/notifications/:recipientKey – list for donor_5, patient_3, hospital_2, admin_0
// Cached for 10 seconds (notifications need to be relatively fresh)
router.get('/:recipientKey', cacheMiddleware(10000), async (req, res) => {
  const { recipientKey } = req.params;
  const { limit, offset } = req.pagination || { limit: 50, offset: 0 };
  
  const { data, error, count } = await supabase
    .from('notifications')
    .select('id, title, body, request_id, read_at, created_at', { count: 'exact' })
    .eq('recipient_key', recipientKey)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  
  if (res.paginated) {
    return res.paginated(data || [], count || 0);
  }
  
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
