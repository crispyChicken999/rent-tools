<template>
  <div class="property-list">
    <!-- 房源列表 -->
    <el-scrollbar class="list-scrollbar">
      <div v-if="filteredProperties.length === 0" class="empty-state">
        <el-empty description="暂无房源数据">
          <el-button type="primary" @click="handleBackToLandlord">
            返回房东视图
          </el-button>
        </el-empty>
      </div>
      <div v-else class="property-grid">
        <PropertyCard 
          v-for="item in filteredProperties"
          :key="item.propertyId"
          :data="item"
          @view-detail="handleViewDetail"
          @locate="handleLocate"
          @view-landlord="handleViewLandlord" />
      </div>
    </el-scrollbar>

    <!-- 统计信息 -->
    <div class="list-footer">
      <span>共 {{ filteredProperties.length }} 套房源</span>
      <span v-if="averageRent > 0">平均租金: ¥{{ averageRent }}/月</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PropertyCard from './PropertyCard.vue';
import { usePropertyStore } from '@/stores/property';

const propertyStore = usePropertyStore();

const filteredProperties = computed(() => propertyStore.filteredProperties);

const averageRent = computed(() => {
  const properties = filteredProperties.value.filter(p => p.rent);
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
  emit('viewDetail', propertyId);
};

const handleLocate = (gps: { lng: number; lat: number }) => {
  emit('locate', gps);
};

const handleViewLandlord = (landlordId: string) => {
  // 切换到房东视图并定位到该房东
  propertyStore.setViewMode('landlord');
  propertyStore.setFocusedLandlord(landlordId);
  
  // 也通知父组件
  emit('viewLandlord', landlordId);
};



const handleBackToLandlord = () => {
  propertyStore.setViewMode('landlord');
};
</script>

<style scoped lang="scss">
.property-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #FDFDFD;
}

.list-scrollbar {
  flex: 1;
  padding: 16px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}

.property-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  padding-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.list-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #ebeef5;
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;

  span {
    &:not(:last-child) {
      margin-right: 24px;
    }
  }
}
</style>
