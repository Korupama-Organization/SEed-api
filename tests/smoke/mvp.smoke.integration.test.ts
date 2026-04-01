import bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';
import authRoutes from '../../src/routes/auth.routes';
import creditRoutes from '../../src/routes/credit-transaction.routes';
import enrollmentRoutes from '../../src/routes/enrollment.routes';
import orderRoutes from '../../src/routes/order.routes';

jest.mock('bcrypt');

jest.mock('../../src/middlewares/auth-rate-limit.middleware', () => ({
    authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/middlewares/auth.middleware', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        req.auth = { userId: 'owner-1', role: 'student', payload: {} };
        return next();
    },
}));

const userFindOne = jest.fn();
const userFindById = jest.fn();

jest.mock('../../src/models/User', () => ({
    User: {
        findOne: (...args: any[]) => userFindOne(...args),
        findById: (...args: any[]) => userFindById(...args),
    },
}));

const courseFindById = jest.fn();
const lessonFind = jest.fn();
const enrollmentFind = jest.fn();
const enrollmentFindById = jest.fn();
const enrollmentCreate = jest.fn();

jest.mock('../../src/models/Course', () => ({
    Course: {
        findById: (...args: any[]) => courseFindById(...args),
    },
}));

jest.mock('../../src/models/Lesson', () => ({
    Lesson: {
        find: (...args: any[]) => lessonFind(...args),
    },
}));

jest.mock('../../src/models/Enrollment', () => ({
    Enrollment: {
        find: (...args: any[]) => enrollmentFind(...args),
        findById: (...args: any[]) => enrollmentFindById(...args),
        create: (...args: any[]) => enrollmentCreate(...args),
    },
}));

const orderCreate = jest.fn();
const orderFindByIdAndUpdate = jest.fn();
const orderFindById = jest.fn();

jest.mock('../../src/models/Order', () => ({
    Order: {
        create: (...args: any[]) => orderCreate(...args),
        findByIdAndUpdate: (...args: any[]) => orderFindByIdAndUpdate(...args),
        findById: (...args: any[]) => orderFindById(...args),
    },
}));

const creditGetBalance = jest.fn();
const creditCreateDebit = jest.fn();
const creditFind = jest.fn();

jest.mock('../../src/models/CreditTransaction', () => ({
    CreditTransaction: {
        getAvailableBalance: (...args: any[]) => creditGetBalance(...args),
        createDebit: (...args: any[]) => creditCreateDebit(...args),
        find: (...args: any[]) => creditFind(...args),
    },
}));

jest.mock('../../src/utils/redis', () => ({
    deleteTempValue: jest.fn(),
    existsTempValue: jest.fn().mockResolvedValue(false),
    getTempValue: jest.fn(),
    setTempValue: jest.fn(),
}));

jest.mock('../../src/utils/email', () => ({
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/utils/otp', () => ({
    generateOtpCode: jest.fn(() => '123456'),
}));

jest.mock('../../src/utils/jwt', () => ({
    generateAccessToken: jest.fn(() => 'access-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    generateResetPasswordToken: jest.fn(() => 'reset-token'),
    getTokenIssuedAt: jest.fn(() => 0),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    verifyResetPasswordToken: jest.fn(),
}));

describe('mvp smoke flow', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/credit-transactions', creditRoutes);

    beforeEach(() => {
        jest.clearAllMocks();

        userFindOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: 'user-1',
                role: 'student',
                password: 'hashed',
                emailVerified: true,
                isBlocked: false,
                toObject: () => ({ _id: 'user-1', role: 'student', password: 'hashed' }),
            }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        courseFindById.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: 'course-1', isPublished: true }),
        });
        lessonFind.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: 'lesson-1' }]),
            }),
        });

        enrollmentFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        enrollmentCreate.mockResolvedValue({ _id: 'en-1', lessonProgress: [{ lessonId: 'lesson-1', status: 'in-progress' }] });

        enrollmentFindById
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ userId: 'owner-1' }),
                }),
            })
            .mockResolvedValueOnce({
                _id: 'en-1',
                lessonProgress: [{ lessonId: 'lesson-1', status: 'in-progress', lastPosition: 0, completedInteractions: [] }],
                save: jest.fn().mockResolvedValue(undefined),
            });

        orderCreate.mockResolvedValue({ _id: 'ord-1', status: 'pending' });
        orderFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'ord-1', status: 'paid' }) });
        orderFindById.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({ userId: 'owner-1' }),
            }),
        });

        creditGetBalance.mockResolvedValue(1000);
        creditCreateDebit.mockResolvedValue({ _id: 'tx-1' });
        creditFind.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });
    });

    it('runs core auth and domain smoke flow', async () => {
        const login = await request(app).post('/api/auth/login').send({
            email: 'student@example.com',
            password: 'secret123',
        });

        const enroll = await request(app)
            .post('/api/enrollments')
            .set('Authorization', 'Bearer owner-token')
            .send({ courseId: 'course-1' });

        const progress = await request(app)
            .patch('/api/enrollments/en-1/progress')
            .set('Authorization', 'Bearer owner-token')
            .send({ lessonId: 'lesson-1', markCompleted: true, lastPosition: 90 });

        const order = await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer owner-token')
            .send({ items: [{ courseId: 'course-1', price: 200 }], totalAmount: 200 });

        creditGetBalance.mockResolvedValueOnce(800);
        const balance = await request(app)
            .get('/api/credit-transactions/balance')
            .set('Authorization', 'Bearer owner-token');

        expect(login.status).toBe(200);
        expect(login.body).toEqual(expect.objectContaining({ access_token: 'access-token' }));
        expect(enroll.status).toBe(201);
        expect(progress.status).toBe(200);
        expect(order.status).toBe(201);
        expect(order.body.data.status).toBe('paid');
        expect(balance.status).toBe(200);
        expect(balance.body.data.balance).toBe(800);
    });

    it('returns auth failure contract for protected endpoint without token', async () => {
        const response = await request(app).post('/api/enrollments').send({ courseId: 'course-1' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    });
});

