const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();
const ROLES = { DONOR: 'donors', PATIENT: 'patients', HOSPITAL: 'hospitals', ADMIN: 'admins' };

// GET /api/profile?role=DONOR&id=1 – fetch profile (excludes password)
// GET /api/profile?role=DONOR – fetch all profiles for role (for Admin)
router.get('/', async (req, res) => {
  const { role, id } = req.query;
  if (!role) return res.status(400).json({ error: 'role required' });
  const table = ROLES[String(role).toUpperCase()];
  if (!table) return res.status(400).json({ error: 'Invalid role' });

  // If id provided, return single profile
  if (id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', Number(id))
      .single();

    if (error || !data) return res.status(404).json({ error: 'Profile not found' });

    const { password, ...profile } = data;
    return res.json(profile);
  }

  // If no id, return all profiles for that role (for Admin)
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const profiles = (data || []).map(({ password, ...profile }) => profile);
  res.json(profiles);
});

// PATCH /api/profile – update profile (body: role, id, + updatable fields)
router.patch('/', async (req, res) => {
  const { role, id, ...fields } = req.body;
  if (!role || !id) return res.status(400).json({ error: 'role and id required' });
  const r = String(role).toUpperCase();
  const table = ROLES[r];
  if (!table) return res.status(400).json({ error: 'Invalid role' });

  let updates = {};
  if (r === 'DONOR') {
    if (fields.full_name != null) updates.full_name = fields.full_name;
    if (fields.phone != null) updates.phone = fields.phone;
    if (fields.city != null) updates.city = fields.city;
    if (fields.age != null) updates.age = Number(fields.age);
    if (fields.last_donation_date !== undefined) updates.last_donation_date = fields.last_donation_date || null;
    if (fields.is_available !== undefined) updates.is_available = !!fields.is_available;
    if (fields.latitude !== undefined) updates.latitude = fields.latitude == null ? null : Number(fields.latitude);
    if (fields.longitude !== undefined) updates.longitude = fields.longitude == null ? null : Number(fields.longitude);
    if (fields.blood_group != null) updates.blood_group = fields.blood_group;
  } else if (r === 'PATIENT') {
    if (fields.full_name != null) updates.full_name = fields.full_name;
    if (fields.phone != null) updates.phone = fields.phone;
    if (fields.city != null) updates.city = fields.city;
  } else if (r === 'HOSPITAL') {
    if (fields.name != null) updates.name = fields.name;
    if (fields.phone != null) updates.phone = fields.phone;
    if (fields.city != null) updates.city = fields.city;
    if (fields.reg_id !== undefined) updates.reg_id = fields.reg_id || null;
    if (fields.contact_person != null) updates.contact_person = fields.contact_person;
    if (fields.latitude !== undefined) updates.latitude = fields.latitude == null ? null : Number(fields.latitude);
    if (fields.longitude !== undefined) updates.longitude = fields.longitude == null ? null : Number(fields.longitude);
  } else if (r === 'ADMIN') {
    if (fields.name != null) updates.name = fields.name;
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  const { password, ...profile } = data;
  res.json(profile);
});

module.exports = router;
