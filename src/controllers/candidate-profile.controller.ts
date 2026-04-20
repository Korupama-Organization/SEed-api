import { Request, Response } from "express";
import { CandidateProfile } from "../models/CandidateProfile";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  UpdateCandidateProfileDto,
  UpdateTechnicalSkillDto,
} from "../dto/update-candidate-profile.dto";
import { Types } from "mongoose";
import { Skill } from "../models/Skill";

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
    throw new Error("technicalSkills phải là mảng.");
  }

  const resolvedTechnicalSkills = [];

  for (const technicalSkill of profilePayload.technicalSkills) {
    const payloadItem = technicalSkill as UpdateTechnicalSkillDto;

    if (typeof payloadItem?.yearsOfExperience !== "number") {
      throw new Error("technicalSkills.yearsOfExperience phải là số.");
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
        throw new Error(`Không tìm thấy skill với id ${skillId}.`);
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
      throw new Error(
        "Mỗi technicalSkills item cần có skillId hợp lệ hoặc name (tên skill).",
      );
    }

    const finalCategory = isTechnicalSkillCategory(payloadItem?.category)
      ? payloadItem.category
      : (resolvedSkill.category as TechnicalSkillCategory);

    if (!isTechnicalSkillCategory(finalCategory)) {
      throw new Error(
        `Category không hợp lệ cho skill ${resolvedSkill.skill_name}.`,
      );
    }

    if (finalCategory !== resolvedSkill.category) {
      throw new Error(
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

const validateSoftSkills = (profilePayload: UpdateCandidateProfileDto) => {
  if (!Object.prototype.hasOwnProperty.call(profilePayload, "softSkills")) {
    return;
  }

  if (!Array.isArray(profilePayload.softSkills)) {
    throw new Error("softSkills phải là mảng string.");
  }

  for (const softSkill of profilePayload.softSkills) {
    if (typeof softSkill !== "string" || softSkill.trim() === "") {
      throw new Error("Mỗi phần tử softSkills phải là string hợp lệ.");
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

  return {
    ...profile,
    _id: profile._id ? String(profile._id) : profile._id,
    userId: profile.userId ? String(profile.userId) : profile.userId,
    technicalSkills,
    softSkills,
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
    validateSoftSkills(profilePayload);

    const existingProfile = await CandidateProfile.findOne({
      userId: userObjectId,
    }).lean();

    let updatedProfile = null;
    let updateMeta: { matchedCount: number; modifiedCount: number } | null =
      null;
    if (existingProfile) {
      const updateResult = await CandidateProfile.updateOne(
        { userId: userObjectId },
        {
          $set: profilePayload,
        },
        {
          runValidators: true,
        },
      );

      updateMeta = {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      };

      updatedProfile = await findProfileForResponse(userObjectId);
    }

    if (!updatedProfile) {
      const canInitializeProfile =
        Object.prototype.hasOwnProperty.call(profilePayload, "academicInfo") &&
        Object.prototype.hasOwnProperty.call(
          profilePayload,
          "introductionQuestions",
        );

      if (!canInitializeProfile) {
        return res.status(400).json({
          error:
            "CandidateProfile chưa tồn tại. Cần gửi đầy đủ academicInfo và introductionQuestions để khởi tạo profile.",
        });
      }

      const createdProfile = await CandidateProfile.create({
        userId: userObjectId,
        ...profilePayload,
      });

      updatedProfile = await CandidateProfile.findById(createdProfile._id)
        .populate({
          path: "technicalSkills.skillId",
          select: "_id skill_name category",
        })
        .lean();
      updateMeta = {
        matchedCount: 0,
        modifiedCount: 1,
      };
    }

    if (!updatedProfile?._id) {
      return res.status(500).json({
        error: "Không thể đọc dữ liệu CandidateProfile sau khi cập nhật.",
      });
    }

    return res.status(200).json({
      message: "Cập nhật CandidateProfile thành công.",
      data: buildProfileResponse(updatedProfile),
      meta: updateMeta,
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Update candidate profile error:", error);
    return res.status(500).json({ error: "Lỗi máy chủ." });
  }
};
