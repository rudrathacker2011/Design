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
import { tripRouter } from './modules/trip/trip.router.js';
import { feedbackRouter } from './modules/feedback/feedback.router.js';
import { operatorRouter } from './modules/operator/operator.router.js';
import { offlineRouter } from './modules/offline/offline.router.js';
import { rateLimit } from './lib/rate-limit.js';
import { prisma } from './lib/db.js';

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
app.use(rateLimit({ name: 'global', windowMs: 60_000, limit: 240 }));

// Attach a request ID to every request for traceability
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).requestId = randomUUID();
  next();
});
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId as string;
  res.setHeader('X-Request-ID', requestId);
  const startedAt = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({
        event: 'http_request',
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      }));
    }
  });
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

app.get('/health/readiness', async (_req, res) => {
  let database = false;
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch (error) {
      console.error('[Readiness Database]', error);
    }
  }
  const checks = {
    database,
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    ai: Boolean(process.env.GEMINI_API_KEY),
    routing: true,
  };
  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    service: 'YatraSetu Backend',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ─── Domain module routes (v1) ─────────────────────────────────
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/decisions', decisionRouter);
app.use('/api/v1/intent', rateLimit({ name: 'intent', windowMs: 60_000, limit: 30 }), intentRouter);
app.use('/api/v1/mobility', mobilityRouter);
app.use('/api/v1/safety', safetyRouter);
app.use('/api/v1/trust', trustRouter);
app.use('/api/v1/gov', govRouter);
app.use('/api/v1/trips', tripRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/operator', operatorRouter);
app.use('/api/v1/offline', offlineRouter);

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
