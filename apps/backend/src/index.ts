/**
 * @fileoverview WorkSpace2K API Server — Express App Einstiegspunkt
 * @description Konfiguriert und startet den Express-Server.
 *   Middleware: helmet (Security-Header), cors (Frontend-Origin), express.json (Body-Parser).
 *   Routes: /api/auth (Login, Session), /api/docker (Container), /api/users (Admin),
 *   /api/health (Health-Check).
 *   Port und CORS-Origin kommen aus .env.
 * @module Server
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { dockerRouter } from './routes/docker.routes';
import { usersRouter } from './routes/users.routes';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/docker', dockerRouter);
app.use('/api/users', usersRouter);

/**
 * Health-Check Endpoint — prüft ob der Server erreichbar ist.
 * @description Gibt HTTP 200 mit aktuellem Timestamp zurück.
 *   Wird von Deployment-Scripts und Monitoring-Tools genutzt.
 * @returns {{ status: string, timestamp: string }} Server-Status.
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`WorkSpace2K API running on http://localhost:${PORT}`);
});
