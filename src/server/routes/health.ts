// src/server/routes/health.ts

import { Router } from 'express';
import { createRateLimiter } from '../rateLimiter';

const router = Router();
const healthLimiter = createRateLimiter('Too many health check requests.', 60, 60 * 1000);

router.get('/health', healthLimiter, (req, res) => {
  res.status(200).send('OK');
});

export default router;