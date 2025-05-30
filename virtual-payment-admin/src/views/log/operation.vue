<template>
  <div class="log-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="searchFormRef" :inline="true">
        <el-form-item label="操作类型" prop="operationType">
          <el-select v-model="queryParams.operationType" placeholder="请选择操作类型" clearable>
            <el-option label="登录" value="LOGIN" />
            <el-option label="查询" value="QUERY" />
            <el-option label="新增" value="INSERT" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="退款" value="REFUND" />
            <el-option label="冻结" value="FREEZE" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="queryParams.operator" placeholder="请输入操作人" clearable />
        </el-form-item>
        <el-form-item label="操作模块" prop="module">
          <el-select v-model="queryParams.module" placeholder="请选择模块" clearable>
            <el-option label="商户管理" value="MERCHANT" />
            <el-option label="订单管理" value="ORDER" />
            <el-option label="账户管理" value="ACCOUNT" />
            <el-option label="系统管理" value="SYSTEM" />
          </el-select>
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

    <!-- 操作日志表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <div class="button-group">
            <el-button type="success" @click="handleExport">导出</el-button>
            <el-button type="danger" @click="handleClear">清空</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="logList" border stripe style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="80" />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="getOperationTypeTag(scope.row.operationType)">
              {{ getOperationTypeName(scope.row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="120">
          <template #default="scope">
            {{ getModuleName(scope.row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="createTime" label="操作时间" width="170" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button type="primary" link @click="handleDetails(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination class="pagination" v-model:current-page="queryParams.page" v-model:page-size="queryParams.limit" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>

    <!-- 日志详情弹窗 -->
    <el-dialog title="日志详情" v-model="detailDialogVisible" width="700px">
      <el-descriptions border :column="2">
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeTag(currentLog.operationType)">
            {{ getOperationTypeName(currentLog.operationType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ getModuleName(currentLog.module) }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.createTime }}</el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="json-content">{{ formatJson(currentLog.requestParam) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="返回结果" :span="2">
          <pre class="json-content">{{ formatJson(currentLog.responseData) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="操作结果" :span="2">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
          <span v-if="currentLog.status === 0" class="error-msg">{{ currentLog.errorMsg }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 清空确认弹窗 -->
    <el-dialog title="警告" v-model="clearDialogVisible" width="400px">
      <div class="clear-confirm">
        <el-alert title="此操作将永久清空所有操作日志，是否继续?" type="warning" show-icon :closable="false" />
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
import { exportOperationLogs, clearLogs } from '@/api/log'

const logStore = useLogStore()
const loading = computed(() => logStore.loading)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  operationType: '',
  operator: '',
  module: '',
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
const logList = computed(() => logStore.operations)
const total = computed(() => logStore.operationCount)

// 弹窗控制
const detailDialogVisible = ref(false)
const clearDialogVisible = ref(false)
const searchFormRef = ref(null)

// 当前日志详情
const currentLog = reactive({})

// 获取操作类型标签类型
const getOperationTypeTag = type => {
  const typeMap = {
    LOGIN: 'success',
    LOGOUT: 'info',
    QUERY: 'info',
    INSERT: 'primary',
    UPDATE: 'warning',
    DELETE: 'danger',
    REFUND: 'danger',
    FREEZE: 'warning'
  }
  return typeMap[type] || 'info'
}

// 获取操作类型名称
const getOperationTypeName = type => {
  const typeMap = {
    LOGIN: '登录',
    LOGOUT: '登出',
    QUERY: '查询',
    INSERT: '新增',
    UPDATE: '修改',
    DELETE: '删除',
    REFUND: '退款',
    FREEZE: '冻结'
  }
  return typeMap[type] || type
}

// 获取模块名称
const getModuleName = module => {
  const moduleMap = {
    SYSTEM: '系统管理',
    MERCHANT: '商户管理',
    ORDER: '订单管理',
    ACCOUNT: '账户管理'
  }
  return moduleMap[module] || module
}

// 格式化JSON显示
const formatJson = jsonStr => {
  if (!jsonStr) return ''
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return jsonStr
  }
}

// 初始化数据
onMounted(async () => {
  await fetchLogList()
})

// 查询操作日志列表
const fetchLogList = async () => {
  try {
    await logStore.fetchOperationLogs(queryParams)
  } catch (error) {
    console.error('获取操作日志失败:', error)
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
  logStore.resetOperationParams()
  fetchLogList()
}

// 查看日志详情
const handleDetails = async row => {
  try {
    const detail = await logStore.fetchLogDetail(row.id, 'operation')
    Object.assign(currentLog, detail)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取日志详情失败')
  }
}

// 处理导出
const handleExport = () => {
  ElMessageBox.confirm('确认导出操作日志数据?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 导出操作
    exportOperationLogs(queryParams)
      .then(response => {
        // 创建a标签下载
        const blob = new Blob([response])
        const fileName = `操作日志_${new Date().getTime()}.xlsx`
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
    await clearLogs({ type: 'operation' })
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

  .json-content {
    padding: 10px;
    background-color: #f8f8f8;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
  }

  .error-msg {
    margin-left: 10px;
    color: #f56c6c;
  }

  .clear-confirm {
    padding: 10px 0;
  }
}
</style>
