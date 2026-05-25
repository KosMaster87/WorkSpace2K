/**
 * @fileoverview Docker State — NgRx Docker-Store Typen und Initialzustand
 * @description Definiert den Typ des Docker-State und den Initialzustand.
 *   DockerService, ServiceStatus und ContainerStats aus @workspace2k/shared.
 *   stats: Record<id, ContainerStats> — wird nach loadContainersSuccess befüllt,
 *   nur für laufende Container (gestoppte liefern 0-Werte).
 *   pendingIds enthält IDs von Containern, die gerade gestartet oder gestoppt werden.
 * @module DockerState
 */

import { ContainerStats, DockerService, ServiceStatus } from '@workspace2k/shared';

// Re-Export für Downstream-Importe
export type { ContainerStats, DockerService, ServiceStatus };

/**
 * Vollständiger Docker-State im NgRx Store.
 * @interface DockerState
 */
export interface DockerState {
  /** Liste aller bekannten Container (laufend + gestoppt). */
  containers: DockerService[];
  /** CPU, RAM, Uptime pro Container — Key: Container-ID. */
  stats: Record<string, ContainerStats>;
  /** Log-Zeilen pro Container — Key: Container-ID. */
  logs: Record<string, string[]>;
  /** true während GET /api/docker/containers läuft (initiales Laden). */
  isLoading: boolean;
  /** IDs von Containern, bei denen gerade ein Start/Stop/Delete-Request läuft. */
  pendingIds: string[];
  /** IDs von Containern, bei denen gerade Logs geladen werden. */
  logsPendingIds: string[];
  /** Fehlermeldung vom letzten fehlgeschlagenen Request oder null. */
  error: string | null;
}

/**
 * Initialzustand des Docker-Store.
 */
export const initialDockerState: DockerState = {
  containers: [],
  stats: {},
  logs: {},
  isLoading: false,
  pendingIds: [],
  logsPendingIds: [],
  error: null,
};
