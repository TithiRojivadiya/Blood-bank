const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// GET /api/hospitals – list hospitals (for Request form and matching) - Cached
router.get('/', cacheMiddleware(300000), async (req, res) => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, city, contact_person, phone')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
