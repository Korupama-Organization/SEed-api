import { ClientSession, FilterQuery, startSession } from "mongoose";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { UpdateCompanyDto } from "../dto/update-company.dto";
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

interface CompaniesQuery {
  page?: string;
  limit?: string;
  search?: string;
}

interface ListCompaniesResult {
  companies: ICompany[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

const parsePositiveInteger = (
  value: string | undefined,
  defaultValue: number,
  fieldName: string,
): number => {
  const parsed = parseInt(value || `${defaultValue}`, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new CompanyOnboardingError(`${fieldName} phải là số nguyên dương`, 400);
  }

  return parsed;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildRegex = (value: string): RegExp => {
  return new RegExp(escapeRegex(value.trim()), "i");
};

export const listCompanies = async (
  query: CompaniesQuery,
): Promise<ListCompaniesResult> => {
  const page = parsePositiveInteger(query.page, 1, "page");
  const limit = parsePositiveInteger(query.limit, 10, "limit");
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ICompany> = {};
  const search = query.search?.trim();
  if (search) {
    const regex = buildRegex(search);
    filter.$or = [
      { name: regex },
      { shortName: regex },
      { websiteUrl: regex },
      { email: regex },
      { "location.city": regex },
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Company.countDocuments(filter),
  ]);

  return {
    companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

const getCurrentUserCompanyMembership = async (userId: string) => {
  const member = await CompanyMember.findOne({ userId }).populate("companyId");

  if (!member) {
    throw new CompanyOnboardingError("Bạn chưa thuộc công ty nào.", 404);
  }

  if (!member.companyId) {
    throw new CompanyOnboardingError("Không tìm thấy thông tin công ty.", 404);
  }

  return member;
};

const assertManagerPermission = (membershipRole: string) => {
  if (membershipRole !== "manager") {
    throw new CompanyOnboardingError(
      "Chỉ manager mới có quyền cập nhật/xóa công ty.",
      403,
    );
  }
};

export const getMyCompany = async (userId: string): Promise<ICompany> => {
  const member = await getCurrentUserCompanyMembership(userId);
  return member.companyId as unknown as ICompany;
};

export const updateMyCompany = async (
  userId: string,
  dto: UpdateCompanyDto,
): Promise<ICompany> => {
  const member = await getCurrentUserCompanyMembership(userId);
  assertManagerPermission(member.membershipRole);

  const company = member.companyId as unknown as ICompany;

  if (dto.name !== undefined) company.name = dto.name;
  if (dto.shortName !== undefined) company.shortName = dto.shortName;
  if (dto.logoUrl !== undefined) company.logoUrl = dto.logoUrl;
  if (dto.website !== undefined) company.websiteUrl = dto.website;
  if (dto.email !== undefined) company.email = dto.email;
  if (dto.phone !== undefined) company.phone = dto.phone;
  if (dto.description !== undefined) company.description = dto.description;

  if (dto.location !== undefined) {
    company.location = dto.location;
  } else if (dto.address !== undefined) {
    if (company.location.length > 0) {
      company.location[0].address = dto.address;
    } else {
      company.location = [
        {
          address: dto.address,
          city: "Unknown",
          country: "Vietnam",
        },
      ];
    }
  }

  if (dto.workingEnvironment !== undefined) {
    company.workingEnvironment = {
      type: dto.workingEnvironment.type ?? company.workingEnvironment.type,
      techStack:
        dto.workingEnvironment.techStack ??
        company.workingEnvironment.techStack,
      benefits:
        dto.workingEnvironment.benefits ?? company.workingEnvironment.benefits,
    };
  }

  if (dto.socialMediaLinks !== undefined)
    company.socialMediaLinks = dto.socialMediaLinks;

  if (dto.recruitingPreferences !== undefined) {
    company.recruitingPreferences = {
      targetRoles:
        dto.recruitingPreferences.targetRoles ??
        company.recruitingPreferences.targetRoles,
      targetLevels:
        dto.recruitingPreferences.targetLevels ??
        company.recruitingPreferences.targetLevels,
      usingAIInterview:
        dto.recruitingPreferences.usingAIInterview ??
        company.recruitingPreferences.usingAIInterview,
      usingManualInterview:
        dto.recruitingPreferences.usingManualInterview ??
        company.recruitingPreferences.usingManualInterview,
    };
  }

  if (dto.partnerStatus !== undefined)
    company.partnerStatus = dto.partnerStatus;

  await company.save();
  return company;
};

export const deleteMyCompany = async (userId: string): Promise<void> => {
  const member = await getCurrentUserCompanyMembership(userId);
  assertManagerPermission(member.membershipRole);

  const company = member.companyId as unknown as ICompany;
  const session = await startSession();

  try {
    session.startTransaction();

    await CompanyMember.deleteMany({ companyId: company._id }).session(session);
    await Company.findByIdAndDelete(company._id).session(session);

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    throw new CompanyOnboardingError(
      error?.message || "Không thể xóa công ty.",
      500,
    );
  } finally {
    await session.endSession();
  }
};
