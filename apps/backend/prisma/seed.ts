/**
 * @fileoverview Datenbank Seed — Admin-User und Standard-Destinations anlegen
 * @description Legt einen Admin-User aus Umgebungsvariablen an.
 *   SEED_ADMIN_EMAIL und SEED_ADMIN_PASSWORD müssen in .env gesetzt sein.
 *   Legt außerdem die Standard-Destinations an (idempotent).
 * @module Seed
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Legt den initialen Admin-User an.
 * @description Idempotent — überspringt wenn User bereits existiert.
 * @async
 * @function seedAdmin
 */
async function seedAdmin(): Promise<void> {
  const email = process.env['SEED_ADMIN_EMAIL'];
  const plainPassword = process.env['SEED_ADMIN_PASSWORD'];

  if (!email || !plainPassword) {
    console.error('✗ SEED_ADMIN_EMAIL und SEED_ADMIN_PASSWORD müssen in .env gesetzt sein.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Admin-User "${email}" existiert bereits — übersprungen.`);
    return;
  }

  const password = await bcrypt.hash(plainPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Dev2K Admin',
      password,
      role: 'ADMIN',
    },
  });

  console.log(`✓ Admin-User angelegt: ${admin.email} (ID: ${admin.id})`);
  console.log('  → Passwort bitte nach dem ersten Login ändern!');
}

/**
 * Legt die Standard-Destinations an (idempotent).
 * @description Überspringt wenn bereits Destinations vorhanden sind.
 * @async
 * @function seedDestinations
 */
async function seedDestinations(): Promise<void> {
  const defaults = [
    // ── Infrastruktur ────────────────────────────────────────────────────────
    {
      name: 'Nginx Proxy Manager',
      url: 'http://192.168.188.25:81',
      icon: '🔀',
      category: 'Infrastruktur',
      description: 'Reverse Proxy — verwaltet alle lokalen Domains und SSL',
      sortOrder: 0,
    },
    // ── Security ─────────────────────────────────────────────────────────────
    {
      name: 'Vaultwarden',
      url: 'https://vaultwarden.dev2ksoftware.com',
      icon: '🔒',
      category: 'Security',
      description: 'Passwort-Manager (Bitwarden-kompatibel)',
      sortOrder: 0,
    },
    // ── Produktivität ─────────────────────────────────────────────────────────
    {
      name: 'Obsidian LiveSync',
      url: 'https://obsidian.dev2ksoftware.com',
      icon: '🔮',
      category: 'Produktivität',
      description: 'CouchDB für Obsidian LiveSync — Notizen zwischen Geräten synchronisieren',
      sortOrder: 0,
    },
    {
      name: 'Nextcloud',
      url: 'https://nextcloud.dev2ksoftware.com',
      icon: '☁️',
      category: 'Produktivität',
      description: 'Self-hosted Cloud — Dateien, Kalender, Kontakte',
      sortOrder: 0,
    },
    {
      name: 'WinBoat',
      url: 'https://winboat.dev2ksoftware.com',
      icon: '🪟',
      category: 'Produktivität',
      description: 'Windows in Docker (dockur/windows) — noVNC im Browser',
      sortOrder: 1,
    },
    // ── Automation ───────────────────────────────────────────────────────────
    {
      name: 'n8n',
      url: 'https://n8n.dev2ksoftware.com',
      icon: '⚙️',
      category: 'Automation',
      description: 'Workflow-Automatisierung',
      sortOrder: 0,
    },
    // ── DevOps ───────────────────────────────────────────────────────────────
    {
      name: 'Gitea',
      url: 'https://gitea.dev2ksoftware.com',
      icon: '🐙',
      category: 'DevOps',
      description: 'Self-hosted Git-Service',
      sortOrder: 0,
    },
    {
      name: 'GitLab',
      url: 'https://gitlab.dev2ksoftware.com',
      icon: '🦊',
      category: 'DevOps',
      description: 'Git, CI/CD, Issues, Merge Requests',
      sortOrder: 1,
    },
    // ── CMS ───────────────────────────────────────────────────────────────────
    {
      name: 'WordPress',
      url: 'https://wordpress.dev2ksoftware.com',
      icon: '📝',
      category: 'CMS',
      description: 'WordPress — meistgenutztes CMS weltweit',
      sortOrder: 0,
    },
    {
      name: 'Drupal',
      url: 'https://drupal.dev2ksoftware.com',
      icon: '💧',
      category: 'CMS',
      description: 'Drupal — Enterprise CMS mit PostgreSQL',
      sortOrder: 1,
    },
    {
      name: 'TYPO3',
      url: 'https://typo3.dev2ksoftware.com',
      icon: '🔷',
      category: 'CMS',
      description: 'TYPO3 — Enterprise CMS, stark in Deutschland',
      sortOrder: 2,
    },
    // ── Datenbank / Backend-as-a-Service ─────────────────────────────────────
    {
      name: 'Supabase',
      url: 'https://supabase.dev2ksoftware.com',
      icon: '⚡',
      category: 'Entwicklung',
      description: 'Open-Source Firebase Alternative — Datenbank, Auth, Storage, Realtime',
      sortOrder: 0,
    },
    // ── E-Mail ────────────────────────────────────────────────────────────────
    {
      name: 'Mailcow',
      url: 'https://mail.dev2ksoftware.com',
      icon: '📧',
      category: 'Infrastruktur',
      description: 'Self-hosted E-Mail Suite — SMTP, IMAP, Webmail, Spam-Schutz',
      sortOrder: 1,
    },
    // ── Kommunikation ─────────────────────────────────────────────────────────
    {
      name: 'Element',
      url: 'https://element.dev2ksoftware.com',
      icon: '💬',
      category: 'Kommunikation',
      description: 'Matrix-Client — verschlüsselte Chats',
      sortOrder: 0,
    },
    {
      name: 'Jitsi Meet',
      url: 'https://meet.dev2ksoftware.com',
      icon: '🎥',
      category: 'Kommunikation',
      description: 'Self-hosted Video-Konferenzen',
      sortOrder: 1,
    },
  ];

  const existingNames = new Set(
    (await prisma.destination.findMany({ select: { name: true } })).map((d) => d.name),
  );
  const toCreate = defaults.filter((d) => !existingNames.has(d.name));

  if (toCreate.length === 0) {
    console.log(`✓ Alle Destinations bereits vorhanden (${existingNames.size}) — nichts zu tun.`);
    return;
  }

  await prisma.destination.createMany({ data: toCreate });
  console.log(`✓ ${toCreate.length} neue Destination(s) angelegt (${existingNames.size} bereits vorhanden).`);
  console.log('  → URLs bitte in der App an die eigene Infrastruktur anpassen.');
}

/**
 * Einstiegspunkt — führt alle Seed-Funktionen aus.
 * @async
 * @function main
 */
async function main(): Promise<void> {
  await seedAdmin();
  await seedDestinations();
}

main()
  .catch((err) => {
    console.error('Seed fehlgeschlagen:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
