<template>
  <div class="monitor-container">
    <router-view />
  </div>
</template>

<script setup>
// 此页面作为监控模块的容器组件，直接显示子路由
</script>

<style lang="scss" scoped>
.monitor-container {
  width: 100%;
  height: 100%;
}
</style>
