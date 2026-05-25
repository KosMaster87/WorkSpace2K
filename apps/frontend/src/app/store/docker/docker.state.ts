/**
 * @fileoverview Docker State — NgRx Docker-Store Typen und Initialzustand
 * @description Definiert den Typ des Docker-State und den Initialzustand.
 *   DockerService und ServiceStatus werden direkt aus @workspace2k/shared importiert —
 *   möglich seit rootDir aus tsconfig.app.json entfernt wurde (TD-001 gelöst).
 *   pendingIds enthält IDs von Containern, die gerade gestartet oder gestoppt werden.
 * @module DockerState
 */

import { DockerService, ServiceStatus } from '@workspace2k/shared';

// Re-Export für Downstream-Importe (docker.actions, docker.effects, container.service)
export type { DockerService, ServiceStatus };

/**
 * Vollständiger Docker-State im NgRx Store.
 * @interface DockerState
 */
export interface DockerState {
  /** Liste aller bekannten Container (laufend + gestoppt). */
  containers: DockerService[];
  /** true während GET /api/docker/containers läuft (initiales Laden). */
  isLoading: boolean;
  /** IDs von Containern, bei denen gerade ein Start/Stop-Request läuft. */
  pendingIds: string[];
  /** Fehlermeldung vom letzten fehlgeschlagenen Request oder null. */
  error: string | null;
}

/**
 * Initialzustand des Docker-Store — keine Container, nicht ladend, kein Fehler.
 */
export const initialDockerState: DockerState = {
  containers: [],
  isLoading: false,
  pendingIds: [],
  error: null,
};
