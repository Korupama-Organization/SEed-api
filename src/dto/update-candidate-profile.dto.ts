import {
  IAcademicInfo,
  IAchievement,
  IIntroductionQuestions,
  ILanguage,
  IProject,
  ITechnicalSkill,
  IWorkExperience,
} from "../models/CandidateProfile";
import { Types } from "mongoose";

export interface UpdateTechnicalSkillDto {
  category?: ITechnicalSkill["category"];
  name?: string;
  skillId?: Types.ObjectId | string;
  yearsOfExperience: number;
  confidence?: boolean;
}

export interface UpdateSkillReferenceDto {
  skillId?: Types.ObjectId | string;
  name?: string;
  category?: ITechnicalSkill["category"];
}

export type UpdateSkillReferenceInput =
  | Types.ObjectId
  | string
  | UpdateSkillReferenceDto;

export type UpdateProjectDto = Omit<IProject, "technologies"> & {
  technologies: UpdateSkillReferenceInput[];
};

export type UpdateWorkExperienceDto = Omit<
  IWorkExperience,
  "technologiesUsed"
> & {
  technologiesUsed: UpdateSkillReferenceInput[];
};

export interface UpdateCandidateProfileDto {
  academicInfo?: IAcademicInfo;
  languages?: ILanguage[];
  achievements?: IAchievement[];
  advantagePoint?: string;
  technicalSkills?: UpdateTechnicalSkillDto[];
  softSkills?: string[];
  projects?: UpdateProjectDto[];
  workExperiences?: UpdateWorkExperienceDto[];
  introductionQuestions?: IIntroductionQuestions;
}
