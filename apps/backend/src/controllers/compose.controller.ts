/**
 * @fileoverview Compose Controller — HTTP-Handler für Filesystem-Scan und Stack-Editor
 * @description Verarbeitet HTTP-Requests für Compose-File-basierte Stack-Operationen.
 *   Delegiert die Logik an compose.service.ts.
 *   Im Gegensatz zum docker.controller.ts, der die Docker API direkt nutzt,
 *   arbeitet dieser Controller mit dem Filesystem und der docker compose CLI.
 *
 *   Endpunkte:
 *     GET  /api/docker/stacks/scan          → scanStacks
 *     POST /api/docker/stacks/:name/update  → updateStack
 *     GET  /api/docker/stacks/:name/compose → getComposeContent
 *     PUT  /api/docker/stacks/:name/compose → saveAndDeployStack
 *     POST /api/docker/stacks               → createStack
 * @module ComposeController
 */

import { Request, Response } from 'express';
import * as composeService from '../services/compose.service';

/**
 * Gibt alle Compose-Stacks im Stacks-Verzeichnis zurück.
 * @description GET /api/docker/stacks/scan
 *   Scannt DOCKER_STACKS_PATH (Standard: /opt/stacks) nach Verzeichnissen mit Compose-Files.
 *   HTTP 200: { data: ComposeStack[] } — kann leeres Array sein wenn Verzeichnis nicht existiert.
 *   HTTP 503: Scan konnte nicht durchgeführt werden.
 * @async
 * @param {Request} _req - Express Request (keine Parameter benötigt).
 * @param {Response} res - Express Response mit { data: ComposeStack[] }.
 * @returns {Promise<void>}
 */
export async function scanStacks(_req: Request, res: Response): Promise<void> {
  try {
    const stacks = await composeService.scanStacks();
    res.json({ data: stacks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan fehlgeschlagen';
    res.status(503).json({ message: `Filesystem-Scan fehlgeschlagen: ${message}` });
  }
}

/**
 * Aktualisiert einen Stack via docker compose pull && up -d.
 * @description POST /api/docker/stacks/:name/update
 *   HTTP 200: { data: StackUpdateResult } — Name + kombinierte Ausgabe.
 *   HTTP 404: Stack-Verzeichnis oder Compose-File nicht gefunden.
 *   HTTP 503: docker compose Befehl fehlgeschlagen.
 *   Timeout: 5 Minuten (für große Images).
 *   Hinweis: Dieser Request kann mehrere Minuten dauern (Image-Download).
 * @async
 * @param {Request} req - Express Request mit Stack-Name in req.params.name.
 * @param {Response} res - Express Response mit { data: StackUpdateResult }.
 * @returns {Promise<void>}
 */
export async function updateStack(req: Request, res: Response): Promise<void> {
  const { name } = req.params as { name: string };
  try {
    const result = await composeService.updateStack(name);
    res.json({ data: result });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404) {
      res.status(404).json({ message: `Stack '${name}' nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Update fehlgeschlagen';
    res.status(503).json({ message: `Stack-Update fehlgeschlagen: ${message}` });
  }
}

/**
 * Gibt den YAML-Inhalt der Compose-Datei eines Stacks zurück.
 * @description GET /api/docker/stacks/:name/compose
 *   HTTP 200: { data: string } — YAML-Inhalt als String.
 *   HTTP 404: Stack oder Compose-File nicht gefunden.
 *   HTTP 503: Datei konnte nicht gelesen werden.
 *   Wird für den Compose-File-Editor genutzt.
 * @async
 * @param {Request} req - Express Request mit Stack-Name in req.params.name.
 * @param {Response} res - Express Response mit { data: string }.
 * @returns {Promise<void>}
 */
export async function getComposeContent(req: Request, res: Response): Promise<void> {
  const { name } = req.params as { name: string };
  try {
    const content = await composeService.getComposeContent(name);
    res.json({ data: content });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404) {
      res.status(404).json({ message: `Stack '${name}' nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Datei konnte nicht gelesen werden';
    res.status(503).json({ message: `Compose-File lesen fehlgeschlagen: ${message}` });
  }
}

/**
 * Speichert den Compose-Datei-Inhalt und deployed den Stack via docker compose up -d.
 * @description PUT /api/docker/stacks/:name/compose
 *   Body: { content: string } — neuer YAML-Inhalt.
 *   HTTP 200: { data: StackUpdateResult } — Name + kombinierte Ausgabe.
 *   HTTP 400: content fehlt im Body.
 *   HTTP 404: Stack-Verzeichnis nicht gefunden.
 *   HTTP 503: Schreiben oder docker compose fehlgeschlagen.
 *   Überschreibt die vorhandene Compose-Datei und startet den Stack neu.
 * @async
 * @param {Request} req - Express Request mit Stack-Name und { content: string } im Body.
 * @param {Response} res - Express Response mit { data: StackUpdateResult }.
 * @returns {Promise<void>}
 */
export async function saveAndDeployStack(req: Request, res: Response): Promise<void> {
  const { name } = req.params as { name: string };
  const { content } = req.body as { content?: string };
  if (typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ message: 'content ist erforderlich und darf nicht leer sein' });
    return;
  }
  try {
    const result = await composeService.saveAndDeployStack(name, content);
    res.json({ data: result });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404) {
      res.status(404).json({ message: `Stack '${name}' nicht gefunden` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Deploy fehlgeschlagen';
    res.status(503).json({ message: `Deploy fehlgeschlagen: ${message}` });
  }
}

/**
 * Erstellt einen neuen Stack — Verzeichnis, compose.yaml und docker compose up -d.
 * @description POST /api/docker/stacks
 *   Body: { name: string, content: string }
 *   HTTP 201: { data: StackUpdateResult } — Name + Ausgabe des Deployments.
 *   HTTP 400: Ungültiger Name oder fehlender Inhalt.
 *   HTTP 409: Stack existiert bereits.
 *   HTTP 503: DOCKER_STACKS_PATH nicht gefunden oder docker compose fehlgeschlagen.
 * @async
 * @param {Request} req - Express Request mit { name: string, content: string } im Body.
 * @param {Response} res - Express Response mit { data: StackUpdateResult }.
 * @returns {Promise<void>}
 */
export async function createStack(req: Request, res: Response): Promise<void> {
  const { name, content } = req.body as { name?: string; content?: string };
  if (typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ message: 'name ist erforderlich und darf nicht leer sein' });
    return;
  }
  if (typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ message: 'content ist erforderlich und darf nicht leer sein' });
    return;
  }
  try {
    const result = await composeService.createStack(name.trim(), content);
    res.status(201).json({ data: result });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 400) {
      const message = err instanceof Error ? err.message : 'Ungültiger Stack-Name';
      res.status(400).json({ message });
      return;
    }
    if (status === 409) {
      res.status(409).json({ message: `Stack '${name}' existiert bereits` });
      return;
    }
    const message = err instanceof Error ? err.message : 'Stack-Erstellung fehlgeschlagen';
    res.status(503).json({ message: `Stack-Erstellung fehlgeschlagen: ${message}` });
  }
}
