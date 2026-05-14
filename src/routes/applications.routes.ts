import { Router } from "express";
import {
  applyApplicationHandler,
  hireApplicationHandler,
  interviewApplicationHandler,
  offerApplicationHandler,
  secondInterviewApplicationHandler,
  shortlistApplicationHandler,
} from "../controllers/applications.controller";
import { getCandidateApplicationsStatusController } from "../controllers/jobs.controller";
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

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all jobs with candidate's application status
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Get candidate applications status successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       jobId:
 *                         type: string
 *                       jobInfo:
 *                         type: object
 *                         properties:
 *                           slug:
 *                             type: string
 *                           companyId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               logoUrl:
 *                                 type: string
 *                           basicInfo:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               roleType:
 *                                 type: string
 *                               headcount:
 *                                 type: number
 *                               locations:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               workModel:
 *                                 type: string
 *                               level:
 *                                 type: string
 *                               jobType:
 *                                 type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                       applicationStatus:
 *                         type: string
 *                         nullable: true
 *                         enum: [applied, screening_passed, ai_interview_completed, manual_interview_completed, offered, hired, null]
 *                         description: Latest application status, or null if not applied
 *                       applicationId:
 *                         type: string
 *                         nullable: true
 *                         description: Application ID if candidate has applied
 *                       appliedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Timestamp when candidate applied
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get("/", requireAuth, getCandidateApplicationsStatusController);

export default router;
