import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import config from './config';

// Routers
import authRouter from './routes/auth';
import coursesRouter from './routes/courses';
import studentsRouter from './routes/students';
import templatesRouter from './routes/templates';
import certificatesRouter from './routes/certificates';
import dashboardRouter from './routes/dashboard';
import publicRouter from './routes/public';

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── General rate limit ────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please slow down' },
});
app.use(generalLimiter);

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(config.UPLOAD_DIR)));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/public', publicRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GlobalError]', err);
  res.status(500).json({ success: false, error: err.message ?? 'Internal server error' });
});

// ── MongoDB connection + server start ─────────────────────────────────────────
async function start(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[MongoDB] Connected successfully');

    app.listen(config.PORT, () => {
      console.log(`[Server] Running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (err) {
    console.error('[Startup] Fatal error:', err);
    process.exit(1);
  }
}

start();

export default app;
