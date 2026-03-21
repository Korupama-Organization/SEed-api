import { validateRequiredEnv } from '../../src/utils/env-validation';

const REQUIRED_KEYS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_RESET_PASSWORD_SECRET',
  'MONGODB_URI',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'REDIS_HOST',
  'REDIS_PORT',
] as const;

describe('validateRequiredEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    for (const key of REQUIRED_KEYS) {
      process.env[key] = 'present';
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when required env vars are missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => validateRequiredEnv()).toThrow('Server configuration error. Contact admin.');
  });

  it('passes when required env vars are present', () => {
    expect(() => validateRequiredEnv()).not.toThrow();
  });
});
