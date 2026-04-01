import express from 'express';
import request from 'supertest';

jest.mock('rate-limit-redis', () => {
  class MockRedisStore {
    public windowMs = 60_000;
    private hits = new Map<string, { count: number; resetAt: number }>();

    init(options: { windowMs: number }) {
      this.windowMs = options.windowMs;
    }

    async increment(key: string) {
      const now = Date.now();
      const record = this.hits.get(key);

      if (!record || record.resetAt <= now) {
        const resetAt = now + this.windowMs;
        const next = { count: 1, resetAt };
        this.hits.set(key, next);
        return { totalHits: 1, resetTime: new Date(resetAt) };
      }

      record.count += 1;
      this.hits.set(key, record);
      return { totalHits: record.count, resetTime: new Date(record.resetAt) };
    }

    async decrement() {
      return;
    }

    async resetKey(key: string) {
      this.hits.delete(key);
    }
  }

  return { RedisStore: MockRedisStore };
});

jest.mock('../../src/utils/redis', () => ({
  ensureConnected: jest.fn(async () => ({
    sendCommand: jest.fn(async () => 'OK'),
  })),
}));

describe('authRateLimiter', () => {
  it('returns 429 when request count exceeds limit for same email key', async () => {
    process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '2';
    process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS = '60';

    const { authRateLimiter } = await import('../../src/middlewares/auth-rate-limit.middleware');

    const app = express();
    app.use(express.json());
    app.post('/limited', authRateLimiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });

    await request(app).post('/limited').send({ email: 'student@example.com' }).expect(200);
    await request(app).post('/limited').send({ email: 'student@example.com' }).expect(200);
    await request(app).post('/limited').send({ email: 'student@example.com' }).expect(429);
  });
});
