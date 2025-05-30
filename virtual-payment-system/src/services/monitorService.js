const { sequelize } = require('../models/modelIndex');
const os = require('os');
const logger = require('../utils/logger');

/**
 * 监控服务类
 * 提供系统监控相关的业务逻辑
 */
class MonitorService {
    /**
     * 获取系统资源使用情况
     * @returns {Promise<Object>} 系统资源使用情况
     */
    async getSystemInfo() {
        try {
            // 获取CPU信息
            const cpuInfo = os.cpus();
            const cpuCount = cpuInfo.length;

            // 简单计算CPU使用率 (生产环境应使用更精确的方法)
            const cpuUsage = Math.floor(Math.random() * 30) + 30; // 模拟30%-60%的CPU使用率

            // 获取内存信息
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsage = Math.floor((totalMem - freeMem) / totalMem * 100);

            // 获取数据库连接信息
            const dbStatus = await this.getDatabaseStatus();

            // 获取API平均响应时间 (模拟数据)
            const apiResponseTime = Math.floor(Math.random() * 100) + 80; // 80-180ms

            return {
                cpuUsage,
                memoryUsage,
                dbConnections: dbStatus.connections,
                dbMaxConnections: dbStatus.maxConnections,
                apiResponseTime,
                uptime: Math.floor(os.uptime() / 3600), // 系统运行小时数
                serverTime: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform
            };
        } catch (error) {
            logger.error('获取系统信息失败', { error: error.message });
            throw new Error('获取系统信息失败');
        }
    }

    /**
     * 获取数据库状态
     * @returns {Promise<Object>} 数据库状态信息
     */
    async getDatabaseStatus() {
        try {
            // 请注意：此方法依赖于具体数据库类型，这里使用MySQL为例
            const [results] = await sequelize.query('SHOW STATUS WHERE Variable_name IN ("Threads_connected", "max_connections")');

            // 如果无法获取准确数据，返回模拟数据
            if (!results || results.length < 2) {
                return {
                    connections: Math.floor(Math.random() * 20) + 20, // 模拟20-40连接数
                    maxConnections: 100
                };
            }

            const status = {};
            results.forEach(item => {
                if (item.Variable_name === 'Threads_connected') {
                    status.connections = parseInt(item.Value, 10);
                }
                if (item.Variable_name === 'max_connections') {
                    status.maxConnections = parseInt(item.Value, 10);
                }
            });

            return status;
        } catch (error) {
            logger.error('获取数据库状态失败', { error: error.message });
            // 返回模拟数据
            return {
                connections: Math.floor(Math.random() * 20) + 20, // 模拟20-40连接数
                maxConnections: 100
            };
        }
    }

    /**
     * 获取API调用趋势数据
     * @param {string} timeRange - 时间范围：hour(1小时), day(24小时), week(7天)
     * @returns {Promise<Object>} API调用趋势数据
     */
    async getApiTrend(timeRange = 'hour') {
        try {
            // 设置时间点数量和时间间隔
            let points, interval, format;
            switch (timeRange) {
                case 'hour':
                    points = 12;
                    interval = 5; // 5分钟一个点
                    format = 'HH:mm';
                    break;
                case 'day':
                    points = 24;
                    interval = 60; // 60分钟(1小时)一个点
                    format = 'HH:00';
                    break;
                case 'week':
                    points = 7;
                    interval = 1440; // 1440分钟(1天)一个点
                    format = 'MM-DD';
                    break;
                default:
                    points = 12;
                    interval = 5;
                    format = 'HH:mm';
            }

            // 生成时间轴数据
            const now = new Date();
            const categories = [];

            for (let i = points - 1; i >= 0; i--) {
                const time = new Date(now.getTime() - i * interval * 60000);
                if (format === 'HH:mm') {
                    categories.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`);
                } else if (format === 'HH:00') {
                    categories.push(`${time.getHours().toString().padStart(2, '0')}:00`);
                } else {
                    categories.push(`${(time.getMonth() + 1).toString().padStart(2, '0')}-${time.getDate().toString().padStart(2, '0')}`);
                }
            }

            // 生成模拟数据
            const generateData = (base, variance) => {
                return Array.from({ length: points }, () => Math.floor(Math.random() * variance * 2) + base - variance);
            };

            const series = [
                {
                    name: '创建订单',
                    data: generateData(200, 100)
                },
                {
                    name: '查询订单',
                    data: generateData(300, 50)
                },
                {
                    name: '支付通知',
                    data: generateData(150, 80)
                },
                {
                    name: '退款',
                    data: generateData(30, 15)
                }
            ];

            return {
                categories,
                series
            };
        } catch (error) {
            logger.error('获取API调用趋势失败', { error: error.message, timeRange });
            throw new Error('获取API调用趋势失败');
        }
    }

    /**
     * 获取系统告警列表
     * @param {number} limit - 返回告警数量
     * @returns {Promise<Array>} 告警列表
     */
    async getAlerts(limit = 10) {
        try {
            // 在实际应用中，应从数据库或日志系统获取真实告警数据
            // 这里使用模拟数据
            const alertTypes = [
                { level: '严重', source: '数据库服务', message: '数据库连接池接近上限' },
                { level: '警告', source: '支付系统', message: '支付成功率低于95%' },
                { level: '严重', source: 'Redis服务', message: 'Redis内存使用率超过85%' },
                { level: '信息', source: '系统服务', message: '系统自动备份完成' },
                { level: '警告', source: '网关服务', message: 'API请求频率超出阈值' },
                { level: '严重', source: '支付系统', message: '第三方支付通道连接超时' },
                { level: '信息', source: '调度系统', message: '定时任务执行完成' },
                { level: '警告', source: '安全模块', message: '检测到异常登录行为' }
            ];

            const alerts = [];
            const now = new Date();

            for (let i = 0; i < limit; i++) {
                const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
                const randomTime = new Date(now.getTime() - Math.floor(Math.random() * 86400000)); // 24小时内的随机时间
                const status = Math.random() > 0.3 ? '已处理' : '未处理'; // 70%概率已处理

                alerts.push({
                    id: i + 1,
                    time: randomTime.toISOString().replace('T', ' ').substring(0, 19),
                    level: randomAlert.level,
                    source: randomAlert.source,
                    message: randomAlert.message,
                    status
                });
            }

            // 按时间降序排序
            alerts.sort((a, b) => new Date(b.time) - new Date(a.time));

            return alerts;
        } catch (error) {
            logger.error('获取系统告警失败', { error: error.message });
            throw new Error('获取系统告警失败');
        }
    }

    /**
     * 获取在线用户统计
     * @returns {Promise<Object>} 在线用户统计数据
     */
    async getOnlineUsers() {
        try {
            // 在实际应用中，应从会话存储或Redis等获取真实在线用户数据
            // 这里使用模拟数据
            const totalOnline = Math.floor(Math.random() * 50) + 100; // 100-150在线用户
            const adminUsers = Math.floor(totalOnline * 0.1); // 管理员约10%
            const merchantUsers = Math.floor(totalOnline * 0.6); // 商户用户约60%
            const operatorUsers = totalOnline - adminUsers - merchantUsers; // 操作员约30%

            // 模拟最近登录的用户
            const recentLogins = [];
            const userTypes = ['管理员', '商户', '操作员'];
            const userStatus = ['活跃', '空闲', '忙碌'];

            for (let i = 0; i < 5; i++) {
                const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
                const status = userStatus[Math.floor(Math.random() * userStatus.length)];

                recentLogins.push({
                    username: `user${Math.floor(Math.random() * 1000)}`,
                    type: userType,
                    loginTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString().replace('T', ' ').substring(0, 19),
                    ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
                    status
                });
            }

            return {
                total: totalOnline,
                breakdown: {
                    admin: adminUsers,
                    merchant: merchantUsers,
                    operator: operatorUsers
                },
                peakToday: Math.floor(totalOnline * 1.2),
                recentLogins
            };
        } catch (error) {
            logger.error('获取在线用户统计失败', { error: error.message });
            throw new Error('获取在线用户统计失败');
        }
    }
}

module.exports = new MonitorService(); 