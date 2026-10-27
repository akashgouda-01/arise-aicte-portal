import { Router, Request, Response } from 'express';
import { mockUsers } from '../data/mockData';
import { User, UserRole } from '../models/types';

export const authRouter = Router();

// GET all demo users for role switching in simulation environment
authRouter.get('/users', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: mockUsers.length,
    data: mockUsers,
  });
});

// GET user by role or ID
authRouter.get('/user-by-role/:role', (req: Request, res: Response) => {
  const role = req.params.role as UserRole;
  const user = mockUsers.find((u: User) => u.role === role) || mockUsers[0];
  res.json({
    success: true,
    data: user,
  });
});
