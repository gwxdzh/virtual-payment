const monitorService = require('../services/monitorService');
const logger = require('../utils/logger');

/**
 * 监控控制器
 * 处理系统监控相关的HTTP请求
 */
class MonitorController {
    /**
     * 获取系统资源使用情况
     * @param {Object} ctx - Koa上下文
     */
    async getSystemInfo(ctx) {
        try {
            const result = await monitorService.getSystemInfo();
            
            ctx.body = {
                code: 'MONITOR.SYSTEM_INFO_SUCCESS',
                localized_msg: {
                    zh_CN: '获取系统信息成功',
                    en_US: 'System information retrieved successfully'
                },
                data: result
            };
        } catch (error) {
            logger.error('获取系统信息失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'MONITOR.SYSTEM_INFO_FAILED',
                localized_msg: {
                    zh_CN: '获取系统信息失败',
                    en_US: 'Failed to retrieve system information'
                },
                error: error.message
            };
        }
    }
    
    /**
     * 获取API调用趋势数据
     * @param {Object} ctx - Koa上下文
     */
    async getApiTrend(ctx) {
        try {
            const { timeRange = 'hour' } = ctx.query;
            const allowedRanges = ['hour', 'day', 'week'];
            
            if (!allowedRanges.includes(timeRange)) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.INVALID_PARAMETER',
                    localized_msg: {
                        zh_CN: '无效的时间范围参数',
                        en_US: 'Invalid time range parameter'
                    }
                };
                return;
            }
            
            const result = await monitorService.getApiTrend(timeRange);
            
            ctx.body = {
                code: 'MONITOR.API_TREND_SUCCESS',
                localized_msg: {
                    zh_CN: '获取API调用趋势成功',
                    en_US: 'API trend data retrieved successfully'
                },
                data: result
            };
        } catch (error) {
            logger.error('获取API调用趋势失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'MONITOR.API_TREND_FAILED',
                localized_msg: {
                    zh_CN: '获取API调用趋势失败',
                    en_US: 'Failed to retrieve API trend data'
                },
                error: error.message
            };
        }
    }
    
    /**
     * 获取系统告警列表
     * @param {Object} ctx - Koa上下文
     */
    async getAlerts(ctx) {
        try {
            const { limit = 10 } = ctx.query;
            const numLimit = parseInt(limit, 10);
            
            // 验证参数
            if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.INVALID_PARAMETER',
                    localized_msg: {
                        zh_CN: '无效的limit参数',
                        en_US: 'Invalid limit parameter'
                    }
                };
                return;
            }
            
            const result = await monitorService.getAlerts(numLimit);
            
            ctx.body = {
                code: 'MONITOR.ALERTS_SUCCESS',
                localized_msg: {
                    zh_CN: '获取系统告警成功',
                    en_US: 'System alerts retrieved successfully'
                },
                data: result
            };
        } catch (error) {
            logger.error('获取系统告警失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'MONITOR.ALERTS_FAILED',
                localized_msg: {
                    zh_CN: '获取系统告警失败',
                    en_US: 'Failed to retrieve system alerts'
                },
                error: error.message
            };
        }
    }
    
    /**
     * 获取在线用户统计
     * @param {Object} ctx - Koa上下文
     */
    async getOnlineUsers(ctx) {
        try {
            const result = await monitorService.getOnlineUsers();
            
            ctx.body = {
                code: 'MONITOR.ONLINE_USERS_SUCCESS',
                localized_msg: {
                    zh_CN: '获取在线用户统计成功',
                    en_US: 'Online users statistics retrieved successfully'
                },
                data: result
            };
        } catch (error) {
            logger.error('获取在线用户统计失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'MONITOR.ONLINE_USERS_FAILED',
                localized_msg: {
                    zh_CN: '获取在线用户统计失败',
                    en_US: 'Failed to retrieve online users statistics'
                },
                error: error.message
            };
        }
    }
}

module.exports = new MonitorController(); 