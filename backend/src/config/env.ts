import dotenv from 'dotenv';

dotenv.config();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => o.replace(/^["']|["']$/g, '').replace(/\/$/, ''));
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  API_PREFIX: process.env.API_PREFIX ?? '/api',
  DATABASE_URL: required('DATABASE_URL', process.env.DATABASE_URL),
  JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
};

export const corsOrigins = normalizeOrigins(env.CORS_ORIGIN);
