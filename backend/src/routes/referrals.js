import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/referrals
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('patient_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Map to frontend shape
    const result = (referrals || []).map(r => ({
      id: r.id,
      user_id: r.patient_id,
      specialty: r.specialty,
      provider_name: r.referred_to || r.provider_id,
      urgency: r.urgency,
      notes: r.notes || r.referral_reason,
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
        patient_id: req.user.id,
        specialty,
        referred_to: provider_name,
        urgency,
        referral_reason: notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(referral);
  } catch (err) { next(err); }
});

export default router;
