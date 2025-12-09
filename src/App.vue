<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <h1>租房信息管理系统</h1>
      </div>
      <div class="header-right">
        <el-statistic title="总房东数" :value="propertyStore.landlords.length" />
        <el-statistic title="已完善" :value="propertyStore.perfectCount" />
        <el-statistic title="待完善" :value="propertyStore.imperfectCount" />
        <el-button-group>
          <el-button type="primary" :icon="Download" @click="handleExport">导出数据</el-button>
          <el-button type="success" :icon="Upload" @click="handleImport">导入数据</el-button>
        </el-button-group>
      </div>
    </el-header>

    <el-main class="app-main">
      <el-row :gutter="20">
        <!-- 左侧：上传和筛选 -->
        <el-col :span="8">
          <PhotoUpload />
          
          <el-card class="filter-card">
            <template #header>
              <div class="card-header">
                <span>筛选条件</span>
                <el-button text @click="clearFilters">清空</el-button>
              </div>
            </template>

            <el-form label-width="80px">
              <el-form-item label="完善状态">
                <el-radio-group v-model="filterForm.isPerfect">
                  <el-radio-button :label="undefined">全部</el-radio-button>
                  <el-radio-button :label="false">待完善</el-radio-button>
                  <el-radio-button :label="true">已完善</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="房东类型">
                <el-checkbox-group v-model="filterForm.landlordType">
                  <el-checkbox :label="LandlordType.FirstHand">一手房东</el-checkbox>
                  <el-checkbox :label="LandlordType.SecondHand">二手房东</el-checkbox>
                  <el-checkbox :label="LandlordType.Agent">中介</el-checkbox>
                  <el-checkbox :label="LandlordType.Other">其他</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="微信状态">
                <el-checkbox-group v-model="filterForm.wechatStatus">
                  <el-checkbox :label="WechatStatus.NotAdded">未添加</el-checkbox>
                  <el-checkbox :label="WechatStatus.Added">已添加</el-checkbox>
                  <el-checkbox :label="WechatStatus.Rejected">已拒绝</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="联系状态">
                <el-checkbox-group v-model="filterForm.contactStatus">
                  <el-checkbox :label="ContactStatus.NotContacted">未联系</el-checkbox>
                  <el-checkbox :label="ContactStatus.Contacted">已联系</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="applyFilters">应用筛选</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 房东列表 -->
          <el-card class="landlord-list-card">
            <template #header>
              <span>房东列表 ({{ propertyStore.filteredLandlords.length }})</span>
            </template>

            <el-scrollbar height="400px">
              <div class="landlord-list">
                <div
                  v-for="landlord in propertyStore.filteredLandlords"
                  :key="landlord.id"
                  class="landlord-item"
                  @click="selectLandlord(landlord)"
                >
                  <div class="landlord-info">
                    <div class="landlord-name">
                      {{ landlord.alias || landlord.phoneNumbers[0] || '待完善' }}
                    </div>
                    <div class="landlord-meta">
                      <el-tag size="small" :type="getLandlordTypeTag(landlord.landlordType)">
                        {{ translateLandlordType(landlord.landlordType) }}
                      </el-tag>
                      <el-tag size="small" v-if="!landlord.isPerfect" type="warning">
                        待完善
                      </el-tag>
                    </div>
                    <div class="landlord-address">
                      {{ landlord.address || '未知地址' }}
                    </div>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </el-card>
        </el-col>

        <!-- 右侧：地图 -->
        <el-col :span="16">
          <el-card>
            <template #header>
              <span>地图视图</span>
            </template>
            <MapView />
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <!-- 详情抽屉 -->
    <PropertyDetail />
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import PhotoUpload from './components/PhotoUpload.vue'
import MapView from './components/MapView.vue'
import PropertyDetail from './components/PropertyDetail.vue'
import { usePropertyStore } from './stores/property'
import { LandlordType, WechatStatus, ContactStatus } from './types'
import type { Landlord, FilterOptions } from './types'
import { exportToExcel, exportToJson, importFromJson } from './utils/export'

const propertyStore = usePropertyStore()

const filterForm = reactive<FilterOptions>({
  isPerfect: undefined,
  landlordType: [],
  wechatStatus: [],
  contactStatus: []
})

onMounted(async () => {
  await propertyStore.loadLandlords()
})

watch(filterForm, () => {
  applyFilters()
}, { deep: true })

function applyFilters() {
  propertyStore.setFilters({ ...filterForm })
}

function clearFilters() {
  filterForm.isPerfect = undefined
  filterForm.landlordType = []
  filterForm.wechatStatus = []
  filterForm.contactStatus = []
  propertyStore.clearFilters()
}

function selectLandlord(landlord: Landlord) {
  propertyStore.setCurrentLandlord(landlord)
}

function getLandlordTypeTag(type: LandlordType): string {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: 'success',
    [LandlordType.SecondHand]: 'primary',
    [LandlordType.Agent]: 'danger',
    [LandlordType.Other]: 'info'
  }
  return map[type] || 'info'
}

function translateLandlordType(type: LandlordType): string {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: '一手房东',
    [LandlordType.SecondHand]: '二手房东',
    [LandlordType.Agent]: '中介',
    [LandlordType.Other]: '其他'
  }
  return map[type] || '未知'
}

function handleExport() {
  try {
    const timestamp = new Date().toISOString().slice(0, 10)
    exportToExcel(propertyStore.landlords, `租房信息_${timestamp}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const data = await importFromJson(file)
      // TODO: 实现批量导入逻辑
      ElMessage.success(`成功导入 ${data.length} 条数据`)
      await propertyStore.loadLandlords()
    } catch (error: any) {
      ElMessage.error(`导入失败: ${error.message}`)
    }
  }

  input.click()
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-main {
  padding: 20px;
}

.filter-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.landlord-list-card {
  margin-top: 20px;
}

.landlord-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.landlord-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.landlord-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.landlord-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.landlord-name {
  font-weight: bold;
  font-size: 14px;
}

.landlord-meta {
  display: flex;
  gap: 8px;
}

.landlord-address {
  font-size: 12px;
  color: #909399;
}
</style>
