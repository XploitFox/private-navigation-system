import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getNumberEnv = (name: string, fallback: number) => {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid environment variable ${name}: expected a positive integer`);
  }
  return parsedValue;
};

const ensureNotExampleSecret = (name: string, value: string) => {
  const blockedValues = new Set([
    'please-change-me',
    'please-change-me-too',
    'default-secret-key',
    'default-refresh-secret-key',
    'replace-with-a-long-random-secret',
    'replace-with-a-different-long-random-secret',
    'replace-with-your-access-key',
  ]);

  if (blockedValues.has(value)) {
    throw new Error(`Unsafe environment variable ${name}: replace the example value before starting the server`);
  }

  return value;
};

const port = getNumberEnv('PORT', 3000);
const jwtSecret = ensureNotExampleSecret('JWT_SECRET', getRequiredEnv('JWT_SECRET'));
const refreshTokenSecret = ensureNotExampleSecret('REFRESH_TOKEN_SECRET', getRequiredEnv('REFRESH_TOKEN_SECRET'));
const accessKey = ensureNotExampleSecret('ACCESS_KEY', getRequiredEnv('ACCESS_KEY'));

export const config = {
  port,
  jwtSecret,
  refreshTokenSecret,
  accessTokenExpiresIn: getNumberEnv('ACCESS_TOKEN_EXPIRES_IN', 900),
  refreshTokenExpiresIn: getNumberEnv('REFRESH_TOKEN_EXPIRES_IN', 7776000),
  metaFetchTimeoutMs: getNumberEnv('META_FETCH_TIMEOUT_MS', 4500),
  accessKey,
};
