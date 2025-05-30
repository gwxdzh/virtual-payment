const Router = require('koa-router');
const logController = require('../controllers/logController');
const { authMiddleware, roleCheck } = require('../middleware/authMiddleware');

// 创建路由实例
const router = new Router({
    prefix: '/api/v1/logs'
});

/**
 * 日志相关路由
 * 所有路由都需要身份认证
 * 部分路由需要特定角色权限
 */

// 查询操作日志列表
router.get('/operation',
    authMiddleware,
    roleCheck(['super_admin', 'admin', 'auditor']),
    logController.getOperationLogs
);

// 获取单条日志详情
router.get('/operation/:id',
    authMiddleware,
    roleCheck(['super_admin', 'admin', 'auditor']),
    logController.getLogDetail
);

// 导出操作日志
router.get('/export',
    authMiddleware,
    roleCheck(['super_admin', 'admin', 'auditor']),
    logController.exportLogs
);

// 下载导出的日志文件
router.get('/download/:fileName',
    authMiddleware,
    roleCheck(['super_admin', 'admin', 'auditor']),
    logController.downloadExportFile
);

module.exports = router; 