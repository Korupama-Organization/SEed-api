import { plainToInstance } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  validate,
  ValidationError,
} from "class-validator";

export class CancelInterviewSessionDto {
  @IsNotEmpty()
  @IsString()
  cancelReason!: string;
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

export const validateCancelInterviewSessionDto = async (
  payload: unknown,
): Promise<{ value?: CancelInterviewSessionDto; error?: string }> => {
  const dto = plainToInstance(CancelInterviewSessionDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return { error: formatValidationErrors(errors) || "Invalid payload" };
  }

  return { value: dto };
};
