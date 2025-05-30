const merchantRoutes = require('./merchantRoutes');
const orderRoutes = require('./orderRoutes');
const accountRoutes = require('./accountRoutes');
const adminRoutes = require('./adminRoutes');
const monitorRoutes = require('./monitorRoutes');
const logRoutes = require('./logRoutes');

/**
 * 注册所有路由
 * @param {Object} app - Koa实例
 */
const registerRoutes = (app) => {
    // 注册管理员路由
    app.use(adminRoutes.routes());
    app.use(adminRoutes.allowedMethods());

    // 注册监控路由
    app.use(monitorRoutes.routes());
    app.use(monitorRoutes.allowedMethods());

    // 注册日志路由
    app.use(logRoutes.routes());
    app.use(logRoutes.allowedMethods());

    // 注册业务路由
    app.use(merchantRoutes.routes());
    app.use(merchantRoutes.allowedMethods());

    app.use(orderRoutes.routes());
    app.use(orderRoutes.allowedMethods());

    app.use(accountRoutes.routes());
    app.use(accountRoutes.allowedMethods());

    // 404处理
    app.use(async (ctx) => {
        if (ctx.status === 404) {
            ctx.status = 404;
            ctx.body = {
                code: 'SYSTEM.NOT_FOUND',
                localized_msg: {
                    zh_CN: '请求的资源不存在',
                    en_US: 'Requested resource not found'
                },
                debug_id: ctx.request.id,
                timestamp: new Date().toISOString()
            };
        }
    });
};

module.exports = registerRoutes; 