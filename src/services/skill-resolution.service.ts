import { Types } from "mongoose";
import { Skill } from "../models/Skill";

const DEFAULT_SKILL_CATEGORY = "Khác";

export const normalizeSkillName = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const toObjectId = (value: Types.ObjectId | string): Types.ObjectId =>
  value instanceof Types.ObjectId ? value : new Types.ObjectId(value);

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveExistingObjectId = async (value: string): Promise<Types.ObjectId | null> => {
  if (!Types.ObjectId.isValid(value)) {
    return null;
  }

  const skill = await Skill.findById(value).select("_id").lean();
  return skill?._id ? toObjectId(skill._id as Types.ObjectId | string) : null;
};

const resolveSkillName = async (input: string): Promise<Types.ObjectId | null> => {
  const displayName = input.trim().replace(/\s+/g, " ");
  if (!displayName) {
    return null;
  }

  const normalizedName = normalizeSkillName(displayName);
  const legacySkill = await Skill.findOneAndUpdate(
    {
      normalizedName: { $exists: false },
      skill_name: new RegExp(`^${escapeRegex(displayName)}$`, "i"),
    },
    { $set: { normalizedName } },
    { new: true },
  );

  if (legacySkill?._id) {
    return toObjectId(legacySkill._id as Types.ObjectId | string);
  }

  const skill = await Skill.findOneAndUpdate(
    { normalizedName },
    {
      $setOnInsert: {
        skill_name: displayName,
        normalizedName,
        category: DEFAULT_SKILL_CATEGORY,
      },
    },
    { new: true, upsert: true },
  );

  return skill?._id ? toObjectId(skill._id as Types.ObjectId | string) : null;
};

export const resolveSkillIds = async (skillInputs: unknown): Promise<Types.ObjectId[]> => {
  if (!Array.isArray(skillInputs)) {
    return [];
  }

  const resolvedSkillIds: Types.ObjectId[] = [];
  for (const input of skillInputs) {
    if (input instanceof Types.ObjectId) {
      resolvedSkillIds.push(input);
      continue;
    }

    if (typeof input !== "string") {
      continue;
    }

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      continue;
    }

    const existingObjectId = await resolveExistingObjectId(trimmedInput);
    if (existingObjectId) {
      resolvedSkillIds.push(existingObjectId);
      continue;
    }

    const skillId = await resolveSkillName(trimmedInput);
    if (skillId) {
      resolvedSkillIds.push(skillId);
    }
  }

  return resolvedSkillIds;
};
