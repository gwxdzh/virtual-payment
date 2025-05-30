import request from '@/utils/request'

// 用户登录
export function login(data) {
    return request({
        url: '/admin/login',
        method: 'post',
        data
    })
}

// 退出登录
export function logout() {
    return request({
        url: '/admin/logout',
        method: 'post'
    })
}

// 获取用户信息
export function getUserInfo() {
    return request({
        url: '/admin/info',
        method: 'get'
    })
}

// 获取用户菜单权限
export function getUserMenus() {
    return request({
        url: '/admin/menus',
        method: 'get'
    })
}

// 修改密码
export function updatePassword(data) {
    return request({
        url: '/admin/change-password',
        method: 'put',
        data
    })
} 