<template>
  <div class="alerts-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="searchFormRef" :inline="true">
        <el-form-item label="告警级别" prop="level">
          <el-select v-model="queryParams.level" placeholder="请选择告警级别" clearable>
            <el-option label="严重" value="CRITICAL" />
            <el-option label="警告" value="WARNING" />
            <el-option label="信息" value="INFO" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="未处理" value="UNHANDLED" />
            <el-option label="已处理" value="HANDLED" />
            <el-option label="已忽略" value="IGNORED" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" :default-time="['00:00:00', '23:59:59']" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 告警统计区域 -->
    <el-row :gutter="20" class="alert-stats">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-number">{{ alertStats.totalCount || 0 }}</div>
          <div class="stat-title">总告警数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card critical">
          <div class="stat-number">{{ alertStats.criticalCount || 0 }}</div>
          <div class="stat-title">严重告警</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-number">{{ alertStats.warningCount || 0 }}</div>
          <div class="stat-title">警告告警</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card info">
          <div class="stat-number">{{ alertStats.infoCount || 0 }}</div>
          <div class="stat-title">信息告警</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警列表区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>系统告警列表</span>
          <div class="button-group">
            <el-button type="danger" @click="handleBatchHandle">批量处理</el-button>
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="alertList" border stripe style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="time" label="告警时间" width="170" sortable />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="scope">
            <el-tag :type="getAlertLevelType(scope.row.level)">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="150" />
        <el-table-column prop="message" label="告警内容" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getAlertStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handleTime" label="处理时间" width="170" />
        <el-table-column prop="handler" label="处理人" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === '未处理'" type="primary" link @click="handleAlert(scope.row)">处理</el-button>
            <el-button v-if="scope.row.status === '未处理'" type="info" link @click="ignoreAlert(scope.row)">忽略</el-button>
            <el-button type="primary" link @click="viewAlertDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination class="pagination" v-model:current-page="queryParams.page" v-model:page-size="queryParams.limit" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>

    <!-- 处理告警弹窗 -->
    <el-dialog title="处理告警" v-model="handleDialogVisible" width="550px">
      <el-form ref="handleFormRef" :model="handleForm" :rules="handleRules" label-width="100px">
        <el-form-item label="告警内容">
          <div class="alert-message">{{ handleForm.message }}</div>
        </el-form-item>
        <el-form-item label="告警级别">
          <el-tag :type="getAlertLevelType(handleForm.level)">{{ handleForm.level }}</el-tag>
        </el-form-item>
        <el-form-item label="告警来源">
          <span>{{ handleForm.source }}</span>
        </el-form-item>
        <el-form-item label="告警时间">
          <span>{{ handleForm.time }}</span>
        </el-form-item>
        <el-form-item label="处理方式" prop="handleType">
          <el-radio-group v-model="handleForm.handleType">
            <el-radio label="FIX">已修复</el-radio>
            <el-radio label="TEMP_FIX">暂时修复</el-radio>
            <el-radio label="NO_PROBLEM">非问题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注" prop="remark">
          <el-input type="textarea" v-model="handleForm.remark" placeholder="请输入处理备注" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitHandleForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 告警详情弹窗 -->
    <el-dialog title="告警详情" v-model="detailDialogVisible" width="700px">
      <el-descriptions border :column="1">
        <el-descriptions-item label="告警ID">{{ alertDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="告警内容">{{ alertDetail.message }}</el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :type="getAlertLevelType(alertDetail.level)">{{ alertDetail.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警来源">{{ alertDetail.source }}</el-descriptions-item>
        <el-descriptions-item label="告警类型">{{ alertDetail.type }}</el-descriptions-item>
        <el-descriptions-item label="告警时间">{{ alertDetail.time }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getAlertStatusType(alertDetail.status)">{{ alertDetail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.handleTime" label="处理时间">
          {{ alertDetail.handleTime }}
        </el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.handler" label="处理人">
          {{ alertDetail.handler }}
        </el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.handleType" label="处理方式">
          {{ getHandleTypeName(alertDetail.handleType) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.remark" label="处理备注">
          {{ alertDetail.remark }}
        </el-descriptions-item>
        <el-descriptions-item label="目标对象">{{ alertDetail.targetObject }}</el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.metric" label="监控指标">
          {{ alertDetail.metric }}
        </el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.threshold" label="阈值">
          {{ alertDetail.threshold }}
        </el-descriptions-item>
        <el-descriptions-item v-if="alertDetail.actualValue" label="实际值">
          {{ alertDetail.actualValue }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 批量处理弹窗 -->
    <el-dialog title="批量处理告警" v-model="batchDialogVisible" width="500px">
      <div v-if="selectedAlerts.length === 0" class="no-selected">请先选择需要批量处理的告警</div>
      <template v-else>
        <div class="selected-info">
          <el-alert title="批量处理将为所有选中的告警应用相同的处理方式" type="warning" show-icon :closable="false" />
        </div>
        <el-form ref="batchFormRef" :model="batchForm" :rules="handleRules" label-width="100px" style="margin-top: 20px">
          <el-form-item label="选中数量">
            <span>{{ selectedAlerts.length }} 条告警</span>
          </el-form-item>
          <el-form-item label="处理方式" prop="handleType">
            <el-radio-group v-model="batchForm.handleType">
              <el-radio label="FIX">已修复</el-radio>
              <el-radio label="TEMP_FIX">暂时修复</el-radio>
              <el-radio label="NO_PROBLEM">非问题</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理备注" prop="remark">
            <el-input type="textarea" v-model="batchForm.remark" placeholder="请输入处理备注" :rows="4" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="selectedAlerts.length === 0" @click="submitBatchForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMonitorStore } from '@/stores/monitor'

const monitorStore = useMonitorStore()
const loading = computed(() => monitorStore.loading)

// 日期范围
const dateRange = ref([])

// 告警列表数据
const alertList = computed(() => monitorStore.alerts)
const total = computed(() => monitorStore.alertTotal)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  level: '',
  status: '',
  startTime: '',
  endTime: ''
})

// 监听日期范围变化
watch(dateRange, val => {
  queryParams.startTime = val ? val[0] : ''
  queryParams.endTime = val ? val[1] : ''
})

// 弹窗控制
const handleDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const searchFormRef = ref(null)
const handleFormRef = ref(null)
const batchFormRef = ref(null)

// 告警统计数据
const alertStats = reactive({
  totalCount: 0,
  criticalCount: 0,
  warningCount: 0,
  infoCount: 0
})

// 选中的告警
const selectedAlerts = ref([])

// 处理表单数据
const handleForm = reactive({
  id: '',
  message: '',
  level: '',
  source: '',
  time: '',
  handleType: '',
  remark: ''
})

// 批量处理表单数据
const batchForm = reactive({
  alertIds: [],
  handleType: 'FIX',
  remark: ''
})

// 告警详情数据
const alertDetail = reactive({})

// 表单验证规则
const handleRules = {
  handleType: [{ required: true, message: '请选择处理方式', trigger: 'change' }],
  remark: [
    { required: true, message: '请输入处理备注', trigger: 'blur' },
    { min: 5, message: '备注至少需要5个字符', trigger: 'blur' }
  ]
}

// 获取告警级别对应的类型
const getAlertLevelType = level => {
  const typeMap = {
    严重: 'danger',
    警告: 'warning',
    信息: 'info',
    CRITICAL: 'danger',
    WARNING: 'warning',
    INFO: 'info'
  }
  return typeMap[level] || 'info'
}

// 获取告警状态对应的类型
const getAlertStatusType = status => {
  const typeMap = {
    未处理: 'danger',
    已处理: 'success',
    已忽略: 'info',
    UNHANDLED: 'danger',
    HANDLED: 'success',
    IGNORED: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取处理方式名称
const getHandleTypeName = type => {
  const typeMap = {
    FIX: '已修复',
    TEMP_FIX: '暂时修复',
    NO_PROBLEM: '非问题'
  }
  return typeMap[type] || type
}

// 加载告警列表
const fetchAlertList = async () => {
  try {
    await monitorStore.fetchAlertList(queryParams)
    calculateAlertStats()
  } catch (error) {
    console.error('获取告警列表失败:', error)
  }
}

// 计算告警统计数据
const calculateAlertStats = () => {
  const list = alertList.value

  // 重置统计数据
  alertStats.totalCount = total.value
  alertStats.criticalCount = list.filter(item => item.level === '严重' || item.level === 'CRITICAL').length
  alertStats.warningCount = list.filter(item => item.level === '警告' || item.level === 'WARNING').length
  alertStats.infoCount = list.filter(item => item.level === '信息' || item.level === 'INFO').length
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  fetchAlertList()
}

// 重置查询
const resetQuery = () => {
  searchFormRef.value?.resetFields()
  dateRange.value = []
  monitorStore.resetQueryParams()
  fetchAlertList()
}

// 处理单个告警
const handleAlert = row => {
  Object.assign(handleForm, {
    id: row.id,
    message: row.message,
    level: row.level,
    source: row.source,
    time: row.time,
    handleType: '',
    remark: ''
  })
  handleDialogVisible.value = true
}

// 忽略告警
const ignoreAlert = row => {
  ElMessageBox.confirm(`确定要忽略告警"${row.message}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await monitorStore.handleAlert(row.id, {
        handleType: 'IGNORE',
        remark: '手动忽略',
        handler: '当前用户'
      })
      ElMessage.success('告警已忽略')
      fetchAlertList()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

// 查看告警详情
const viewAlertDetail = row => {
  // 实际开发中这里应该调用接口获取详情
  Object.assign(alertDetail, row)
  detailDialogVisible.value = true
}

// 提交处理告警表单
const submitHandleForm = () => {
  handleFormRef.value.validate(async valid => {
    if (valid) {
      try {
        await monitorStore.handleAlert(handleForm.id, {
          handleType: handleForm.handleType,
          remark: handleForm.remark,
          handler: '当前用户' // 实际开发中应该从用户store中获取当前用户名
        })
        ElMessage.success('处理成功')
        handleDialogVisible.value = false
        fetchAlertList()
      } catch (error) {
        ElMessage.error('处理失败')
      }
    }
  })
}

// 表格选择项发生变化
const handleSelectionChange = selection => {
  selectedAlerts.value = selection
}

// 打开批量处理弹窗
const handleBatchHandle = () => {
  batchForm.alertIds = selectedAlerts.value.map(item => item.id)
  batchForm.handleType = 'FIX'
  batchForm.remark = ''
  batchDialogVisible.value = true
}

// 提交批量处理表单
const submitBatchForm = () => {
  if (selectedAlerts.value.length === 0) {
    ElMessage.warning('请至少选择一条告警')
    return
  }

  batchFormRef.value.validate(async valid => {
    if (valid) {
      try {
        // 实际开发中这里应该调用批量处理的API
        ElMessage.success('批量处理成功')
        batchDialogVisible.value = false
        fetchAlertList()
      } catch (error) {
        ElMessage.error('处理失败')
      }
    }
  })
}

// 刷新告警列表
const handleRefresh = () => {
  fetchAlertList()
}

// 处理分页大小改变
const handleSizeChange = val => {
  queryParams.limit = val
  fetchAlertList()
}

// 处理页码改变
const handleCurrentChange = val => {
  queryParams.page = val
  fetchAlertList()
}

onMounted(() => {
  fetchAlertList()
})
</script>

<style lang="scss" scoped>
.alerts-container {
  padding: 20px;

  .search-card {
    margin-bottom: 20px;
  }

  .alert-stats {
    margin-bottom: 20px;

    .stat-card {
      text-align: center;
      padding: 20px 0;

      .stat-number {
        font-size: 32px;
        font-weight: bold;
      }

      .stat-title {
        margin-top: 10px;
        color: #666;
      }

      &.critical {
        .stat-number {
          color: #f56c6c;
        }
      }

      &.warning {
        .stat-number {
          color: #e6a23c;
        }
      }

      &.info {
        .stat-number {
          color: #909399;
        }
      }
    }
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

  .alert-message {
    padding: 10px;
    background-color: #f8f8f8;
    border-radius: 4px;
  }

  .no-selected {
    text-align: center;
    color: #909399;
    padding: 30px 0;
  }

  .selected-info {
    margin-bottom: 20px;
  }
}
</style>
