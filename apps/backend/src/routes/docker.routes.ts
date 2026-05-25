/**
 * @fileoverview Docker Routes — Endpunkte für Container-Management
 * @description Registriert alle /api/docker-Routen mit authMiddleware-Schutz.
 *   Alle Endpunkte erfordern einen gültigen JWT (authMiddleware).
 *   Wird in index.ts unter /api/docker eingehängt.
 *
 *   Endpunkte:
 *     GET    /api/docker/containers              → Container-Liste
 *     GET    /api/docker/containers/:id/stats    → CPU, RAM, Uptime eines Containers
 *     GET    /api/docker/containers/:id/logs     → Letzte Log-Zeilen (tail=100)
 *     POST   /api/docker/containers/:id/start    → Container starten
 *     POST   /api/docker/containers/:id/stop     → Container stoppen
 *     DELETE /api/docker/containers/:id          → Container löschen (muss gestoppt sein)
 * @module DockerRoutes
 */

import { Router } from 'express';
import * as dockerController from '../controllers/docker.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const dockerRouter = Router();

// Alle Docker-Endpunkte erfordern einen gültigen JWT
dockerRouter.use(authMiddleware);

/**
 * GET /api/docker/containers
 * Gibt alle Container zurück (laufend + gestoppt).
 */
dockerRouter.get('/containers', dockerController.getContainers);

/**
 * GET /api/docker/containers/:id/stats
 * Gibt CPU-, RAM- und Uptime-Statistiken eines Containers zurück.
 */
dockerRouter.get('/containers/:id/stats', dockerController.getContainerStats);

/**
 * POST /api/docker/containers/:id/start
 * Startet einen Container per ID.
 */
dockerRouter.post('/containers/:id/start', dockerController.startContainer);

/**
 * POST /api/docker/containers/:id/stop
 * Stoppt einen Container per ID.
 */
dockerRouter.post('/containers/:id/stop', dockerController.stopContainer);

/**
 * DELETE /api/docker/containers/:id
 * Löscht einen gestoppten Container per ID.
 */
dockerRouter.delete('/containers/:id', dockerController.removeContainer);

/**
 * GET /api/docker/containers/:id/logs
 * Gibt die letzten Log-Zeilen eines Containers zurück (Query: ?tail=100).
 */
dockerRouter.get('/containers/:id/logs', dockerController.getContainerLogs);
