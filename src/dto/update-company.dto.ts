export interface UpdateCompanyDto {
  name?: string;
  shortName?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  location?: Array<{
    address: string;
    city: string;
    country: string;
  }>;
  workingEnvironment?: {
    type?: "On-site" | "Remote" | "Hybrid";
    techStack?: string[];
    benefits?: string[];
  };
  socialMediaLinks?: Array<{
    platform: "LinkedIn" | "Facebook" | "Twitter" | "GitHub" | "Zalo" | "Khác";
    url: string;
  }>;
  recruitingPreferences?: {
    targetRoles?: string[];
    targetLevels?: Array<{ level: "Intern" | "Fresher" }>;
    usingAIInterview?: boolean;
    usingManualInterview?: boolean;
  };
  partnerStatus?: "active" | "inactive";
}

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
};

export const validateUpdateCompanyDto = (
  payload: unknown,
): { value?: UpdateCompanyDto; error?: string } => {
  if (!isObject(payload)) {
    return { error: "Payload phải là object." };
  }

  const name = toOptionalTrimmedString(payload.name);
  const shortName = toOptionalTrimmedString(payload.shortName);
  const logoUrl = toOptionalTrimmedString(payload.logoUrl);
  const website = toOptionalTrimmedString(payload.website);
  const email = toOptionalTrimmedString(payload.email);
  const phone = toOptionalTrimmedString(payload.phone);
  const address = toOptionalTrimmedString(payload.address);
  const description = toOptionalTrimmedString(payload.description);
  const partnerStatusRaw = toOptionalTrimmedString(payload.partnerStatus);

  const location = Array.isArray(payload.location)
    ? payload.location.filter(isObject).map((item) => ({
        address: toOptionalTrimmedString(item.address) || "",
        city: toOptionalTrimmedString(item.city) || "",
        country: toOptionalTrimmedString(item.country) || "",
      }))
    : undefined;

  let workingEnvironment: UpdateCompanyDto["workingEnvironment"] | undefined;
  if (isObject(payload.workingEnvironment)) {
    const next: NonNullable<UpdateCompanyDto["workingEnvironment"]> = {};

    if (hasOwn(payload.workingEnvironment, "type")) {
      const normalizedType = toOptionalTrimmedString(
        payload.workingEnvironment.type,
      );
      if (!normalizedType) {
        return { error: "workingEnvironment.type không hợp lệ." };
      }

      next.type = normalizedType as "On-site" | "Remote" | "Hybrid";
    }

    if (hasOwn(payload.workingEnvironment, "techStack")) {
      if (!Array.isArray(payload.workingEnvironment.techStack)) {
        return { error: "workingEnvironment.techStack phải là mảng." };
      }

      next.techStack = payload.workingEnvironment.techStack
        .map((x) => toOptionalTrimmedString(x))
        .filter((x): x is string => Boolean(x));
    }

    if (hasOwn(payload.workingEnvironment, "benefits")) {
      if (!Array.isArray(payload.workingEnvironment.benefits)) {
        return { error: "workingEnvironment.benefits phải là mảng." };
      }

      next.benefits = payload.workingEnvironment.benefits
        .map((x) => toOptionalTrimmedString(x))
        .filter((x): x is string => Boolean(x));
    }

    if (Object.keys(next).length > 0) {
      workingEnvironment = next;
    }
  }

  const socialMediaLinks = Array.isArray(payload.socialMediaLinks)
    ? payload.socialMediaLinks.filter(isObject).map((item) => ({
        platform: (toOptionalTrimmedString(item.platform) || "") as
          | "LinkedIn"
          | "Facebook"
          | "Twitter"
          | "GitHub"
          | "Zalo"
          | "Khác",
        url: toOptionalTrimmedString(item.url) || "",
      }))
    : undefined;

  let recruitingPreferences:
    | UpdateCompanyDto["recruitingPreferences"]
    | undefined;
  if (isObject(payload.recruitingPreferences)) {
    const next: NonNullable<UpdateCompanyDto["recruitingPreferences"]> = {};

    if (hasOwn(payload.recruitingPreferences, "targetRoles")) {
      if (!Array.isArray(payload.recruitingPreferences.targetRoles)) {
        return { error: "recruitingPreferences.targetRoles phải là mảng." };
      }

      next.targetRoles = payload.recruitingPreferences.targetRoles
        .map((x) => toOptionalTrimmedString(x))
        .filter((x): x is string => Boolean(x));
    }

    if (hasOwn(payload.recruitingPreferences, "targetLevels")) {
      if (!Array.isArray(payload.recruitingPreferences.targetLevels)) {
        return { error: "recruitingPreferences.targetLevels phải là mảng." };
      }

      next.targetLevels = payload.recruitingPreferences.targetLevels
        .filter(isObject)
        .map((item) => ({
          level: (toOptionalTrimmedString(item.level) || "") as
            | "Intern"
            | "Fresher",
        }));
    }

    if (hasOwn(payload.recruitingPreferences, "usingAIInterview")) {
      if (typeof payload.recruitingPreferences.usingAIInterview !== "boolean") {
        return {
          error: "recruitingPreferences.usingAIInterview phải là boolean.",
        };
      }

      next.usingAIInterview = payload.recruitingPreferences.usingAIInterview;
    }

    if (hasOwn(payload.recruitingPreferences, "usingManualInterview")) {
      if (
        typeof payload.recruitingPreferences.usingManualInterview !== "boolean"
      ) {
        return {
          error: "recruitingPreferences.usingManualInterview phải là boolean.",
        };
      }

      next.usingManualInterview =
        payload.recruitingPreferences.usingManualInterview;
    }

    if (Object.keys(next).length > 0) {
      recruitingPreferences = next;
    }
  }

  if (website && !/^https?:\/\//i.test(website)) {
    return { error: "website phải bắt đầu bằng http:// hoặc https://." };
  }

  if (email && !email.includes("@")) {
    return { error: "email không hợp lệ." };
  }

  if (partnerStatusRaw && !["active", "inactive"].includes(partnerStatusRaw)) {
    return { error: "partnerStatus chỉ nhận active hoặc inactive." };
  }

  if (
    workingEnvironment?.type &&
    !["On-site", "Remote", "Hybrid"].includes(workingEnvironment.type)
  ) {
    return { error: "workingEnvironment.type không hợp lệ." };
  }

  const value: UpdateCompanyDto = {
    ...(name !== undefined ? { name } : {}),
    ...(shortName !== undefined ? { shortName } : {}),
    ...(logoUrl !== undefined ? { logoUrl } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(address !== undefined ? { address } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(workingEnvironment !== undefined ? { workingEnvironment } : {}),
    ...(socialMediaLinks !== undefined ? { socialMediaLinks } : {}),
    ...(recruitingPreferences !== undefined ? { recruitingPreferences } : {}),
    ...(partnerStatusRaw !== undefined
      ? { partnerStatus: partnerStatusRaw as "active" | "inactive" }
      : {}),
  };

  if (Object.keys(value).length === 0) {
    return { error: "Không có trường nào để cập nhật." };
  }

  return { value };
};
