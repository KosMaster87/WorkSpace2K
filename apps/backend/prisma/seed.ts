/**
 * @fileoverview Datenbank Seed — Admin-User und Standard-Destinations anlegen
 * @description Legt einen Admin-User aus Umgebungsvariablen an.
 *   SEED_ADMIN_EMAIL und SEED_ADMIN_PASSWORD müssen in .env gesetzt sein.
 *   Legt außerdem die Standard-Destinations an (idempotent).
 * @module Seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  const count = await prisma.destination.count();
  if (count > 0) {
    console.log(`✓ Destinations bereits vorhanden (${count}) — übersprungen.`);
    return;
  }

  const defaults = [
    // ── Infrastruktur ────────────────────────────────────────────────────────
    {
      name: 'Nginx Proxy Manager',
      url: 'http://192.168.188.24:81',
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
      name: 'Nextcloud',
      url: 'https://nextcloud.dev2ksoftware.com',
      icon: '☁️',
      category: 'Produktivität',
      description: 'Self-hosted Cloud — Dateien, Kalender, Kontakte',
      sortOrder: 0,
    },
    {
      name: 'Winboard',
      url: 'https://winboard.dev2ksoftware.com',
      icon: '📋',
      category: 'Produktivität',
      description: 'Kanban-Board',
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
      url: 'https://meet.jit.si',
      icon: '🎥',
      category: 'Kommunikation',
      description: 'Video-Konferenzen (öffentliche Instanz)',
      sortOrder: 1,
    },
  ];

  await prisma.destination.createMany({ data: defaults });
  console.log(`✓ ${defaults.length} Standard-Destinations angelegt.`);
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
