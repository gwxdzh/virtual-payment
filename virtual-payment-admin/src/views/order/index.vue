<template>
  <div class="order-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="searchFormRef" :inline="true">
        <el-form-item label="订单号" prop="orderId">
          <el-input v-model="queryParams.orderId" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="商户ID" prop="merchantId">
          <el-input v-model="queryParams.merchantId" placeholder="请输入商户ID" clearable />
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable multiple>
            <el-option label="待支付" value="PENDING" />
            <el-option label="已支付" value="PAID" />
            <el-option label="已关闭" value="CLOSED" />
            <el-option label="退款中" value="REFUNDING" />
            <el-option label="已退款" value="REFUNDED" />
            <el-option label="部分退款" value="PARTIAL_REFUNDED" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付渠道" prop="channel">
          <el-select v-model="queryParams.channel" placeholder="请选择渠道" clearable multiple>
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="微信支付" value="WECHAT" />
            <el-option label="银行卡" value="BANK_CARD" />
            <el-option label="余额支付" value="BALANCE" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单时间">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD HH:mm:ss" :default-time="['00:00:00', '23:59:59']" />
        </el-form-item>
        <el-form-item label="金额范围">
          <div class="amount-range">
            <el-input-number v-model="queryParams.minAmount" :min="0" :precision="2" placeholder="最小金额" />
            <span class="range-separator">-</span>
            <el-input-number v-model="queryParams.maxAmount" :min="0" :precision="2" placeholder="最大金额" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="button-group">
            <el-button type="success" @click="handleExport">导出</el-button>
            <el-button type="primary" @click="openStatistics">统计报表</el-button>
          </div>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="orderList" border stripe style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column prop="orderId" label="订单号" width="180">
          <template #default="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.orderId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="merchantId" label="商户ID" width="120" />
        <el-table-column prop="merchantName" label="商户名称" width="150" />
        <el-table-column prop="amount" label="订单金额" width="100">
          <template #default="scope">
            {{ formatMoney(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="支付金额" width="100">
          <template #default="scope">
            {{ formatMoney(scope.row.payAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="refundAmount" label="已退金额" width="100">
          <template #default="scope">
            {{ formatMoney(scope.row.refundAmount || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="支付渠道" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getChannelType(scope.row.channel)">
              {{ getChannelName(scope.row.channel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getStatusType(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="payTime" label="支付时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'PENDING'" type="warning" link @click="handleClose(scope.row)"> 关闭 </el-button>
            <el-button v-if="scope.row.status === 'PAID' || scope.row.status === 'PARTIAL_REFUNDED'" type="danger" link @click="handleRefund(scope.row)"> 退款 </el-button>
            <el-button type="primary" link @click="handleView(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination class="pagination" v-model:current-page="queryParams.page" v-model:page-size="queryParams.limit" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog title="订单详情" v-model="detailDialogVisible" width="700px" append-to-body>
      <el-descriptions border :column="2">
        <el-descriptions-item label="订单号" :span="2">{{ orderDetail.orderId }}</el-descriptions-item>
        <el-descriptions-item label="商户ID">{{ orderDetail.merchantId }}</el-descriptions-item>
        <el-descriptions-item label="商户名称">{{ orderDetail.merchantName }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ formatMoney(orderDetail.amount) }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">{{ formatMoney(orderDetail.payAmount) }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">{{ formatMoney(orderDetail.refundAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="剩余可退款金额">{{ formatMoney(orderDetail.refundableAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="支付渠道">
          <el-tag size="small" :type="getChannelType(orderDetail.channel)">
            {{ getChannelName(orderDetail.channel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag size="small" :type="getStatusType(orderDetail.status)">
            {{ getStatusName(orderDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付渠道订单号">{{ orderDetail.channelOrderId || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="渠道交易号">{{ orderDetail.channelTradeNo || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ orderDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ orderDetail.payTime || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="商户回调URL" :span="2">{{ orderDetail.notifyUrl }}</el-descriptions-item>
        <el-descriptions-item label="商户回调状态">
          <el-tag size="small" :type="orderDetail.notifyStatus === 'SUCCESS' ? 'success' : 'warning'">
            {{ orderDetail.notifyStatus === 'SUCCESS' ? '成功' : '未成功' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="回调次数">{{ orderDetail.notifyCount || 0 }}次</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ orderDetail.remark || '无' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 退款记录 -->
      <div v-if="orderDetail.refundRecords && orderDetail.refundRecords.length > 0" class="refund-records">
        <h3>退款记录</h3>
        <el-table :data="orderDetail.refundRecords" border size="small">
          <el-table-column prop="refundId" label="退款单号" width="180" />
          <el-table-column prop="amount" label="退款金额">
            <template #default="scope">
              {{ formatMoney(scope.row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="退款状态">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.status === 'SUCCESS' ? 'success' : scope.row.status === 'PROCESSING' ? 'warning' : 'danger'">
                {{ scope.row.status === 'SUCCESS' ? '成功' : scope.row.status === 'PROCESSING' ? '处理中' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="退款原因" />
          <el-table-column prop="createTime" label="退款时间" width="160" />
          <el-table-column prop="operatorName" label="操作人" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 关闭订单弹窗 -->
    <el-dialog title="关闭订单" v-model="closeDialogVisible" width="500px" append-to-body>
      <el-form :model="closeForm" ref="closeFormRef" :rules="closeRules" label-width="80px">
        <el-form-item label="订单号">
          <span>{{ closeForm.orderId }}</span>
        </el-form-item>
        <el-form-item label="关闭原因" prop="reason">
          <el-select v-model="closeForm.reason" placeholder="请选择关闭原因" style="width: 100%">
            <el-option label="用户取消" value="USER_CANCEL" />
            <el-option label="超时未支付" value="TIMEOUT" />
            <el-option label="库存不足" value="OUT_OF_STOCK" />
            <el-option label="其他原因" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="closeForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCloseForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 退款弹窗 -->
    <el-dialog title="订单退款" v-model="refundDialogVisible" width="500px" append-to-body>
      <el-form :model="refundForm" ref="refundFormRef" :rules="refundRules" label-width="100px">
        <el-form-item label="订单号">
          <span>{{ refundForm.orderId }}</span>
        </el-form-item>
        <el-form-item label="订单金额">
          <span>{{ formatMoney(refundForm.orderAmount) }}</span>
        </el-form-item>
        <el-form-item label="已退金额">
          <span>{{ formatMoney(refundForm.refundedAmount) }}</span>
        </el-form-item>
        <el-form-item label="可退金额">
          <span>{{ formatMoney(refundForm.refundableAmount) }}</span>
        </el-form-item>
        <el-form-item label="退款金额" prop="amount">
          <el-input-number v-model="refundForm.amount" :min="0.01" :max="refundForm.refundableAmount" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-select v-model="refundForm.reason" placeholder="请选择退款原因" style="width: 100%">
            <el-option label="用户申请退款" value="USER_REQUEST" />
            <el-option label="商品问题" value="PRODUCT_ISSUE" />
            <el-option label="服务问题" value="SERVICE_ISSUE" />
            <el-option label="重复支付" value="DUPLICATE_PAYMENT" />
            <el-option label="其他原因" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="refundForm.remark" type="textarea" :rows="3" placeholder="请输入退款备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRefundForm">确定退款</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 统计报表弹窗 -->
    <el-dialog title="订单统计报表" v-model="statisticsDialogVisible" width="800px" append-to-body>
      <div class="statistics-container">
        <div class="statistics-filters">
          <el-radio-group v-model="statisticsTimeRange" size="small" @change="handleStatisticsRangeChange">
            <el-radio-button label="today">今日</el-radio-button>
            <el-radio-button label="yesterday">昨日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>

          <el-date-picker v-if="statisticsTimeRange === 'custom'" v-model="statisticsDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="handleStatisticsDateChange" style="margin-left: 15px" />
        </div>

        <!-- 统计卡片 -->
        <el-row :gutter="20" class="statistics-cards">
          <el-col :span="6">
            <el-card shadow="hover">
              <template #header>订单总数</template>
              <div class="statistics-value">{{ statisticsData.orderCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <template #header>订单总金额</template>
              <div class="statistics-value">{{ formatMoney(statisticsData.totalAmount || 0) }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <template #header>成功订单数</template>
              <div class="statistics-value">{{ statisticsData.successCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <template #header>退款金额</template>
              <div class="statistics-value">{{ formatMoney(statisticsData.refundAmount || 0) }}</div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 渠道分布图 -->
        <div class="chart-container">
          <div id="channel-chart" style="width: 100%; height: 300px"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '@/stores/order'
import * as echarts from 'echarts'

const orderStore = useOrderStore()
const loading = computed(() => orderStore.loading)

// 日期范围
const dateRange = ref([])
watch(dateRange, val => {
  queryParams.startTime = val ? val[0] : ''
  queryParams.endTime = val ? val[1] : ''
})

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  orderId: '',
  merchantId: '',
  status: [],
  channel: [],
  startTime: '',
  endTime: '',
  minAmount: '',
  maxAmount: ''
})

// 表格数据
const orderList = computed(() => orderStore.orders)
const total = computed(() => orderStore.orderTotal)

// 弹窗控制
const detailDialogVisible = ref(false)
const closeDialogVisible = ref(false)
const refundDialogVisible = ref(false)
const statisticsDialogVisible = ref(false)
const orderDetail = reactive({})
const searchFormRef = ref(null)
const closeFormRef = ref(null)
const refundFormRef = ref(null)

// 关闭订单表单
const closeForm = reactive({
  orderId: '',
  reason: '',
  remark: ''
})

// 退款表单
const refundForm = reactive({
  orderId: '',
  orderAmount: 0,
  refundedAmount: 0,
  refundableAmount: 0,
  amount: 0,
  reason: '',
  remark: ''
})

// 表单验证规则
const closeRules = {
  reason: [{ required: true, message: '请选择关闭原因', trigger: 'change' }]
}

const refundRules = {
  amount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '退款金额必须大于0', trigger: 'blur' }
  ],
  reason: [{ required: true, message: '请选择退款原因', trigger: 'change' }]
}

// 统计数据
const statisticsTimeRange = ref('today')
const statisticsDateRange = ref([])
const statisticsData = reactive({
  orderCount: 0,
  totalAmount: 0,
  successCount: 0,
  refundAmount: 0,
  channelData: []
})
let channelChart = null

// 初始化数据
onMounted(async () => {
  await fetchOrderList()
})

// 查询订单列表
const fetchOrderList = async () => {
  await orderStore.fetchOrderList(queryParams)
}

// 处理查询
const handleQuery = () => {
  queryParams.page = 1
  fetchOrderList()
}

// 重置查询
const resetQuery = () => {
  searchFormRef.value?.resetFields()
  dateRange.value = []
  orderStore.resetQueryParams()
  fetchOrderList()
}

// 处理查看
const handleView = async row => {
  try {
    const detail = await orderStore.fetchOrderDetail(row.id)
    Object.assign(orderDetail, detail)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 处理关闭订单
const handleClose = row => {
  closeForm.orderId = row.orderId
  closeForm.reason = ''
  closeForm.remark = ''
  closeDialogVisible.value = true
}

// 提交关闭订单
const submitCloseForm = () => {
  closeFormRef.value.validate(async valid => {
    if (valid) {
      try {
        await orderStore.closeOrder(closeForm.orderId, {
          reason: closeForm.reason,
          remark: closeForm.remark
        })
        ElMessage.success('订单关闭成功')
        closeDialogVisible.value = false
        fetchOrderList()
      } catch (error) {
        ElMessage.error('订单关闭失败')
      }
    }
  })
}

// 处理退款
const handleRefund = row => {
  refundForm.orderId = row.orderId
  refundForm.orderAmount = row.amount
  refundForm.refundedAmount = row.refundAmount || 0
  refundForm.refundableAmount = row.payAmount - (row.refundAmount || 0)
  refundForm.amount = refundForm.refundableAmount // 默认全额退款
  refundForm.reason = ''
  refundForm.remark = ''
  refundDialogVisible.value = true
}

// 提交退款申请
const submitRefundForm = () => {
  refundFormRef.value.validate(async valid => {
    if (valid) {
      if (refundForm.amount > refundForm.refundableAmount) {
        ElMessage.error('退款金额不能大于可退金额')
        return
      }

      try {
        await orderStore.refundOrder({
          orderId: refundForm.orderId,
          amount: refundForm.amount,
          reason: refundForm.reason,
          remark: refundForm.remark
        })
        ElMessage.success('退款申请提交成功')
        refundDialogVisible.value = false
        fetchOrderList()
      } catch (error) {
        ElMessage.error('退款申请提交失败')
      }
    }
  })
}

// 处理导出
const handleExport = () => {
  ElMessageBox.confirm('确认导出订单数据?', '提示', {
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

// 处理分页大小改变
const handleSizeChange = val => {
  queryParams.limit = val
  fetchOrderList()
}

// 处理页码改变
const handleCurrentChange = val => {
  queryParams.page = val
  fetchOrderList()
}

// 打开统计报表
const openStatistics = async () => {
  statisticsDialogVisible.value = true
  // 加载统计数据
  await loadStatisticsData()
  // 初始化图表
  setTimeout(() => {
    initChannelChart()
  }, 100)
}

// 加载统计数据
const loadStatisticsData = async () => {
  try {
    const params = {}
    if (statisticsTimeRange.value === 'today') {
      params.timeRange = 'TODAY'
    } else if (statisticsTimeRange.value === 'yesterday') {
      params.timeRange = 'YESTERDAY'
    } else if (statisticsTimeRange.value === 'week') {
      params.timeRange = 'THIS_WEEK'
    } else if (statisticsTimeRange.value === 'month') {
      params.timeRange = 'THIS_MONTH'
    } else if (statisticsTimeRange.value === 'custom') {
      params.startDate = statisticsDateRange.value[0]
      params.endDate = statisticsDateRange.value[1]
    }

    const response = await orderStore.fetchOrderStatistics(params)
    statisticsData.orderCount = response.orderCount
    statisticsData.totalAmount = response.totalAmount
    statisticsData.successCount = response.successCount
    statisticsData.refundAmount = response.refundAmount
    statisticsData.channelData = response.channelData
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

// 初始化渠道分布图表
const initChannelChart = () => {
  const chartDom = document.getElementById('channel-chart')
  if (!chartDom) return

  channelChart = echarts.init(chartDom)
  // 模拟渠道数据
  const channelData = [
    { value: 45, name: '微信支付' },
    { value: 38, name: '支付宝' },
    { value: 12, name: '银行卡' },
    { value: 5, name: '余额支付' }
  ]

  const option = {
    title: {
      text: '支付渠道分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      data: channelData.map(item => item.name)
    },
    series: [
      {
        name: '支付渠道',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: channelData
      }
    ]
  }

  channelChart.setOption(option)
}

// 处理统计时间范围变化
const handleStatisticsRangeChange = () => {
  if (statisticsTimeRange.value !== 'custom') {
    loadStatisticsData()
  }
}

// 处理自定义日期变化
const handleStatisticsDateChange = () => {
  loadStatisticsData()
}

// 获取支付渠道名称
const getChannelName = channel => {
  const channelMap = {
    ALIPAY: '支付宝',
    WECHAT: '微信支付',
    BANK_CARD: '银行卡',
    BALANCE: '余额支付'
  }
  return channelMap[channel] || channel
}

// 获取渠道对应样式
const getChannelType = channel => {
  const typeMap = {
    ALIPAY: 'primary',
    WECHAT: 'success',
    BANK_CARD: 'warning',
    BALANCE: 'info'
  }
  return typeMap[channel] || ''
}

// 获取订单状态名称
const getStatusName = status => {
  const statusMap = {
    PENDING: '待支付',
    PAID: '已支付',
    CLOSED: '已关闭',
    REFUNDING: '退款中',
    REFUNDED: '已退款',
    PARTIAL_REFUNDED: '部分退款'
  }
  return statusMap[status] || status
}

// 获取状态对应样式
const getStatusType = status => {
  const typeMap = {
    PENDING: 'warning',
    PAID: 'success',
    CLOSED: 'info',
    REFUNDING: 'danger',
    REFUNDED: 'danger',
    PARTIAL_REFUNDED: 'warning'
  }
  return typeMap[status] || ''
}

// 格式化金额
const formatMoney = amount => {
  if (amount === undefined || amount === null) return '¥0.00'
  return `¥${parseFloat(amount).toFixed(2)}`
}
</script>

<style lang="scss" scoped>
.order-container {
  padding: 20px;

  .search-card {
    margin-bottom: 20px;

    .amount-range {
      display: flex;
      align-items: center;

      .range-separator {
        margin: 0 10px;
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

  .refund-records {
    margin-top: 20px;

    h3 {
      margin-bottom: 15px;
    }
  }

  .statistics-container {
    .statistics-filters {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }

    .statistics-cards {
      margin-bottom: 20px;

      .statistics-value {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
      }
    }

    .chart-container {
      margin-top: 20px;
    }
  }
}
</style>
