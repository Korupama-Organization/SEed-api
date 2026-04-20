import { Router } from "express";
import { updateMyCandidateProfile } from "../controllers/candidate-profile.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/domain-authorization.middleware";

const router = Router();

/**
 * @swagger
 * /api/candidate-profiles/me:
 *   patch:
 *     summary: Update almost full candidate profile
 *     description: Update fields in candidate_profiles for authenticated candidate.
 *     tags: [CandidateProfile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CandidateProfilePatchRequest'
 *           examples:
 *             full:
 *               summary: Update almost full candidate profile
 *               value:
 *                 academicInfo:
 *                   university: University of Information Technology
 *                   major: Computer Science
 *                   graduationYear: 2027
 *                   gpa: 3.4
 *                 languages:
 *                   - certificateName: IELTS
 *                     score: 7
 *                     issuedAt: 2024-01-01T00:00:00.000Z
 *                     expiresAt: 2026-01-01T00:00:00.000Z
 *                 achievements:
 *                   - title: Top 10 Hackathon 2025
 *                     achievedAt: 2025-10-01T00:00:00.000Z
 *                 advantagePoint: Fast learner and strong ownership mindset
 *                 technicalSkills:
 *                   - category: Framework
 *                     name: React
 *                     yearsOfExperience: 2
 *                     confidence: true
 *                   - category: Ngôn ngữ lập trình
 *                     name: .NET
 *                     yearsOfExperience: 2
 *                     confidence: true
 *                 softSkills:
 *                   - Communication
 *                   - Teamwork
 *                   - Problem solving
 *                 projects:
 *                   - name: E-learning Platform
 *                     description: Build LMS backend with Node.js and MongoDB
 *                     technologies:
 *                       - Node.js
 *                       - TypeScript
 *                       - MongoDB
 *                     role: Backend Developer
 *                     contribution: Designed API and database schema
 *                     startDate: 2025-01-01T00:00:00.000Z
 *                     endDate: 2025-06-01T00:00:00.000Z
 *                     teamSize: 4
 *                     repositoryUrl: https://github.com/example/
 *                 workExperiences:
 *                   - companyName: SEeds Tech
 *                     position: Intern Backend Developer
 *                     startDate: 2025-07-01T00:00:00.000Z
 *                     endDate: 2025-09-01T00:00:00.000Z
 *                     description: Implemented REST APIs and unit tests
 *                     technologiesUsed:
 *                       - Express
 *                       - MongoDB
 *                       - Jest
 *                 introductionQuestions:
 *                   preferredRoles:
 *                     - preferredRole: Backend
 *                     - preferredRole: Fullstack
 *                   whyTheseRoles: I enjoy solving system design and API problems.
 *                   futureGoals: Become a senior backend engineer in 3 years.
 *                   favoriteTechnology: TypeScript
 *     responses:
 *       200:
 *         description: Candidate profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CandidateProfilePatchResponse'
 *       400:
 *         description: Invalid payload, unknown fields, or schema validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Candidate profile not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/me",
  requireAuth,
  requireRole("candidate"),
  updateMyCandidateProfile,
);

export default router;
