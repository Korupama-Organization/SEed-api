import express from 'express';
import request from 'supertest';
import enrollmentRoutes from '../../../src/routes/enrollment.routes';

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

const ownerChain = (userId = 'owner-1') => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ userId }),
    }),
});

describe('enrollment progress domain logic', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/enrollments', enrollmentRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        enrollmentFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    });

    it('creates enrollment with lessonProgress initialized for published courses', async () => {
        courseFindById.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: 'course-1', isPublished: true }),
        });
        lessonFind.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: 'lesson-1' }, { _id: 'lesson-2' }]),
            }),
        });
        enrollmentCreate.mockResolvedValue({
            _id: 'en-1',
            lessonProgress: [
                { lessonId: 'lesson-1', status: 'in-progress' },
                { lessonId: 'lesson-2', status: 'locked' },
            ],
        });

        const response = await request(app)
            .post('/api/enrollments')
            .set('Authorization', 'Bearer owner-token')
            .send({ courseId: 'course-1' });

        expect(response.status).toBe(201);
        expect(response.body.data.lessonProgress[0].status).toBe('in-progress');
        expect(response.body.data.lessonProgress[1].status).toBe('locked');
    });

    it('rejects enrollment for unpublished course with 403', async () => {
        courseFindById.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: 'course-1', isPublished: false }),
        });

        const response = await request(app)
            .post('/api/enrollments')
            .set('Authorization', 'Bearer owner-token')
            .send({ courseId: 'course-1' });

        expect(response.status).toBe(403);
    });

    it('rejects progress updates that skip locked lessons', async () => {
        enrollmentFindById
            .mockReturnValueOnce(ownerChain('owner-1'))
            .mockResolvedValueOnce({
                _id: 'en-1',
                lessonProgress: [
                    { lessonId: 'lesson-1', status: 'in-progress', lastPosition: 0, completedInteractions: [] },
                    { lessonId: 'lesson-2', status: 'locked', lastPosition: 0, completedInteractions: [] },
                ],
                save: jest.fn().mockResolvedValue(undefined),
            });

        const response = await request(app)
            .patch('/api/enrollments/en-1/progress')
            .set('Authorization', 'Bearer owner-token')
            .send({ lessonId: 'lesson-2', markCompleted: true });

        expect(response.status).toBe(409);
        expect(response.body.error).toMatch(/locked/i);
    });
});
