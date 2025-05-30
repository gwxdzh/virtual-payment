const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { format } = winston;

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.printf(info => {
        // 基本日志格式
        let logMessage = `${info.timestamp} [${info.level.toUpperCase()}]`;

        // 添加标签（如果有）
        if (info.tag) {
            logMessage += ` [${info.tag}]`;
        }

        // 添加消息
        logMessage += `: ${info.message}`;

        // 如果有额外信息，如错误堆栈、请求ID等，添加到日志
        if (info.meta) {
            if (typeof info.meta === 'object') {
                logMessage += `\n${JSON.stringify(info.meta, null, 2)}`;
            } else {
                logMessage += `\n${info.meta}`;
            }
        }

        return logMessage;
    })
);

// 创建按日期分割的日志传输器
const createDailyRotateTransport = (level, filename) => {
    return new winston.transports.DailyRotateFile({
        filename: path.join(logDir, `${filename}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level,
        maxSize: '20m',
        maxFiles: '14d', // 保留14天的日志文件
        format: logFormat,
        zippedArchive: true, // 压缩归档日志文件
    });
};

// 创建一个日志实例
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // 信息级别日志
        createDailyRotateTransport('info', 'info'),

        // 错误级别日志
        createDailyRotateTransport('error', 'error'),

        // 所有日志级别
        createDailyRotateTransport('debug', 'combined'),
    ],
    // 捕获并记录未捕获的异常和拒绝的Promise
    exceptionHandlers: [
        createDailyRotateTransport('error', 'exceptions')
    ],
    rejectionHandlers: [
        createDailyRotateTransport('error', 'rejections')
    ],
    exitOnError: false // 发生异常时不退出程序
});

// 在开发环境中，同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: format.combine(
            format.colorize(),
            logFormat
        ),
    }));
}

/**
 * 日志工具模块
 * 提供统一的日志记录接口，支持不同业务场景的日志记录
 */
const log = {
    /**
     * 记录信息级别日志
     * @param {string} message - 日志消息
     * @param {Object|null} meta - 额外元数据
     */
    info: (message, meta = null) => {
        logger.info(message, { meta });
    },

    /**
     * 记录错误级别日志
     * @param {string} message - 错误消息
     * @param {Object|null} meta - 额外元数据
     */
    error: (message, meta = null) => {
        logger.error(message, { meta });
    },

    /**
     * 记录警告级别日志
     * @param {string} message - 警告消息
     * @param {Object|null} meta - 额外元数据
     */
    warn: (message, meta = null) => {
        logger.warn(message, { meta });
    },

    /**
     * 记录调试级别日志
     * @param {string} message - 调试消息
     * @param {Object|null} meta - 额外元数据
     */
    debug: (message, meta = null) => {
        logger.debug(message, { meta });
    },

    /**
     * 为请求处理异常定制的方法
     * @param {Object} ctx - Koa上下文对象
     * @param {Error} error - 错误对象
     */
    requestError: (ctx, error) => {
        logger.error('请求处理异常', {
            tag: 'REQUEST',
            meta: {
                url: ctx.request.url,
                method: ctx.request.method,
                requestId: ctx.request.id,
                ip: ctx.request.ip,
                userAgent: ctx.request.headers['user-agent'],
                error: {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                },
                timestamp: new Date().toISOString()
            }
        });
    },

    /**
     * 记录HTTP请求信息
     * @param {Object} ctx - Koa上下文对象
     * @param {number} time - 请求处理时间(毫秒)
     */
    request: (ctx, time) => {
        logger.info(`${ctx.method} ${ctx.url} - ${ctx.status} - ${time}ms`, {
            tag: 'REQUEST',
            meta: {
                requestId: ctx.request.id,
                ip: ctx.request.ip,
                method: ctx.method,
                url: ctx.url,
                status: ctx.status,
                responseTime: time,
                userAgent: ctx.request.headers['user-agent'],
            }
        });
    },

    /**
     * 系统启动日志
     * @param {string} message - 启动消息
     * @param {Object|null} meta - 额外元数据
     */
    startup: (message, meta = null) => {
        logger.info(message, { tag: 'STARTUP', meta });
    },

    /**
     * 系统关闭日志
     * @param {string} message - 关闭消息
     * @param {Object|null} meta - 额外元数据
     */
    shutdown: (message, meta = null) => {
        logger.info(message, { tag: 'SHUTDOWN', meta });
    },

    /**
     * 数据库相关日志
     * @param {string} message - 数据库操作消息
     * @param {Object|null} meta - 额外元数据
     */
    database: (message, meta = null) => {
        logger.info(message, { tag: 'DATABASE', meta });
    },

    /**
     * 支付相关日志
     * @param {string} message - 支付操作消息
     * @param {Object|null} meta - 额外元数据
     */
    payment: (message, meta = null) => {
        logger.info(message, { tag: 'PAYMENT', meta });
    },

    /**
     * 安全相关日志
     * @param {string} message - 安全事件消息
     * @param {Object|null} meta - 额外元数据
     */
    security: (message, meta = null) => {
        logger.warn(message, { tag: 'SECURITY', meta });
    },

    /**
     * 性能相关日志
     * @param {string} message - 性能事件消息
     * @param {Object|null} meta - 额外元数据
     */
    performance: (message, meta = null) => {
        logger.info(message, { tag: 'PERFORMANCE', meta });
    },

    /**
     * 第三方API调用日志
     * @param {string} message - API调用消息
     * @param {Object|null} meta - 额外元数据
     */
    api: (message, meta = null) => {
        logger.info(message, { tag: 'API', meta });
    }
};

module.exports = log;