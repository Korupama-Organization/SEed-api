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

export interface UpdateCandidateProfileDto {
  academicInfo?: IAcademicInfo;
  languages?: ILanguage[];
  achievements?: IAchievement[];
  advantagePoint?: string;
  technicalSkills?: UpdateTechnicalSkillDto[];
  softSkills?: string[];
  projects?: IProject[];
  workExperiences?: IWorkExperience[];
  introductionQuestions?: IIntroductionQuestions;
}
