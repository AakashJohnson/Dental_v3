import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../store/db.js';
import { env } from '../config/env.js';
import { Role } from '../domain/enums.js';
import { User } from '../types/index.js';
import { id, nowIso } from '../utils/id.js';

export interface TokenPayload {
  sub: string;
  role: Role;
  collegeId?: string;
}

export const authService = {
  async register(input: {
    username: string;
    password: string;
    name: string;
    email: string;
    role: Role;
    collegeId?: string;
  }): Promise<User> {
    if (db.users.findOne((u) => u.username === input.username)) {
      throw Object.assign(new Error('Username already exists'), { status: 409 });
    }
    const user: User = {
      id: id('usr'),
      username: input.username,
      passwordHash: await bcrypt.hash(input.password, 10),
      name: input.name,
      email: input.email,
      role: input.role,
      collegeId: input.collegeId,
      createdAt: nowIso(),
    };
    return db.users.insert(user);
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const user = db.users.findOne((u) => u.username === username);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    return { token: this.sign(user), user };
  },

  sign(user: User): string {
    const payload: TokenPayload = { sub: user.id, role: user.role, collegeId: user.collegeId };
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  },

  verify(token: string): TokenPayload {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  },
};
