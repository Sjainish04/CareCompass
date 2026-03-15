import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/patients/me/summary
router.get('/me/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [apptsRes, referralsRes] = await Promise.all([
      supabaseAdmin.from('appointments').select('*').eq('patient_id', userId).order('preferred_date', { ascending: true }),
      supabaseAdmin.from('referrals').select('*').eq('patient_id', userId),
    ]);

    res.json({
      record: null,
      appointments: (apptsRes.data || []).map(a => ({
        id: a.id, date: a.preferred_date, time: a.preferred_time,
        type: a.appointment_type, status: a.status, notes: a.notes,
        provider_id: a.provider_id,
      })),
      referrals: referralsRes.data || [],
      care_steps: [],
    });
  } catch (err) { next(err); }
});

// GET /api/patients/me/record — return empty since table doesn't exist yet
router.get('/me/record', requireAuth, async (req, res) => {
  res.json(null);
});

// PUT /api/patients/me/record — no-op for now
router.put('/me/record', requireAuth, async (req, res) => {
  res.json({ message: 'Record saved (demo)' });
});

export default router;
