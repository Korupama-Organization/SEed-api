import { Job, IJob } from "../models/Job";
import { JobBasicDto } from "../dto/get-job.dto";
import { CompanyMember } from "../models/CompanyMember";
import { CreateJobDto } from "../dto/create-job.dto";
import { UpdateJobDto } from "../dto/update-job.dto";
import { Types } from "mongoose";
import { User } from "../models/User";
import { CandidateProfile } from "../models/CandidateProfile";
import { Application, IApplication } from "../models/Application";
import { Counter } from "../models/Counter";

interface JobsQuery {
  page?: string;
  limit?: string;
}

interface CandidateListQuery extends JobsQuery {
  search?: string;
  status?: string;
  hasProfile?: string;
  major?: string;
  university?: string;
}

interface ApplicantsQuery extends JobsQuery {
  search?: string;
}

type JobStatus = "draft" | "published" | "closed" | "archived" | "open";

interface ListJobsResult {
  jobs: JobBasicDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ListCandidatesResult {
  candidates: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface JobApplicantsResult {
  applicants: Array<Record<string, unknown>>;
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

const parsePositiveInteger = (value: string | undefined, defaultValue: number, fieldName: string): number => {
  const parsed = parseInt(value || `${defaultValue}`, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new JobsServiceError(`${fieldName} phải là số nguyên dương`, 400);
  }

  return parsed;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildRegex = (value: string): RegExp => {
  return new RegExp(escapeRegex(value.trim()), "i");
};

const parseBooleanQuery = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new JobsServiceError("hasProfile phải là true hoặc false", 400);
};

const getLatestApplicationStatus = (application: IApplication): string => {
  return (
    application.applicationStatus?.[application.applicationStatus.length - 1]
      ?.status || ""
  );
const JOB_SLUG_COUNTER_KEY = "jobSlug";

export const formatJobSlug = (sequence: number): string => `JOB-${sequence.toString().padStart(3, "0")}`;

const getNextJobSlug = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { key: JOB_SLUG_COUNTER_KEY },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  return formatJobSlug(counter.seq);
};

const isDuplicateKeyError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const mongoError = error as Error & { code?: number };
  return mongoError.code === 11000;
};

const createUniqueJobSlug = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = await getNextJobSlug();
    const existingJob = await Job.exists({ slug });
    if (!existingJob) {
      return slug;
    }
  }

  throw new JobsServiceError("Không thể tạo mã job duy nhất", 500);
};

const mapJobToBasicDto = (job: any): JobBasicDto => ({
  id: job._id.toString(),
  slug: job.slug || job._id.toString(),
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
});

const mapJobDetail = (job: any) => ({
  ...job,
  slug: job.slug || job._id.toString(),
});

const createJobDocument = async (
  payload: {
    companyId: Types.ObjectId;
    createdBy: Types.ObjectId;
    basicInfo: CreateJobDto["basicInfo"];
    requirements: CreateJobDto["requirements"];
    status: JobStatus;
  },
): Promise<IJob> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = await createUniqueJobSlug();
    try {
      const newJob = new Job({
        ...payload,
        slug,
      });
      await newJob.save();
      return newJob;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }

  throw new JobsServiceError("Không thể tạo job mới", 500);
};

const assertJobAccess = async (
  userId: string,
  job: IJob,
  options: { actionLabel: string; requirePermission?: "canUpdateJob" | "canDeleteJob" }
): Promise<void> => {
  if (job.createdBy.toString() !== userId) {
    throw new JobsServiceError(`Bạn không có quyền ${options.actionLabel} job này`, 403);
  }

  const companyMember = await CompanyMember.findOne({
    userId,
    companyId: job.companyId,
  }).lean();

  if (!companyMember) {
    throw new JobsServiceError("Bạn không thuộc công ty của job này", 403);
  }

  if (options.requirePermission && !companyMember.permission?.[options.requirePermission]) {
    throw new JobsServiceError(`Bạn không có quyền ${options.actionLabel} job`, 403);
  }
};

const assertApplicationViewerAccess = async (
  userId: string,
  job: IJob,
): Promise<void> => {
  const companyMember = await CompanyMember.findOne({
    userId,
    companyId: job.companyId,
  }).lean();

  if (!companyMember) {
    throw new JobsServiceError("Bạn không thuộc công ty của job này", 403);
  }

  if (!companyMember.permission?.canViewApplications) {
    throw new JobsServiceError("Bạn không có quyền xem danh sách ứng viên", 403);
  }
};

const assertCandidateViewerAccess = async (
  userId: string,
): Promise<Types.ObjectId[]> => {
  const companyMembers = await CompanyMember.find({
    userId,
    "permission.canViewApplications": true,
  })
    .select("companyId")
    .lean();

  if (companyMembers.length === 0) {
    throw new JobsServiceError("Bạn không có quyền xem danh sách ứng viên", 403);
  }

  const uniqueCompanyIds = Array.from(
    new Set(companyMembers.map((member: any) => member.companyId.toString())),
  ).map((companyId) => new Types.ObjectId(companyId));

  return uniqueCompanyIds;
};

const resolveCandidateProfileMap = async (userIds: Types.ObjectId[]) => {
  if (userIds.length === 0) {
    return new Map<string, any>();
  }

  const profiles = await CandidateProfile.find({
    userId: { $in: userIds },
  })
    .select(
      "userId academicInfo languages achievements advantagePoint technicalSkills softSkills projects workExperiences introductionQuestions updatedAt",
    )
    .lean();

  return new Map(
    profiles.map((profile: any) => [profile.userId.toString(), profile]),
  );
};

const mapCandidateSummary = (user: any, profile: any | null) => {
  return {
    id: user._id.toString(),
    userId: user._id.toString(),
    fullName: user.fullName || "",
    avatarUrl: user.avatarUrl || null,
    status: user.status || "",
    role: user.role || "candidate",
    studentID: user.studentID || null,
    contactInfo: {
      email: user.contactInfo?.email || "",
      phone: user.contactInfo?.phone || null,
    },
    hasProfile: Boolean(profile),
    profile: profile
      ? {
          academicInfo: profile.academicInfo || null,
          advantagePoint: profile.advantagePoint || null,
          technicalSkillsCount: Array.isArray(profile.technicalSkills)
            ? profile.technicalSkills.length
            : 0,
          softSkillsCount: Array.isArray(profile.softSkills)
            ? profile.softSkills.length
            : 0,
          updatedAt: profile.updatedAt || null,
        }
      : null,
  };
};

const resolveCandidateFilterIds = async (query: CandidateListQuery) => {
  const hasProfile = parseBooleanQuery(query.hasProfile);
  const major = query.major?.trim();
  const university = query.university?.trim();

  const profileFilter: Record<string, unknown> = {};
  if (major) {
    profileFilter["academicInfo.major"] = buildRegex(major);
  }
  if (university) {
    profileFilter["academicInfo.university"] = buildRegex(university);
  }

  const needsProfileQuery =
    hasProfile !== undefined || Object.keys(profileFilter).length > 0;

  if (!needsProfileQuery) {
    return { includeOnlyUserIds: [] as Types.ObjectId[], hasProfile, profileFilterApplied: false };
  }

  const profiles = await CandidateProfile.find(profileFilter)
    .select("userId")
    .lean();
  const profileUserIds = profiles.map((profile: any) => profile.userId);

  return { includeOnlyUserIds: profileUserIds, hasProfile, profileFilterApplied: true };
};

export const listCandidates = async (
  userId: string,
  query: CandidateListQuery,
): Promise<ListCandidatesResult> => {
  const viewerCompanyIds = await assertCandidateViewerAccess(userId);

  const pageNum = parsePositiveInteger(query.page, 1, "page");
  const limitNum = parsePositiveInteger(query.limit, 10, "limit");
  const skip = (pageNum - 1) * limitNum;

  const userQuery: Record<string, unknown> = {
    role: "candidate",
  };

  if (query.status) {
    userQuery.status = query.status;
  }

  if (query.search?.trim()) {
    const searchRegex = buildRegex(query.search);
    userQuery.$or = [
      { fullName: searchRegex },
      { studentID: searchRegex },
      { "contactInfo.email": searchRegex },
      { "contactInfo.phone": searchRegex },
    ];
  }

  const companyJobs = await Job.find({
    companyId: { $in: viewerCompanyIds },
  })
    .select("_id")
    .lean();

  if (companyJobs.length === 0) {
    return {
      candidates: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const companyJobIds = companyJobs.map((job: any) => job._id);
  const companyCandidateIds = (await Application.distinct("candidateUserId", {
    jobId: { $in: companyJobIds },
  })) as Types.ObjectId[];

  if (companyCandidateIds.length === 0) {
    return {
      candidates: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      },
    };
  }

  let allowedCandidateIdStrings = new Set(
    companyCandidateIds.map((candidateId) => candidateId.toString()),
  );

  const { includeOnlyUserIds, hasProfile, profileFilterApplied } = await resolveCandidateFilterIds(
    query,
  );

  if (profileFilterApplied) {
    const profileCandidateIdStrings = new Set(
      includeOnlyUserIds.map((candidateId) => candidateId.toString()),
    );

    if (hasProfile === false) {
      allowedCandidateIdStrings = new Set(
        Array.from(allowedCandidateIdStrings).filter(
          (candidateId) => !profileCandidateIdStrings.has(candidateId),
        ),
      );
    } else {
      allowedCandidateIdStrings = new Set(
        Array.from(allowedCandidateIdStrings).filter((candidateId) =>
          profileCandidateIdStrings.has(candidateId),
        ),
      );
    }
  }

  if (allowedCandidateIdStrings.size === 0) {
    return {
      candidates: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      },
    };
  }

  userQuery._id = {
    $in: Array.from(allowedCandidateIdStrings).map(
      (candidateId) => new Types.ObjectId(candidateId),
    ),
  };

  const [users, total] = await Promise.all([
    User.find(userQuery)
      .select("fullName avatarUrl role status studentID contactInfo createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(userQuery),
  ]);

  const userIds = users.map((user: any) => user._id as Types.ObjectId);
  const profileMap = await resolveCandidateProfileMap(userIds);

  return {
    candidates: users.map((user: any) =>
      mapCandidateSummary(user, profileMap.get(user._id.toString()) || null),
    ),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const listJobApplicants = async (
  userId: string,
  jobId: string,
  query: ApplicantsQuery,
): Promise<JobApplicantsResult> => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new JobsServiceError("Job ID không hợp lệ", 400);
  }

  const job = await Job.findById(jobId).lean();
  if (!job) {
    throw new JobsServiceError("Job không tồn tại", 404);
  }

  await assertApplicationViewerAccess(userId, job as unknown as IJob);

  const pageNum = parsePositiveInteger(query.page, 1, "page");
  const limitNum = parsePositiveInteger(query.limit, 10, "limit");
  const skip = (pageNum - 1) * limitNum;

  const applicationQuery: Record<string, unknown> = {
    jobId: new Types.ObjectId(jobId),
  };

  if (query.search?.trim()) {
    const searchRegex = buildRegex(query.search);
    const candidateUsers = await User.find({
      role: "candidate",
      $or: [
        { fullName: searchRegex },
        { studentID: searchRegex },
        { "contactInfo.email": searchRegex },
        { "contactInfo.phone": searchRegex },
      ],
    })
      .select("_id")
      .lean();

    applicationQuery.candidateUserId = {
      $in: candidateUsers.map((candidate: any) => candidate._id),
    };
  }

  const [applications, total] = await Promise.all([
    Application.find(applicationQuery)
      .populate({
        path: "candidateUserId",
        select: "fullName avatarUrl role status studentID contactInfo createdAt updatedAt",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Application.countDocuments(applicationQuery),
  ]);

  const pageUserIds = applications
    .map((application: any) => application.candidateUserId?._id)
    .filter(Boolean);
  const profileMap = await resolveCandidateProfileMap(pageUserIds);

  return {
    applicants: applications.map((application: any) => {
      const user = application.candidateUserId;
      const profile = user?._id
        ? profileMap.get(user._id.toString()) || null
        : null;

      return {
        applicationId: application._id.toString(),
        jobId: application.jobId.toString(),
        currentStatus: getLatestApplicationStatus(application),
        applicationStatus: application.applicationStatus || [],
        screeningResults: application.screeningResults || null,
        finalDecision: application.finalDecision || null,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        candidate: user ? mapCandidateSummary(user, profile) : null,
      };
    }),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getApplicantProfileByJob = async (
  userId: string,
  jobId: string,
  params: { applicationId?: string; candidateUserId?: string },
) => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new JobsServiceError("Job ID không hợp lệ", 400);
  }

  const job = await Job.findById(jobId).lean();
  if (!job) {
    throw new JobsServiceError("Job không tồn tại", 404);
  }

  await assertApplicationViewerAccess(userId, job as unknown as IJob);

  const applicationQuery: Record<string, unknown> = {
    jobId: new Types.ObjectId(jobId),
  };

  if (params.applicationId) {
    if (!Types.ObjectId.isValid(params.applicationId)) {
      throw new JobsServiceError("Application ID không hợp lệ", 400);
    }

    applicationQuery._id = new Types.ObjectId(params.applicationId);
  } else if (params.candidateUserId) {
    if (!Types.ObjectId.isValid(params.candidateUserId)) {
      throw new JobsServiceError("Candidate user ID không hợp lệ", 400);
    }

    applicationQuery.candidateUserId = new Types.ObjectId(params.candidateUserId);
  } else {
    throw new JobsServiceError(
      "Cần cung cấp applicationId hoặc candidateUserId",
      400,
    );
  }

  const application = await Application.findOne(applicationQuery)
    .populate({
      path: "candidateUserId",
      select: "fullName avatarUrl role status studentID contactInfo createdAt updatedAt",
    })
    .lean();

  if (!application) {
    throw new JobsServiceError("Ứng viên không apply vào job này", 404);
  }

  const candidateUser = application.candidateUserId as any;
  if (!candidateUser?._id) {
    throw new JobsServiceError("Không tìm thấy thông tin ứng viên", 404);
  }

  const profile = await CandidateProfile.findOne({
    userId: candidateUser._id,
  })
    .populate({
      path: "technicalSkills.skillId",
      select: "_id skill_name category",
    })
    .populate({
      path: "projects.technologies",
      select: "_id skill_name category",
    })
    .populate({
      path: "workExperiences.technologiesUsed",
      select: "_id skill_name category",
    })
    .lean();

  return {
    jobId,
    applicationId: application._id.toString(),
    currentStatus: getLatestApplicationStatus(application as unknown as IApplication),
    candidate: mapCandidateSummary(candidateUser, profile),
    application: {
      applicationStatus: application.applicationStatus || [],
      screeningResults: application.screeningResults || null,
      finalDecision: application.finalDecision || null,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    },
    profile,
  };
};

export const listJobs = async (
  query: JobsQuery,
): Promise<ListJobsResult> => {
  const pageNum = parsePositiveInteger(query.page, 1, "page");
  const limitNum = parsePositiveInteger(query.limit, 10, "limit");
  const skip = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    Job.find({ status: 'published' })
      .select("companyId slug basicInfo status createdAt updatedAt")
      .populate("companyId", "name logoUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Job.countDocuments({ status: 'published' }),
  ]);

  const jobBasic: JobBasicDto[] = jobs.map(mapJobToBasicDto);

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
  if (!Types.ObjectId.isValid(id)) {
    throw new JobsServiceError("Job ID không hợp lệ", 400);
  }

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

  return mapJobDetail(job) as unknown as IJob;
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
  // const isRecruiter = companyMember.membershipRole === 'recruiter'; // role 'recruiter'
  const hasCreatePermission = companyMember.permission?.canCreateJob;

  if (!hasCreatePermission) {
    throw new JobsServiceError("Vai trò hoặc quyền của bạn không thể tạo job", 403);
  }

  const newJob = await createJobDocument({
    companyId: companyMember.companyId,
    createdBy: new Types.ObjectId(userId),
    basicInfo: data.basicInfo,
    requirements: data.requirements,
    status: "draft",
  });

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

  await assertJobAccess(userId, existingJob as unknown as IJob, {
    actionLabel: "update",
    requirePermission: "canUpdateJob",
  });

  if ("status" in (jobData as Record<string, unknown>)) {
    throw new JobsServiceError("Không thể cập nhật status ở đây", 400);
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

  await assertJobAccess(userId, existingJob as unknown as IJob, {
    actionLabel: "soft delete",
    requirePermission: "canDeleteJob",
  });

  if (existingJob.status === "archived") {
    throw new JobsServiceError("Job đã ở trạng thái archived", 400);
  }

  if (existingJob.status !== "closed") {
    throw new JobsServiceError("Chỉ có thể archived job đang closed", 400);
  }

  const softDeletedJob = await Job.findByIdAndUpdate(
    jobId,
    { $set: { status: 'archived' } },
    { new: true }
  );

  if (!softDeletedJob) {
    throw new JobsServiceError("Xóa job thất bại", 400);
  }
};

export const publishJobService = async (
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

  await assertJobAccess(userId, existingJob as unknown as IJob, {
    actionLabel: "publish",
    requirePermission: "canUpdateJob",
  });

  const publishAllowedStatuses: JobStatus[] = ["draft", "closed", "archived"];
  if (existingJob.status === "published") {
    throw new JobsServiceError("Job đã được published", 400);
  }
  if (!publishAllowedStatuses.includes(existingJob.status as JobStatus)) {
    throw new JobsServiceError("Không thể publish từ trạng thái hiện tại", 400);
  }

  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    { $set: { status: 'published' } },
    { new: true }
  );

  if (!updatedJob) {
    throw new JobsServiceError("Publish job thất bại", 400);
  }
}

export const closeJobService = async (
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

  await assertJobAccess(userId, existingJob as unknown as IJob, {
    actionLabel: "close",
    requirePermission: "canUpdateJob",
  });

  if (existingJob.status === "closed") {
    throw new JobsServiceError("Job đã được closed", 400);
  }
  if (existingJob.status !== "published") {
    throw new JobsServiceError("Chỉ có thể close job đang published", 400);
  }

  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    { $set: { status: 'closed' } },
    { new: true }
  );

  if (!updatedJob) {
    throw new JobsServiceError("Close job thất bại", 400);
  }
}