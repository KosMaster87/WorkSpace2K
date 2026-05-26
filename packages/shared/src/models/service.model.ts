/**
 * @fileoverview Service Model — Geteilte Docker-Service-Typen
 * @description Definiert DockerService, DockerStack, ContainerStats und ServiceStatus.
 *   Wird für Dashboard-Kacheln, Services-Page und die Stats-API genutzt.
 *   Backend füllt diese Daten via Docker Socket (/var/run/docker.sock).
 * @module ServiceModel
 */

/**
 * Mögliche Status-Werte eines Docker-Containers oder Stacks.
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
  /**
   * Docker Compose Projekt-Name (aus com.docker.compose.project Label).
   * Undefined wenn der Container nicht via Compose gestartet wurde.
   */
  stackName?: string;
}

/**
 * Repräsentiert einen Docker Compose Stack (Gruppe zusammengehöriger Container).
 * @description Ein Stack entspricht einem `docker compose`-Projekt.
 *   Container ohne Compose-Label werden unter dem Namen '__standalone__' gruppiert.
 *   Status: 'running' wenn alle laufen, 'stopped' wenn alle gestoppt,
 *   'unknown' wenn gemischt (partial running).
 * @interface DockerStack
 */
export interface DockerStack {
  /** Docker Compose Projekt-Name oder '__standalone__' für einzelne Container. */
  name: string;
  /** Alle Container die zu diesem Stack gehören. */
  containers: DockerService[];
  /** Aggregierter Status über alle Container des Stacks. */
  status: ServiceStatus;
}

/**
 * Konfiguration für einen einzelnen NPM Proxy Host innerhalb eines Stacks.
 * @description Wird aus `ws2k.json` im Stack-Verzeichnis gelesen.
 *   Enthält alle Informationen die WorkSpace2K benötigt um den Proxy Host
 *   automatisch in Nginx Proxy Manager anzulegen.
 * @interface StackProxyConfig
 */
export interface StackProxyConfig {
  /** Subdomain-Präfix (z.B. "gitea" → "gitea.yourdomain.com"). */
  subdomain: string;
  /** Docker-Container-Name als Forward-Ziel (erreichbar via npm_proxy Netzwerk). */
  container: string;
  /** Interner HTTP-Port des Containers. */
  port: number;
  /** WebSocket-Unterstützung im NPM Proxy Host aktivieren. */
  websockets: boolean;
}

/**
 * Ein Compose-Stack der per Filesystem-Scan gefunden wurde.
 * @description Ein Verzeichnis in DOCKER_STACKS_PATH das eine Compose-File enthält.
 *   Wird von GET /api/docker/stacks/scan zurückgegeben.
 *   `status` wird durch Abgleich mit laufenden Docker-Containern bestimmt.
 *   `proxy` wird aus ws2k.json gelesen — undefined wenn keine Datei vorhanden.
 * @interface ComposeStack
 */
export interface ComposeStack {
  /** Verzeichnisname (= Stack-Name und Docker Compose Projekt-Name). */
  name: string;
  /** Absoluter Pfad zum Stack-Verzeichnis auf dem Server. */
  path: string;
  /** Name der gefundenen Compose-Datei (z.B. 'docker-compose.yml'). */
  composeFile: string;
  /** Aggregierter Laufstatus aller Container des Stacks. */
  status: ServiceStatus;
  /**
   * NPM Proxy-Konfiguration aus ws2k.json — undefined wenn Datei nicht vorhanden.
   * Array erlaubt mehrere Proxy Hosts pro Stack (z.B. Matrix: Synapse + Element).
   */
  proxy?: StackProxyConfig[];
}

/**
 * Ergebnis eines Stack-Updates (docker compose pull + up -d).
 * @interface StackUpdateResult
 */
export interface StackUpdateResult {
  /** Stack-Name. */
  name: string;
  /** Kombinierte stdout+stderr Ausgabe des Compose-Befehls. */
  output: string;
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
