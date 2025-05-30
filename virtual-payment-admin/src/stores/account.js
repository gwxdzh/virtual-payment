import { defineStore } from 'pinia'
import { getAccountList, getAccountDetail, freezeAmount, unfreezeAmount, getAccountHistory } from '@/api/account'

export const useAccountStore = defineStore('account', {
    state: () => ({
        accountList: [],
        total: 0,
        currentAccount: null,
        accountHistory: [],
        historyTotal: 0,
        loading: false,
        queryParams: {
            page: 1,
            limit: 20,
            accountId: '',
            merchantId: '',
            status: ''
        },
        historyQueryParams: {
            page: 1,
            limit: 20,
            accountId: '',
            startTime: '',
            endTime: '',
            operationType: []
        }
    }),

    getters: {
        // 账户列表
        accounts: (state) => state.accountList,

        // 账户总数
        accountTotal: (state) => state.total,

        // 当前查询参数
        currentQueryParams: (state) => state.queryParams,

        // 当前账户可用余额
        availableBalance: (state) => {
            if (!state.currentAccount) return 0
            return state.currentAccount.availableBalance || 0
        },

        // 当前账户冻结余额
        frozenBalance: (state) => {
            if (!state.currentAccount) return 0
            return state.currentAccount.frozenBalance || 0
        },

        // 当前账户总余额
        totalBalance: (state) => {
            if (!state.currentAccount) return 0
            return (state.currentAccount.availableBalance || 0) +
                (state.currentAccount.frozenBalance || 0)
        }
    },

    actions: {
        // 获取账户列表
        async fetchAccountList(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.queryParams, ...params }
                this.queryParams = queryParams

                const response = await getAccountList(queryParams)
                this.accountList = response.list
                this.total = response.total

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取账户详情
        async fetchAccountDetail(accountId) {
            try {
                this.loading = true
                const response = await getAccountDetail(accountId)
                this.currentAccount = response

                // 设置账户历史查询参数
                this.historyQueryParams = {
                    ...this.historyQueryParams,
                    accountId
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 冻结资金
        async freezeAmount(data) {
            try {
                this.loading = true
                const response = await freezeAmount(data)

                // 更新账户余额
                if (this.currentAccount && this.currentAccount.accountId === data.accountId) {
                    this.currentAccount.availableBalance -= data.amount
                    this.currentAccount.frozenBalance += data.amount
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 解冻资金
        async unfreezeAmount(data) {
            try {
                this.loading = true
                const response = await unfreezeAmount(data)

                // 更新账户余额
                if (this.currentAccount && this.currentAccount.accountId === data.accountId) {
                    this.currentAccount.availableBalance += data.amount
                    this.currentAccount.frozenBalance -= data.amount
                }

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取账户历史记录
        async fetchAccountHistory(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.historyQueryParams, ...params }
                this.historyQueryParams = queryParams

                const response = await getAccountHistory(queryParams)
                this.accountHistory = response.list
                this.historyTotal = response.total

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
                limit: 20,
                accountId: '',
                merchantId: '',
                status: ''
            }
        },

        // 重置历史记录查询参数
        resetHistoryQueryParams() {
            this.historyQueryParams = {
                page: 1,
                limit: 20,
                accountId: this.currentAccount?.accountId || '',
                startTime: '',
                endTime: '',
                operationType: []
            }
        }
    }
}) 