/**
 * @fileoverview Compose Service — Filesystem-Scan und Stack-Update via docker compose CLI
 * @description Liest das Stacks-Verzeichnis (DOCKER_STACKS_PATH, Standard: /opt/stacks/)
 *   und führt docker compose Befehle aus. Ergänzt den docker.service.ts, der nur die
 *   Docker API nutzt — hier wird die docker compose CLI direkt aufgerufen.
 *   Voraussetzung: docker compose (v2) muss auf dem Server installiert sein.
 * @module ComposeService
 */

import { exec } from 'child_process';
import { randomBytes } from 'crypto';
import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import {
  ComposeStack,
  ServiceStatus,
  StackProxyConfig,
  StackUpdateResult,
} from '@workspace2k/shared';
import * as dockerService from './docker.service';

const execAsync = promisify(exec);

/**
 * Maximale Wartezeit auf schnelle Fehler (Konfigurationsfehler, fehlendes Netzwerk).
 * Danach wird Fire-and-Forget aktiviert — der Prozess läuft im Hintergrund weiter.
 * @private
 */
const FAST_FAIL_MS = 8_000;

/**
 * Führt einen docker compose Befehl aus — Fast-Fail oder Fire-and-Forget.
 * @description Wartet maximal FAST_FAIL_MS auf das Ergebnis.
 *   - Endet der Prozess vorher (Fehler oder schneller Erfolg) → Ergebnis zurückgeben.
 *   - Läuft er noch (Image-Pull bei großen Images wie GitLab, Matrix) →
 *     null zurückgeben. Der Prozess läuft im Hintergrund weiter, Fehler werden
 *     in die Backend-Logs geschrieben (docker logs ws2k-backend).
 * @param {string} command - Auszuführender docker compose Befehl.
 * @param {string} cwd - Arbeitsverzeichnis (Stack-Pfad).
 * @returns {Promise<{ stdout: string; stderr: string } | null>}
 *   Ausgabe bei schnellem Abschluss, null wenn im Hintergrund.
 * @private
 */
async function execComposeBackground(
  command: string,
  cwd: string,
): Promise<{ stdout: string; stderr: string } | null> {
  const proc = execAsync(command, {
    cwd,
    timeout: 10 * 60 * 1000, // 10 Minuten — genug für große Images
    env: { ...process.env, COMPOSE_ANSI: 'never' },
  });

  let done = false;
  let result: { stdout: string; stderr: string } | null = null;
  let caughtError: Error | null = null;

  const settled = proc
    .then((r) => {
      done = true;
      result = r;
    })
    .catch((e: Error) => {
      done = true;
      caughtError = e;
    });

  await Promise.race([settled, new Promise<void>((resolve) => setTimeout(resolve, FAST_FAIL_MS))]);

  if (!done) {
    // Noch nicht fertig (Image-Pull) — Fire-and-Forget, Fehler in Backend-Logs
    proc.catch((e: Error) => console.error(`[compose] background error: ${e.message}`));
    return null;
  }

  if (caughtError) throw caughtError;
  return result;
}

/**
 * Bekannte Compose-Dateinamen — in dieser Reihenfolge geprüft.
 * @private
 */
const COMPOSE_FILES = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];

/**
 * Gibt alle konfigurierten Stacks-Pfade zurück.
 * @description Liest DOCKER_STACKS_PATH aus der Umgebung — kommagetrennte Liste
 *   erlaubt mehrere Scan-Verzeichnisse. Standard: /opt/stacks.
 *   Beispiel: DOCKER_STACKS_PATH=/opt/stacks,/opt/stacks/workspace2k/stacks
 * @returns {string[]} Liste absoluter Pfade zu Stacks-Verzeichnissen.
 * @private
 */
function getStacksPaths(): string[] {
  const raw = process.env['DOCKER_STACKS_PATH'] ?? '/opt/stacks';
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
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
 * Erzeugt einen sicheren Zufallswert passend zum Platzhalter-Typ.
 * @description Wertet den Platzhalter aus `.env.example` aus und erzeugt
 *   den passenden kryptografischen Zufallswert via Node.js crypto.
 * @param {string} placeholder - Platzhalter-String aus der .env.example-Zeile.
 * @returns {string} Generierter Geheimwert.
 * @private
 */
function generateSecret(placeholder: string): string {
  if (placeholder.includes('base64_48')) return randomBytes(48).toString('base64url');
  if (placeholder.includes('hex_32')) return randomBytes(32).toString('hex');
  if (placeholder.includes('hex_16')) return randomBytes(16).toString('hex');
  return randomBytes(32).toString('hex'); // CHANGE_ME_STRONG_PASSWORD und unbekannte Typen
}

/**
 * Generiert eine .env aus .env.example wenn noch keine .env existiert.
 * @description Ersetzt alle `CHANGE_ME_*`-Platzhalter durch kryptografisch sichere
 *   Zufallswerte. Zeilen ohne Platzhalter (z.B. `COUCHDB_USER=admin`) bleiben unverändert.
 *   Wird vor jedem Stack-Start aufgerufen — idempotent wenn .env bereits existiert.
 * @async
 * @function generateEnvIfMissing
 * @param {string} stackPath - Absoluter Pfad zum Stack-Verzeichnis.
 * @returns {Promise<void>}
 * @private
 */
async function generateEnvIfMissing(stackPath: string): Promise<void> {
  const envPath = path.join(stackPath, '.env');
  const examplePath = path.join(stackPath, '.env.example');
  if (await exists(envPath)) return;
  if (!(await exists(examplePath))) return;

  const content = await readFile(examplePath, 'utf-8');
  const generated = content
    .split('\n')
    .map((line) => {
      if (line.startsWith('#') || !line.includes('=')) return line;
      const eqIndex = line.indexOf('=');
      const key = line.slice(0, eqIndex);
      const value = line.slice(eqIndex + 1);
      if (!value.includes('CHANGE_ME_')) return line;
      return `${key}=${generateSecret(value)}`;
    })
    .join('\n');

  await writeFile(envPath, generated, 'utf-8');
  console.log(`[compose] .env für Stack '${path.basename(stackPath)}' automatisch generiert`);
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
 * Liest die NPM Proxy-Konfiguration aus ws2k.json eines Stacks.
 * @description Sucht nach ws2k.json im Stack-Verzeichnis und liest das proxy-Array.
 *   Gibt undefined zurück wenn die Datei nicht vorhanden ist (kein Fehler).
 *   Gibt undefined zurück wenn JSON ungültig oder proxy-Array fehlt.
 *   Fehler werden geloggt aber nicht geworfen — ein fehlerhaftes ws2k.json
 *   darf den gesamten Stack-Scan nicht blockieren.
 * @async
 * @function readStackProxyConfig
 * @param {string} dirPath - Absoluter Pfad zum Stack-Verzeichnis.
 * @returns {Promise<StackProxyConfig[] | undefined>} Proxy-Einträge oder undefined.
 * @private
 */
async function readStackProxyConfig(dirPath: string): Promise<StackProxyConfig[] | undefined> {
  const filePath = path.join(dirPath, 'ws2k.json');
  if (!(await exists(filePath))) return undefined;
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as { proxy?: unknown };
    if (!Array.isArray(parsed.proxy)) return undefined;
    return parsed.proxy as StackProxyConfig[];
  } catch (e) {
    console.warn(`[compose] ws2k.json in ${dirPath} konnte nicht gelesen werden:`, e);
    return undefined;
  }
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
 * Scannt alle konfigurierten Stacks-Verzeichnisse und gibt gefundene Compose-Stacks zurück.
 * @description Durchsucht alle Pfade aus DOCKER_STACKS_PATH (kommagetrennt) nach
 *   Unterverzeichnissen mit Compose-Files. Nicht-existente Pfade werden übersprungen
 *   (graceful degradation). Duplikate (gleicher Stack-Name) werden dedupliziert —
 *   der erste Treffer gewinnt. Status wird durch Abgleich mit Docker API ermittelt.
 * @async
 * @function scanStacks
 * @returns {Promise<ComposeStack[]>} Liste aller gefundenen Compose-Stacks, alphabetisch.
 */
export async function scanStacks(): Promise<ComposeStack[]> {
  const basePaths = getStacksPaths();
  const seen = new Set<string>();
  const results: ComposeStack[] = [];

  for (const basePath of basePaths) {
    if (!(await exists(basePath))) continue;

    const entries = await readdir(basePath, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());

    for (const dir of dirs) {
      if (seen.has(dir.name)) continue; // Duplikat überspringen
      seen.add(dir.name);

      const dirPath = path.join(basePath, dir.name);
      const composeFile = await findComposeFile(dirPath);
      if (!composeFile) continue;

      const status = await resolveStackStatus(dir.name);
      const proxy = await readStackProxyConfig(dirPath);
      results.push({ name: dir.name, path: dirPath, composeFile, status, proxy });
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gibt einen einzelnen Stack mit vollständiger Konfiguration zurück.
 * @description Effizienter als scanStacks() wenn nur ein Stack benötigt wird —
 *   iteriert nur bis der gesuchte Stack gefunden wird.
 *   Liest ws2k.json wenn vorhanden (Proxy-Konfiguration für NPM-Provisioning).
 * @async
 * @function findStack
 * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
 * @returns {Promise<ComposeStack | null>} Stack-Objekt oder null wenn nicht gefunden.
 */
export async function findStack(name: string): Promise<ComposeStack | null> {
  const basePaths = getStacksPaths();
  for (const basePath of basePaths) {
    if (!(await exists(basePath))) continue;
    const dirPath = path.join(basePath, name);
    if (!(await exists(dirPath))) continue;
    const composeFile = await findComposeFile(dirPath);
    if (!composeFile) continue;
    const status = await resolveStackStatus(name);
    const proxy = await readStackProxyConfig(dirPath);
    return { name, path: dirPath, composeFile, status, proxy };
  }
  return null;
}

/**
 * Findet den Stack-Pfad für einen gegebenen Stack-Namen.
 * @description Durchsucht alle konfigurierten DOCKER_STACKS_PATH-Verzeichnisse
 *   nach einem Verzeichnis mit dem Namen.
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
    const searchedPaths = getStacksPaths().join(', ');
    throw Object.assign(
      new Error(`Compose-File für Stack '${name}' nicht gefunden in ${searchedPaths}`),
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
 *   Verwendet Fast-Fail/Fire-and-Forget: bei großen Images (GitLab, Matrix)
 *   läuft der Pull im Hintergrund weiter und der Request wird sofort beantwortet.
 *   Fehler werden in docker logs ws2k-backend geschrieben.
 * @async
 * @function updateStack
 * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
 * @returns {Promise<StackUpdateResult>} Name und Ausgabe oder Hinweis auf Hintergrundprozess.
 * @throws {Error} statusCode 404 wenn Compose-File nicht gefunden.
 * @throws {Error} Wenn docker compose sofort fehlschlägt (Konfigurationsfehler).
 */
export async function updateStack(name: string): Promise<StackUpdateResult> {
  const stackPath = await findStackPath(name);
  await generateEnvIfMissing(stackPath);
  const result = await execComposeBackground(
    'docker compose pull && docker compose up -d',
    stackPath,
  );
  const output =
    result !== null
      ? [result.stdout, result.stderr].filter(Boolean).join('\n')
      : 'Update läuft im Hintergrund (Image-Pull) — Container werden nach Abschluss neu gestartet.';
  return { name, output };
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
 * Startet einen Stack via docker compose up -d (ohne Pull, ohne Datei-Änderung).
 * @description Führt `docker compose up -d` im Stack-Verzeichnis aus — startet
 *   Container aus vorhandenen oder zu bauenden Images. Geeignet für frische Stacks
 *   die noch nie deployed wurden (keine Container vorhanden).
 *   Verwendet Fast-Fail/Fire-and-Forget: bei großen Images (GitLab, Matrix)
 *   läuft der Pull im Hintergrund weiter und der Request wird sofort beantwortet.
 *   Fehler werden in docker logs ws2k-backend geschrieben.
 * @async
 * @function composeUpStack
 * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
 * @returns {Promise<StackUpdateResult>} Name und Ausgabe oder Hinweis auf Hintergrundprozess.
 * @throws {Error} statusCode 404 wenn Stack nicht gefunden.
 * @throws {Error} Wenn docker compose sofort fehlschlägt (Konfigurationsfehler).
 */
export async function composeUpStack(name: string): Promise<StackUpdateResult> {
  const stackPath = await findStackPath(name);
  await generateEnvIfMissing(stackPath);
  const result = await execComposeBackground('docker compose up -d', stackPath);
  const output =
    result !== null
      ? [result.stdout, result.stderr].filter(Boolean).join('\n')
      : 'Stack wird gestartet — Image-Pull läuft im Hintergrund.\nDie Container erscheinen in der Liste sobald sie bereit sind.';
  return { name, output };
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
 * Optionale Zusatzdateien beim Erstellen eines Stacks.
 * @interface CreateStackFiles
 */
export interface CreateStackFiles {
  /** Inhalt der ws2k.json — NPM Proxy Host wird automatisch angelegt. */
  ws2k?: string;
  /** Inhalt der .env.example — Secrets werden beim ersten Start auto-generiert. */
  envExample?: string;
}

/**
 * Erstellt einen neuen Stack: Verzeichnis anlegen + compose.yaml schreiben + docker compose up -d.
 * @description Erstellt das Stack-Verzeichnis unter dem ersten DOCKER_STACKS_PATH-Eintrag,
 *   schreibt den YAML-Inhalt als compose.yaml und startet den Stack.
 *   Optional: ws2k.json (NPM Auto-Provisioning) und .env.example (Secret-Auto-Generierung).
 *   Validiert den Stack-Namen (nur a-z, 0-9, - und _).
 *   Fehler wenn Verzeichnis schon existiert (HTTP 409).
 *   Fehler wenn das primäre DOCKER_STACKS_PATH nicht existiert (HTTP 503).
 * @async
 * @function createStack
 * @param {string} name - Neuer Stack-Name (nur a-z, 0-9, _ und -).
 * @param {string} content - YAML-Inhalt der compose.yaml.
 * @param {CreateStackFiles} [files] - Optionale Zusatzdateien.
 * @returns {Promise<StackUpdateResult>} Name und kombinierte Ausgabe.
 * @throws {Error} statusCode 400 bei ungültigem Stack-Namen.
 * @throws {Error} statusCode 409 wenn Stack bereits existiert.
 * @throws {Error} statusCode 503 wenn primäres DOCKER_STACKS_PATH nicht existiert.
 * @throws {Error} Wenn docker compose fehlschlägt.
 */
export async function createStack(
  name: string,
  content: string,
  files?: CreateStackFiles,
): Promise<StackUpdateResult> {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
    throw Object.assign(
      new Error(
        'Ungültiger Stack-Name: nur a-z, 0-9, - und _ erlaubt. Muss mit a-z oder 0-9 beginnen.',
      ),
      { statusCode: 400 },
    );
  }
  // Neuer Stack wird immer im ersten (primären) Stacks-Pfad angelegt
  const basePath = getStacksPaths()[0];
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
  if (files?.ws2k) {
    await writeFile(path.join(stackPath, 'ws2k.json'), files.ws2k, 'utf-8');
  }
  if (files?.envExample) {
    await writeFile(path.join(stackPath, '.env.example'), files.envExample, 'utf-8');
  }
  await generateEnvIfMissing(stackPath);
  const { stdout, stderr } = await execAsync('docker compose up -d', {
    cwd: stackPath,
    timeout: 5 * 60 * 1000,
    env: { ...process.env, COMPOSE_ANSI: 'never' },
  });
  return { name, output: [stdout, stderr].filter(Boolean).join('\n') };
}
