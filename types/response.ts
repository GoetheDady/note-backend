/**
 * 统一的API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;      // 请求是否成功
  data?: T;             // 响应数据
  message?: string;     // 提示信息
  error?: {
    code?: string;      // 错误代码
    details?: any;      // 错误详情
  };
}

/**
 * 创建成功响应
 */
export const createSuccessResponse = <T>(
  data?: T,
  message?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message
});

/**
 * 创建错误响应
 */
export const createErrorResponse = (
  message: string,
  code?: string,
  details?: any
): ApiResponse => ({
  success: false,
  message,
  error: {
    code,
    details
  }
});