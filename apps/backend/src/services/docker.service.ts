/**
 * @fileoverview Docker Service — Kommunikation mit dem Docker Socket
 * @description Kapselt alle Dockerode-Aufrufe. Verbindet sich mit dem lokalen
 *   Docker Socket (/var/run/docker.sock) und gibt Daten im DockerService-Format
 *   aus dem @workspace2k/shared Package zurück.
 *   Container-Namen werden bereinigt (führender "/" entfernt).
 * @module DockerService
 */

import Dockerode from 'dockerode';

/**
 * Mögliche Status-Werte eines Docker-Containers.
 * @description Spiegelt ServiceStatus aus @workspace2k/shared — bewusst lokal
 *   definiert, da Backend rootDir auf ./src begrenzt ist.
 */
type ServiceStatus = 'running' | 'stopped' | 'error' | 'unknown';

/**
 * Docker-Container Repräsentation — spiegelt DockerService aus @workspace2k/shared.
 */
export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  status: ServiceStatus;
  port?: number;
}

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
 * Gibt alle Docker-Container zurück (laufende und gestoppte).
 * @description Ruft `docker ps -a` äquivalent ab.
 *   Container-Namen: Docker liefert Namen mit führendem "/", dieser wird entfernt.
 *   Port: Erster öffentlicher Port aus der Ports-Liste, falls vorhanden.
 * @async
 * @function listContainers
 * @returns {Promise<DockerService[]>} Liste aller Container im DockerService-Format.
 * @throws {Error} Wenn der Docker Socket nicht erreichbar ist.
 */
export async function listContainers(): Promise<DockerContainerInfo[]> {
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
