export interface UpdateRecruiterProfileDto {
  fullName?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  avatarUrl?: string;
  gender?: "Nam" | "Nữ" | "Khác";
  dateOfBirth?: string;
  jobTitle?: string;
  membershipRole?: "manager" | "recruiter" | "interviewer";
}

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const VALID_GENDERS = ["Nam", "Nữ", "Khác"];
const VALID_ROLES = ["manager", "recruiter", "interviewer"];

export const validateUpdateRecruiterProfileDto = (
  payload: unknown,
): { value?: UpdateRecruiterProfileDto; error?: string } => {
  if (!isObject(payload)) {
    return { error: "Payload phải là object." };
  }

  const value: UpdateRecruiterProfileDto = {};

  if (hasOwn(payload, "fullName")) {
    const fullName = toTrimmedString(payload.fullName);
    if (!fullName) return { error: "fullName không hợp lệ." };
    value.fullName = fullName;
  }

  if (hasOwn(payload, "phone")) {
    const phone = toTrimmedString(payload.phone);
    value.phone = phone || undefined;
  }

  if (hasOwn(payload, "linkedinUrl")) {
    const linkedinUrl = toTrimmedString(payload.linkedinUrl);
    value.linkedinUrl = linkedinUrl || undefined;
  }

  if (hasOwn(payload, "githubUrl")) {
    const githubUrl = toTrimmedString(payload.githubUrl);
    value.githubUrl = githubUrl || undefined;
  }

  if (hasOwn(payload, "facebookUrl")) {
    const facebookUrl = toTrimmedString(payload.facebookUrl);
    value.facebookUrl = facebookUrl || undefined;
  }

  if (hasOwn(payload, "avatarUrl")) {
    const avatarUrl = toTrimmedString(payload.avatarUrl);
    value.avatarUrl = avatarUrl || undefined;
  }

  if (hasOwn(payload, "gender")) {
    const gender = toTrimmedString(payload.gender);
    if (!gender || !VALID_GENDERS.includes(gender)) {
      return { error: "gender không hợp lệ. Chấp nhận: Nam, Nữ, Khác." };
    }
    value.gender = gender as "Nam" | "Nữ" | "Khác";
  }

  if (hasOwn(payload, "dateOfBirth")) {
    if (typeof payload.dateOfBirth !== "string" || isNaN(Date.parse(payload.dateOfBirth))) {
      return { error: "dateOfBirth không hợp lệ." };
    }
    value.dateOfBirth = payload.dateOfBirth;
  }

  if (hasOwn(payload, "membershipRole")) {
    const role = toTrimmedString(payload.membershipRole);
    if (!role || !VALID_ROLES.includes(role)) {
      return { error: "membershipRole không hợp lệ." };
    }
    value.membershipRole = role as "manager" | "recruiter" | "interviewer";
  }

  if (hasOwn(payload, "jobTitle")) {
    const jobTitle = toTrimmedString(payload.jobTitle);
    if (!jobTitle) return { error: "jobTitle không hợp lệ." };
    value.jobTitle = jobTitle;
  }

  if (Object.keys(value).length === 0) {
    return { error: "Không có trường nào để cập nhật." };
  }

  return { value };
};
