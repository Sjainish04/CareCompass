import { Router } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { translate, extractEHR, cdiscMap } from '../services/cohere.js';
import { chatCompletion } from '../services/gptoss.js';
import { env } from '../config/env.js';

const router = Router();
router.use(aiLimiter);

// POST /api/ai/translate
router.post('/translate', requireAuth, async (req, res, next) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: 'text, sourceLang, and targetLang required' });
    }
    if (sourceLang === targetLang) return res.json({ translation: text });

    const result = await translate(text, sourceLang, targetLang);
    res.json({ translation: result, mode: result ? 'live' : 'demo' });
  } catch (err) { next(err); }
});

// POST /api/ai/translate-batch
router.post('/translate-batch', requireAuth, async (req, res, next) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;
    if (!Array.isArray(texts) || !sourceLang || !targetLang) {
      return res.status(400).json({ error: 'texts array, sourceLang, and targetLang required' });
    }

    const results = await Promise.all(
      texts.slice(0, 10).map(text => translate(text, sourceLang, targetLang))
    );

    res.json({ translations: results, live: results.some(r => !!r) });
  } catch (err) { next(err); }
});

// POST /api/ai/extract-ehr
router.post('/extract-ehr', requireAuth, async (req, res, next) => {
  try {
    const { ehrText } = req.body;
    if (!ehrText) return res.status(400).json({ error: 'ehrText required' });

    const result = await extractEHR(ehrText);
    res.json({ extraction: result, live: !!result });
  } catch (err) { next(err); }
});

// POST /api/ai/cdisc-map
router.post('/cdisc-map', requireAuth, async (req, res, next) => {
  try {
    const { extractedData, ehrText } = req.body;

    // Step 1: Extract if raw EHR provided
    let extracted = extractedData;
    if (!extracted && ehrText) {
      extracted = await extractEHR(ehrText);
    }

    // Step 2: Map to CDISC
    let mapping = null;
    if (extracted) {
      mapping = await cdiscMap(extracted);
    }

    // Step 3: GPT-OSS compliance review
    let review = null;
    if (mapping) {
      review = await chatCompletion([
        { role: 'system', content: 'You are a CDISC SDTM compliance expert. Review SDTM variable mappings for compliance.' },
        { role: 'user', content: `Review this CDISC SDTM mapping for compliance. Note missing required variables.\n\n${JSON.stringify(mapping).substring(0, 2000)}` },
      ], { max_tokens: 400 });
    }

    res.json({ extraction: extracted, mapping, review, live: !!extracted });
  } catch (err) { next(err); }
});

// POST /api/ai/clinical-insights
router.post('/clinical-insights', requireAuth, async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript required' });

    const result = await chatCompletion([
      { role: 'system', content: 'You are a clinical documentation assistant with explainable AI capabilities. Analyze doctor-patient transcripts, extract structured clinical insights, and explain your reasoning.' },
      { role: 'user', content: `Analyze this transcript. Return labeled sections: CHIEF COMPLAINT, SYMPTOMS, MEDICATIONS, ACTION ITEMS, RISK FLAGS.
For each section, include a brief explanation of how you identified and extracted that information.

${transcript}` },
    ], { max_tokens: 800 });

    res.json({ insights: result, live: !!result });
  } catch (err) { next(err); }
});

// POST /api/ai/tts - Text-to-speech via ElevenLabs (if key available) or indicate to use browser TTS
router.post('/tts', requireAuth, async (req, res, next) => {
  try {
    const { text, voice_id } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const elevenLabsKey = env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      return res.json({ mode: 'browser', message: 'Use browser speechSynthesis' });
    }

    // Call ElevenLabs API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id || 'pNInz6obpgDQGcFmaJgB'}`,
      { text, model_id: 'eleven_multilingual_v2' },
      {
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('ElevenLabs TTS error:', err);
    // Fallback to browser mode on error
    res.json({ mode: 'browser', message: 'ElevenLabs unavailable, use browser TTS' });
  }
});

export default router;
