import { Request, Response, NextFunction } from 'express';
import UserAuth from '../models/UserAuth';
import UserProfile from '../models/UserProfile';
import jwt from 'jsonwebtoken';
import { ApiResponse, createSuccessResponse } from '../types/response';
import { createErrorResponse } from '../types/response';

/**
 * 创建JWT令牌
 * @param userId - 用户ID
 * @returns 生成的JWT令牌
 */
const createToken = (userId: string): string => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' } // 令牌有效期7天
  );
};

/**
 * 用户注册控制器
 * @param req - Express请求对象，包含注册信息(username, password, fullName, bio, avatar)
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 * @returns Promise<void>
 */
export const register = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, fullName, bio, avatar } = req.body;
    // 检查用户是否已存在
    const existingUser = await UserAuth.findOne({ username });
    if (existingUser) {
      res.status(400).json(createErrorResponse('用户已存在'));
      return;
    }

    // 创建用户资料
    const profile = await new UserProfile({
      fullName: fullName || username, // 如果未提供全名，使用用户名
      bio,
      avatar,
    }).save();

    // 创建用户认证信息
    const user = await new UserAuth({
      username,
      password,
      profile: profile._id,
    }).save();

    // 生成JWT令牌
    const token = createToken(user._id as string);

    res.json(createSuccessResponse({ token }, '注册成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 用户登录控制器
 * @param req - Express请求对象，包含登录凭证(username, password)
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 * @returns Promise<void>
 */
export const login = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // 查找用户并验证密码
    const user = await UserAuth.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      res.status(400).json(createErrorResponse('用户名或密码错误'));
      return;
    }

    // 生成新的JWT令牌
    const token = createToken(user._id as string);

    res.json(createSuccessResponse({ token }, '登录成功'));
  } catch (err) {
    next(err);
  }
};
