import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * 验证用户名格式的工具函数
 * @param username - 待验证的用户名
 * @returns 处理后的用户名
 * @throws ValidationError 当用户名格式不符合要求时抛出
 */
const validateUsername = (username: string | undefined): string => {
  const trimmedUsername = username?.trim();
  if (!trimmedUsername || trimmedUsername.length < 3) {
    throw new ValidationError('用户名至少需要3个字符');
  }
  
  if (trimmedUsername.includes(' ')) {
    throw new ValidationError('用户名不能包含空格');
  }
  
  return trimmedUsername;
};

/**
 * 验证密码强度的工具函数
 * @param password - 待验证的密码
 * @throws ValidationError 当密码强度不符合要求时抛出
 */
const validatePassword = (password: string | undefined): void => {
  if (!password || password.length < 8) {
    throw new ValidationError('密码至少需要8个字符');
  }

  // 验证密码复杂度：至少包含一个小写字母、一个大写字母和一个数字
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  if (!passwordRegex.test(password)) {
    throw new ValidationError('密码必须包含大小写字母和数字');
  }
};

/**
 * 验证用户注册信息的中间件
 * @param req - Express请求对象，包含注册信息
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 * @throws ValidationError 当验证失败时抛出
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { username: rawUsername, password } = req.body;
  // 验证并处理用户名
  const username = validateUsername(rawUsername);
  req.body.username = username;
  
  // 验证密码
  validatePassword(password);
  
  next();
};

/**
 * 验证用户登录信息的中间件
 * @param req - Express请求对象，包含登录凭证
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 * @throws ValidationError 当验证失败时抛出
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    throw new ValidationError('用户名和密码都是必填项');
  }
  
  next();
};