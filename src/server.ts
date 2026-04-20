import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import connectDB from "./db/connect";
import authRoutes from "./routes/auth.routes";
import candidateProfileRoutes from "./routes/candidate-profile.routes";
import companiesRoutes from "./routes/companies.routes";
import { validateRequiredEnv } from "./utils/env-validation";
import swaggerSpec from "./utils/swagger";
import swaggerUi from "swagger-ui-express";

const app = express();
const PORT = process.env.PORT || 5000;

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

const start = async () => {
  validateRequiredEnv();
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is up and running at http://localhost:${PORT}`);
  });
};

start();
