import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export type AuthTokenPayload = jwt.JwtPayload & { username: string };

const isAuthTokenPayload = (payload: unknown): payload is AuthTokenPayload => {
  if (!payload || typeof payload !== 'object') return false;
  if (!('username' in payload)) return false;
  return typeof (payload as { username?: unknown }).username === 'string';
};

export const signAccessToken = (payload: { username: string }) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.accessTokenExpiresIn, // in seconds
  });
};

export const signRefreshToken = (payload: { username: string }) => {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiresIn, // in seconds
  });
};

export const verifyAccessToken = (token: string): AuthTokenPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return isAuthTokenPayload(payload) ? payload : null;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): AuthTokenPayload | null => {
  try {
    const payload = jwt.verify(token, config.refreshTokenSecret);
    return isAuthTokenPayload(payload) ? payload : null;
  } catch {
    return null;
  }
};
