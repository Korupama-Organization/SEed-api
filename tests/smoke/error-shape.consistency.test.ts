import express from 'express';
import request from 'supertest';
import authRoutes from '../../src/routes/auth.routes';
import enrollmentRoutes from '../../src/routes/enrollment.routes';
import orderRoutes from '../../src/routes/order.routes';

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

const orderCreate = jest.fn();
const orderFindByIdAndUpdate = jest.fn();

jest.mock('../../src/models/Order', () => ({
    Order: {
        create: (...args: any[]) => orderCreate(...args),
        findByIdAndUpdate: (...args: any[]) => orderFindByIdAndUpdate(...args),
        findById: jest.fn(),
        find: jest.fn(),
    },
}));

const creditGetBalance = jest.fn();

jest.mock('../../src/models/CreditTransaction', () => ({
    CreditTransaction: {
        getAvailableBalance: (...args: any[]) => creditGetBalance(...args),
        createDebit: jest.fn(),
    },
}));

describe('error shape consistency', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/orders', orderRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        orderCreate.mockResolvedValue({ _id: 'ord-1', status: 'pending' });
        orderFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'ord-1' }) });
    });

    it('returns { error: string } for auth validation failure', async () => {
        const response = await request(app).post('/api/auth/login').send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    });

    it('returns { error: string } for missing auth token', async () => {
        const response = await request(app).post('/api/enrollments').send({ courseId: 'course-1' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    });

    it('returns { error: string } and 400 for insufficient credit balance', async () => {
        creditGetBalance.mockResolvedValueOnce(10);

        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer owner-token')
            .send({ items: [{ courseId: 'course-1', price: 200 }], totalAmount: 200 });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    });
});
