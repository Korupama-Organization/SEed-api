// Entry point of the backend server
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './db/connect';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: '. BACKEND API' });
});

// ── TODO: Register routes ─────────────────────────────────────────────────────
// app.use('/api/auth',    authRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/lessons', lessonRoutes);
// app.use('/api/orders',  orderRoutes);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is up and running at http://localhost:${PORT} 🚀`);
    });
};

start();
