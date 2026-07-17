import rateLimit from 'express-rate-limit';

export function createRateLimiter(message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
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
