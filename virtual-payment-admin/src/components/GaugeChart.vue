<template>
  <div ref="chartDom" class="gauge-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  // 仪表盘值(0-100)
  value: {
    type: Number,
    default: 0
  },
  // 最小值
  min: {
    type: Number,
    default: 0
  },
  // 最大值
  max: {
    type: Number,
    default: 100
  },
  // 标题文字
  titleText: {
    type: String,
    default: ''
  },
  // 单位文字
  unit: {
    type: String,
    default: '%'
  },
  // 格式化函数
  format: {
    type: Function,
    default: null
  },
  // 自定义颜色
  color: {
    type: [String, Array],
    default: null
  }
})

const chartDom = ref(null)
let chart = null

// 获取仪表盘颜色
const getGaugeColor = () => {
  // 如果提供了自定义颜色，直接使用
  if (props.color) {
    return props.color
  }

  // 根据值大小生成不同颜色
  const value = props.value
  if (value < 30) {
    return '#67C23A' // 绿色
  } else if (value < 70) {
    return '#E6A23C' // 黄色
  } else {
    return '#F56C6C' // 红色
  }
}

// 初始化图表
const initChart = () => {
  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartDom.value)
  updateChart()

  // 监听容器大小变化
  window.addEventListener('resize', () => {
    chart?.resize()
  })
}

// 更新图表数据
const updateChart = () => {
  if (!chart) return

  const gaugeData = [
    {
      value: props.value,
      name: props.titleText || `${props.value}${props.unit}`,
      title: {
        offsetCenter: ['0%', '20%']
      },
      detail: {
        offsetCenter: ['0%', '50%']
      }
    }
  ]

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '90%',
        min: props.min,
        max: props.max,
        itemStyle: {
          color: getGaugeColor()
        },
        progress: {
          show: true,
          width: 18
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, '#E1E1E1']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        title: {
          fontSize: 14,
          color: '#999'
        },
        detail: {
          width: '60%',
          lineHeight: 40,
          fontSize: 20,
          color: 'auto',
          formatter:
            props.format ||
            function (value) {
              return `${value.toFixed(0)}${props.unit}`
            }
        },
        data: gaugeData
      }
    ]
  }

  chart.setOption(option)
}

// 监听数据变化，更新图表
watch(
  () => props.value,
  () => {
    updateChart()
  }
)

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }

  window.removeEventListener('resize', () => {
    chart?.resize()
  })
})
</script>

<style scoped>
.gauge-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
