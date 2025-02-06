import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Note from '../models/Note';
import { createSuccessResponse, createErrorResponse } from '../types/response';

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const note = new Note({
      title,
      content,
      user: req.user!.id,
    });
    await note.save();
    res.json(createSuccessResponse(note));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};

/**
 * 获取当前用户的笔记列表，支持分页功能
 * 请求参数（query）：
 *   - page：当前页码，默认为 1
 *   - limit：每页显示的记录数，默认为 10
 */
export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 从 query 中获取分页参数，并设置默认值
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    // 查询当前用户的笔记（按创建时间倒序排列），并应用分页
    const notes = await Note.find({ user: req.user!.id })
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(limit);

    // 获取该用户总的笔记数量，用于计算总页数
    const totalNotes = await Note.countDocuments({ user: req.user!.id });

    res.json(createSuccessResponse({
      notes,
      pagination: {
        page,                      // 当前页码
        limit,                     // 每页记录数
        totalNotes,                // 总记录数
        totalPages: Math.ceil(totalNotes / limit) // 总页数
      }
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};

export const getNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user!.id });
    if (!note) {
      res.status(404).json(createErrorResponse('笔记不存在'));
    }
    res.json(createSuccessResponse(note));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOne({ _id: req.params.id, user: req.user!.id });
    if (!note) {
      res.status(404).json(createErrorResponse('笔记不存在'));
    } else {
      note.title = title || note.title;
      note.content = content || note.content;
      await note.save();
      res.json(createSuccessResponse(note));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
    if (!note) {
      res.status(404).json(createErrorResponse('笔记不存在'));
    }
    res.json(createSuccessResponse(null, '删除成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse('服务器错误'));
  }
};