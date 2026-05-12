export interface UpdateCompanyMemberDto {
  membershipRole?: "manager" | "recruiter" | "interviewer";
  jobTitle?: string;
  permission?: {
    canCreateJob?: boolean;
    canUpdateJob?: boolean;
    canDeleteJob?: boolean;
    canViewApplications?: boolean;
    canUpdateApplicationStatus?: boolean;
    canScheduleInterviews?: boolean;
  };
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

const VALID_ROLES = ["manager", "recruiter", "interviewer"];

export const validateUpdateCompanyMemberDto = (
  payload: unknown,
): { value?: UpdateCompanyMemberDto; error?: string } => {
  if (!isObject(payload)) {
    return { error: "Payload phải là object." };
  }

  const membershipRole = toTrimmedString(payload.membershipRole);
  const jobTitle = toTrimmedString(payload.jobTitle);

  if (membershipRole !== undefined && !VALID_ROLES.includes(membershipRole)) {
    return { error: "membershipRole không hợp lệ." };
  }

  let permission: UpdateCompanyMemberDto["permission"] | undefined;
  if (isObject(payload.permission)) {
    permission = {};

    if (hasOwn(payload.permission, "canCreateJob")) {
      if (typeof payload.permission.canCreateJob !== "boolean") {
        return { error: "permission.canCreateJob phải là boolean." };
      }
      permission.canCreateJob = payload.permission.canCreateJob;
    }

    if (hasOwn(payload.permission, "canUpdateJob")) {
      if (typeof payload.permission.canUpdateJob !== "boolean") {
        return { error: "permission.canUpdateJob phải là boolean." };
      }
      permission.canUpdateJob = payload.permission.canUpdateJob;
    }

    if (hasOwn(payload.permission, "canDeleteJob")) {
      if (typeof payload.permission.canDeleteJob !== "boolean") {
        return { error: "permission.canDeleteJob phải là boolean." };
      }
      permission.canDeleteJob = payload.permission.canDeleteJob;
    }

    if (hasOwn(payload.permission, "canViewApplications")) {
      if (typeof payload.permission.canViewApplications !== "boolean") {
        return { error: "permission.canViewApplications phải là boolean." };
      }
      permission.canViewApplications = payload.permission.canViewApplications;
    }

    if (hasOwn(payload.permission, "canUpdateApplicationStatus")) {
      if (typeof payload.permission.canUpdateApplicationStatus !== "boolean") {
        return {
          error: "permission.canUpdateApplicationStatus phải là boolean.",
        };
      }
      permission.canUpdateApplicationStatus =
        payload.permission.canUpdateApplicationStatus;
    }

    if (hasOwn(payload.permission, "canScheduleInterviews")) {
      if (typeof payload.permission.canScheduleInterviews !== "boolean") {
        return {
          error: "permission.canScheduleInterviews phải là boolean.",
        };
      }
      permission.canScheduleInterviews =
        payload.permission.canScheduleInterviews;
    }
  }

  const value: UpdateCompanyMemberDto = {};

  if (membershipRole !== undefined) {
    value.membershipRole = membershipRole as "manager" | "recruiter" | "interviewer";
  }

  if (jobTitle !== undefined) {
    value.jobTitle = jobTitle;
  }

  if (permission !== undefined && Object.keys(permission).length > 0) {
    value.permission = permission;
  }

  if (Object.keys(value).length === 0) {
    return { error: "Không có trường nào để cập nhật." };
  }

  return { value };
};
