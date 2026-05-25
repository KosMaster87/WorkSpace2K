/**
 * @fileoverview Auth Middleware — JWT-Prüfung für geschützte Endpunkte
 * @description Express Middleware die den Authorization-Header prüft,
 *   den JWT verifiziert und userId/userRole am Request-Objekt setzt.
 *   Wird in auth.routes.ts vor geschützten Controllern eingehängt.
 * @module AuthMiddleware
 */

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Erweitertes Express Request-Objekt mit Auth-Daten.
 * @interface AuthRequest
 * @extends Request
 */
export interface AuthRequest extends Request {
  /** User-ID aus dem JWT-Payload — gesetzt nach erfolgreicher Prüfung. */
  userId?: string;
  /** User-Rolle aus dem JWT-Payload (z.B. 'ADMIN', 'USER'). */
  userRole?: string;
}

/**
 * Prüft den JWT-Bearer-Token und setzt userId/userRole am Request-Objekt.
 * @description Erwartet Header: "Authorization: Bearer <token>".
 *   Fallback: ?token= Query-Parameter — für SSE-Endpoints (EventSource unterstützt
 *   keine Custom-Header). Der Query-Token wird nur akzeptiert wenn kein Header gesetzt ist.
 *   Fehlerfall 1: Kein Token (weder Header noch Query) → HTTP 401 'Unauthorized'.
 *   Fehlerfall 2: Token abgelaufen oder ungültig → HTTP 401 'Invalid token'.
 *   Erfolg: req.userId und req.userRole werden gesetzt, next() wird aufgerufen.
 * @param {AuthRequest} req - Express Request mit optionalem Authorization-Header.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - Nächster Middleware-Handler.
 * @returns {void}
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  // SSE-Fallback: ?token= Query-Parameter (EventSource sendet keine Custom-Header)
  // Optional chaining: req.query kann in Test-Mocks undefined sein
  const queryToken = (req.query as { token?: string } | undefined)?.['token'];

  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : queryToken;

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env['JWT_SECRET'] as string) as {
      userId: string;
      role: string;
    };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
