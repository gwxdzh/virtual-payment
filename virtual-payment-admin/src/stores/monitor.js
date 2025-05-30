import { defineStore } from 'pinia'
import { getSystemMetrics, getAlertList, getApiStatistics, getChannelMetrics, handleAlert } from '@/api/monitor'

export const useMonitorStore = defineStore('monitor', {
    state: () => ({
        systemMetrics: {
            cpuUsage: 0,
            memoryUsage: 0,
            dbConnections: 0,
            dbMaxConnections: 100,
            apiResponseTime: 0,
            successRate: 0
        },
        alertList: [],
        alertTotal: 0,
        apiStatistics: [],
        channelMetrics: [],
        loading: false,
        queryParams: {
            page: 1,
            limit: 10,
            level: '',
            status: '',
            startTime: '',
            endTime: ''
        }
    }),

    getters: {
        // 系统指标
        metrics: (state) => state.systemMetrics,

        // 告警列表
        alerts: (state) => state.alertList,

        // 告警数量
        alertCount: (state) => state.alertTotal,

        // 当前查询参数
        currentQueryParams: (state) => state.queryParams
    },

    actions: {
        // 获取系统指标
        async fetchSystemMetrics() {
            try {
                this.loading = true
                const response = await getSystemMetrics()
                this.systemMetrics = response
                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取告警列表
        async fetchAlertList(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.queryParams, ...params }
                this.queryParams = queryParams

                const response = await getAlertList(queryParams)
                this.alertList = response.list
                this.alertTotal = response.total

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取API调用统计
        async fetchApiStatistics(params) {
            try {
                this.loading = true
                const response = await getApiStatistics(params)
                this.apiStatistics = response

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取渠道监控数据
        async fetchChannelMetrics(params) {
            try {
                this.loading = true
                const response = await getChannelMetrics(params)
                this.channelMetrics = response

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 处理告警
        async handleAlert(alertId, data) {
            try {
                this.loading = true
                const response = await handleAlert(alertId, data)

                // 更新告警状态
                const index = this.alertList.findIndex(alert => alert.id === alertId)
                if (index !== -1) {
                    this.alertList[index].status = '已处理'
                    this.alertList[index].handleTime = new Date().toISOString()
                    this.alertList[index].handler = data.handler
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 重置查询参数
        resetQueryParams() {
            this.queryParams = {
                page: 1,
                limit: 10,
                level: '',
                status: '',
                startTime: '',
                endTime: ''
            }
        }
    }
}) 