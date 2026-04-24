import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { CreateInterviewSessionDto } from "./create-interview-session.dto";

export class UpdateInterviewSessionDto extends PartialType(
  CreateInterviewSessionDto,
) {}

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

export const validateUpdateInterviewSessionDto = async (
  payload: unknown,
): Promise<{ value?: UpdateInterviewSessionDto; error?: string }> => {
  const dto = plainToInstance(UpdateInterviewSessionDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return { error: formatValidationErrors(errors) || "Invalid payload" };
  }

  return { value: dto };
};
