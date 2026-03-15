import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// GET /api/providers — clinic finder (public, no auth)
router.get('/', async (req, res, next) => {
  try {
    const { specialty, lang, accepting, search } = req.query;

    let query = supabaseAdmin.from('providers').select('*');

    if (specialty) query = query.eq('specialty', specialty);
    if (search) query = query.or(`clinic_name.ilike.%${search}%,specialty.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    // Map DB columns to frontend-expected shape
    const mapped = (data || []).map(p => ({
      id: p.id || p.clinic_id,
      name: p.clinic_name,
      spec: p.specialty,
      icon: '🏥',
      addr: p.address,
      phone: p.phone,
      langs: p.language_supported || [],
      acc: true,
      open: true,
      dist: 0,
      wait: 0,
      rating: 4.5,
      rc: 100,
      color: '#7c3aed',
      reviews: [],
      slots: [],
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
