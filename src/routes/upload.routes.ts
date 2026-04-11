import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getUploadUrl } from '../controllers/upload.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

const uploadRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' },
});

/**
 * @swagger
 * /api/uploads/get-upload-url:
 *   post:
 *     summary: Generate a Filebase pre-signed upload URL for direct browser uploads
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *               - courseId
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: lesson-intro.mp4
 *               fileType:
 *                 type: string
 *                 example: video/mp4
 *               courseId:
 *                 type: string
 *                 example: course_123
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *       400:
 *         description: Missing required input
 *       500:
 *         description: Server error while generating the signed URL
 */
router.post('/get-upload-url', uploadRateLimiter, requireAuth, getUploadUrl);

export default router;
