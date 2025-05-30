<template>
  <div class="log-container">
    <router-view />
  </div>
</template>

<script setup>
// 此页面作为日志模块的容器组件，直接显示子路由
</script>

<style lang="scss" scoped>
.log-container {
  width: 100%;
  height: 100%;
}
</style>
