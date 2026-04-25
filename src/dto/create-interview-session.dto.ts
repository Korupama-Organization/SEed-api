import { plainToInstance, Type } from "class-transformer";
import {
  ValidationError,
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  validate,
} from "class-validator";

class ConversationEvaluationDto {
  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weaknesses?: string[];

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  intentCategory?: string;
}

class ConversationDto {
  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsNotEmpty()
  @IsString()
  answer!: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  audioUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConversationEvaluationDto)
  evaluation?: ConversationEvaluationDto;
}

class FinalReportDto {
  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @IsOptional()
  @IsNumber()
  technicalScore?: number;

  @IsOptional()
  @IsNumber()
  communicationScore?: number;

  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  aiSummary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvementAreas?: string[];
}

export class CreateInterviewSessionDto {
  @IsNotEmpty()
  @IsMongoId()
  jobId!: string;

  @IsNotEmpty()
  @IsMongoId()
  candidateId!: string;

  @IsNotEmpty()
  @IsEnum(["real", "mock"])
  sessionType!: "real" | "mock";

  @IsNotEmpty()
  @IsEnum(["technical", "behavioral", "hr"])
  interviewMode!: "technical" | "behavioral" | "hr";

  @IsNotEmpty()
  @IsEnum(["scheduled", "in_progress", "coding_test", "completed", "cancelled"])
  status!:
    | "scheduled"
    | "in_progress"
    | "coding_test"
    | "completed"
    | "cancelled";

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationDto)
  conversations?: ConversationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FinalReportDto)
  finalReport?: FinalReportDto;

  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  @IsNotEmpty()
  @IsDateString()
  endTime!: string;
}

const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = "",
): string[] => {
  const messages: string[] = [];

  for (const error of errors) {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      messages.push(
        ...Object.values(error.constraints).map(
          (message) => `${fieldPath}: ${message}`,
        ),
      );
    }

    if (error.children && error.children.length > 0) {
      messages.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return messages;
};

const formatValidationErrors = (errors: ValidationError[]): string => {
  return flattenValidationErrors(errors).join("; ");
};

export const validateCreateInterviewSessionDto = async (
  payload: unknown,
): Promise<{ value?: CreateInterviewSessionDto; error?: string }> => {
  const dto = plainToInstance(CreateInterviewSessionDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return { error: formatValidationErrors(errors) || "Invalid payload" };
  }

  return { value: dto };
};
