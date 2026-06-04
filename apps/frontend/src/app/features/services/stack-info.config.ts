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
  /** Optionale Kurznotiz zum Einrichtungsprozess. */
  setupNote?: string;
  /** Schritt-für-Schritt-Anleitung für den Erstzugang nach dem Start. */
  setupSteps?: string[];
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
  gitea: {
    downloadMb: 300,
    diskGb: 0.8,
    setupMinutes: [1, 2],
    setupNote: 'Setup-Wizard im Browser — SSH-Port 222 voreingestellt.',
    setupSteps: [
      'https://gitea.dev2ksoftware.com öffnen',
      'Datenbanktyp: SQLite3 · Server Domain: gitea.dev2ksoftware.com',
      'SSH-Port 222 ist voreingestellt — nicht ändern',
      'Admin-Account am Ende des Wizards anlegen und speichern',
    ],
  },
  gitlab: {
    downloadMb: 2500,
    diskGb: 5.0,
    setupMinutes: [5, 10],
    setupNote:
      'GitLab benötigt 3–5 Min. Initialisierung nach dem ersten Start. root-Passwort in Logs.',
    setupSteps: [
      '3–5 Min. warten bis GitLab vollständig gestartet ist',
      'Initial-Passwort lesen (im Terminal): docker exec gitlab cat /etc/gitlab/initial_root_password',
      'https://gitlab.dev2ksoftware.com öffnen',
      'Login: Benutzername "root" · Passwort aus Schritt 2',
      'Sofort Passwort ändern: User-Icon → Edit Profile → Password',
    ],
  },
  jitsi: {
    downloadMb: 800,
    diskGb: 2.0,
    setupMinutes: [2, 3],
    setupNote: 'Szenario A: Port 10000/UDP am Router öffnen. Szenario B: coturn Stack starten.',
    setupSteps: [
      'https://meet.dev2ksoftware.com öffnen',
      'Konferenzraum-Name eingeben und Meeting starten',
      'Bei Verbindungsproblemen (Video/Audio): coturn Stack starten (Szenario B)',
    ],
  },
  mailcow: {
    downloadMb: 3000,
    diskGb: 7.0,
    setupMinutes: [10, 15],
    setupNote: 'Separates Setup via generate_config.sh — nicht über WorkSpace2K startbar.',
    setupSteps: [
      'cd /opt && git clone https://github.com/mailcow/mailcow-dockerized',
      'cd mailcow-dockerized && ./generate_config.sh (Hostname: mail.dev2ksoftware.com)',
      'docker compose up -d (startet alle Mailcow-Container)',
      'https://mail.dev2ksoftware.com öffnen · Login: admin / moohoo',
      'Sofort Passwort ändern · DKIM in Cloudflare DNS eintragen',
    ],
  },
  matrix: {
    downloadMb: 400,
    diskGb: 1.0,
    setupMinutes: [3, 5],
    setupNote: 'Erster Start: "docker compose run --rm synapse generate" ausführen.',
    setupSteps: [
      'Im Terminal: docker compose run --rm synapse generate',
      'Stack danach normal starten: Start All',
      'Element öffnen: https://element.dev2ksoftware.com',
      'Neuen Account auf matrix.dev2ksoftware.com registrieren',
    ],
  },
  n8n: {
    downloadMb: 300,
    diskGb: 0.7,
    setupMinutes: [1, 2],
    setupNote: 'Login-Registrierung beim ersten Aufruf. N8N_ENCRYPTION_KEY in .env pflegen.',
    setupSteps: [
      'https://n8n.dev2ksoftware.com öffnen',
      'Owner-Account anlegen (E-Mail + Passwort)',
      'Fertig — Workflows können direkt erstellt werden',
    ],
  },
  nextcloud: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [3, 5],
    setupNote: 'Setup-Wizard im Browser — Admin-Zugangsdaten aus .env.',
    setupSteps: [
      'https://nextcloud.dev2ksoftware.com öffnen',
      'Admin-User aus .env: NEXTCLOUD_ADMIN_USER / NEXTCLOUD_ADMIN_PASSWORD',
      'Datenbank-Typ: PostgreSQL (wird automatisch konfiguriert)',
      'Nach dem Login: Einstellungen → Sicherheit → Passwort ändern',
    ],
  },
  npm: {
    downloadMb: 100,
    diskGb: 0.3,
    setupMinutes: [1, 1],
    setupNote:
      'Web-UI auf Port 81 — Standard-Login: admin@example.com / changeme (sofort ändern!).',
    setupSteps: [
      'http://192.168.188.25:81 öffnen (nur im LAN!)',
      'Login: admin@example.com · Passwort: changeme',
      'Sofort E-Mail und Passwort auf eigene Werte ändern',
      'Wildcard-Zertifikat anlegen: SSL Certificates → Add → *.dev2ksoftware.com',
    ],
  },
  'obsidian-livesync': {
    downloadMb: 100,
    diskGb: 0.25,
    setupMinutes: [2, 3],
    setupNote: 'Fauxton Admin-UI unter /_utils/ — CouchDB Admin-User anlegen.',
    setupSteps: [
      'https://obsidian.dev2ksoftware.com/_utils/ öffnen',
      'Login: COUCHDB_USER / COUCHDB_PASSWORD aus .env',
      'Datenbank "obsidian" anlegen: Databases → Create Database',
      'Sync-User anlegen: ⚙ Config → User Management → Create User',
      'Obsidian App: Community Plugin "Self-hosted LiveSync" installieren und verbinden',
    ],
  },
  supabase: {
    downloadMb: 2000,
    diskGb: 5.0,
    setupMinutes: [3, 5],
    setupNote:
      'ANON_KEY und SERVICE_KEY sind JWTs — vor dem Start generieren (siehe .env.example).',
    setupSteps: [
      'ANON_KEY und SERVICE_KEY vor dem Start generieren (jwt.io mit JWT_SECRET)',
      'https://supabase.dev2ksoftware.com öffnen (Supabase Studio)',
      'Default-Anmeldung: SERVICE_KEY aus .env als API-Key',
      'Datenbanken und Tabellen über das Studio verwalten',
    ],
  },
  typo3: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [3, 5],
    setupNote: 'Install-Tool unter /typo3/install.php — DB-Verbindung einrichten.',
    setupSteps: [
      'https://typo3.dev2ksoftware.com/typo3/install.php öffnen',
      'Install-Tool-Passwort setzen (beim ersten Aufruf)',
      'Datenbank-Verbindung: Host typo3-db · Port 3306 · DB typo3 · User typo3',
      'Passwort aus .env: DB_PASSWORD',
      'Admin-User anlegen und fertig',
    ],
  },
  vaultwarden: {
    downloadMb: 50,
    diskGb: 0.1,
    setupMinutes: [1, 2],
    setupNote: 'Registrierung beim ersten Aufruf. Admin-Panel unter /admin mit ADMIN_TOKEN.',
    setupSteps: [
      'https://vaultwarden.dev2ksoftware.com öffnen',
      'Account erstellen (Registrierung ist beim ersten Start offen)',
      'SIGNUPS_ALLOWED in .env auf "false" setzen nach erstem Account',
      'Admin-Panel (optional): https://vaultwarden.dev2ksoftware.com/admin · Token aus .env',
    ],
  },
  winboat: {
    downloadMb: 500,
    diskGb: 20.0,
    setupMinutes: [20, 45],
    setupNote:
      'Windows ISO (~5 GB) wird beim ersten Start separat heruntergeladen und installiert.',
    setupSteps: [
      'Start All — Windows ISO (~5 GB) wird automatisch geladen (20–45 Min.)',
      'https://winboat.dev2ksoftware.com öffnen (noVNC im Browser)',
      'Windows-Installation im Browser durchführen',
      'Alternativ RDP: Port 3389 am Router weiterleiten, dann mit RDP-Client verbinden',
    ],
  },
  wordpress: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [2, 3],
    setupNote: 'Setup-Wizard im Browser — Titel, Admin-User und DB werden eingerichtet.',
    setupSteps: [
      'https://wordpress.dev2ksoftware.com öffnen',
      'Sprache wählen → Weiter',
      'Datenbank ist bereits verbunden — direkt Admin-Account anlegen',
      'Website-Titel, Admin-E-Mail und Passwort festlegen',
      'Login unter /wp-admin — Themes und Plugins installieren',
    ],
  },
  drupal: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [3, 5],
    setupNote: 'Setup-Wizard im Browser — DB-Zugangsdaten eingeben.',
    setupSteps: [
      'https://drupal.dev2ksoftware.com öffnen',
      'Sprache wählen → Standard-Profil → Weiter',
      'DB-Typ: PostgreSQL · Host: drupal-db · DB: drupal · User: drupal',
      'DB-Passwort aus .env: DB_PASSWORD',
      'Admin-Account anlegen → Fertig',
    ],
  },
  workspace2k: {
    downloadMb: 500,
    diskGb: 1.5,
    setupMinutes: [2, 3],
    setupNote:
      'Build aus Quellcode — dauert länger als fertige Images. DB-Seed einmalig ausführen.',
    setupSteps: [
      'Nach dem Build: docker compose exec backend npm run db:seed:prod',
      'https://workspace2k.dev2ksoftware.com öffnen',
      'Login: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD aus .env',
      'Nach erstem Login: Passwort ändern, Seed-Variablen aus .env entfernen',
    ],
  },
};
