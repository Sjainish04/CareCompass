import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../middleware/errorHandler.js';

const client = axios.create({
  baseURL: 'https://api.cohere.com/v2',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.COHERE_API_KEY}`,
  },
  timeout: 30000,
});

export async function translate(text, sourceLang, targetLang) {
  if (!env.COHERE_API_KEY || env.COHERE_API_KEY === 'your-cohere-key') return null;
  try {
    const { data } = await client.post('/chat', {
      model: 'command-a-translate-08-2025',
      messages: [{ role: 'user', content: `Translate from ${sourceLang} to ${targetLang}. Output ONLY the translation:\n\n${text}` }],
      max_tokens: 1000,
    });
    return data.message?.content?.[0]?.text || null;
  } catch (err) {
    logger.error('Cohere translate error: ' + (err.response?.data?.message || err.message));
    return null;
  }
}

export async function extractEHR(ehrText) {
  if (!env.COHERE_API_KEY || env.COHERE_API_KEY === 'your-cohere-key') return null;
  try {
    const { data } = await client.post('/chat', {
      model: 'command-a-03-2025',
      messages: [{ role: 'user', content: `Extract clinical data from this EHR as JSON: demographics, vitals, medications, diagnoses, labs, allergies, plan.\n\n${ehrText}` }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });
    const raw = data.message?.content?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (err) {
    logger.error('Cohere EHR extract error: ' + (err.response?.data?.message || err.message));
    return null;
  }
}

export async function cdiscMap(extractedData) {
  if (!env.COHERE_API_KEY || env.COHERE_API_KEY === 'your-cohere-key') return null;
  try {
    const { data } = await client.post('/chat', {
      model: 'command-a-03-2025',
      messages: [{ role: 'user', content: `Map the following extracted clinical data to CDISC SDTM v3.4 domains and variables.
For each variable, provide:
- domain: SDTM domain code (e.g., DM, VS, LB)
- variable: SDTM variable name
- label: Variable label
- value: Extracted value
- confidence: Confidence score (0-100)
- explanation: A brief human-readable explanation of WHY this value was extracted and mapped this way, including clinical context and any validation performed
- ehrSource: The exact snippet from the EHR where this value was found

Return JSON array of objects with these fields.

${JSON.stringify(extractedData)}` }],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });
    const raw = data.message?.content?.[0]?.text || '[]';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (err) {
    logger.error('Cohere CDISC map error: ' + (err.response?.data?.message || err.message));
    return null;
  }
}
