<template>
  <div class="landlord-filter">
    <el-scrollbar class="filter-scrollbar">
      <el-form
        :model="filterForm"
        label-position="top"
        size="default"
        class="filter-form"
      >
        <!-- 联系状态 -->
        <el-form-item label="联系状态">
          <el-radio-group v-model="filterForm.contactStatus">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="contacted">已联系</el-radio-button>
            <el-radio-button label="uncontacted">未联系</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 微信状态 -->
        <el-form-item label="微信状态">
          <el-radio-group v-model="filterForm.wechatStatus">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="added">已加</el-radio-button>
            <el-radio-button label="not_added">未加</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 收藏状态 -->
        <el-form-item label="收藏状态">
          <el-radio-group v-model="filterForm.favoriteStatus">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="favorite">已收藏</el-radio-button>
            <el-radio-button label="unfavorite">未收藏</el-radio-button>
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

        <!-- 房型 -->
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

        <!-- 电话搜索 -->
        <el-form-item label="电话搜索">
          <el-input
            v-model="filterForm.phoneSearch"
            placeholder="输入电话号码"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 二房东筛选 -->
        <el-form-item>
          <el-tooltip content="同一个电话在地图这出现了三次及以上，疑似为二房东到处贴广告💩" placement="left">
            <el-checkbox
              v-model="filterForm.hideRepeatedPhones"
              label="隐藏疑似二房东"
            />
          </el-tooltip>
        </el-form-item>

        <el-form-item>
          <el-tooltip
            content="只显示电话出现3次及以上的房东💢，地图中显示为方块"
            placement="left"
          >
            <el-checkbox
              v-model="filterForm.showRepeatedPhones"
              label="只显示疑似二房东"
            />
          </el-tooltip>
        </el-form-item>
      </el-form>
    </el-scrollbar>

    <!-- 固定在底部的操作按钮 -->
    <div class="filter-footer">
      <el-button @click="handleReset" class="footer-button">重置</el-button>
      <el-button type="primary" @click="handleApply" class="footer-button">
        应用筛选 ({{ propertyStore.previewLandlordCount }}条)
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ROOM_TYPES, LANDLORD_TYPES } from "@/types";
import { LandlordType } from "@/types";
import { usePropertyStore } from "@/stores/property";

const propertyStore = usePropertyStore();

const emit = defineEmits<{
  applyFilter: [];
}>();

interface FilterFormData {
  contactStatus: string;
  wechatStatus: string;
  favoriteStatus: string;
  landlordType: LandlordType[];
  waterType: string;
  electricityType: string;
  waterPriceMax?: number;
  electricityPriceMax?: number;
  roomTypes: string[];
  rentMin?: number;
  rentMax?: number;
  phoneSearch: string;
  hideRepeatedPhones: boolean;
  showRepeatedPhones: boolean;
}

const filterForm = reactive<FilterFormData>({
  contactStatus: "all",
  wechatStatus: "all",
  favoriteStatus: "all",
  landlordType: [],
  waterType: "all",
  electricityType: "all",
  waterPriceMax: undefined,
  electricityPriceMax: undefined,
  roomTypes: [],
  rentMin: undefined,
  rentMax: undefined,
  phoneSearch: "",
  hideRepeatedPhones: false,
  showRepeatedPhones: false,
});

// 监听表单变化，实时更新预览计数
watch(
  filterForm,
  () => {
    propertyStore.updateTempLandlordFilters({ ...filterForm });
  },
  { deep: true, immediate: true }
);

const handleApply = () => {
  propertyStore.applyLandlordFilters({ ...filterForm });
  emit('applyFilter');
};

const handleReset = () => {
  filterForm.contactStatus = "all";
  filterForm.wechatStatus = "all";
  filterForm.favoriteStatus = "all";
  filterForm.landlordType = [];
  filterForm.waterType = "all";
  filterForm.electricityType = "all";
  filterForm.waterPriceMax = undefined;
  filterForm.electricityPriceMax = undefined;
  filterForm.roomTypes = [];
  filterForm.rentMin = undefined;
  filterForm.rentMax = undefined;
  filterForm.phoneSearch = "";
  filterForm.hideRepeatedPhones = false;
  filterForm.showRepeatedPhones = false;

  propertyStore.clearLandlordFilters();
};
</script>

<style scoped lang="scss">
.landlord-filter {
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
