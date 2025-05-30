<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span v-if="item.redirect === 'noRedirect' || index === levelList.length - 1" class="no-redirect">
          {{ item.meta.title }}
        </span>
        <router-link v-else :to="item.redirect || item.path">
          {{ item.meta.title }}
        </router-link>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const levelList = ref([])

// 生成面包屑导航数据
const getBreadcrumb = () => {
  // 面包屑只显示有 meta.title 的路由
  let matched = route.matched.filter(item => item.meta && item.meta.title)

  // 如果不是首页，则需要添加首页
  const first = matched[0]
  if (first && first.path !== '/dashboard') {
    matched = [
      {
        path: '/dashboard',
        meta: { title: '首页' }
      }
    ].concat(matched)
  }

  levelList.value = matched
}

// 监听路由变化
watch(
  () => route.path,
  () => getBreadcrumb(),
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.app-breadcrumb {
  display: inline-block;
  margin-left: 8px;
  line-height: 50px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }

  .el-breadcrumb__inner a {
    color: #606266;
  }
}

.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.5s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
