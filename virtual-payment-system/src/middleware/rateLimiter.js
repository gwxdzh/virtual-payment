const redis = require('../utils/redis');

/**
 * 速率限制中间件
 * 限制每个商户每分钟的请求次数
 * @param {number} maxRequests - 每分钟最大请求数
 */
const rateLimiter = (maxRequests = 200) => {
    return async (ctx, next) => {
        // 获取商户ID，优先从验证中间件中获取，否则从请求体中获取
        const merchantId = (ctx.merchant && ctx.merchant.merchant_id) || ctx.request.body.app_id;

        if (!merchantId) {
            // 如果没有商户ID，不进行限流，继续执行
            return await next();
        }

        // 以IP + 商户ID作为限流键，防止单个IP针对特定商户的攻击
        const ip = ctx.request.ip;
        const rateKey = `rate:${merchantId}:${ip}`;

        // 获取当前请求计数
        let currentCount = await redis.get(rateKey);
        currentCount = currentCount ? parseInt(currentCount) : 0;

        if (currentCount >= maxRequests) {
            // 超出限制，返回429状态码
            ctx.status = 429;
            ctx.body = {
                code: 'PAYMENT.RATE_LIMIT_EXCEEDED',
                localized_msg: {
                    zh_CN: '请求频率超出限制',
                    en_US: 'Rate limit exceeded'
                },
                debug_id: ctx.request.id,
                timestamp: new Date().toISOString()
            };
            return;
        }

        // 增加计数并设置过期时间（一分钟）
        await redis.incr(rateKey);
        await redis.expire(rateKey, 60);

        // 继续处理请求
        await next();
    };
};

module.exports = rateLimiter; 