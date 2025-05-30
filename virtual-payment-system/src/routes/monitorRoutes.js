const Router = require('koa-router');
const monitorController = require('../controllers/monitorController');
const { authMiddleware, roleCheck } = require('../middleware/authMiddleware');

// 创建路由实例
const router = new Router({
    prefix: '/api/v1/monitor'
});

/**
 * 监控相关路由
 * 所有路由都需要身份认证
 * 部分路由需要特定角色权限
 */

// 获取系统资源使用情况
router.get('/system-info', authMiddleware, roleCheck(['super_admin', 'admin', 'manager']), monitorController.getSystemInfo);

// 获取API调用趋势
router.get('/api-trend', authMiddleware, roleCheck(['super_admin', 'admin', 'manager']), monitorController.getApiTrend);

// 获取系统告警列表
router.get('/alerts', authMiddleware, roleCheck(['super_admin', 'admin', 'manager']), monitorController.getAlerts);

// 获取在线用户统计
router.get('/online-users', authMiddleware, roleCheck(['super_admin', 'admin']), monitorController.getOnlineUsers);

module.exports = router; 