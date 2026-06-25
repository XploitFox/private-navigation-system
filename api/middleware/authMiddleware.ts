import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const session = verifyAccessToken(token);

  if (!session) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  next();
};
