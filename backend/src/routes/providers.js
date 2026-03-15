import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Actual DB columns: id, clinic_name, specialty, phone, address, language_supported, clinic_id, created_at

// GET /api/providers — clinic finder (public, no auth)
router.get('/', async (req, res, next) => {
  try {
    const { specialty, search } = req.query;

    let query = supabaseAdmin.from('providers').select('*');

    if (specialty) query = query.eq('specialty', specialty);
    if (search) query = query.or(`clinic_name.ilike.%${search}%,specialty.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    // Map DB columns to frontend-expected shape
    const mapped = (data || []).map(p => ({
      id: p.id,
      name: p.clinic_name || p.name || '',
      clinic_name: p.clinic_name || '',
      spec: p.specialty || p.spec || '',
      specialty: p.specialty || '',
      icon: p.icon || '🏥',
      lat: p.lat,
      lng: p.lng,
      addr: p.address || p.addr || '',
      phone: p.phone || '',
      hours: p.hours || '',
      acc: p.acc ?? true,
      open: p.open ?? true,
      dist: p.dist || 0,
      wait: p.wait || 0,
      rating: p.rating || 4.5,
      rc: p.rc || 100,
      color: p.color || '#7c3aed',
      langs: p.language_supported || p.langs || [],
      reviews: p.reviews || [],
      slots: p.slots || [],
      created_at: p.created_at,
    }));

    res.json(mapped);
  } catch (err) { next(err); }
});

// GET /api/providers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Provider not found' });

    res.json({
      id: data.id,
      name: data.clinic_name || '',
      clinic_name: data.clinic_name || '',
      spec: data.specialty || '',
      specialty: data.specialty || '',
      phone: data.phone || '',
      addr: data.address || '',
      created_at: data.created_at,
    });
  } catch (err) { next(err); }
});

export default router;
