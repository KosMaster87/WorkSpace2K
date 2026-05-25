/**
 * @fileoverview Users Controller — CRUD-Handler für User-Management
 * @description Alle Handler für die /api/users Endpunkte.
 *   Nur für ADMIN-User zugänglich (adminOnly Middleware in users.routes.ts).
 *   Passwörter werden nie in Responses zurückgegeben.
 *   Eigene Account-Löschung ist gesperrt (Sicherheit).
 * @module UsersController
 */

import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { prisma } from '../services/prisma.service';
import { AuthRequest } from '../middleware/auth.middleware';

/** Prisma-Teiltyp mit den selektierten Feldern (ohne Passwort). */
type UserRow = { id: string; name: string; email: string; role: string; createdAt: Date };

/**
 * Formatiert einen Prisma-User für die API-Antwort.
 * @description Konvertiert role zu lowercase (konsistent mit auth.controller).
 * @param {UserRow} u - Prisma-User-Objekt ohne Passwort.
 * @returns API-formatierter User.
 * @private
 */
function fmt(u: UserRow): {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
} {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.toLowerCase(),
    createdAt: u.createdAt,
  };
}

/**
 * Gibt alle User zurück (ohne Passwort-Feld).
 * @description GET /api/users — sortiert nach createdAt aufsteigend.
 * @async
 * @function listUsers
 * @param {AuthRequest} _req - Express Request (ungenutzt).
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} JSON { data: User[] }
 */
export async function listUsers(_req: AuthRequest, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ data: users.map(fmt) });
}

/**
 * Legt einen neuen User an.
 * @description POST /api/users — Passwort wird mit bcrypt (Rounds: 12) gehasht.
 *   HTTP 409 wenn die E-Mail bereits vergeben ist.
 *   HTTP 400 wenn Pflichtfelder fehlen.
 * @async
 * @function createUser
 * @param {AuthRequest} req - Body: { name, email, password, role? }
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} JSON { data: User } — HTTP 201
 */
export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: 'name, email und password sind Pflichtfelder.' });
    return;
  }

  const validRoles = ['ADMIN', 'USER'];
  const normalizedRole = role?.toUpperCase() ?? 'USER';
  if (!validRoles.includes(normalizedRole)) {
    res.status(400).json({ message: `Ungültige Rolle. Erlaubt: ${validRoles.join(', ')}` });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: `E-Mail ${email} ist bereits vergeben.` });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: normalizedRole as 'ADMIN' | 'USER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json({ data: fmt(user) });
}

/**
 * Ändert die Rolle eines Users.
 * @description PATCH /api/users/:id/role — Body: { role: 'ADMIN' | 'USER' }.
 *   HTTP 400 bei ungültiger Rolle.
 *   HTTP 404 wenn User nicht existiert.
 * @async
 * @function updateUserRole
 * @param {AuthRequest} req - Params: id — Body: { role }
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} JSON { data: User }
 */
export async function updateUserRole(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { role } = req.body as { role?: string };

  const validRoles = ['ADMIN', 'USER'];
  const normalizedRole = role?.toUpperCase();
  if (!normalizedRole || !validRoles.includes(normalizedRole)) {
    res.status(400).json({ message: `Ungültige Rolle. Erlaubt: ${validRoles.join(', ')}` });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: `User ${id} nicht gefunden.` });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: normalizedRole as 'ADMIN' | 'USER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.json({ data: fmt(user) });
}

/**
 * Löscht einen User.
 * @description DELETE /api/users/:id
 *   HTTP 403 wenn der Admin versucht, seinen eigenen Account zu löschen.
 *   HTTP 404 wenn User nicht existiert.
 * @async
 * @function deleteUser
 * @param {AuthRequest} req - Params: id — req.userId: eingeloggter User
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} HTTP 204 No Content
 */
export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  if (id === req.userId) {
    res.status(403).json({ message: 'Der eigene Account kann nicht gelöscht werden.' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: `User ${id} nicht gefunden.` });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}
