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
    type: "On-site" | "Remote" | "Hybrid";
    techStack: string[];
    benefits: string[];
  };
  socialMediaLinks?: Array<{
    platform: "LinkedIn" | "Facebook" | "Twitter" | "GitHub" | "Zalo" | "Khác";
    url: string;
  }>;
  recruitingPreferences?: {
    targetRoles: string[];
    targetLevels: Array<{ level: "Intern" | "Fresher" }>;
    usingAIInterview: boolean;
    usingManualInterview: boolean;
  };
  partnerStatus?: "active" | "inactive";
}

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

  const workingEnvironment = isObject(payload.workingEnvironment)
    ? {
        type: (toOptionalTrimmedString(payload.workingEnvironment.type) ||
          "") as "On-site" | "Remote" | "Hybrid",
        techStack: Array.isArray(payload.workingEnvironment.techStack)
          ? payload.workingEnvironment.techStack
              .map((x) => toOptionalTrimmedString(x))
              .filter((x): x is string => Boolean(x))
          : [],
        benefits: Array.isArray(payload.workingEnvironment.benefits)
          ? payload.workingEnvironment.benefits
              .map((x) => toOptionalTrimmedString(x))
              .filter((x): x is string => Boolean(x))
          : [],
      }
    : undefined;

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

  const recruitingPreferences = isObject(payload.recruitingPreferences)
    ? {
        targetRoles: Array.isArray(payload.recruitingPreferences.targetRoles)
          ? payload.recruitingPreferences.targetRoles
              .map((x) => toOptionalTrimmedString(x))
              .filter((x): x is string => Boolean(x))
          : [],
        targetLevels: Array.isArray(payload.recruitingPreferences.targetLevels)
          ? payload.recruitingPreferences.targetLevels
              .filter(isObject)
              .map((item) => ({
                level: (toOptionalTrimmedString(item.level) || "") as
                  | "Intern"
                  | "Fresher",
              }))
          : [],
        usingAIInterview: Boolean(
          payload.recruitingPreferences.usingAIInterview,
        ),
        usingManualInterview:
          payload.recruitingPreferences.usingManualInterview !== false,
      }
    : undefined;

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
