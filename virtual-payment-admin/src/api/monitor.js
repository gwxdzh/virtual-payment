import request from '@/utils/request'

// 获取系统指标
export function getSystemMetrics() {
    return request({
        url: '/monitor/system-info',
        method: 'get'
    })
}

// 获取实时告警列表
export function getAlertList(params) {
    return request({
        url: '/monitor/alerts',
        method: 'get',
        params
    })
}

// 获取API调用统计数据
export function getApiStatistics(params) {
    return request({
        url: '/monitor/api-trend',
        method: 'get',
        params
    })
}

// 获取支付渠道监控数据
export function getChannelMetrics(params) {
    return request({
        url: '/monitor/channel-metrics',
        method: 'get',
        params
    })
}

// 处理告警
export function handleAlert(alertId, data) {
    return request({
        url: `/monitor/alerts/${alertId}/handle`,
        method: 'post',
        data
    })
}

// 获取系统状态
export function getSystemStatus() {
    return request({
        url: '/monitor/status',
        method: 'get'
    })
} 