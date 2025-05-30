const jwt = require('jsonwebtoken');
const { Admin } = require('../models/modelIndex');
const logger = require('../utils/logger');
const { roles, routeMap } = require('../config/rolePermissions');

/**
 * 管理员服务类
 * 提供管理员相关功能的业务逻辑实现
 */
class AdminService {
    /**
     * 管理员登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {string} ip - 登录IP地址
     * @returns {Promise<Object>} - 返回登录结果，包含token和用户信息
     */
    async login(username, password, ip) {
        try {
            // 查找用户
            const admin = await Admin.findOne({ where: { username } });

            // 用户不存在
            if (!admin) {
                throw new Error('用户名不存在');
            }

            // 账户被锁定或禁用
            if (admin.status === 'locked') {
                throw new Error('账户已被锁定，请联系系统管理员');
            }
            if (admin.status === 'inactive') {
                throw new Error('账户已被禁用，请联系系统管理员');
            }

            // 验证密码
            const isValid = await admin.validatePassword(password);
            if (!isValid) {
                throw new Error('密码错误');
            }

            // 更新登录信息
            admin.last_login_time = new Date();
            admin.last_login_ip = ip;
            admin.login_count += 1;
            await admin.save();

            // 生成JWT令牌
            const token = this.generateToken(admin);

            // 移除敏感信息
            const userData = admin.toJSON();
            delete userData.password;

            logger.info('管理员登录成功', { adminId: admin.id, username });

            return {
                token,
                user: userData
            };
        } catch (error) {
            logger.error('管理员登录失败', { username, error: error.message });
            throw error;
        }
    }

    /**
     * 生成JWT令牌
     * @param {Object} admin - 管理员对象
     * @returns {string} - JWT令牌
     * @private
     */
    generateToken(admin) {
        const payload = {
            id: admin.id,
            username: admin.username,
            role: admin.role
        };

        return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: process.env.JWT_EXPIRES || '24h'
        });
    }

    /**
     * 获取管理员信息
     * @param {number} id - 管理员ID
     * @returns {Promise<Object>} - 管理员信息
     */
    async getAdminInfo(id) {
        try {
            const admin = await Admin.findByPk(id);

            if (!admin) {
                throw new Error('用户不存在');
            }

            // 移除敏感信息
            const userData = admin.toJSON();
            delete userData.password;

            return userData;
        } catch (error) {
            logger.error('获取管理员信息失败', { adminId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 修改管理员密码
     * @param {number} id - 管理员ID
     * @param {string} oldPassword - 旧密码
     * @param {string} newPassword - 新密码
     * @returns {Promise<boolean>} - 修改结果
     */
    async changePassword(id, oldPassword, newPassword) {
        try {
            const admin = await Admin.findByPk(id);

            if (!admin) {
                throw new Error('用户不存在');
            }

            // 验证旧密码
            const isValid = await admin.validatePassword(oldPassword);
            if (!isValid) {
                throw new Error('原密码错误');
            }

            // 设置新密码
            admin.password = newPassword;
            await admin.save();

            logger.info('管理员密码修改成功', { adminId: id });

            return true;
        } catch (error) {
            logger.error('修改密码失败', { adminId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 获取管理员菜单权限
     * @param {number} id - 管理员ID
     * @returns {Promise<Array>} - 菜单权限列表
     */
    async getMenuPermissions(id) {
        try {
            const admin = await Admin.findByPk(id);

            if (!admin) {
                throw new Error('用户不存在');
            }

            // 基于角色返回对应的菜单权限
            return this.buildUserRoutes(admin.role);
        } catch (error) {
            logger.error('获取菜单权限失败', { adminId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 构建用户路由权限
     * @param {string} role - 角色
     * @returns {Array} - 菜单列表
     */
    buildUserRoutes(role) {
        // 如果角色不存在，返回空数组
        if (!roles[role]) {
            logger.warn('未找到角色定义', { role });
            return [];
        }

        // 获取角色对应的路由权限
        const allowedRoutes = roles[role].routes;
        const buttonPermissions = roles[role].buttons;

        // 如果没有可访问的路由，返回空数组
        if (!allowedRoutes || allowedRoutes.length === 0) {
            return [];
        }

        // 构建菜单树
        return this.buildMenuTree(allowedRoutes, buttonPermissions);
    }

    /**
     * 构建菜单树
     * @param {Array<string>} allowedRoutes - 允许的路由键名
     * @param {Array<string>} buttonPermissions - 按钮权限
     * @returns {Array} - 菜单树
     */
    buildMenuTree(allowedRoutes, buttonPermissions) {
        // 找出顶级菜单（没有点号的）
        const topRoutes = allowedRoutes.filter(route => !route.includes('.'));

        const result = [];

        // 对每个顶级菜单，构建其子菜单
        for (const routeKey of topRoutes) {
            if (!routeMap[routeKey]) {
                logger.warn('未找到路由配置', { routeKey });
                continue;
            }

            const routeConfig = { ...routeMap[routeKey] };

            // 如果有children字段，需要处理子路由
            if (routeConfig.children && routeConfig.children.length > 0) {
                const childrenKeys = routeConfig.children;
                const filteredChildren = [];

                // 只添加用户有权限的子路由
                for (const childKey of childrenKeys) {
                    if (allowedRoutes.includes(childKey) && routeMap[childKey]) {
                        filteredChildren.push(routeMap[childKey]);
                    }
                }

                // 如果有子路由，则添加到结果中
                if (filteredChildren.length > 0) {
                    routeConfig.children = filteredChildren;
                    result.push(routeConfig);
                }
            } else {
                // 没有子路由的顶级路由直接添加
                result.push(routeConfig);
            }
        }

        // 返回路由配置和按钮权限
        return {
            menus: result,
            buttons: buttonPermissions || []
        };
    }
}

module.exports = new AdminService(); 