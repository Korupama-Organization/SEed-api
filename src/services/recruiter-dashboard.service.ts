import { Types } from "mongoose";
import { Application } from "../models/Application";
import { CandidateProfile } from "../models/CandidateProfile";
import "../models/Company";
import { CompanyMember } from "../models/CompanyMember";
import { InterviewSession } from "../models/InterviewSession";
import { Job } from "../models/Job";
import { User } from "../models/User";

type ApplicationStatus =
  | "applied"
  | "screening_passed"
  | "ai_interview_completed"
  | "manual_interview_completed"
  | "offered"
  | "hired"
  | "rejected";

type ChartPeriod = "week" | "month";

type StatusBucketKey =
  | "applied"
  | "screening"
  | "interviewing"
  | "offered"
  | "hired"
  | "rejected";

type StatusBucket = {
  key: StatusBucketKey;
  label: string;
  statuses: ApplicationStatus[];
};

export class RecruiterDashboardServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Đã nộp",
  screening_passed: "Qua sàng lọc",
  ai_interview_completed: "Hoàn tất phỏng vấn AI",
  manual_interview_completed: "Hoàn tất phỏng vấn",
  offered: "Đã gửi offer",
  hired: "Đã tuyển",
  rejected: "Từ chối tuyển dụng",
};

const STATUS_BUCKETS: StatusBucket[] = [
  { key: "applied", label: "Đã nộp", statuses: ["applied"] },
  {
    key: "screening",
    label: "Sàng lọc",
    statuses: ["screening_passed"],
  },
  {
    key: "interviewing",
    label: "Phỏng vấn",
    statuses: ["ai_interview_completed", "manual_interview_completed"],
  },
  { key: "offered", label: "Offer", statuses: ["offered"] },
  { key: "hired", label: "Đã tuyển", statuses: ["hired"] },
  { key: "rejected", label: "Từ chối tuyển dụng", statuses: ["rejected"] },
];

const ACTIVE_JOB_STATUSES = ["published", "open"];
const EXCLUDED_JOB_STATUSES = ["archived"];

const normalizeId = (value: unknown): string => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "_id" in value) {
    return normalizeId((value as { _id?: unknown })._id);
  }

  return "";
};

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfMonth = (date: Date): Date => {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

const formatWeekdayLabel = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const formatMonthLabel = (date: Date): string => {
  return `Th${date.getMonth() + 1}`;
};

const parseChartPeriod = (value: unknown): ChartPeriod => {
  return value === "month" ? "month" : "week";
};

const normalizeRole = (value: unknown): string => {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
};

const getLatestStatus = (application: any): ApplicationStatus => {
  const history = Array.isArray(application?.applicationStatus)
    ? application.applicationStatus
    : [];
  const latest = history[history.length - 1]?.status;

  if (
    latest === "applied" ||
    latest === "screening_passed" ||
    latest === "ai_interview_completed" ||
    latest === "manual_interview_completed" ||
    latest === "offered" ||
    latest === "hired" ||
    latest === "rejected"
  ) {
    return latest;
  }

  return "applied";
};

const isApplicationRejected = (application: any): boolean => {
  return application?.finalDecision?.decision === "reject";
};

const isQualifiedApplication = (application: any): boolean => {
  return (
    !isApplicationRejected(application) &&
    getLatestStatus(application) !== "applied"
  );
};

const countMonthGrowth = (applications: any[], now: Date): number => {
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = addMonths(currentMonthStart, -1);

  const currentMonthCount = applications.filter((application) => {
    const createdAt = new Date(application.createdAt);
    return createdAt >= currentMonthStart;
  }).length;

  const previousMonthCount = applications.filter((application) => {
    const createdAt = new Date(application.createdAt);
    return createdAt >= previousMonthStart && createdAt < currentMonthStart;
  }).length;

  if (previousMonthCount === 0) {
    return currentMonthCount > 0 ? 100 : 0;
  }

  return Math.round(
    ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100,
  );
};

const buildApplicationChart = (applications: any[], period: ChartPeriod) => {
  const now = new Date();

  if (period === "month") {
    const start = addMonths(startOfMonth(now), -5);
    const buckets = new Map<string, { received: number; qualified: number }>();
    const months = Array.from({ length: 6 }, (_value, index) =>
      addMonths(start, index),
    );

    for (const month of months) {
      buckets.set(formatMonthKey(month), { received: 0, qualified: 0 });
    }

    for (const application of applications) {
      const createdAt = new Date(application.createdAt);
      if (createdAt < start) {
        continue;
      }

      const key = formatMonthKey(createdAt);
      const bucket = buckets.get(key);
      if (!bucket) {
        continue;
      }

      bucket.received += 1;
      if (isQualifiedApplication(application)) {
        bucket.qualified += 1;
      }
    }

    return months.map((month) => {
      const key = formatMonthKey(month);
      const bucket = buckets.get(key) || { received: 0, qualified: 0 };

      return {
        key,
        label: formatMonthLabel(month),
        received: bucket.received,
        qualified: bucket.qualified,
      };
    });
  }

  const start = addDays(startOfDay(now), -6);
  const buckets = new Map<string, { received: number; qualified: number }>();
  const days = Array.from({ length: 7 }, (_value, index) =>
    addDays(start, index),
  );

  for (const day of days) {
    buckets.set(formatDateKey(day), { received: 0, qualified: 0 });
  }

  for (const application of applications) {
    const createdAt = new Date(application.createdAt);
    if (createdAt < start) {
      continue;
    }

    const key = formatDateKey(createdAt);
    const bucket = buckets.get(key);
    if (!bucket) {
      continue;
    }

    bucket.received += 1;
    if (isQualifiedApplication(application)) {
      bucket.qualified += 1;
    }
  }

  return days.map((day) => {
    const key = formatDateKey(day);
    const bucket = buckets.get(key) || { received: 0, qualified: 0 };

    return {
      key,
      label: formatWeekdayLabel(day),
      received: bucket.received,
      qualified: bucket.qualified,
    };
  });
};

const buildStatusOverview = (applications: any[]) => {
  const total = applications.length;

  const items = STATUS_BUCKETS.map((bucket) => {
    const count = applications.filter((application) =>
      bucket.statuses.includes(getLatestStatus(application)),
    ).length;

    return {
      key: bucket.key,
      label: bucket.label,
      statuses: bucket.statuses,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  return {
    total,
    items,
  };
};

const buildRecentApplication = (application: any) => {
  const candidate = application?.candidateUserId;
  const job = application?.jobId;
  const latestStatus = getLatestStatus(application);

  return {
    id: normalizeId(application?._id),
    candidate: {
      id: normalizeId(candidate),
      fullName: candidate?.fullName || "",
      avatarUrl: candidate?.avatarUrl || null,
      email: candidate?.contactInfo?.email || null,
    },
    job: {
      id: normalizeId(job),
      title: job?.basicInfo?.title || "",
      roleType: job?.basicInfo?.roleType || "",
      status: job?.status || "",
    },
    status: latestStatus,
    statusLabel: STATUS_LABELS[latestStatus],
    screeningScore:
      typeof application?.screeningResults?.score === "number"
        ? application.screeningResults.score
        : null,
    appliedAt: application?.createdAt || null,
    updatedAt: application?.updatedAt || null,
  };
};

const buildUpcomingInterview = (interviewSession: any) => {
  const candidate = interviewSession?.candidateId;
  const job = interviewSession?.jobId;

  return {
    id: normalizeId(interviewSession?._id),
    title: `${interviewSession?.interviewMode || "Interview"} - ${
      candidate?.fullName || "Ứng viên"
    }`,
    interviewMode: interviewSession?.interviewMode || "",
    sessionType: interviewSession?.sessionType || "",
    status: interviewSession?.status || "",
    startTime: interviewSession?.startTime || null,
    endTime: interviewSession?.endTime || null,
    candidate: {
      id: normalizeId(candidate),
      fullName: candidate?.fullName || "",
      avatarUrl: candidate?.avatarUrl || null,
    },
    job: {
      id: normalizeId(job),
      title: job?.basicInfo?.title || "",
      roleType: job?.basicInfo?.roleType || "",
    },
  };
};

const buildNotifications = (recentApplications: ReturnType<typeof buildRecentApplication>[]) => {
  return recentApplications.slice(0, 5).map((application) => ({
    id: application.id,
    type: "new_application",
    title: `${application.candidate.fullName || "Ứng viên"} nộp CV`,
    description: application.job.roleType
      ? `Ứng tuyển vị trí ${application.job.roleType}`
      : application.job.title,
    createdAt: application.appliedAt,
    candidate: application.candidate,
    job: application.job,
  }));
};

export const getRecruiterDashboard = async (
  userId: string,
  options: { period?: unknown } = {},
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new RecruiterDashboardServiceError("User id không hợp lệ.", 400);
  }

  const userObjectId = new Types.ObjectId(userId);
  const chartPeriod = parseChartPeriod(options.period);

  const [user, companyMember] = await Promise.all([
    User.findById(userObjectId)
      .select("fullName avatarUrl role contactInfo")
      .lean(),
    CompanyMember.findOne({ userId: userObjectId })
      .populate("companyId", "name shortName logoUrl")
      .lean(),
  ]);

  if (!user) {
    throw new RecruiterDashboardServiceError("Tài khoản không tồn tại.", 404);
  }

  if (!companyMember) {
    throw new RecruiterDashboardServiceError(
      "Tài khoản chưa thuộc công ty nào.",
      403,
    );
  }

  if (!companyMember.permission?.canViewApplications) {
    throw new RecruiterDashboardServiceError(
      "Bạn không có quyền xem dữ liệu ứng tuyển.",
      403,
    );
  }

  const company = companyMember.companyId as any;
  const companyId = normalizeId(company);
  if (!Types.ObjectId.isValid(companyId)) {
    throw new RecruiterDashboardServiceError("Company id không hợp lệ.", 400);
  }

  const jobs = await Job.find({
    companyId: new Types.ObjectId(companyId),
    status: { $nin: EXCLUDED_JOB_STATUSES },
  })
    .select("basicInfo status createdAt updatedAt")
    .lean();

  const jobIds = jobs.map((job) => job._id);

  const [applications, recentApplicationDocs, upcomingInterviewDocs] =
    jobIds.length > 0
      ? await Promise.all([
          Application.find({ jobId: { $in: jobIds } })
            .select(
              "candidateUserId jobId applicationStatus finalDecision screeningResults createdAt updatedAt",
            )
            .lean(),
          Application.find({ jobId: { $in: jobIds } })
            .select(
              "candidateUserId jobId applicationStatus finalDecision screeningResults createdAt updatedAt",
            )
            .populate("candidateUserId", "fullName avatarUrl contactInfo")
            .populate("jobId", "basicInfo status")
            .sort({ createdAt: -1 })
            .limit(8)
            .lean(),
          InterviewSession.find({
            jobId: { $in: jobIds },
            status: "scheduled",
            startTime: { $gte: new Date() },
          })
            .select(
              "jobId candidateId sessionType interviewMode status startTime endTime",
            )
            .populate("candidateId", "fullName avatarUrl")
            .populate("jobId", "basicInfo")
            .sort({ startTime: 1 })
            .limit(5)
            .lean(),
        ])
      : [[], [], []];

  const activeJobs = jobs.filter((job) =>
    ACTIVE_JOB_STATUSES.includes(job.status),
  );
  const activeJobRoleTypes = new Set(
    activeJobs
      .map((job) => normalizeRole(job.basicInfo?.roleType))
      .filter(Boolean),
  );
  const openHeadcount = activeJobs.reduce((total, job) => {
    const headcount = job.basicInfo?.headcount;
    return total + (typeof headcount === "number" ? headcount : 0);
  }, 0);

  const candidateProfiles = await CandidateProfile.find({})
    .select("userId introductionQuestions.preferredRoles")
    .lean();
  const matchedCandidateProfileIds = new Set(
    candidateProfiles
      .filter((profile) => {
        if (activeJobRoleTypes.size === 0) {
          return true;
        }

        const preferredRoles = Array.isArray(
          profile.introductionQuestions?.preferredRoles,
        )
          ? profile.introductionQuestions.preferredRoles
          : [];

        return preferredRoles.some((preferredRole) =>
          activeJobRoleTypes.has(normalizeRole(preferredRole?.preferredRole)),
        );
      })
      .map((profile) => normalizeId(profile.userId))
      .filter(Boolean),
  );

  const hiredCount = applications.filter(
    (application) => getLatestStatus(application) === "hired",
  ).length;
  const activeApplicantIds = applications
    .filter(
      (application) =>
        !isApplicationRejected(application) &&
        getLatestStatus(application) !== "hired",
    )
    .map((application) => normalizeId(application.candidateUserId))
    .filter(Boolean);
  const potentialCandidateCount = new Set([
    ...matchedCandidateProfileIds,
    ...activeApplicantIds,
  ]).size;
  const applicationsGrowthPercent = countMonthGrowth(applications, new Date());

  const recentApplications = recentApplicationDocs.map(buildRecentApplication);
  const upcomingInterviews = upcomingInterviewDocs.map(buildUpcomingInterview);

  return {
    recruiter: {
      id: normalizeId(user._id),
      fullName: user.fullName,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
      email: user.contactInfo?.email || null,
      membershipRole: companyMember.membershipRole,
      jobTitle: companyMember.jobTitle,
    },
    company: {
      id: companyId,
      name: company?.name || "",
      shortName: company?.shortName || "",
      logoUrl: company?.logoUrl || null,
    },
    overview: {
      potentialCandidates: potentialCandidateCount,
      matchedCandidateProfiles: matchedCandidateProfileIds.size,
      activeJobCount: activeJobs.length,
      openHeadcount,
      resumesReceived: applications.length,
      hired: hiredCount,
      applicationsGrowthPercent,
    },
    summaryCards: [
      {
        key: "potentialCandidates",
        label: "Ứng viên tiềm năng",
        value: potentialCandidateCount,
        changePercent: applicationsGrowthPercent,
        meta: { matchedCandidateProfiles: matchedCandidateProfileIds.size },
      },
      {
        key: "positions",
        label: "Vị trí",
        value: openHeadcount || activeJobs.length,
        meta: { activeJobCount: activeJobs.length, openHeadcount },
      },
      {
        key: "resumesReceived",
        label: "CV đã nhận",
        value: applications.length,
      },
      {
        key: "hired",
        label: "Đã tuyển",
        value: hiredCount,
      },
    ],
    applicationsChart: {
      period: chartPeriod,
      data: buildApplicationChart(applications, chartPeriod),
    },
    statusOverview: buildStatusOverview(applications),
    activity: {
      notifications: buildNotifications(recentApplications),
      upcomingInterviews,
    },
    recentApplications,
    meta: {
      generatedAt: new Date(),
    },
  };
};
