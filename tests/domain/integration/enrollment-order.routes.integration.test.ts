import express from 'express';
import request from 'supertest';
import enrollmentRoutes from '../../../src/routes/enrollment.routes';
import orderRoutes from '../../../src/routes/order.routes';

jest.mock('../../../src/middlewares/auth.middleware', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const token = header.slice(7);
        if (token === 'owner-token') {
            req.auth = { userId: 'owner-1', role: 'student', payload: {} };
            return next();
        }

        if (token === 'other-token') {
            req.auth = { userId: 'other-1', role: 'student', payload: {} };
            return next();
        }

        return res.status(401).json({ error: 'Authentication required.' });
    },
}));

const enrollmentFind = jest.fn();
const enrollmentFindById = jest.fn();
const enrollmentCreate = jest.fn();
const enrollmentFindByIdAndUpdate = jest.fn();

jest.mock('../../../src/models/Enrollment', () => ({
    Enrollment: {
        find: (...args: any[]) => enrollmentFind(...args),
        findById: (...args: any[]) => enrollmentFindById(...args),
        create: (...args: any[]) => enrollmentCreate(...args),
        findByIdAndUpdate: (...args: any[]) => enrollmentFindByIdAndUpdate(...args),
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

const makeChain = (result: any) => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(result),
    }),
    lean: jest.fn().mockResolvedValue(result),
});

describe('enrollment and order routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/orders', orderRoutes);

    beforeEach(() => {
        jest.clearAllMocks();

        enrollmentFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        enrollmentFindById.mockReturnValue(makeChain({ _id: 'en-1', userId: 'owner-1' }));
        enrollmentCreate.mockResolvedValue({ _id: 'en-1' });
        enrollmentFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'en-1' }) });

        orderFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        orderFindById.mockReturnValue(makeChain({ _id: 'ord-1', userId: 'owner-1' }));
        orderCreate.mockResolvedValue({ _id: 'ord-1' });
        orderFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'ord-1' }) });
    });

    it('rejects unauthenticated list endpoints', async () => {
        const e = await request(app).get('/api/enrollments');
        const o = await request(app).get('/api/orders');

        expect(e.status).toBe(401);
        expect(o.status).toBe(401);
    });

    it('forbids non-owner from reading enrollment and order', async () => {
        const e = await request(app)
            .get('/api/enrollments/en-1')
            .set('Authorization', 'Bearer other-token');
        const o = await request(app)
            .get('/api/orders/ord-1')
            .set('Authorization', 'Bearer other-token');

        expect(e.status).toBe(403);
        expect(o.status).toBe(403);
    });

    it('allows owner read and mutation flows', async () => {
        const getEnrollment = await request(app)
            .get('/api/enrollments/en-1')
            .set('Authorization', 'Bearer owner-token');

        const patchEnrollment = await request(app)
            .patch('/api/enrollments/en-1/progress')
            .set('Authorization', 'Bearer owner-token')
            .send({ overallProgress: 40 });

        const getOrder = await request(app)
            .get('/api/orders/ord-1')
            .set('Authorization', 'Bearer owner-token');

        const patchOrder = await request(app)
            .patch('/api/orders/ord-1/status')
            .set('Authorization', 'Bearer owner-token')
            .send({ status: 'paid' });

        expect(getEnrollment.status).toBe(200);
        expect(patchEnrollment.status).toBe(200);
        expect(getOrder.status).toBe(200);
        expect(patchOrder.status).toBe(200);
    });
});
