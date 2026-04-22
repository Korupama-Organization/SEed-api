import { Request, Response } from "express";
import { listJobs, getJobById, JobsServiceError } from "../services/jobs.service";

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