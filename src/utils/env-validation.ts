const REQUIRED_ENV_VARS = [
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

export const validateRequiredEnv = (): void => {
    const missing = REQUIRED_ENV_VARS.filter((name) => {
        const value = process.env[name];
        return !value || String(value).trim() === '';
    });

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing.join(', '));
        throw new Error('Server configuration error. Contact admin.');
    }
};

export { REQUIRED_ENV_VARS };
