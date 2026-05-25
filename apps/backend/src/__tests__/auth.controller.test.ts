/**
 * @fileoverview Auth Controller Tests
 * @description Prüft login() und getMe() — Prisma wird gemockt,
 *   kein echter Datenbankzugriff nötig.
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { login, getMe } from '../controllers/auth.controller';
import { AuthRequest } from '../middleware/auth.middleware';

// Prisma Service mocken — kein echter DB-Zugriff in Tests
jest.mock('../services/prisma.service', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../services/prisma.service';

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

const JWT_SECRET = 'test-secret-at-least-32-chars-long!';

function buildRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Auth Controller', () => {
  beforeEach(() => {
    process.env['JWT_SECRET'] = JWT_SECRET;
    jest.clearAllMocks();
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should return 400 when email or password missing', async () => {
      const req = { body: { email: '', password: '' } } as Request;
      const res = buildRes();

      await login(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email and password required' });
    });

    it('should return 401 when user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const req = { body: { email: 'nobody@x.de', password: 'pw' } } as Request;
      const res = buildRes();

      await login(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 401 when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct', 10);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'alice@x.de',
        name: 'Alice',
        password: hashedPassword,
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = { body: { email: 'alice@x.de', password: 'wrong' } } as Request;
      const res = buildRes();

      await login(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return token and user on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correct', 10);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'alice@x.de',
        name: 'Alice',
        password: hashedPassword,
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = { body: { email: 'alice@x.de', password: 'correct' } } as Request;
      const res = buildRes();

      await login(req, res as Response);

      expect(res.status).not.toHaveBeenCalled();
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data.token).toBeDefined();
      expect(jsonCall.data.user.email).toBe('alice@x.de');
      expect(jsonCall.data.user.role).toBe('user'); // lowercase
      expect(jsonCall.data.user.password).toBeUndefined(); // kein Passwort in Response
    });
  });

  // ── getMe ──────────────────────────────────────────────────────────────────

  describe('getMe()', () => {
    it('should return 404 when user not found in DB', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const req = { userId: 'u-deleted' } as AuthRequest;
      const res = buildRes();

      await getMe(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return fresh token and user data', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'alice@x.de',
        name: 'Alice',
        password: 'hashed',
        role: 'ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = { userId: 'u1' } as AuthRequest;
      const res = buildRes();

      await getMe(req, res as Response);

      expect(res.status).not.toHaveBeenCalled();
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data.token).toBeDefined();
      expect(jsonCall.data.user.id).toBe('u1');
      expect(jsonCall.data.user.role).toBe('admin'); // lowercase
      expect(jsonCall.data.user.password).toBeUndefined();
    });
  });
});
