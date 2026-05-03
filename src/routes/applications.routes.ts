import { Router } from "express";
import {
  applyApplicationHandler,
  hireApplicationHandler,
  interviewApplicationHandler,
  offerApplicationHandler,
  secondInterviewApplicationHandler,
  shortlistApplicationHandler,
} from "../controllers/applications.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create a new application
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateUserId
 *               - jobId
 *             properties:
 *               candidateUserId:
 *                 type: string
 *                 example: 6800c1a16541f34f61f7b111
 *               jobId:
 *                 type: string
 *                 example: 6800c1a16541f34f61f7b222
 *               note:
 *                 type: string
 *                 example: Candidate applied via landing page
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, applyApplicationHandler);

/**
 * @swagger
 * /api/applications/{id}/shortlist:
 *   patch:
 *     summary: CV screening for an application
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6800c1a16541f34f61f7b999
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               screeningResults:
 *                 type: object
 *                 properties:
 *                   resumeScreening:
 *                     type: string
 *                     enum: [not_started, processing, passed, failed, manual_override]
 *                   matchedSkills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   missingSkills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   score:
 *                     type: number
 *                   evaluatedAt:
 *                     type: string
 *                     format: date-time
 *                   evaluatedBy:
 *                     type: string
 *               note:
 *                 type: string
 *                 example: Screening passed by recruiter
 *     responses:
 *       200:
 *         description: Application shortlisted successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/shortlist", requireAuth, shortlistApplicationHandler);

/**
 * @swagger
 * /api/applications/{id}/interview:
 *   patch:
 *     summary: Complete first interview
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6800c1a16541f34f61f7b999
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: First interview completed
 *     responses:
 *       200:
 *         description: Application moved to first interview successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/interview", requireAuth, interviewApplicationHandler);

/**
 * @swagger
 * /api/applications/{id}/interview-2:
 *   patch:
 *     summary: Complete second interview
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6800c1a16541f34f61f7b999
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: Second interview completed
 *     responses:
 *       200:
 *         description: Application moved to second interview successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id/interview-2",
  requireAuth,
  secondInterviewApplicationHandler,
);

/**
 * @swagger
 * /api/applications/{id}/offer:
 *   patch:
 *     summary: Offer an application
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6800c1a16541f34f61f7b999
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: Offer approved by HR manager
 *     responses:
 *       200:
 *         description: Application offered successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/offer", requireAuth, offerApplicationHandler);

/**
 * @swagger
 * /api/applications/{id}/hire:
 *   patch:
 *     summary: Hire an application
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6800c1a16541f34f61f7b999
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: Candidate accepted the offer
 *     responses:
 *       200:
 *         description: Application hired successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/hire", requireAuth, hireApplicationHandler);

export default router;
