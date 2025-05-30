import request from '@/utils/request'

// 获取订单列表
export function getOrderList(params) {
    return request({
        url: '/order/list',
        method: 'get',
        params
    })
}

// 获取订单详情
export function getOrderDetail(id) {
    return request({
        url: `/order/detail/${id}`,
        method: 'get'
    })
}

// 关闭订单
export function closeOrder(orderId, reason) {
    return request({
        url: '/order/close',
        method: 'post',
        data: {
            orderId,
            reason
        }
    })
}

// 发起退款
export function refundOrder(data) {
    return request({
        url: '/order/refund',
        method: 'post',
        data
    })
}

// 获取退款记录
export function getRefundList(orderId) {
    return request({
        url: '/order/refund/list',
        method: 'get',
        params: { orderId }
    })
}

// 导出订单数据
export function exportOrders(params) {
    return request({
        url: '/order/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
}

// 获取订单统计数据
export function getOrderStatistics(params) {
    return request({
        url: '/order/statistics',
        method: 'get',
        params
    })
} 