/**
 * @fileoverview Prisma Service — Datenbankverbindung als Singleton
 * @description Exportiert eine einzelne PrismaClient-Instanz für die gesamte Applikation.
 *   Singleton-Pattern verhindert zu viele gleichzeitige Datenbankverbindungen.
 *   Ab Prisma 7: Driver Adapter Pattern — @prisma/adapter-pg + pg.Pool statt
 *   direkter URL in schema.prisma. URL kommt aus DATABASE_URL Umgebungsvariable.
 *   Wird in auth.controller.ts und prisma/seed.ts importiert.
 * @module PrismaService
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);

/**
 * Globale Prisma-Client-Instanz.
 * @description Singleton — alle Module importieren diese eine Instanz.
 *   Verwendet pg.Pool + PrismaPg-Adapter (Prisma 7 Driver Adapter Pattern).
 */
export const prisma = new PrismaClient({ adapter });
