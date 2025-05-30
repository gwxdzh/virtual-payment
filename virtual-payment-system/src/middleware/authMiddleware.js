const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { roles } = require('../config/rolePermissions');

/**
 * 验证JWT令牌的中间件
 * 验证请求头中的Authorization字段是否包含有效的JWT令牌
 */
const authMiddleware = async (ctx, next) => {
    try {
        // 从请求头获取授权信息
        const authHeader = ctx.header.authorization;

        if (!authHeader) {
            ctx.status = 401;
            ctx.body = {
                code: 'AUTH.TOKEN_REQUIRED',
                localized_msg: {
                    zh_CN: '未提供授权令牌',
                    en_US: 'Authorization token is required'
                }
            };
            return;
        }

        // 提取令牌（Bearer token格式）
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            ctx.status = 401;
            ctx.body = {
                code: 'AUTH.INVALID_TOKEN_FORMAT',
                localized_msg: {
                    zh_CN: '无效的授权令牌格式',
                    en_US: 'Invalid authorization format'
                }
            };
            return;
        }

        const token = parts[1];

        // 验证令牌
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // 将解码后的用户信息保存到ctx.state中，供后续中间件和路由处理器使用
            ctx.state.user = decoded;

            // 继续执行下一个中间件或路由处理器
            await next();
        } catch (error) {
            ctx.status = 401;

            if (error.name === 'TokenExpiredError') {
                ctx.body = {
                    code: 'AUTH.TOKEN_EXPIRED',
                    localized_msg: {
                        zh_CN: '授权令牌已过期，请重新登录',
                        en_US: 'Token expired, please login again'
                    }
                };
            } else {
                ctx.body = {
                    code: 'AUTH.INVALID_TOKEN',
                    localized_msg: {
                        zh_CN: '无效的授权令牌',
                        en_US: 'Invalid token'
                    }
                };
            }

            logger.security('无效令牌访问', {
                error: error.message,
                token,
                path: ctx.path
            });
        }
    } catch (error) {
        // 处理其他可能的错误
        logger.error('授权中间件错误', { error });
        ctx.throw(500, '服务器内部错误');
    }
};

/**
 * 角色验证中间件
 * 检查用户是否具有指定的角色
 * @param {string[]} allowedRoles - 允许访问的角色数组
 * @returns {function} - Koa中间件函数
 */
const roleCheck = (allowedRoles = []) => {
    return async (ctx, next) => {
        // 前提是authMiddleware已经运行，并设置了ctx.state.user
        const { user } = ctx.state;

        if (!user) {
            ctx.status = 401;
            ctx.body = {
                code: 'AUTH.UNAUTHORIZED',
                localized_msg: {
                    zh_CN: '请先登录',
                    en_US: 'Please login first'
                }
            };
            return;
        }

        // 检查用户角色是否在允许的角色列表中
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            ctx.status = 403;
            ctx.body = {
                code: 'AUTH.FORBIDDEN',
                localized_msg: {
                    zh_CN: '没有权限执行此操作',
                    en_US: 'You do not have permission to perform this action'
                }
            };

            logger.security('权限不足访问', {
                userId: user.id,
                role: user.role,
                requiredRoles: allowedRoles,
                path: ctx.path
            });
            return;
        }

        await next();
    };
};

/**
 * 路由权限检查中间件
 * 检查用户是否有权限访问指定的路由
 * @param {string} routeKey - 路由键名
 * @returns {function} - Koa中间件函数
 */
const routePermissionCheck = (routeKey) => {
    return async (ctx, next) => {
        const { user } = ctx.state;

        if (!user) {
            ctx.status = 401;
            ctx.body = {
                code: 'AUTH.UNAUTHORIZED',
                localized_msg: {
                    zh_CN: '请先登录',
                    en_US: 'Please login first'
                }
            };
            return;
        }

        // 获取用户角色
        const role = user.role;

        // 检查角色是否存在
        if (!roles[role]) {
            ctx.status = 403;
            ctx.body = {
                code: 'AUTH.INVALID_ROLE',
                localized_msg: {
                    zh_CN: '无效的用户角色',
                    en_US: 'Invalid user role'
                }
            };
            return;
        }

        // 检查用户是否有权限访问该路由
        const hasPermission = roles[role].routes.includes(routeKey);

        if (!hasPermission) {
            ctx.status = 403;
            ctx.body = {
                code: 'AUTH.ROUTE_FORBIDDEN',
                localized_msg: {
                    zh_CN: '没有权限访问该页面',
                    en_US: 'You do not have permission to access this page'
                }
            };

            logger.security('路由权限不足', {
                userId: user.id,
                role: user.role,
                routeKey,
                path: ctx.path
            });
            return;
        }

        await next();
    };
};

/**
 * 按钮权限检查中间件
 * 检查用户是否有权限操作指定的按钮
 * @param {string} buttonKey - 按钮键名
 * @returns {function} - Koa中间件函数
 */
const buttonPermissionCheck = (buttonKey) => {
    return async (ctx, next) => {
        const { user } = ctx.state;

        if (!user) {
            ctx.status = 401;
            ctx.body = {
                code: 'AUTH.UNAUTHORIZED',
                localized_msg: {
                    zh_CN: '请先登录',
                    en_US: 'Please login first'
                }
            };
            return;
        }

        // 获取用户角色
        const role = user.role;

        // 检查角色是否存在
        if (!roles[role]) {
            ctx.status = 403;
            ctx.body = {
                code: 'AUTH.INVALID_ROLE',
                localized_msg: {
                    zh_CN: '无效的用户角色',
                    en_US: 'Invalid user role'
                }
            };
            return;
        }

        // 检查用户是否有权限操作该按钮
        const hasPermission = roles[role].buttons.includes(buttonKey);

        if (!hasPermission) {
            ctx.status = 403;
            ctx.body = {
                code: 'AUTH.ACTION_FORBIDDEN',
                localized_msg: {
                    zh_CN: '没有权限执行该操作',
                    en_US: 'You do not have permission to perform this action'
                }
            };

            logger.security('按钮权限不足', {
                userId: user.id,
                role: user.role,
                buttonKey,
                path: ctx.path,
                method: ctx.method
            });
            return;
        }

        await next();
    };
};

module.exports = {
    authMiddleware,
    roleCheck,
    routePermissionCheck,
    buttonPermissionCheck
}; 