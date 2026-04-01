import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response } from 'express';
import connectDB from './db/connect';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import creditTransactionRoutes from './routes/credit-transaction.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import lessonRoutes from './routes/lesson.routes';
import livestreamRoutes from './routes/livestream.routes';
import orderRoutes from './routes/order.routes';
import { validateRequiredEnv } from './utils/env-validation';
import swaggerSpec from './utils/swagger';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Studuy API Docs',
        swaggerOptions: { persistAuthorization: true },
    }),
);

app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'STUDUY BACKEND API' });
});

import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';

// ── TODO: Register routes ─────────────────────────────────────────────────────
app.use('/api/wallet', walletRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/lessons', lessonRoutes);
// app.use('/api/orders',  orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/livestreams', livestreamRoutes);
app.use('/api/credit-transactions', creditTransactionRoutes);

const start = async () => {
    validateRequiredEnv();
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is up and running at http://localhost:${PORT}`);
    });
};

start();
