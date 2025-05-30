<template>
  <div class="dashboard-container">
    <!-- 数据概览卡片 -->
    <div class="data-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-header">
              <div class="card-title">今日交易总额</div>
              <el-icon class="icon" color="#409EFF"><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ formatMoney(totalAmount) }}</div>
              <div class="card-compare">
                较昨日
                <span :class="compareClass(amountCompare)">{{ amountCompare }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-header">
              <div class="card-title">今日订单数</div>
              <el-icon class="icon" color="#67C23A"><ShoppingCart /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ formatNumber(totalOrders) }}</div>
              <div class="card-compare">
                较昨日
                <span :class="compareClass(orderCompare)">{{ orderCompare }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-header">
              <div class="card-title">支付成功率</div>
              <el-icon class="icon" color="#E6A23C"><DataLine /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ successRate }}%</div>
              <div class="card-compare">
                较昨日
                <span :class="compareClass(rateCompare)">{{ rateCompare }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-header">
              <div class="card-title">活跃商户数</div>
              <el-icon class="icon" color="#909399"><Shop /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ formatNumber(activeMerchants) }}</div>
              <div class="card-compare">
                较昨日
                <span :class="compareClass(merchantCompare)">{{ merchantCompare }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="hover">
            <template #header>
              <div class="chart-header">
                <div class="chart-title">交易趋势</div>
                <el-radio-group v-model="timeRange" size="small">
                  <el-radio-button label="today">今日</el-radio-button>
                  <el-radio-button label="week">本周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div id="trend-chart" style="height: 350px"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div class="chart-header">
                <div class="chart-title">支付渠道分布</div>
              </div>
            </template>
            <div id="channel-chart" style="height: 350px"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 订单列表 -->
    <el-card shadow="hover" class="recent-orders">
      <template #header>
        <div class="table-header">
          <div class="table-title">最近订单</div>
          <el-button type="primary" size="small" link>查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentOrders" stripe style="width: 100%">
        <el-table-column prop="orderId" label="订单号" width="180" />
        <el-table-column prop="merchantName" label="商户名称" width="180" />
        <el-table-column prop="amount" label="金额">
          <template #default="scope">
            {{ formatMoney(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="支付渠道" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { Money, ShoppingCart, DataLine, Shop } from '@element-plus/icons-vue'

// 数据概览
const totalAmount = ref(168720.92)
const amountCompare = ref(5.2)
const totalOrders = ref(1254)
const orderCompare = ref(-2.4)
const successRate = ref(99.1)
const rateCompare = ref(0.4)
const activeMerchants = ref(48)
const merchantCompare = ref(8.7)

// 图表相关
const timeRange = ref('today')
let trendChart = null
let channelChart = null

// 最近订单
const recentOrders = ref([
  {
    orderId: '202501010001',
    merchantName: '小米商城',
    amount: 1299.0,
    channel: '支付宝',
    status: '已支付',
    createTime: '2025-01-01 10:21:35'
  },
  {
    orderId: '202501010002',
    merchantName: '京东自营',
    amount: 2499.5,
    channel: '微信支付',
    status: '已支付',
    createTime: '2025-01-01 10:25:42'
  },
  {
    orderId: '202501010003',
    merchantName: '滴滴出行',
    amount: 45.0,
    channel: '余额支付',
    status: '已支付',
    createTime: '2025-01-01 10:30:18'
  },
  {
    orderId: '202501010004',
    merchantName: '美团外卖',
    amount: 68.8,
    channel: '微信支付',
    status: '待支付',
    createTime: '2025-01-01 10:35:07'
  },
  {
    orderId: '202501010005',
    merchantName: '饿了么',
    amount: 52.5,
    channel: '支付宝',
    status: '已关闭',
    createTime: '2025-01-01 10:38:22'
  }
])

// 格式化金额
const formatMoney = value => {
  return `¥${value.toFixed(2)}`
}

// 格式化数字(添加千分位)
const formatNumber = value => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 比较结果样式
const compareClass = value => {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-danger'
  return 'text-info'
}

// 获取状态对应的标签类型
const getStatusType = status => {
  if (status === '已支付') return 'success'
  if (status === '待支付') return 'warning'
  if (status === '已关闭') return 'info'
  if (status === '退款中') return 'danger'
  return ''
}

// 初始化交易趋势图
const initTrendChart = () => {
  const chartDom = document.getElementById('trend-chart')
  if (!chartDom) return

  trendChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['交易金额', '订单数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    },
    yAxis: [
      {
        type: 'value',
        name: '金额',
        axisLabel: {
          formatter: '{value}元'
        }
      },
      {
        type: 'value',
        name: '订单',
        axisLabel: {
          formatter: '{value}笔'
        }
      }
    ],
    series: [
      {
        name: '交易金额',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: [12500, 18200, 25400, 20100, 32000, 40800, 36200, 22100]
      },
      {
        name: '订单数量',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: [120, 182, 191, 234, 290, 330, 310, 220]
      }
    ]
  }
  trendChart.setOption(option)
}

// 初始化支付渠道分布图
const initChannelChart = () => {
  const chartDom = document.getElementById('channel-chart')
  if (!chartDom) return

  channelChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['微信支付', '支付宝', '银行卡', '余额支付', '其他']
    },
    series: [
      {
        name: '支付渠道',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 45, name: '微信支付' },
          { value: 38, name: '支付宝' },
          { value: 12, name: '银行卡' },
          { value: 4, name: '余额支付' },
          { value: 1, name: '其他' }
        ]
      }
    ]
  }
  channelChart.setOption(option)
}

// 加载数据
const loadData = () => {
  // 在实际项目中，这里会调用API获取数据
  console.log('加载数据，当前时间范围：', timeRange.value)
}

onMounted(() => {
  initTrendChart()
  initChannelChart()
  loadData()

  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    trendChart?.resize()
    channelChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;

  .data-overview {
    margin-bottom: 20px;

    .data-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 14px;
          color: var(--color-text-regular);
        }

        .icon {
          font-size: 24px;
        }
      }

      .card-content {
        margin-top: 16px;

        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: var(--color-text-primary);
        }

        .card-compare {
          margin-top: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);

          .text-success {
            color: var(--color-success);
          }

          .text-danger {
            color: var(--color-danger);
          }

          .text-info {
            color: var(--color-info);
          }
        }
      }
    }
  }

  .chart-container {
    margin-bottom: 20px;

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .chart-title {
        font-size: 16px;
        font-weight: bold;
        color: var(--color-text-primary);
      }
    }
  }

  .recent-orders {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .table-title {
        font-size: 16px;
        font-weight: bold;
        color: var(--color-text-primary);
      }
    }
  }
}
</style>
