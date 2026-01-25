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

// GET /api/hospitals/near?lat=...&lng=...&max_distance=... - Find hospitals near a point
router.get('/near', async (req, res) => {
  const { lat, lng, max_distance } = req.query;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const maxDist = Number(max_distance) || 50000;

  if (!latNum || !lngNum || isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: 'lat and lng are required and must be numbers' });
  }

  const { data, error } = await supabase.rpc('hospitals_near_point', {
    p_lat: latNum,
    p_lng: lngNum,
    p_max_distance_meters: maxDist,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
