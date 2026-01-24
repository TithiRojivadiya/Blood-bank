const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/hospitals – list hospitals (for Request form and matching)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, city, contact_person, phone')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
