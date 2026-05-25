/**
 * @fileoverview Docker Controller — HTTP-Handler für Container-Management
 * @description Verarbeitet HTTP-Requests für die Docker API.
 *   Delegiert die eigentliche Logik an docker.service.ts.
 *   Fehlerbehandlung: Socket-Fehler → 503, Container nicht gefunden → 404,
 *   falscher Status (z.B. already running) → 409.
 *
 *   Endpunkte:
 *     GET    /api/docker/containers              → getContainers
 *     GET    /api/docker/containers/:id/stats    → getContainerStats
 *     GET    /api/docker/containers/:id/logs     → getContainerLogs
 *     POST   /api/docker/containers/:id/start    → startContainer
 *     POST   /api/docker/containers/:id/stop     → stopContainer
 *     DELETE /api/docker/containers/:id          → removeContainer
 * @module DockerController
 */

import { Request, Response } from 'express';
import * as dockerService from '../services/docker.service';

/**
 * Gibt alle Docker-Container zurück.
 * @description GET /api/docker/containers — Liste aller Container (laufend + gestoppt).
 *   Bei nicht erreichbarem Docker Socket → HTTP 503 Service Unavailable.
 * @async
 * @param {Request} _req - Express Request (keine Parameter benötigt).
 * @param {Response} res - Express Response mit { data: DockerService[] }.
 * @returns {Promise<void>}
 */
export async function getContainers(_req: Request, res: Response): Promise<void> {
  try {
    const containers = await dockerService.listContainers();
    res.json({ data: containers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(503).json({ message: `Docker Socket nicht erreichbar: ${message}` });
  }
}

/**
 * Gibt CPU-, RAM- und Uptime-Statistiken für einen einzelnen Container zurück.
 * @description GET /api/docker/containers/:id/stats
 *   HTTP 200: Stats erfolgreich abgerufen.
 *   HTTP 404: Container-ID nicht gefunden.
 *   HTTP 503: Docker Socket nicht erreichbar.
 *   Nur für laufende Container sinnvoll — gestoppte Container liefern Stats
 *   mit 0-Werten und Uptime = 'gestoppt'.
 * @async
 * @param {Request} req - Express Request mit Container-ID in req.params.id.
 * @param {Response} res - Express Response mit { data: ContainerStats }.
 * @returns {Promise<void>}
 */
export async function getContainerStats(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    const stats = await dockerService.getContainerStats(id);
    res.json({ data: stats });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404) {
      res.status(404).json({ message: `Container ${id} nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(503).json({ message: `Docker-Fehler: ${message}` });
  }
}

/**
 * Startet einen Container per ID.
 * @description POST /api/docker/containers/:id/start
 *   HTTP 200: Container erfolgreich gestartet.
 *   HTTP 409: Container läuft bereits (Docker-Fehlercode 304).
 *   HTTP 404: Container-ID nicht gefunden.
 *   HTTP 503: Docker Socket nicht erreichbar.
 * @async
 * @param {Request} req - Express Request mit Container-ID in req.params.id.
 * @param {Response} res - Express Response.
 * @returns {Promise<void>}
 */
export async function startContainer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    await dockerService.startContainer(id);
    res.json({ data: null, message: `Container ${id} gestartet` });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 304) {
      res.status(409).json({ message: 'Container läuft bereits' });
      return;
    }
    if (status === 404) {
      res.status(404).json({ message: `Container ${id} nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(503).json({ message: `Docker-Fehler: ${message}` });
  }
}

/**
 * Stoppt einen laufenden Container per ID.
 * @description POST /api/docker/containers/:id/stop
 *   HTTP 200: Container erfolgreich gestoppt.
 *   HTTP 409: Container ist bereits gestoppt (Docker-Fehlercode 304).
 *   HTTP 404: Container-ID nicht gefunden.
 *   HTTP 503: Docker Socket nicht erreichbar.
 * @async
 * @param {Request} req - Express Request mit Container-ID in req.params.id.
 * @param {Response} res - Express Response.
 * @returns {Promise<void>}
 */
export async function stopContainer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    await dockerService.stopContainer(id);
    res.json({ data: null, message: `Container ${id} gestoppt` });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 304) {
      res.status(409).json({ message: 'Container ist bereits gestoppt' });
      return;
    }
    if (status === 404) {
      res.status(404).json({ message: `Container ${id} nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(503).json({ message: `Docker-Fehler: ${message}` });
  }
}

/**
 * Löscht einen gestoppten Container.
 * @description DELETE /api/docker/containers/:id
 *   HTTP 204: Container erfolgreich gelöscht.
 *   HTTP 409: Container läuft noch — erst stoppen.
 *   HTTP 404: Container-ID nicht gefunden.
 *   HTTP 503: Docker Socket nicht erreichbar.
 * @async
 * @param {Request} req - Express Request mit Container-ID in req.params.id.
 * @param {Response} res - Express Response.
 * @returns {Promise<void>}
 */
export async function removeContainer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    await dockerService.removeContainer(id);
    res.status(204).send();
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 409) {
      res.status(409).json({ message: 'Container läuft noch — bitte zuerst stoppen.' });
      return;
    }
    if (status === 404) {
      res.status(404).json({ message: `Container ${id} nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(503).json({ message: `Docker-Fehler: ${message}` });
  }
}

/**
 * Gibt die letzten Log-Zeilen eines Containers zurück.
 * @description GET /api/docker/containers/:id/logs?tail=100
 *   HTTP 200: { data: string[] } — Array der Log-Zeilen.
 *   HTTP 404: Container-ID nicht gefunden.
 *   HTTP 503: Docker Socket nicht erreichbar.
 * @async
 * @param {Request} req - Express Request mit Container-ID und optionalem tail-Query.
 * @param {Response} res - Express Response mit { data: string[] }.
 * @returns {Promise<void>}
 */
export async function getContainerLogs(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const tail = parseInt((req.query as { tail?: string }).tail ?? '100', 10);
  try {
    const lines = await dockerService.getContainerLogs(id, isNaN(tail) ? 100 : tail);
    res.json({ data: lines });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404) {
      res.status(404).json({ message: `Container ${id} nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(503).json({ message: `Docker-Fehler: ${message}` });
  }
}
