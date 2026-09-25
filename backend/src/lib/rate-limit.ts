import type { Request, Response, NextFunction } from 'express';
import { fail } from './response.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(options: { windowMs: number; limit: number; name: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const identity = req.userId ?? req.ip ?? 'anonymous';
    const key = `${options.name}:${identity}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current;

    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > options.limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json(fail('RATE_LIMITED', 'Too many requests. Please retry later.', { retryable: true }));
      return;
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();
