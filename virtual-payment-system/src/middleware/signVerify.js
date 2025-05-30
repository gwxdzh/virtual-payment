const crypto = require('crypto');
const { Merchant } = require('../models/modelIndex');
const redis = require('../utils/redis');

/**
 * 签名验证中间件
 * 验证请求签名是否有效
 */
const signVerify = async (ctx, next) => {
    const { app_id, timestamp, nonce_str, sign, sign_type = 'HMAC-SHA256' } = ctx.request.body;

    // 必填参数校验
    if (!app_id || !timestamp || !nonce_str || !sign) {
        ctx.status = 400;
        ctx.body = {
            code: 'PAYMENT.MISSING_PARAM',
            localized_msg: {
                zh_CN: '缺少必要参数',
                en_US: 'Missing required parameters'
            },
            debug_id: ctx.request.id,
            timestamp: new Date().toISOString()
        };
        return;
    }

    // 时间戳验证（5分钟有效期）
    const currentTime = new Date();
    const requestTime = new Date(
        timestamp.substring(0, 4),
        parseInt(timestamp.substring(4, 6)) - 1,
        timestamp.substring(6, 8),
        timestamp.substring(8, 10),
        timestamp.substring(10, 12),
        timestamp.substring(12, 14)
    );

    const timeDiff = Math.abs(currentTime - requestTime) / 1000;
    if (timeDiff > 300) { // 超过5分钟
        ctx.status = 400;
        ctx.body = {
            code: 'PAYMENT.EXPIRED_TIMESTAMP',
            localized_msg: {
                zh_CN: '请求已过期',
                en_US: 'Request expired'
            },
            debug_id: ctx.request.id,
            timestamp: new Date().toISOString()
        };
        return;
    }

    // 防重放攻击
    const nonceKey = `nonce:${app_id}:${nonce_str}`;
    const nonceExists = await redis.get(nonceKey);
    if (nonceExists) {
        ctx.status = 400;
        ctx.body = {
            code: 'PAYMENT.DUPLICATE_REQUEST',
            localized_msg: {
                zh_CN: '重复请求',
                en_US: 'Duplicate request'
            },
            debug_id: ctx.request.id,
            timestamp: new Date().toISOString()
        };
        return;
    }
    await redis.set(nonceKey, '1', 'EX', 300); // 设置5分钟过期

    // 查询商户信息
    const merchant = await Merchant.findOne({ where: { merchant_id: app_id } });
    if (!merchant) {
        ctx.status = 401;
        ctx.body = {
            code: 'PAYMENT.INVALID_MERCHANT',
            localized_msg: {
                zh_CN: '无效商户',
                en_US: 'Invalid merchant'
            },
            debug_id: ctx.request.id,
            timestamp: new Date().toISOString()
        };
        return;
    }

    // 验证签名
    const params = { ...ctx.request.body };
    delete params.sign; // 计算签名时排除sign参数

    // 按照ASCII码升序排列参数名
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

    // 根据签名类型选择算法
    let calculatedSign;
    if (sign_type === 'HMAC-SHA256') {
        calculatedSign = crypto
            .createHmac('sha256', merchant.private_key)
            .update(signString)
            .digest('hex')
            .toUpperCase();
    } else {
        ctx.status = 400;
        ctx.body = {
            code: 'PAYMENT.UNSUPPORTED_SIGN_TYPE',
            localized_msg: {
                zh_CN: '不支持的签名类型',
                en_US: 'Unsupported signature type'
            },
            debug_id: ctx.request.id,
            timestamp: new Date().toISOString()
        };
        return;
    }

    if (calculatedSign !== sign) {
        ctx.status = 401;
        ctx.body = {
            code: 'PAYMENT.INVALID_SIGN',
            localized_msg: {
                zh_CN: '签名验证失败',
                en_US: 'Invalid signature'
            },
            debug_id: ctx.request.id,
            timestamp: new Date().toISOString()
        };
        return;
    }

    // 验证通过，保存商户信息到上下文
    ctx.merchant = merchant;

    await next();
};

module.exports = signVerify; 