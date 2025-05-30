<template>
  <div class="metrics-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>系统CPU使用率</span>
              <el-tag :type="getCpuUsageType">{{ systemMetrics.cpuUsage }}%</el-tag>
            </div>
          </template>
          <gauge-chart :value="systemMetrics.cpuUsage" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>系统内存使用率</span>
              <el-tag :type="getMemoryUsageType">{{ systemMetrics.memoryUsage }}%</el-tag>
            </div>
          </template>
          <gauge-chart :value="systemMetrics.memoryUsage" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>数据库连接数</span>
              <el-tag :type="getDbConnectionsType"> {{ systemMetrics.dbConnections }}/{{ systemMetrics.dbMaxConnections }} </el-tag>
            </div>
          </template>
          <gauge-chart :value="(systemMetrics.dbConnections / systemMetrics.dbMaxConnections) * 100" title-text="" :format="value => `${systemMetrics.dbConnections}/${systemMetrics.dbMaxConnections}`" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>API平均响应时间</span>
              <el-tag :type="getApiResponseTimeType">{{ systemMetrics.apiResponseTime }}ms</el-tag>
            </div>
          </template>
          <gauge-chart :value="getApiResponsePercentage" title-text="" :format="value => `${systemMetrics.apiResponseTime}ms`" :color="getApiResponseTimeColor" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>支付成功率趋势</span>
              <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
                <el-radio-button label="hour">1小时</el-radio-button>
                <el-radio-button label="day">24小时</el-radio-button>
                <el-radio-button label="week">7天</el-radio-button>
                <el-radio-button label="month">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="successRateChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>系统负载情况</span>
            </div>
          </template>
          <div ref="loadChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>API请求分布</span>
            </div>
          </template>
          <div ref="apiDistributionChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { useMonitorStore } from '@/stores/monitor'
import GaugeChart from '@/components/GaugeChart.vue'

const monitorStore = useMonitorStore()
const loading = computed(() => monitorStore.loading)
const systemMetrics = computed(() => monitorStore.metrics)

// 图表引用
const successRateChart = ref(null)
const loadChart = ref(null)
const apiDistributionChart = ref(null)

// 图表实例
let successRateChartInstance = null
let loadChartInstance = null
let apiDistributionChartInstance = null

// 时间范围
const timeRange = ref('day')

// 定时刷新任务
let refreshTimer = null

// 计算CPU使用率标签类型
const getCpuUsageType = computed(() => {
  const usage = systemMetrics.value.cpuUsage
  if (usage < 50) return 'success'
  if (usage < 80) return 'warning'
  return 'danger'
})

// 计算内存使用率标签类型
const getMemoryUsageType = computed(() => {
  const usage = systemMetrics.value.memoryUsage
  if (usage < 60) return 'success'
  if (usage < 85) return 'warning'
  return 'danger'
})

// 计算数据库连接标签类型
const getDbConnectionsType = computed(() => {
  const ratio = systemMetrics.value.dbConnections / systemMetrics.value.dbMaxConnections
  if (ratio < 0.6) return 'success'
  if (ratio < 0.8) return 'warning'
  return 'danger'
})

// 计算API响应时间标签类型
const getApiResponseTimeType = computed(() => {
  const time = systemMetrics.value.apiResponseTime
  if (time < 100) return 'success'
  if (time < 300) return 'warning'
  return 'danger'
})

// 计算API响应时间百分比（用于仪表盘显示）
const getApiResponsePercentage = computed(() => {
  const time = systemMetrics.value.apiResponseTime
  // 将响应时间映射到0-100的百分比，假设500ms为100%
  return Math.min(time / 5, 100)
})

// 获取API响应时间颜色
const getApiResponseTimeColor = computed(() => {
  const time = systemMetrics.value.apiResponseTime
  if (time < 100) return '#67C23A'
  if (time < 300) return '#E6A23C'
  return '#F56C6C'
})

// 初始化支付成功率趋势图
const initSuccessRateChart = () => {
  if (successRateChartInstance) {
    successRateChartInstance.dispose()
  }

  successRateChartInstance = echarts.init(successRateChart.value)

  // 模拟数据
  const times = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
  const successRates = [99.5, 98.7, 99.8, 99.3, 97.8, 99.1, 99.4, 98.9, 99.6, 99.2, 98.5, 99.7]

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b} <br/> 成功率: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: times
    },
    yAxis: {
      type: 'value',
      min: 95,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        data: successRates,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: 'rgba(135, 211, 255, 0.1)' }
          ])
        },
        lineStyle: {
          width: 3
        },
        markLine: {
          data: [
            {
              type: 'average',
              name: '平均值',
              lineStyle: { color: '#E6A23C', type: 'dashed' }
            }
          ]
        }
      }
    ]
  }

  successRateChartInstance.setOption(option)
}

// 初始化系统负载图表
const initLoadChart = () => {
  if (loadChartInstance) {
    loadChartInstance.dispose()
  }

  loadChartInstance = echarts.init(loadChart.value)

  // 模拟数据
  const times = ['0:00', '2:00', '4:00', '6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
  const cpuData = [30, 25, 20, 18, 32, 45, 60, 58, 42, 35, 40, 28]
  const memoryData = [45, 42, 40, 38, 50, 58, 65, 70, 62, 55, 48, 45]
  const diskIOData = [10, 8, 5, 5, 12, 18, 22, 25, 20, 15, 12, 10]

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['CPU负载', '内存使用', '磁盘IO']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: times
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        },
        max: 100
      }
    ],
    series: [
      {
        name: 'CPU负载',
        type: 'line',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: cpuData
      },
      {
        name: '内存使用',
        type: 'line',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: memoryData
      },
      {
        name: '磁盘IO',
        type: 'line',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: diskIOData
      }
    ]
  }

  loadChartInstance.setOption(option)
}

// 初始化API分布图表
const initApiDistributionChart = () => {
  if (apiDistributionChartInstance) {
    apiDistributionChartInstance.dispose()
  }

  apiDistributionChartInstance = echarts.init(apiDistributionChart.value)

  // 模拟数据
  const apiData = [
    { value: 40, name: '下单接口' },
    { value: 32, name: '支付接口' },
    { value: 15, name: '查询接口' },
    { value: 8, name: '退款接口' },
    { value: 5, name: '其他接口' }
  ]

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: apiData.map(item => item.name)
    },
    series: [
      {
        name: '接口调用',
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
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: apiData
      }
    ]
  }

  apiDistributionChartInstance.setOption(option)
}

// 获取系统指标
const fetchSystemMetrics = async () => {
  try {
    await monitorStore.fetchSystemMetrics()
  } catch (error) {
    console.error('获取系统指标失败:', error)
  }
}

// 处理时间范围变化
const handleTimeRangeChange = value => {
  // 重新加载图表数据
  initSuccessRateChart()
  initLoadChart()
}

// 监听窗口大小变化，调整图表大小
const resizeCharts = () => {
  successRateChartInstance?.resize()
  loadChartInstance?.resize()
  apiDistributionChartInstance?.resize()
}

onMounted(async () => {
  await fetchSystemMetrics()

  // 初始化图表
  initSuccessRateChart()
  initLoadChart()
  initApiDistributionChart()

  // 设置定时刷新
  refreshTimer = setInterval(fetchSystemMetrics, 30000) // 每30秒刷新一次

  // 监听窗口大小变化
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  // 清除定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }

  // 移除窗口大小变化监听
  window.removeEventListener('resize', resizeCharts)

  // 销毁图表实例
  successRateChartInstance?.dispose()
  loadChartInstance?.dispose()
  apiDistributionChartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
.metrics-container {
  padding: 20px;

  .metric-card {
    height: 300px;

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .chart-row {
    margin-top: 20px;
  }

  .chart-container {
    height: 350px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
