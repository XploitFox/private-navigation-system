import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AuthTokenPayload } from '../utils/token.js';

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const user = verifyAccessToken(token);

  if (!user) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};
