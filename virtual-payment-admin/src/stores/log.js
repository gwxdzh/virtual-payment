import { defineStore } from 'pinia'
import { getOperationLogs, getLoginLogs, getLogDetail, clearLogs } from '@/api/log'

export const useLogStore = defineStore('log', {
    state: () => ({
        operationLogs: [],
        operationTotal: 0,
        loginLogs: [],
        loginTotal: 0,
        currentLog: null,
        loading: false,
        operationQueryParams: {
            page: 1,
            limit: 20,
            operationType: '',
            operator: '',
            module: '',
            status: '',
            startTime: '',
            endTime: ''
        },
        loginQueryParams: {
            page: 1,
            limit: 20,
            username: '',
            status: '',
            ip: '',
            startTime: '',
            endTime: ''
        }
    }),

    getters: {
        // 操作日志列表
        operations: (state) => state.operationLogs,

        // 操作日志总数
        operationCount: (state) => state.operationTotal,

        // 登录日志列表
        logins: (state) => state.loginLogs,

        // 登录日志总数
        loginCount: (state) => state.loginTotal,

        // 当前操作日志查询参数
        currentOperationParams: (state) => state.operationQueryParams,

        // 当前登录日志查询参数
        currentLoginParams: (state) => state.loginQueryParams
    },

    actions: {
        // 获取操作日志列表
        async fetchOperationLogs(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.operationQueryParams, ...params }
                this.operationQueryParams = queryParams

                const response = await getOperationLogs(queryParams)
                this.operationLogs = response.list
                this.operationTotal = response.total

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取登录日志列表
        async fetchLoginLogs(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.loginQueryParams, ...params }
                this.loginQueryParams = queryParams

                const response = await getLoginLogs(queryParams)
                this.loginLogs = response.list
                this.loginTotal = response.total

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取日志详情
        async fetchLogDetail(logId, type) {
            try {
                this.loading = true
                const response = await getLogDetail(logId, type)
                this.currentLog = response

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 清理日志
        async clearLogs(data) {
            try {
                this.loading = true
                const response = await clearLogs(data)

                // 如果清理的是操作日志，则刷新操作日志列表
                if (data.type === 'operation' || data.type === 'all') {
                    await this.fetchOperationLogs()
                }

                // 如果清理的是登录日志，则刷新登录日志列表
                if (data.type === 'login' || data.type === 'all') {
                    await this.fetchLoginLogs()
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 重置操作日志查询参数
        resetOperationParams() {
            this.operationQueryParams = {
                page: 1,
                limit: 20,
                operationType: '',
                operator: '',
                module: '',
                status: '',
                startTime: '',
                endTime: ''
            }
        },

        // 重置登录日志查询参数
        resetLoginParams() {
            this.loginQueryParams = {
                page: 1,
                limit: 20,
                username: '',
                status: '',
                ip: '',
                startTime: '',
                endTime: ''
            }
        }
    }
}) 