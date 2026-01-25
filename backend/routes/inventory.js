const express = require('express');
const supabase = require('../lib/supabase');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

const router = express.Router();

// GET /api/inventory/:hospitalId - Get inventory for a hospital - Cached
router.get('/:hospitalId', cacheMiddleware(30000), async (req, res) => {
  const { hospitalId } = req.params;
  if (!hospitalId) {
    return res.status(400).json({ error: 'hospitalId is required' });
  }

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('hospital_id', Number(hospitalId))
    .order('blood_group', { ascending: true })
    .order('component', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/inventory/:hospitalId/summary - Get inventory summary
router.get('/:hospitalId/summary', async (req, res) => {
  const { hospitalId } = req.params;
  
  const { data, error } = await supabase
    .from('inventory')
    .select('blood_group, component, units_available, units_reserved')
    .eq('hospital_id', Number(hospitalId));

  if (error) return res.status(500).json({ error: error.message });

  // Group by blood group
  const summary = {};
  (data || []).forEach(item => {
    if (!summary[item.blood_group]) {
      summary[item.blood_group] = { total: 0, reserved: 0, byComponent: {} };
    }
    summary[item.blood_group].total += item.units_available;
    summary[item.blood_group].reserved += item.units_reserved;
    summary[item.blood_group].byComponent[item.component] = {
      available: item.units_available,
      reserved: item.units_reserved
    };
  });

  res.json(summary);
});

// POST /api/inventory - Add or update inventory
router.post('/', async (req, res) => {
  const { hospital_id, blood_group, component, units_available, units_reserved } = req.body;

  if (!hospital_id || !blood_group || !component) {
    return res.status(400).json({ error: 'hospital_id, blood_group, and component are required' });
  }

  const hospitalIdNum = Number(hospital_id);
  if (isNaN(hospitalIdNum) || hospitalIdNum <= 0) {
    return res.status(400).json({ error: 'Invalid hospital_id' });
  }

  // Validate hospital exists before inserting inventory
  const { data: hospital, error: hospitalError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', hospitalIdNum)
    .single();

  if (hospitalError || !hospital) {
    return res.status(400).json({ error: 'Hospital not found. Invalid hospital_id' });
  }

  // Validate units are real numbers
  const unitsAvail = units_available != null ? Number(units_available) : 0;
  const unitsRes = units_reserved != null ? Number(units_reserved) : 0;
  
  if (isNaN(unitsAvail) || unitsAvail < 0) {
    return res.status(400).json({ error: 'units_available must be a valid non-negative number' });
  }
  if (isNaN(unitsRes) || unitsRes < 0) {
    return res.status(400).json({ error: 'units_reserved must be a valid non-negative number' });
  }

  const { data, error } = await supabase
    .from('inventory')
    .upsert({
      hospital_id: hospitalIdNum,
      blood_group: String(blood_group).trim(),
      component: String(component).trim(),
      units_available: unitsAvail,
      units_reserved: unitsRes,
    }, {
      onConflict: 'hospital_id,blood_group,component'
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  
  // Clear inventory cache
  clearCache(`/api/inventory/${hospital_id}`);
  clearCache(`/api/inventory/${hospital_id}/summary`);
  
  res.json(data);
});

// PATCH /api/inventory/:id - Update inventory units
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { units_available, units_reserved } = req.body;

  const updates = {};
  if (units_available != null) updates.units_available = Number(units_available);
  if (units_reserved != null) updates.units_reserved = Number(units_reserved);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/inventory/adjust - Adjust inventory (add or subtract)
router.post('/adjust', async (req, res) => {
  const { hospital_id, blood_group, component, units_change, operation } = req.body;

  if (!hospital_id || !blood_group || !component || units_change == null) {
    return res.status(400).json({ error: 'hospital_id, blood_group, component, and units_change are required' });
  }

  const hospitalIdNum = Number(hospital_id);
  if (isNaN(hospitalIdNum) || hospitalIdNum <= 0) {
    return res.status(400).json({ error: 'Invalid hospital_id' });
  }

  // Validate hospital exists
  const { data: hospital, error: hospitalError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', hospitalIdNum)
    .single();

  if (hospitalError || !hospital) {
    return res.status(400).json({ error: 'Hospital not found. Invalid hospital_id' });
  }

  // Validate units_change is a real number
  const unitsChange = Number(units_change);
  if (isNaN(unitsChange)) {
    return res.status(400).json({ error: 'units_change must be a valid number' });
  }

  // Get current inventory
  const { data: current, error: fetchError } = await supabase
    .from('inventory')
    .select('units_available')
    .eq('hospital_id', hospitalIdNum)
    .eq('blood_group', String(blood_group).trim())
    .eq('component', String(component).trim())
    .single();

  let newUnits = unitsChange;
  if (current) {
    newUnits = operation === 'subtract' 
      ? Math.max(0, current.units_available - unitsChange)
      : current.units_available + unitsChange;
  }

  const { data, error } = await supabase
    .from('inventory')
    .upsert({
      hospital_id: hospitalIdNum,
      blood_group: String(blood_group).trim(),
      component: String(component).trim(),
      units_available: newUnits,
      units_reserved: current?.units_reserved || 0,
    }, {
      onConflict: 'hospital_id,blood_group,component'
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  
  // Clear inventory cache
  clearCache(`/api/inventory/${hospital_id}`);
  clearCache(`/api/inventory/${hospital_id}/summary`);
  
  res.json(data);
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', Number(id));

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
