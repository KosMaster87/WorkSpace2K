/**
 * @fileoverview Compose Service — Filesystem-Scan und Stack-Update via docker compose CLI
 * @description Liest das Stacks-Verzeichnis (DOCKER_STACKS_PATH, Standard: /opt/stacks/)
 *   und führt docker compose Befehle aus. Ergänzt den docker.service.ts, der nur die
 *   Docker API nutzt — hier wird die docker compose CLI direkt aufgerufen.
 *   Voraussetzung: docker compose (v2) muss auf dem Server installiert sein.
 * @module ComposeService
 */

import { exec } from 'child_process';
import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { ComposeStack, ServiceStatus, StackUpdateResult } from '@workspace2k/shared';
import * as dockerService from './docker.service';

const execAsync = promisify(exec);

/**
 * Bekannte Compose-Dateinamen — in dieser Reihenfolge geprüft.
 * @private
 */
const COMPOSE_FILES = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];

/**
 * Gibt den konfigurierten Stacks-Pfad zurück.
 * @description Liest DOCKER_STACKS_PATH aus der Umgebung, Standard: /opt/stacks.
 * @returns {string} Absoluter Pfad zum Stacks-Verzeichnis.
 * @private
 */
function getStacksPath(): string {
  return process.env['DOCKER_STACKS_PATH'] ?? '/opt/stacks';
}

/**
 * Prüft ob eine Datei oder ein Verzeichnis existiert.
 * @param {string} filePath - Zu prüfender Pfad.
 * @returns {Promise<boolean>}
 * @private
 */
async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Findet die Compose-Datei in einem Verzeichnis.
 * @description Prüft bekannte Compose-Dateinamen der Reihe nach.
 * @param {string} dirPath - Pfad zum Stack-Verzeichnis.
 * @returns {Promise<string | null>} Dateiname der Compose-Datei oder null.
 * @private
 */
async function findComposeFile(dirPath: string): Promise<string | null> {
  for (const name of COMPOSE_FILES) {
    if (await exists(path.join(dirPath, name))) return name;
  }
  return null;
}

/**
 * Bestimmt den aggregierten Status eines Stacks anhand laufender Docker-Container.
 * @description Vergleicht den Stack-Namen (= Verzeichnisname) mit dem
 *   com.docker.compose.project-Label der Container.
 *   running: alle laufen. stopped: alle gestoppt. unknown: gemischt oder keine.
 * @param {string} name - Stack-Name (= Verzeichnisname).
 * @returns {Promise<ServiceStatus>} Aggregierter Status.
 * @private
 */
async function resolveStackStatus(name: string): Promise<ServiceStatus> {
  try {
    const allContainers = await dockerService.listContainers();
    const stackContainers = allContainers.filter((c) => c.stackName === name);
    if (stackContainers.length === 0) return 'stopped';
    if (stackContainers.every((c) => c.status === 'running')) return 'running';
    if (stackContainers.every((c) => c.status === 'stopped')) return 'stopped';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Scannt das Stacks-Verzeichnis und gibt alle gefundenen Compose-Stacks zurück.
 * @description Durchsucht DOCKER_STACKS_PATH nach Unterverzeichnissen mit Compose-Files.
 *   Gibt leeres Array zurück wenn das Verzeichnis nicht existiert (graceful degradation).
 *   Status wird durch Abgleich mit Docker API ermittelt.
 * @async
 * @function scanStacks
 * @returns {Promise<ComposeStack[]>} Liste aller gefundenen Compose-Stacks.
 */
export async function scanStacks(): Promise<ComposeStack[]> {
  const basePath = getStacksPath();

  if (!(await exists(basePath))) return [];

  const entries = await readdir(basePath, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());

  const results: ComposeStack[] = [];

  for (const dir of dirs) {
    const dirPath = path.join(basePath, dir.name);
    const composeFile = await findComposeFile(dirPath);
    if (!composeFile) continue;

    const status = await resolveStackStatus(dir.name);
    results.push({ name: dir.name, path: dirPath, composeFile, status });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Findet den Stack-Pfad für einen gegebenen Stack-Namen.
 * @description Durchsucht DOCKER_STACKS_PATH nach einem Verzeichnis mit dem Namen.
 * @async
 * @function findStackPath
 * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
 * @returns {Promise<string>} Absoluter Pfad zum Stack-Verzeichnis.
 * @throws {Error} statusCode 404 wenn kein Verzeichnis mit Compose-File gefunden.
 */
export async function findStackPath(name: string): Promise<string> {
  const stacks = await scanStacks();
  const stack = stacks.find((s) => s.name === name);
  if (!stack) {
    throw Object.assign(
      new Error(`Compose-File für Stack '${name}' nicht gefunden in ${getStacksPath()}`),
      { statusCode: 404 },
    );
  }
  return stack.path;
}

/**
 * Aktualisiert einen Stack via docker compose pull && docker compose up -d.
 * @description Führt im Stack-Verzeichnis aus:
 *   1. `docker compose pull` — lädt neue Images vom Registry
 *   2. `docker compose up -d` — startet Container mit neuen Images neu
 *   Gibt stdout+stderr der Befehle zurück.
 *   Timeout: 5 Minuten (für große Images ausreichend).
 * @async
 * @function updateStack
 * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
 * @returns {Promise<StackUpdateResult>} Name und kombinierte Ausgabe der Befehle.
 * @throws {Error} statusCode 404 wenn Compose-File nicht gefunden.
 * @throws {Error} Wenn docker compose fehlschlägt.
 */
export async function updateStack(name: string): Promise<StackUpdateResult> {
  const stackPath = await findStackPath(name);

  const { stdout, stderr } = await execAsync('docker compose pull && docker compose up -d', {
    cwd: stackPath,
    timeout: 5 * 60 * 1000, // 5 Minuten
    env: { ...process.env, COMPOSE_ANSI: 'never' }, // Keine ANSI-Escape-Codes in Output
  });

  return { name, output: [stdout, stderr].filter(Boolean).join('\n') };
}

/**
 * Liest den Inhalt einer Compose-Datei eines Stacks.
 * @description Gibt den rohen YAML-Inhalt der Compose-Datei zurück.
 *   Wird für den Compose-File-Editor verwendet.
 * @async
 * @function getComposeContent
 * @param {string} name - Stack-Name.
 * @returns {Promise<string>} YAML-Inhalt der Compose-Datei.
 * @throws {Error} statusCode 404 wenn Stack nicht gefunden.
 */
export async function getComposeContent(name: string): Promise<string> {
  const stacks = await scanStacks();
  const stack = stacks.find((s) => s.name === name);
  if (!stack) {
    throw Object.assign(new Error(`Stack '${name}' nicht gefunden`), { statusCode: 404 });
  }
  return readFile(path.join(stack.path, stack.composeFile), 'utf-8');
}

/**
 * Schreibt neuen Inhalt in die Compose-Datei und deployed den Stack via docker compose up -d.
 * @description Überschreibt die vorhandene Compose-Datei mit dem neuen Inhalt und
 *   startet den Stack neu. Der Stack muss bereits im Filesystem existieren.
 *   Timeout: 5 Minuten (für große Images ausreichend).
 * @async
 * @function saveAndDeployStack
 * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
 * @param {string} content - Neuer YAML-Inhalt der Compose-Datei.
 * @returns {Promise<StackUpdateResult>} Name und kombinierte Ausgabe der Befehle.
 * @throws {Error} statusCode 404 wenn Stack-Verzeichnis nicht gefunden.
 * @throws {Error} Wenn docker compose fehlschlägt.
 */
export async function saveAndDeployStack(
  name: string,
  content: string,
): Promise<StackUpdateResult> {
  const stacks = await scanStacks();
  const stack = stacks.find((s) => s.name === name);
  if (!stack) {
    throw Object.assign(new Error(`Stack '${name}' nicht gefunden`), { statusCode: 404 });
  }
  await writeFile(path.join(stack.path, stack.composeFile), content, 'utf-8');
  const { stdout, stderr } = await execAsync('docker compose up -d', {
    cwd: stack.path,
    timeout: 5 * 60 * 1000,
    env: { ...process.env, COMPOSE_ANSI: 'never' },
  });
  return { name, output: [stdout, stderr].filter(Boolean).join('\n') };
}

/**
 * Erstellt einen neuen Stack: Verzeichnis anlegen + compose.yaml schreiben + docker compose up -d.
 * @description Erstellt das Stack-Verzeichnis unter DOCKER_STACKS_PATH/<name>/,
 *   schreibt den YAML-Inhalt als compose.yaml und startet den Stack.
 *   Validiert den Stack-Namen (nur a-z, 0-9, - und _).
 *   Fehler wenn Verzeichnis schon existiert (HTTP 409).
 *   Fehler wenn DOCKER_STACKS_PATH nicht existiert (HTTP 503).
 * @async
 * @function createStack
 * @param {string} name - Neuer Stack-Name (nur a-z, 0-9, _ und -).
 * @param {string} content - YAML-Inhalt der compose.yaml.
 * @returns {Promise<StackUpdateResult>} Name und kombinierte Ausgabe.
 * @throws {Error} statusCode 400 bei ungültigem Stack-Namen.
 * @throws {Error} statusCode 409 wenn Stack bereits existiert.
 * @throws {Error} statusCode 503 wenn DOCKER_STACKS_PATH nicht existiert.
 * @throws {Error} Wenn docker compose fehlschlägt.
 */
export async function createStack(name: string, content: string): Promise<StackUpdateResult> {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
    throw Object.assign(
      new Error(
        'Ungültiger Stack-Name: nur a-z, 0-9, - und _ erlaubt. Muss mit a-z oder 0-9 beginnen.',
      ),
      { statusCode: 400 },
    );
  }
  const basePath = getStacksPath();
  if (!(await exists(basePath))) {
    throw Object.assign(new Error(`Stacks-Verzeichnis nicht gefunden: ${basePath}`), {
      statusCode: 503,
    });
  }
  const stackPath = path.join(basePath, name);
  if (await exists(stackPath)) {
    throw Object.assign(new Error(`Stack '${name}' existiert bereits`), { statusCode: 409 });
  }
  await mkdir(stackPath, { recursive: true });
  await writeFile(path.join(stackPath, 'compose.yaml'), content, 'utf-8');
  const { stdout, stderr } = await execAsync('docker compose up -d', {
    cwd: stackPath,
    timeout: 5 * 60 * 1000,
    env: { ...process.env, COMPOSE_ANSI: 'never' },
  });
  return { name, output: [stdout, stderr].filter(Boolean).join('\n') };
}
