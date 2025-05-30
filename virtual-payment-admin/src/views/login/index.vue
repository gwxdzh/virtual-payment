<template>
  <div class="login-container">
    <div class="login-card">
      <div class="title-container">
        <h3 class="title">虚拟支付系统管理后台</h3>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" type="text" tabindex="1" autocomplete="on" prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" placeholder="密码" :type="passwordType" tabindex="2" autocomplete="on" prefix-icon="Lock" @keyup.enter="handleLogin">
            <template #suffix>
              <el-icon class="cursor-pointer" @click="showPwd">
                <component :is="passwordType === 'password' ? 'Hide' : 'View'" />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button :loading="loading" type="primary" class="login-button" @click="handleLogin"> 登录 </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 路由
const router = useRouter()
const route = useRoute()

// 用户状态管理
const userStore = useUserStore()

// 登录表单
const loginFormRef = ref(null)
const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

// 登录验证规则
const loginRules = reactive({
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
})

// 密码显示状态
const passwordType = ref('password')
const showPwd = () => {
  passwordType.value = passwordType.value === 'password' ? '' : 'password'
}

// 加载状态
const loading = ref(false)

// 处理登录
const handleLogin = async () => {
  try {
    // 表单验证
    await loginFormRef.value.validate()

    loading.value = true
    // 登录请求
    await userStore.login(loginForm)
    // 获取用户信息
    await userStore.fetchUserInfo()
    // 获取菜单权限
    await userStore.fetchMenus()

    ElMessage.success('登录成功')

    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8e9eab, #eef2f3);
  display: flex;
  justify-content: center;
  align-items: center;

  .login-card {
    width: 400px;
    padding: 30px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.1);

    .title-container {
      text-align: center;
      margin-bottom: 30px;

      .title {
        font-size: 22px;
        color: #333;
        font-weight: bold;
      }
    }

    .login-form {
      .login-button {
        width: 100%;
        margin-top: 20px;
      }
    }
  }
}
</style>
