/**
 * @fileoverview Destinations Routes — Endpunkte für Service-Destinations
 * @description GET /api/destinations — alle eingeloggten User.
 *   POST / PATCH / DELETE — nur ADMIN-User (adminOnly Middleware).
 *   authMiddleware: JWT-Prüfung (setzt req.userId + req.userRole).
 * @module DestinationsRoutes
 */

import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import * as destinationsController from '../controllers/destinations.controller';

export const destinationsRouter = Router();

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

/** GET /api/destinations — alle aktiven Destinations (alle eingeloggten User) */
destinationsRouter.get('/', authMiddleware, destinationsController.listDestinations);

/** POST /api/destinations — neue Destination anlegen (nur ADMIN) */
destinationsRouter.post('/', authMiddleware, adminOnly, destinationsController.createDestination);

/** PATCH /api/destinations/:id — Destination bearbeiten (nur ADMIN) */
destinationsRouter.patch(
  '/:id',
  authMiddleware,
  adminOnly,
  destinationsController.updateDestination,
);

/** DELETE /api/destinations/:id — Destination löschen (nur ADMIN) */
destinationsRouter.delete(
  '/:id',
  authMiddleware,
  adminOnly,
  destinationsController.deleteDestination,
);
