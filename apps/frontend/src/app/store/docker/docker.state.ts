/**
 * @fileoverview Docker State — NgRx Docker-Store Typen und Initialzustand
 * @description Definiert den Typ des Docker-State und den Initialzustand.
 *   Container-Typ und ServiceStatus sind lokal definiert — tsconfig.app.json
 *   beschränkt rootDir auf ./src, ein Import aus @workspace2k/shared würde
 *   den rootDir-Check verletzen (identisches Problem wie im Backend).
 *   pendingIds enthält IDs von Containern, die gerade gestartet oder gestoppt werden.
 * @module DockerState
 */

/**
 * Mögliche Status-Werte eines Docker-Containers.
 * @description Spiegelt ServiceStatus aus @workspace2k/shared — bewusst lokal
 *   definiert, da tsconfig.app.json rootDir auf ./src begrenzt.
 */
export type ServiceStatus = 'running' | 'stopped' | 'error' | 'unknown';

/**
 * Repräsentiert einen Docker-Container im Frontend-State.
 * @description Spiegelt DockerService aus @workspace2k/shared und
 *   DockerContainerInfo aus dem Backend. Lokal definiert wegen rootDir-Constraint.
 * @interface Container
 */
export interface Container {
  /** Eindeutige Container-ID (kurz, 12 Zeichen). */
  id: string;
  /** Anzeigename des Containers. */
  name: string;
  /** Docker Image mit Tag (z.B. 'nginx:latest'). */
  image: string;
  /** Aktueller Container-Status. */
  status: ServiceStatus;
  /** Optionaler extern erreichbarer Port. */
  port?: number;
  /** Optionaler Speicherverbrauch (z.B. '128 MB'). */
  memoryUsage?: string;
  /** Optionale CPU-Auslastung in Prozent. */
  cpuPercent?: string;
}

/**
 * Vollständiger Docker-State im NgRx Store.
 * @interface DockerState
 */
export interface DockerState {
  /** Liste aller bekannten Container (laufend + gestoppt). */
  containers: Container[];
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
