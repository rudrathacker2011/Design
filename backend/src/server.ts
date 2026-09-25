import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { fail } from './lib/response.js';
import { profileRouter } from './modules/profile/profile.router.js';
import { decisionRouter } from './modules/decision/decision.router.js';
import { intentRouter } from './modules/intent/intent.router.js';
import { mobilityRouter } from './modules/mobility/mobility.router.js';
import { safetyRouter } from './modules/safety/safety.router.js';
import { trustRouter } from './modules/trust/trust.router.js';
import { govRouter } from './modules/gov/gov.router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global middleware ───────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Attach a request ID to every request for traceability
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).requestId = randomUUID();
  next();
});

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'YatraSetu Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Domain module routes (v1) ─────────────────────────────────
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/decisions', decisionRouter);
app.use('/api/v1/intent', intentRouter);
app.use('/api/v1/mobility', mobilityRouter);
app.use('/api/v1/safety', safetyRouter);
app.use('/api/v1/trust', trustRouter);
app.use('/api/v1/gov', govRouter);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json(fail('NOT_FOUND', 'This endpoint does not exist.'));
});

// ─── Global error handler ─────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json(fail('INTERNAL_ERROR', 'An unexpected server error occurred.', { retryable: false }));
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 YatraSetu Backend running on http://localhost:${PORT}`);
});
