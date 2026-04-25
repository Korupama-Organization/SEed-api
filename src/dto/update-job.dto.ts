import { CreateJobDto } from "./create-job.dto";

export interface UpdateJobDto {
  basicInfo?: Partial<CreateJobDto["basicInfo"]>;
  requirements?: Partial<CreateJobDto["requirements"]>;
}

/*
{
  "requirements": {
    "minMonthsExperience": 3
  }
}
*/