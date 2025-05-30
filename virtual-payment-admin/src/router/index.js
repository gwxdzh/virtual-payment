import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 基础路由，不需要权限控制
const constantRoutes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/login/index.vue'),
        meta: { title: '登录', public: true }
    },
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('../views/error/403.vue'),
        meta: { title: '无权限', public: true }
    },
    {
        path: '/404',
        name: 'NotFound',
        component: () => import('../views/error/404.vue'),
        meta: { title: '未找到', public: true }
    },
    {
        path: '/',
        component: () => import('../layout/index.vue'),
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../views/dashboard/index.vue'),
                meta: { title: '首页', icon: 'Dashboard' }
            }
        ]
    }
]

// 需要根据用户角色动态加载的路由
export const asyncRoutes = []

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes
})



// 添加路由守卫
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const hasRoutes = userStore.routes && userStore.routes.length > 0

    // 公共路由直接通过
    if (to.meta.public) {
        return next()
    }

    // 校验登录状态
    if (!userStore.token) {
        // 未登录，重定向到登录页
        return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // 检查是否已加载动态路由
    if (!router.hasRoute('NotFound')) {
        try {
            // 加载用户信息（如果需要）
            if (!userStore.userInfo || !Object.keys(userStore.userInfo).length) {
                await userStore.fetchUserInfo()
            }

            // 获取用户菜单权限（如果需要）
            if (!hasRoutes) {
                const menus = await userStore.fetchMenus()

                // 将菜单数据转换为路由配置并动态添加
                if (menus && menus.length > 0) {
                    const dynamicRoutes = generateRoutes(menus)
                    dynamicRoutes.forEach(route => {
                        router.addRoute(route)
                    })

                    // 添加404路由作为捕获所有未匹配路由
                    router.addRoute({
                        path: '/:pathMatch(.*)*',
                        name: 'NotFound',
                        redirect: '/404'
                    })

                    // 如果目标路由不是当前路由，则需要重定向以确保路由正确匹配
                    if (to.path !== '/login') {
                        return next({ ...to, replace: true })
                    }
                }
            }

            next()
        } catch (error) {
            console.error('路由加载失败:', error)
            userStore.resetToken()
            next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        }
    } else {
        next()
    }
})

/**
 * 根据菜单数据生成路由配置
 * @param {Array} menus - 菜单数据
 * @returns {Array} - 路由配置
 */
function generateRoutes(menus) {
    const routes = []

    menus.forEach(menu => {
        const route = {
            path: menu.path,
            name: menu.name,
            meta: menu.meta || {},
            component: loadComponent(menu.component)
        }

        // 处理子路由
        if (menu.children && menu.children.length > 0) {
            if (!route.component) {
                // 如果父级没有组件，则使用Layout作为默认组件
                route.component = () => import('@/layout/index.vue')
            }
            route.children = generateRoutes(menu.children)
        }

        routes.push(route)
    })

    return routes
}



/**
 * 动态加载组件
 * @param {String} component - 组件路径
 * @returns {Function|null} - 动态导入函数或null
 */
function loadComponent(component) {
    if (!component) return null;

    // 对于layout/index特殊处理
    if (component === 'layout/index') {
        return () => import('@/layout/index.vue')
    }

    try {
        // 直接使用组件路径加载，不再添加额外的index.vue
        // 例如：merchant/index将加载@/views/merchant/index.vue
        return () => import(`@/views/${component}.vue`)
    } catch (error) {
        console.error(`无法加载组件: ${component}`, error)
        return null
    }
}

export function resetRouter() {
    const newRouter = createRouter({
        history: createWebHashHistory(),
        routes: constantRoutes
    })
    router.matcher = newRouter.matcher // 重置路由
}

export default router 