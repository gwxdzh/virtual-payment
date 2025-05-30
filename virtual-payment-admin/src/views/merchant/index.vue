<template>
  <div class="merchant-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="searchFormRef" :inline="true">
        <el-form-item label="商户ID" prop="merchantId">
          <el-input v-model="queryParams.merchantId" placeholder="请输入商户ID" clearable />
        </el-form-item>
        <el-form-item label="商户名称" prop="merchantName">
          <el-input v-model="queryParams.merchantName" placeholder="请输入商户名称" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="正常" value="ACTIVE" />
            <el-option label="冻结" value="FROZEN" />
            <el-option label="注销" value="DELETED" />
          </el-select>
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
          <span>商户列表</span>
          <div class="button-group">
            <el-button type="primary" @click="handleAdd">新增商户</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="merchantList" border stripe style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column prop="merchantId" label="商户ID" width="180" />
        <el-table-column prop="merchantName" label="商户名称" width="180" />
        <el-table-column prop="contactName" label="联系人" />
        <el-table-column prop="contactPhone" label="联系电话" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'FROZEN' ? 'warning' : 'info'">
              {{ scope.row.status === 'ACTIVE' ? '正常' : scope.row.status === 'FROZEN' ? '冻结' : '注销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button type="primary" link @click="handleView(scope.row)">查看</el-button>
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button :type="scope.row.status === 'FROZEN' ? 'success' : 'warning'" link @click="handleStatusChange(scope.row)">
              {{ scope.row.status === 'FROZEN' ? '解冻' : '冻结' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination class="pagination" v-model:current-page="queryParams.page" v-model:page-size="queryParams.limit" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>

    <!-- 商户弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="merchantFormRef" :model="merchantForm" :rules="merchantRules" label-width="100px">
        <el-form-item label="商户名称" prop="merchantName">
          <el-input v-model="merchantForm.merchantName" placeholder="请输入商户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="merchantForm.contactName" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="merchantForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="商户地址" prop="address">
          <el-input v-model="merchantForm.address" placeholder="请输入商户地址" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="merchantForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 商户详情弹窗 -->
    <el-dialog title="商户详情" v-model="detailDialogVisible" width="600px" append-to-body>
      <el-descriptions border :column="1">
        <el-descriptions-item label="商户ID">{{ merchantDetail.merchantId }}</el-descriptions-item>
        <el-descriptions-item label="商户名称">{{ merchantDetail.merchantName }}</el-descriptions-item>
        <el-descriptions-item label="商户状态">
          <el-tag :type="merchantDetail.status === 'ACTIVE' ? 'success' : merchantDetail.status === 'FROZEN' ? 'warning' : 'info'">
            {{ merchantDetail.status === 'ACTIVE' ? '正常' : merchantDetail.status === 'FROZEN' ? '冻结' : '注销' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ merchantDetail.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ merchantDetail.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="商户地址">{{ merchantDetail.address }}</el-descriptions-item>
        <el-descriptions-item label="API密钥">
          <div class="key-display">
            <span>{{ maskKey(merchantDetail.apiKey) }}</span>
            <el-button type="primary" link @click="handleViewFullKey">查看</el-button>
            <el-button type="warning" link @click="handleResetKey">重置</el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="证书状态">
          <el-tag :type="merchantDetail.certStatus === 'VALID' ? 'success' : 'warning'">
            {{ merchantDetail.certStatus === 'VALID' ? '有效' : '过期' }}
          </el-tag>
          <span v-if="merchantDetail.certExpireTime">（{{ merchantDetail.certExpireTime }} 过期）</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ merchantDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ merchantDetail.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMerchantStore } from '@/stores/merchant'

const merchantStore = useMerchantStore()
const loading = computed(() => merchantStore.loading)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  merchantId: '',
  merchantName: '',
  status: ''
})

// 表单参数
const merchantForm = reactive({
  id: '',
  merchantName: '',
  contactName: '',
  contactPhone: '',
  address: '',
  remark: ''
})

// 商户验证规则
const merchantRules = {
  merchantName: [
    { required: true, message: '请输入商户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 表格数据
const merchantList = computed(() => merchantStore.merchants)
const total = computed(() => merchantStore.merchantTotal)

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增商户')
const detailDialogVisible = ref(false)
const merchantDetail = reactive({})
const merchantFormRef = ref(null)
const searchFormRef = ref(null)

// 初始化数据
onMounted(async () => {
  await fetchMerchantList()
})

// 查询商户列表
const fetchMerchantList = async () => {
  await merchantStore.fetchMerchantList(queryParams)
}

// 处理查询
const handleQuery = () => {
  queryParams.page = 1
  fetchMerchantList()
}

// 重置查询
const resetQuery = () => {
  searchFormRef.value?.resetFields()
  merchantStore.resetQueryParams()
  fetchMerchantList()
}

// 处理导出
const handleExport = () => {
  ElMessageBox.confirm('确认导出商户数据?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 处理导出逻辑
      ElMessage.success('导出成功')
    })
    .catch(() => {})
}

// 处理新增
const handleAdd = () => {
  dialogTitle.value = '新增商户'
  Object.keys(merchantForm).forEach(key => {
    merchantForm[key] = ''
  })
  dialogVisible.value = true
}

// 处理编辑
const handleEdit = row => {
  dialogTitle.value = '编辑商户'
  Object.keys(merchantForm).forEach(key => {
    merchantForm[key] = row[key]
  })
  merchantForm.id = row.id
  dialogVisible.value = true
}

// 处理查看
const handleView = async row => {
  try {
    const detail = await merchantStore.fetchMerchantDetail(row.id)
    Object.assign(merchantDetail, detail)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取商户详情失败')
  }
}

// 处理状态变更
const handleStatusChange = row => {
  const statusText = row.status === 'FROZEN' ? '解冻' : '冻结'
  const newStatus = row.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN'

  ElMessageBox.confirm(`确认要${statusText}该商户吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await merchantStore.updateMerchantStatus(row.id, newStatus)
        ElMessage.success(`${statusText}成功`)
      } catch (error) {
        ElMessage.error(`${statusText}失败`)
      }
    })
    .catch(() => {})
}

// 处理查看完整密钥
const handleViewFullKey = () => {
  ElMessageBox.confirm('出于安全原因，查看完整密钥需要二次确认，请确认是否继续?', '安全提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 此处应该调用后端API进行二次认证，现在先模拟显示
      ElMessage.success('密钥已显示（模拟）')
    })
    .catch(() => {})
}

// 处理重置密钥
const handleResetKey = () => {
  ElMessageBox.confirm('重置密钥将导致商户原有密钥失效，是否继续?', '警告', {
    confirmButtonText: '确认重置',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await merchantStore.resetMerchantKey(merchantDetail.id)
        ElMessage.success('密钥重置成功')
        // 重新加载商户详情
        const detail = await merchantStore.fetchMerchantDetail(merchantDetail.id)
        Object.assign(merchantDetail, detail)
      } catch (error) {
        ElMessage.error('密钥重置失败')
      }
    })
    .catch(() => {})
}

// 提交表单
const submitForm = async () => {
  merchantFormRef.value.validate(async valid => {
    if (valid) {
      try {
        if (merchantForm.id) {
          // 编辑
          await merchantStore.updateMerchant(merchantForm)
          ElMessage.success('更新成功')
        } else {
          // 新增
          await merchantStore.addMerchant(merchantForm)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchMerchantList()
      } catch (error) {
        ElMessage.error(merchantForm.id ? '更新失败' : '新增失败')
      }
    }
  })
}

// 处理分页大小改变
const handleSizeChange = val => {
  queryParams.limit = val
  fetchMerchantList()
}

// 处理页码改变
const handleCurrentChange = val => {
  queryParams.page = val
  fetchMerchantList()
}

// 掩码显示密钥
const maskKey = key => {
  if (!key) return '******'
  return key.substring(0, 3) + '****' + key.substring(key.length - 3)
}
</script>

<style lang="scss" scoped>
.merchant-container {
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

  .key-display {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
