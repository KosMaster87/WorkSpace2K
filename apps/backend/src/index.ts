import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`WorkSpace2K API running on http://localhost:${PORT}`);
});
