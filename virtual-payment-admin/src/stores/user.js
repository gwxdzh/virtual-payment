import { defineStore } from 'pinia'
import { login, getUserInfo, logout } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { getUserMenus } from '@/api/user'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: getToken(),
        userInfo: {},
        roles: [],
        routes: [],
        buttons: []
    }),

    getters: {
        hasRole: (state) => (role) => state.roles.includes(role),
        hasPermission: (state) => (path) => state.routes.some(route => route.path === path),
        hasButtonPermission: (state) => (button) => state.buttons.includes(button)
    },

    actions: {
        // 用户登录
        async login(userInfo) {
            try {
                const response = await login(userInfo)
                this.token = response.token
                setToken(response.token)
                return Promise.resolve()
            } catch (error) {
                return Promise.reject(error)
            }
        },

        // 获取用户信息
        async fetchUserInfo() {
            try {
                const response = await getUserInfo()
                this.userInfo = response.userInfo
                this.roles = response.roles
                this.buttons = response.buttons || []
                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            }
        },

        // 获取用户菜单和按钮权限
        async fetchMenus() {
            if (this.routes.length > 0) {
                return this.routes
            }

            try {
                // 调用获取菜单的专用API
                const response = await getUserMenus()
                console.log('API返回的完整数据:', response)

                // 默认重置数据
                this.routes = []
                this.buttons = []

                // 逐层检查数据格式并尝试提取菜单和按钮
                if (response) {
                    // 情况1: 直接返回数组格式
                    if (Array.isArray(response)) {
                        this.routes = response
                    }
                    // 情况2: 标准格式 {code, data: {menus, buttons}}
                    else if (response.data && response.data.menus) {
                        if (Array.isArray(response.data.menus)) {
                            this.routes = response.data.menus
                        }

                        if (Array.isArray(response.data.buttons)) {
                            this.buttons = response.data.buttons
                        }
                    }
                    // 情况3: 直接包含menus属性
                    else if (response.menus && Array.isArray(response.menus)) {
                        this.routes = response.menus

                        if (response.buttons && Array.isArray(response.buttons)) {
                            this.buttons = response.buttons
                        }
                    }
                }

                if (this.routes.length === 0) {
                    console.warn('未获取到菜单数据或数据格式不正确:', response)
                } else {
                    console.info('成功加载菜单项:', this.routes.length, '个')
                }

                return this.routes
            } catch (error) {
                console.error('获取菜单失败:', error)
                return Promise.reject(error)
            }
        },

        // 登出
        async logout() {
            try {
                await logout()
                this.token = ''
                this.userInfo = {}
                this.roles = []
                this.routes = []
                this.buttons = []
                removeToken()
                return Promise.resolve()
            } catch (error) {
                return Promise.reject(error)
            }
        },

        // 重置令牌
        resetToken() {
            this.token = ''
            this.userInfo = {}
            this.roles = []
            this.routes = []
            this.buttons = []
            removeToken()
        }
    }
}) 