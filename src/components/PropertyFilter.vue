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
          <el-radio-group v-model="filterForm.availableStatus">
            <el-radio label="all">全部</el-radio>
            <el-radio :value="true">可租</el-radio>
            <el-radio :value="false">已租出</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 收藏状态 -->
        <el-form-item label="收藏状态">
          <el-radio-group v-model="filterForm.favoriteStatus">
            <el-radio label="all">全部</el-radio>
            <el-radio label="favorite">收藏</el-radio>
            <el-radio label="unfavorite">未收藏</el-radio>
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
          <el-radio-group v-model="filterForm.waterType">
            <el-radio label="all">全部</el-radio>
            <el-radio label="civil">3元/吨（民用水）</el-radio>
            <el-radio label="5.0">5元/吨</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
          <el-input-number
            v-if="filterForm.waterType === 'custom'"
            v-model="filterForm.waterPriceMax"
            :min="0"
            :step="0.1"
            placeholder="最大水费"
            style="width: 100%; margin-top: 8px"
          >
            <template #prefix> 不超过 </template>
            <template #suffix> 元/吨 </template>
          </el-input-number>
        </el-form-item>

        <!-- 电费类型 -->
        <el-form-item label="电费类型">
          <el-radio-group v-model="filterForm.electricityType">
            <el-radio label="all">全部</el-radio>
            <el-radio label="civil">0.6元/度（民用电）</el-radio>
            <el-radio label="1.5">1.5元/度</el-radio>
            <el-radio label="1.0">1.0元/度</el-radio>
            <el-radio label="0.88">0.88元/度</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
          <el-input-number
            v-if="filterForm.electricityType === 'custom'"
            v-model="filterForm.electricityPriceMax"
            :min="0"
            :step="0.1"
            placeholder="最大电费"
            style="width: 100%; margin-top: 8px"
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

        <!-- 排序方式 -->
        <el-form-item label="排序方式">
          <el-radio-group v-model="filterForm.sortBy">
            <el-radio label="default">默认</el-radio>
            <el-radio label="rentAsc">租金↑</el-radio>
            <el-radio label="rentDesc">租金↓</el-radio>
            <el-radio label="roomType">房型</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-scrollbar>

    <!-- 固定在底部的操作按钮 -->
    <div class="filter-footer">
      <el-button @click="handleReset" class="footer-button">重置</el-button>
      <el-button type="primary" @click="handleApply" class="footer-button">
        应用筛选 ({{ propertyStore.previewPropertyCount }}条)
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import {
  ROOM_TYPES,
  AMENITY_OPTIONS,
  LANDLORD_TYPES,
  DEPOSIT_METHODS,
} from "@/types";
import { LandlordType } from "@/types";
import { usePropertyStore } from "@/stores/property";

const propertyStore = usePropertyStore();

const emit = defineEmits<{
  applyFilter: [];
}>();

interface FilterFormData {
  roomTypes: string[];
  rentMin?: number;
  rentMax?: number;
  amenities: string[];
  availableStatus: "all" | boolean;
  favoriteStatus: "all" | "favorite" | "unfavorite";
  landlordType: LandlordType[];
  depositMethod: string[];
  waterType: string;
  electricityType: string;
  waterPriceMax?: number;
  electricityPriceMax?: number;
  keyword: string;
  sortBy: "default" | "rentAsc" | "rentDesc" | "roomType";
}

const filterForm = reactive<FilterFormData>({
  roomTypes: [],
  rentMin: undefined,
  rentMax: undefined,
  amenities: [],
  availableStatus: "all",
  favoriteStatus: "all",
  landlordType: [],
  depositMethod: [],
  waterType: "all",
  electricityType: "all",
  waterPriceMax: undefined,
  electricityPriceMax: undefined,
  keyword: "",
  sortBy: "default",
});

// 监听表单变化，实时更新预览计数
watch(
  filterForm,
  () => {
    propertyStore.updateTempPropertyFilters({ ...filterForm });
  },
  { deep: true, immediate: true }
);

const handleApply = () => {
  propertyStore.applyPropertyFilters({ ...filterForm });
  emit("applyFilter");
};

const handleReset = () => {
  filterForm.roomTypes = [];
  filterForm.rentMin = undefined;
  filterForm.rentMax = undefined;
  filterForm.amenities = [];
  filterForm.availableStatus = "all";
  filterForm.favoriteStatus = "all";
  filterForm.landlordType = [];
  filterForm.depositMethod = [];
  filterForm.waterType = "all";
  filterForm.electricityType = "all";
  filterForm.waterPriceMax = undefined;
  filterForm.electricityPriceMax = undefined;
  filterForm.keyword = "";
  filterForm.sortBy = "default";

  propertyStore.clearPropertyFilters();
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
