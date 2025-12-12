<template>
  <div
    class="compact-item"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <video
      v-if="videoUrl"
      ref="videoRef"
      class="compact-video-bg"
      :src="videoUrl"
      muted
      loop
    />
    <div v-else class="compact-no-video">
      <el-icon :size="40"><VideoCameraFilled /></el-icon>
      <span>暂无视频</span>
    </div>
    <div class="compact-overlay">
      <div class="compact-rent">¥{{ data.rent || "--" }}</div>
      <div class="compact-info">
        <div class="compact-row">
          <span class="compact-type">{{ data.roomType || "未知" }}</span>
          <el-button
            class="compact-favorite-btn"
            :type="isFavorite ? 'warning' : 'info'"
            size="small"
            plain
            circle
            :icon="isFavorite ? StarFilled : Star"
            @click.stop="handleToggleFavorite"
          >
          </el-button>
        </div>
        <span class="compact-phone">{{ data.landlordPhone }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from "vue";
import { VideoCameraFilled, Star, StarFilled } from "@element-plus/icons-vue";
import type { PropertyViewItem } from "@/types";
import { getValidDirectoryHandle, getFileByPath } from "@/utils/fileSystem";

const props = defineProps<{
  data: PropertyViewItem;
}>();

const emit = defineEmits<{
  click: [];
  toggleFavorite: [landlordId: string, propertyId: string];
}>();

const videoRef = ref<HTMLVideoElement>();
const videoUrl = ref("");
const isFavorite = computed(() => props.data.isFavorite || false);

// 加载视频 URL（使用 blob）
const loadVideoUrl = async () => {
  // 清理旧的 URL
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }

  if (!props.data.videos || !props.data.videos[0]?.fileName) {
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
watch(() => props.data.videos?.[0]?.fileName, loadVideoUrl, {
  immediate: true,
});

// 组件卸载时清理 URL
onBeforeUnmount(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
});

const handleClick = () => {
  emit("click");
};

const handleMouseEnter = () => {
  if (videoRef.value) {
    videoRef.value.play().catch(() => {
      // 忽略自动播放失败
    });
  }
};

const handleMouseLeave = () => {
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
  }
};

const handleToggleFavorite = () => {
  emit("toggleFavorite", props.data.landlordId, props.data.propertyId);
};
</script>

<style scoped lang="scss">
.compact-item {
  position: relative;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    border: 2px solid #409eff;
    .compact-info {
      opacity: 1;
    }
    .compact-rent {
      color: #ff6348;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
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
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
}

.compact-rent {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}

.compact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.3s;

  .compact-row {
    display: flex;
    align-items: center;
  }
  .compact-type {
    font-size: 14px;
    color: white;
    font-weight: 600;
  }

  .compact-favorite-btn {
    font-size: 12px;
    background: none;
    border: none;
    padding: 0;
    height: fit-content;
  }

  .compact-phone {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>
