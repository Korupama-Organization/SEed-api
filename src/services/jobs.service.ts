import { Job, IJob } from "../models/Job";
import { JobBasicDto } from "../dto/get-job.dto";
import { CompanyMember } from "../models/CompanyMember";
import { CreateJobDto } from "../dto/create-job.dto";
import { UpdateJobDto } from "../dto/update-job.dto";
import { Types } from "mongoose";

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
      summary: job.basicInfo?.summary || "",
      jobDescription: job.basicInfo?.jobDescription || "",
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

export const createJobService = async (
  userId: string,
  data: CreateJobDto
): Promise<IJob> => {
  const companyMember = await CompanyMember.findOne({ userId }).lean();

  // check account is member of company
  if (!companyMember) {
    throw new JobsServiceError("Tài khoản không là thành viên của công ty nào, không thể tạo job.", 403);
  }

  // check role and permission
  const isRecruiter = companyMember.membershipRole === 'recruiter'; // role 'recruiter'
  const hasCreatePermission = companyMember.permission?.canCreateJob;

  if (!isRecruiter || !hasCreatePermission) {
    throw new JobsServiceError("Vai trò hoặc quyền của bạn không thể tạo job", 403);
  }

  const newJob = new Job({
    companyId: companyMember.companyId,
    createdBy: userId,
    basicInfo: data.basicInfo,
    requirements: data.requirements,
    status: 'published',
  });

  await newJob.save();

  return newJob;
};

export const updateJobService = async (
  userId: string,
  jobId: string,
  jobData: UpdateJobDto
): Promise<IJob> => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new JobsServiceError("Job ID không hợp lệ", 400);
  }

  const existingJob = await Job.findById(jobId).lean();
  if (!existingJob) {
    throw new JobsServiceError("Job không tồn tại", 404);
  }

  if (existingJob.createdBy.toString() !== userId) {
    throw new JobsServiceError("Bạn không có quyền cập nhật job này", 403);
  }

  const updateData: any = {};
  if (jobData.basicInfo) {
    updateData.basicInfo = { ...existingJob.basicInfo, ...jobData.basicInfo };
  }
  if (jobData.requirements) {
    updateData.requirements = { ...existingJob.requirements, ...jobData.requirements };
  }

  if (Object.keys(updateData).length === 0) {
    throw new JobsServiceError("Không có dữ liệu để cập nhật", 400);
  }

  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    { $set: updateData },
    { 
      new: true, 
      runValidators: true, 
      context: "query" 
    }
  );

  if (!updatedJob) {
    throw new JobsServiceError("Cập nhật job thất bại", 400);
  }

  return updatedJob;
};

export const deleteJobService = async (
  userId: string,
  jobId: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new JobsServiceError("Job ID không hợp lệ", 400);
  }

  const existingJob = await Job.findById(jobId).lean();
  if (!existingJob) {
    throw new JobsServiceError("Job không tồn tại", 404);
  }

  if (existingJob.createdBy.toString() !== userId) {
    throw new JobsServiceError("Bạn không có quyền xóa job này", 403);
  }

  const deletedJob = await Job.findByIdAndDelete(jobId);
  if (!deletedJob) {
    throw new JobsServiceError("Xóa job thất bại", 400);
  }
};