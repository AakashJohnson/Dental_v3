import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncH(async (req, res) => {
    const { username, password } = req.body ?? {};
    const { token, user } = await authService.login(username, password);
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, collegeId: user.collegeId, username: user.username },
    });
  }),
);

authRouter.post(
  '/register',
  asyncH(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  }),
);

authRouter.get('/me', authenticate, (req, res) => {
  const u = req.user!;
  res.json({ id: u.id, name: u.name, role: u.role, collegeId: u.collegeId, username: u.username });
});
