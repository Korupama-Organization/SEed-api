import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { CreateInterviewSessionDto } from "./create-interview-session.dto";

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toEditableStringValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value;
  }

  if (!isObject(value)) {
    return value;
  }

  if (typeof value.value === "string") {
    return value.value;
  }

  if (typeof value.label === "string") {
    return value.label;
  }

  return value;
};

const normalizeUpdateInterviewSessionPayload = (payload: unknown): unknown => {
  if (!isObject(payload)) {
    return payload;
  }

  const normalized: Record<string, unknown> = { ...payload };

  if (Array.isArray(payload.conversations)) {
    normalized.conversations = payload.conversations.map((conversation) => {
      if (!isObject(conversation)) {
        return conversation;
      }

      const nextConversation: Record<string, unknown> = { ...conversation };

      if (hasOwn(conversation, "question")) {
        nextConversation.question = toEditableStringValue(conversation.question);
      }

      if (hasOwn(conversation, "answer")) {
        nextConversation.answer = toEditableStringValue(conversation.answer);
      }

      return nextConversation;
    });
  }

  return normalized;
};

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
  const normalizedPayload = normalizeUpdateInterviewSessionPayload(payload);
  const dto = plainToInstance(UpdateInterviewSessionDto, normalizedPayload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return { error: formatValidationErrors(errors) || "Invalid payload" };
  }

  return { value: dto };
};
