import { CompanyMember } from "../models/CompanyMember";
import { IUser, User } from "../models/User";

interface ExistingCompanyProfileResponse {
  isNewbie: false;
  user: Record<string, unknown>;
  companyInfo: unknown;
  membershipRole: "manager" | "recruiter" | "interviewer";
  permissions: {
    canCreateJob: boolean;
    canUpdateJob: boolean;
    canDeleteJob: boolean;
    canViewApplications: boolean;
    canUpdateApplicationStatus: boolean;
    canScheduleInterviews: boolean;
    canUpdateCompanyProfile: boolean;
  };
}

interface NewbieProfileResponse {
  isNewbie: true;
  user: Record<string, unknown>;
  message: "Vui lòng tạo profile công ty";
}

interface CandidateProfileResponse {
  user: Record<string, unknown>;
}

export type AuthProfileResponse =
  | CandidateProfileResponse
  | ExistingCompanyProfileResponse
  | NewbieProfileResponse;

export class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const sanitizeUser = (user: IUser): Record<string, unknown> => {
  const safe = user.toObject() as Record<string, any>;

  if (safe.normalAuth) {
    delete safe.normalAuth.passwordHash;
  }

  return safe;
};

export const getProfile = async (
  userId: string,
): Promise<AuthProfileResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AuthServiceError("User not found", 404);
  }

  if (user.role === "candidate") {
    return {
      user: sanitizeUser(user),
    };
  }

  // Inject them CompanyMember model in auth flow to resolve company membership from /auth/me
  const member = await CompanyMember.findOne({ userId }).populate("companyId");

  if (!member) {
    return {
      isNewbie: true,
      user: sanitizeUser(user),
      message: "Vui lòng tạo profile công ty",
    };
  }

  return {
    isNewbie: false,
    user: sanitizeUser(user),
    companyInfo: member.companyId,
    membershipRole: member.membershipRole,
    permissions: member.permission,
  };
};
