import { Router } from 'express';
import {
    createEnrollment,
    getEnrollmentById,
    listMyEnrollments,
    updateEnrollmentProgress,
} from '../controllers/enrollment.controller';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { requireOwnership } from '../middlewares/domain-authorization.middleware';
import { Enrollment } from '../models/Enrollment';

const router = Router();

/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: List current user enrollments
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment list
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, listMyEnrollments);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}:
 *   get:
 *     summary: Get enrollment by id (owner only)
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment detail
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/:enrollmentId',
    requireAuth,
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const row = await Enrollment.findById(req.params.enrollmentId).select('userId').lean();
            return row ? String(row.userId) : null;
        },
    }),
    getEnrollmentById,
);

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Create enrollment for current user (published course only)
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Enrollment created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Course is not published
 */
router.post('/', requireAuth, createEnrollment);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/progress:
 *   patch:
 *     summary: Update enrollment progress (owner only)
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment progress updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Sequential progression violated (lesson locked)
 */
router.patch(
    '/:enrollmentId/progress',
    requireAuth,
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const row = await Enrollment.findById(req.params.enrollmentId).select('userId').lean();
            return row ? String(row.userId) : null;
        },
    }),
    updateEnrollmentProgress,
);

export default router;
