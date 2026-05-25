/**
 * @fileoverview Users Controller Tests
 * @description Prüft listUsers, createUser, updateUserRole, deleteUser.
 *   Prisma wird gemockt — kein echter Datenbankzugriff.
 */

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { listUsers, createUser, updateUserRole, deleteUser } from '../controllers/users.controller';
import { AuthRequest } from '../middleware/auth.middleware';

jest.mock('../services/prisma.service', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { prisma } from '../services/prisma.service';

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

function buildReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    params: {},
    body: {},
    userId: 'admin-id',
    userRole: 'ADMIN',
    ...overrides,
  } as unknown as AuthRequest;
}

function buildRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

const dbUser = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@x.de',
  password: 'hashed',
  role: 'USER' as const,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const dbAdmin = {
  id: 'u2',
  name: 'Bob',
  email: 'bob@x.de',
  password: 'hashed',
  role: 'ADMIN' as const,
  createdAt: new Date('2026-01-02'),
  updatedAt: new Date('2026-01-02'),
};

describe('Users Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── listUsers ──────────────────────────────────────────────────────────────

  describe('listUsers()', () => {
    it('should return all users with lowercase role', async () => {
      mockPrismaUser.findMany.mockResolvedValue([dbUser, dbAdmin]);
      const req = buildReq();
      const res = buildRes();

      await listUsers(req, res as Response);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data).toHaveLength(2);
      expect(jsonCall.data[0].role).toBe('user');
      expect(jsonCall.data[1].role).toBe('admin');
    });

    it('should not include password in response', async () => {
      mockPrismaUser.findMany.mockResolvedValue([dbUser]);
      const req = buildReq();
      const res = buildRes();

      await listUsers(req, res as Response);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data[0].password).toBeUndefined();
    });
  });

  // ── createUser ─────────────────────────────────────────────────────────────

  describe('createUser()', () => {
    it('should return 400 when name, email or password missing', async () => {
      const req = buildReq({ body: { email: 'x@x.de' } });
      const res = buildRes();

      await createUser(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid role', async () => {
      const req = buildReq({
        body: { name: 'Eve', email: 'eve@x.de', password: 'pw', role: 'SUPERADMIN' },
      });
      const res = buildRes();

      await createUser(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 when email already taken', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(dbUser);
      const req = buildReq({
        body: { name: 'Alice', email: 'alice@x.de', password: 'pw' },
      });
      const res = buildRes();

      await createUser(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should create user with hashed password and return 201', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue(dbUser);

      const req = buildReq({
        body: { name: 'Alice', email: 'alice@x.de', password: 'plaintext' },
      });
      const res = buildRes();

      await createUser(req, res as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 12);
      expect(res.status).toHaveBeenCalledWith(201);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data.email).toBe('alice@x.de');
    });

    it('should default role to USER when not provided', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue(dbUser);

      const req = buildReq({
        body: { name: 'Alice', email: 'alice@x.de', password: 'pw' },
      });
      const res = buildRes();

      await createUser(req, res as Response);

      expect(mockPrismaUser.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'USER' }) }),
      );
    });
  });

  // ── updateUserRole ─────────────────────────────────────────────────────────

  describe('updateUserRole()', () => {
    it('should return 400 for invalid role', async () => {
      const req = buildReq({ params: { id: 'u1' }, body: { role: 'GOD' } });
      const res = buildRes();

      await updateUserRole(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const req = buildReq({ params: { id: 'nonexistent' }, body: { role: 'ADMIN' } });
      const res = buildRes();

      await updateUserRole(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update role and return user with lowercase role', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(dbUser);
      mockPrismaUser.update.mockResolvedValue({ ...dbUser, role: 'ADMIN' as const });

      const req = buildReq({ params: { id: 'u1' }, body: { role: 'ADMIN' } });
      const res = buildRes();

      await updateUserRole(req, res as Response);

      expect(res.status).not.toHaveBeenCalled();
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data.role).toBe('admin');
    });
  });

  // ── deleteUser ─────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('should return 403 when admin tries to delete own account', async () => {
      const req = buildReq({ params: { id: 'admin-id' }, userId: 'admin-id' });
      const res = buildRes();

      await deleteUser(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 when user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const req = buildReq({ params: { id: 'ghost' }, userId: 'admin-id' });
      const res = buildRes();

      await deleteUser(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete user and return 204', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(dbUser);
      mockPrismaUser.delete.mockResolvedValue(dbUser);

      const req = buildReq({ params: { id: 'u1' }, userId: 'admin-id' });
      const res = buildRes();

      await deleteUser(req, res as Response);

      expect(mockPrismaUser.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
