import { Job, IJob } from "../models/Job";
import { JobBasicDto } from "../dto/get-job.dto";

interface JobsQuery {
  page?: string;
  limit?: string;
}


interface ListJobsResult {
  jobs: JobBasicDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class JobsServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const listJobs = async (
  query: JobsQuery,
): Promise<ListJobsResult> => {
  const pageNum = parseInt(query.page || "1", 10);
  const limitNum = parseInt(query.limit || "10", 10);
  const skip = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    Job.find()
      .select("companyId basicInfo status createdAt updatedAt")
      .populate("companyId", "name logoUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Job.countDocuments(),
  ]);

  const jobBasic: JobBasicDto[] = jobs.map((job: any) => ({
    id: job._id.toString(),
    slug: `/api/jobs/${job._id}`,
    companyId: {
      _id: job.companyId?._id?.toString() || "",
      name: job.companyId?.name || "",
      logoUrl: job.companyId?.logoUrl,
    },
    basicInfo: {
      title: job.basicInfo?.title || "",
      description: job.basicInfo?.description || "",
      roleType: job.basicInfo?.roleType || "",
    },
    location: (job.basicInfo?.locations && job.basicInfo.locations.length > 0) ? job.basicInfo.locations[0] : "Chưa cập nhật",
    workModel: job.basicInfo?.workModel || "",
    level: job.basicInfo?.level || "",
    jobType: job.basicInfo?.jobType || "",
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }));

  return {
    jobs: jobBasic,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getJobById = async (id: string): Promise<IJob> => {
  const job = await Job.findById(id)
    .populate("companyId", "name logoUrl websiteUrl description location email phone workingEnvironment socialMediaLinks")
    .populate("createdBy", "fullName avatarUrl")
    .populate({
      path: "requirements.requiredSkills",
      select: "skill_name",
    })
    .populate({
      path: "requirements.preferredSkills",
      select: "skill_name",
    })
    .lean();

  if (!job) {
    throw new JobsServiceError("Job not found", 404);
  }

  return job as unknown as IJob;
};