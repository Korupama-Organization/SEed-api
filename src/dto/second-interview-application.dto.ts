import { plainToInstance } from "class-transformer";
import {
  IsOptional,
  IsString,
  validate,
  ValidationError,
} from "class-validator";

export class SecondInterviewApplicationDto {
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

export const validateSecondInterviewApplicationDto = async (
  payload: unknown,
): Promise<{ value?: SecondInterviewApplicationDto; error?: string }> => {
  const dto = plainToInstance(SecondInterviewApplicationDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return { error: formatValidationErrors(errors) || "Invalid payload" };
  }

  return { value: dto };
};
