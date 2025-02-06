import { Request, Response, NextFunction } from 'express';
import UserAuth from '../models/UserAuth';
import UserProfile from '../models/UserProfile';
import jwt from 'jsonwebtoken';
import { ValidationError } from '../utils/errors';

interface AuthResponse {
  success: boolean;
  data?: any;
  message?: string;
}

const createToken = (userId: string): string => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

const validateRegistration = (data: any) => {
  const { username, password } = data;
  if (!username || !password) {
    throw new ValidationError('用户名和密码为必填项');
  }
  if (password.length < 6) {
    throw new ValidationError('密码长度至少为6位');
  }
};

/**
 * 用户注册控制器
 * @param req - Express请求对象，包含注册信息(username, email, password, fullName, bio, avatar)
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 * @returns Promise<void>
 */
export const register = async (
  req: Request,
  res: Response<AuthResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, fullName, bio, avatar } = req.body;
    
    validateRegistration(req.body);

    const existingUser = await UserAuth.findOne({ username });
    if (existingUser) {
      throw new ValidationError('用户已存在');
    }

    const profile = await new UserProfile({
      fullName: fullName || username,
      bio,
      avatar,
    }).save();

    const user = await new UserAuth({
      username,
      password,
      profile: profile._id,
    }).save();

    const token = createToken(user._id as string);

    res.json({
      success: true,
      data: { token },
      message: '注册成功'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 用户登录控制器
 * @param req - Express请求对象，包含登录凭证(email, password)
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 * @returns Promise<void>
 */
export const login = async (
  req: Request,
  res: Response<AuthResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('用户名和密码为必填项');
    }

    const user = await UserAuth.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      throw new ValidationError('用户名或密码错误');
    }

    const token = createToken(user._id as string);

    res.json({
      success: true,
      data: { token },
      message: '登录成功'
    });
  } catch (err) {
    next(err);
  }
};