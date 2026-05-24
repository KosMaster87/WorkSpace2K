/**
 * @fileoverview Prisma Service — Datenbankverbindung als Singleton
 * @description Exportiert eine einzelne PrismaClient-Instanz für die gesamte Applikation.
 *   Singleton-Pattern verhindert zu viele gleichzeitige Datenbankverbindungen.
 *   Wird in auth.controller.ts und prisma/seed.ts importiert.
 * @module PrismaService
 */

import { PrismaClient } from '@prisma/client';

/**
 * Globale Prisma-Client-Instanz.
 * @description Singleton — alle Module importieren diese eine Instanz.
 *   Verbindung wird über DATABASE_URL in .env konfiguriert.
 */
export const prisma = new PrismaClient();
