import rateLimit from 'express-rate-limit';

export function createRateLimiter(message: string, max: number = 20, windowMs: number = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message
      });
    },
  });
}
