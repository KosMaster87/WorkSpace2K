/**
 * @fileoverview Auth Middleware Tests
 * @description Prüft JWT-Verifizierung: kein Header, falsches Format,
 *   ungültiger Token, abgelaufener Token, gültiger Token.
 *   Testet auch den SSE-Fallback: Token via ?token= Query-Parameter.
 */

import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = 'test-secret-32-chars-long-enough!';

/**
 * Erstellt einen Mock-Request mit optionalem Authorization-Header.
 * Enthält immer ein leeres query-Objekt (wie in echten Express-Requests).
 */
function buildReq(authHeader?: string): AuthRequest {
  return {
    headers: { authorization: authHeader },
    query: {},
  } as unknown as AuthRequest;
}

/**
 * Erstellt einen Mock-Request mit Token als Query-Parameter (SSE-Fallback).
 * Kein Authorization-Header — simuliert EventSource-Anfrage.
 */
function buildReqWithQueryToken(token: string): AuthRequest {
  return {
    headers: {},
    query: { token },
  } as unknown as AuthRequest;
}

function buildRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    process.env['JWT_SECRET'] = JWT_SECRET;
    jest.clearAllMocks();
  });

  it('should return 401 when no Authorization header', () => {
    const req = buildReq();
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not start with Bearer', () => {
    const req = buildReq('Basic abc123');
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', () => {
    const req = buildReq('Bearer invalid.token.here');
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for token signed with wrong secret', () => {
    const wrongToken = jwt.sign({ userId: 'u1', role: 'USER' }, 'wrong-secret');
    const req = buildReq(`Bearer ${wrongToken}`);
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set userId and userRole and call next for valid token', () => {
    const token = jwt.sign({ userId: 'u1', role: 'ADMIN' }, JWT_SECRET);
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(req.userId).toBe('u1');
    expect(req.userRole).toBe('ADMIN');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 for expired token', () => {
    const expiredToken = jwt.sign({ userId: 'u1', role: 'USER' }, JWT_SECRET, {
      expiresIn: -1,
    } as jwt.SignOptions);
    const req = buildReq(`Bearer ${expiredToken}`);
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  // ── SSE-Fallback: Token via ?token= Query-Parameter ───────────────────────

  it('SSE: should accept valid token via ?token= query parameter', () => {
    const token = jwt.sign({ userId: 'u2', role: 'USER' }, JWT_SECRET);
    const req = buildReqWithQueryToken(token);
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(req.userId).toBe('u2');
    expect(req.userRole).toBe('USER');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('SSE: should return 401 for invalid token in ?token= query', () => {
    const req = buildReqWithQueryToken('invalid.token');
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('SSE: should return 401 when query token is missing and no header', () => {
    const req = buildReqWithQueryToken('');
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    // Leerer String ist falsy → kein Token → 401
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('SSE: Bearer header takes priority over ?token= query', () => {
    const bearerToken = jwt.sign({ userId: 'u1', role: 'ADMIN' }, JWT_SECRET);
    const queryToken = jwt.sign({ userId: 'u2', role: 'USER' }, JWT_SECRET);
    const req = {
      headers: { authorization: `Bearer ${bearerToken}` },
      query: { token: queryToken },
    } as unknown as AuthRequest;
    const res = buildRes();

    authMiddleware(req, res as Response, next);

    // Bearer hat Vorrang → userId aus bearerToken
    expect(req.userId).toBe('u1');
    expect(req.userRole).toBe('ADMIN');
    expect(next).toHaveBeenCalled();
  });
});
