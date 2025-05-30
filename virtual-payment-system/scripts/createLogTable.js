require('dotenv').config();
const sequelize = require('../src/models/index');
const OperationLog = require('../src/models/operationLog');
const logger = require('../src/utils/logger');

/**
 * 创建操作日志表
 */
async function createOperationLogTable() {
    try {
        console.log('开始创建操作日志表...');

        // 同步模型到数据库，强制创建表（如果存在则先删除再创建）
        await OperationLog.sync({ force: false });

        console.log('操作日志表创建成功！');
        process.exit(0);
    } catch (error) {
        logger.error('创建操作日志表失败', { error: error.message });
        console.error('创建操作日志表失败:', error.message);
        process.exit(1);
    }
}

// 执行创建操作
createOperationLogTable(); 