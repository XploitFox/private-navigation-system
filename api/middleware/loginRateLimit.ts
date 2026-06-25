import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

type LoginAttemptState = {
  failCount: number;
  windowStartedAt: number;
  blockedUntil: number;
};

const loginAttempts = new Map<string, LoginAttemptState>();

const getClientKey = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';

const getNormalizedState = (clientKey: string, now: number) => {
  const state = loginAttempts.get(clientKey);
  if (!state) return null;

  if (state.blockedUntil > 0 && now >= state.blockedUntil) {
    loginAttempts.delete(clientKey);
    return null;
  }

  if (now - state.windowStartedAt > WINDOW_MS) {
    loginAttempts.delete(clientKey);
    return null;
  }

  return state;
};

const setBlockedResponse = (res: Response, blockedUntil: number, now: number) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((blockedUntil - now) / 1000));
  res.setHeader('Retry-After', String(retryAfterSeconds));
  return res.status(429).json({ message: 'Too many failed login attempts. Try again later.' });
};

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const clientKey = getClientKey(req);
  const state = getNormalizedState(clientKey, now);

  if (state && state.blockedUntil > now) {
    return setBlockedResponse(res, state.blockedUntil, now);
  }

  next();
};

export const recordLoginFailure = (req: Request) => {
  const now = Date.now();
  const clientKey = getClientKey(req);
  const state = getNormalizedState(clientKey, now);

  if (!state) {
    loginAttempts.set(clientKey, {
      failCount: 1,
      windowStartedAt: now,
      blockedUntil: 0,
    });
    return;
  }

  state.failCount += 1;

  if (state.failCount >= MAX_FAILED_ATTEMPTS) {
    state.blockedUntil = now + BLOCK_MS;
  }

  loginAttempts.set(clientKey, state);
};

export const clearLoginFailures = (req: Request) => {
  const clientKey = getClientKey(req);
  loginAttempts.delete(clientKey);
};

export const resetLoginRateLimitState = () => {
  loginAttempts.clear();
};
