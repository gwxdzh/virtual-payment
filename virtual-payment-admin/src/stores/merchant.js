import { defineStore } from 'pinia'
import { getMerchantList, getMerchantDetail, addMerchant, updateMerchant, updateMerchantStatus } from '@/api/merchant'

export const useMerchantStore = defineStore('merchant', {
    state: () => ({
        merchantList: [],
        total: 0,
        currentMerchant: null,
        loading: false,
        queryParams: {
            page: 1,
            limit: 20,
            merchantName: '',
            merchantId: '',
            status: ''
        }
    }),

    getters: {
        // 商户列表
        merchants: (state) => state.merchantList,

        // 商户总数
        merchantTotal: (state) => state.total,

        // 当前查询参数
        currentQueryParams: (state) => state.queryParams
    },

    actions: {
        // 获取商户列表
        async fetchMerchantList(params = {}) {
            try {
                this.loading = true
                const queryParams = { ...this.queryParams, ...params }
                this.queryParams = queryParams

                const response = await getMerchantList(queryParams)
                this.merchantList = response.list
                this.total = response.total

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 获取商户详情
        async fetchMerchantDetail(id) {
            try {
                this.loading = true
                const response = await getMerchantDetail(id)
                this.currentMerchant = response

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 添加商户
        async addMerchant(data) {
            try {
                this.loading = true
                const response = await addMerchant(data)

                // 刷新商户列表
                this.fetchMerchantList()

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 更新商户信息
        async updateMerchant(data) {
            try {
                this.loading = true
                const response = await updateMerchant(data)

                // 如果正在查看的商户被修改，需要更新当前商户
                if (this.currentMerchant && this.currentMerchant.id === data.id) {
                    this.currentMerchant = { ...this.currentMerchant, ...data }
                }

                // 刷新商户列表
                this.fetchMerchantList()

                return Promise.resolve(response)
            } catch (error) {
                return Promise.reject(error)
            } finally {
                this.loading = false
            }
        },

        // 修改商户状态
        async updateMerchantStatus(id, status) {
            try {
                this.loading = true
                const response = await updateMerchantStatus(id, status)

                // 更新商户列表中的状态
                const index = this.merchantList.findIndex(item => item.id === id)
                if (index !== -1) {
                    this.merchantList[index].status = status
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
                limit: 20,
                merchantName: '',
                merchantId: '',
                status: ''
            }
        }
    }
}) 