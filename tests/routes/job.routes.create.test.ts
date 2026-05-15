import express from "express";
import request from "supertest";
import jobRoutes from "../../src/routes/job.routes";
import { createJobService } from "../../src/services/jobs.service";

jest.mock("../../src/middlewares/auth.middleware", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.auth = { userId: "user-1" };
    next();
  },
}));

jest.mock("../../src/middlewares/domain-authorization.middleware", () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/services/jobs.service", () => {
  class JobsServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  return {
    JobsServiceError,
    listJobs: jest.fn(),
    getJobById: jest.fn(),
    createJobService: jest.fn(),
    updateJobService: jest.fn(),
    deleteJobService: jest.fn(),
    publishJobService: jest.fn(),
    closeJobService: jest.fn(),
    listCandidates: jest.fn(),
    listJobApplicants: jest.fn(),
    getApplicantProfileByJob: jest.fn(),
    getCandidateApplicationsStatus: jest.fn(),
  };
});

describe("POST /api/jobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts requirements.skills from the client and delegates creation", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/jobs", jobRoutes);

    const payload = {
      basicInfo: {
        title: "Frontend Engineer",
        summary: "Build UI",
        jobDescription: "Build UI",
        roleType: "Frontend",
        headcount: 1,
        locations: ["Ho Chi Minh"],
        workModel: "Hybrid",
        level: "Fresher",
        jobType: "Full-time",
      },
      requirements: {
        skills: ["React", "Node.js"],
        requiredEducation: "Bachelor",
        minGpa: 7,
        requiredLanguages: ["English"],
        minMonthsExperience: 0,
        portfolioExpected: "GitHub",
      },
    };
    const createdJob = { _id: "job-1", requirements: { requiredSkills: ["skill-1", "skill-2"] } };
    (createJobService as jest.Mock).mockResolvedValue(createdJob);

    const response = await request(app).post("/api/jobs").send(payload);

    expect(response.status).toBe(201);
    expect(createJobService).toHaveBeenCalledWith("user-1", payload);
    expect(response.body).toEqual({
      message: "Create new job successfully",
      data: createdJob,
    });
  });
});
