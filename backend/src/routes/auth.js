import { Router } from 'express';
import { supabaseAuth, supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'patient', preferred_language = 'English' } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Use admin API to create user with auto-confirm
    const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (adminErr) return res.status(400).json({ error: adminErr.message });

    const user = adminData.user;

    // Insert profile (matches existing schema: id, full_name, username, role)
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      full_name: full_name || email.split('@')[0],
      username: email.split('@')[0],
      role: ['patient', 'provider'].includes(role) ? role : 'patient',
    });

    // Also create a patients record (required FK for appointments)
    await supabaseAdmin.from('patients').upsert({
      id: user.id,
      preferred_language: preferred_language || 'English',
    });

    // If provider, also create a providers record (required FK for appointments.provider_id)
    if (role === 'provider') {
      await supabaseAdmin.from('providers').upsert({
        id: user.id,
        clinic_name: full_name || email.split('@')[0],
        specialty: 'General',
      });
    }

    // Now sign in to get a session token
    const { data: loginData, error: loginErr } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (loginErr) return res.status(400).json({ error: loginErr.message });

    res.status(201).json({
      user: loginData.user,
      session: loginData.session,
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { ...data.user, profile },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await supabaseAdmin.auth.admin.signOut(req.user.id);
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) { next(err); }
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const allowed = ['full_name', 'username'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
