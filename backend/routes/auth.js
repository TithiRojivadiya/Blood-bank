const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

const ROLES = { DONOR: 'donors', PATIENT: 'patients', HOSPITAL: 'hospitals', ADMIN: 'admins' };

// POST /api/auth/login – role, email, password -> { user, recipient_key }
router.post('/login', async (req, res) => {
  const { role, email, password } = req.body;
  if (!role || !email || !password) {
    return res.status(400).json({ error: 'role, email, password required' });
  }
  const table = ROLES[String(role).toUpperCase()];
  if (!table) return res.status(400).json({ error: 'Invalid role' });

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });

  const recipient = table === 'donors' ? 'donor' : table === 'patients' ? 'patient' : table === 'hospitals' ? 'hospital' : 'admin';
  res.json({ user: data, recipient_key: `${recipient}_${data.id}` });
});

// POST /api/auth/signup – role + role-specific fields; donor/hospital: latitude, longitude
router.post('/signup', async (req, res) => {
  const { role, ...fields } = req.body;
  const r = String(role || '').toUpperCase();
  const table = ROLES[r];
  if (!table) return res.status(400).json({ error: 'Invalid role' });

  let row = {};
  if (r === 'DONOR') {
    row = {
      full_name: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      password: fields.password,
      blood_group: fields.bloodGroup,
      city: fields.city,
      age: fields.age ? Number(fields.age) : null,
      last_donation_date: fields.lastDonation || null,
      is_available: fields.availability !== false,
      latitude: fields.latitude != null ? Number(fields.latitude) : null,
      longitude: fields.longitude != null ? Number(fields.longitude) : null,
    };
  } else if (r === 'PATIENT') {
    row = { full_name: fields.fullName, email: fields.email, phone: fields.phone, password: fields.password, city: fields.city };
  } else if (r === 'HOSPITAL') {
    row = {
      name: fields.hospitalName,
      email: fields.email,
      phone: fields.phone,
      password: fields.password,
      city: fields.city,
      reg_id: fields.regId || null,
      contact_person: fields.contactPerson,
      latitude: fields.latitude != null ? Number(fields.latitude) : null,
      longitude: fields.longitude != null ? Number(fields.longitude) : null,
    };
  } else if (r === 'ADMIN') {
    row = { name: fields.adminName, email: fields.email, password: fields.password };
  }

  const { data, error } = await supabase.from(table).insert(row).select('id, email').single();
  if (error) return res.status(500).json({ error: error.message });

  const recipient = table === 'donors' ? 'donor' : table === 'patients' ? 'patient' : table === 'hospitals' ? 'hospital' : 'admin';
  res.status(201).json({ user: { id: data.id, email: data.email }, recipient_key: `${recipient}_${data.id}` });
});

module.exports = router;
