const Router = require('koa-router');
const adminController = require('../controllers/adminController');
const { authMiddleware, roleCheck, routePermissionCheck, buttonPermissionCheck } = require('../middleware/authMiddleware');

// 创建路由实例
const router = new Router({
    prefix: '/api/v1/admin'
});

/**
 * 公开路由 - 不需要认证
 */
// 管理员登录
router.post('/login', adminController.login);

/**
 * 受保护路由 - 需要认证
 */
// 退出登录
router.post('/logout', authMiddleware, adminController.logout);

// 获取当前用户信息
router.get('/info', authMiddleware, adminController.getUserInfo);

// 获取用户菜单权限
router.get('/menus', authMiddleware, adminController.getMenus);

// 修改密码
router.post('/change-password', authMiddleware, adminController.changePassword);

/**
 * 管理员相关功能（根据角色权限控制）
 */
// 获取所有用户列表 - 仅具有系统管理权限的角色可访问
router.get('/users',
    authMiddleware,
    routePermissionCheck('system.users'),
    async (ctx) => {
        ctx.body = {
            code: 'ADMIN.USERS_LIST',
            localized_msg: {
                zh_CN: '获取管理员列表成功',
                en_US: 'Retrieved admin users list successfully'
            },
            data: {
                users: [
                    { id: 1, username: 'admin', role: 'super_admin', status: 'active' },
                    // 仅展示模拟数据
                ]
            }
        };
    }
);

// 添加管理员用户 - 需要system.user.add按钮权限
router.post('/users',
    authMiddleware,
    routePermissionCheck('system.users'),
    buttonPermissionCheck('system.user.add'),
    async (ctx) => {
        // 这里是添加用户的逻辑，实际项目应在控制器中实现
        ctx.body = {
            code: 'ADMIN.USER_ADDED',
            localized_msg: {
                zh_CN: '添加管理员成功',
                en_US: 'Admin user added successfully'
            }
        };
    }
);

// 编辑管理员用户 - 需要system.user.edit按钮权限
router.put('/users/:id',
    authMiddleware,
    routePermissionCheck('system.users'),
    buttonPermissionCheck('system.user.edit'),
    async (ctx) => {
        // 这里是编辑用户的逻辑
        const { id } = ctx.params;
        ctx.body = {
            code: 'ADMIN.USER_UPDATED',
            localized_msg: {
                zh_CN: '更新管理员成功',
                en_US: 'Admin user updated successfully'
            },
            data: { id }
        };
    }
);

// 删除管理员用户 - 需要system.user.delete按钮权限
router.delete('/users/:id',
    authMiddleware,
    routePermissionCheck('system.users'),
    buttonPermissionCheck('system.user.delete'),
    async (ctx) => {
        // 这里是删除用户的逻辑
        const { id } = ctx.params;
        ctx.body = {
            code: 'ADMIN.USER_DELETED',
            localized_msg: {
                zh_CN: '删除管理员成功',
                en_US: 'Admin user deleted successfully'
            },
            data: { id }
        };
    }
);

module.exports = router; 