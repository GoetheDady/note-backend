import { Request, Response } from 'express';
import UserAuth from '../models/UserAuth';
import UserProfile from '../models/UserProfile';
import { AuthRequest } from '../middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '../types/response';

/**
 * 获取当前登录用户的资料信息
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 查找当前登录用户的账号记录，并通过 populate 获取关联的 profile 信息
    const user = await UserAuth.findById(req.user?.id).populate('profile');
    if (!user) {
      res.status(404).json(createErrorResponse('用户不存在'));
      return;
    }
    res.json(createSuccessResponse({ profile: user.profile }));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};

/**
 * 更新当前登录用户的资料信息
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, bio, avatar } = req.body;
    // 查找当前用户账号
    const user = await UserAuth.findById(req.user?.id);
    if (!user) {
      res.status(404).json(createErrorResponse('用户不存在'));
      return;
    }
    // 使用关联的 profile 的 _id 更新用户资料
    const updatedProfile = await UserProfile.findByIdAndUpdate(
      user.profile,
      { fullName, bio, avatar },
      { new: true } // 返回更新后的文档
    );
    res.json(createSuccessResponse({ profile: updatedProfile }));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};