import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Auth Router', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // auth.ts reads GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET from process.env into
  // module-level constants at import time. Because of that, the router module
  // must be freshly re-imported (via vi.resetModules()) AFTER env vars are
  // stubbed in each test, or it will keep using whatever value it captured
  // the first time it was ever imported — stubbing env vars afterward has no
  // effect on an already-imported module.
  async function buildApp() {
    vi.resetModules();
    const { default: authRouter } = await import('../routes/auth');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    return app;
  }

  it('POST /auth/token exchanges code for access token and returns it to the client', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');

    const app = await buildApp();

    const mockSuccessResponse = { access_token: 'fake-token', expires_in: 3600 };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    } as Response);
    
    const response = await request(app).post('/api/auth/google-token').send({ 
      code: 'test',
      redirect_uri: 'http://localhost:3000'
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSuccessResponse);
  });

  it('returns 400 CONFIGURATION_REQUIRED when only the insecure VITE_GOOGLE_CLIENT_SECRET is provided', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'unsafe-secret');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    vi.stubEnv('CLIENT_SECRET', '');

    const app = await buildApp();

    const response = await request(app)
      .post('/api/auth/google-token')
      .send({
        code: 'valid-code',
        redirect_uri: 'http://localhost:3000'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'CONFIGURATION_REQUIRED',
      message: 'Google Client Secret/ID is not configured in the environment.'
    });
  });

  it('POST /auth/token returns 400 when code is missing from the request body', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');

    const app = await buildApp();

    const response = await request(app).post('/api/auth/google-token').send({ redirect_uri: 'http://localhost' });
    expect(response.status).toBe(400);
  });
});