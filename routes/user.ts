import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 对所有用户资料接口启用 JWT 认证中间件
router.use(authMiddleware);

// 获取当前用户资料
router.get('/profile', getProfile);

// 更新当前用户资料
router.put('/profile', updateProfile);

export default router;