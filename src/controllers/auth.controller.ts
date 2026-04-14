import { createHash } from 'crypto';
import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import {
    AuthenticationError,
    authenticateWithEncryptedPassword,
    encryptPassword,
} from 'uit-authenticator';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { REDIS_KEYS } from '../constants';
import { deleteTempValue, deleteTempValueIfMatch, setTempValue } from '../utils/redis';
import {
    generateAccessToken,
    generateRefreshToken,
    getTokenIssuedAt,
    verifyRefreshToken,
} from '../utils/jwt';
import { IUser, User } from '../models/User';

type LoginMode = 'uit_auth' | 'normal_auth';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const normalizeUserId = (userID: string): string => userID.trim();
const buildUitEmail = (studentID: string): string => `${normalizeUserId(studentID)}@gm.uit.edu.vn`;

const sanitizeUser = (user: IUser) => {
    const safe = user.toObject() as Record<string, any>;

    if (safe.normalAuth) {
        delete safe.normalAuth.passwordHash;
    }

    return safe;
};

const resolveLoginMode = (payload: {
    authMethod?: string;
    type?: string;
    userID?: string;
    email?: string;
}): LoginMode | null => {
    if (payload.authMethod === 'uit_auth' || payload.type === 'candidate') {
        return 'uit_auth';
    }

    if (
        payload.authMethod === 'normal_auth' ||
        payload.type === 'hr' ||
        payload.type === 'recruiter' ||
        payload.type === 'admin' ||
        payload.email
    ) {
        return 'normal_auth';
    }

    return null;
};

const assertActiveUser = (user: IUser): string | null => {
    if (user.status === 'blocked') {
        return 'Account is blocked';
    }

    if (user.status !== 'active') {
        return 'Account is inactive';
    }

    return null;
};

const hashToken = (token: string): string => {
    return createHash('sha256').update(token).digest('hex');
};

const getRefreshTokenKey = (token: string): string => {
    return REDIS_KEYS.refreshToken(hashToken(token));
};

const getRefreshTokenTtlSeconds = (exp?: number): number => {
    if (typeof exp !== 'number') {
        return 0;
    }

    return Math.max(exp - Math.floor(Date.now() / 1000), 1);
};

const persistRefreshToken = async (token: string, userId: string, exp?: number): Promise<void> => {
    const ttlSeconds = getRefreshTokenTtlSeconds(exp);
    if (ttlSeconds <= 0) {
        throw new Error('Refresh token expiration is invalid');
    }

    await setTempValue(getRefreshTokenKey(token), userId, ttlSeconds);
};

const issueAuthTokens = async (user: IUser) => {
    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));
    const refreshPayload = verifyRefreshToken(refreshToken);

    await persistRefreshToken(refreshToken, String(user._id), refreshPayload.exp);

    return {
        accessToken,
        refreshToken,
    };
};

const buildLoginResponse = async (user: IUser) => {
    const tokens = await issueAuthTokens(user);

    return {
        message: 'Login successful',
        ...tokens,
        user: sanitizeUser(user),
    };
};

const extractRefreshToken = (req: Request): string | null => {
    const { refreshToken, refresh_token } = req.body as {
        refreshToken?: string;
        refresh_token?: string;
    };

    const token = refreshToken || refresh_token;
    return typeof token === 'string' && token.trim() ? token.trim() : null;
};

const loginNormalAuthUser = async (identifier: string, password: string) => {
    const normalizedEmail = normalizeEmail(identifier);
    const user = await User.findOne({
        authMethod: 'normal_auth',
        'normalAuth.email': normalizedEmail,
    });

    if (!user?.normalAuth?.passwordHash) {
        return { user: null, error: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(password, user.normalAuth.passwordHash);
    if (!isMatch) {
        return { user: null, error: 'Invalid credentials' };
    }

    const statusError = assertActiveUser(user);
    if (statusError) {
        return { user: null, error: statusError, statusCode: 403 };
    }

    return { user };
};

const loginUitAuthUser = async (studentID: string, encryptedPassword: string) => {
    const secret = process.env.UIT_AUTH_SECRET;
    if (!secret) {
        throw new Error('UIT_AUTH_SECRET is not configured');
    }

    const authResult = await authenticateWithEncryptedPassword({
        username: normalizeUserId(studentID),
        encryptedPassword,
        secret,
    });

    const normalizedStudentId = authResult.studentId || authResult.username;
    let user = await User.findOne({
        authMethod: 'uit_auth',
        role: 'candidate',
        studentID: normalizedStudentId,
    });

    if (!user) {
        user = await User.create({
            role: 'candidate',
            authMethod: 'uit_auth',
            status: 'active',
            fullName: authResult.fullName || normalizedStudentId,
            studentID: normalizedStudentId,
            contactInfo: {
                email: buildUitEmail(normalizedStudentId),
                phone: null,
            },
        });

        return { user, uitProfile: authResult };
    }

    if (authResult.fullName && user.fullName !== authResult.fullName) {
        user.fullName = authResult.fullName;
    }

    if (user.contactInfo?.email) {
        user.contactInfo.email = user.contactInfo.email.trim().toLowerCase();
    }

    const statusError = assertActiveUser(user);
    if (statusError) {
        return { user: null, error: statusError, statusCode: 403 };
    }

    await user.save();
    return { user, uitProfile: authResult };
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const {
            userID,
            email,
            password,
            authMethod,
            type,
        } = req.body as {
            userID?: string;
            email?: string;
            password?: string;
            authMethod?: string;
            type?: string;
        };

        const identifier = userID || email;
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const loginMode = resolveLoginMode({ authMethod, type, userID, email });
        if (!loginMode) {
            return res.status(400).json({ message: 'Invalid auth method' });
        }

        if (loginMode === 'normal_auth') {
            const result = await loginNormalAuthUser(identifier, password);
            if (!result.user) {
                return res.status(result.statusCode || 401).json({ message: result.error });
            }

            return res.json(await buildLoginResponse(result.user));
        }

        const result = await loginUitAuthUser(identifier, password);
        if (!result.user) {
            return res.status(result.statusCode || 401).json({ message: result.error });
        }

        return res.json({
            ...(await buildLoginResponse(result.user)),
            uitProfile: {
                username: result.uitProfile?.username,
                fullName: result.uitProfile?.fullName,
                studentId: result.uitProfile?.studentId,
            },
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (error instanceof TypeError) {
            return res.status(400).json({ message: error.message });
        }

        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const auth = req.auth;
        if (!auth?.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(auth.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = extractRefreshToken(req);
        if (!refreshToken) {
            return res.status(400).json({ message: 'Missing refresh token' });
        }

        let payload: JwtPayload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        if (payload.type !== 'refresh' || !payload.sub) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const tokenValid = await deleteTempValueIfMatch(getRefreshTokenKey(refreshToken), String(payload.sub));
        if (!tokenValid) {
            return res.status(401).json({ message: 'Refresh token has been revoked' });
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const statusError = assertActiveUser(user);
        if (statusError) {
            return res.status(403).json({ message: statusError });
        }

        const issuedAtMs = getTokenIssuedAt(payload) * 1000;
        const passwordUpdatedAtMs = user.normalAuth?.passwordUpdatedAt?.getTime() ?? 0;
        if (issuedAtMs < passwordUpdatedAtMs) {
            return res.status(401).json({ message: 'Session has expired. Please log in again.' });
        }

        const tokens = await issueAuthTokens(user);
        return res.json({
            message: 'Token refreshed successfully',
            ...tokens,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const auth = req.auth;
        if (!auth?.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const refreshToken = extractRefreshToken(req);
        if (!refreshToken) {
            return res.status(400).json({ message: 'Missing refresh token' });
        }

        let payload: JwtPayload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        if (payload.type !== 'refresh' || !payload.sub) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        if (String(payload.sub) !== auth.userId) {
            return res.status(403).json({ message: 'Refresh token does not belong to the authenticated user' });
        }

        await deleteTempValue(getRefreshTokenKey(refreshToken));

        return res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


export const temporaryPasswordEncryption = async (req: Request, res: Response) => {
    try {
        const { password } = req.body as { password?: string };
        if (!password) {
            return res.status(400).json({ message: 'Missing password field' });
        }
        
        const secret = process.env.UIT_AUTH_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'UIT_AUTH_SECRET is not configured' });
        }

        const encryptedPassword = await encryptPassword(password, secret);
        return res.json({ encryptedPassword });
    } catch (error) {
        console.error('Password encryption error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

