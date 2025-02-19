import express from 'express';
import { validateCaptcha, generateCaptcha } from '../middleware/captchaMiddleware';
import { register, login } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware';
import cors from 'cors';

/**
 * 认证相关路由
 */
const router = express.Router();

/**
 * 生成验证码路由
 * GET /auth/captcha
 * @returns SVG 验证码
*/
router.get('/captcha', cors(), generateCaptcha);

/**
 * 用户注册路由
 * POST /auth/register
 * @body username - 用户名
 * @body password - 密码
 * @body fullName - 用户全名（可选）
 * @body bio - 用户简介（可选）
 * @body avatar - 用户头像URL（可选）
 */
router.post('/register', validateCaptcha, validateRegister, register);

/**
 * 用户登录路由
 * POST /auth/login
 * @body username - 用户名
 * @body password - 密码
 */
router.post('/login', validateCaptcha, validateLogin, login);

export default router;