<template>
  <div class="property-list">
    <!-- 统计信息 -->
    <div class="list-header">
      <h3>房源列表（{{ filteredProperties.length }}）</h3>
      <span v-if="averageRent > 0">平均租金: ¥{{ averageRent }}/月</span>
    </div>

    <!-- 房源列表 -->
    <div v-if="filteredProperties.length === 0" class="empty-state">
      <el-empty description="暂无房源数据">
        <el-button type="primary" @click="handleBackToLandlord">
          返回房东视图
        </el-button>
      </el-empty>
    </div>

    <DynamicScroller
      v-else
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
            @click="handleCardClick(item)"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import PropertyCard from "./PropertyCard.vue";
import { usePropertyStore } from "@/stores/property";
import type { PropertyViewItem } from "@/types";

const propertyStore = usePropertyStore();

const filteredProperties = computed(() => propertyStore.filteredProperties);

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

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}
</style>
