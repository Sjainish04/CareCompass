import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/patients/me/summary
router.get('/me/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [apptsRes, referralsRes] = await Promise.all([
      supabaseAdmin.from('appointments').select('*').eq('user_id', userId).order('date', { ascending: true }),
      supabaseAdmin.from('referrals').select('*').eq('user_id', userId),
    ]);

    const appointments = (apptsRes.data || []).map(a => ({
      id: a.id, date: a.date, time: a.time,
      type: a.type, status: a.status, notes: a.notes,
      provider_id: a.provider_id, provider_name: a.provider_name,
    }));

    const upcoming = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
    const referrals = referralsRes.data || [];
    const pendingRefs = referrals.filter(r => r.status === 'pending');

    res.json({
      upcomingAppts: upcoming.length,
      nextApptDate: upcoming[0]?.date
        ? new Date(upcoming[0].date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
        : null,
      referralsTotal: referrals.length,
      referralsPending: pendingRefs.length,
      activeJourneys: 2,
      stepsComplete: 6,
      stepsTotal: 8,
      stepsPercent: 75,
      appointments,
      referrals,
      care_steps: [],
    });
  } catch (err) { next(err); }
});

// GET /api/patients/me/record
router.get('/me/record', requireAuth, async (req, res) => {
  res.json(null);
});

// PUT /api/patients/me/record
router.put('/me/record', requireAuth, async (req, res) => {
  res.json({ message: 'Record saved (demo)' });
});

export default router;
