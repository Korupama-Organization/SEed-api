import { CompanyMember, ICompanyMember } from "../models/CompanyMember";
import { User } from "../models/User";
import { CreateCompanyMemberDto } from "../dto/create-company-member.dto";
import { UpdateCompanyMemberDto } from "../dto/update-company-member.dto";

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
    .populate("userId", "fullName email avatarUrl role status")
    .sort({ createdAt: -1 });

  return { companyId: String(companyId), members };
};

export const getCompanyMemberById = async (
  userId: string,
  memberId: string,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  const companyId = currentMember.companyId;

  const member = await CompanyMember.findOne({
    _id: memberId,
    companyId,
  }).populate("userId", "fullName email avatarUrl role status");

  if (!member) {
    throw new CompanyMemberError("Thành viên không tồn tại.", 404);
  }

  return member;
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

export const updateCompanyMember = async (
  userId: string,
  memberId: string,
  dto: UpdateCompanyMemberDto,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  assertManager(currentMember);

  const member = await CompanyMember.findOne({
    _id: memberId,
    companyId: currentMember.companyId,
  });

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

export const removeCompanyMember = async (
  userId: string,
  memberId: string,
) => {
  const currentMember = await getCurrentUserMembership(userId);
  assertManager(currentMember);

  const member = await CompanyMember.findOne({
    _id: memberId,
    companyId: currentMember.companyId,
  });

  if (!member) {
    throw new CompanyMemberError("Thành viên không tồn tại.", 404);
  }

  if (String(member._id) === String(currentMember._id)) {
    throw new CompanyMemberError("Không thể tự xóa chính mình.", 400);
  }

  await CompanyMember.findByIdAndDelete(member._id);
};
