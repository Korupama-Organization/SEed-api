import jwt, { SignOptions } from 'jsonwebtoken';
import { APP_CONFIG } from '../../constants';

interface LiveKitTokenResult {
    token: string;
    roomName: string;
    url: string;
}

const ensureConfigured = (): void => {
    if (!APP_CONFIG.livekitApiKey || !APP_CONFIG.livekitApiSecret || !APP_CONFIG.livekitUrl) {
        throw new Error('LiveKit is not configured.');
    }
};

const mintToken = (
    userId: string,
    roomName: string,
    canPublish: boolean,
    canSubscribe: boolean,
): LiveKitTokenResult => {
    ensureConfigured();

    const payload = {
        iss: APP_CONFIG.livekitApiKey,
        sub: userId,
        video: {
            roomJoin: true,
            room: roomName,
            canPublish,
            canSubscribe,
        },
    };

    const signOptions: SignOptions = {
        algorithm: 'HS256',
        expiresIn: APP_CONFIG.livekitTokenTtl as SignOptions['expiresIn'],
    };

    const token = jwt.sign(payload, APP_CONFIG.livekitApiSecret, signOptions);

    return {
        token,
        roomName,
        url: APP_CONFIG.livekitUrl,
    };
};

export const ensureRoom = async (roomName: string): Promise<{ roomName: string }> => {
    ensureConfigured();
    return { roomName };
};

export const closeRoom = async (_roomName: string): Promise<void> => {
    ensureConfigured();
};

export const mintTeacherToken = async (userId: string, roomName: string): Promise<LiveKitTokenResult> => {
    return mintToken(userId, roomName, true, true);
};

export const mintViewerToken = async (userId: string, roomName: string): Promise<LiveKitTokenResult> => {
    return mintToken(userId, roomName, false, true);
};
