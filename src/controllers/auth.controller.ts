import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import {
    AuthenticationError,
    authenticateWithEncryptedPassword,
} from 'uit-authenticator';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
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

const buildLoginResponse = (user: IUser) => ({
    message: 'Login successful',
    accessToken: generateAccessToken(String(user._id), user.role),
    refreshToken: generateRefreshToken(String(user._id)),
    user: sanitizeUser(user),
});

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

            return res.json(buildLoginResponse(result.user));
        }

        const result = await loginUitAuthUser(identifier, password);
        if (!result.user) {
            return res.status(result.statusCode || 401).json({ message: result.error });
        }

        return res.json({
            ...buildLoginResponse(result.user),
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
