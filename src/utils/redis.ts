import { createClient, RedisClientType } from 'redis';
import { APP_CONFIG } from '../constants';

let redisClient: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType => {
    if (!redisClient) {
        redisClient = createClient({
            username: APP_CONFIG.redisUsername,
            password: APP_CONFIG.redisPassword || undefined,
            socket: {
                host: APP_CONFIG.redisHost,
                port: APP_CONFIG.redisPort,
            },
        });

        redisClient.on('error', (error) => {
            console.error('Redis error:', error);
        });
    }

    return redisClient;
};

export const ensureConnected = async (): Promise<RedisClientType> => {
    const client = getRedisClient();

    if (!client.isOpen) {
        await client.connect();
    }

    return client;
};

export const setTempValue = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
    const client = await ensureConnected();
    await client.set(key, value, { EX: ttlSeconds });
};

export const getTempValue = async (key: string): Promise<string | null> => {
    const client = await ensureConnected();
    return client.get(key);
};

export const deleteTempValue = async (key: string): Promise<void> => {
    const client = await ensureConnected();
    await client.del(key);
};

export const existsTempValue = async (key: string): Promise<boolean> => {
    const client = await ensureConnected();
    const exists = await client.exists(key);
    return exists === 1;
};

export const disconnectRedis = async (): Promise<void> => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
    }
};

export const setTempValueIfAbsent = async (key: string, value: string, ttlSeconds: number): Promise<boolean> => {
    const client = await ensureConnected();
    const response = await client.set(key, value, { EX: ttlSeconds, NX: true });
    return response === 'OK';
};

export const refreshTempValueIfMatch = async (
    key: string,
    expectedValue: string,
    ttlSeconds: number,
): Promise<boolean> => {
    const client = await ensureConnected();
    const result = await client.eval(
        'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("EXPIRE", KEYS[1], ARGV[2]) else return 0 end',
        {
            keys: [key],
            arguments: [expectedValue, String(ttlSeconds)],
        },
    );

    return Number(result) === 1;
};

export const deleteTempValueIfMatch = async (key: string, expectedValue: string): Promise<boolean> => {
    const client = await ensureConnected();
    const result = await client.eval(
        'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
        {
            keys: [key],
            arguments: [expectedValue],
        },
    );

    return Number(result) === 1;
};