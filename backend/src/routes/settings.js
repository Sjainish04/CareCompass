import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/settings/me — read user preferences from profile
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('preferred_language')
      .eq('id', req.user.id)
      .single();

    res.json({
      preferredLanguage: data?.preferred_language || 'English',
      notificationChannel: 'SMS + Email',
      reminderTiming: '1 day before',
      theme: 'Dark',
    });
  } catch (err) { next(err); }
});

// POST /api/settings/me — save user preferences
router.post('/me', requireAuth, async (req, res, next) => {
  try {
    const { preferredLanguage } = req.body;

    if (preferredLanguage) {
      await supabaseAdmin
        .from('profiles')
        .update({ preferred_language: preferredLanguage })
        .eq('id', req.user.id);
    }

    res.json({ message: 'Settings saved' });
  } catch (err) { next(err); }
});

export default router;
