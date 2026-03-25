import { Request, Response } from 'express';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { config } from '../config/env.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const AuthController = {
  async login(req: Request, res: Response) {
    const { key } = req.body as { key?: string };

    if (typeof key !== 'string' || key.length === 0) {
      return res.status(401).json({ message: 'Key required' });
    }

    if (!config.accessKey || key !== config.accessKey) {
      return res.status(401).json({ message: 'Invalid key' });
    }

    const accessToken = signAccessToken({ username: config.adminUsername });
    const refreshToken = signRefreshToken({ username: config.adminUsername });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.refreshTokenExpiresIn * 1000,
    });

    return res.json({
      accessToken,
      expiresIn: config.accessTokenExpiresIn,
      user: { username: config.adminUsername },
    });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken({ username: payload.username });

    res.json({
      accessToken,
      expiresIn: config.accessTokenExpiresIn,
    });
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
  },

  async me(req: AuthRequest, res: Response) {
    res.json({ user: req.user });
  },
};
