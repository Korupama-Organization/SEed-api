import {
  IAcademicInfo,
  IAchievement,
  IIntroductionQuestions,
  ILanguage,
  IProject,
  ITechnicalSkill,
  IWorkExperience,
} from "../models/CandidateProfile";

export interface UpdateCandidateProfileDto {
  academicInfo?: IAcademicInfo;
  languages?: ILanguage[];
  achievements?: IAchievement[];
  advantagePoint?: string;
  technicalSkills?: ITechnicalSkill[];
  softSkills?: string[];
  projects?: IProject[];
  workExperiences?: IWorkExperience[];
  introductionQuestions?: IIntroductionQuestions;
}
