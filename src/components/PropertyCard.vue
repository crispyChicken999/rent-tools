<template>
  <el-card class="property-card" shadow="hover">
    <!-- 视频缩略图 -->
    <div class="card-video" @click="handleViewDetail">
      <video
        v-if="videoUrl"
        :src="videoUrl"
        class="video-thumbnail"
        muted
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      />
      <div v-else class="no-video">
        <el-icon :size="40"><VideoCameraFilled /></el-icon>
        <span>暂无视频</span>
      </div>
      <div class="play-overlay">
        <el-icon :size="40"><VideoPlay /></el-icon>
      </div>
      <el-button
        class="locate-btn"
        size="small"
        :icon="Location"
        circle
        @click.stop="handleLocate"
      />
    </div>

    <!-- 房源信息 -->
    <div class="card-body">
      <h3 class="property-title">
        {{ data.roomType }}
        <span v-if="data.floor" class="floor">· {{ data.floor }}楼</span>
      </h3>
      <div class="rent">
        ¥{{ data.rent || "--" }} <span class="unit">/ 月</span>
      </div>
      <div class="address" @click="handleGoToLandlord">
        <el-icon><LocationInformation /></el-icon>
        {{ data.address || "暂无地址" }}
      </div>

      <!-- 配套设施标签 -->
      <div v-if="data.amenities.length > 0" class="amenities">
        <el-tag
          v-for="item in displayAmenities"
          :key="item"
          size="small"
          type="info"
        >
          {{ item }}
        </el-tag>
        <el-tag v-if="data.amenities.length > 4" size="small" type="info">
          +{{ data.amenities.length - 4 }}
        </el-tag>
      </div>

      <!-- 公共费用 -->
      <div class="fees">
        <span class="fee-item">
          💧
          {{ formatWater(data.water) }}
        </span>
        <span class="fee-item">
          <el-icon><Lightning /></el-icon>
          {{ formatElectricity(data.electricity) }}
        </span>
        <span class="fee-item">
          <el-icon><Money /></el-icon>
          {{ data.deposit }}
        </span>
      </div>

      <!-- 房东信息 -->
      <div class="landlord-info">
        <el-icon><Phone /></el-icon>
        {{ data.landlordPhone }} ({{ getLandlordTypeLabel(data.landlordType) }})
      </div>

      <!-- 操作按钮 -->
      <el-button type="primary" @click="handleViewDetail" class="detail-btn">
        查看详情
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";
import {
  VideoPlay,
  Location,
  LocationInformation,
  Phone,
  Lightning,
  Money,
  VideoCameraFilled,
} from "@element-plus/icons-vue";
import type { PropertyViewItem } from "@/types";
import { LandlordType } from "@/types";
import { getValidDirectoryHandle, getFileByPath } from "@/utils/fileSystem";

const props = defineProps<{
  data: PropertyViewItem;
}>();

const emit = defineEmits<{
  viewDetail: [propertyId: string];
  locate: [gps: { lng: number; lat: number }];
  viewLandlord: [landlordId: string];
}>();

const videoUrl = ref("");
const displayAmenities = computed(() => props.data.amenities.slice(0, 4));

// 加载视频 URL
const loadVideoUrl = async () => {
  // 清理旧的 URL
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }

  if (!props.data.videos[0]?.fileName) {
    videoUrl.value = "";
    return;
  }

  try {
    const dirHandle = await getValidDirectoryHandle("userPhotosFolder");
    if (!dirHandle) {
      videoUrl.value = "";
      return;
    }

    const file = await getFileByPath(dirHandle, props.data.videos[0].fileName);
    if (file) {
      videoUrl.value = URL.createObjectURL(file);
    }
  } catch (error) {
    console.error("加载视频失败:", error);
    videoUrl.value = "";
  }
};

// 监听数据变化
watch(() => props.data.videos[0]?.fileName, loadVideoUrl, { immediate: true });

// 组件卸载时清理 URL
onBeforeUnmount(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
});

const handleViewDetail = () => {
  emit("viewDetail", props.data.propertyId);
};

const handleLocate = () => {
  if (props.data.gps) {
    emit("locate", props.data.gps);
  }
};

const handleGoToLandlord = () => {
  emit("viewLandlord", props.data.landlordId);
};

const handleMouseEnter = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  video.play().catch(() => {
    // 忽略自动播放失败
  });
};

const handleMouseLeave = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  video.pause();
  video.currentTime = 0;
};

const formatWater = (water: { type: string; price?: number }) => {
  if (water.type === "civil") return "3元/吨（民用水）";
  if (water.type === "5.0") return "5元/吨（民用水）";
  if (water.price) return `${water.price}元/吨`;
  return water.type;
};

const formatElectricity = (electricity: { type: string; price?: number }) => {
  if (electricity.type === "civil") return "0.6元/度（民用电）";
  if (electricity.type === "0.88") return "0.8元/度";
  if (electricity.type === "1.0") return "1元/度";
  if (electricity.type === "1.5") return "1.5元/度";
  if (electricity.price) return `${electricity.price}元/度`;
  return electricity.type;
};

const getLandlordTypeLabel = (type: LandlordType) => {
  const labels: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: "一手房东",
    [LandlordType.SecondHand]: "二手房东",
    [LandlordType.Agent]: "中介",
    [LandlordType.Other]: "其他",
  };
  return labels[type] || "未知";
};
</script>

<style scoped lang="scss">
.property-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid #ebeef5;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.card-video {
  position: relative;
  width: 100%;
  padding-top: 56.25%; // 16:9 比例
  background: #f5f5f5;
  overflow: hidden;
  cursor: pointer;

  .video-thumbnail {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    gap: 8px;
  }

  .play-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  &:hover .play-overlay {
    opacity: 1;
  }

  .locate-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    z-index: 1;

    &:hover {
      background: white;
    }
  }
}

.card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 4px;

  .floor {
    font-size: 14px;
    color: #909399;
    font-weight: normal;
  }
}

.rent {
  font-size: 24px;
  font-weight: 700;
  color: #f56c6c;

  .unit {
    font-size: 14px;
    font-weight: normal;
    color: #909399;
  }
}

.address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #409eff;
  }

  .el-icon {
    font-size: 16px;
  }
}

.amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fees {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;

  .fee-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #606266;

    .el-icon {
      font-size: 14px;
    }
  }
}

.landlord-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;

  .el-icon {
    font-size: 14px;
  }
}

.detail-btn {
  width: 100%;
  margin-top: auto;
}
</style>
