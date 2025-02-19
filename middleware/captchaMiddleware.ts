import { Request, Response, NextFunction } from 'express';
import svgCaptcha from 'svg-captcha';
import { ValidationError } from '../utils/errors';

declare module 'express-session' {
  interface SessionData {
    captcha: string;
  }
}

/**
 * 验证验证码中间件
 * @param req 
 * @param res 
 */
export const generateCaptcha = (req: Request, res: Response) => {
  const captcha = svgCaptcha.createMathExpr({
    mathMin: 1,
    mathMax: 10,
    noise: 2,
  });
  req.session!.captcha = captcha.text;

  req.session!.save((err) => {
    if (err) {
      console.error('Session 保存错误:', err);
      return res.status(500).json({  message: 'Session 保存失败' });
    }
  })
  
  console.log('生成的验证码:', captcha.text);
  console.log('保存后的 session:', req.session);

  res.type('svg');
  res.status(200).send(captcha.data);
}

export const validateCaptcha = (req: Request, res: Response, next: NextFunction) => {
  const { captcha } = req.body;
  const sessionCaptcha = req.session?.captcha;

  console.log('Session 内容:', req.session);
  console.log('提交的验证码:', captcha);
  console.log('Session中的验证码:', sessionCaptcha);

  if (!req.session) {
    return next(new ValidationError('Session未初始化'));
  }

  if (!sessionCaptcha) {
    return next(new ValidationError('验证码已过期'));
  }

  if (!captcha) {
    return next(new ValidationError('请输入验证码'));
  }

  if (captcha.toLowerCase() !== sessionCaptcha.toLowerCase()) {
    return next(new ValidationError('验证码错误'));
  }

  delete req.session.captcha;
  next();
}

