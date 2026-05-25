/**
 * @fileoverview Destinations Controller — CRUD-Handler für Service-Destinations
 * @description Alle Handler für die /api/destinations Endpunkte.
 *   GET ist für alle eingeloggten User zugänglich.
 *   POST, PATCH, DELETE sind nur für ADMIN-User (adminOnly in routes).
 *   Destinations werden nach sortOrder und name sortiert.
 * @module DestinationsController
 */

import { Response } from 'express';
import { prisma } from '../services/prisma.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Gibt alle aktiven Destinations zurück, sortiert nach sortOrder und name.
 * @description GET /api/destinations — zugänglich für alle eingeloggten User.
 * @async
 * @function listDestinations
 * @param {AuthRequest} _req - Express Request (ungenutzt).
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} JSON { data: Destination[] }
 */
export async function listDestinations(_req: AuthRequest, res: Response): Promise<void> {
  const destinations = await prisma.destination.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({ data: destinations });
}

/**
 * Legt eine neue Destination an.
 * @description POST /api/destinations — nur für ADMIN.
 *   HTTP 400 wenn name oder url fehlen.
 * @async
 * @function createDestination
 * @param {AuthRequest} req - Body: { name, url, icon?, category?, description?, sortOrder? }
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} JSON { data: Destination } — HTTP 201
 */
export async function createDestination(req: AuthRequest, res: Response): Promise<void> {
  const { name, url, icon, category, description, sortOrder } = req.body as {
    name?: string;
    url?: string;
    icon?: string;
    category?: string;
    description?: string;
    sortOrder?: number;
  };

  if (!name || !url) {
    res.status(400).json({ message: 'name und url sind Pflichtfelder.' });
    return;
  }

  const destination = await prisma.destination.create({
    data: {
      name,
      url,
      icon: icon ?? null,
      category: category ?? null,
      description: description ?? null,
      sortOrder: sortOrder ?? 0,
    },
  });

  res.status(201).json({ data: destination });
}

/**
 * Aktualisiert eine bestehende Destination.
 * @description PATCH /api/destinations/:id — nur für ADMIN.
 *   Aktualisiert nur die übermittelten Felder (Partial Update).
 *   HTTP 404 wenn Destination nicht existiert.
 * @async
 * @function updateDestination
 * @param {AuthRequest} req - Params: id — Body: Partial Destination-Felder
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} JSON { data: Destination }
 */
export async function updateDestination(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { name, url, icon, category, description, sortOrder, isActive } = req.body as {
    name?: string;
    url?: string;
    icon?: string;
    category?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: `Destination ${id} nicht gefunden.` });
    return;
  }

  const destination = await prisma.destination.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(url !== undefined && { url }),
      ...(icon !== undefined && { icon }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({ data: destination });
}

/**
 * Löscht eine Destination.
 * @description DELETE /api/destinations/:id — nur für ADMIN.
 *   HTTP 404 wenn Destination nicht existiert.
 * @async
 * @function deleteDestination
 * @param {AuthRequest} req - Params: id
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} HTTP 204 No Content
 */
export async function deleteDestination(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: `Destination ${id} nicht gefunden.` });
    return;
  }

  await prisma.destination.delete({ where: { id } });
  res.status(204).send();
}
