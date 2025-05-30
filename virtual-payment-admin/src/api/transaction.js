import request from '@/utils/request'

// 获取交易列表
export function getTransactionList(params) {
    return request({
        url: '/transaction/list',
        method: 'get',
        params
    })
}

// 获取交易详情
export function getTransactionDetail(id) {
    return request({
        url: `/transaction/detail/${id}`,
        method: 'get'
    })
}

// 获取交易报表数据
export function getTransactionReport(params) {
    return request({
        url: '/transaction/report',
        method: 'get',
        params
    })
}

// 获取交易趋势数据
export function getTransactionTrend(params) {
    return request({
        url: '/transaction/trend',
        method: 'get',
        params
    })
}

// 获取渠道分布数据
export function getChannelDistribution(params) {
    return request({
        url: '/transaction/channel-distribution',
        method: 'get',
        params
    })
}

// 导出交易数据
export function exportTransactions(params) {
    return request({
        url: '/transaction/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
} 