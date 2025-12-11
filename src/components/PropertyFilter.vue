<template>
  <div class="property-filter">
    <el-form :model="filterForm" label-position="top" size="default">
      <!-- 房型筛选 -->
      <el-form-item label="房型">
        <el-checkbox-group v-model="filterForm.roomTypes">
          <el-checkbox 
            v-for="type in ROOM_TYPES" 
            :key="type.value" 
            :label="type.value">
            {{ type.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 租金区间 -->
      <el-form-item label="租金区间（元/月）">
        <div class="rent-range">
          <el-input-number
            v-model="filterForm.rentMin"
            :min="0"
            :step="100"
            placeholder="最低"
            controls-position="right" />
          <span class="separator">-</span>
          <el-input-number
            v-model="filterForm.rentMax"
            :min="0"
            :step="100"
            placeholder="最高"
            controls-position="right" />
        </div>
      </el-form-item>

      <!-- 配套设施 -->
      <el-form-item label="配套设施">
        <el-checkbox-group v-model="filterForm.amenities">
          <el-checkbox 
            v-for="amenity in AMENITY_OPTIONS" 
            :key="amenity" 
            :label="amenity">
            {{ amenity }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 是否可租 -->
      <el-form-item label="租赁状态">
        <el-radio-group v-model="filterForm.availableStatus">
          <el-radio label="all">全部</el-radio>
          <el-radio :label="true">可租</el-radio>
          <el-radio :label="false">已租出</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 房东类型 -->
      <el-form-item label="房东类型">
        <el-checkbox-group v-model="filterForm.landlordType">
          <el-checkbox 
            v-for="type in LANDLORD_TYPES" 
            :key="type.value" 
            :label="type.value">
            {{ type.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 押金方式 -->
      <el-form-item label="押金方式">
        <el-checkbox-group v-model="filterForm.depositMethod">
          <el-checkbox 
            v-for="method in DEPOSIT_METHODS" 
            :key="method.value" 
            :label="method.value">
            {{ method.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 水费类型 -->
      <el-form-item label="水费类型">
        <el-radio-group v-model="filterForm.waterType">
          <el-radio label="all">全部</el-radio>
          <el-radio label="civil">民用水</el-radio>
          <el-radio label="custom">自定义</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 电费类型 -->
      <el-form-item label="电费类型">
        <el-radio-group v-model="filterForm.electricityType">
          <el-radio label="all">全部</el-radio>
          <el-radio label="civil">民用电</el-radio>
          <el-radio label="custom">自定义</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 关键词搜索 -->
      <el-form-item label="关键词搜索">
        <el-input
          v-model="filterForm.keyword"
          placeholder="搜索地址、备注或电话"
          clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item class="action-buttons">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleApply">
          应用筛选 ({{ resultCount }}条)
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ROOM_TYPES, AMENITY_OPTIONS, LANDLORD_TYPES, DEPOSIT_METHODS } from '@/types';
import type { PropertyFilterOptions } from '@/types';
import { LandlordType } from '@/types';

const props = defineProps<{
  resultCount: number;
}>();

const emit = defineEmits<{
  apply: [filters: PropertyFilterOptions];
  reset: [];
}>();

interface FilterFormData {
  roomTypes: string[];
  rentMin?: number;
  rentMax?: number;
  amenities: string[];
  availableStatus: 'all' | boolean;
  landlordType: LandlordType[];
  depositMethod: string[];
  waterType: string;
  electricityType: string;
  keyword: string;
}

const filterForm = reactive<FilterFormData>({
  roomTypes: [],
  rentMin: undefined,
  rentMax: undefined,
  amenities: [],
  availableStatus: 'all',
  landlordType: [],
  depositMethod: [],
  waterType: 'all',
  electricityType: 'all',
  keyword: '',
});

const handleApply = () => {
  const filters: PropertyFilterOptions = {};

  if (filterForm.roomTypes.length > 0) {
    filters.roomTypes = filterForm.roomTypes;
  }

  if (filterForm.rentMin !== undefined || filterForm.rentMax !== undefined) {
    filters.rentRange = [
      filterForm.rentMin || 0,
      filterForm.rentMax || Infinity
    ];
  }

  if (filterForm.amenities.length > 0) {
    filters.amenities = filterForm.amenities;
  }

  if (filterForm.availableStatus !== 'all') {
    filters.available = filterForm.availableStatus as boolean;
  }

  if (filterForm.landlordType.length > 0) {
    filters.landlordType = filterForm.landlordType;
  }

  if (filterForm.depositMethod.length > 0) {
    filters.depositMethod = filterForm.depositMethod;
  }

  if (filterForm.waterType !== 'all') {
    filters.waterType = filterForm.waterType;
  }

  if (filterForm.electricityType !== 'all') {
    filters.electricityType = filterForm.electricityType;
  }

  if (filterForm.keyword.trim()) {
    filters.keyword = filterForm.keyword.trim();
  }

  emit('apply', filters);
};

const handleReset = () => {
  filterForm.roomTypes = [];
  filterForm.rentMin = undefined;
  filterForm.rentMax = undefined;
  filterForm.amenities = [];
  filterForm.availableStatus = 'all';
  filterForm.landlordType = [];
  filterForm.depositMethod = [];
  filterForm.waterType = 'all';
  filterForm.electricityType = 'all';
  filterForm.keyword = '';
  
  emit('reset');
};

// 自动应用筛选（可选，用于实时筛选）
// watch(filterForm, handleApply, { deep: true });
</script>

<style scoped lang="scss">
.property-filter {
  padding: 16px;
  background: #fff;
  border-radius: 4px;

  .el-form-item {
    margin-bottom: 20px;

    :deep(.el-form-item__label) {
      font-weight: 600;
      color: #303133;
    }
  }

  .el-checkbox-group,
  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rent-range {
    display: flex;
    align-items: center;
    gap: 12px;

    .el-input-number {
      flex: 1;
    }

    .separator {
      color: #909399;
      font-weight: 500;
    }
  }

  .action-buttons {
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      display: flex;
      gap: 12px;

      .el-button {
        flex: 1;
      }
    }
  }
}
</style>
