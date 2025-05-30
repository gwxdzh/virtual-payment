<template>
  <div class="account-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="searchFormRef" :inline="true">
        <el-form-item label="账户ID" prop="accountId">
          <el-input v-model="queryParams.accountId" placeholder="请输入账户ID" clearable />
        </el-form-item>
        <el-form-item label="商户ID" prop="merchantId">
          <el-input v-model="queryParams.merchantId" placeholder="请输入商户ID" clearable />
        </el-form-item>
        <el-form-item label="账户状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="正常" value="ACTIVE" />
            <el-option label="冻结" value="FROZEN" />
            <el-option label="关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账户列表区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>账户列表</span>
          <div class="button-group">
            <el-button type="success" @click="handleExport">导出</el-button>
            <el-button type="primary" @click="handleRefresh">刷新余额</el-button>
          </div>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="accountList" border stripe style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column prop="accountId" label="账户ID" width="180">
          <template #default="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.accountId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="merchantId" label="商户ID" width="180" />
        <el-table-column prop="merchantName" label="商户名称" width="180" />
        <el-table-column prop="accountType" label="账户类型" width="120">
          <template #default="scope">
            <el-tag size="small" :type="getAccountTypeType(scope.row.accountType)">
              {{ getAccountTypeName(scope.row.accountType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="availableBalance" label="可用余额" width="150">
          <template #default="scope">
            {{ formatMoney(scope.row.availableBalance) }}
          </template>
        </el-table-column>
        <el-table-column prop="frozenBalance" label="冻结余额" width="150">
          <template #default="scope">
            {{ formatMoney(scope.row.frozenBalance) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalBalance" label="总余额" width="150">
          <template #default="scope">
            {{ formatMoney((scope.row.availableBalance || 0) + (scope.row.frozenBalance || 0)) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'FROZEN' ? 'warning' : 'info'">
              {{ scope.row.status === 'ACTIVE' ? '正常' : scope.row.status === 'FROZEN' ? '冻结' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleView(scope.row)">详情</el-button>
            <el-button type="warning" link @click="handleFreeze(scope.row)">冻结资金</el-button>
            <el-button type="success" link @click="handleUnfreeze(scope.row)">解冻资金</el-button>
            <el-button type="info" link @click="handleHistory(scope.row)">账户流水</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination class="pagination" v-model:current-page="queryParams.page" v-model:page-size="queryParams.limit" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>

    <!-- 账户详情弹窗 -->
    <el-dialog title="账户详情" v-model="detailDialogVisible" width="700px" append-to-body>
      <el-descriptions border :column="2">
        <el-descriptions-item label="账户ID" :span="2">{{ accountDetail.accountId }}</el-descriptions-item>
        <el-descriptions-item label="商户ID">{{ accountDetail.merchantId }}</el-descriptions-item>
        <el-descriptions-item label="商户名称">{{ accountDetail.merchantName }}</el-descriptions-item>
        <el-descriptions-item label="账户类型">
          <el-tag size="small" :type="getAccountTypeType(accountDetail.accountType)">
            {{ getAccountTypeName(accountDetail.accountType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账户状态">
          <el-tag :type="accountDetail.status === 'ACTIVE' ? 'success' : accountDetail.status === 'FROZEN' ? 'warning' : 'info'">
            {{ accountDetail.status === 'ACTIVE' ? '正常' : accountDetail.status === 'FROZEN' ? '冻结' : '关闭' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="可用余额">{{ formatMoney(accountDetail.availableBalance) }}</el-descriptions-item>
        <el-descriptions-item label="冻结余额">{{ formatMoney(accountDetail.frozenBalance) }}</el-descriptions-item>
        <el-descriptions-item label="总余额">{{ formatMoney((accountDetail.availableBalance || 0) + (accountDetail.frozenBalance || 0)) }}</el-descriptions-item>
        <el-descriptions-item label="最近操作人">{{ accountDetail.lastOperator || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ accountDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ accountDetail.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ accountDetail.remark || '无' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-actions">
        <el-button type="warning" @click="handleFreeze({ ...accountDetail })">冻结资金</el-button>
        <el-button type="success" @click="handleUnfreeze({ ...accountDetail })">解冻资金</el-button>
        <el-button type="info" @click="handleHistory({ ...accountDetail })">账户流水</el-button>
      </div>
    </el-dialog>

    <!-- 冻结资金弹窗 -->
    <el-dialog title="冻结资金" v-model="freezeDialogVisible" width="500px" append-to-body>
      <el-form :model="freezeForm" ref="freezeFormRef" :rules="freezeRules" label-width="100px">
        <el-form-item label="账户ID">
          <span>{{ freezeForm.accountId }}</span>
        </el-form-item>
        <el-form-item label="商户名称">
          <span>{{ freezeForm.merchantName }}</span>
        </el-form-item>
        <el-form-item label="可用余额">
          <span>{{ formatMoney(freezeForm.availableBalance) }}</span>
        </el-form-item>
        <el-form-item label="冻结金额" prop="amount">
          <el-input-number v-model="freezeForm.amount" :min="0.01" :max="freezeForm.availableBalance" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="冻结原因" prop="reason">
          <el-select v-model="freezeForm.reason" placeholder="请选择冻结原因" style="width: 100%">
            <el-option label="交易风控" value="RISK_CONTROL" />
            <el-option label="账户异常" value="ACCOUNT_ABNORMAL" />
            <el-option label="司法冻结" value="LEGAL_FREEZE" />
            <el-option label="其他原因" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="freezeForm.remark" type="textarea" :rows="3" placeholder="请输入冻结备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="freezeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFreezeForm">确定冻结</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 解冻资金弹窗 -->
    <el-dialog title="解冻资金" v-model="unfreezeDialogVisible" width="500px" append-to-body>
      <el-form :model="unfreezeForm" ref="unfreezeFormRef" :rules="unfreezeRules" label-width="100px">
        <el-form-item label="账户ID">
          <span>{{ unfreezeForm.accountId }}</span>
        </el-form-item>
        <el-form-item label="商户名称">
          <span>{{ unfreezeForm.merchantName }}</span>
        </el-form-item>
        <el-form-item label="冻结余额">
          <span>{{ formatMoney(unfreezeForm.frozenBalance) }}</span>
        </el-form-item>
        <el-form-item label="解冻金额" prop="amount">
          <el-input-number v-model="unfreezeForm.amount" :min="0.01" :max="unfreezeForm.frozenBalance" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="解冻原因" prop="reason">
          <el-select v-model="unfreezeForm.reason" placeholder="请选择解冻原因" style="width: 100%">
            <el-option label="风控审核通过" value="RISK_PASS" />
            <el-option label="账户恢复正常" value="ACCOUNT_NORMAL" />
            <el-option label="司法解冻" value="LEGAL_UNFREEZE" />
            <el-option label="其他原因" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="unfreezeForm.remark" type="textarea" :rows="3" placeholder="请输入解冻备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="unfreezeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUnfreezeForm">确定解冻</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 账户流水弹窗 -->
    <el-dialog title="账户流水记录" v-model="historyDialogVisible" width="900px" append-to-body>
      <div class="history-filter">
        <el-form :inline="true" :model="historyQueryParams">
          <el-form-item label="操作类型">
            <el-select v-model="historyQueryParams.operationType" placeholder="请选择操作类型" clearable multiple>
              <el-option label="收入" value="INCOME" />
              <el-option label="支出" value="EXPENSE" />
              <el-option label="冻结" value="FREEZE" />
              <el-option label="解冻" value="UNFREEZE" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker v-model="historyDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD HH:mm:ss" :default-time="['00:00:00', '23:59:59']" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleHistoryQuery">查询</el-button>
            <el-button @click="resetHistoryQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="accountHistory" border stripe style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column prop="recordId" label="流水号" width="180" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="getOperationTypeType(scope.row.operationType)">
              {{ getOperationTypeName(scope.row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="scope">
            <span :class="{ income: scope.row.operationType === 'INCOME', expense: scope.row.operationType === 'EXPENSE' }">
              {{ formatMoneyWithSign(scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceAfter" label="操作后余额" width="120">
          <template #default="scope">
            {{ formatMoney(scope.row.balanceAfter) }}
          </template>
        </el-table-column>
        <el-table-column prop="relatedId" label="关联订单号" width="180" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="createTime" label="操作时间" width="160" />
      </el-table>

      <el-pagination
        class="history-pagination"
        v-model:current-page="historyQueryParams.page"
        v-model:page-size="historyQueryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="historyTotal"
        @size-change="handleHistorySizeChange"
        @current-change="handleHistoryCurrentChange"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const loading = computed(() => accountStore.loading)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  accountId: '',
  merchantId: '',
  status: ''
})

// 表格数据
const accountList = computed(() => accountStore.accounts)
const total = computed(() => accountStore.accountTotal)

// 账户历史流水数据
const accountHistory = computed(() => accountStore.accountHistory)
const historyTotal = computed(() => accountStore.historyTotal)

// 历史查询参数
const historyDateRange = ref([])
const historyQueryParams = reactive({
  page: 1,
  limit: 20,
  accountId: '',
  operationType: [],
  startTime: '',
  endTime: ''
})

watch(historyDateRange, val => {
  historyQueryParams.startTime = val ? val[0] : ''
  historyQueryParams.endTime = val ? val[1] : ''
})

// 弹窗控制
const detailDialogVisible = ref(false)
const freezeDialogVisible = ref(false)
const unfreezeDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const accountDetail = reactive({})
const searchFormRef = ref(null)
const freezeFormRef = ref(null)
const unfreezeFormRef = ref(null)

// 冻结表单
const freezeForm = reactive({
  accountId: '',
  merchantName: '',
  availableBalance: 0,
  amount: 0,
  reason: '',
  remark: ''
})

// 解冻表单
const unfreezeForm = reactive({
  accountId: '',
  merchantName: '',
  frozenBalance: 0,
  amount: 0,
  reason: '',
  remark: ''
})

// 表单验证规则
const freezeRules = {
  amount: [
    { required: true, message: '请输入冻结金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '冻结金额必须大于0', trigger: 'blur' }
  ],
  reason: [{ required: true, message: '请选择冻结原因', trigger: 'change' }]
}

const unfreezeRules = {
  amount: [
    { required: true, message: '请输入解冻金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '解冻金额必须大于0', trigger: 'blur' }
  ],
  reason: [{ required: true, message: '请选择解冻原因', trigger: 'change' }]
}

// 初始化数据
onMounted(async () => {
  await fetchAccountList()
})

// 查询账户列表
const fetchAccountList = async () => {
  await accountStore.fetchAccountList(queryParams)
}

// 处理查询
const handleQuery = () => {
  queryParams.page = 1
  fetchAccountList()
}

// 重置查询
const resetQuery = () => {
  searchFormRef.value?.resetFields()
  accountStore.resetQueryParams()
  fetchAccountList()
}

// 处理查看
const handleView = async row => {
  try {
    const detail = await accountStore.fetchAccountDetail(row.accountId)
    Object.assign(accountDetail, detail)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取账户详情失败')
  }
}

// 处理冻结资金
const handleFreeze = row => {
  freezeForm.accountId = row.accountId
  freezeForm.merchantName = row.merchantName
  freezeForm.availableBalance = row.availableBalance
  freezeForm.amount = 0
  freezeForm.reason = ''
  freezeForm.remark = ''
  freezeDialogVisible.value = true
}

// 提交冻结表单
const submitFreezeForm = () => {
  freezeFormRef.value.validate(async valid => {
    if (valid) {
      if (freezeForm.amount <= 0 || freezeForm.amount > freezeForm.availableBalance) {
        ElMessage.error('冻结金额必须大于0且不能超过可用余额')
        return
      }

      // 二次确认
      try {
        await ElMessageBox.confirm(`确定要冻结账户 ${freezeForm.accountId} 的 ${formatMoney(freezeForm.amount)} 资金吗？`, '操作确认', { type: 'warning', confirmButtonText: '确定冻结', cancelButtonText: '取消' })

        await accountStore.freezeAmount({
          accountId: freezeForm.accountId,
          amount: freezeForm.amount,
          reason: freezeForm.reason,
          remark: freezeForm.remark
        })

        ElMessage.success('资金冻结成功')
        freezeDialogVisible.value = false
        fetchAccountList()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('资金冻结失败')
        }
      }
    }
  })
}

// 处理解冻资金
const handleUnfreeze = row => {
  unfreezeForm.accountId = row.accountId
  unfreezeForm.merchantName = row.merchantName
  unfreezeForm.frozenBalance = row.frozenBalance
  unfreezeForm.amount = 0
  unfreezeForm.reason = ''
  unfreezeForm.remark = ''
  unfreezeDialogVisible.value = true
}

// 提交解冻表单
const submitUnfreezeForm = () => {
  unfreezeFormRef.value.validate(async valid => {
    if (valid) {
      if (unfreezeForm.amount <= 0 || unfreezeForm.amount > unfreezeForm.frozenBalance) {
        ElMessage.error('解冻金额必须大于0且不能超过冻结余额')
        return
      }

      // 二次确认
      try {
        await ElMessageBox.confirm(`确定要解冻账户 ${unfreezeForm.accountId} 的 ${formatMoney(unfreezeForm.amount)} 资金吗？`, '操作确认', { type: 'warning', confirmButtonText: '确定解冻', cancelButtonText: '取消' })

        await accountStore.unfreezeAmount({
          accountId: unfreezeForm.accountId,
          amount: unfreezeForm.amount,
          reason: unfreezeForm.reason,
          remark: unfreezeForm.remark
        })

        ElMessage.success('资金解冻成功')
        unfreezeDialogVisible.value = false
        fetchAccountList()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('资金解冻失败')
        }
      }
    }
  })
}

// 处理账户流水查询
const handleHistory = row => {
  historyQueryParams.accountId = row.accountId
  historyQueryParams.page = 1
  historyQueryParams.limit = 20
  historyQueryParams.operationType = []
  historyDateRange.value = []
  historyQueryParams.startTime = ''
  historyQueryParams.endTime = ''

  fetchAccountHistory()
  historyDialogVisible.value = true
}

// 查询账户历史记录
const fetchAccountHistory = async () => {
  await accountStore.fetchAccountHistory(historyQueryParams)
}

// 处理历史记录查询
const handleHistoryQuery = () => {
  historyQueryParams.page = 1
  fetchAccountHistory()
}

// 重置历史记录查询
const resetHistoryQuery = () => {
  historyQueryParams.operationType = []
  historyDateRange.value = []
  historyQueryParams.startTime = ''
  historyQueryParams.endTime = ''
  accountStore.resetHistoryQueryParams()
  fetchAccountHistory()
}

// 处理分页大小改变
const handleSizeChange = val => {
  queryParams.limit = val
  fetchAccountList()
}

// 处理页码改变
const handleCurrentChange = val => {
  queryParams.page = val
  fetchAccountList()
}

// 处理历史记录分页大小改变
const handleHistorySizeChange = val => {
  historyQueryParams.limit = val
  fetchAccountHistory()
}

// 处理历史记录页码改变
const handleHistoryCurrentChange = val => {
  historyQueryParams.page = val
  fetchAccountHistory()
}

// 处理导出
const handleExport = () => {
  ElMessageBox.confirm('确认导出账户数据?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 导出逻辑
      ElMessage.success('导出成功')
    })
    .catch(() => {})
}

// 处理刷新余额
const handleRefresh = async () => {
  try {
    await fetchAccountList()
    ElMessage.success('余额刷新成功')
  } catch (error) {
    ElMessage.error('余额刷新失败')
  }
}

// 获取账户类型名称
const getAccountTypeName = type => {
  const typeMap = {
    MERCHANT: '商户账户',
    PERSONAL: '个人账户',
    PLATFORM: '平台账户'
  }
  return typeMap[type] || type
}

// 获取账户类型对应样式
const getAccountTypeType = type => {
  const typeMap = {
    MERCHANT: 'primary',
    PERSONAL: 'success',
    PLATFORM: 'warning'
  }
  return typeMap[type] || ''
}

// 获取操作类型名称
const getOperationTypeName = type => {
  const typeMap = {
    INCOME: '收入',
    EXPENSE: '支出',
    FREEZE: '冻结',
    UNFREEZE: '解冻'
  }
  return typeMap[type] || type
}

// 获取操作类型对应样式
const getOperationTypeType = type => {
  const typeMap = {
    INCOME: 'success',
    EXPENSE: 'danger',
    FREEZE: 'warning',
    UNFREEZE: 'info'
  }
  return typeMap[type] || ''
}

// 格式化金额
const formatMoney = amount => {
  if (amount === undefined || amount === null) return '¥0.00'
  return `¥${parseFloat(amount).toFixed(2)}`
}

// 格式化带正负号的金额
const formatMoneyWithSign = record => {
  const amount = record.amount
  if (amount === undefined || amount === null) return '¥0.00'

  if (record.operationType === 'INCOME' || record.operationType === 'UNFREEZE') {
    return `+${formatMoney(amount)}`
  } else if (record.operationType === 'EXPENSE' || record.operationType === 'FREEZE') {
    return `-${formatMoney(amount)}`
  }
  return formatMoney(amount)
}
</script>

<style lang="scss" scoped>
.account-container {
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

  .detail-actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 15px;
  }

  .history-filter {
    margin-bottom: 20px;
  }

  .history-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .income {
    color: var(--color-success);
    font-weight: bold;
  }

  .expense {
    color: var(--color-danger);
    font-weight: bold;
  }
}
</style>
