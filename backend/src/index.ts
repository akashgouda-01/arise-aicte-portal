import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { applicationRouter } from './routes/applicationRoutes';
import { complianceRouter } from './routes/complianceRoutes';
import { inspectionRouter } from './routes/inspectionRoutes';
import { policyRouter } from './routes/policyRoutes';
import { alertRouter } from './routes/alertRoutes';
import { auditRouter } from './routes/auditRoutes';
import { authRouter } from './routes/authRoutes';
import { taskRouter } from './routes/taskRoutes';
import { documentRouter } from './routes/documentRoutes';
import { institutionRouter } from './routes/institutionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// API Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'AICTE Approval & Compliance Engine (SIH26262)',
    timestamp: new Date().toISOString(),
    environment: 'Demonstration & Scrutiny Simulation Sandbox',
  });
});

// Register routers
app.use('/api/applications', applicationRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/inspections', inspectionRouter);
app.use('/api/policies', policyRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/audit', auditRouter);
app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);
app.use('/api/institutions', institutionRouter);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AICTE ENGINE API] Server running on http://localhost:${PORT}`);
  });
}

export default app;
