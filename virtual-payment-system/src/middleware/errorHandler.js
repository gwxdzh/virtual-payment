const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * 错误处理中间件
 * 捕获并统一处理应用程序中的错误
 */
const errorHandler = async (ctx, next) => {
  try {
    // 为每个请求生成唯一标识符
    ctx.request.id = uuidv4();
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    
    // 区分开发环境和生产环境的错误信息
    const isDev = process.env.NODE_ENV === 'development';
    
    // 生成标准响应格式
    ctx.body = {
      code: err.code || 'SYSTEM.ERROR',
      localized_msg: {
        zh_CN: err.message || '系统内部错误',
        en_US: err.enMessage || 'Internal server error'
      },
      debug_id: ctx.request.id,
      timestamp: new Date().toISOString()
    };
    
    // 开发环境下，返回详细错误堆栈
    if (isDev) {
      ctx.body.stack = err.stack;
      ctx.body.error_details = err.details || {};
    }
    
    // 记录错误日志 - 使用自定义logger代替console.error
    logger.requestError(ctx, err);
  }
};

module.exports = errorHandler;