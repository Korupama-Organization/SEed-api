import { Router } from "express";
import {
  createCompany,
  deleteCompany,
  getCompany,
  updateCompany,
} from "../controllers/companies.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create company profile for newbie user
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             fullCompanyPayload:
 *               summary: Full company payload (all editable fields)
 *               value:
 *                 name: SEeds Technology
 *                 shortName: SEeds
 *                 logoUrl: https://seeds.example.com/logo.png
 *                 website: https://seeds.example.com
 *                 email: hr@seeds.example.com
 *                 phone: "0909123456"
 *                 address: Linh Trung Ward, Thu Duc City
 *                 description: Company profile for first-time recruiter team
 *                 location:
 *                   - address: Linh Trung Ward, Thu Duc City
 *                     city: Ho Chi Minh
 *                     country: Vietnam
 *                 workingEnvironment:
 *                   type: Hybrid
 *                   techStack:
 *                     - Node.js
 *                     - TypeScript
 *                     - MongoDB
 *                   benefits:
 *                     - Flexible time
 *                     - Laptop support
 *                 socialMediaLinks:
 *                   - platform: LinkedIn
 *                     url: https://www.linkedin.com/company/seeds-technology
 *                   - platform: Facebook
 *                     url: https://facebook.com/seeds.technology
 *                 recruitingPreferences:
 *                   targetRoles:
 *                     - Backend Developer
 *                     - QA Engineer
 *                   targetLevels:
 *                     - level: Intern
 *                     - level: Fresher
 *                   usingAIInterview: false
 *                   usingManualInterview: true
 *                 partnerStatus: inactive
 *             minimalPayload:
 *               summary: Minimal payload
 *               value:
 *                 name: SEeds Technology
 *                 website: https://seeds.example.com
 *                 address: Linh Trung Ward, Thu Duc City
 *                 description: Company profile for first-time recruiter team
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - website
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: SEeds Technology
 *               shortName:
 *                 type: string
 *                 example: SEeds
 *               logoUrl:
 *                 type: string
 *                 example: https://seeds.example.com/logo.png
 *               website:
 *                 type: string
 *                 example: https://seeds.example.com
 *               email:
 *                 type: string
 *                 example: hr@seeds.example.com
 *               phone:
 *                 type: string
 *                 example: "0909123456"
 *               address:
 *                 type: string
 *                 example: Linh Trung Ward, Thu Duc City
 *               description:
 *                 type: string
 *                 example: Company profile for first-time recruiter team
 *               location:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     country:
 *                       type: string
 *               workingEnvironment:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [On-site, Remote, Hybrid]
 *                   techStack:
 *                     type: array
 *                     items:
 *                       type: string
 *                   benefits:
 *                     type: array
 *                     items:
 *                       type: string
 *               socialMediaLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                       enum: [LinkedIn, Facebook, Twitter, GitHub, Zalo, Khác]
 *                     url:
 *                       type: string
 *               recruitingPreferences:
 *                 type: object
 *                 properties:
 *                   targetRoles:
 *                     type: array
 *                     items:
 *                       type: string
 *                   targetLevels:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                           enum: [Intern, Fresher]
 *                   usingAIInterview:
 *                     type: boolean
 *                   usingManualInterview:
 *                     type: boolean
 *               partnerStatus:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Company profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company profile created successfully
 *                 company:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     shortName:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     websiteUrl:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     description:
 *                       type: string
 *                     location:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                           city:
 *                             type: string
 *                           country:
 *                             type: string
 *                     workingEnvironment:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         techStack:
 *                           type: array
 *                           items:
 *                             type: string
 *                         benefits:
 *                           type: array
 *                           items:
 *                             type: string
 *                     socialMediaLinks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           platform:
 *                             type: string
 *                           url:
 *                             type: string
 *                     recruitingPreferences:
 *                       type: object
 *                       properties:
 *                         targetRoles:
 *                           type: array
 *                           items:
 *                             type: string
 *                         targetLevels:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               level:
 *                                 type: string
 *                         usingAIInterview:
 *                           type: boolean
 *                         usingManualInterview:
 *                           type: boolean
 *                     partnerStatus:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     __v:
 *                       type: number
 *             examples:
 *               createdCompany:
 *                 summary: Created company with full schema attributes
 *                 value:
 *                   message: Company profile created successfully
 *                   company:
 *                     _id: 6800c1a16541f34f61f7b111
 *                     name: SEeds Technology
 *                     shortName: SEeds Technology
 *                     logoUrl: ""
 *                     websiteUrl: https://seeds.example.com
 *                     email: hr@seeds.example.com
 *                     phone: "0909123456"
 *                     description: Company profile for first-time recruiter team
 *                     location:
 *                       - address: Linh Trung Ward, Thu Duc City
 *                         city: Unknown
 *                         country: Vietnam
 *                     workingEnvironment:
 *                       type: Hybrid
 *                       techStack:
 *                         - Node.js
 *                       benefits: []
 *                     socialMediaLinks:
 *                       - platform: LinkedIn
 *                         url: https://seeds.example.com
 *                     recruitingPreferences:
 *                       targetRoles:
 *                         - Backend Developer
 *                       targetLevels:
 *                         - level: Intern
 *                         - level: Fresher
 *                       usingAIInterview: false
 *                       usingManualInterview: true
 *                     partnerStatus: inactive
 *                     createdAt: 2026-04-16T08:00:00.000Z
 *                     updatedAt: 2026-04-16T08:00:00.000Z
 *                     __v: 0
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       409:
 *         description: User already belongs to a company or duplicate data
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, createCompany);

/**
 * @swagger
 * /api/companies/me:
 *   get:
 *     summary: Get current user's company profile
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User has not joined any company
 *       500:
 *         description: Server error
 */
router.get("/me", requireAuth, getCompany);

/**
 * @swagger
 * /api/companies/me:
 *   patch:
 *     summary: Update current user's company profile
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             updateBasicInfo:
 *               summary: Update basic company information
 *               value:
 *                 name: SEeds Technology Vietnam
 *                 shortName: SEeds VN
 *                 website: https://seeds.vn
 *                 email: talent@seeds.vn
 *                 phone: "0909123456"
 *                 address: Linh Trung, Thu Duc, Ho Chi Minh
 *                 description: Updated profile for campus recruiting season
 *                 partnerStatus: active
 *             updateWorkingEnvironmentOnly:
 *               summary: Partial update for nested working environment
 *               value:
 *                 workingEnvironment:
 *                   type: Hybrid
 *                   techStack:
 *                     - Node.js
 *                     - TypeScript
 *                     - MongoDB
 *             updateRecruitingPreferencesOnly:
 *               summary: Partial update for recruiting preferences
 *               value:
 *                 recruitingPreferences:
 *                   targetRoles:
 *                     - Backend Developer
 *                     - QA Engineer
 *                   targetLevels:
 *                     - level: Intern
 *                     - level: Fresher
 *                   usingAIInterview: true
 *                   usingManualInterview: true
 *           schema:
 *             type: object
 *             description: Partial update payload. Only send fields you want to change.
 *             properties:
 *               name:
 *                 type: string
 *                 example: SEeds Technology Vietnam
 *               shortName:
 *                 type: string
 *                 example: SEeds VN
 *               logoUrl:
 *                 type: string
 *                 example: https://seeds.vn/logo-new.png
 *               website:
 *                 type: string
 *                 example: https://seeds.vn
 *               email:
 *                 type: string
 *                 example: talent@seeds.vn
 *               phone:
 *                 type: string
 *                 example: "0909123456"
 *               address:
 *                 type: string
 *                 example: Linh Trung, Thu Duc, Ho Chi Minh
 *               description:
 *                 type: string
 *                 example: Updated profile for campus recruiting season
 *               location:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     country:
 *                       type: string
 *               workingEnvironment:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [On-site, Remote, Hybrid]
 *                   techStack:
 *                     type: array
 *                     items:
 *                       type: string
 *                   benefits:
 *                     type: array
 *                     items:
 *                       type: string
 *               socialMediaLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                       enum: [LinkedIn, Facebook, Twitter, GitHub, Zalo, Khác]
 *                     url:
 *                       type: string
 *               recruitingPreferences:
 *                 type: object
 *                 properties:
 *                   targetRoles:
 *                     type: array
 *                     items:
 *                       type: string
 *                   targetLevels:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                           enum: [Intern, Fresher]
 *                   usingAIInterview:
 *                     type: boolean
 *                   usingManualInterview:
 *                     type: boolean
 *               partnerStatus:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       200:
 *         description: Company profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 company:
 *                   type: object
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only manager can update company profile
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.patch("/me", requireAuth, updateCompany);

/**
 * @swagger
 * /api/companies/me:
 *   delete:
 *     summary: Delete current user's company profile
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only manager can delete company profile
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.delete("/me", requireAuth, deleteCompany);

export default router;
