import request from '@/utils/request'

// 获取商户列表
export function getMerchantList(params) {
    return request({
        url: '/merchant/list',
        method: 'get',
        params
    })
}

// 获取商户详情
export function getMerchantDetail(id) {
    return request({
        url: `/merchant/detail/${id}`,
        method: 'get'
    })
}

// 新增商户
export function addMerchant(data) {
    return request({
        url: '/merchant/add',
        method: 'post',
        data
    })
}

// 更新商户信息
export function updateMerchant(data) {
    return request({
        url: '/merchant/update',
        method: 'put',
        data
    })
}

// 更新商户状态
export function updateMerchantStatus(id, status) {
    return request({
        url: '/merchant/status',
        method: 'put',
        data: { id, status }
    })
}

// 重置商户密钥
export function resetMerchantKey(id) {
    return request({
        url: '/merchant/reset-key',
        method: 'post',
        data: { id }
    })
}

// 获取商户证书状态
export function getMerchantCertStatus(id) {
    return request({
        url: `/merchant/cert-status/${id}`,
        method: 'get'
    })
}

// 导出商户数据
export function exportMerchants(params) {
    return request({
        url: '/merchant/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
} 