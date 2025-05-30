import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const service = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    timeout: 5000,
    withCredentials: true
})

// 请求拦截器：添加 JWT 认证头
service.interceptors.request.use(
    (config) => {
        const userStore = useUserStore()
        if (userStore.token) {
            config.headers.Authorization = `Bearer ${userStore.token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器：处理错误码
service.interceptors.response.use(
    (response) => {
        const { code, data, message } = response.data

        if (!code || !code.endsWith('SUCCESS')) {
            // 处理业务错误（如权限不足、参数错误）
            ElMessage.error(message || response.data.localized_msg?.zh_CN || '请求失败')

            if (code === 'AUTH.EXPIRED') {
                // token 过期，跳转登录页
                const userStore = useUserStore()
                userStore.resetToken()
                useRouter().push('/login?redirect=' + location.pathname)
            }

            return Promise.reject(response.data)
        }

        return data
    },
    (error) => {
        // 处理网络错误（如超时、404）
        ElMessage.error(`请求失败：${error.message}`)
        return Promise.reject(error)
    }
)

export default service 