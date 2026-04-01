import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import authRoutes from '../../../src/routes/auth.routes';
import { User } from '../../../src/models/User';

jest.mock('../../../src/middlewares/auth-rate-limit.middleware', () => ({
    authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../../src/models/User', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndDelete: jest.fn(),
        findById: jest.fn(),
    },
}));

jest.mock('bcrypt');

jest.mock('../../../src/utils/redis', () => ({
    deleteTempValue: jest.fn(),
    existsTempValue: jest.fn().mockResolvedValue(false),
    getTempValue: jest.fn(),
    setTempValue: jest.fn(),
}));

jest.mock('../../../src/utils/email', () => ({
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/utils/otp', () => ({
    generateOtpCode: jest.fn(() => '123456'),
}));

jest.mock('../../../src/utils/jwt', () => ({
    generateAccessToken: jest.fn(() => 'access-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    generateResetPasswordToken: jest.fn(() => 'reset-token'),
    getTokenIssuedAt: jest.fn(() => 0),
    verifyRefreshToken: jest.fn(),
    verifyResetPasswordToken: jest.fn(),
}));

describe('auth routes integration', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 for register with missing fields', async () => {
        const response = await request(app).post('/api/auth/register').send({ email: 'x@y.com' });
        expect(response.status).toBe(400);
    });

    it('returns 403 for register with admin role', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Admin User',
                email: 'admin@x.com',
                phone: '0123456789',
                password: 'secret123',
                role: 'admin',
            });

        expect(response.status).toBe(403);
    });

    it('returns 200 for login success path', async () => {
        const fakeUser: any = {
            _id: 'u-1',
            role: 'student',
            password: 'hashed',
            emailVerified: true,
            isBlocked: false,
            toObject: () => ({ _id: 'u-1', role: 'student', password: 'hashed' }),
        };

        (User.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue(fakeUser),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const response = await request(app).post('/api/auth/login').send({
            email: 'student@example.com',
            password: 'secret123',
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                access_token: 'access-token',
                refresh_token: 'refresh-token',
            }),
        );
    });

    it('returns 400 for refresh without token', async () => {
        const response = await request(app).post('/api/auth/refresh').send({});
        expect(response.status).toBe(400);
    });

    it('returns 400 for forgot-password without email', async () => {
        const response = await request(app).post('/api/auth/forgot-password').send({});
        expect(response.status).toBe(400);
    });
});
