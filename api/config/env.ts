import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-key',
  accessTokenExpiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN || '900'),
  refreshTokenExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '7776000'),
  metaFetchTimeoutMs: parseInt(process.env.META_FETCH_TIMEOUT_MS || '4500'),
  accessKey: process.env.ACCESS_KEY || '',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
};
