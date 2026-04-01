import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { APP_CONFIG } from '../constants';
import { ensureConnected } from '../utils/redis';

const toRateLimitKey = (req: Request): string => {
    const email = req.body?.email;
    if (typeof email === 'string' && email.trim() !== '') {
        return `email:${email.trim().toLowerCase()}`;
    }

    return `ip:${req.ip}`;
};

export const authRateLimiter = rateLimit({
    windowMs: APP_CONFIG.authRateLimitWindowSeconds * 1000,
    max: APP_CONFIG.authRateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: toRateLimitKey,
    message: { error: 'Too many requests' },
    store: new RedisStore({
        sendCommand: (...args: string[]) => ensureConnected().then((client) => client.sendCommand(args)),
    }),
});



