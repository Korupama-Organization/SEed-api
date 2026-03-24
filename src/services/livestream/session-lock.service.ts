import { APP_CONFIG, REDIS_KEYS } from '../../constants';
import { deleteTempValueIfMatch, getTempValue, refreshTempValueIfMatch, setTempValueIfAbsent } from '../../utils/redis';

interface JoinLockResult {
    allowed: boolean;
    rejoin: boolean;
}

const RECONNECT_GRACE_SECONDS = APP_CONFIG.livestreamLockTtlSeconds;

const buildKey = (livestreamId: string, userId: string): string => {
    return REDIS_KEYS.livestreamActiveSession(livestreamId, userId);
};

export const acquireJoinLock = async (
    livestreamId: string,
    userId: string,
    deviceId: string,
): Promise<JoinLockResult> => {
    const key = buildKey(livestreamId, userId);

    const created = await setTempValueIfAbsent(key, deviceId, RECONNECT_GRACE_SECONDS);
    if (created) {
        return { allowed: true, rejoin: false };
    }

    const currentDevice = await getTempValue(key);
    if (currentDevice === deviceId) {
        await refreshJoinLock(livestreamId, userId, deviceId);
        return { allowed: true, rejoin: true };
    }

    return { allowed: false, rejoin: false };
};

export const refreshJoinLock = async (livestreamId: string, userId: string, deviceId: string): Promise<boolean> => {
    const key = buildKey(livestreamId, userId);
    return refreshTempValueIfMatch(key, deviceId, RECONNECT_GRACE_SECONDS);
};

export const releaseJoinLock = async (livestreamId: string, userId: string, deviceId: string): Promise<boolean> => {
    const key = buildKey(livestreamId, userId);
    return deleteTempValueIfMatch(key, deviceId);
};