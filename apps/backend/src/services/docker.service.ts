/**
 * @fileoverview Docker Service — Kommunikation mit dem Docker Socket
 * @description Kapselt alle Dockerode-Aufrufe. Verbindet sich mit dem lokalen
 *   Docker Socket (/var/run/docker.sock) und gibt Daten im DockerService-Format
 *   aus dem @workspace2k/shared Package zurück.
 *   Container-Namen werden bereinigt (führender "/" entfernt).
 * @module DockerService
 */

import Dockerode from 'dockerode';
import { ContainerStats, DockerService, ServiceStatus } from '@workspace2k/shared';

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

/**
 * Mappt den Docker-internen State-String auf den ServiceStatus-Typ.
 * @description Docker kennt: created, restarting, running, removing, paused, exited, dead.
 *   Alles außer 'running' wird als 'stopped' behandelt.
 * @param {string} state - Roher Docker-State-String.
 * @returns {ServiceStatus} Normalisierter Status für das Frontend.
 * @private
 */
function mapStatus(state: string): ServiceStatus {
  switch (state) {
    case 'running':
      return 'running';
    case 'exited':
    case 'created':
    case 'paused':
      return 'stopped';
    default:
      return 'unknown';
  }
}

/**
 * Berechnet CPU-Auslastung in Prozent aus Docker-Stats-Rohdaten.
 * @description Formel: (cpu_delta / system_delta) * online_cpus * 100
 *   Gibt '0.00' zurück wenn system_delta = 0 (erster Messwert).
 * @param {Dockerode.ContainerStats} stats - Rohe Docker-Stats.
 * @returns {string} CPU-Prozent mit 2 Dezimalstellen (z.B. '2.45').
 * @private
 */
function calcCpuPercent(stats: Dockerode.ContainerStats): string {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    (stats.cpu_stats.system_cpu_usage ?? 0) - (stats.precpu_stats.system_cpu_usage ?? 0);
  const numCpus = stats.cpu_stats.online_cpus ?? 1;

  if (systemDelta <= 0 || cpuDelta <= 0) return '0.00';
  return ((cpuDelta / systemDelta) * numCpus * 100).toFixed(2);
}

/**
 * Formatiert Bytes in lesbare Einheit (MB oder GB).
 * @param {number} bytes - Anzahl Bytes.
 * @returns {string} Formatierter String, z.B. '128 MB' oder '1.5 GB'.
 * @private
 */
function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

/**
 * Berechnet lesbare Uptime aus einem ISO-Start-Datum.
 * @description Gibt Zeit in der Form "3h 12m" oder "2d 5h" zurück.
 * @param {string} startedAt - ISO-8601-Timestamp (z.B. "2026-05-25T08:00:00Z").
 * @returns {string} Lesbare Uptime oder 'gestoppt' wenn Datum in der Zukunft.
 * @private
 */
function calcUptime(startedAt: string): string {
  const started = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - started;

  if (diffMs < 0) return 'gestoppt';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/**
 * Gibt alle Docker-Container zurück (laufende und gestoppte).
 * @description Ruft `docker ps -a` äquivalent ab.
 *   Container-Namen: Docker liefert Namen mit führendem "/", dieser wird entfernt.
 *   Port: Erster öffentlicher Port aus der Ports-Liste, falls vorhanden.
 * @async
 * @function listContainers
 * @returns {Promise<DockerService[]>} Liste aller Container im DockerService-Format.
 * @throws {Error} Wenn der Docker Socket nicht erreichbar ist.
 */
export async function listContainers(): Promise<DockerService[]> {
  const containers = await docker.listContainers({ all: true });

  return containers.map((c) => ({
    id: c.Id.slice(0, 12),
    name: (c.Names[0] ?? c.Id).replace(/^\//, ''),
    image: c.Image,
    status: mapStatus(c.State),
    port: c.Ports.find((p) => p.PublicPort !== undefined)?.PublicPort,
  }));
}

/**
 * Gibt CPU-, RAM- und Uptime-Statistiken für einen einzelnen Container zurück.
 * @description Ruft parallel docker.stats() (Snapshot) und container.inspect()
 *   (für StartedAt) ab. Nur für laufende Container sinnvoll — gestoppte Container
 *   liefern Stats mit 0-Werten.
 *   Memory: usage minus cache (Linux-spezifisch, inactive_file als Fallback).
 * @async
 * @function getContainerStats
 * @param {string} id - Container-ID (kurz oder vollständig).
 * @returns {Promise<ContainerStats>} CPU, RAM, Uptime als formatierte Strings.
 * @throws {Error} Wenn Container nicht existiert oder Docker Socket nicht erreichbar ist.
 */
export async function getContainerStats(id: string): Promise<ContainerStats> {
  const container = docker.getContainer(id);

  const [stats, info] = await Promise.all([
    container.stats({ stream: false }) as Promise<Dockerode.ContainerStats>,
    container.inspect(),
  ]);

  const cpuPercent = calcCpuPercent(stats);

  // Linux: tatsächlich genutzter Speicher = usage - (cache/inactive_file)
  const cache =
    (stats.memory_stats.stats as Record<string, number> | undefined)?.['cache'] ??
    (stats.memory_stats.stats as Record<string, number> | undefined)?.['inactive_file'] ??
    0;
  const usedBytes = (stats.memory_stats.usage ?? 0) - cache;
  const limitBytes = stats.memory_stats.limit ?? 1;
  const memPercent = ((usedBytes / limitBytes) * 100).toFixed(1);

  return {
    id: id.slice(0, 12),
    name: (info.Name ?? id).replace(/^\//, ''),
    cpuPercent,
    memoryUsage: formatBytes(usedBytes),
    memoryLimit: formatBytes(limitBytes),
    memoryPercent: memPercent,
    uptime: info.State.Running ? calcUptime(info.State.StartedAt) : 'gestoppt',
  };
}

/**
 * Startet einen gestoppten Container.
 * @description Äquivalent zu `docker start <id>`.
 *   Wirft einen Fehler wenn Container nicht gefunden oder bereits läuft.
 * @async
 * @function startContainer
 * @param {string} id - Container-ID (kurz oder vollständig).
 * @returns {Promise<void>}
 * @throws {Error} Wenn der Container nicht gestartet werden kann.
 */
export async function startContainer(id: string): Promise<void> {
  const container = docker.getContainer(id);
  await container.start();
}

/**
 * Stoppt einen laufenden Container.
 * @description Äquivalent zu `docker stop <id>`. Wartet max. 10 Sekunden (Docker-Default).
 *   Wirft einen Fehler wenn Container nicht gefunden oder bereits gestoppt.
 * @async
 * @function stopContainer
 * @param {string} id - Container-ID (kurz oder vollständig).
 * @returns {Promise<void>}
 * @throws {Error} Wenn der Container nicht gestoppt werden kann.
 */
export async function stopContainer(id: string): Promise<void> {
  const container = docker.getContainer(id);
  await container.stop();
}
