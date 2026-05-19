import { Router } from 'express';
import { getMe, login } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, getMe);
