const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/match-donors?hospital_id=1&blood_group=O+
// Smart Matching: donors within 5km (PostGIS), matching blood group, available
router.get('/donors', async (req, res) => {
  const { hospital_id, blood_group } = req.query;
  if (!hospital_id || !blood_group) {
    return res.status(400).json({ error: 'hospital_id and blood_group are required' });
  }

  const { data, error } = await supabase.rpc('match_donors_within_5km', {
    p_hospital_id: Number(hospital_id),
    p_blood_group: String(blood_group).trim(),
  });

  if (error) return res.status(500).json({ error: error.message });

  // Optional: filter by eligibility (e.g. last_donation 56+ days ago)
  const eligible = (data || []).map((d) => ({
    ...d,
    eligible: isEligibleByLastDonation(d.last_donation_date),
  }));

  res.json(eligible);
});

// Whole blood: typically 56 days between donations (may vary by region)
function isEligibleByLastDonation(lastDonation) {
  if (!lastDonation) return true;
  const days = (Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 56;
}

module.exports = router;
