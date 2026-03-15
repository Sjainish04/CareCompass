import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// DB columns: id, name, spec, icon, lat, lng, addr, phone, hours, acc, open, dist, wait, rating, rc, color, langs, reviews, slots, created_at

// GET /api/providers — clinic finder (public, no auth)
router.get('/', async (req, res, next) => {
  try {
    const { specialty, lang, accepting, search } = req.query;

    let query = supabaseAdmin.from('providers').select('*');

    if (specialty) query = query.eq('spec', specialty);
    if (search) query = query.or(`name.ilike.%${search}%,spec.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    // Map DB columns to frontend-expected shape
    const mapped = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      spec: p.spec,
      icon: p.icon || '🏥',
      lat: p.lat,
      lng: p.lng,
      addr: p.addr,
      phone: p.phone,
      hours: p.hours,
      acc: p.acc ?? true,
      open: p.open ?? true,
      dist: p.dist || 0,
      wait: p.wait || 0,
      rating: p.rating || 4.5,
      rc: p.rc || 100,
      color: p.color || '#7c3aed',
      langs: p.langs || [],
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
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
