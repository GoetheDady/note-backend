import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import noteRoutes from './routes/note';
import userRoutes from './routes/user';

// 加载环境变量
dotenv.config();

// 验证必要的环境变量
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} 环境变量未设置`);
  }
});

const app: Express = express();

// 日志记录 - 生产环境使用 combined 格式，开发环境使用 dev 格式
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined'));
}

// 安全相关中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 使用 body-parser 中间件解析 JSON 请求体
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查接口
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 测试根路由
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Notebook App!');
});

// 挂载各个模块的路由
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/user', userRoutes);

// MongoDB 连接配置
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// 连接 MongoDB 数据库
mongoose
  .connect(process.env.MONGO_URI!, mongooseOptions)
  .then(() => console.log('MongoDB 连接成功'))
  .catch((err) => {
    console.error('MongoDB 连接错误：', err);
    process.exit(1);
  });

// 优化的错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    path: req.path
  });
});

// 处理 404 路由
app.use((req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.path
  });
});

// 优雅关闭应用程序
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭应用...');
  mongoose.connection.close().then(() => {
    console.log('MongoDB 连接已关闭');
    process.exit(0);
  });
});

const PORT: number = Number(process.env.PORT) || 5050;
app.listen(PORT, () => {
  console.log(`服务运行在端口 ${PORT}，环境：${process.env.NODE_ENV || 'development'}`);
});