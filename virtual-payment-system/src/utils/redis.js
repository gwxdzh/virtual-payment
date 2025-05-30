const { createClient } = require('redis');
require('dotenv').config();

// 创建Redis客户端
const redisClient = createClient({
    url: `redis://${process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

// 连接事件处理
redisClient.on('connect', () => {
    console.log('Redis连接成功');
});

redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err);
});

// 确保连接
const connect = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

connect().catch(console.error);

// 包装方法便于使用
const redis = {
    /**
     * 获取缓存值
     * @param {string} key - 键
     * @returns {Promise<string|null>} - 缓存值
     */
    async get(key) {
        return await redisClient.get(key);
    },

    /**
     * 设置缓存值
     * @param {string} key - 键
     * @param {string} value - 值
     * @param {string} [flag] - 额外指令，如 EX, PX, NX, XX
     * @param {number} [ttl] - 过期时间（秒）
     * @returns {Promise<string>} - 结果
     */
    async set(key, value, flag, ttl) {
        if (flag && ttl) {
            return await redisClient.set(key, value, { [flag]: ttl });
        }
        return await redisClient.set(key, value);
    },

    /**
     * 删除缓存
     * @param {string} key - 键
     * @returns {Promise<number>} - 删除的键数量
     */
    async del(key) {
        return await redisClient.del(key);
    },

    /**
     * 设置过期时间
     * @param {string} key - 键
     * @param {number} seconds - 过期秒数
     * @returns {Promise<boolean>} - 是否设置成功
     */
    async expire(key, seconds) {
        return await redisClient.expire(key, seconds);
    },

    /**
     * 原子递增
     * @param {string} key - 键
     * @param {number} [increment=1] - 递增值
     * @returns {Promise<number>} - 递增后的值
     */
    async incr(key, increment = 1) {
        if (increment === 1) {
            return await redisClient.incr(key);
        }
        return await redisClient.incrBy(key, increment);
    },

    /**
     * 关闭连接
     */
    async close() {
        await redisClient.quit();
    }
};

module.exports = redis; 