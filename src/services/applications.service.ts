import { Types } from "mongoose";
import { Application, IApplication } from "../models/Application";
import { CreateApplicationDto } from "../dto/create-application.dto";
import { ShortlistApplicationDto } from "../dto/shortlist-application.dto";
import { InterviewApplicationDto } from "../dto/interview-application.dto";
import { OfferApplicationDto } from "../dto/offer-application.dto";
import { HireApplicationDto } from "../dto/hire-application.dto";
import { RejectApplicationDto } from "../dto/reject-application.dto";

export class ApplicationServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type ApplicationStatus =
  | "applied"
  | "screening_passed"
  | "ai_interview_completed"
  | "manual_interview_completed"
  | "offered"
  | "hired";

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["screening_passed"],
  screening_passed: ["ai_interview_completed", "manual_interview_completed"],
  ai_interview_completed: ["offered"],
  manual_interview_completed: ["offered"],
  offered: ["hired"],
  hired: [],
};

const buildStatusEntry = (status: ApplicationStatus, note?: string) => {
  const timestamp = new Date();

  return {
    status,
    note: note?.trim() || "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const assertValidObjectId = (id: string, label: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApplicationServiceError(`${label} is invalid`, 400);
  }
};

const toObjectId = (
  value: string,
  label: string,
): IApplication["finalDecision"]["decidedBy"] => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApplicationServiceError(`${label} is invalid`, 400);
  }

  return new Types.ObjectId(
    value,
  ) as unknown as IApplication["finalDecision"]["decidedBy"];
};

const toEvaluatedBy = (
  value: string,
): IApplication["screeningResults"]["evaluatedBy"] => {
  if (value === "System") {
    return "System";
  }

  if (!Types.ObjectId.isValid(value)) {
    throw new ApplicationServiceError("evaluatedBy is invalid", 400);
  }

  return new Types.ObjectId(
    value,
  ) as unknown as IApplication["screeningResults"]["evaluatedBy"];
};

const toDateValue = (value: string | Date, label: string): Date => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApplicationServiceError(`${label} is invalid`, 400);
  }

  return date;
};

const getLatestStatus = (application: IApplication): ApplicationStatus => {
  const latest =
    application.applicationStatus?.[application.applicationStatus.length - 1];

  if (!latest?.status) {
    throw new ApplicationServiceError(
      "Application status history is missing",
      400,
    );
  }

  return latest.status as ApplicationStatus;
};

const assertTransitionAllowed = (
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
): void => {
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApplicationServiceError(
      `Cannot transition from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }
};

const assertNotRejected = (application: IApplication): void => {
  if (application.finalDecision?.decision === "reject") {
    throw new ApplicationServiceError("Application has been rejected", 400);
  }
};

const getApplicationById = async (id: string): Promise<IApplication> => {
  assertValidObjectId(id, "Application id");

  const application = await Application.findById(id);
  if (!application) {
    throw new ApplicationServiceError("Application not found", 404);
  }

  return application;
};

export const applyApplication = async (
  dto: CreateApplicationDto,
): Promise<IApplication> => {
  assertValidObjectId(dto.candidateUserId, "Candidate id");
  assertValidObjectId(dto.jobId, "Job id");

  const existing = await Application.findOne({
    candidateUserId: dto.candidateUserId,
    jobId: dto.jobId,
  });

  if (existing) {
    throw new ApplicationServiceError("Application already exists", 400);
  }

  const application = await Application.create({
    candidateUserId: dto.candidateUserId,
    jobId: dto.jobId,
    applicationStatus: [buildStatusEntry("applied", dto.note)],
  });

  return application;
};

export const shortlistApplication = async (
  id: string,
  dto: ShortlistApplicationDto,
): Promise<IApplication> => {
  const application = await getApplicationById(id);

  assertNotRejected(application);

  const currentStatus = getLatestStatus(application);
  assertTransitionAllowed(currentStatus, "screening_passed");

  if (dto.screeningResults) {
    const nextScreeningResults = {
      ...application.screeningResults,
    };

    if (dto.screeningResults.resumeScreening !== undefined) {
      nextScreeningResults.resumeScreening =
        dto.screeningResults.resumeScreening;
    }

    if (dto.screeningResults.matchedSkills !== undefined) {
      nextScreeningResults.matchedSkills = dto.screeningResults.matchedSkills;
    }

    if (dto.screeningResults.missingSkills !== undefined) {
      nextScreeningResults.missingSkills = dto.screeningResults.missingSkills;
    }

    if (dto.screeningResults.score !== undefined) {
      nextScreeningResults.score = dto.screeningResults.score;
    }

    if (dto.screeningResults.evaluatedAt) {
      nextScreeningResults.evaluatedAt = toDateValue(
        dto.screeningResults.evaluatedAt,
        "evaluatedAt",
      );
    }

    if (dto.screeningResults.evaluatedBy) {
      nextScreeningResults.evaluatedBy = toEvaluatedBy(
        dto.screeningResults.evaluatedBy,
      );
    }

    application.screeningResults = nextScreeningResults;
  }

  application.applicationStatus.push(
    buildStatusEntry("screening_passed", dto.note),
  );

  return application.save();
};

export const interviewApplication = async (
  id: string,
  dto: InterviewApplicationDto,
): Promise<IApplication> => {
  const application = await getApplicationById(id);

  assertNotRejected(application);

  const currentStatus = getLatestStatus(application);
  assertTransitionAllowed(currentStatus, "manual_interview_completed");

  application.applicationStatus.push(
    buildStatusEntry("manual_interview_completed", dto.note),
  );

  return application.save();
};

export const offerApplication = async (
  id: string,
  dto: OfferApplicationDto,
  decidedBy: string,
): Promise<IApplication> => {
  if (!decidedBy) {
    throw new ApplicationServiceError("DecidedBy is required", 400);
  }

  assertValidObjectId(decidedBy, "DecidedBy");

  const application = await getApplicationById(id);

  assertNotRejected(application);

  const currentStatus = getLatestStatus(application);
  assertTransitionAllowed(currentStatus, "offered");

  application.applicationStatus.push(buildStatusEntry("offered", dto.note));
  application.finalDecision = {
    decision: "offer",
    decidedAt: new Date(),
    decidedBy: toObjectId(decidedBy, "DecidedBy"),
  };

  return application.save();
};

export const hireApplication = async (
  id: string,
  dto: HireApplicationDto,
  decidedBy: string,
): Promise<IApplication> => {
  if (!decidedBy) {
    throw new ApplicationServiceError("DecidedBy is required", 400);
  }

  assertValidObjectId(decidedBy, "DecidedBy");

  const application = await getApplicationById(id);

  assertNotRejected(application);

  const currentStatus = getLatestStatus(application);
  assertTransitionAllowed(currentStatus, "hired");

  application.applicationStatus.push(buildStatusEntry("hired", dto.note));
  if (!application.finalDecision?.decision) {
    application.finalDecision = {
      decision: "offer",
      decidedAt: new Date(),
      decidedBy: toObjectId(decidedBy, "DecidedBy"),
    };
  }

  return application.save();
};

export const rejectApplication = async (
  id: string,
  dto: RejectApplicationDto,
  decidedBy: string,
): Promise<IApplication> => {
  if (!decidedBy) {
    throw new ApplicationServiceError("DecidedBy is required", 400);
  }

  assertValidObjectId(decidedBy, "DecidedBy");

  const application = await getApplicationById(id);

  if (application.finalDecision?.decision === "reject") {
    throw new ApplicationServiceError("Application has been rejected", 400);
  }

  if (dto.note) {
    const currentStatus = getLatestStatus(application);
    application.applicationStatus.push(
      buildStatusEntry(currentStatus, dto.note),
    );
  }

  application.finalDecision = {
    decision: "reject",
    decidedAt: new Date(),
    decidedBy: toObjectId(decidedBy, "DecidedBy"),
  };

  return application.save();
};
