/**
 * @fileoverview Auth Controller — Login und Session-Restore Logik
 * @description Verarbeitet Auth-Requests: Passwort-Prüfung, JWT-Signierung, User-Abfrage.
 *   Alle Antworten folgen dem ApiResponse-Format: { data: { user, token } }.
 *   Role wird lowercase zurückgegeben (Frontend erwartet 'admin'/'user', nicht 'ADMIN'/'USER').
 * @module AuthController
 */

import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';

/**
 * Erstellt einen signierten JWT für einen User.
 * @description Token enthält userId und role als Payload.
 *   Ablaufzeit: JWT_EXPIRES_IN aus .env oder Fallback '7d'.
 *   JWT_SECRET muss in .env gesetzt sein (openssl rand -hex 32).
 * @param {string} userId - Eindeutige User-ID (CUID).
 * @param {string} role - User-Rolle ('ADMIN' oder 'USER').
 * @returns {string} Signierter JWT-String.
 * @private
 */
function signToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env['JWT_SECRET'] as string,
    { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' } as jwt.SignOptions,
  );
}

/**
 * Authentifiziert einen User mit E-Mail und Passwort.
 * @description Ablauf:
 *   1. E-Mail und Passwort aus Body lesen
 *   2. User per E-Mail in der DB suchen
 *   3. Passwort mit bcrypt.compare prüfen
 *   4. JWT signieren und User + Token zurückgeben
 *   Fehlerfall: HTTP 400 bei fehlendem Body, HTTP 401 bei falschen Credentials.
 *   Security: Gleiche Fehlermeldung für "User nicht gefunden" und "Passwort falsch"
 *   — verhindert User-Enumeration.
 * @async
 * @param {Request} req - Express Request mit { email, password } im Body.
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} Schreibt { data: { token, user } } in die Response.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = signToken(user.id, user.role);
  res.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
      },
    },
  });
}

/**
 * Gibt den aktuell eingeloggten User zurück und stellt einen frischen Token aus.
 * @description Wird von GET /api/auth/me aufgerufen — authMiddleware setzt req.userId.
 *   Gibt einen neu signierten Token zurück (Token-Rotation bei Session Restore).
 *   HTTP 404 wenn der User in der DB nicht mehr existiert (z.B. gelöscht).
 * @async
 * @param {AuthRequest} req - Express Request mit userId aus authMiddleware.
 * @param {Response} res - Express Response.
 * @returns {Promise<void>} Schreibt { data: { token, user } } in die Response.
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const token = signToken(user.id, user.role);
  res.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
      },
    },
  });
}
