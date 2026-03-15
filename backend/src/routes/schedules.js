import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// ── /me routes MUST come before /:providerId to avoid "me" being treated as a UUID ──

// PUT /api/schedules/me — upsert weekly schedule (array of day configs)
router.put('/me', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const days = req.body;
    if (!Array.isArray(days)) return res.status(400).json({ error: 'Expected array of day configs' });

    // Delete existing schedule for this provider
    await supabaseAdmin
      .from('provider_schedules')
      .delete()
      .eq('provider_id', req.user.id);

    // Insert new schedule
    const rows = days.map(d => ({
      provider_id: req.user.id,
      day_of_week: d.day_of_week,
      start_time: d.start_time,
      end_time: d.end_time,
      slot_duration: d.slot_duration || 30,
      is_active: d.is_active !== false,
    }));

    const { data, error } = await supabaseAdmin
      .from('provider_schedules')
      .insert(rows)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/schedules/me/blocked — list blocked dates
router.get('/me/blocked', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('provider_blocked_dates')
      .select('*')
      .eq('provider_id', req.user.id)
      .order('blocked_date', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) { next(err); }
});

// POST /api/schedules/me/block — block a date
router.post('/me/block', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const { blocked_date, reason } = req.body;
    if (!blocked_date) return res.status(400).json({ error: 'blocked_date required' });

    const { data, error } = await supabaseAdmin
      .from('provider_blocked_dates')
      .insert({ provider_id: req.user.id, blocked_date, reason: reason || null })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// DELETE /api/schedules/me/block/:id — unblock a date
router.delete('/me/block/:id', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('provider_blocked_dates')
      .delete()
      .eq('id', req.params.id)
      .eq('provider_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Date unblocked' });
  } catch (err) { next(err); }
});

// ── Public routes (no auth required) ──

// GET /api/schedules/:providerId — public weekly schedule
router.get('/:providerId', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', req.params.providerId)
      .order('day_of_week', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) { next(err); }
});

// GET /api/schedules/:providerId/slots?date=2026-03-20 — available slots for a date
router.get('/:providerId/slots', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required' });

    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay(); // 0=Sun

    // Get schedule for this day
    const { data: schedule } = await supabaseAdmin
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', req.params.providerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (!schedule) return res.json([]);

    // Check if date is blocked
    const { data: blocked } = await supabaseAdmin
      .from('provider_blocked_dates')
      .select('id')
      .eq('provider_id', req.params.providerId)
      .eq('blocked_date', date);

    if (blocked && blocked.length > 0) return res.json([]);

    // Get already-booked appointments for this date
    const { data: booked } = await supabaseAdmin
      .from('appointments')
      .select('preferred_time')
      .eq('provider_id', req.params.providerId)
      .eq('preferred_date', date)
      .in('status', ['pending', 'confirmed']);

    const bookedTimes = new Set((booked || []).map(a => a.preferred_time));

    // Generate slots
    const slots = [];
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const duration = schedule.slot_duration || 30;

    for (let m = startMin; m + duration <= endMin; m += duration) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      if (!bookedTimes.has(timeStr)) {
        slots.push({ time: timeStr, available: true });
      }
    }

    res.json(slots);
  } catch (err) { next(err); }
});

export default router;
