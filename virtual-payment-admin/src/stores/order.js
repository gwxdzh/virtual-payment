import { defineStore } from 'pinia'
import { getOrderList, getOrderDetail, closeOrder, refundOrder, getOrderStatistics } from '@/api/order'

export const useOrderStore = defineStore('order', {
    state: () => ({
        orderList: [],
        total: 0,
        currentOrder: null,
        loading: false,
        statistics: {
            todayAmount: 0,
            todayCount: 0,
            successRate: 0,
            refundAmount: 0
        },
        queryParams: {
            page: 1,
            limit: 20,
            orderId: '',
            merchantId: '',
            status: [],
            channel: [],
            startTime: '',
            endTime: '',
            minAmount: '',
            maxAmount: ''
        }
    }),

    getters: {
        // 订单列表
        orders: (state) => state.orderList,

        // 订单总数
        orderTotal: (state) => state.total,

        // 当前查询参数
        currentQueryParams: (state) => state.queryParams,

        // 是否可退款
        canRefund: (state) => {
            if (!state.currentOrder) return false
            return state.currentOrder.status === 'PAID' &&
                state.currentOrder.refundableAmount > 0
        },

        // 是否可关闭
        canClose: (state) => {
            if (!state.currentOrder) return false
            return state.currentOrder.status === 'PENDING'
        }
    },

    actions: {
        // 获取订单列表
        async fetchOrderList(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.queryParams, ...params }
                this.queryParams = queryParams

                const response = await getOrderList(queryParams)
                this.orderList = response.list
                this.total = response.total

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取订单详情
        async fetchOrderDetail(id) {
            try {
                this.loading = true
                const response = await getOrderDetail(id)
                this.currentOrder = response

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 关闭订单
        async closeOrder(orderId, reason) {
            try {
                this.loading = true
                const response = await closeOrder(orderId, reason)

                // 更新订单状态
                if (this.currentOrder && this.currentOrder.id === orderId) {
                    this.currentOrder.status = 'CLOSED'
                    this.currentOrder.closeReason = reason
                }

                // 更新订单列表中的状态
                const index = this.orderList.findIndex(item => item.id === orderId)
                if (index !== -1) {
                    this.orderList[index].status = 'CLOSED'
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 订单退款
        async refundOrder(data) {
            try {
                this.loading = true
                const response = await refundOrder(data)

                // 更新当前订单的可退款金额
                if (this.currentOrder && this.currentOrder.id === data.orderId) {
                    this.currentOrder.refundableAmount -= data.amount
                    this.currentOrder.refundedAmount += data.amount

                    // 如果全额退款，更新订单状态为已退款
                    if (this.currentOrder.refundableAmount <= 0) {
                        this.currentOrder.status = 'REFUNDED'
                    } else {
                        this.currentOrder.status = 'PARTIAL_REFUNDED'
                    }
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取订单统计数据
        async fetchOrderStatistics() {
            try {
                const response = await getOrderStatistics()
                this.statistics = response

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            }
        },

        // 重置查询参数
        resetQueryParams() {
            this.queryParams = {
                page: 1,
                limit: 20,
                orderId: '',
                merchantId: '',
                status: [],
                channel: [],
                startTime: '',
                endTime: '',
                minAmount: '',
                maxAmount: ''
            }
        }
    }
}) 