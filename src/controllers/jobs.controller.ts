import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { 
  listJobs, 
  getJobById, 
  JobsServiceError, 
  createJobService, 
  updateJobService, 
  deleteJobService, 
  publishJobService,
  closeJobService,
  listCandidates,
  listJobApplicants,
  getApplicantProfileByJob,
  getCandidateApplicationsStatus,
} from "../services/jobs.service";

import { CreateJobDto} from "../dto/create-job.dto";
import { UpdateJobDto } from "../dto/update-job.dto";

const getQueryString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

export const getListJobs = async (
  req: Request,
  res: Response
) => {
  try {
    const page = req.query.page as string || "1"
    const limit = req.query.limit as string || "10"
    const result = await listJobs({ page, limit });

    return res.status(200).json({
      message: "Get list jobs successfully",
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get list jobs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getListCandidates = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const result = await listCandidates(userId, {
      page: getQueryString(req.query.page) || "1",
      limit: getQueryString(req.query.limit) || "10",
      search: getQueryString(req.query.search),
      status: getQueryString(req.query.status),
      hasProfile: getQueryString(req.query.hasProfile),
      major: getQueryString(req.query.major),
      university: getQueryString(req.query.university),
    });

    return res.status(200).json({
      message: "Get list candidates successfully",
      data: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get list candidates error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getJobApplicants = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobId = req.params.id as string;

    const result = await listJobApplicants(userId, jobId, {
      page: getQueryString(req.query.page) || "1",
      limit: getQueryString(req.query.limit) || "10",
      search: getQueryString(req.query.search),
    });

    return res.status(200).json({
      message: "Get job applicants successfully",
      data: result.applicants,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get job applicants error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getApplicantProfileByJobController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobId = req.params.id as string;
    const applicationId = getQueryString(req.query.applicationId);
    const candidateUserId = getQueryString(req.query.candidateUserId);

    const result = await getApplicantProfileByJob(userId, jobId, {
      applicationId,
      candidateUserId,
    });

    return res.status(200).json({
      message: "Get applicant profile successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get applicant profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getJobDetail = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string
    const job = await getJobById(id);

    return res.status(200).json({
      message: "Get job details successfully",
      data: job,
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get job detail error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createJobController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobData: CreateJobDto = req.body;
    const newJob = await createJobService(userId, jobData);

    return res.status(201).json({
      message: "Create new job successfully",
      data: newJob,
    });
  }
  catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Create job error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateJobController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobId = req.params.id as string;
    const jobData: UpdateJobDto = req.body;
    await updateJobService(userId, jobId, jobData);

    return res.status(200).json({
      message: "Cập nhật job thành công",
    });
  }
  catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Update job error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteJobController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobId = req.params.id as string;
    await deleteJobService(userId, jobId);

    return res.status(200).json({
      message: "Xóa job thành công",
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Delete job error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const publishJobController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobId = req.params.id as string;
    await publishJobService(userId, jobId);

    return res.status(200).json({
      message: "Publish job thành công",
    });

  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Publish job error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const closeJobController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const jobId = req.params.id as string;
    await closeJobService(userId, jobId);

    return res.status(200).json({
      message: "Close job thành công",
    });

  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Close job error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const getCandidateApplicationsStatusController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const result = await getCandidateApplicationsStatus(userId, {
      page: getQueryString(req.query.page) || "1",
      limit: getQueryString(req.query.limit) || "10",
    });

    return res.status(200).json({
      message: "Get candidate applications status successfully",
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get candidate applications status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}