import { Schema, model, Document } from "mongoose";

export interface ISkill extends Document {
  skill_name: string;
  normalizedName?: string;
  category: string;
}

const normalizeSkillName = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const SkillSchema = new Schema<ISkill>({
  skill_name: { type: String, required: true, unique: true },
  normalizedName: { type: String },
  category: {
    type: String,
    required: true,
    enum: [
      "Framework",
      "Ngôn ngữ lập trình",
      "OS",
      "Database",
      "Cloud",
      "Version Control",
      "Công cụ quản lý dự án",
      "Khác",
    ],
  },
});

SkillSchema.pre("validate", function setNormalizedName(next) {
  if (this.skill_name) {
    this.normalizedName = normalizeSkillName(this.skill_name);
  }
  next();
});

SkillSchema.index({ normalizedName: 1 }, { unique: true });

export const Skill = model<ISkill>("Skill", SkillSchema);
