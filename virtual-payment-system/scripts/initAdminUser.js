/**
 * 初始化管理员用户脚本
 * 用于创建系统的初始超级管理员账户
 */

require('dotenv').config();
const { Admin } = require('../src/models/modelIndex');
const { sequelize } = require('../src/models/modelIndex');
const logger = require('../src/utils/logger');

// 初始管理员信息
const defaultAdmin = {
    username: 'admin',
    password: 'Admin@123',
    real_name: '系统管理员',
    email: 'admin@example.com',
    role: 'super_admin',
    status: 'active',
    remark: '系统初始化创建的管理员账户'
};

/**
 * 初始化管理员账户
 */
async function initAdminUser() {
    try {
        logger.info('开始初始化管理员账户');

        // 检查数据库连接
        await sequelize.authenticate();
        logger.info('数据库连接成功');

        // 同步Admin模型到数据库
        await Admin.sync({ alter: true });
        logger.info('管理员用户表同步成功');

        // 检查是否已存在管理员账户
        const existingAdmin = await Admin.findOne({
            where: { username: defaultAdmin.username }
        });

        if (existingAdmin) {
            logger.info('管理员账户已存在，无需创建');
            return;
        }

        // 创建初始管理员账户
        const newAdmin = await Admin.create(defaultAdmin);
        logger.info('初始管理员账户创建成功', { adminId: newAdmin.id });

        console.log('='.repeat(50));
        console.log('初始管理员账户创建成功');
        console.log('用户名:', defaultAdmin.username);
        console.log('密码:', defaultAdmin.password);
        console.log('请登录后立即修改初始密码！');
        console.log('='.repeat(50));

    } catch (error) {
        logger.error('初始化管理员账户失败', error);
        console.error('初始化管理员账户失败:', error.message);
    } finally {
        // 关闭数据库连接
        await sequelize.close();
        process.exit(0);
    }
}

// 执行初始化
initAdminUser(); 