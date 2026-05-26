/**
 * @fileoverview Docker Routes — Endpunkte für Container-Management
 * @description Registriert alle /api/docker-Routen mit authMiddleware-Schutz.
 *   Alle Endpunkte erfordern einen gültigen JWT (authMiddleware).
 *   Wird in index.ts unter /api/docker eingehängt.
 *
 *   Endpunkte:
 *     GET    /api/docker/containers                  → Container-Liste
 *     GET    /api/docker/containers/:id/stats        → CPU, RAM, Uptime eines Containers
 *     GET    /api/docker/containers/:id/logs         → Letzte Log-Zeilen (tail=100)
 *     GET    /api/docker/containers/:id/logs/stream  → Live-Log-Stream (SSE, follow=true)
 *     POST   /api/docker/containers/:id/start        → Container starten
 *     POST   /api/docker/containers/:id/stop         → Container stoppen
 *     DELETE /api/docker/containers/:id              → Container löschen (muss gestoppt sein)
 *     GET    /api/docker/stacks                      → Container nach Compose-Projekt gruppiert
 *     GET    /api/docker/stacks/scan                 → Filesystem-Scan (Compose-Dateien)
 *     POST   /api/docker/stacks                      → Neuen Stack erstellen + deployen
 *     POST   /api/docker/stacks/:name/start          → Alle Container eines Stacks starten
 *     POST   /api/docker/stacks/:name/stop           → Alle Container eines Stacks stoppen
 *     POST   /api/docker/stacks/:name/update         → docker compose pull && up -d
 *     GET    /api/docker/stacks/:name/compose        → Compose-Datei-Inhalt lesen
 *     PUT    /api/docker/stacks/:name/compose        → Compose-Datei speichern + deployen
 * @module DockerRoutes
 */

import { Router } from 'express';
import * as composeController from '../controllers/compose.controller';
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

/**
 * GET /api/docker/containers/:id/logs/stream
 * Streamt Live-Logs als Server-Sent Events (SSE). Auth via ?token= Query.
 */
dockerRouter.get('/containers/:id/logs/stream', dockerController.streamContainerLogs);

/**
 * GET /api/docker/stacks
 * Gibt alle Container gruppiert nach Docker Compose Projekt zurück.
 */
dockerRouter.get('/stacks', dockerController.getStacks);

/**
 * GET /api/docker/stacks/scan
 * Scannt DOCKER_STACKS_PATH nach Verzeichnissen mit Compose-Files.
 * Muss VOR /stacks/:name/* registriert sein um Namenskonflikt zu vermeiden.
 */
dockerRouter.get('/stacks/scan', composeController.scanStacks);

/**
 * POST /api/docker/stacks
 * Erstellt einen neuen Stack (Verzeichnis + compose.yaml + docker compose up -d).
 * Muss VOR den /:name-Routen stehen (kein Konflikt, aber klare Reihenfolge).
 */
dockerRouter.post('/stacks', composeController.createStack);

/**
 * POST /api/docker/stacks/:name/start
 * Startet alle gestoppten Container des angegebenen Stacks.
 */
dockerRouter.post('/stacks/:name/start', dockerController.startStack);

/**
 * POST /api/docker/stacks/:name/stop
 * Stoppt alle laufenden Container des angegebenen Stacks.
 */
dockerRouter.post('/stacks/:name/stop', dockerController.stopStack);

/**
 * POST /api/docker/stacks/:name/update
 * Aktualisiert einen Stack via docker compose pull && up -d.
 */
dockerRouter.post('/stacks/:name/update', composeController.updateStack);

/**
 * GET /api/docker/stacks/:name/compose
 * Gibt den YAML-Inhalt der Compose-Datei eines Stacks zurück.
 */
dockerRouter.get('/stacks/:name/compose', composeController.getComposeContent);

/**
 * PUT /api/docker/stacks/:name/compose
 * Speichert den Compose-Datei-Inhalt und deployed den Stack via docker compose up -d.
 * Body: { content: string }
 */
dockerRouter.put('/stacks/:name/compose', composeController.saveAndDeployStack);
