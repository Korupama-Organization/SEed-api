import bcrypt from "bcrypt";
import { CompanyMember, ICompanyMember } from "../models/CompanyMember";
import { User } from "../models/User";
import { CreateCompanyMemberDto } from "../dto/create-company-member.dto";
import { CreateCompanyMemberAuthDto } from "../dto/create-company-member-auth.dto";
import { UpdateCompanyMemberDto } from "../dto/update-company-member.dto";
import { UpdateRecruiterProfileDto } from "../dto/update-recruiter-profile.dto";

export class CompanyMemberError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const getCurrentUserMembership = async (userId: string) => {
  const member = await CompanyMember.findOne({ userId });

  if (!member) {
    throw new CompanyMemberError("Bạn chưa thuộc công ty nào.", 404);
  }

  return member;
};

const assertManager = (member: ICompanyMember) => {
  if (member.membershipRole !== "manager") {
    throw new CompanyMemberError(
      "Chỉ manager mới có quyền thực hiện thao tác này.",
      403,
    );
  }
};

export const listCompanyMembers = async (userId: string) => {
  const currentMember = await getCurrentUserMembership(userId);
  const companyId = currentMember.companyId;

  const members = await CompanyMember.find({ companyId })
    .populate("userId", "fullName contactInfo avatarUrl role status")
    .sort({ createdAt: -1 });

  const mapped = members.map((m) => {
    const doc = m.toObject();
    const user = doc.userId as any;
    return {
      ...doc,
      email: user?.contactInfo?.email || null,
    };
  });

  return { companyId: String(companyId), members: mapped };
};

export const getCompanyMemberById = async (
  userId: string,
  memberId: string,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  const companyId = currentMember.companyId;

  let member = await CompanyMember.findOne({
    _id: memberId,
    companyId,
  }).populate("userId", "fullName contactInfo avatarUrl role status");

  if (!member) {
    member = await CompanyMember.findOne({
      userId: memberId,
      companyId,
    }).populate("userId", "fullName contactInfo avatarUrl role status");
  }

  if (!member) {
    throw new CompanyMemberError("Thành viên không tồn tại.", 404);
  }

  const doc = member.toObject();
  const user = doc.userId as any;
  return { ...doc, email: user?.email || null };
};

export const createCompanyMember = async (
  userId: string,
  dto: CreateCompanyMemberDto,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  assertManager(currentMember);

  const targetUser = await User.findOne({
    "normalAuth.email": dto.email,
  });

  if (!targetUser) {
    throw new CompanyMemberError(
      "Không tìm thấy người dùng với email này.",
      404,
    );
  }

  const existingMember = await CompanyMember.findOne({
    userId: targetUser._id,
    companyId: currentMember.companyId,
  });

  if (existingMember) {
    throw new CompanyMemberError(
      "Người dùng này đã là thành viên của công ty.",
      409,
    );
  }

  const defaults = {
    canCreateJob: false,
    canUpdateJob: false,
    canDeleteJob: false,
    canViewApplications: true,
    canUpdateApplicationStatus: false,
    canScheduleInterviews: false,
  };

  const member = await CompanyMember.create({
    userId: targetUser._id,
    companyId: currentMember.companyId,
    membershipRole: dto.membershipRole,
    jobTitle: dto.jobTitle,
    permission: dto.permission
      ? { ...defaults, ...dto.permission }
      : defaults,
  });

  await User.findByIdAndUpdate(targetUser._id, {
    $set: { role: "recruiter" },
  });

  return member;
};

export const createCompanyMemberWithAuth = async (
  userId: string,
  dto: CreateCompanyMemberAuthDto,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  assertManager(currentMember);

  const existingUser = await User.findOne({
    $or: [
      { "normalAuth.email": dto.email },
      { "contactInfo.email": dto.email },
    ],
  });
  if (existingUser) {
    throw new CompanyMemberError("Email đã được đăng ký.", 409);
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const now = new Date();

  const newUser = await User.create({
    role: "recruiter",
    authMethod: "normal_auth",
    status: "active",
    fullName: dto.fullName,
    gender: dto.gender,
    avatarUrl: dto.avatarUrl,
    normalAuth: {
      email: dto.email,
      passwordHash,
      passwordUpdatedAt: now,
    },
    contactInfo: {
      email: dto.email,
      phone: dto.phone ?? null,
      linkedinUrl: dto.linkedinUrl,
      githubUrl: dto.githubUrl,
      facebookUrl: dto.facebookUrl,
    },
  });

  const defaults = {
    canCreateJob: false,
    canUpdateJob: false,
    canDeleteJob: false,
    canViewApplications: true,
    canUpdateApplicationStatus: false,
    canScheduleInterviews: false,
  };

  const member = await CompanyMember.create({
    userId: newUser._id,
    companyId: currentMember.companyId,
    membershipRole: dto.membershipRole,
    jobTitle: dto.jobTitle,
    permission: dto.permission
      ? { ...defaults, ...dto.permission }
      : defaults,
  });

  const populated = await CompanyMember.findById(member._id)
    .populate("userId", "fullName contactInfo avatarUrl role status");

  const doc = populated!.toObject();
  const user = doc.userId as any;

  return {
    ...doc,
    email: user?.contactInfo?.email || null,
  };
};

export const updateCompanyMember = async (
  userId: string,
  memberId: string,
  dto: UpdateCompanyMemberDto,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  assertManager(currentMember);

  let member = await CompanyMember.findOne({
    _id: memberId,
    companyId: currentMember.companyId,
  });

  if (!member) {
    member = await CompanyMember.findOne({
      userId: memberId,
      companyId: currentMember.companyId,
    });
  }

  if (!member) {
    throw new CompanyMemberError("Thành viên không tồn tại.", 404);
  }

  if (dto.membershipRole !== undefined) {
    member.membershipRole = dto.membershipRole;
  }

  if (dto.jobTitle !== undefined) {
    member.jobTitle = dto.jobTitle;
  }

  if (dto.permission !== undefined) {
    if (dto.permission.canCreateJob !== undefined) {
      member.permission.canCreateJob = dto.permission.canCreateJob;
    }
    if (dto.permission.canUpdateJob !== undefined) {
      member.permission.canUpdateJob = dto.permission.canUpdateJob;
    }
    if (dto.permission.canDeleteJob !== undefined) {
      member.permission.canDeleteJob = dto.permission.canDeleteJob;
    }
    if (dto.permission.canViewApplications !== undefined) {
      member.permission.canViewApplications = dto.permission.canViewApplications;
    }
    if (dto.permission.canUpdateApplicationStatus !== undefined) {
      member.permission.canUpdateApplicationStatus =
        dto.permission.canUpdateApplicationStatus;
    }
    if (dto.permission.canScheduleInterviews !== undefined) {
      member.permission.canScheduleInterviews =
        dto.permission.canScheduleInterviews;
    }
  }

  await member.save();
  return member;
};

export const updateRecruiterProfile = async (
  userId: string,
  dto: UpdateRecruiterProfileDto,
) => {
  const currentMember = await getCurrentUserMembership(userId);

  const $set: Record<string, unknown> = {};

  if (dto.fullName !== undefined) $set.fullName = dto.fullName;
  if (dto.avatarUrl !== undefined) $set.avatarUrl = dto.avatarUrl;
  if (dto.gender !== undefined) $set.gender = dto.gender;
  if (dto.dateOfBirth !== undefined) $set.dateOfBirth = new Date(dto.dateOfBirth);
  if (dto.phone !== undefined) $set["contactInfo.phone"] = dto.phone;
  if (dto.linkedinUrl !== undefined) $set["contactInfo.linkedinUrl"] = dto.linkedinUrl;
  if (dto.githubUrl !== undefined) $set["contactInfo.githubUrl"] = dto.githubUrl;
  if (dto.facebookUrl !== undefined) $set["contactInfo.facebookUrl"] = dto.facebookUrl;

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set },
    { new: true },
  ).select("fullName contactInfo avatarUrl gender dateOfBirth role status");

  if (dto.membershipRole !== undefined || dto.jobTitle !== undefined) {
    const memberUpdate: Record<string, unknown> = {};
    if (dto.membershipRole !== undefined) memberUpdate.membershipRole = dto.membershipRole;
    if (dto.jobTitle !== undefined) memberUpdate.jobTitle = dto.jobTitle;
    await CompanyMember.findByIdAndUpdate(currentMember._id, { $set: memberUpdate });
  }

  const updatedMember = await CompanyMember.findById(currentMember._id)
    .populate("userId", "fullName contactInfo avatarUrl role status");

  const doc = updatedMember!.toObject();
  const user = doc.userId as any;

  return {
    ...doc,
    email: user?.contactInfo?.email || null,
  };
};

export const removeCompanyMember = async (
  userId: string,
  memberId: string,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  assertManager(currentMember);

  let member = await CompanyMember.findOne({
    _id: memberId,
    companyId: currentMember.companyId,
  });

  if (!member) {
    member = await CompanyMember.findOne({
      userId: memberId,
      companyId: currentMember.companyId,
    });
  }

  if (!member) {
    throw new CompanyMemberError("Thành viên không tồn tại.", 404);
  }

  if (String(member._id) === String(currentMember._id)) {
    throw new CompanyMemberError("Không thể tự xóa chính mình.", 400);
  }

  await CompanyMember.findByIdAndDelete(member._id);
};
