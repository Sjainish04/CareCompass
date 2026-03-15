import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// DB columns: id, user_id, specialty, provider_name, urgency, notes, status, created_at

// GET /api/referrals
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Map to frontend shape
    const result = (referrals || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      specialty: r.specialty,
      provider_name: r.provider_name || '',
      urgency: r.urgency,
      notes: r.notes,
      status: r.status,
      created_at: r.created_at,
      care_steps: [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/referrals
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { specialty, provider_name, urgency = 'routine', notes } = req.body;

    const { data: referral, error } = await supabaseAdmin
      .from('referrals')
      .insert({
        user_id: req.user.id,
        specialty,
        provider_name: provider_name || '',
        urgency,
        notes: notes || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(referral);
  } catch (err) { next(err); }
});

export default router;
