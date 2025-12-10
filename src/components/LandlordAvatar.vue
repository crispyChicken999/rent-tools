<template>
  <div class="landlord-avatar" @click.stop>
    <!-- 有头像或照片时显示图片 -->
    <el-image
      v-if="displayUrl"
      :src="displayUrl"
      :preview-src-list="[displayUrl]"
      :style="{ width: size + 'px', height: size + 'px' }"
      class="avatar-image"
      fit="cover"
      preview-teleported
      hide-on-click-modal
      lazy
    >
      <template #error>
        <div class="avatar-placeholder" :style="{ width: size + 'px', height: size + 'px', fontSize: size! * 0.5 + 'px' }">
          <el-icon><Picture /></el-icon>
        </div>
      </template>
    </el-image>

    <!-- 无图片时显示昵称首字母 -->
    <div
      v-else-if="nickname"
      class="avatar-placeholder text-avatar"
      :style="{ width: size + 'px', height: size + 'px', fontSize: size! * 0.4 + 'px' }"
    >
      {{ nickname.charAt(0).toUpperCase() }}
    </div>

    <!-- 兜底显示默认图标 -->
    <div
      v-else
      class="avatar-placeholder"
      :style="{ width: size + 'px', height: size + 'px', fontSize: size! * 0.6 + 'px' }"
    >
      <el-icon><User /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { User, Picture } from '@element-plus/icons-vue';
import { getValidDirectoryHandle, getFileByPath } from '@/utils/fileSystem';

const props = withDefaults(defineProps<{
  avatar?: string;
  photo?: string; // 备用照片（通常是第一张房源照片）
  nickname?: string;
  size?: number;
}>(), {
  size: 40
});

const loadedUrl = ref('');

// 优先显示头像，其次显示备用照片
const targetPath = computed(() => props.avatar || props.photo);
const displayUrl = computed(() => loadedUrl.value);

watch(targetPath, async (newVal) => {
  // 清理旧 URL
  if (loadedUrl.value) {
    URL.revokeObjectURL(loadedUrl.value);
    loadedUrl.value = '';
  }

  if (!newVal) return;

  try {
    const dirHandle = await getValidDirectoryHandle();
    if (!dirHandle) return;
    
    let file: File | null = null;
    
    // 1. 尝试直接作为路径获取
    if (newVal.includes('/') || newVal.includes('\\')) {
      file = await getFileByPath(dirHandle, newVal);
    } else {
      // 2. 尝试作为文件名获取
      // 如果是头像，可能在"微信头像"目录
      // 如果是照片，可能在根目录
      try {
        // 先试根目录
        const fileHandle = await dirHandle.getFileHandle(newVal);
        file = await fileHandle.getFile();
      } catch {
        try {
          // 试"微信头像"目录
          file = await getFileByPath(dirHandle, `微信头像/${newVal}`);
        } catch {
           // 试"视频"目录 (虽然不太可能是视频作为头像)
           // 忽略
        }
      }
    }

    if (file) {
      loadedUrl.value = URL.createObjectURL(file);
    }
  } catch (e) {
    // console.error('Failed to load avatar image', e);
  }
}, { immediate: true });

onUnmounted(() => {
  if (loadedUrl.value) {
    URL.revokeObjectURL(loadedUrl.value);
  }
});
</script>

<style scoped>
.landlord-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e5eaf3;
  flex-shrink: 0;
}

.avatar-image {
  display: block;
  cursor: pointer;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #c0c4cc;
  color: white;
  width: 100%;
  height: 100%;
}

.text-avatar {
  background-color: #409eff;
}
</style>