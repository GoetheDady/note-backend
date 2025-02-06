import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    // 根据需要可以扩展其他属性
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: '没有提供 token，拒绝访问' });
  }
  try {
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!);
    // 假设 payload 格式为 { user: { id: string } }
    req.user = (decoded as any).user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'token 无效' });
  }
};