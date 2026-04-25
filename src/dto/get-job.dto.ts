export interface JobBasicDto {
  id: string;
  slug: string;
  companyId: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  basicInfo: {
    title: string;
    summary: string;
    jobDescription: string;
    roleType: string;
  };
  location: string;
  workModel: string;
  level: string;
  jobType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
