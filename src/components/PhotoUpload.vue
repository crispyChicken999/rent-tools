<template>
  <div class="photo-upload">
    <div class="upload-section">
      <div v-if="folderPath" class="current-folder">
        当前文件夹：<el-tag type="success">{{ folderPath }}</el-tag>
      </div>
      <el-alert
        v-if="!isSupported"
        title="浏览器不支持"
        type="warning"
        description="当前浏览器不支持 File System Access API，请使用 Chrome 86+ 或 Edge 86+"
        :closable="false"
        show-icon
      />

      <div v-else class="button-group">
        <el-button
          type="primary"
          size="large"
          :icon="Folder"
          
          @click="selectFolder"
          :loading="scanning"
        >
          选择照片文件夹
        </el-button>

        <el-button
          v-if="folderPath"
          type="success"
          size="large"
          :icon="Refresh"
          
          @click="scanFolder"
          :loading="scanning"
        >
          扫描文件夹
        </el-button>

        <el-button
          v-if="folderPath"
          type="warning"
          size="large"
          :icon="Edit"
          
          @click="startQuickOrganize"
        >
          快速整理
        </el-button>

        <el-button
          type="danger"
          size="large"
          :icon="Delete"
          
          @click="handleClearData"
          :loading="scanning"
        >
          清空所有数据
        </el-button>
      </div>

      <el-progress
        v-if="scanning"
        :percentage="progress"
        :format="formatProgress"
        style="margin-top: 20px"
      />

      <div v-if="scanResult" class="scan-result">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="总文件数">
            {{ scanResult.total }}
          </el-descriptions-item>
          <el-descriptions-item label="成功导入">
            {{ scanResult.success }}
          </el-descriptions-item>
          <el-descriptions-item label="失败数">
            {{ scanResult.failed }}
          </el-descriptions-item>
          <el-descriptions-item label="用时">
            {{ scanResult.duration }}秒
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 快速整理弹窗 -->
    <el-dialog
      v-model="showQuickOrganize"
      title="快速整理房东信息 (快捷键: ←/→/A/D 切换, +/- 缩放, Delete 删除, Enter 保存)"
      fullscreen
      :show-close="true"
      @opened="onQuickOrganizeOpened"
      @closed="closeQuickOrganize"
      class="quick-organize-dialog"
    >
      <div
        class="organize-container"
        v-if="organizeLandlord"
        @keydown="handleOrganizeKeydown"
        tabindex="0"
        ref="containerRef"
        style="outline: none; height: 100%; display: flex"
      >
        <div class="left-panel">
          <el-carousel
            trigger="click"
            height="80vh"
            :autoplay="false"
            indicator-position="outside"
            v-if="currentImageUrls.length > 0"
          >
            <el-carousel-item
              v-for="(url, index) in currentImageUrls"
              :key="index"
            >
              <div
                class="image-wrapper"
                :class="{ 'is-zoomed': isImageZoomed }"
                @click="toggleImageZoom"
              >
                <img :src="url" class="carousel-image" />
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-image">无照片</div>
          <div class="photo-info">{{ currentImageUrls.length }} 张照片</div>
        </div>

        <div class="right-panel">
          <div class="info-card">
            <h3>
              房东 {{ organizeIndex + 1 }} /
              {{ propertyStore.landlords.length }}
            </h3>
            <p class="landlord-id">ID: {{ organizeLandlord.id }}</p>

            <div class="form-section">
              <div
                v-for="(phone, index) in currentPhones"
                :key="index"
                class="phone-input-wrapper"
                style="margin-bottom: 10px"
              >
                <el-input
                  :ref="(el:any) => (phoneInputRefs[index] = el)"
                  v-model="currentPhones[index]"
                  placeholder="输入电话号码"
                  size="large"
                  @keydown.enter.exact.prevent="saveAndNext"
                  @keydown.ctrl.enter.prevent="addPhoneField"
                  clearable
                >
                  <template #prepend>电话 {{ index + 1 }}</template>
                </el-input>
              </div>
              <div class="input-tip">
                Enter 保存 | Ctrl+Enter 添加号码 | A/D 切换
              </div>
            </div>

            <div class="actions">
              <el-button
                type="danger"
                size="large"
                @click="handleDeleteRequest"
                class="action-btn"
              >
                删除 (Delete) {{ deleteConfirmCount > 0 ? "再次确认" : "" }}
              </el-button>

              <div class="nav-buttons">
                <el-button
                  size="large"
                  @click="prevLandlord"
                  :disabled="organizeIndex <= 0"
                >
                  上一个 (←/A)
                </el-button>
                <el-button
                  type="primary"
                  size="large"
                  @click="nextLandlord"
                  :disabled="
                    organizeIndex >= propertyStore.landlords.length - 1
                  "
                >
                  下一个 (→/D)
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <el-empty description="没有房东数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Folder, Refresh, Delete, Edit } from "@element-plus/icons-vue";
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  getValidDirectoryHandle,
  scanDirectory,
  getFileByName,
} from "@/utils/fileSystem";
import { extractExif } from "@/utils/exif";
import { usePropertyStore } from "@/stores/property";
import type { Photo } from "@/types";

const propertyStore = usePropertyStore();

const isSupported = ref(isFileSystemAccessSupported());
const folderPath = ref("");
const scanning = ref(false);
const progress = ref(0);
const currentFile = ref(0);
const totalFiles = ref(0);

const scanResult = ref<{
  total: number;
  success: number;
  failed: number;
  duration: number;
} | null>(null);

const handleClearData = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有数据吗？此操作不可恢复！",
      "警告",
      {
        confirmButtonText: "确定清空",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    scanning.value = true;
    await propertyStore.clearAllData();
    folderPath.value = "";
    scanResult.value = null;
    dirHandle = null;
    ElMessage.success("所有数据已清空");
  } catch (error) {
    if (error !== "cancel") {
      console.error("Clear data error:", error);
      ElMessage.error("清空数据失败");
    }
  } finally {
    scanning.value = false;
  }
};

let dirHandle: FileSystemDirectoryHandle | null = null;

onMounted(async () => {
  // 尝试恢复已保存的文件夹访问权限
  const savedHandle = await getValidDirectoryHandle();
  if (savedHandle) {
    dirHandle = savedHandle;
    folderPath.value = savedHandle.name;
  }
});

async function selectFolder() {
  try {
    const result = await requestDirectoryAccess();
    dirHandle = result.handle;
    folderPath.value = result.displayPath;
    ElMessage.success("文件夹访问权限已授予");
  } catch (error: any) {
    if (error.message.includes("取消")) {
      ElMessage.info("已取消选择");
    } else {
      ElMessage.error(`选择文件夹失败: ${error.message}`);
    }
  }
}

async function scanFolder() {
  if (!dirHandle) {
    ElMessage.warning("请先选择文件夹");
    return;
  }

  scanning.value = true;
  scanResult.value = null;
  const startTime = Date.now();

  try {
    // 扫描文件
    const files = await scanDirectory(dirHandle, (current, total) => {
      currentFile.value = current;
      totalFiles.value = total;
      progress.value = Math.round((current / total) * 100);
    });

    let successCount = 0;
    let failedCount = 0;

    // 处理每个文件
    for (const fileEntry of files) {
      try {
        if (fileEntry.type === "image") {
          // 检查是否已存在相同文件名的照片
          const isDuplicate = propertyStore.landlords.some((l) =>
            l.photos.some((p) => p.fileName === fileEntry.name)
          );

          if (isDuplicate) {
            console.log(`跳过重复文件: ${fileEntry.name}`);
            continue;
          }

          const file = await fileEntry.handle.getFile();
          const exifData = await extractExif(file);

          const photo: Photo = {
            id: `photo-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            fileName: fileEntry.name,
            folderId: "userPhotosFolder",
            captureTime: exifData.captureTime,
            gps: exifData.gps,
          };

          // 自动建档
          await propertyStore.createLandlord({
            photos: [photo],
            gps: exifData.gps,
            captureTime: exifData.captureTime,
            folderId: "userPhotosFolder",
          });

          successCount++;
        }
      } catch (error) {
        console.error(`处理文件失败 ${fileEntry.name}:`, error);
        failedCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    scanResult.value = {
      total: files.length,
      success: successCount,
      failed: failedCount,
      duration: Number(duration),
    };

    ElMessage.success(`扫描完成！成功导入 ${successCount} 个文件`);
  } catch (error: any) {
    ElMessage.error(`扫描失败: ${error.message}`);
  } finally {
    scanning.value = false;
    progress.value = 0;
  }
}

// ========== 快速整理功能 ==========

const showQuickOrganize = ref(false);
const organizeIndex = ref(0);
const currentPhones = ref<string[]>([""]);
const deleteConfirmCount = ref(0);
const currentImageUrls = ref<string[]>([]);
const isImageZoomed = ref(false);
const phoneInputRefs = ref<any[]>([]);
const containerRef = ref<HTMLElement | null>(null);
let loadingImagesVersion = 0;

const organizeLandlord = computed(() => {
  if (propertyStore.landlords.length === 0) return null;
  return propertyStore.landlords[organizeIndex.value];
});

const loadImagesForCurrentLandlord = async () => {
  const myVersion = ++loadingImagesVersion;

  // 释放旧的 URL
  currentImageUrls.value.forEach((url) => URL.revokeObjectURL(url));
  currentImageUrls.value = [];
  phoneInputRefs.value = [];

  if (!organizeLandlord.value) return;

  // 设置当前电话
  currentPhones.value = organizeLandlord.value.phoneNumbers?.length
    ? [...organizeLandlord.value.phoneNumbers]
    : [""];
  deleteConfirmCount.value = 0;

  // 确保有文件夹访问权限
  if (!dirHandle) {
    dirHandle = await getValidDirectoryHandle();
  }

  if (!dirHandle) return;

  const urls: string[] = [];
  // 只加载前5张图片以提高性能，或者全部加载
  for (const photo of organizeLandlord.value.photos) {
    if (myVersion !== loadingImagesVersion) return; // 如果有新的加载请求，中止当前请求
    try {
      const file = await getFileByName(dirHandle, photo.fileName);
      if (file) {
        urls.push(URL.createObjectURL(file));
      }
    } catch (e) {
      console.error("Load image error", e);
    }
  }

  if (myVersion === loadingImagesVersion) {
    currentImageUrls.value = urls;
  } else {
    // 如果版本不匹配，说明有新的加载请求，这些 URL 应该被释放（虽然它们还没被赋值给 currentImageUrls，但已经创建了 Blob URL）
    urls.forEach((url) => URL.revokeObjectURL(url));
  }
};

const startQuickOrganize = async () => {
  if (propertyStore.landlords.length === 0) {
    ElMessage.warning("没有房东数据");
    return;
  }

  // 查找第一个没有电话号码的房东
  const nextIndex = propertyStore.landlords.findIndex(
    (l) => !l.phoneNumbers || l.phoneNumbers.length === 0
  );

  showQuickOrganize.value = true;
  organizeIndex.value = nextIndex !== -1 ? nextIndex : 0;

  if (nextIndex !== -1) {
    ElMessage.success(`已自动跳转到第 ${nextIndex + 1} 个待整理房东`);
  } else {
    ElMessage.info("所有房东都已整理，从头开始浏览");
  }

  await loadImagesForCurrentLandlord();
};

const toggleImageZoom = () => {
  isImageZoomed.value = !isImageZoomed.value;
  nextTick(() => {
    if (isImageZoomed.value) {
      // 放大时滚动到中间
      const wrappers = document.querySelectorAll(".image-wrapper.is-zoomed");
      wrappers.forEach((wrapper) => {
        const img = wrapper.querySelector("img");
        if (img) {
          // 垂直居中
          wrapper.scrollTop = (img.scrollHeight - wrapper.clientHeight) / 2;
        }
      });
    }

    if (phoneInputRefs.value.length > 0) {
      phoneInputRefs.value[0]?.focus();
    }
  });
};

const onQuickOrganizeOpened = () => {
  nextTick(() => {
    if (phoneInputRefs.value.length > 0) {
      phoneInputRefs.value[0]?.focus();
    }
  });
};

const closeQuickOrganize = () => {
  showQuickOrganize.value = false;
  currentImageUrls.value.forEach((url) => URL.revokeObjectURL(url));
  currentImageUrls.value = [];
};

const nextLandlord = () => {
  if (organizeIndex.value < propertyStore.landlords.length - 1) {
    organizeIndex.value++;
    isImageZoomed.value = false;
    loadImagesForCurrentLandlord();
    nextTick(() => {
      if (phoneInputRefs.value.length > 0) {
        phoneInputRefs.value[0]?.focus();
      }
    });
  } else {
    ElMessage.info("已经是最后一个了");
  }
};

const prevLandlord = () => {
  if (organizeIndex.value > 0) {
    organizeIndex.value--;
    isImageZoomed.value = false;
    loadImagesForCurrentLandlord();
    nextTick(() => {
      if (phoneInputRefs.value.length > 0) {
        phoneInputRefs.value[0]?.focus();
      }
    });
  }
};

const addPhoneField = () => {
  currentPhones.value.push("");
  nextTick(() => {
    const inputs = phoneInputRefs.value;
    if (inputs && inputs.length > 0) {
      inputs[inputs.length - 1]?.focus();
    }
  });
};

const saveAndNext = async () => {
  if (organizeLandlord.value) {
    // 保存电话
    const validPhones = currentPhones.value
      .map((p) => p.trim())
      .filter((p) => p);

    if (
      validPhones.length > 0 ||
      organizeLandlord.value.phoneNumbers.length > 0
    ) {
      await propertyStore.updateLandlordData(organizeLandlord.value.id, {
        phoneNumbers: validPhones,
      });
      ElMessage.success("保存成功");
    }

    // 自动跳转下一个
    if (organizeIndex.value < propertyStore.landlords.length - 1) {
      nextLandlord();
    } else {
      ElMessage.success("整理完成！");
    }
  }
};

const handleDeleteRequest = async () => {
  deleteConfirmCount.value++;
  if (deleteConfirmCount.value >= 2) {
    if (organizeLandlord.value) {
      const idToDelete = organizeLandlord.value.id;
      await propertyStore.removeLandlord(idToDelete);
      ElMessage.success("已删除");

      if (propertyStore.landlords.length === 0) {
        closeQuickOrganize();
      } else {
        if (organizeIndex.value >= propertyStore.landlords.length) {
          organizeIndex.value = propertyStore.landlords.length - 1;
        }
        // 重新加载当前（新的）房东
        isImageZoomed.value = false;
        loadImagesForCurrentLandlord();
        nextTick(() => {
          if (phoneInputRefs.value.length > 0) {
            phoneInputRefs.value[0]?.focus();
          }
        });
      }
    }
  } else {
    ElMessage.warning("再按一次删除键确认删除");
  }
};

const handleOrganizeKeydown = (e: KeyboardEvent) => {
  if (!showQuickOrganize.value) return;

  // Arrow Left/Right or A/D for navigation
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    e.preventDefault();
    nextLandlord();
  } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    e.preventDefault();
    prevLandlord();
  } else if (e.key === "Delete") {
    e.preventDefault();
    handleDeleteRequest();
  } else if (e.key === "+" || e.key === "=" || e.key === "-") {
    e.preventDefault();
    toggleImageZoom();
  }
};

function formatProgress(_percentage: number): string {
  return `${currentFile.value} / ${totalFiles.value}`;
}
</script>

<style scoped>
.photo-upload {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.current-folder {
  text-align: center;
  font-size: 14px;
  padding: 5px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background-color: #f0f0f0;
  border: 1px solid #dcdfe6;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-button {
  margin: 0;
}

.scan-result {
  margin-top: 20px;
}

:deep(.quick-organize-dialog .el-dialog__body) {
  padding: 0;
  height: calc(100vh - 87px);
  overflow: hidden;
}

.organize-container {
  display: flex;
}

.left-panel {
  flex: 2;
  background: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: all 0.3s ease;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
  overflow: hidden;
}

.image-wrapper.is-zoomed {
  display: block;

}
.image-wrapper.is-zoomed .carousel-image {
  width: 100%;
  height: auto;
  max-width: none;
  max-height: none;
  object-fit: unset;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.photo-info {
  position: absolute;
  bottom: 20px;
  right: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
}

.right-panel {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info-card {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.landlord-id {
  color: #909399;
  font-size: 12px;
  margin-bottom: 20px;
}

.form-section {
  margin: 30px 0;
}

.input-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.nav-buttons .el-button {
  flex: 1;
}

.action-btn {
  width: 100%;
}

.no-image {
  color: white;
  text-align: center;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
