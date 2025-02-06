// index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import noteRoutes from './routes/note';
import userRoutes from './routes/user'; // 引入用户路由

// 加载环境变量
dotenv.config();

// 验证必要的环境变量
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI 环境变量未设置');
}

const app: Express = express();

// 日志记录
// app.use(morgan('dev'));

// 安全相关中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// 使用 body-parser 中间件解析 JSON 请求体
app.use(bodyParser.json());

// 测试根路由
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Notebook App!');
});

// 挂载各个模块的路由
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/user', userRoutes); // 用户资料相关接口

// 连接 MongoDB 数据库（无需传递 useNewUrlParser、useUnifiedTopology）
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB 连接成功'))
  .catch((err) => {
    console.error('MongoDB 连接错误：', err);
    process.exit(1); // 数据库连接失败时退出程序
  });

// 全局错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 处理 404 路由
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

const PORT: number = Number(process.env.PORT) || 5050;
app.listen(PORT, () => console.log(`服务运行在端口 ${PORT}`));