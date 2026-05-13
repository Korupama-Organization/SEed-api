export interface CreateCompanyMemberAuthDto {
  email: string;
  password: string;
  fullName: string;
  membershipRole: "recruiter" | "interviewer";
  jobTitle: string;
  phone?: string | null;
  linkedinUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  avatarUrl?: string;
  gender?: "Nam" | "Nữ" | "Khác";
  dateOfBirth?: string;
  permission?: {
    canCreateJob?: boolean;
    canUpdateJob?: boolean;
    canDeleteJob?: boolean;
    canViewApplications?: boolean;
    canUpdateApplicationStatus?: boolean;
    canScheduleInterviews?: boolean;
  };
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const VALID_GENDERS = ["Nam", "Nữ", "Khác"];

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateCreateCompanyMemberAuthDto = (
  payload: unknown,
): { value?: CreateCompanyMemberAuthDto; error?: string } => {
  if (!isObject(payload)) {
    return { error: "Payload phải là object." };
  }

  const email = payload.email ? normalizeEmail(toTrimmedString(payload.email) || "") : "";
  const password = toTrimmedString(payload.password);
  const fullName = toTrimmedString(payload.fullName);
  const jobTitle = toTrimmedString(payload.jobTitle);
  const membershipRole = toTrimmedString(payload.membershipRole);

  if (!email) return { error: "email là bắt buộc." };
  if (!email.includes("@")) return { error: "email không hợp lệ." };

  if (!password) return { error: "password là bắt buộc." };
  if (password.length < 6) return { error: "password phải có ít nhất 6 ký tự." };

  if (!fullName) return { error: "fullName là bắt buộc." };

  if (!membershipRole) return { error: "membershipRole là bắt buộc." };
  if (!["recruiter", "interviewer"].includes(membershipRole)) {
    return { error: "membershipRole phải là recruiter hoặc interviewer." };
  }

  if (!jobTitle) return { error: "jobTitle là bắt buộc." };

  let permission: CreateCompanyMemberAuthDto["permission"] | undefined;
  if (isObject(payload.permission)) {
    permission = {};

    if (hasOwn(payload.permission, "canCreateJob")) {
      if (typeof payload.permission.canCreateJob !== "boolean")
        return { error: "permission.canCreateJob phải là boolean." };
      permission.canCreateJob = payload.permission.canCreateJob;
    }
    if (hasOwn(payload.permission, "canUpdateJob")) {
      if (typeof payload.permission.canUpdateJob !== "boolean")
        return { error: "permission.canUpdateJob phải là boolean." };
      permission.canUpdateJob = payload.permission.canUpdateJob;
    }
    if (hasOwn(payload.permission, "canDeleteJob")) {
      if (typeof payload.permission.canDeleteJob !== "boolean")
        return { error: "permission.canDeleteJob phải là boolean." };
      permission.canDeleteJob = payload.permission.canDeleteJob;
    }
    if (hasOwn(payload.permission, "canViewApplications")) {
      if (typeof payload.permission.canViewApplications !== "boolean")
        return { error: "permission.canViewApplications phải là boolean." };
      permission.canViewApplications = payload.permission.canViewApplications;
    }
    if (hasOwn(payload.permission, "canUpdateApplicationStatus")) {
      if (typeof payload.permission.canUpdateApplicationStatus !== "boolean")
        return { error: "permission.canUpdateApplicationStatus phải là boolean." };
      permission.canUpdateApplicationStatus = payload.permission.canUpdateApplicationStatus;
    }
    if (hasOwn(payload.permission, "canScheduleInterviews")) {
      if (typeof payload.permission.canScheduleInterviews !== "boolean")
        return { error: "permission.canScheduleInterviews phải là boolean." };
      permission.canScheduleInterviews = payload.permission.canScheduleInterviews;
    }
  }

  let gender: CreateCompanyMemberAuthDto["gender"] | undefined;
  if (hasOwn(payload, "gender")) {
    const g = toTrimmedString(payload.gender);
    if (!g || !VALID_GENDERS.includes(g)) {
      return { error: "gender không hợp lệ. Chấp nhận: Nam, Nữ, Khác." };
    }
    gender = g as "Nam" | "Nữ" | "Khác";
  }

  let dateOfBirth: string | undefined;
  if (hasOwn(payload, "dateOfBirth")) {
    if (typeof payload.dateOfBirth !== "string" || isNaN(Date.parse(payload.dateOfBirth))) {
      return { error: "dateOfBirth không hợp lệ." };
    }
    dateOfBirth = payload.dateOfBirth;
  }

  const value: CreateCompanyMemberAuthDto = {
    email,
    password,
    fullName,
    membershipRole: membershipRole as "recruiter" | "interviewer",
    jobTitle,
  };

  if (hasOwn(payload, "phone")) {
    const phone = toTrimmedString(payload.phone);
    value.phone = phone || null;
  }
  if (hasOwn(payload, "linkedinUrl")) {
    const v = toTrimmedString(payload.linkedinUrl);
    value.linkedinUrl = v || undefined;
  }
  if (hasOwn(payload, "githubUrl")) {
    const v = toTrimmedString(payload.githubUrl);
    value.githubUrl = v || undefined;
  }
  if (hasOwn(payload, "facebookUrl")) {
    const v = toTrimmedString(payload.facebookUrl);
    value.facebookUrl = v || undefined;
  }
  if (hasOwn(payload, "avatarUrl")) {
    const v = toTrimmedString(payload.avatarUrl);
    value.avatarUrl = v || undefined;
  }
  if (gender) value.gender = gender;
  if (dateOfBirth) value.dateOfBirth = dateOfBirth;
  if (permission && Object.keys(permission).length > 0) {
    value.permission = permission;
  }

  return { value };
};
