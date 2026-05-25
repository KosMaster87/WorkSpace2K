/**
 * @fileoverview Users Routes — Endpunkte für User-Management
 * @description Alle /api/users Routen — ausschließlich für ADMIN-User.
 *   authMiddleware: JWT-Prüfung (setzt req.userId + req.userRole).
 *   adminOnly: prüft ob req.userRole === 'ADMIN', sonst HTTP 403.
 * @module UsersRoutes
 */

import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import * as usersController from '../controllers/users.controller';

export const usersRouter = Router();

/**
 * Middleware: Zugriff nur für ADMIN-User.
 * @description Wird nach authMiddleware eingehängt — req.userRole ist zu diesem
 *   Zeitpunkt bereits gesetzt. HTTP 403 für nicht-ADMIN-User.
 * @param {AuthRequest} req - Request mit userRole.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - Nächster Handler.
 * @returns {void}
 */
function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ message: 'Nur ADMIN-User haben Zugriff.' });
    return;
  }
  next();
}

usersRouter.use(authMiddleware);
usersRouter.use(adminOnly);

/** GET /api/users — alle User auflisten */
usersRouter.get('/', usersController.listUsers);

/** POST /api/users — neuen User anlegen */
usersRouter.post('/', usersController.createUser);

/** PATCH /api/users/:id/role — Rolle eines Users ändern */
usersRouter.patch('/:id/role', usersController.updateUserRole);

/** DELETE /api/users/:id — User löschen */
usersRouter.delete('/:id', usersController.deleteUser);
