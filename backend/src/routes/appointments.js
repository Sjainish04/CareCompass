import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// ── Actual DB columns ──
// id, patient_id, provider_id, preferred_date, preferred_time, appointment_type, notes, status, rejection_reason, created_at

// Helper: look up provider name from profiles table
async function lookupProviderName(providerId) {
  if (!providerId) return '';
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', providerId)
      .single();
    if (data?.full_name) return data.full_name;
  } catch {}
  try {
    const { data } = await supabaseAdmin
      .from('providers')
      .select('name, clinic_name')
      .eq('id', providerId)
      .single();
    if (data?.clinic_name) return data.clinic_name;
    if (data?.name) return data.name;
  } catch {}
  return '';
}

// Map DB row to frontend-expected shape
function mapApptToFrontend(row, providerName) {
  return {
    id: row.id,
    user_id: row.patient_id,
    provider_id: row.provider_id,
    provider_name: providerName || '',
    date: row.preferred_date,
    time: row.preferred_time,
    type: row.appointment_type,
    notes: row.notes,
    status: row.status,
    rejection_reason: row.rejection_reason || null,
    created_at: row.created_at,
  };
}

// Enrich a list of appointments with provider names
async function enrichWithProviderNames(rows) {
  const providerIds = [...new Set(rows.map(r => r.provider_id).filter(Boolean))];
  const nameMap = {};
  for (const pid of providerIds) {
    nameMap[pid] = await lookupProviderName(pid);
  }
  return rows.map(row => mapApptToFrontend(row, nameMap[row.provider_id]));
}

// GET /api/appointments/provider/mine — appointments booked WITH this provider
router.get('/provider/mine', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('provider_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Enrich with patient names from profiles
    const patientIds = [...new Set((data || []).map(a => a.patient_id).filter(Boolean))];
    let profileMap = {};
    if (patientIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIds);
      profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
    }

    const mapped = (data || []).map(row => ({
      ...mapApptToFrontend(row, req.user.full_name),
      patient_name: profileMap[row.patient_id] || 'Unknown Patient',
    }));
    res.json(mapped);
  } catch (err) { next(err); }
});

// PATCH /api/appointments/provider/:id/status — approve/reject
router.patch('/provider/:id/status', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be confirmed or cancelled' });
    }

    // Verify appointment belongs to this provider
    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('provider_id')
      .eq('id', req.params.id)
      .single();

    if (!existing || existing.provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your appointment' });
    }

    const updatePayload = { status };
    if (status === 'cancelled' && req.body.rejection_reason) {
      updatePayload.rejection_reason = req.body.rejection_reason;
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ ...mapApptToFrontend(data), rejection_reason: data.rejection_reason || null });
  } catch (err) { next(err); }
});

// GET /api/appointments/provider/pending — pending appointments for this provider
router.get('/provider/pending', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('provider_id', req.user.id)
      .eq('status', 'pending')
      .order('preferred_date', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const patientIds = [...new Set((data || []).map(a => a.patient_id).filter(Boolean))];
    let profileMap = {};
    if (patientIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIds);
      profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
    }

    const mapped = (data || []).map(row => ({
      ...mapApptToFrontend(row, req.user.full_name),
      patient_name: profileMap[row.patient_id] || 'Unknown Patient',
    }));
    res.json(mapped);
  } catch (err) { next(err); }
});

// GET /api/appointments/provider/today — MUST be before /:id
router.get('/provider/today', requireAuth, async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('preferred_date', today)
      .order('preferred_time', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    const mapped = await enrichWithProviderNames(data || []);
    res.json(mapped);
  } catch (err) { next(err); }
});

// GET /api/appointments
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('patient_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    const mapped = await enrichWithProviderNames(data || []);
    res.json(mapped);
  } catch (err) { next(err); }
});

// GET /api/appointments/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .eq('patient_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
    const provName = await lookupProviderName(data.provider_id);
    res.json(mapApptToFrontend(data, provName));
  } catch (err) { next(err); }
});

// POST /api/appointments
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body;

    // Accept frontend field names and map to DB columns
    let date = body.date || body.preferredDate || body.preferred_date || '';
    let time = body.time || body.preferredTime || body.preferred_time || '';
    if (body.datetime && !date) {
      const parts = body.datetime.split(' ');
      date = parts[0] || '';
      time = parts.slice(1).join(' ') || '';
    }

    const row = {
      patient_id: req.user.id,
      provider_id: body.provider_id || null,
      preferred_date: date,
      preferred_time: time,
      appointment_type: body.type || body.appointment_type || 'Specialist Visit',
      notes: body.notes || '',
      status: 'pending',
    };

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert(row)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const provName = body.provider_name || await lookupProviderName(data.provider_id);
    res.status(201).json(mapApptToFrontend(data, provName));
  } catch (err) { next(err); }
});

// PATCH /api/appointments/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.date) updates.preferred_date = req.body.date;
    if (req.body.time) updates.preferred_time = req.body.time;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes) updates.notes = req.body.notes;
    if (req.body.type) updates.appointment_type = req.body.type;

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', req.params.id)
      .eq('patient_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    const provName = await lookupProviderName(data.provider_id);
    res.json(mapApptToFrontend(data, provName));
  } catch (err) { next(err); }
});

// DELETE /api/appointments/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', req.params.id)
      .eq('patient_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Appointment cancelled' });
  } catch (err) { next(err); }
});

export default router;
