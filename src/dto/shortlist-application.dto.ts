import { plainToInstance, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  validate,
  ValidationError,
} from "class-validator";

class ScreeningResultsDto {
  @IsOptional()
  @IsEnum(["not_started", "processing", "passed", "failed", "manual_override"])
  resumeScreening?:
    | "not_started"
    | "processing"
    | "passed"
    | "failed"
    | "manual_override";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchedSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  missingSkills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsDateString()
  evaluatedAt?: string;

  @IsOptional()
  @IsString()
  evaluatedBy?: string;
}

export class ShortlistApplicationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ScreeningResultsDto)
  screeningResults?: ScreeningResultsDto;

  @IsOptional()
  @IsString()
  note?: string;
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

export const validateShortlistApplicationDto = async (
  payload: unknown,
): Promise<{ value?: ShortlistApplicationDto; error?: string }> => {
  const dto = plainToInstance(ShortlistApplicationDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return { error: formatValidationErrors(errors) || "Invalid payload" };
  }

  return { value: dto };
};
