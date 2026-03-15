import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../middleware/errorHandler.js';

const client = axios.create({
  baseURL: env.GPTOSS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.GPTOSS_API_KEY}`,
  },
  timeout: 60000,
});

export async function chatCompletion(messages, options = {}) {
  try {
    const { data } = await client.post('/chat/completions', {
      model: env.GPTOSS_MODEL,
      messages,
      max_tokens: options.max_tokens || 800,
      temperature: options.temperature ?? 0.7,
      ...options,
    });
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    logger.error('GPT-OSS API error: ' + (err.response?.data?.error?.message || err.message));
    return null;
  }
}
