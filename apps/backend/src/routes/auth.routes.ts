/**
 * @fileoverview Auth Router — Routen-Definitionen für /api/auth
 * @description Registriert alle Auth-Endpunkte auf dem Express Router.
 *   POST /login — öffentlich (kein authMiddleware)
 *   GET  /me    — geschützt (authMiddleware prüft JWT)
 * @module AuthRouter
 */

import { Router } from 'express';
import { getMe, login } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

/**
 * Express Router für Auth-Endpunkte (/api/auth/*).
 * @description Wird in index.ts unter /api/auth eingehängt.
 *   /login: offen — keine Authentifizierung erforderlich.
 *   /me: geschützt — authMiddleware prüft Bearer-Token, setzt req.userId/userRole.
 */
export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, getMe);
