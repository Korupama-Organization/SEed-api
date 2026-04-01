const asNumber = (value: string | undefined, fallback: number): number => {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: string | undefined, fallback: boolean): boolean => {
    if (value === undefined) {
        return fallback;
    }

    return value.toLowerCase() === 'true';
};

export const APP_CONFIG = {
    jwtSecret: process.env.JWT_SECRET || '',
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetPasswordSecret: process.env.JWT_RESET_PASSWORD_SECRET || '',
    resetPasswordExpiresIn: process.env.JWT_RESET_PASSWORD_EXPIRES_IN || '15m',
    redisUsername: process.env.REDIS_USERNAME || 'default',
    redisPassword: process.env.REDIS_PASSWORD || '',
    redisHost: process.env.REDIS_HOST || '',
    redisPort: asNumber(process.env.REDIS_PORT, 0),
    otpLength: asNumber(process.env.OTP_LENGTH, 6),
    otpTtlSeconds: asNumber(process.env.OTP_TTL_SECONDS, 300),
    otpResendCooldownSeconds: asNumber(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
    authRateLimitWindowSeconds: asNumber(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS, 60),
    authRateLimitMaxRequests: asNumber(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 5),
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: asNumber(process.env.SMTP_PORT, 587),
    smtpSecure: asBoolean(process.env.SMTP_SECURE, false),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFromName: process.env.SMTP_FROM_NAME || 'Studuy',
    smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@studuy.local',
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    livekitUrl: process.env.LIVEKIT_URL || '',
    livekitApiKey: process.env.LIVEKIT_API_KEY || '',
    livekitApiSecret: process.env.LIVEKIT_API_SECRET || '',
    livekitTokenTtl: process.env.LIVEKIT_TOKEN_TTL || '15m',
    livestreamLockTtlSeconds: asNumber(process.env.LIVESTREAM_LOCK_TTL_SECONDS, 120),
    payosWebhookUrl: process.env.PAYOS_WEBHOOK_URL || '',
};

export const REDIS_KEYS = {
    verifyEmailOtp: (email: string) => `auth:verify-email:otp:${email.toLowerCase()}`,
    verifyEmailCooldown: (email: string) => `auth:verify-email:cooldown:${email.toLowerCase()}`,
    forgotPasswordOtp: (email: string) => `auth:forgot-password:otp:${email.toLowerCase()}`,
    forgotPasswordCooldown: (email: string) => `auth:forgot-password:cooldown:${email.toLowerCase()}`,
    livestreamActiveSession: (sessionId: string, userId: string) => `livestream:active:${sessionId}:${userId}`,
};