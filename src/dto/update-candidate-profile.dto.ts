import {
  IAchievement,
  IBasicInfo,
  IEducation,
  ILanguage,
  ISkills,
} from "../models/CandidateProfile";

export interface UpdateCandidateProfileDto {
  basicInfo?: IBasicInfo;
  education?: IEducation;
  strengths?: string;
  skills?: ISkills;
  languages?: ILanguage[];
  achievements?: IAchievement[];
}
