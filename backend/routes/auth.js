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
// Admin signup is disabled - admins must be created manually
router.post('/signup', async (req, res) => {
  const { role, ...fields } = req.body;
  const r = String(role || '').toUpperCase();
  const table = ROLES[r];
  if (!table) return res.status(400).json({ error: 'Invalid role' });
  
  // Block admin signup
  if (r === 'ADMIN') {
    return res.status(403).json({ error: 'Admin registration is not allowed. Please contact system administrator.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fields.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check if email already exists in any table
  const tablesToCheck = ['donors', 'patients', 'hospitals', 'admins'];
  for (const tbl of tablesToCheck) {
    const { data: existing } = await supabase
      .from(tbl)
      .select('id')
      .eq('email', fields.email)
      .single();
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please use a different email or login.' });
    }
  }

  // Validate phone number (if provided)
  if (fields.phone && !/^[6-9]\d{9}$/.test(fields.phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits starting with 6, 7, 8, or 9' });
  }

  // Validate age (if provided)
  if (fields.age) {
    const age = Number(fields.age);
    if (isNaN(age) || age <= 0 || age > 120) {
      return res.status(400).json({ error: 'Invalid age. Must be between 1 and 120' });
    }
  }

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
  }

  const { data, error } = await supabase.from(table).insert(row).select('id, email').single();
  if (error) return res.status(500).json({ error: error.message });

  const recipient = table === 'donors' ? 'donor' : table === 'patients' ? 'patient' : 'hospital';
  res.status(201).json({ user: { id: data.id, email: data.email }, recipient_key: `${recipient}_${data.id}` });
});

// GET /api/auth/google - Initiate Google OAuth login
// This redirects to Google OAuth consent screen
router.get('/google', async (req, res) => {
  const { role } = req.query;
  const r = String(role || 'DONOR').toUpperCase();
  
  // Google OAuth configuration
  // Note: Set these in your .env file:
  // GOOGLE_CLIENT_ID=your_client_id
  // GOOGLE_CLIENT_SECRET=your_client_secret
  // GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  
  if (!clientId) {
    return res.status(500).json({ 
      error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.' 
    });
  }

  const scope = 'openid email profile';
  const state = Buffer.from(JSON.stringify({ role: r })).toString('base64');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;

  res.redirect(authUrl);
});

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect(`/login?error=${encodeURIComponent('Google authentication failed')}`);
  }

  try {
    // Decode state to get role
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const role = stateData.role || 'DONOR';
    const table = ROLES[String(role).toUpperCase()];
    
    if (!table) {
      return res.redirect(`/login?error=${encodeURIComponent('Invalid role')}`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoResponse.json();

    // Check if user exists in database
    const { data: existingUser } = await supabase
      .from(table)
      .select('*')
      .eq('email', googleUser.email)
      .single();

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user with Google info
      // Note: You may want to prompt for additional required fields
      const newUserData = {
        email: googleUser.email,
        full_name: googleUser.name || googleUser.email.split('@')[0],
        password: null, // No password for OAuth users
        ...(role === 'DONOR' ? { city: '', blood_group: '', is_available: true } : {}),
        ...(role === 'PATIENT' ? { city: '' } : {}),
        ...(role === 'HOSPITAL' ? { name: googleUser.name || '', city: '', contact_person: '' } : {}),
      };

      const { data: newUser, error: insertError } = await supabase
        .from(table)
        .insert(newUserData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }
      user = newUser;
    }

    const recipient = table === 'donors' ? 'donor' : table === 'patients' ? 'patient' : table === 'hospitals' ? 'hospital' : 'admin';
    const recipientKey = `${recipient}_${user.id}`;

    // Redirect to frontend with auth data
    // In production, you'd want to use a more secure method (JWT tokens, etc.)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const authData = Buffer.from(JSON.stringify({ user, recipient_key: recipientKey, role })).toString('base64');
    res.redirect(`${frontendUrl}/auth/callback?data=${authData}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
  }
});

module.exports = router;
