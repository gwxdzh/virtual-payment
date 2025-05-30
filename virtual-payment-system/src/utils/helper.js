const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * 辅助工具类
 */
const helper = {
    /**
     * 生成商户ID
     * @returns {string} 商户ID
     */
    generateMerchantId() {
        // 使用UUID生成商户ID
        return 'M' + uuidv4().replace(/-/g, '').substring(0, 31);
    },

    /**
     * 生成订单ID
     * @returns {string} 订单ID
     */
    generateOrderId() {
        // 时间戳 + UUID
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
        const randomPart = uuidv4().replace(/-/g, '').substring(0, 18);
        return `${timestamp}${randomPart}`;
    },

    /**
     * 生成交易ID
     * @returns {string} 交易ID
     */
    generateTransactionId() {
        return 'T' + uuidv4().replace(/-/g, '');
    },

    /**
     * 生成账户ID
     * @returns {string} 账户ID
     */
    generateAccountId() {
        return 'A' + uuidv4().replace(/-/g, '');
    },

    /**
     * 生成随机字符串
     * @param {number} length - 字符串长度
     * @returns {string} 随机字符串
     */
    generateNonceStr(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = chars.length;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },

    /**
     * 生成密钥对
     * @returns {Object} 包含私钥和公钥的对象
     */
    generateKeyPair() {
        // 生成RSA密钥对
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return { privateKey, publicKey };
    },

    /**
     * 计算签名
     * @param {Object} params - 需要签名的参数
     * @param {string} secretKey - 密钥
     * @returns {string} 签名值
     */
    generateSign(params, secretKey) {
        // 按照ASCII码升序排列参数名
        const sortedKeys = Object.keys(params).sort();
        // 过滤sign参数
        const filteredKeys = sortedKeys.filter(key => key !== 'sign');
        // 拼接参数字符串
        const signString = filteredKeys.map(key => `${key}=${params[key]}`).join('&');

        // 计算HMAC-SHA256签名
        const hmac = crypto.createHmac('sha256', secretKey);
        return hmac.update(signString).digest('hex').toUpperCase();
    },

    /**
     * 验证签名
     * @param {Object} params - 完整参数，包含sign
     * @param {string} secretKey - 密钥
     * @returns {boolean} 是否验证通过
     */
    verifySign(params, secretKey) {
        const sign = params.sign;
        if (!sign) return false;

        // 创建新对象，避免修改原始对象
        const newParams = { ...params };
        delete newParams.sign;

        const calculatedSign = this.generateSign(newParams, secretKey);
        return calculatedSign === sign;
    },

    /**
     * 格式化日期时间
     * @param {Date} date - 日期对象
     * @param {string} format - 格式化模板
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 生成标准响应
     * @param {string} code - 响应码
     * @param {Object} data - 响应数据
     * @param {string} zhMessage - 中文消息
     * @param {string} enMessage - 英文消息
     * @param {string} requestId - 请求ID
     * @returns {Object} 标准响应对象
     */
    formatResponse(code = 'PAYMENT.SUCCESS', data = {}, zhMessage = '操作成功', enMessage = 'Operation succeeded', requestId = uuidv4()) {
        return {
            code,
            localized_msg: {
                zh_CN: zhMessage,
                en_US: enMessage
            },
            data,
            debug_id: requestId,
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = helper; 