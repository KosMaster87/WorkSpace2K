/**
 * @fileoverview Stack Info Config — Größen und Zeitschätzungen je Stack
 * @description Zeigt dem User vor dem ersten Start wie groß der Download ist,
 *   wie lange er bei verschiedenen Verbindungsgeschwindigkeiten dauert und
 *   wie lange der Einrichtungsprozess nach dem Download ca. dauert.
 * @module StackInfoConfig
 */

/** Metadaten eines Stacks für die Info-Anzeige. */
export interface StackInfo {
  /** Komprimierte Download-Größe aller Images in MB. */
  downloadMb: number;
  /** Entpackte Größe auf Disk in GB. */
  diskGb: number;
  /** Geschätzte Setup-Dauer nach dem Download [min, max] in Minuten. */
  setupMinutes: [number, number];
  /** Optionale Hinweise zum Einrichtungsprozess. */
  setupNote?: string;
}

/**
 * Download-Zeit in Minuten bei gegebener Verbindungsgeschwindigkeit.
 * @param {number} downloadMb - Komprimierte Image-Größe in MB.
 * @param {number} speedMbit - Verbindungsgeschwindigkeit in Mbit/s.
 * @returns {number} Geschätzte Zeit in Minuten (gerundet auf 0.5 Min).
 */
export function calcDownloadMinutes(downloadMb: number, speedMbit: number): number {
  // Realistischer Durchsatz: ~70% der Nenngeschwindigkeit
  const throughputMBs = (speedMbit * 0.7) / 8;
  const minutes = downloadMb / throughputMBs / 60;
  return Math.max(0.5, Math.round(minutes * 2) / 2);
}

/** Verbindungsgeschwindigkeiten für die Info-Tabelle. */
export const SPEED_PRESETS = [
  { label: '50 Mbit/s', mbit: 50 },
  { label: '100 Mbit/s', mbit: 100 },
  { label: '250 Mbit/s', mbit: 250 },
  { label: '1 Gbit/s', mbit: 1000 },
];

/** Stack-Informationen — Name entspricht dem Docker Compose Projekt-Namen. */
export const STACK_INFO: Record<string, StackInfo> = {
  cloudflared: {
    downloadMb: 50,
    diskGb: 0.1,
    setupMinutes: [1, 1],
    setupNote: 'Startet sofort — kein manueller Setup nötig.',
  },
  coturn: {
    downloadMb: 50,
    diskGb: 0.1,
    setupMinutes: [1, 1],
    setupNote: 'Startet sofort nach Konfiguration der .env.',
  },
  drupal: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [3, 5],
    setupNote: 'Setup-Wizard im Browser — DB-Zugangsdaten eingeben.',
  },
  gitea: {
    downloadMb: 300,
    diskGb: 0.8,
    setupMinutes: [1, 2],
    setupNote: 'Setup-Wizard im Browser — SSH-Port 222 voreingestellt.',
  },
  gitlab: {
    downloadMb: 2500,
    diskGb: 5.0,
    setupMinutes: [5, 10],
    setupNote:
      'GitLab benötigt 3–5 Min. Initialisierung nach dem ersten Start. root-Passwort in Logs.',
  },
  jitsi: {
    downloadMb: 800,
    diskGb: 2.0,
    setupMinutes: [2, 3],
    setupNote: 'Szenario A: Port 10000/UDP am Router öffnen. Szenario B: coturn Stack starten.',
  },
  mailcow: {
    downloadMb: 3000,
    diskGb: 7.0,
    setupMinutes: [10, 15],
    setupNote: 'Separates Setup via generate_config.sh — nicht über WorkSpace2K startbar.',
  },
  matrix: {
    downloadMb: 400,
    diskGb: 1.0,
    setupMinutes: [3, 5],
    setupNote: 'Erster Start: "docker compose run --rm synapse generate" ausführen.',
  },
  n8n: {
    downloadMb: 300,
    diskGb: 0.7,
    setupMinutes: [1, 2],
    setupNote: 'Login-Registrierung beim ersten Aufruf. N8N_ENCRYPTION_KEY in .env pflegen.',
  },
  nextcloud: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [3, 5],
    setupNote: 'Setup-Wizard im Browser — Admin-Zugangsdaten aus .env.',
  },
  npm: {
    downloadMb: 100,
    diskGb: 0.3,
    setupMinutes: [1, 1],
    setupNote:
      'Web-UI auf Port 81 — Standard-Login: admin@example.com / changeme (sofort ändern!).',
  },
  'obsidian-livesync': {
    downloadMb: 100,
    diskGb: 0.25,
    setupMinutes: [2, 3],
    setupNote: 'Fauxton Admin-UI unter /_utils/ — CouchDB Admin-User anlegen.',
  },
  supabase: {
    downloadMb: 2000,
    diskGb: 5.0,
    setupMinutes: [3, 5],
    setupNote:
      'ANON_KEY und SERVICE_KEY sind JWTs — vor dem Start generieren (siehe .env.example).',
  },
  typo3: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [3, 5],
    setupNote: 'Install-Tool unter /typo3/install.php — DB-Verbindung einrichten.',
  },
  vaultwarden: {
    downloadMb: 50,
    diskGb: 0.1,
    setupMinutes: [1, 2],
    setupNote: 'Registrierung beim ersten Aufruf. Admin-Panel unter /admin mit ADMIN_TOKEN.',
  },
  winboat: {
    downloadMb: 500,
    diskGb: 20.0,
    setupMinutes: [20, 45],
    setupNote:
      'Windows ISO (~5 GB) wird beim ersten Start separat heruntergeladen und installiert.',
  },
  wordpress: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [2, 3],
    setupNote: 'Setup-Wizard im Browser — Titel, Admin-User und DB werden eingerichtet.',
  },
  workspace2k: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [2, 3],
    setupNote:
      'Build aus Quellcode — dauert länger als fertige Images. DB-Seed einmalig ausführen.',
  },
};
