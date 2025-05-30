/**
 * 更新角色和管理员用户脚本
 * 用于在项目启动前初始化或更新角色权限
 */

require('dotenv').config();
const { Admin } = require('../src/models/modelIndex');
const logger = require('../src/utils/logger');
const bcrypt = require('bcryptjs');

// 确保管理员用户拥有正确的角色
async function updateAdminRoles() {
    try {
        logger.info('开始更新管理员角色...');

        // 连接数据库并获取所有管理员
        const admins = await Admin.findAll();
        logger.info(`找到 ${admins.length} 个管理员用户`);

        // 获取所有现有用户名
        const existingUsernames = admins.map(admin => admin.username);

        // 检查是否存在超级管理员角色的用户，如果不存在则创建
        const superAdmin = admins.find(admin => admin.role === 'super_admin');
        if (!superAdmin) {
            logger.info('未找到超级管理员，创建默认超级管理员...');

            // 检查用户名是否可用
            const superAdminUsername = 'superadmin';
            if (existingUsernames.includes(superAdminUsername)) {
                logger.info(`用户名 ${superAdminUsername} 已存在，跳过创建`);
            } else {
                // 生成密码加密
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('Admin@123456', salt);

                // 创建超级管理员
                await Admin.create({
                    username: superAdminUsername,
                    password: hashedPassword,
                    real_name: '系统管理员',
                    email: 'admin@example.com',
                    role: 'super_admin',
                    status: 'active',
                    remark: '系统自动创建的超级管理员'
                });

                logger.info('超级管理员创建成功');
            }
        } else {
            logger.info('已存在超级管理员角色的用户');
        }

        // 初始化各种角色的用户
        const roleTypes = ['admin', 'manager', 'operator', 'viewer', 'auditor'];
        const existingRoles = admins.map(admin => admin.role);

        for (const role of roleTypes) {
            // 检查是否已有该角色的用户
            if (!existingRoles.includes(role)) {
                logger.info(`未找到 ${role} 角色的用户，尝试创建示例用户`);

                // 构造不冲突的用户名
                let username = role;
                let counter = 1;

                // 检查用户名是否可用，如果已存在则添加数字
                while (existingUsernames.includes(username)) {
                    username = `${role}${counter}`;
                    counter++;
                }

                // 生成密码
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('Password@123', salt);

                // 创建用户
                const newUser = await Admin.create({
                    username: username,
                    password: hashedPassword,
                    real_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
                    email: `${username}@example.com`,
                    role: role,
                    status: 'active',
                    remark: `系统创建的${role}角色示例用户`
                });

                logger.info(`${role} 角色用户创建成功，用户名: ${username}`);

                // 更新现有用户名列表
                existingUsernames.push(username);
            } else {
                logger.info(`已存在 ${role} 角色的用户`);
            }
        }

        // 更新数据库中可能存在的不正确角色
        const invalidRoles = admins.filter(admin =>
            !['super_admin', 'admin', 'manager', 'operator', 'viewer', 'auditor'].includes(admin.role)
        );

        if (invalidRoles.length > 0) {
            logger.info(`发现 ${invalidRoles.length} 个不正确的角色，尝试更新...`);

            for (const admin of invalidRoles) {
                const oldRole = admin.role;
                // 将无效角色更新为 operator（默认角色）
                admin.role = 'operator';
                await admin.save();
                logger.info(`已更新用户 ${admin.username} 的角色从 ${oldRole} 到 operator`);
            }
        }

        logger.info('管理员角色更新完成');
        process.exit(0);
    } catch (error) {
        logger.error('更新管理员角色失败', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

// 运行更新脚本
updateAdminRoles(); 