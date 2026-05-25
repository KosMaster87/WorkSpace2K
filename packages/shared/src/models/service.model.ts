/**
 * @fileoverview Service Model — Geteilte Docker-Service-Typen
 * @description Definiert DockerService, ContainerStats und ServiceStatus.
 *   Wird für Dashboard-Kacheln, Services-Page und die Stats-API genutzt.
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

/**
 * Laufzeit-Statistiken eines Containers.
 * @description Wird von GET /api/docker/containers/:id/stats zurückgegeben.
 *   Backend berechnet CPU via (cpu_delta / system_delta) * online_cpus * 100.
 *   Memory: usage - cache (inactive_file auf Linux).
 * @interface ContainerStats
 */
export interface ContainerStats {
  /** Container-ID (kurz, 12 Zeichen). */
  id: string;
  /** Container-Name (führendes "/" entfernt). */
  name: string;
  /** CPU-Auslastung in Prozent (z.B. '2.45'). */
  cpuPercent: string;
  /** Tatsächlich genutzter Speicher (z.B. '128 MB'). */
  memoryUsage: string;
  /** Speicher-Limit des Containers (z.B. '512 MB'). */
  memoryLimit: string;
  /** Speicherauslastung in Prozent (z.B. '25.0'). */
  memoryPercent: string;
  /** Lesbare Uptime (z.B. '3d 2h' oder '45m'). */
  uptime: string;
}
