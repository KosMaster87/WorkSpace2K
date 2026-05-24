/**
 * @fileoverview Service Model — Geteilte Docker-Service-Typen
 * @description Definiert DockerService-Interface und ServiceStatus-Typ.
 *   Wird für die Services-Seite und Dashboard-Kacheln genutzt.
 *   Backend füllt diese Daten via Docker Socket (/var/run/docker.sock).
 * @module ServiceModel
 */

/**
 * Mögliche Status-Werte eines Docker-Containers.
 */
export type ServiceStatus = 'running' | 'stopped' | 'error' | 'unknown';

/**
 * Repräsentiert einen laufenden oder gestoppten Docker-Container.
 * @interface DockerService
 */
export interface DockerService {
  /** Eindeutige Container-ID (Docker Container ID). */
  id: string;
  /** Anzeigename des Containers (docker-compose service name). */
  name: string;
  /** Docker Image mit Tag (z.B. 'nginx:latest'). */
  image: string;
  /** Aktueller Container-Status. */
  status: ServiceStatus;
  /** Optionale URL über die der Service erreichbar ist. */
  url?: string;
  /** Optionaler extern erreichbarer Port. */
  port?: number;
  /** Optionaler Speicherverbrauch (z.B. '128 MB'). */
  memoryUsage?: string;
  /** Optionale CPU-Auslastung in Prozent (z.B. '2.5'). */
  cpuPercent?: string;
}
