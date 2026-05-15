import { Types } from "mongoose";
import { CompanyMember } from "../../src/models/CompanyMember";
import { Counter } from "../../src/models/Counter";
import { Job } from "../../src/models/Job";
import { createJobService } from "../../src/services/jobs.service";
import { resolveSkillIds } from "../../src/services/skill-resolution.service";

jest.mock("../../src/models/CompanyMember", () => ({
  CompanyMember: {
    findOne: jest.fn(),
  },
}));

jest.mock("../../src/models/Counter", () => ({
  Counter: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock("../../src/models/Job", () => ({
  Job: jest.fn(),
}));

jest.mock("../../src/services/skill-resolution.service", () => ({
  resolveSkillIds: jest.fn(),
}));

describe("createJobService skill resolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves requirements.skills alias into ObjectIds before saving the job", async () => {
    const userId = new Types.ObjectId().toString();
    const companyId = new Types.ObjectId();
    const reactId = new Types.ObjectId();
    const nodeId = new Types.ObjectId();
    const savedJobs: any[] = [];

    (CompanyMember.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        companyId,
        membershipRole: "recruiter",
        permission: { canCreateJob: true },
      }),
    });
    (Counter.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ seq: 1 }),
    });
    (Job as unknown as jest.MockedFunction<any>).exists = jest.fn().mockResolvedValue(null);
    (Job as unknown as jest.Mock).mockImplementation((payload) => ({
      ...payload,
      save: jest.fn().mockImplementation(async function save(this: any) {
        savedJobs.push(this);
      }),
    }));
    (resolveSkillIds as jest.Mock).mockResolvedValue([reactId, nodeId]);

    await createJobService(userId, {
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
        requiredSkills: [],
        preferredSkills: [],
        requiredEducation: "Bachelor",
        minGpa: 7,
        requiredLanguages: ["English"],
        minMonthsExperience: 0,
        portfolioExpected: "GitHub",
      },
    } as any);

    expect(resolveSkillIds).toHaveBeenCalledWith(["React", "Node.js"]);
    expect(savedJobs[0].requirements.requiredSkills).toEqual([reactId, nodeId]);
    expect(savedJobs[0].requirements).not.toHaveProperty("skills");
  });
});
