import express from 'express';
import {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 对所有笔记相关接口启用 JWT 认证中间件
router.use(authMiddleware);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/:id', getNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;