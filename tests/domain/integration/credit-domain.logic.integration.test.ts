import express from 'express';
import request from 'supertest';
import creditRoutes from '../../../src/routes/credit-transaction.routes';
import enrollmentRoutes from '../../../src/routes/enrollment.routes';
import orderRoutes from '../../../src/routes/order.routes';

jest.mock('../../../src/middlewares/auth.middleware', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        req.auth = { userId: 'owner-1', role: 'student', payload: {} };
        return next();
    },
}));

const courseFindById = jest.fn();
const lessonFind = jest.fn();
const enrollmentFind = jest.fn();
const enrollmentFindById = jest.fn();
const enrollmentCreate = jest.fn();

jest.mock('../../../src/models/Course', () => ({
    Course: {
        findById: (...args: any[]) => courseFindById(...args),
    },
}));

jest.mock('../../../src/models/Lesson', () => ({
    Lesson: {
        find: (...args: any[]) => lessonFind(...args),
    },
}));

jest.mock('../../../src/models/Enrollment', () => ({
    Enrollment: {
        find: (...args: any[]) => enrollmentFind(...args),
        findById: (...args: any[]) => enrollmentFindById(...args),
        create: (...args: any[]) => enrollmentCreate(...args),
    },
}));

const orderFind = jest.fn();
const orderFindById = jest.fn();
const orderCreate = jest.fn();
const orderFindByIdAndUpdate = jest.fn();

jest.mock('../../../src/models/Order', () => ({
    Order: {
        find: (...args: any[]) => orderFind(...args),
        findById: (...args: any[]) => orderFindById(...args),
        create: (...args: any[]) => orderCreate(...args),
        findByIdAndUpdate: (...args: any[]) => orderFindByIdAndUpdate(...args),
    },
}));

const creditGetBalance = jest.fn();
const creditCreateDebit = jest.fn();
const creditCreateTopup = jest.fn();
const creditFind = jest.fn();

jest.mock('../../../src/models/CreditTransaction', () => ({
    CreditTransaction: {
        getAvailableBalance: (...args: any[]) => creditGetBalance(...args),
        createDebit: (...args: any[]) => creditCreateDebit(...args),
        createTopup: (...args: any[]) => creditCreateTopup(...args),
        find: (...args: any[]) => creditFind(...args),
    },
}));

const ownerChain = (userId = 'owner-1') => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ userId }),
    }),
});

describe('credit domain logic flow', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/credit-transactions', creditRoutes);

    beforeEach(() => {
        jest.clearAllMocks();

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

        orderFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        orderCreate.mockResolvedValue({ _id: 'ord-1', status: 'pending' });
        orderFindById.mockReturnValue(ownerChain('owner-1'));
        orderFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'ord-1', status: 'paid' }) });

        creditGetBalance.mockResolvedValue(1000);
        creditCreateDebit.mockResolvedValue({ _id: 'tx-debit-1' });
        creditCreateTopup.mockResolvedValue({ _id: 'tx-topup-1', amount: 1000 });
        creditFind.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: 'tx-topup-1' }, { _id: 'tx-debit-1' }]),
            }),
        });
    });

    it('supports enroll -> progress -> paid order flow with credit side effects', async () => {
        enrollmentFindById
            .mockReturnValueOnce(ownerChain('owner-1'))
            .mockResolvedValueOnce({
                _id: 'en-1',
                lessonProgress: [{ lessonId: 'lesson-1', status: 'in-progress', lastPosition: 0, completedInteractions: [] }],
                save: jest.fn().mockResolvedValue(undefined),
            });

        const topup = await request(app)
            .post('/api/credit-transactions/topup')
            .set('Authorization', 'Bearer owner-token')
            .send({ amount: 1000 });

        const enroll = await request(app)
            .post('/api/enrollments')
            .set('Authorization', 'Bearer owner-token')
            .send({ courseId: 'course-1' });

        const progress = await request(app)
            .patch('/api/enrollments/en-1/progress')
            .set('Authorization', 'Bearer owner-token')
            .send({ lessonId: 'lesson-1', markCompleted: true, lastPosition: 120 });

        const order = await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer owner-token')
            .send({ items: [{ courseId: 'course-1', price: 300 }], totalAmount: 300 });

        creditGetBalance.mockResolvedValueOnce(700);
        const balance = await request(app)
            .get('/api/credit-transactions/balance')
            .set('Authorization', 'Bearer owner-token');

        expect(topup.status).toBe(201);
        expect(enroll.status).toBe(201);
        expect(progress.status).toBe(200);
        expect(order.status).toBe(201);
        expect(order.body.data.status).toBe('paid');
        expect(balance.status).toBe(200);
        expect(balance.body.data.balance).toBe(700);
    });

    it('rejects order creation when balance is insufficient', async () => {
        creditGetBalance.mockResolvedValueOnce(50);

        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer owner-token')
            .send({ items: [{ courseId: 'course-1', price: 300 }], totalAmount: 300 });

        expect(response.status).toBe(400);
        expect(creditCreateDebit).not.toHaveBeenCalled();
    });

    it('returns aggregated balance from credit endpoint', async () => {
        creditGetBalance.mockResolvedValueOnce(450);

        const response = await request(app)
            .get('/api/credit-transactions/balance')
            .set('Authorization', 'Bearer owner-token');

        expect(response.status).toBe(200);
        expect(response.body.data.balance).toBe(450);
    });
});
