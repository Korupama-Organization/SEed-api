import { Router } from 'express';
import { saveScormCourseDraft } from '../controllers/course.controller';

const router = Router();

/**
 * @swagger
 * /api/courses/scorm-drafts:
 *   post:
 *     summary: Save a SCORM course draft after direct file uploads complete
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: SCORM course saved successfully
 *       400:
 *         description: Missing required input
 *       500:
 *         description: Server error while saving the SCORM course
 */
router.post('/scorm-drafts', saveScormCourseDraft);

export default router;
