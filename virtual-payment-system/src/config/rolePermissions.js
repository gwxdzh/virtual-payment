/**
 * 角色与权限配置文件
 * 定义系统中的角色及其对应的权限
 */

// 角色定义
const roles = {
    super_admin: {
        name: "超级管理员",
        description: "拥有系统所有功能的访问权限",
        routes: [
            "dashboard",
            "merchant", "merchant.list", "merchant.detail",
            "order", "order.list", "order.detail", "order.report",
            "account", "account.list", "account.detail",
            "system", "system.users", "system.roles", "system.permissions",
            "monitor", "monitor.metrics", "monitor.alerts",
            "log", "log.operation", "log.login"
        ],
        buttons: [
            "merchant.add", "merchant.edit", "merchant.delete", "merchant.freeze", "merchant.unfreeze", "merchant.key",
            "order.close", "order.refund", "order.export",
            "account.freeze", "account.unfreeze",
            "system.user.add", "system.user.edit", "system.user.delete", "system.role.add", "system.role.edit", "system.role.delete"
        ]
    },
    admin: {
        name: "管理员",
        description: "拥有大部分管理功能的访问权限",
        routes: [
            "dashboard",
            "merchant", "merchant.list", "merchant.detail",
            "order", "order.list", "order.detail", "order.report",
            "account", "account.list", "account.detail",
            "monitor", "monitor.metrics", "monitor.alerts",
            "log", "log.operation", "log.login"
        ],
        buttons: [
            "merchant.add", "merchant.edit", "merchant.freeze", "merchant.unfreeze",
            "order.close", "order.refund", "order.export",
            "account.freeze", "account.unfreeze"
        ]
    },
    manager: {
        name: "经理",
        description: "拥有业务操作和部分报表的访问权限",
        routes: [
            "dashboard",
            "merchant", "merchant.list", "merchant.detail",
            "order", "order.list", "order.detail", "order.report",
            "account", "account.list", "account.detail",
            "monitor", "monitor.metrics", "monitor.alerts"
        ],
        buttons: [
            "merchant.add", "merchant.edit",
            "order.close", "order.refund", "order.export"
        ]
    },
    operator: {
        name: "操作员",
        description: "拥有基础业务操作的访问权限",
        routes: [
            "dashboard",
            "merchant", "merchant.list", "merchant.detail",
            "order", "order.list", "order.detail",
            "account", "account.list"
        ],
        buttons: [
            "order.close", "order.export"
        ]
    },
    viewer: {
        name: "查看者",
        description: "只有查看权限，无操作权限",
        routes: [
            "dashboard",
            "merchant", "merchant.list",
            "order", "order.list",
            "account", "account.list"
        ],
        buttons: []
    },
    auditor: {
        name: "审计员",
        description: "拥有查看日志和监控的权限",
        routes: [
            "dashboard",
            "monitor", "monitor.metrics", "monitor.alerts",
            "log", "log.operation", "log.login"
        ],
        buttons: [
            "log.export"
        ]
    }
};

// 路由定义映射
const routeMap = {
    dashboard: {
        path: "/dashboard",
        name: "Dashboard",
        component: "dashboard/index",
        meta: { title: "数据看板", icon: "chart" }
    },
    merchant: {
        path: "/merchant",
        name: "Merchant",
        meta: { title: "商户管理", icon: "shop" },
        children: ["merchant.list", "merchant.detail"]
    },
    "merchant.list": {
        path: "/merchant/list",
        name: "MerchantList",
        component: "merchant/index",
        meta: { title: "商户列表", icon: "table" }
    },
    "merchant.detail": {
        path: "/merchant/detail/:id",
        name: "MerchantDetail",
        component: "merchant/detail",
        meta: { title: "商户详情", icon: "profile", hideInMenu: true }
    },
    order: {
        path: "/order",
        name: "Order",
        meta: { title: "订单管理", icon: "file-text" },
        children: ["order.list", "order.detail", "order.report"]
    },
    "order.list": {
        path: "/order/list",
        name: "OrderList",
        component: "order/index",
        meta: { title: "订单列表", icon: "table" }
    },
    "order.detail": {
        path: "/order/detail/:id",
        name: "OrderDetail",
        component: "order/detail",
        meta: { title: "订单详情", icon: "profile", hideInMenu: true }
    },
    "order.report": {
        path: "/order/report",
        name: "OrderReport",
        component: "order/report",
        meta: { title: "订单统计", icon: "bar-chart" }
    },
    account: {
        path: "/account",
        name: "Account",
        meta: { title: "账户管理", icon: "wallet" },
        children: ["account.list", "account.detail"]
    },
    "account.list": {
        path: "/account/list",
        name: "AccountList",
        component: "account/index",
        meta: { title: "账户列表", icon: "table" }
    },
    "account.detail": {
        path: "/account/detail/:id",
        name: "AccountDetail",
        component: "account/detail",
        meta: { title: "账户详情", icon: "profile", hideInMenu: true }
    },
    system: {
        path: "/system",
        name: "System",
        meta: { title: "权限管理", icon: "safety" },
        children: ["system.users", "system.roles", "system.permissions"]
    },
    "system.users": {
        path: "/system/users",
        name: "Users",
        component: "system/users",
        meta: { title: "用户管理", icon: "team" }
    },
    "system.roles": {
        path: "/system/roles",
        name: "Roles",
        component: "system/roles",
        meta: { title: "角色管理", icon: "solution" }
    },
    "system.permissions": {
        path: "/system/permissions",
        name: "Permissions",
        component: "system/permissions",
        meta: { title: "权限配置", icon: "key" }
    },
    monitor: {
        path: "/monitor",
        name: "Monitor",
        meta: { title: "系统监控", icon: "dashboard" },
        children: ["monitor.metrics", "monitor.alerts"]
    },
    "monitor.metrics": {
        path: "/monitor/metrics",
        name: "Metrics",
        component: "monitor/metrics",
        meta: { title: "性能指标", icon: "fund" }
    },
    "monitor.alerts": {
        path: "/monitor/alerts",
        name: "Alerts",
        component: "monitor/alerts",
        meta: { title: "告警信息", icon: "warning" }
    },
    log: {
        path: "/log",
        name: "Log",
        meta: { title: "日志管理", icon: "file-search" },
        children: ["log.operation", "log.login"]
    },
    "log.operation": {
        path: "/log/operation",
        name: "OperationLog",
        component: "log/operation",
        meta: { title: "操作日志", icon: "interaction" }
    },
    "log.login": {
        path: "/log/login",
        name: "LoginLog",
        component: "log/login",
        meta: { title: "登录日志", icon: "login" }
    }
};

module.exports = {
    roles,
    routeMap
}; 