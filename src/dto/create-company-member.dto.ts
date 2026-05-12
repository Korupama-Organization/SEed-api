export interface CreateCompanyMemberDto {
  email: string;
  membershipRole: "recruiter" | "interviewer";
  jobTitle: string;
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

export const validateCreateCompanyMemberDto = (
  payload: unknown,
): { value?: CreateCompanyMemberDto; error?: string } => {
  if (!isObject(payload)) {
    return { error: "Payload phải là object." };
  }

  const email = toTrimmedString(payload.email);
  const jobTitle = toTrimmedString(payload.jobTitle);
  const membershipRole = toTrimmedString(payload.membershipRole);

  if (!email) {
    return { error: "email là bắt buộc." };
  }

  if (!email.includes("@")) {
    return { error: "email không hợp lệ." };
  }

  if (!membershipRole) {
    return { error: "membershipRole là bắt buộc." };
  }

  if (!["recruiter", "interviewer"].includes(membershipRole)) {
    return { error: "membershipRole phải là recruiter hoặc interviewer." };
  }

  if (!jobTitle) {
    return { error: "jobTitle là bắt buộc." };
  }

  let permission: CreateCompanyMemberDto["permission"] | undefined;
  if (isObject(payload.permission)) {
    permission = {};

    if (payload.permission.canCreateJob !== undefined) {
      if (typeof payload.permission.canCreateJob !== "boolean") {
        return { error: "permission.canCreateJob phải là boolean." };
      }
      permission.canCreateJob = payload.permission.canCreateJob;
    }

    if (payload.permission.canUpdateJob !== undefined) {
      if (typeof payload.permission.canUpdateJob !== "boolean") {
        return { error: "permission.canUpdateJob phải là boolean." };
      }
      permission.canUpdateJob = payload.permission.canUpdateJob;
    }

    if (payload.permission.canDeleteJob !== undefined) {
      if (typeof payload.permission.canDeleteJob !== "boolean") {
        return { error: "permission.canDeleteJob phải là boolean." };
      }
      permission.canDeleteJob = payload.permission.canDeleteJob;
    }

    if (payload.permission.canViewApplications !== undefined) {
      if (typeof payload.permission.canViewApplications !== "boolean") {
        return { error: "permission.canViewApplications phải là boolean." };
      }
      permission.canViewApplications = payload.permission.canViewApplications;
    }

    if (payload.permission.canUpdateApplicationStatus !== undefined) {
      if (typeof payload.permission.canUpdateApplicationStatus !== "boolean") {
        return {
          error: "permission.canUpdateApplicationStatus phải là boolean.",
        };
      }
      permission.canUpdateApplicationStatus =
        payload.permission.canUpdateApplicationStatus;
    }

    if (payload.permission.canScheduleInterviews !== undefined) {
      if (typeof payload.permission.canScheduleInterviews !== "boolean") {
        return {
          error: "permission.canScheduleInterviews phải là boolean.",
        };
      }
      permission.canScheduleInterviews =
        payload.permission.canScheduleInterviews;
    }
  }

  return {
    value: {
      email,
      membershipRole: membershipRole as "recruiter" | "interviewer",
      jobTitle,
      ...(permission && Object.keys(permission).length > 0
        ? { permission }
        : {}),
    },
  };
};
