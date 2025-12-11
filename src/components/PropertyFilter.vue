<template>
  <div class="property-filter">
    <el-scrollbar class="filter-scrollbar">
      <el-form
        :model="filterForm"
        label-position="top"
        size="default"
        class="filter-form"
      >
        <!-- 房型筛选 -->
        <el-form-item label="房型">
          <el-select
            v-model="filterForm.roomTypes"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择房型"
            style="width: 100%"
          >
            <el-option
              v-for="type in ROOM_TYPES"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <!-- 租金区间 -->
        <el-form-item label="租金区间（元/月）">
          <div class="rent-range">
            <el-input-number
              v-model="filterForm.rentMin"
              :min="0"
              :step="100"
              placeholder="最低"
              controls-position="right"
            />
            <span class="separator">-</span>
            <el-input-number
              v-model="filterForm.rentMax"
              :min="0"
              :step="100"
              placeholder="最高"
              controls-position="right"
            />
          </div>
        </el-form-item>

        <!-- 配套设施 -->
        <el-form-item label="配套设施">
          <el-select
            v-model="filterForm.amenities"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择配套设施"
            style="width: 100%"
          >
            <el-option
              v-for="amenity in AMENITY_OPTIONS"
              :key="amenity"
              :label="amenity"
              :value="amenity"
            />
          </el-select>
        </el-form-item>

        <!-- 是否可租 -->
        <el-form-item label="租赁状态">
          <el-radio-group
            v-model="filterForm.availableStatus"
            @change="updateResultCount"
          >
            <el-radio label="all">全部</el-radio>
            <el-radio :value="true">可租</el-radio>
            <el-radio :value="false">已租出</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 房东类型 -->
        <el-form-item label="房东类型">
          <el-select
            v-model="filterForm.landlordType"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择房东类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in LANDLORD_TYPES"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <!-- 押金方式 -->
        <el-form-item label="押金方式">
          <el-select
            v-model="filterForm.depositMethod"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择押金方式"
            style="width: 100%"
          >
            <el-option
              v-for="method in DEPOSIT_METHODS"
              :key="method.value"
              :label="method.label"
              :value="method.value"
            />
          </el-select>
        </el-form-item>

        <!-- 水费类型 -->
        <el-form-item label="水费类型">
          <el-radio-group
            v-model="filterForm.waterType"
            @change="updateResultCount"
          >
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="civil">民用水</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          <el-input-number
            v-if="filterForm.waterType === 'custom'"
            v-model="filterForm.waterPriceMax"
            :min="0"
            :step="0.1"
            placeholder="最大水费"
            style="width: 100%; margin-top: 8px"
            @change="updateResultCount"
          >
            <template #prefix> 不超过 </template>
            <template #suffix> 元/吨 </template>
          </el-input-number>
        </el-form-item>

        <!-- 电费类型 -->
        <el-form-item label="电费类型">
          <el-radio-group
            v-model="filterForm.electricityType"
            @change="updateResultCount"
          >
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="civil">民用电</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          <el-input-number
            v-if="filterForm.electricityType === 'custom'"
            v-model="filterForm.electricityPriceMax"
            :min="0"
            :step="0.1"
            placeholder="最大电费"
            style="width: 100%; margin-top: 8px"
            @change="updateResultCount"
          >
            <template #prefix> 不超过 </template>
            <template #suffix> 元/度 </template>
          </el-input-number>
        </el-form-item>

        <!-- 关键词搜索 -->
        <el-form-item label="关键词搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索地址、备注或电话"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-scrollbar>

    <!-- 固定在底部的操作按钮 -->
    <div class="filter-footer">
      <el-button @click="handleReset" class="footer-button">重置</el-button>
      <el-button type="primary" @click="handleApply" class="footer-button">
        应用筛选 ({{ currentResultCount }}条)
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import {
  ROOM_TYPES,
  AMENITY_OPTIONS,
  LANDLORD_TYPES,
  DEPOSIT_METHODS,
} from "@/types";
import type { PropertyFilterOptions } from "@/types";
import { LandlordType } from "@/types";

const props = defineProps<{
  resultCount: number;
}>();

const emit = defineEmits<{
  apply: [filters: PropertyFilterOptions];
  reset: [];
  updateCount: [filters: PropertyFilterOptions];
}>();

interface FilterFormData {
  roomTypes: string[];
  rentMin?: number;
  rentMax?: number;
  amenities: string[];
  availableStatus: "all" | boolean;
  landlordType: LandlordType[];
  depositMethod: string[];
  waterType: string;
  electricityType: string;
  waterPriceMax?: number;
  electricityPriceMax?: number;
  keyword: string;
}

const filterForm = reactive<FilterFormData>({
  roomTypes: [],
  rentMin: undefined,
  rentMax: undefined,
  amenities: [],
  availableStatus: "all",
  landlordType: [],
  depositMethod: [],
  waterType: "all",
  electricityType: "all",
  waterPriceMax: undefined,
  electricityPriceMax: undefined,
  keyword: "",
});

const currentResultCount = ref(props.resultCount);

// 构建筛选条件
const buildFilters = (): PropertyFilterOptions => {
  const filters: PropertyFilterOptions = {};

  if (filterForm.roomTypes.length > 0) {
    filters.roomTypes = filterForm.roomTypes;
  }

  if (filterForm.rentMin !== undefined || filterForm.rentMax !== undefined) {
    filters.rentRange = [
      filterForm.rentMin || 0,
      filterForm.rentMax || Infinity,
    ];
  }

  if (filterForm.amenities.length > 0) {
    filters.amenities = filterForm.amenities;
  }

  if (filterForm.availableStatus !== "all") {
    filters.available = filterForm.availableStatus as boolean;
  }

  if (filterForm.landlordType.length > 0) {
    filters.landlordType = filterForm.landlordType;
  }

  if (filterForm.depositMethod.length > 0) {
    filters.depositMethod = filterForm.depositMethod;
  }

  if (filterForm.waterType !== "all") {
    filters.waterType = filterForm.waterType;
    if (
      filterForm.waterType === "custom" &&
      filterForm.waterPriceMax !== undefined
    ) {
      filters.waterPriceMax = filterForm.waterPriceMax;
    }
  }

  if (filterForm.electricityType !== "all") {
    filters.electricityType = filterForm.electricityType;
    if (
      filterForm.electricityType === "custom" &&
      filterForm.electricityPriceMax !== undefined
    ) {
      filters.electricityPriceMax = filterForm.electricityPriceMax;
    }
  }

  if (filterForm.keyword.trim()) {
    filters.keyword = filterForm.keyword.trim();
  }

  return filters;
};

// 实时更新结果数
const updateResultCount = () => {
  const filters = buildFilters();
  emit("updateCount", filters);
};

// 监听筛选表单变化，实时更新数量
watch(
  filterForm,
  () => {
    updateResultCount();
  },
  { deep: true }
);

// 监听props变化更新当前数量
watch(
  () => props.resultCount,
  (newCount) => {
    currentResultCount.value = newCount;
  }
);

const handleApply = () => {
  const filters = buildFilters();
  emit("apply", filters);
};

const handleReset = () => {
  filterForm.roomTypes = [];
  filterForm.rentMin = undefined;
  filterForm.rentMax = undefined;
  filterForm.amenities = [];
  filterForm.availableStatus = "all";
  filterForm.landlordType = [];
  filterForm.depositMethod = [];
  filterForm.waterType = "all";
  filterForm.electricityType = "all";
  filterForm.waterPriceMax = undefined;
  filterForm.electricityPriceMax = undefined;
  filterForm.keyword = "";

  emit("reset");
};
</script>

<style scoped lang="scss">
.property-filter {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
}

.filter-scrollbar {
  flex: 1;
  overflow: hidden;

  :deep(.el-scrollbar__view) {
    padding: 16px;
    padding-bottom: 0;
  }
}

.filter-form {
  .el-form-item {
    margin-bottom: 20px;

    :deep(.el-form-item__label) {
      font-weight: 600;
      color: #303133;
    }
  }

  .el-radio-group {
    display: flex;
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
}

.filter-footer {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: #fff;
  display: flex;
  gap: 12px;

  .footer-button {
    flex: 1;
  }
}
</style>
