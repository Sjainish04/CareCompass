import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { chatCompletion } from '../services/gptoss.js';

const router = Router();

// DB columns: id, user_id, role, content, created_at

function buildSystemPrompt(user) {
  return `You are Fatima, a warm, empathetic healthcare navigator for CareCompass in the Greater Toronto Area. You help patients with appointment booking, referral tracking, document preparation, and answering health-related questions.

Patient: ${user.full_name || 'Patient'}
Guidelines:
- Be warm, supportive, and proactive
- Help with booking, reminders, document preparation, and explaining medical information
- Always mention language-specific services available
- Keep responses concise but helpful`;
}

// POST /api/navigator/message
router.post('/message', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });

    // Load recent conversation history
    const { data: history } = await supabaseAdmin
      .from('navigator_messages')
      .select('role, content')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const messages = [
      { role: 'system', content: buildSystemPrompt(req.user) },
      ...((history || []).reverse().map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content,
      }))),
      { role: 'user', content: text },
    ];

    const aiResponse = await chatCompletion(messages, { max_tokens: 600, temperature: 0.7 });
    const responseText = aiResponse || "I'm looking into that for you now! I'll have an answer shortly. Is there anything else urgent?";

    // Store messages
    await supabaseAdmin.from('navigator_messages').insert([
      { user_id: req.user.id, role: 'user', content: text },
      { user_id: req.user.id, role: 'assistant', content: responseText },
    ]);

    res.json({ response: responseText });
  } catch (err) { next(err); }
});

// GET /api/navigator/messages
router.get('/messages', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const { data, error } = await supabaseAdmin
      .from('navigator_messages')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) return res.status(500).json({ error: error.message });

    const mapped = (data || []).map(m => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    }));
    res.json(mapped);
  } catch (err) { next(err); }
});

// DELETE /api/navigator/messages
router.delete('/messages', requireAuth, async (req, res, next) => {
  try {
    await supabaseAdmin
      .from('navigator_messages')
      .delete()
      .eq('user_id', req.user.id);

    res.json({ message: 'Conversation cleared' });
  } catch (err) { next(err); }
});

export default router;
