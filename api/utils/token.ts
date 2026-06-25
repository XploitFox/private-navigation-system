import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const AUTH_MODE = 'access-key' as const;
const AUTH_SESSION_PAYLOAD = { authMode: AUTH_MODE };

export type AuthSessionPayload = jwt.JwtPayload & { authMode: typeof AUTH_MODE };

const isAuthSessionPayload = (payload: unknown): payload is AuthSessionPayload => {
  if (!payload || typeof payload !== 'object') return false;
  if (!('authMode' in payload)) return false;
  return (payload as { authMode?: unknown }).authMode === AUTH_MODE;
};

export const signAccessToken = () => {
  return jwt.sign(AUTH_SESSION_PAYLOAD, config.jwtSecret, {
    expiresIn: config.accessTokenExpiresIn,
  });
};

export const signRefreshToken = () => {
  return jwt.sign(AUTH_SESSION_PAYLOAD, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiresIn,
  });
};

export const verifyAccessToken = (token: string): AuthSessionPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return isAuthSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): AuthSessionPayload | null => {
  try {
    const payload = jwt.verify(token, config.refreshTokenSecret);
    return isAuthSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
};
