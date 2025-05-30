const adminService = require('../services/adminService');
const logger = require('../utils/logger');

/**
 * 管理员控制器
 * 处理与管理员相关的HTTP请求
 */
class AdminController {
    /**
     * 管理员登录
     * @param {Object} ctx - Koa上下文
     */
    async login(ctx) {
        try {
            const { username, password } = ctx.request.body;

            // 基本参数验证
            if (!username || !password) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.PARAMS_MISSING',
                    localized_msg: {
                        zh_CN: '用户名和密码不能为空',
                        en_US: 'Username and password are required'
                    }
                };
                return;
            }

            // 获取客户端IP地址
            const ip = ctx.request.ip;

            // 调用服务层进行登录处理
            const result = await adminService.login(username, password, ip);

            // 登录成功，返回token和用户信息
            ctx.body = {
                code: 'AUTH.LOGIN_SUCCESS',
                localized_msg: {
                    zh_CN: '登录成功',
                    en_US: 'Login successful'
                },
                data: result
            };
        } catch (error) {
            // 处理具体的登录错误
            ctx.status = 401;
            ctx.body = {
                code: 'AUTH.LOGIN_FAILED',
                localized_msg: {
                    zh_CN: error.message || '登录失败',
                    en_US: error.message || 'Login failed'
                }
            };
        }
    }

    /**
     * 退出登录
     * 仅记录日志，实际的令牌失效需要前端处理
     * @param {Object} ctx - Koa上下文
     */
    async logout(ctx) {
        try {
            // 获取当前用户ID
            const { id, username } = ctx.state.user;

            // 记录退出日志，JWT 无法在服务端使其失效
            // 客户端应删除本地存储的令牌
            logger.info('管理员退出登录', { adminId: id, username });

            ctx.body = {
                code: 'AUTH.LOGOUT_SUCCESS',
                localized_msg: {
                    zh_CN: '退出成功',
                    en_US: 'Logout successful'
                }
            };
        } catch (error) {
            logger.error('退出登录处理错误', { error: error.message });
            ctx.throw(500, '服务器内部错误');
        }
    }

    /**
     * 获取当前管理员信息
     * @param {Object} ctx - Koa上下文
     */
    async getUserInfo(ctx) {
        try {
            // 从ctx.state.user中获取当前用户ID
            const { id } = ctx.state.user;

            // 获取用户详细信息
            const userInfo = await adminService.getAdminInfo(id);

            ctx.body = {
                code: 'USER.INFO_SUCCESS',
                localized_msg: {
                    zh_CN: '获取用户信息成功',
                    en_US: 'User info retrieved successfully'
                },
                data: userInfo
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                code: 'USER.INFO_FAILED',
                localized_msg: {
                    zh_CN: '获取用户信息失败',
                    en_US: 'Failed to retrieve user info'
                },
                error: error.message
            };
        }
    }

    /**
     * 获取用户菜单权限
     * @param {Object} ctx - Koa上下文
     */
    async getMenus(ctx) {
        try {
            // 从ctx.state.user中获取当前用户ID
            const { id } = ctx.state.user;

            // 获取用户菜单权限
            const menus = await adminService.getMenuPermissions(id);

            ctx.body = {
                code: 'USER.MENUS_SUCCESS',
                localized_msg: {
                    zh_CN: '获取菜单权限成功',
                    en_US: 'Menu permissions retrieved successfully'
                },
                data: menus
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                code: 'USER.MENUS_FAILED',
                localized_msg: {
                    zh_CN: '获取菜单权限失败',
                    en_US: 'Failed to retrieve menu permissions'
                },
                error: error.message
            };
        }
    }

    /**
     * 修改密码
     * @param {Object} ctx - Koa上下文
     */
    async changePassword(ctx) {
        try {
            const { oldPassword, newPassword, confirmPassword } = ctx.request.body;
            const { id } = ctx.state.user;

            // 基本验证
            if (!oldPassword || !newPassword || !confirmPassword) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.PARAMS_MISSING',
                    localized_msg: {
                        zh_CN: '所有密码字段不能为空',
                        en_US: 'All password fields are required'
                    }
                };
                return;
            }

            // 确认新密码
            if (newPassword !== confirmPassword) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.PASSWORD_MISMATCH',
                    localized_msg: {
                        zh_CN: '两次输入的新密码不一致',
                        en_US: 'New passwords do not match'
                    }
                };
                return;
            }

            // 密码强度验证
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.WEAK_PASSWORD',
                    localized_msg: {
                        zh_CN: '密码必须至少包含8个字符，包括大小写字母、数字和特殊字符',
                        en_US: 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters'
                    }
                };
                return;
            }

            // 调用服务修改密码
            const result = await adminService.changePassword(id, oldPassword, newPassword);

            ctx.body = {
                code: 'USER.PASSWORD_CHANGED',
                localized_msg: {
                    zh_CN: '密码修改成功，请重新登录',
                    en_US: 'Password changed successfully, please login again'
                }
            };
        } catch (error) {
            ctx.status = 400;
            ctx.body = {
                code: 'USER.PASSWORD_CHANGE_FAILED',
                localized_msg: {
                    zh_CN: error.message || '密码修改失败',
                    en_US: error.message || 'Failed to change password'
                }
            };
        }
    }
}

module.exports = new AdminController();

