import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import authRoutes from './routes/authRoutes.js';
import navRoutes from './routes/navRoutes.js';
import { UserModel } from './models/userModel.js';

// Initialize admin user
UserModel.initAdmin().catch(console.error);

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true, // Adjust for production
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/navigations', navRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'ok' });
});

const distPath = path.resolve(process.cwd(), 'dist');
const distIndexHtml = path.join(distPath, 'index.html');

if (fs.existsSync(distIndexHtml)) {
  app.use(express.static(distPath, { index: false }));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(distIndexHtml);
  });
}

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  void next;
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
