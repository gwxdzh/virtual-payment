<template>
  <div v-if="!item.hidden">
    <!-- 只有一个子菜单的情况，直接显示 -->
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)" class="sidebar-item-link">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'is-nest': isNest }">
          <el-icon v-if="onlyOneChild.meta.icon" class="menu-icon">
            <component :is="onlyOneChild.meta.icon" />
          </el-icon>
          <template #title>
            <span class="menu-title">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <!-- 多个子菜单的情况，需要显示父级菜单 -->
    <el-sub-menu v-else :index="resolvePath(item.path)" popper-append-to-body>
      <template #title>
        <el-icon v-if="item.meta && item.meta.icon" class="menu-icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span class="menu-title">{{ item.meta.title }}</span>
      </template>
      <sidebar-item v-for="child in item.children" :key="child.path" :is-nest="true" :item="child" :base-path="resolvePath(child.path)" />
    </el-sub-menu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { isExternal } from '@/utils/validate'
import AppLink from './Link.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isNest: {
    type: Boolean,
    default: false
  },
  basePath: {
    type: String,
    default: ''
  }
})

const onlyOneChild = ref(null)

const hasOneShowingChild = (children = [], parent) => {
  if (!children) {
    children = []
  }

  const showingChildren = children.filter(item => {
    if (item.hidden) {
      return false
    } else {
      // 设置 onlyOneChild 用于后续渲染
      onlyOneChild.value = item
      return true
    }
  })

  // 当只有一个子路由可显示时，显示该子路由
  if (showingChildren.length === 1) {
    return true
  }

  // 当没有可显示的子路由时，显示父路由
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }

  return false
}

const resolvePath = routePath => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }

  // 如果路径已经以/开头，则直接使用该路径
  if (routePath.startsWith('/')) {
    return routePath
  }

  // 否则，将basePath和routePath拼接起来
  return props.basePath + '/' + routePath
}
</script>

<style lang="scss" scoped>
.sidebar-item-link {
  display: block;
  width: 100%;
}

.menu-icon {
  margin-right: 10px;
  width: 16px;
  display: inline-block;
  font-size: 18px;
  vertical-align: middle;
}

.menu-title {
  display: inline-block;
  vertical-align: middle;
  font-weight: normal;
  font-size: 14px;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  padding: 0 20px !important;

  &.is-nest {
    padding-left: 40px !important;
  }
}

:deep(.el-sub-menu) {
  .el-sub-menu__title {
    height: 50px;
    line-height: 50px;
    padding: 0 20px !important;
  }
}

:deep(.el-menu-item.is-active) {
  .menu-icon,
  .menu-title {
    color: #fff;
    font-weight: 500;
  }
}
</style>
