import { Router } from "express";
import { 
  getListJobs, 
  getListCandidates,
  getJobDetail, 
  createJobController, 
  updateJobController, 
  deleteJobController,
  publishJobController,
  closeJobController,
  getJobApplicants,
  getApplicantProfileByJobController,
} from '../controllers/jobs.controller';

import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/domain-authorization.middleware";

const router = Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs with pagination
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Get list jobs successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get list jobs successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       companyId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           logoUrl:
 *                             type: string
 *                       basicInfo:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           roleType:
 *                             type: string
 *                       location:
 *                         type: string
 *                       workModel:
 *                         type: string
 *                       level:
 *                         type: string
 *                       jobType:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                   example:
 *                     - id: "69e482591f19b056ccbeb2be"
 *                       slug: "/api/jobs/69e482591f19b056ccbeb2be"
 *                       companyId:
 *                         _id: "69da0e4f7228caa78a03750a"
 *                         name: "Công ty Cổ phần VNG"
 *                         logoUrl: "https://storage.seeds.vn/logos/vng.png"
 *                       basicInfo:
 *                         title: "Data Engineer"
 *                         description: "Thiết kế và vận hành pipeline dữ liệu, xử lý dữ liệu lớn và hỗ trợ xây dựng hệ thống phục vụ phân tích dữ liệu."
 *                         roleType: "data"
 *                       location: "Hà Nội"
 *                       workModel: "hybrid"
 *                       level: "junior"
 *                       jobType: "full-time"
 *                       status: "published"
 *                       createdAt: "2026-04-19T07:20:57.414Z"
 *                       updatedAt: "2026-04-19T07:20:57.414Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                   example:
 *                     page: 1
 *                     limit: 10
 *                     total: 3
 *                     totalPages: 1
 *       500:
 *         description: Server error
 */
router.get("/", getListJobs);

/**
 * @swagger
 * /api/jobs/candidates:
 *   get:
 *     summary: List candidates for recruiters
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasProfile
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: major
 *         schema:
 *           type: string
 *       - in: query
 *         name: university
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get list candidates successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 */
router.get("/candidates", requireAuth, requireRole("recruiter"), getListCandidates);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Get job details successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get job details successfully"
 *                 data:
 *                   type: object
 *                   example:
 *                     _id: "69e482591f19b056ccbeb2bd"
 *                     companyId:
 *                       _id: "69da0e4f7228caa78a03750a"
 *                       name: "Công ty Cổ phần VNG"
 *                       logoUrl: "https://storage.seeds.vn/logos/vng.png"
 *                       websiteUrl: "https://vng.com.vn"
 *                       email: "tuyendung@vng.com.vn"
 *                       phone: "0283xxx"
 *                       description: "VNG là công ty công nghệ hàng đầu, tập trung vào game, zalo, payment... Kỳ lân công nghệ đầu tiên tại Việt Nam."
 *                       location:
 *                         - address: "Z06 Đường số 13, Quận 7"
 *                           city: "TP.HCM"
 *                           country: "Việt Nam"
 *                         - address: "Chi nhánh Hà Nội"
 *                           city: "Hà Nội"
 *                           country: "Việt Nam"
 *                       workingEnvironment:
 *                         type: "Hybrid"
 *                         techStack: ["Golang", "Java", "ReactJS", "Kubernetes"]
 *                         benefits: ["Macbook", "Gym", "Bảo hiểm sức khỏe"]
 *                       socialMediaLinks:
 *                         - platform: "Facebook"
 *                           url: "https://facebook.com/VNGRecruitment"
 *                         - platform: "LinkedIn"
 *                           url: "https://linkedin.com/company/vng"
 *                     createdBy: null
 *                     basicInfo:
 *                       title: "Game Developer"
 *                       description: "Tham gia phát triển gameplay, xây dựng cơ chế game và tối ưu hiệu năng cho các dự án game 2D/3D."
 *                       roleType: "game"
 *                       headcount: 2
 *                       locations: ["Đà Nẵng"]
 *                       workModel: "onsite"
 *                       level: "junior"
 *                       jobType: "full-time"
 *                     requirements:
 *                       requiredSkills:
 *                         - _id: "69e47d46b45b1bb5e5f91333"
 *                           skill_name: "Unity"
 *                         - _id: "69e47d46b45b1bb5e5f9130a"
 *                           skill_name: "C#"
 *                         - _id: "69e482581f19b056ccbeb2b5"
 *                           skill_name: "Gameplay Programming"
 *                       preferredSkills:
 *                         - _id: "69e482581f19b056ccbeb2b6"
 *                           skill_name: "Blender"
 *                         - _id: "69e482581f19b056ccbeb2b7"
 *                           skill_name: "OpenGL"
 *                         - _id: "69e47d46b45b1bb5e5f91309"
 *                           skill_name: "C++"
 *                         - _id: "69e47d46b45b1bb5e5f9135f"
 *                           skill_name: "Git"
 *                       requiredEducation: "Sinh viên năm cuối hoặc đã tốt nghiệp ngành CNTT / Game Development / Software Engineering"
 *                       minGpa: 2.7
 *                       requiredLanguages: ["Tiếng Anh đọc hiểu tài liệu"]
 *                       minMonthsExperience: 6
 *                       portfolioExpected: "Có GitHub hoặc build demo game cá nhân/nhóm"
 *                     status: "published"
 *                     createdAt: "2026-04-19T07:20:57.016Z"
 *                     updatedAt: "2026-04-19T07:20:57.016Z"
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get("/:id", requireAuth, getJobDetail);

/**
 * @swagger
 * /api/jobs/{id}/applicants:
 *   get:
 *     summary: List candidates applied to a job
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get job applicants successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
router.get("/:id/applicants", requireAuth, requireRole("recruiter"), getJobApplicants);

/**
 * @swagger
 * /api/jobs/{id}/applicants/profile:
 *   get:
 *     summary: Get applicant profile by job
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: applicationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: candidateUserId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get applicant profile successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application or profile not found
 */
router.get("/:id/applicants/profile", requireAuth, requireRole("recruiter"), getApplicantProfileByJobController);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               basicInfo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   summary:
 *                     type: string
 *                   jobDescription:
 *                     type: string
 *                   roleType:
 *                     type: string
 *                   headcount:
 *                     type: number
 *                   locations:
 *                     type: array
 *                     items:
 *                       type: string
 *                   workModel:
 *                     type: string
 *                   level:
 *                     type: string
 *                   jobType:
 *                     type: string
 *               requirements:
 *                 type: object
 *                 properties:
 *                   requiredSkills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   preferredSkills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   requiredEducation:
 *                     type: string
 *                   minGpa:
 *                     type: number
 *                   requiredLanguages:
 *                     type: array
 *                     items:
 *                       type: string
 *                   minMonthsExperience:
 *                     type: number
 *                   portfolioExpected:
 *                     type: string
 *     responses:
 *       201:
 *         description: Create job successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden - Only recruiter with permission can create job
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, requireRole("recruiter"), createJobController); 

router.patch("/:id", requireAuth, requireRole("recruiter"), updateJobController);

router.delete("/:id", requireAuth, requireRole("recruiter"), deleteJobController);

router.patch("/:id/publish", requireAuth, requireRole("recruiter"), publishJobController);

router.patch("/:id/close", requireAuth, requireRole("recruiter"), closeJobController);

export default router;