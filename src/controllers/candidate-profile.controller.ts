import { Request, Response } from "express";
import { CandidateProfile } from "../models/CandidateProfile";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  UpdateCandidateProfileDto,
  UpdateSkillReferenceDto,
  UpdateTechnicalSkillDto,
} from "../dto/update-candidate-profile.dto";
import { Types } from "mongoose";
import { Skill } from "../models/Skill";
import { User } from "../models/User";

const PROFILE_UPDATABLE_FIELDS: (keyof UpdateCandidateProfileDto)[] = [
  "academicInfo",
  "languages",
  "achievements",
  "advantagePoint",
  "technicalSkills",
  "softSkills",
  "projects",
  "workExperiences",
  "introductionQuestions",
];

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const ALLOWED_TOP_LEVEL_FIELDS = [...PROFILE_UPDATABLE_FIELDS] as const;

type CompletionWarning = {
  field: string;
  message: string;
};

type CompletionRule = {
  field: string;
  warning: string;
  isComplete: (profile: any) => boolean;
};

const hasNonEmptyString = (value: unknown): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

const hasDateValue = (value: unknown): boolean => {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "string" && value.trim()) {
    return !Number.isNaN(new Date(value).getTime());
  }

  return false;
};

const PROFILE_COMPLETION_RULES: CompletionRule[] = [
  {
    field: "basicInfo.fullName",
    warning: "Thiếu họ và tên trong thông tin cơ bản.",
    isComplete: (profile) => hasNonEmptyString(profile?.basicInfo?.fullName),
  },
  {
    field: "basicInfo.studentId",
    warning: "Thiếu mã số sinh viên trong thông tin cơ bản.",
    isComplete: (profile) => hasNonEmptyString(profile?.basicInfo?.studentId),
  },
  {
    field: "basicInfo.email",
    warning: "Thiếu email trong thông tin cơ bản.",
    isComplete: (profile) => hasNonEmptyString(profile?.basicInfo?.email),
  },
  {
    field: "basicInfo.phone",
    warning: "Thiếu số điện thoại trong thông tin cơ bản.",
    isComplete: (profile) => hasNonEmptyString(profile?.basicInfo?.phone),
  },
  {
    field: "basicInfo.birthDate",
    warning: "Thiếu ngày sinh trong thông tin cơ bản.",
    isComplete: (profile) => hasDateValue(profile?.basicInfo?.birthDate),
  },
  {
    field: "basicInfo.gender",
    warning: "Thiếu giới tính trong thông tin cơ bản.",
    isComplete: (profile) => hasNonEmptyString(profile?.basicInfo?.gender),
  },
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

const TECHNICAL_SKILL_CATEGORIES = [
  "Ngôn ngữ lập trình",
  "Framework",
  "OS",
  "Database",
  "Cloud",
  "Version Control",
  "Công cụ quản lý dự án",
  "Khác",
] as const;

type TechnicalSkillCategory = (typeof TECHNICAL_SKILL_CATEGORIES)[number];

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

const isValidObjectIdValue = (value: unknown): boolean => {
  if (value instanceof Types.ObjectId) {
    return true;
  }

  return typeof value === "string" && Types.ObjectId.isValid(value);
};

const normalizeSkillId = (value: unknown): string => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

const isTechnicalSkillCategory = (
  value: unknown,
): value is TechnicalSkillCategory => {
  return (
    typeof value === "string" &&
    TECHNICAL_SKILL_CATEGORIES.includes(value as TechnicalSkillCategory)
  );
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const resolveSkillByName = async (
  name: string,
  category: TechnicalSkillCategory,
) => {
  const normalizedName = name.trim();
  const exactNameRegex = new RegExp(`^${escapeRegex(normalizedName)}$`, "i");

  let skill = await Skill.findOne({ skill_name: exactNameRegex }).lean();
  if (skill) {
    return skill;
  }

  try {
    const created = await Skill.create({
      skill_name: normalizedName,
      category,
    });

    return {
      _id: created._id,
      skill_name: created.skill_name,
      category: created.category,
    };
  } catch (error: any) {
    if (error?.code === 11000) {
      skill = await Skill.findOne({ skill_name: exactNameRegex }).lean();
      if (skill) {
        return skill;
      }
    }

    throw error;
  }
};

const resolveTechnicalSkills = async (
  profilePayload: UpdateCandidateProfileDto,
) => {
  if (
    !Object.prototype.hasOwnProperty.call(profilePayload, "technicalSkills")
  ) {
    return;
  }

  if (!Array.isArray(profilePayload.technicalSkills)) {
    throw new RequestValidationError("technicalSkills phải là mảng.");
  }

  const resolvedTechnicalSkills = [];

  for (const technicalSkill of profilePayload.technicalSkills) {
    const payloadItem = technicalSkill as UpdateTechnicalSkillDto;

    if (typeof payloadItem?.yearsOfExperience !== "number") {
      throw new RequestValidationError(
        "technicalSkills.yearsOfExperience phải là số.",
      );
    }

    const inputCategory = payloadItem?.category;
    const category = isTechnicalSkillCategory(inputCategory)
      ? inputCategory
      : "Khác";

    let resolvedSkill: {
      _id: Types.ObjectId;
      skill_name: string;
      category: string;
    } | null = null;

    if (isValidObjectIdValue(payloadItem?.skillId)) {
      const skillId = normalizeSkillId(payloadItem.skillId);
      const foundById = await Skill.findById(skillId, {
        _id: 1,
        skill_name: 1,
        category: 1,
      }).lean();

      if (!foundById) {
        throw new RequestValidationError(
          `Không tìm thấy skill với id ${skillId}.`,
        );
      }

      resolvedSkill = {
        _id: foundById._id,
        skill_name: foundById.skill_name,
        category: foundById.category,
      };
    } else if (
      typeof payloadItem?.name === "string" &&
      payloadItem.name.trim()
    ) {
      resolvedSkill = await resolveSkillByName(payloadItem.name, category);
    } else {
      throw new RequestValidationError(
        "Mỗi technicalSkills item cần có skillId hợp lệ hoặc name (tên skill).",
      );
    }

    const finalCategory = isTechnicalSkillCategory(payloadItem?.category)
      ? payloadItem.category
      : (resolvedSkill.category as TechnicalSkillCategory);

    if (!isTechnicalSkillCategory(finalCategory)) {
      throw new RequestValidationError(
        `Category không hợp lệ cho skill ${resolvedSkill.skill_name}.`,
      );
    }

    if (finalCategory !== resolvedSkill.category) {
      throw new RequestValidationError(
        `technicalSkills category không khớp với skill ${resolvedSkill.skill_name}. category từ DB: ${resolvedSkill.category}.`,
      );
    }

    resolvedTechnicalSkills.push({
      category: finalCategory,
      skillId: resolvedSkill._id,
      yearsOfExperience: payloadItem.yearsOfExperience,
      confidence:
        typeof payloadItem.confidence === "boolean"
          ? payloadItem.confidence
          : true,
    });
  }

  profilePayload.technicalSkills = resolvedTechnicalSkills as any;
};

const resolveSkillReference = async (
  value: unknown,
  fallbackCategory: TechnicalSkillCategory,
  fieldPath: string,
): Promise<string> => {
  if (isValidObjectIdValue(value)) {
    const skillId = normalizeSkillId(value);
    const foundById = await Skill.findById(skillId, {
      _id: 1,
      skill_name: 1,
      category: 1,
    }).lean();

    if (!foundById) {
      throw new RequestValidationError(
        `Không tìm thấy skill với id ${skillId} tại ${fieldPath}.`,
      );
    }

    return String(foundById._id);
  }

  if (typeof value === "string" && value.trim()) {
    const resolvedSkill = await resolveSkillByName(value, fallbackCategory);
    return String(resolvedSkill._id);
  }

  if (isObject(value)) {
    const payload = value as UpdateSkillReferenceDto;

    if (isValidObjectIdValue(payload.skillId)) {
      const skillId = normalizeSkillId(payload.skillId);
      const foundById = await Skill.findById(skillId, {
        _id: 1,
        skill_name: 1,
        category: 1,
      }).lean();

      if (!foundById) {
        throw new RequestValidationError(
          `Không tìm thấy skill với id ${skillId} tại ${fieldPath}.`,
        );
      }

      return String(foundById._id);
    }

    if (typeof payload.name === "string" && payload.name.trim()) {
      const category = isTechnicalSkillCategory(payload.category)
        ? payload.category
        : fallbackCategory;
      const resolvedSkill = await resolveSkillByName(payload.name, category);

      return String(resolvedSkill._id);
    }
  }

  throw new RequestValidationError(
    `${fieldPath} phải là Skill ObjectId hoặc object { skillId | name, category? } hợp lệ.`,
  );
};

const resolveProjectAndWorkExperienceSkills = async (
  profilePayload: UpdateCandidateProfileDto,
) => {
  if (Object.prototype.hasOwnProperty.call(profilePayload, "projects")) {
    if (!Array.isArray(profilePayload.projects)) {
      throw new RequestValidationError("projects phải là mảng.");
    }

    const resolvedProjects = [];

    for (let index = 0; index < profilePayload.projects.length; index += 1) {
      const project = profilePayload.projects[index] as unknown as Record<
        string,
        unknown
      >;
      const technologies = project?.technologies;

      if (!Array.isArray(technologies)) {
        throw new RequestValidationError(
          `projects[${index}].technologies phải là mảng.`,
        );
      }

      const resolvedTechnologies = [];
      for (
        let skillIndex = 0;
        skillIndex < technologies.length;
        skillIndex += 1
      ) {
        const resolvedSkillId = await resolveSkillReference(
          technologies[skillIndex],
          "Khác",
          `projects[${index}].technologies[${skillIndex}]`,
        );
        resolvedTechnologies.push(resolvedSkillId);
      }

      resolvedProjects.push({
        ...project,
        technologies: resolvedTechnologies,
      });
    }

    profilePayload.projects = resolvedProjects as any;
  }

  if (Object.prototype.hasOwnProperty.call(profilePayload, "workExperiences")) {
    if (!Array.isArray(profilePayload.workExperiences)) {
      throw new RequestValidationError("workExperiences phải là mảng.");
    }

    const resolvedWorkExperiences = [];

    for (
      let index = 0;
      index < profilePayload.workExperiences.length;
      index += 1
    ) {
      const workExperience = profilePayload.workExperiences[
        index
      ] as unknown as Record<string, unknown>;
      const technologiesUsed = workExperience?.technologiesUsed;

      if (!Array.isArray(technologiesUsed)) {
        throw new RequestValidationError(
          `workExperiences[${index}].technologiesUsed phải là mảng.`,
        );
      }

      const resolvedTechnologiesUsed = [];
      for (
        let skillIndex = 0;
        skillIndex < technologiesUsed.length;
        skillIndex += 1
      ) {
        const resolvedSkillId = await resolveSkillReference(
          technologiesUsed[skillIndex],
          "Khác",
          `workExperiences[${index}].technologiesUsed[${skillIndex}]`,
        );
        resolvedTechnologiesUsed.push(resolvedSkillId);
      }

      resolvedWorkExperiences.push({
        ...workExperience,
        technologiesUsed: resolvedTechnologiesUsed,
      });
    }

    profilePayload.workExperiences = resolvedWorkExperiences as any;
  }
};

const validateSoftSkills = (profilePayload: UpdateCandidateProfileDto) => {
  if (!Object.prototype.hasOwnProperty.call(profilePayload, "softSkills")) {
    return;
  }

  if (!Array.isArray(profilePayload.softSkills)) {
    throw new RequestValidationError("softSkills phải là mảng string.");
  }

  for (const softSkill of profilePayload.softSkills) {
    if (typeof softSkill !== "string" || softSkill.trim() === "") {
      throw new RequestValidationError(
        "Mỗi phần tử softSkills phải là string hợp lệ.",
      );
    }
  }
};

const buildProfileResponse = (profile: any) => {
  if (!profile) {
    return profile;
  }

  const technicalSkills = Array.isArray(profile.technicalSkills)
    ? profile.technicalSkills.map((item: any) => {
        const populatedSkill = isObject(item?.skillId)
          ? (item.skillId as {
              _id?: Types.ObjectId;
              skill_name?: string;
              category?: string;
            })
          : null;

        const rawSkillId = populatedSkill?._id ?? item?.skillId;

        return {
          skillId: rawSkillId ? String(rawSkillId) : null,
          yearsOfExperience: item?.yearsOfExperience,
          confidence: item?.confidence,
          skill: populatedSkill
            ? {
                _id: populatedSkill._id ? String(populatedSkill._id) : null,
                name: populatedSkill.skill_name,
                category: populatedSkill.category,
              }
            : null,
        };
      })
    : [];

  const softSkills = Array.isArray(profile.softSkills)
    ? profile.softSkills.map((item: unknown) => String(item))
    : [];

  const projectSkillMap = new Map<
    string,
    { _id: string; name: string; category: string }
  >();
  for (const skill of Array.isArray(profile?.projectTechnologySkills)
    ? profile.projectTechnologySkills
    : []) {
    if (!skill?._id) {
      continue;
    }

    projectSkillMap.set(String(skill._id), {
      _id: String(skill._id),
      name: String(skill.skill_name ?? ""),
      category: String(skill.category ?? "Khác"),
    });
  }

  const workExperienceSkillMap = new Map<
    string,
    { _id: string; name: string; category: string }
  >();
  for (const skill of Array.isArray(profile?.workExperienceTechnologySkills)
    ? profile.workExperienceTechnologySkills
    : []) {
    if (!skill?._id) {
      continue;
    }

    workExperienceSkillMap.set(String(skill._id), {
      _id: String(skill._id),
      name: String(skill.skill_name ?? ""),
      category: String(skill.category ?? "Khác"),
    });
  }

  const projects = Array.isArray(profile.projects)
    ? profile.projects.map((project: any) => {
        const technologyIds = Array.isArray(project?.technologies)
          ? project.technologies.map((item: unknown) => String(item))
          : [];

        return {
          ...project,
          technologies: technologyIds,
          technologySkills: technologyIds
            .map((id: string) => projectSkillMap.get(id))
            .filter(Boolean),
        };
      })
    : [];

  const workExperiences = Array.isArray(profile.workExperiences)
    ? profile.workExperiences.map((workExperience: any) => {
        const technologyIds = Array.isArray(workExperience?.technologiesUsed)
          ? workExperience.technologiesUsed.map((item: unknown) => String(item))
          : [];

        return {
          ...workExperience,
          technologiesUsed: technologyIds,
          technologyUsedSkills: technologyIds
            .map((id: string) => workExperienceSkillMap.get(id))
            .filter(Boolean),
        };
      })
    : [];

  return {
    ...profile,
    _id: profile._id ? String(profile._id) : profile._id,
    userId: profile.userId ? String(profile.userId) : profile.userId,
    technicalSkills,
    softSkills,
    projects,
    workExperiences,
  };
};

const findProfileForResponse = async (userObjectId: Types.ObjectId) => {
  return CandidateProfile.findOne({ userId: userObjectId })
    .populate({
      path: "technicalSkills.skillId",
      select: "_id skill_name category",
    })
    .lean();
};

export const updateMyCandidateProfile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!isObject(req.body)) {
    return res
      .status(400)
      .json({ error: "Request body phải là object hợp lệ." });
  }

  const unknownTopLevelFields = Object.keys(req.body).filter(
    (field) =>
      !ALLOWED_TOP_LEVEL_FIELDS.includes(
        field as (typeof ALLOWED_TOP_LEVEL_FIELDS)[number],
      ),
  );

  if (unknownTopLevelFields.length > 0) {
    return res.status(400).json({
      error: `Field không hợp lệ: ${unknownTopLevelFields.join(", ")}`,
    });
  }

  const rawProfilePayload: Partial<
    Record<keyof UpdateCandidateProfileDto, unknown>
  > = {};

  for (const field of PROFILE_UPDATABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      const fieldValue = req.body[field];
      rawProfilePayload[field] = fieldValue;
    }
  }
  const profilePayload = rawProfilePayload as UpdateCandidateProfileDto;
  const hasProfileUpdate = Object.keys(profilePayload).length > 0;

  if (!hasProfileUpdate) {
    return res.status(400).json({
      error: "Không có field hợp lệ để update.",
    });
  }

  try {
    const userObjectId = new Types.ObjectId(authReq.auth.userId);
    await resolveTechnicalSkills(profilePayload);
    await resolveProjectAndWorkExperienceSkills(profilePayload);
    validateSoftSkills(profilePayload);

    const existingProfile = await CandidateProfile.findOne({
      userId: userObjectId,
    })
      .select("_id")
      .lean();

    const updatedProfile = await CandidateProfile.findOneAndUpdate(
      { userId: userObjectId },
      {
        $setOnInsert: { userId: userObjectId },
        $set: profilePayload,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )
      .populate({
        path: "technicalSkills.skillId",
        select: "_id skill_name category",
      })
      .lean();

    const updateMeta = {
      matchedCount: existingProfile ? 1 : 0,
      modifiedCount: 1,
    };

    if (!updatedProfile?._id) {
      return res.status(500).json({
        error: "Không thể đọc dữ liệu CandidateProfile sau khi cập nhật.",
      });
    }

    const projectSkillIds = Array.isArray(updatedProfile.projects)
      ? updatedProfile.projects.flatMap((project: any) =>
          Array.isArray(project?.technologies)
            ? project.technologies
                .filter((value: unknown) => isValidObjectIdValue(value))
                .map((value: unknown) => normalizeSkillId(value))
            : [],
        )
      : [];

    const workExperienceSkillIds = Array.isArray(updatedProfile.workExperiences)
      ? updatedProfile.workExperiences.flatMap((workExperience: any) =>
          Array.isArray(workExperience?.technologiesUsed)
            ? workExperience.technologiesUsed
                .filter((value: unknown) => isValidObjectIdValue(value))
                .map((value: unknown) => normalizeSkillId(value))
            : [],
        )
      : [];

    const uniqueProjectSkillIds = [...new Set(projectSkillIds)];
    const uniqueWorkExperienceSkillIds = [...new Set(workExperienceSkillIds)];

    const [projectTechnologySkills, workExperienceTechnologySkills] =
      await Promise.all([
        uniqueProjectSkillIds.length > 0
          ? Skill.find(
              { _id: { $in: uniqueProjectSkillIds } },
              {
                _id: 1,
                skill_name: 1,
                category: 1,
              },
            ).lean()
          : Promise.resolve([]),
        uniqueWorkExperienceSkillIds.length > 0
          ? Skill.find(
              { _id: { $in: uniqueWorkExperienceSkillIds } },
              {
                _id: 1,
                skill_name: 1,
                category: 1,
              },
            ).lean()
          : Promise.resolve([]),
      ]);

    const responseProfile = {
      ...updatedProfile,
      projectTechnologySkills,
      workExperienceTechnologySkills,
    };

    return res.status(200).json({
      message: "Cập nhật CandidateProfile thành công.",
      data: buildProfileResponse(responseProfile),
      meta: updateMeta,
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof RequestValidationError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Update candidate profile error:", error);
    return res.status(500).json({ error: "Lỗi máy chủ." });
  }
};

export const getMyCandidateProfile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const userObjectId = new Types.ObjectId(authReq.auth.userId);
    const profile = await findProfileForResponse(userObjectId);

    if (!profile) {
      return res.status(200).json({ message: "Candidate profile not found", data: null });
    }

    // collect project and work experience skill ids
    const projectSkillIds = Array.isArray(profile.projects)
      ? profile.projects.flatMap((project: any) =>
          Array.isArray(project?.technologies)
            ? project.technologies.map((v: unknown) => String(v))
            : [],
        )
      : [];

    const workExperienceSkillIds = Array.isArray(profile.workExperiences)
      ? profile.workExperiences.flatMap((we: any) =>
          Array.isArray(we?.technologiesUsed)
            ? we.technologiesUsed.map((v: unknown) => String(v))
            : [],
        )
      : [];

    const uniqueProjectSkillIds = [...new Set(projectSkillIds)];
    const uniqueWorkExperienceSkillIds = [...new Set(workExperienceSkillIds)];

    const [projectTechnologySkills, workExperienceTechnologySkills] =
      await Promise.all([
        uniqueProjectSkillIds.length > 0
          ? Skill.find({ _id: { $in: uniqueProjectSkillIds } }, { _id: 1, skill_name: 1, category: 1 }).lean()
          : [],
        uniqueWorkExperienceSkillIds.length > 0
          ? Skill.find({ _id: { $in: uniqueWorkExperienceSkillIds } }, { _id: 1, skill_name: 1, category: 1 }).lean()
          : [],
      ]);

    const profileForResponse = {
      ...profile,
      projectTechnologySkills: projectTechnologySkills || [],
      workExperienceTechnologySkills: workExperienceTechnologySkills || [],
    };

    const response = buildProfileResponse(profileForResponse);

    return res.status(200).json({ message: "Candidate profile fetched successfully", data: response });
  } catch (error: any) {
    console.error("Get my candidate profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyCandidateProfileCompletion = async (
  req: Request,
  res: Response,
) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const userObjectId = new Types.ObjectId(authReq.auth.userId);
    const [profile, user] = await Promise.all([
      CandidateProfile.findOne({ userId: userObjectId }).lean(),
      User.findById(userObjectId).lean(),
    ]);

    const completionSubject = {
      ...(profile || {}),
      basicInfo: {
        fullName: user?.fullName,
        studentId: user?.studentID,
        email: user?.contactInfo?.email,
        phone: user?.contactInfo?.phone,
        birthDate: user?.dateOfBirth,
        gender: user?.gender,
      },
    };

    const completionData = evaluateProfileCompletion(completionSubject);

    return res.status(200).json({
      message: "Đánh giá độ hoàn thành CandidateProfile thành công.",
      data: {
        hasProfile: Boolean(profile),
        ...completionData,
      },
    });
  } catch (error: any) {
    console.error("Get candidate profile completion error:", error);
    return res.status(500).json({ error: "Lỗi máy chủ." });
  }
};
