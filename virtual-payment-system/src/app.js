const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const helmet = require('koa-helmet');
const { errorHandler, requestLogger } = require('./middleware');
const registerRoutes = require('./routes');
const { sequelize } = require('./models/modelIndex');
const logger = require('./utils/logger');
require('dotenv').config();

// 创建Koa应用实例
const app = new Koa();

// 安全相关中间件
app.use(helmet());

// 配置CORS中间件
app.use(cors({
    origin: (ctx) => {
        // 允许的来源列表
        const allowedOrigins = [
            'http://localhost:8000',   // 本地开发前端
            'http://localhost:8081',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:8081',
            'http://localhost:3000'
        ];

        const requestOrigin = ctx.request.header.origin;

        // 如果是生产环境，可以设置特定的域名
        if (process.env.NODE_ENV === 'production') {
            const prodAllowedOrigins = [
                process.env.FRONTEND_URL, // 从环境变量获取前端URL
                'https://admin.example.com',
                'https://pay.example.com'
            ];

            if (prodAllowedOrigins.includes(requestOrigin)) {
                return requestOrigin;
            }
            return false; // 不允许其他来源
        }

        // 开发环境允许列表中的来源或所有来源
        if (allowedOrigins.includes(requestOrigin) || process.env.NODE_ENV === 'development') {
            return requestOrigin || '*';
        }

        return false;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 预检请求有效期，单位秒
    exposeHeaders: ['Content-Disposition'] // 允许前端访问的响应头
}));

// 错误处理中间件（必须放在最前面）
app.use(errorHandler);

// 请求日志中间件
app.use(requestLogger);

// 解析请求体
app.use(bodyParser({
    enableTypes: ['json', 'form'],
    jsonLimit: '5mb',
    formLimit: '5mb',
    textLimit: '5mb',
    onerror: (err, ctx) => {
        ctx.throw(422, '请求体解析失败');
    }
}));

// 注册路由
registerRoutes(app);

// 获取端口配置
const port = process.env.PORT || 3000;

// 测试数据库连接并启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        logger.database('数据库连接成功');

        // 同步数据库模型（开发环境可用，生产环境需谨慎）
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logger.database('数据库模型同步完成');
        }

        // 启动HTTP服务
        app.listen(port, () => {
            logger.startup(`服务器运行在 http://localhost:${port}`);
            logger.startup(`环境: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('应用启动失败:', error);
        process.exit(1);
    }
};

// 启动服务器
startServer();

// 处理进程退出
process.on('SIGINT', async () => {
    try {
        await sequelize.close();
        logger.shutdown('数据库连接已关闭');
        process.exit(0);
    } catch (error) {
        logger.error('关闭数据库连接时发生错误:', error);
        process.exit(1);
    }
});

module.exports = app; 