import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

  COHERE_API_KEY: process.env.COHERE_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

  GPTOSS_API_KEY: process.env.GPTOSS_API_KEY || 'test',
  GPTOSS_BASE_URL: process.env.GPTOSS_BASE_URL || 'https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1',
  GPTOSS_MODEL: process.env.GPTOSS_MODEL || 'openai/gpt-oss-120b',

  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
};
