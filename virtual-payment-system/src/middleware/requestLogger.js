const logger = require('../utils/logger');

/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息，包括请求处理时间
 */
const requestLogger = async (ctx, next) => {
    const start = Date.now();

    // 生成更多请求上下文信息
    const requestInfo = {
        ip: ctx.request.ip,
        method: ctx.request.method,
        url: ctx.request.url,
        query: ctx.request.query,
        userAgent: ctx.request.headers['user-agent'],
        referer: ctx.request.headers['referer'] || '',
        requestId: ctx.request.id // 假设errorHandler中间件已经生成
    };

    // 在开发环境下，记录请求体(如有)
    if (process.env.NODE_ENV === 'development' && ctx.request.body) {
        requestInfo.body = ctx.request.body;
    }

    // 记录请求开始
    logger.debug('请求开始处理', { tag: 'REQUEST', meta: requestInfo });

    // 处理请求
    await next();

    // 计算请求处理时间
    const ms = Date.now() - start;

    // 记录请求信息和响应状态
    logger.request(ctx, ms);
};

module.exports = requestLogger; 