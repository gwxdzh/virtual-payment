import request from '@/utils/request'

// 获取账户列表
export function getAccountList(params) {
    return request({
        url: '/account/list',
        method: 'get',
        params
    })
}

// 获取账户详情
export function getAccountDetail(accountId) {
    return request({
        url: `/account/detail/${accountId}`,
        method: 'get'
    })
}

// 冻结资金
export function freezeAmount(data) {
    return request({
        url: '/account/freeze',
        method: 'post',
        data
    })
}

// 解冻资金
export function unfreezeAmount(data) {
    return request({
        url: '/account/unfreeze',
        method: 'post',
        data
    })
}

// 获取账户余额历史
export function getAccountHistory(params) {
    return request({
        url: '/account/history',
        method: 'get',
        params
    })
}

// 获取账户操作日志
export function getAccountLogs(params) {
    return request({
        url: '/account/logs',
        method: 'get',
        params
    })
}

// 账户资金调整
export function adjustAccount(data) {
    return request({
        url: '/account/adjust',
        method: 'post',
        data
    })
} 