import "reflect-metadata";
import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import type { Server } from "http";
import connectDB from "./db/connect";
import authRoutes from "./routes/auth.routes";
import candidateProfileRoutes from "./routes/candidate-profile.routes";
import companiesRoutes from "./routes/companies.routes";
import jobRoutes from "./routes/job.routes";
import applicationsRoutes from "./routes/applications.routes";
import interviewSessionsRoutes from "./routes/interview-sessions.routes";
import recruiterDashboardRoutes from "./routes/recruiter-dashboard.routes";
import companyMembersRoutes from "./routes/company-members.routes";
import { validateRequiredEnv } from "./utils/env-validation";
import swaggerSpec from "./utils/swagger";
import swaggerUi from "swagger-ui-express";

const app = express();
const PORT = process.env.PORT || 5000;
let httpServer: Server | null = null;

app.use(cors());
app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Studuy API Docs",
    swaggerOptions: { persistAuthorization: false },
  }),
);

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "STUDUY BACKEND API" });
});

// ── TODO: Register routes ─────────────────────────────────────────────────────

// ── TODO: Register routes ─────────────────────────────────────────────────────
// app.use('/api/courses', courseRoutes);
// app.use('/api/lessons', lessonRoutes);
// app.use('/api/orders',  orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/candidate-profiles", candidateProfileRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/interview-sessions", interviewSessionsRoutes);
app.use("/api/recruiter-dashboard", recruiterDashboardRoutes);
app.use("/api/company-members", companyMembersRoutes);

const start = async () => {
  validateRequiredEnv();
  await connectDB();
  httpServer = app.listen(PORT, () => {
    console.log(`Server is up and running at http://localhost:${PORT}`);
  });
};

const shutdown = (signal: NodeJS.Signals) => {
  if (!httpServer) {
    process.exit(0);
  }

  httpServer.close(() => {
    console.log(`Received ${signal}. Server closed.`);
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGUSR2", () => shutdown("SIGUSR2"));

start();
