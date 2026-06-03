/// <reference types="node" />
/**
 * @fileoverview Prisma Config — Datenbankverbindung für Prisma CLI und Migrate
 * @description Ab Prisma 7 wird die Datenbankverbindung nicht mehr in schema.prisma
 *   sondern in prisma.config.ts konfiguriert. Diese Datei wird von der Prisma CLI
 *   (migrate, generate, studio) gelesen. PrismaClient erhält die URL separat
 *   im Konstruktor (prisma.service.ts).
 * @module PrismaConfig
 */

import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
