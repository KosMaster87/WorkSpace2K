/**
 * @fileoverview Datenbank Seed — initialen Admin-User anlegen
 * @description Legt einen Admin-User aus Umgebungsvariablen an.
 *   SEED_ADMIN_EMAIL und SEED_ADMIN_PASSWORD müssen in .env gesetzt sein.
 *   Idempotent — überspringt wenn User bereits existiert.
 * @module Seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

main()
  .catch((err) => {
    console.error('Seed fehlgeschlagen:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
