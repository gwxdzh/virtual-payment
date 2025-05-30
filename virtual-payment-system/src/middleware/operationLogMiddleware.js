const logService = require('../services/logService');
const logger = require('../utils/logger');

/**
 * 操作日志中间件
 * 用于记录用户的操作行为
 * 
 * @param {Object} options 选项
 * @param {string} options.module 模块名
 * @param {string} options.operationType 操作类型
 * @param {string} options.description 操作描述
 * @param {Function} options.getContent 获取请求内容的函数，可选
 */
const operationLogMiddleware = (options) => {
    return async (ctx, next) => {
        // 获取请求开始时间
        const startTime = Date.now();

        // 保存原始请求体
        const requestBody = ctx.request.body;

        // 记录请求参数
        let requestParam = {};

        if (ctx.method === 'GET') {
            requestParam = ctx.query;
        } else {
            requestParam = ctx.request.body;
        }

        // 捕获响应内容
        let responseBody = {};
        let error = null;

        try {
            // 继续处理请求
            await next();

            // 获取响应体
            responseBody = ctx.body || {};
        } catch (err) {
            // 记录错误信息
            error = err;
            throw err; // 重新抛出错误，让errorHandler中间件处理
        } finally {
            // 请求结束，计算耗时
            const endTime = Date.now();
            const timeUsed = endTime - startTime;

            try {
                // 从上下文中获取用户信息
                const user = ctx.state.user || {};

                // 构建日志对象
                const logData = {
                    operator_id: user.id || null,
                    operator_name: user.username || '未知用户',
                    operation_type: options.operationType,
                    module: options.module,
                    description: typeof options.description === 'function'
                        ? options.description(ctx)
                        : options.description,
                    request_param: JSON.stringify(requestParam),
                    response_data: JSON.stringify(responseBody),
                    ip: ctx.request.ip,
                    status: error ? 0 : 1, // 0-失败，1-成功
                    error_msg: error ? error.message : null
                };

                // 异步记录日志，不影响主流程
                logService.createOperationLog(logData).catch(err => {
                    logger.error('记录操作日志失败', { error: err.message, logData });
                });

                // 恢复请求体，防止被修改
                ctx.request.body = requestBody;
            } catch (logError) {
                // 记录操作日志过程中的错误
                logger.error('操作日志中间件异常', { error: logError.message });
            }
        }
    };
};

module.exports = operationLogMiddleware; 