<template>
  <div class="property-list">
    <!-- 统计信息 -->
    <div class="list-header">
      <div class="header-left">
        <h3>房源列表（{{ filteredProperties.length }}）</h3>
        <span v-if="averageRent > 0">平均租金: ¥{{ averageRent }}/月</span>
      </div>
      <div class="header-right">
        <el-radio-group v-model="viewType" size="small">
          <el-tooltip content="卡片视图" placement="top">
            <el-radio-button label="card">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="2 2 20 20"
              >
                <path
                  fill="currentColor"
                  d="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"
                />
              </svg>
            </el-radio-button>
          </el-tooltip>
          <el-tooltip content="紧凑视图" placement="top">
            <el-radio-button label="compact">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
          </el-tooltip>
        </el-radio-group>
      </div>
    </div>

    <!-- 房源列表 -->
    <div v-if="filteredProperties.length === 0" class="empty-state">
      <el-empty description="暂无房源数据">
        <el-button type="primary" @click="handleBackToLandlord">
          返回房东视图
        </el-button>
      </el-empty>
    </div>

    <!-- 卡片视图 -->
    <DynamicScroller
      v-else-if="viewType === 'card'"
      :items="filteredProperties"
      :min-item-size="180"
      class="property-scroller"
      key-field="propertyId"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[
            item.roomType,
            item.rent,
            item.amenities?.length,
            item.water,
            item.electricity,
            item.deposit,
            item.floor,
            item.available,
          ]"
          :data-index="index"
          class="property-item"
        >
          <PropertyCard
            :data="item"
            @view-detail="handleViewDetail"
            @locate="handleCardLocate"
            @view-landlord="handleViewLandlord"
            @toggle-favorite="handleToggleFavorite"
            @click="handleCardClick(item)"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <!-- 紧凑视图 -->
    <DynamicScroller
      v-else
      :items="compactRows"
      :min-item-size="216"
      class="compact-scroller"
      key-field="rowIndex"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.items.length]"
          :data-index="index"
          class="compact-row"
        >
          <CompactPropertyItem
            v-for="property in item.items"
            :key="property.propertyId"
            :data="property"
            @click="handleViewDetail(property.propertyId)"
            @toggle-favorite="handleToggleFavorite"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Grid } from "@element-plus/icons-vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import PropertyCard from "./PropertyCard.vue";
import CompactPropertyItem from "./CompactPropertyItem.vue";
import { usePropertyStore } from "@/stores/property";
import type { PropertyViewItem } from "@/types";

const propertyStore = usePropertyStore();

const viewType = ref<"card" | "compact">("card");

const filteredProperties = computed(() => propertyStore.filteredProperties);

// 将房源数据三个一组，用于紧凑视图的虚拟列表
const compactRows = computed(() => {
  const properties = filteredProperties.value;
  const rows: { rowIndex: number; items: PropertyViewItem[] }[] = [];

  for (let i = 0; i < properties.length; i += 3) {
    rows.push({
      rowIndex: i / 3,
      items: properties.slice(i, i + 3),
    });
  }

  return rows;
});

const averageRent = computed(() => {
  const properties = filteredProperties.value.filter((p) => p.rent);
  if (properties.length === 0) return 0;
  const total = properties.reduce((sum, p) => sum + (p.rent || 0), 0);
  return Math.round(total / properties.length);
});

const emit = defineEmits<{
  viewDetail: [propertyId: string];
  locate: [gps: { lng: number; lat: number }];
  viewLandlord: [landlordId: string];
}>();

const handleViewDetail = (propertyId: string) => {
  emit("viewDetail", propertyId);
};

const handleCardLocate = (gps: { lng: number; lat: number }) => {
  emit("locate", gps);
};

// 点击房源卡片时，聚焦地图marker
const handleCardClick = (item: PropertyViewItem) => {
  if (item.gps) {
    emit("locate", item.gps);
  }
};

const handleViewLandlord = (landlordId: string) => {
  // 切换到房东视图并定位到该房东
  propertyStore.setViewMode("landlord");
  propertyStore.setFocusedLandlord(landlordId);

  // 也通知父组件
  emit("viewLandlord", landlordId);
};

const handleToggleFavorite = async (landlordId: string, propertyId: string) => {
  await propertyStore.toggleFavorite(landlordId, propertyId);
};

const handleBackToLandlord = () => {
  propertyStore.setViewMode("landlord");
};
</script>

<style scoped lang="scss">
.property-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fdfdfd;
}

.property-scroller {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.property-item {
  padding-bottom: 16px;

  :deep(.property-card) {
    cursor: pointer;
    transition: all 0.3s;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  font-size: 14px;
  flex-shrink: 0;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
  }
}

.compact-scroller {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.compact-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
</style>
