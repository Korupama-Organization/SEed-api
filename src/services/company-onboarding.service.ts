import { ClientSession, startSession } from "mongoose";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { Company, ICompany } from "../models/Company";
import { CompanyMember } from "../models/CompanyMember";
import { IUser, User } from "../models/User";

interface ExistingMemberProfileResponse {
  isNewbie: false;
  user: Record<string, unknown>;
  companyId: string;
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

export type UserCompanyStatusResponse =
  | ExistingMemberProfileResponse
  | NewbieProfileResponse;

export class CompanyOnboardingError extends Error {
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

const buildShortName = (name: string): string => {
  const compact = name.trim().replace(/\s+/g, " ");
  if (compact.length <= 30) {
    return compact;
  }

  return compact.slice(0, 30);
};

export const getMyProfileAndCompanyStatus = async (
  userId: string,
): Promise<UserCompanyStatusResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new CompanyOnboardingError("User not found", 404);
  }

  const companyMember = await CompanyMember.findOne({ userId }).lean();

  if (!companyMember) {
    return {
      isNewbie: true,
      user: sanitizeUser(user),
      message: "Vui lòng tạo profile công ty",
    };
  }

  return {
    isNewbie: false,
    user: sanitizeUser(user),
    companyId: String(companyMember.companyId),
    membershipRole: companyMember.membershipRole,
    permissions: {
      canCreateJob: Boolean(companyMember.permission?.canCreateJob),
      canUpdateJob: Boolean(companyMember.permission?.canUpdateJob),
      canDeleteJob: Boolean(companyMember.permission?.canDeleteJob),
      canViewApplications: Boolean(
        companyMember.permission?.canViewApplications,
      ),
      canUpdateApplicationStatus: Boolean(
        companyMember.permission?.canUpdateApplicationStatus,
      ),
      canScheduleInterviews: Boolean(
        companyMember.permission?.canScheduleInterviews,
      ),
      canUpdateCompanyProfile: Boolean(
        companyMember.permission?.canUpdateCompanyProfile,
      ),
    },
  };
};

const createCompanyInSession = async (
  user: IUser,
  dto: CreateCompanyDto,
  session: ClientSession,
): Promise<ICompany> => {
  const normalizedDescription =
    dto.description?.trim() || "Company profile is being updated.";

  const companyDocs = await Company.create(
    [
      {
        name: dto.name,
        shortName: dto.shortName || buildShortName(dto.name),
        logoUrl: dto.logoUrl || "",
        websiteUrl: dto.website,
        description: normalizedDescription,
        email: dto.email || user.contactInfo.email,
        phone: dto.phone || user.contactInfo.phone || "N/A",
        location:
          dto.location && dto.location.length > 0
            ? dto.location
            : [
                {
                  address: dto.address,
                  city: "Unknown",
                  country: "Vietnam",
                },
              ],
        workingEnvironment: dto.workingEnvironment || {
          type: "Hybrid",
          techStack: ["Node.js"],
          benefits: [],
        },
        socialMediaLinks: dto.socialMediaLinks || [
          {
            platform: "LinkedIn",
            url: dto.website,
          },
        ],
        recruitingPreferences: dto.recruitingPreferences || {
          targetRoles: ["Backend Developer"],
          targetLevels: [{ level: "Intern" }, { level: "Fresher" }],
          usingAIInterview: false,
          usingManualInterview: true,
        },
        partnerStatus: dto.partnerStatus || "inactive",
      },
    ],
    { session },
  );

  return companyDocs[0];
};

export const createCompanyForNewbie = async (
  userId: string,
  dto: CreateCompanyDto,
): Promise<ICompany> => {
  const session = await startSession();

  try {
    session.startTransaction();

    const existingMembership = await CompanyMember.findOne({ userId }).session(
      session,
    );
    if (existingMembership) {
      throw new CompanyOnboardingError(
        "User already belongs to a company. Cannot create a new company profile.",
        409,
      );
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new CompanyOnboardingError("User not found", 404);
    }

    const company = await createCompanyInSession(user, dto, session);

    await CompanyMember.create(
      [
        {
          userId: user._id,
          companyId: company._id,
          membershipRole: "manager",
          jobTitle: "Founder / HR Manager",
          permission: {
            canCreateJob: true,
            canUpdateJob: true,
            canDeleteJob: true,
            canViewApplications: true,
            canUpdateApplicationStatus: true,
            canScheduleInterviews: true,
            canUpdateCompanyProfile: true,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return company;
  } catch (error: any) {
    await session.abortTransaction();

    if (error instanceof CompanyOnboardingError) {
      throw error;
    }

    if (error?.code === 11000) {
      throw new CompanyOnboardingError(
        "Company already exists or duplicate membership detected.",
        409,
      );
    }

    throw new CompanyOnboardingError(
      error?.message || "Failed to create company profile.",
      500,
    );
  } finally {
    await session.endSession();
  }
};
