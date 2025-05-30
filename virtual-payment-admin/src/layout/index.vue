<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <h1 class="title">虚拟支付系统</h1>
      </div>
      <el-scrollbar>
        <el-menu :default-active="activeMenu" :collapse="isCollapse" background-color="#1f2d3d" text-color="#bfcbd9" active-text-color="#ffffff" :collapse-transition="false" router unique-opened>
          <sidebar-item v-for="route in routes" :key="route.path" :item="route" :base-path="route.path" />
        </el-menu>
      </el-scrollbar>
    </div>

    <!-- 主区域 -->
    <div class="main-container">
      <!-- 头部导航 -->
      <div class="navbar">
        <div class="hamburger-container" @click="toggleSidebar">
          <el-icon>
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>
        <breadcrumb />
        <div class="right-menu">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <img :src="userAvatar" class="user-avatar" />
              <span class="user-name">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import SidebarItem from './components/SidebarItem.vue'
import Breadcrumb from './components/Breadcrumb.vue'

const userStore = useUserStore()
const router = useRouter()

// 侧边栏折叠状态
const isCollapse = ref(false)
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 菜单路由
const routes = computed(() => {
  // 如果用户的routes为空，则使用默认路由
  if (userStore.routes && userStore.routes.length > 0) {
    return userStore.routes
  } else {
    // 使用默认路由
    return router.options.routes.filter(route => {
      return route.path === '/'
    })[0].children
  }
})

// 激活的菜单
const activeMenu = computed(() => {
  const { path } = router.currentRoute.value
  return path
})

// 用户信息
const username = computed(() => {
  return userStore.userInfo?.username || '管理员'
})

const userAvatar = computed(() => {
  return userStore.userInfo?.avatar || ''
})

// 退出登录
const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

// 监听菜单折叠状态，调整样式
watch(isCollapse, value => {
  // 通过CSS类控制布局调整
  document.body.classList.toggle('sidebar-collapse', value)
})
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
}

.main-container {
  min-height: 100%;
  margin-left: 220px;
  position: relative;
  transition: margin-left 0.28s;

  .navbar {
    height: 60px;
    display: flex;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid #f0f0f0;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    padding: 0;

    .hamburger-container {
      width: 64px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.3s;
      font-size: 20px;

      &:hover {
        background-color: rgba(0, 0, 0, 0.025);
      }
    }

    .right-menu {
      margin-left: auto;
      padding-right: 24px;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        padding: 0 12px;
        height: 100%;
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background-color: rgba(0, 0, 0, 0.025);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          margin-right: 10px;
          border: 1px solid #eee;
        }

        .user-name {
          margin-right: 10px;
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }

  .app-main {
    padding: 20px;
    min-height: calc(100vh - 60px);
    background-color: #f5f7fa;
    position: relative;
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.5s;
}

.fade-transform-enter-from,
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.sidebar-container {
  transition: width 0.28s;
  width: 220px;
  height: 100%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  background-color: #1f2d3d;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);

  .logo-container {
    height: 60px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b3649;
    overflow: hidden;
    box-shadow: 0 1px 0px 0 rgba(0, 0, 0, 0.1);

    .logo {
      width: 32px;
      height: 32px;
      margin-right: 10px;
      transition: margin-right 0.3s;
    }

    .title {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      white-space: nowrap;
      transition: opacity 0.3s;
    }
  }

  &:hover {
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      &:hover {
        background-color: #263445 !important;
      }
    }
  }

  :deep(.el-menu) {
    border-right: none;
    padding: 8px 0;
  }

  :deep(.el-menu-item.is-active) {
    background-color: #1890ff !important;
    box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
    border-radius: 0 22px 22px 0;
    margin-right: 15px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background-color: #1890ff;
    }
  }
}

// 处理折叠状态
:deep(.el-menu--collapse) {
  width: 64px;

  .el-sub-menu__title,
  .el-menu-item {
    text-align: center;
  }
}

.sidebar-collapse {
  // 折叠时的侧边栏样式
  .sidebar-container {
    width: 64px;

    .logo-container {
      padding: 10px 0;
      justify-content: center;

      .logo {
        margin-right: 0;
      }

      .title {
        display: none;
        opacity: 0;
      }
    }

    :deep(.el-menu-item.is-active) {
      margin-right: 0;
      border-radius: 0;
    }
  }

  // 折叠时主容器样式
  .main-container {
    margin-left: 64px;
  }
}
</style>
