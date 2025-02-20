/**
 * @file index.ts
 * @description 应用程序入口文件，负责服务器配置、中间件加载和启动流程
 * 主要功能包括：
 * 1. 环境变量配置
 * 2. Express应用初始化
 * 3. 中间件配置（安全、日志、跨域等）
 * 4. 数据库连接
 * 5. 路由挂载
 * 6. 错误处理
 * 7. 服务器启动
 */

// 核心依赖导入
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// 路由模块导入
import authRoutes from './routes/auth';
import noteRoutes from './routes/note';
import userRoutes from './routes/user';

// 类型导入
import { ApiResponse } from './types/response'

declare module 'express-session' {
  interface SessionData {
    captcha: string;
    user?: { id: string };
  }
}

/**
 * 环境变量配置
 * 根据当前环境（development/production）加载对应的.env文件
 */
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// 必需的环境变量检查
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) throw Error(`${envVar} must be defined`);
});

// 创建Express应用实例
const app: Express = express();

/** 
 * 中间件配置（按优先级顺序加载）
 * 1. helmet - 安全防护
 * 2. cors - 跨域资源共享
 * 3. morgan - 请求日志
 * 4. bodyParser - 请求体解析
 * 5. session - 会话管理
 */
app
  // 安全中间件配置
  .use(helmet()) 
  // 跨域配置
  .use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })) 
  // 日志中间件配置
  .use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')) 
  // 请求体解析配置
  .use(bodyParser.json({ limit: '10mb' })) 
  // Session配置
  .use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 10 // 10分钟过期
    }
  }));

/**
 * 服务器启动函数
 * 采用异步初始化流程：
 * 1. 数据库连接
 * 2. 路由挂载
 * 3. 错误处理
 * 4. 服务器监听
 */
const startServer = async () => {
  // 数据库连接配置
  const mongoURI = process.env.MONGO_URI!;

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 服务器选择超时
      socketTimeoutMS: 45000, // Socket连接超时
      family: 4 // 强制使用IPv4
    });
    console.log('[MongoDB] 连接成功');
  } catch (err) {
    console.error('[MongoDB] 致命错误:', err);
    process.exit(1); // 数据库连接失败时终止进程
  }

  /** 
   * API路由配置
   * 按模块划分路由，便于维护和扩展
   */
  app
    .use('/api/auth', authRoutes)
    .use('/api/notes', noteRoutes)
    .use('/api/user', userRoutes)
    
  /**
   * 健康检查接口
   * 用于监控服务状态，返回数据库连接状态和运行时间
   */
  app.get('/health', 
    (req: Request<{}, any, any>,
      res: Response<ApiResponse>
    ) => {
      res.status(200).json({
        success: true,
        data: {
          dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          uptime: process.uptime(),
          timestamp: Date.now()
        }
      });
    }
  );

  /**
   * 错误处理中间件
   * 1. 全局错误处理 - 捕获所有未处理的错误
   * 2. 404处理 - 处理所有未匹配的路由
   */
  // 数据库重连函数
  const reconnectDB = async () => {
    const mongoURI = process.env.MONGO_URI!;
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4
        });
        console.log('[MongoDB] 重连成功');
      }
    } catch (err) {
      console.error('[MongoDB] 重连失败:', err);
    }
  };

  app
    .use(async (err: Error, req: Request, res: Response, next: NextFunction) => {
      // 检查数据库连接状态，如果断开则尝试重连
      if (mongoose.connection.readyState === 0) {
        await reconnectDB();
      }

      console.error(`[${new Date().toISOString()}] ${err.stack}`);
      res.status(500).json({ 
        success: false,
        message: process.env.NODE_ENV === 'production' 
          ? '服务器错误' 
          : err.message 
      });
    }).use((
    req: express.Request,
    res: express.Response
  ) => {
    res.status(404).json({
      success: false,
      message: '路由不存在',
      path: req.path
    });
  });

  // 启动HTTP服务
  const PORT = Number(process.env.PORT) || 5050;
  const server = app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] 服务运行中 | 端口：${PORT} | 环境：${process.env.NODE_ENV}`);
  });

  /**
   * 优雅关闭服务
   * 确保在进程终止时正确关闭数据库连接和HTTP服务
   */
  process.on('SIGTERM', () => {
    console.log('正在关闭服务...');
    server.close(() => {
      mongoose.connection.close().then(() => {
        console.log('服务已安全停止');
        process.exit(0);
      });
    });
  });
  // 添加mongoose连接事件监听
  mongoose.connection.on('disconnected', async () => {
    console.log('[MongoDB] 连接断开，尝试重连...');
    await reconnectDB();
  });

  mongoose.connection.on('error', async (err) => {
    console.error('[MongoDB] 连接错误:', err);
    await reconnectDB();
  });

  /**
   * 优雅关闭服务
   * 确保在进程终止时正确关闭数据库连接和HTTP服务
   */
  process.on('SIGTERM', () => {
    console.log('正在关闭服务...');
    server.close(() => {
      mongoose.connection.close().then(() => {
        console.log('服务已安全停止');
        process.exit(0);
      });
    });
  });
};

// 启动服务器并处理启动错误
startServer().catch(err => {
  console.error('[启动失败]', err);
  process.exit(1);
});
