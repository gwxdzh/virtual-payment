<template>
  <div class="log-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="searchFormRef" :inline="true">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="登录状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAIL" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="queryParams.ip" placeholder="请输入IP地址" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" :default-time="['00:00:00', '23:59:59']" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 登录日志表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>登录日志</span>
          <div class="button-group">
            <el-button type="success" @click="handleExport">导出</el-button>
            <el-button type="danger" @click="handleClear">清空</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="logList" border stripe style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="ip" label="登录IP" width="140" />
        <el-table-column prop="location" label="登录地点" width="150" />
        <el-table-column prop="browser" label="浏览器" width="120" />
        <el-table-column prop="os" label="操作系统" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'">
              {{ scope.row.status === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msg" label="消息" min-width="200" />
        <el-table-column prop="loginTime" label="登录时间" width="170" />
      </el-table>

      <!-- 分页 -->
      <el-pagination class="pagination" v-model:current-page="queryParams.page" v-model:page-size="queryParams.limit" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>

    <!-- 清空确认弹窗 -->
    <el-dialog title="警告" v-model="clearDialogVisible" width="400px">
      <div class="clear-confirm">
        <el-alert title="此操作将永久清空所有登录日志，是否继续?" type="warning" show-icon :closable="false" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="clearDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmClear">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLogStore } from '@/stores/log'
import { exportLoginLogs, clearLogs } from '@/api/log'

const logStore = useLogStore()
const loading = computed(() => logStore.loading)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  username: '',
  status: '',
  ip: '',
  startTime: '',
  endTime: ''
})

// 日期范围
const dateRange = ref([])
watch(dateRange, val => {
  queryParams.startTime = val ? val[0] : ''
  queryParams.endTime = val ? val[1] : ''
})

// 表格数据
const logList = computed(() => logStore.logins)
const total = computed(() => logStore.loginCount)

// 弹窗控制
const clearDialogVisible = ref(false)
const searchFormRef = ref(null)

// 初始化数据
onMounted(async () => {
  await fetchLogList()
})

// 查询登录日志列表
const fetchLogList = async () => {
  try {
    await logStore.fetchLoginLogs(queryParams)
  } catch (error) {
    console.error('获取登录日志失败:', error)
  }
}

// 处理查询
const handleQuery = () => {
  queryParams.page = 1
  fetchLogList()
}

// 重置查询
const resetQuery = () => {
  searchFormRef.value?.resetFields()
  dateRange.value = []
  logStore.resetLoginParams()
  fetchLogList()
}

// 处理导出
const handleExport = () => {
  ElMessageBox.confirm('确认导出登录日志数据?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 导出操作
    exportLoginLogs(queryParams)
      .then(response => {
        // 创建a标签下载
        const blob = new Blob([response])
        const fileName = `登录日志_${new Date().getTime()}.xlsx`
        if ('download' in document.createElement('a')) {
          const link = document.createElement('a')
          link.download = fileName
          link.style.display = 'none'
          link.href = URL.createObjectURL(blob)
          document.body.appendChild(link)
          link.click()
          URL.revokeObjectURL(link.href)
          document.body.removeChild(link)
        } else {
          navigator.msSaveBlob(blob, fileName)
        }
        ElMessage.success('导出成功')
      })
      .catch(() => {
        ElMessage.error('导出失败')
      })
  })
}

// 处理清空
const handleClear = () => {
  clearDialogVisible.value = true
}

// 确认清空
const confirmClear = async () => {
  try {
    await clearLogs({ type: 'login' })
    ElMessage.success('清空成功')
    clearDialogVisible.value = false
    fetchLogList()
  } catch (error) {
    ElMessage.error('清空失败')
  }
}

// 处理分页大小改变
const handleSizeChange = val => {
  queryParams.limit = val
  fetchLogList()
}

// 处理页码改变
const handleCurrentChange = val => {
  queryParams.page = val
  fetchLogList()
}
</script>

<style lang="scss" scoped>
.log-container {
  padding: 20px;

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .clear-confirm {
    padding: 10px 0;
  }
}
</style>
