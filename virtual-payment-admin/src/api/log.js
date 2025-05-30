import request from '@/utils/request'

// 获取操作日志列表
export function getOperationLogs(params) {
    return request({
        url: '/logs/operation',
        method: 'get',
        params
    })
}

// 获取登录日志列表
export function getLoginLogs(params) {
    return request({
        url: '/logs/login',
        method: 'get',
        params
    })
}

// 获取日志详情
export function getLogDetail(logId, type) {
    return request({
        url: `/logs/${type}/${logId}`,
        method: 'get'
    })
}

// 导出操作日志
export function exportOperationLogs(params) {
    return request({
        url: '/logs/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
}

// 导出登录日志
export function exportLoginLogs(params) {
    return request({
        url: '/logs/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
}

// 清理日志
export function clearLogs(data) {
    return request({
        url: '/logs/clear',
        method: 'post',
        data
    })
}
