<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">403</h1>
      <div class="error-message">抱歉，您没有访问该页面的权限</div>
      <div class="error-desc">如需访问，请联系系统管理员授权</div>
      <el-button type="primary" @click="goBack">返回上一页</el-button>
      <el-button @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style lang="scss" scoped>
.error-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;

  .error-content {
    text-align: center;

    .error-code {
      font-size: 120px;
      font-weight: bold;
      color: #f56c6c;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .error-message {
      font-size: 24px;
      color: #303133;
      margin-bottom: 12px;
    }

    .error-desc {
      font-size: 16px;
      color: #606266;
      margin-bottom: 24px;
    }

    .el-button {
      margin: 0 10px;
    }
  }
}
</style>
