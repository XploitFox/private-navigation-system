import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { config } from '../config/env.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const AuthController = {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await UserModel.updateLastLogin(username);

    const accessToken = signAccessToken({ username: user.username });
    const refreshToken = signRefreshToken({ username: user.username });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.refreshTokenExpiresIn * 1000,
    });

    res.json({
      accessToken,
      expiresIn: config.accessTokenExpiresIn,
      user: { username: user.username, email: user.email },
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
