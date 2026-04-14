import { Request, Response } from "express";
import { CandidateProfile } from "../models/CandidateProfile";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { UpdateCandidateProfileDto } from "../dto/update-candidate-profile.dto";
import { Types } from "mongoose";

const PROFILE_UPDATABLE_FIELDS: (keyof UpdateCandidateProfileDto)[] = [
  "basicInfo",
  "education",
  "strengths",
  "skills",
  "languages",
  "achievements",
];

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const flattenForSet = (
  prefix: string,
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = `${prefix}.${key}`;

    if (isObject(nestedValue)) {
      Object.assign(flattened, flattenForSet(nextPath, nestedValue));
      continue;
    }

    flattened[nextPath] = nestedValue;
  }

  return flattened;
};

const ALLOWED_TOP_LEVEL_FIELDS = [...PROFILE_UPDATABLE_FIELDS] as const;
const DEPRECATED_PROFILE_FIELDS = [
  "academicInfo",
  "advantagePoint",
  "technicalSkills",
  "softSkills",
  "projects",
  "workExperiences",
  "introductionQuestions",
] as const;

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
  const setPayload: Record<string, unknown> = {};

  for (const field of PROFILE_UPDATABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      const fieldValue = req.body[field];
      rawProfilePayload[field] = fieldValue;

      if (isObject(fieldValue)) {
        Object.assign(setPayload, flattenForSet(field, fieldValue));
      } else {
        setPayload[field] = fieldValue;
      }
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
    const unsetDeprecatedFields = DEPRECATED_PROFILE_FIELDS.reduce<
      Record<string, "">
    >((acc, field) => {
      acc[field] = "";
      return acc;
    }, {});

    const userObjectId = new Types.ObjectId(authReq.auth.userId);
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
          $set: setPayload,
          $unset: unsetDeprecatedFields,
        },
        {
          runValidators: true,
        },
      );

      updateMeta = {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      };

      updatedProfile = await CandidateProfile.findOne({
        userId: userObjectId,
      }).lean();
    }

    if (!updatedProfile) {
      const canInitializeProfile =
        Object.prototype.hasOwnProperty.call(profilePayload, "basicInfo") &&
        Object.prototype.hasOwnProperty.call(profilePayload, "education");

      if (!canInitializeProfile) {
        return res.status(400).json({
          error:
            "CandidateProfile chưa tồn tại. Cần gửi đầy đủ basicInfo và education để khởi tạo profile.",
        });
      }

      const createdProfile = await CandidateProfile.create({
        userId: userObjectId,
        ...profilePayload,
      });

      updatedProfile = await CandidateProfile.findById(
        createdProfile._id,
      ).lean();
      updateMeta = {
        matchedCount: 0,
        modifiedCount: 1,
      };
    }

    if (!updatedProfile?._id) {
      return res
        .status(500)
        .json({
          error: "Không thể đọc dữ liệu CandidateProfile sau khi cập nhật.",
        });
    }

    const persistedProfile = await CandidateProfile.collection.findOne({
      _id: updatedProfile._id,
    });

    if (!persistedProfile) {
      return res
        .status(500)
        .json({ error: "Không thể đọc CandidateProfile từ database." });
    }

    return res.status(200).json({
      message: "Cập nhật CandidateProfile thành công.",
      data: persistedProfile,
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
