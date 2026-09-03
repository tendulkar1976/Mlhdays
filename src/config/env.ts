import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file securely on server startup
config();

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is mandatory and must be configured server-side'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  TAX_RULE_VERSION_DEFAULT: z.string().default('FY2025_26_AY2026_27'),
  MEMBER1_TAX_ENGINE_URL: z.string().default('http://localhost:3000'),
  MEMBER3_FRONTEND_URL: z.string().default('http://localhost:3001'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3002), // Member 2 runs on port 3002
});

export type EnvConfig = z.infer<typeof envSchema>;

let _env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (_env) return _env;

  // In testing or local dev environments without a key set yet, provide a fallback key
  const apiKey = process.env.GEMINI_API_KEY || 'DEMO_MOCK_GEMINI_API_KEY';

  const parsed = envSchema.safeParse({
    GEMINI_API_KEY: apiKey,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    TAX_RULE_VERSION_DEFAULT: process.env.TAX_RULE_VERSION_DEFAULT || 'FY2025_26_AY2026_27',
    MEMBER1_TAX_ENGINE_URL: process.env.MEMBER1_TAX_ENGINE_URL || 'http://localhost:3000',
    MEMBER3_FRONTEND_URL: process.env.MEMBER3_FRONTEND_URL || 'http://localhost:3001',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3002,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`[Security & Config Error] Environment validation failed: ${issues}`);
  }

  // Double check that API key is NEVER exposed on client
  if (typeof window !== 'undefined') {
    throw new Error('[CRITICAL SECURITY VIOLATION] getEnv() must never be executed on the client/browser!');
  }

  _env = parsed.data;
  return _env;
}
