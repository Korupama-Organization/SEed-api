import { Types } from "mongoose";
import { CandidateProfile } from "../models/CandidateProfile";
import { Application } from "../models/Application";
import { Job } from "../models/Job";
import { User } from "../models/User";

type CompletionWarning = {
  field: string;
  message: string;
};

type DashboardCompletionRule = {
  field: string;
  warning: string;
  isComplete: (profile: any) => boolean;
};

const hasNonEmptyString = (value: unknown): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

const PROFILE_COMPLETION_RULES: DashboardCompletionRule[] = [
  {
    field: "academicInfo.university",
    warning: "Thiếu trường đại học trong academicInfo.",
    isComplete: (profile) =>
      hasNonEmptyString(profile?.academicInfo?.university),
  },
  {
    field: "academicInfo.major",
    warning: "Thiếu chuyên ngành trong academicInfo.",
    isComplete: (profile) => hasNonEmptyString(profile?.academicInfo?.major),
  },
  {
    field: "academicInfo.graduationYear",
    warning: "Thiếu năm tốt nghiệp trong academicInfo.",
    isComplete: (profile) =>
      typeof profile?.academicInfo?.graduationYear === "number",
  },
  {
    field: "introductionQuestions.preferredRoles",
    warning: "Chưa khai báo preferredRoles trong introductionQuestions.",
    isComplete: (profile) =>
      Array.isArray(profile?.introductionQuestions?.preferredRoles) &&
      profile.introductionQuestions.preferredRoles.length > 0,
  },
  {
    field: "introductionQuestions.whyTheseRoles",
    warning: "Thiếu whyTheseRoles trong introductionQuestions.",
    isComplete: (profile) =>
      hasNonEmptyString(profile?.introductionQuestions?.whyTheseRoles),
  },
  {
    field: "introductionQuestions.futureGoals",
    warning: "Thiếu futureGoals trong introductionQuestions.",
    isComplete: (profile) =>
      hasNonEmptyString(profile?.introductionQuestions?.futureGoals),
  },
  {
    field: "introductionQuestions.favoriteTechnology",
    warning: "Thiếu favoriteTechnology trong introductionQuestions.",
    isComplete: (profile) =>
      hasNonEmptyString(profile?.introductionQuestions?.favoriteTechnology),
  },
  {
    field: "advantagePoint",
    warning: "Chưa có advantagePoint (điểm mạnh nổi bật).",
    isComplete: (profile) => hasNonEmptyString(profile?.advantagePoint),
  },
  {
    field: "technicalSkills",
    warning: "Chưa có technicalSkills.",
    isComplete: (profile) =>
      Array.isArray(profile?.technicalSkills) &&
      profile.technicalSkills.length > 0,
  },
  {
    field: "softSkills",
    warning: "Chưa có softSkills.",
    isComplete: (profile) =>
      Array.isArray(profile?.softSkills) && profile.softSkills.length > 0,
  },
  {
    field: "projects",
    warning: "Chưa có projects.",
    isComplete: (profile) =>
      Array.isArray(profile?.projects) && profile.projects.length > 0,
  },
  {
    field: "languages",
    warning: "Chưa có languages/chứng chỉ ngoại ngữ.",
    isComplete: (profile) =>
      Array.isArray(profile?.languages) && profile.languages.length > 0,
  },
  {
    field: "achievements",
    warning: "Chưa có achievements/thành tích.",
    isComplete: (profile) =>
      Array.isArray(profile?.achievements) && profile.achievements.length > 0,
  },
];

const evaluateProfileCompletion = (profile: any | null) => {
  const completedFields: string[] = [];
  const missingFields: string[] = [];
  const warnings: CompletionWarning[] = [];

  for (const rule of PROFILE_COMPLETION_RULES) {
    if (profile && rule.isComplete(profile)) {
      completedFields.push(rule.field);
      continue;
    }

    missingFields.push(rule.field);
    warnings.push({
      field: rule.field,
      message: rule.warning,
    });
  }

  const totalCriteria = PROFILE_COMPLETION_RULES.length;
  const completedCriteria = completedFields.length;
  const completionPercentage = Math.round(
    (completedCriteria / totalCriteria) * 100,
  );

  let status: "empty" | "incomplete" | "almost_complete" | "complete" =
    "incomplete";
  if (!profile) {
    status = "empty";
  } else if (completionPercentage === 100) {
    status = "complete";
  } else if (completionPercentage >= 70) {
    status = "almost_complete";
  }

  return {
    totalCriteria,
    completedCriteria,
    completionPercentage,
    status,
    completedFields,
    missingFields,
    warnings,
    nextRecommendedFields: missingFields.slice(0, 3),
  };
};

const normalizeId = (value: unknown): string => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

const buildSkillNameSet = (profile: any | null): Set<string> => {
  const skillNames = new Set<string>();

  if (!profile || !Array.isArray(profile.technicalSkills)) {
    return skillNames;
  }

  for (const technicalSkill of profile.technicalSkills) {
    const skillId = technicalSkill?.skillId;
    const skillName =
      typeof skillId === "object" && skillId !== null
        ? skillId.skill_name
        : undefined;

    if (typeof skillName === "string" && skillName.trim().length > 0) {
      skillNames.add(skillName.trim().toLowerCase());
    }
  }

  return skillNames;
};

const buildJobMatch = (job: any, candidateSkills: Set<string>) => {
  const requiredSkills = Array.isArray(job?.requirements?.requiredSkills)
    ? job.requirements.requiredSkills
    : [];
  const preferredSkills = Array.isArray(job?.requirements?.preferredSkills)
    ? job.requirements.preferredSkills
    : [];

  const requiredSkillNames = requiredSkills
    .map((skill: any) => skill?.skill_name)
    .filter((skillName: unknown) => typeof skillName === "string")
    .map((skillName: string) => skillName.trim())
    .filter((skillName: string) => skillName.length > 0);

  const preferredSkillNames = preferredSkills
    .map((skill: any) => skill?.skill_name)
    .filter((skillName: unknown) => typeof skillName === "string")
    .map((skillName: string) => skillName.trim())
    .filter((skillName: string) => skillName.length > 0);

  const matchedRequiredSkills = requiredSkillNames.filter((skillName: string) =>
    candidateSkills.has(skillName.toLowerCase()),
  );
  const matchedPreferredSkills = preferredSkillNames.filter((skillName: string) =>
    candidateSkills.has(skillName.toLowerCase()),
  );

  const requiredMatchRatio =
    requiredSkillNames.length > 0
      ? matchedRequiredSkills.length / requiredSkillNames.length
      : 0;
  const preferredMatchRatio =
    preferredSkillNames.length > 0
      ? matchedPreferredSkills.length / preferredSkillNames.length
      : 0;

  const matchScore = Math.round(
    Math.min(100, requiredMatchRatio * 75 + preferredMatchRatio * 25),
  );

  const missingRequiredSkills = requiredSkillNames.filter(
    (skillName: string) => !candidateSkills.has(skillName.toLowerCase()),
  );

  return {
    jobId: normalizeId(job?._id),
    createdAt: job?.createdAt || null,
    title: job?.basicInfo?.title || "",
    summary: job?.basicInfo?.summary || "",
    company: {
      id: normalizeId(job?.companyId?._id),
      name: job?.companyId?.name || "",
      logoUrl: job?.companyId?.logoUrl || null,
    },
    location:
      Array.isArray(job?.basicInfo?.locations) &&
      job.basicInfo.locations.length > 0
        ? job.basicInfo.locations[0]
        : "Chưa cập nhật",
    workModel: job?.basicInfo?.workModel || "",
    level: job?.basicInfo?.level || "",
    jobType: job?.basicInfo?.jobType || "",
    status: job?.status || "",
    matchScore,
    matchedSkills: [
      ...new Set([...matchedRequiredSkills, ...matchedPreferredSkills]),
    ],
    missingSkills: missingRequiredSkills,
    requiredSkillCount: requiredSkillNames.length,
    matchedSkillCount: matchedRequiredSkills.length,
  };
};

export const getCandidateDashboard = async (userId: string) => {
  const userObjectId = new Types.ObjectId(userId);

  const [user, profile, applications, jobs] = await Promise.all([
    User.findById(userObjectId)
      .select("fullName avatarUrl role")
      .lean(),
    CandidateProfile.findOne({ userId: userObjectId })
      .populate({
        path: "technicalSkills.skillId",
        select: "_id skill_name category",
      })
      .lean(),
    Application.find({ candidateUserId: userObjectId })
      .select(
        "jobId applicationStatus finalDecision screeningResults createdAt updatedAt",
      )
      .sort({ updatedAt: -1 })
      .lean(),
    Job.find({ status: "published" })
      .select("companyId basicInfo status createdAt updatedAt requirements")
      .populate("companyId", "name logoUrl")
      .populate({
        path: "requirements.requiredSkills",
        select: "_id skill_name category",
      })
      .populate({
        path: "requirements.preferredSkills",
        select: "_id skill_name category",
      })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean(),
  ]);

  const completionData = evaluateProfileCompletion(profile);
  const candidateSkills = buildSkillNameSet(profile);

  const jobMatches = jobs
    .map((job) => buildJobMatch(job, candidateSkills))
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      const rightCreatedAt = right.createdAt
        ? new Date(right.createdAt).getTime()
        : 0;
      const leftCreatedAt = left.createdAt
        ? new Date(left.createdAt).getTime()
        : 0;

      return rightCreatedAt - leftCreatedAt;
    })
    .slice(0, 3);

  return {
    profile: {
      id: user?._id ? String(user._id) : userId,
      fullName: user?.fullName || "",
      avatarUrl: user?.avatarUrl || null,
      role: user?.role || "candidate",
      hasProfile: Boolean(profile),
      completionPercentage: completionData.completionPercentage,
      status: completionData.status,
      nextRecommendedFields: completionData.nextRecommendedFields,
    },
    quickStats: {
      appliedJobs: applications.length,
      matchedJobs: jobMatches.length,
      profileCompletion: completionData.completionPercentage,
    },
    jobMatches,
  };
};