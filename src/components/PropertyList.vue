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
          <el-radio-button label="card">卡片视图</el-radio-button>
          <el-radio-button label="compact">紧凑视图</el-radio-button>
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
            @click="handleCardClick(item)"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <!-- 紧凑视图 -->
    <div v-else class="compact-view">
      <div
        v-for="item in filteredProperties"
        :key="item.propertyId"
        class="compact-item"
        @click="handleViewDetail(item.propertyId)"
      >
        <video
          v-if="item.videos && item.videos.length > 0"
          class="compact-video-bg"
          :src="getVideoUrl(item.videos[0])"
          muted
          loop
          @mouseenter="playVideo"
          @mouseleave="pauseVideo"
        />
        <div v-else class="compact-no-video">
          <el-icon :size="40"><VideoCamera /></el-icon>
          <span>暂无视频</span>
        </div>
        <div class="compact-overlay">
          <div class="compact-rent">¥{{ item.rent || '--' }}</div>
          <div class="compact-info">
            <span class="compact-type">{{ item.roomType || '未知' }}</span>
            <span class="compact-phone">{{ item.landlordPhone }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { VideoCamera } from "@element-plus/icons-vue";
import PropertyCard from "./PropertyCard.vue";
import { usePropertyStore } from "@/stores/property";
import type { PropertyViewItem } from "@/types";

const propertyStore = usePropertyStore();

const viewType = ref<'card' | 'compact'>('card');

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

// 获取视频URL
const getVideoUrl = (video: any): string => {
  if (!video || !video.fileName) return '';
  // 返回文件路径，视频标签会尝试加载
  return video.fileName;
};

// 视频悬停播放
const playVideo = (event: MouseEvent) => {
  const video = event.target as HTMLVideoElement;
  if (video && video.tagName === 'VIDEO') {
    video.play().catch(() => {
      // 播放失败时忽略错误
    });
  }
};

// 视频停止播放
const pauseVideo = (event: MouseEvent) => {
  const video = event.target as HTMLVideoElement;
  if (video && video.tagName === 'VIDEO') {
    video.pause();
    video.currentTime = 0;
  }
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

.compact-view {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-content: start;
}

.compact-item {
  position: relative;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);

    .compact-info {
      opacity: 1;
    }
  }
}

.compact-video-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.compact-no-video {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  gap: 8px;
}

.compact-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
}

.compact-rent {
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.compact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.3s;

  .compact-type {
    font-size: 14px;
    color: white;
    font-weight: 600;
  }

  .compact-phone {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>
