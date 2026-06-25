import { Request, Response } from 'express';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { config } from '../config/env.js';
import { clearLoginFailures, recordLoginFailure } from '../middleware/loginRateLimit.js';

const getRefreshCookieOptions = (req: Request, maxAge?: number) => {
  const isSecureRequest = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    secure: isSecureRequest,
    sameSite: 'lax' as const,
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
};

export const AuthController = {
  async login(req: Request, res: Response) {
    const { key } = req.body as { key?: string };

    if (typeof key !== 'string' || key.length === 0) {
      recordLoginFailure(req);
      return res.status(401).json({ message: 'Key required' });
    }

    if (!config.accessKey || key !== config.accessKey) {
      recordLoginFailure(req);
      return res.status(401).json({ message: 'Invalid key' });
    }

    clearLoginFailures(req);

    const accessToken = signAccessToken();
    const refreshToken = signRefreshToken();

    res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(req, config.refreshTokenExpiresIn * 1000));

    return res.json({
      accessToken,
      expiresIn: config.accessTokenExpiresIn,
    });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    if (!verifyRefreshToken(refreshToken)) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken();

    res.json({
      accessToken,
      expiresIn: config.accessTokenExpiresIn,
    });
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('refresh_token', getRefreshCookieOptions(req));
    res.json({ message: 'Logged out successfully' });
  },
};
