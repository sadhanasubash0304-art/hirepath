import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.ts';

interface RateBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateBucket>();

export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const key = authReq.user?.uid || req.ip || 'anonymous';
    const now = Date.now();
    const cutoff = now - options.windowMs;

    const bucket = buckets.get(key) || { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

    if (bucket.timestamps.length >= options.maxRequests) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait a few moments before making another AI request.',
      });
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    next();
  };
}
