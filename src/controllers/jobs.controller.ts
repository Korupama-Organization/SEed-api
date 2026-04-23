import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { listJobs, getJobById, JobsServiceError, createJobService, updateJobService, deleteJobService } from "../services/jobs.service";
import { CreateJobDto} from "../dto/create-job.dto";
import { UpdateJobDto } from "../dto/update-job.dto";

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