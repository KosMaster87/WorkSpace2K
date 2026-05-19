import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';

function signToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env['JWT_SECRET'] as string,
    { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' } as jwt.SignOptions,
  );
}

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
