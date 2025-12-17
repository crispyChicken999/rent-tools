<template>
  <div class="photo-upload">
    <div class="upload-section">
      <!-- 操作说明 -->
      <el-collapse v-model="activeHelp" class="help-section">
        <el-collapse-item name="1">
          <template #title>
            <div class="help-title">
              <el-icon><QuestionFilled /></el-icon>
              <span>操作说明</span>
            </div>
          </template>
          <div class="help-content">
            <div class="help-step">
              <h4>📁 第一步：选择照片文件夹</h4>
              <p>
                点击"选择照片文件夹"按钮，选择存放招租广告照片的文件夹。系统会记住这个文件夹，下次打开无需重新选择。
              </p>
            </div>
            <div class="help-step">
              <h4>🔍 第二步：扫描文件夹</h4>
              <p>
                点击"扫描文件夹"按钮，系统会自动读取照片的GPS信息，并为每张照片创建房东记录。
              </p>
            </div>
            <div class="help-step">
              <h4>⚡ 第三步：快速整理</h4>
              <p>
                点击"快速整理"按钮，进入快速录入模式。左侧查看照片，右侧输入电话号码。
              </p>
              <ul>
                <li><kbd>Enter</kbd> - 保存并跳转到下一个房东</li>
                <li><kbd>Shift+Enter</kbd> - 添加新的电话号码输入框</li>
                <li><kbd>↑/↓</kbd> - 在多个电话输入框之间切换</li>
                <li>
                  <kbd>←/→</kbd> 或 <kbd>A/D</kbd> - 切换上一个/下一个房东
                </li>
                <li>
                  <kbd>+/-</kbd> -
                  循环切换图片缩放模式（正常/竖屏放大/横屏放大）
                </li>
                <li><kbd>Delete</kbd> - 删除当前房东（需按两次确认）</li>
              </ul>
            </div>
            <div class="help-step">
              <h4>💡 小贴士</h4>
              <ul>
                <li>
                  照片必须包含GPS信息才能自动定位，建议使用手机原生相机拍摄
                </li>
                <li>
                  系统不会复制照片文件，只是记录文件位置，请勿移动或删除原始照片
                </li>
                <li>
                  如果房东有多个电话号码，可以使用
                  <kbd>Shift+Enter</kbd> 添加多个输入框
                </li>
                <li>点击绿色"保存"按钮可以保存当前房东信息而不跳转</li>
              </ul>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

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
        <!-- 第一行：选择文件夹和扫描按钮 -->
        <div class="button-row">
          <el-button
            id="btn-select-folder"
            type="primary"
            size="large"
            :icon="Folder"
            @click="selectFolder"
            :loading="scanning"
          >
            选择照片文件夹
          </el-button>

          <el-button
            id="btn-scan-folder"
            :disabled="!folderPath"
            type="success"
            size="large"
            :icon="Refresh"
            @click="scanFolder"
            :loading="scanning"
          >
            扫描文件夹
          </el-button>
        </div>

        <el-button
          id="btn-fast-origanize"
          type="warning"
          size="large"
          :icon="Edit"
          :disabled="!folderPath"
          :loading="scanning"
          @click="startQuickOrganize"
        >
          快速整理
        </el-button>

        <el-button
          id="btn-batch-scan-phone-location"
          type="success"
          size="large"
          :icon="Location"
          :loading="scanning"
          @click="batchRecognizeLocations"
        >
          批量识别手机号码归属地
        </el-button>

        <el-button
          id="btn-clear-data"
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

    <!-- 批量识别日志弹窗 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量识别归属地"
      width="650px"
      :close-on-click-modal="false"
      :close-on-press-escape="!scanning"
      :show-close="!scanning"
    >
      <div class="batch-log-container">
        <!-- 进度条 -->
        <div v-if="scanning" class="batch-status">
          <el-progress
            :percentage="progress"
            :format="formatProgress"
            style="margin-bottom: 16px"
          />
          <p style="text-align: center; color: #909399; margin-bottom: 16px">
            正在识别中，请勿关闭...
          </p>
        </div>

        <!-- 汇总信息 -->
        <div v-if="batchSummary" class="batch-summary">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="总计">
              <span
                class="clickable-stat"
                :class="{ active: batchLogFilter === 'all' }"
                @click="toggleBatchLogFilter('all')"
                title="点击显示全部"
              >
                {{ batchSummary.total }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="成功">
              <span
                class="clickable-stat success"
                :class="{ active: batchLogFilter === 'success' }"
                @click="toggleBatchLogFilter('success')"
                title="点击筛选成功项"
              >
                {{ batchSummary.success }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="失败">
              <span
                class="clickable-stat error"
                :class="{ active: batchLogFilter === 'error' }"
                @click="toggleBatchLogFilter('error')"
                title="点击筛选失败项"
              >
                {{ batchSummary.failed }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="耗时">
              {{ batchSummary.duration }}s
            </el-descriptions-item>
          </el-descriptions>
          <p class="filter-hint">
            💡 点击数字可筛选日志
            <span v-if="batchLogFilter !== 'all'" style="margin-left: 8px">
              （当前：{{
                batchLogFilter === "success" ? "成功" : "失败"
              }}，再次点击取消筛选）
            </span>
          </p>
          <el-alert
            v-if="batchSummary.interrupted"
            title="识别已被中断"
            type="warning"
            :closable="false"
            style="margin-top: 8px"
          />
        </div>

        <!-- 日志列表 -->
        <div
          class="batch-log-list"
          style="max-height: 300px; overflow-y: auto; margin-top: 12px"
        >
          <div
            v-for="(log, index) in filteredBatchLogs"
            :key="index"
            class="batch-log-item"
            :class="log.status"
          >
            <span class="phone">{{ log.phone }}</span>
            <span class="arrow">→</span>
            <span v-if="log.status === 'success'" class="location">{{
              log.location
            }}</span>
            <span v-else class="error">{{ log.message || "失败" }}</span>
          </div>
          <el-empty
            v-if="filteredBatchLogs.length === 0 && !scanning"
            :description="
              batchLogFilter !== 'all' ? '没有符合条件的记录' : '暂无记录'
            "
          />
          <el-empty
            v-if="batchLogs.length === 0 && scanning"
            description="等待识别..."
          />
        </div>
      </div>
      <template #footer>
        <el-button
          v-if="scanning"
          type="danger"
          @click="cancelBatchRecognize"
          :disabled="batchCancelled"
        >
          {{ batchCancelled ? "正在中断..." : "中断识别" }}
        </el-button>
        <el-button
          v-if="!scanning"
          type="primary"
          @click="showBatchDialog = false"
        >
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 快速整理弹窗 -->
    <el-dialog
      v-model="showQuickOrganize"
      title="快速整理房东信息 (快捷键: ←/→/A/D 切换, +/- 循环缩放, Delete 删除, Enter 保存)"
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
                :class="{
                  'zoom-portrait-large': imageZoomMode === 1,
                  'zoom-landscape-large': imageZoomMode === 2,
                }"
                :data-zoom-mode="imageZoomMode"
                @click="() => toggleImageZoom('forward')"
              >
                <img :src="url" class="carousel-image" />
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-image">无照片</div>
          <div class="photo-info">{{ currentImageUrls.length }} 张照片</div>
          <!-- 缩放模式提示 -->
          <div class="zoom-mode-indicator" v-if="imageZoomMode > 0">
            {{ zoomModeText }}
          </div>
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
                v-for="(_phone, index) in currentPhones"
                :key="index"
                class="phone-input-wrapper"
                style="margin-bottom: 10px"
              >
                <div style="display: flex; align-items: center; gap: 8px">
                  <el-input
                    :ref="(el:any) => (phoneInputRefs[index] = el)"
                    v-model="currentPhones[index][0]"
                    placeholder="输入电话号码"
                    size="large"
                    @keydown.enter.exact.prevent="saveAndNext"
                    @keydown.shift.enter.prevent="addPhoneField"
                    @keydown.up.prevent="focusPrevInput(index)"
                    @keydown.down.prevent="focusNextInput(index)"
                    clearable
                    style="flex: 1"
                  >
                    <template #prepend>电话 {{ index + 1 }}</template>
                  </el-input>
                  <el-tag
                    v-if="currentPhones[index][1]"
                    type="info"
                    size="small"
                    style="white-space: nowrap"
                  >
                    {{ currentPhones[index][1] }}
                  </el-tag>
                </div>
              </div>
              <div class="input-tip">
                <p>Enter 保存 | Shift+Enter 添加号码 | ↑/↓ 切换输入框</p>
                <p>A/D或左右箭头 切换房东 | +/- 循环缩放</p>
              </div>
              <div>
                <el-checkbox v-model="deleteWithImages">
                  同时删除对应的图片文件（图片会移动到同目录下的 .trash
                  文件夹中）
                </el-checkbox>
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
                  type="success"
                  size="large"
                  @click="saveCurrentLandlord"
                  :icon="Check"
                >
                  保存
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

    <!-- 删除确认弹窗 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Folder,
  Refresh,
  Delete,
  Edit,
  Check,
  QuestionFilled,
  Location,
} from "@element-plus/icons-vue";
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  getValidDirectoryHandle,
  scanDirectory,
  getFileByName,
} from "@/utils/fileSystem";
import { extractExif } from "@/utils/exif";
import { usePropertyStore } from "@/stores/property";
import { queryPhoneLocation } from "@/utils/phoneLocation";
import type { Photo } from "@/types";

const propertyStore = usePropertyStore();

const isSupported = ref(isFileSystemAccessSupported());
const folderPath = ref("");
const scanning = ref(false);
const progress = ref(0);
const currentFile = ref(0);
const totalFiles = ref(0);
const batchProgressText = ref(""); // 批量识别进度文本
const activeHelp = ref<string[]>([]); // 默认折叠帮助面板

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
    // 请求读写权限
    const result = await requestDirectoryAccess(
      "userPhotosFolder",
      "readwrite"
    );
    dirHandle = result.handle;
    folderPath.value = result.displayPath;
    ElMessage.success("文件夹访问权限已授予（包含写入权限）");
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

// ========== 批量识别归属地功能 ==========

interface BatchLogItem {
  phone: string;
  location: string;
  status: "success" | "error" | "skip";
  message?: string;
}

interface BatchSummary {
  total: number;
  success: number;
  failed: number;
  duration: number; // 秒
  interrupted: boolean;
}

const batchLogs = ref<BatchLogItem[]>([]);
const showBatchDialog = ref(false);
const batchCancelled = ref(false); // 中断标记
const batchSummary = ref<BatchSummary | null>(null);
const batchLogFilter = ref<"all" | "success" | "error">("all"); // 日志筛选

// 过滤后的日志列表
const filteredBatchLogs = computed(() => {
  if (batchLogFilter.value === "all") {
    return batchLogs.value;
  }
  return batchLogs.value.filter((log) => log.status === batchLogFilter.value);
});

// 切换筛选
const toggleBatchLogFilter = (filter: "all" | "success" | "error") => {
  if (batchLogFilter.value === filter) {
    batchLogFilter.value = "all"; // 再次点击取消筛选
  } else {
    batchLogFilter.value = filter;
  }
};

const batchRecognizeLocations = async () => {
  const landlords = propertyStore.landlords;

  // 统计需要识别的电话数量
  let totalPhonesToProcess = 0;
  landlords.forEach((l) => {
    l.phoneNumbers.forEach(([phone, location]) => {
      if (phone && phone.trim() && !location) {
        totalPhonesToProcess++;
      }
    });
  });

  if (totalPhonesToProcess === 0) {
    ElMessage.info("所有电话号码都已有归属地信息");
  }

  // 统计已有归属地的电话数量
  let phonesWithLocation = 0;
  landlords.forEach((l) => {
    l.phoneNumbers.forEach(([phone, location]) => {
      if (phone && phone.trim() && location) {
        phonesWithLocation++;
      }
    });
  });

  // 显示选项对话框
  let forceRerecognize = false;

  if (phonesWithLocation > 0) {
    // 有已识别的号码，让用户选择
    try {
      await ElMessageBox({
        title: "批量识别归属地",
        message: `发现 ${totalPhonesToProcess} 个待识别号码，${phonesWithLocation} 个已有归属地信息。\n\n请选择识别模式~`,
        showCancelButton: true,
        confirmButtonText: "只识别新号码",
        cancelButtonText: "全部重新识别",
        distinguishCancelAndClose: true,
        showClose: true,
        type: "info",
        customClass: "batch-recognize-dialog",
      });
      // 用户点击了"只识别新号码"
      forceRerecognize = false;
    } catch (action) {
      if (action === "cancel") {
        // 询问是否要全部重新识别
        try {
          await ElMessageBox.confirm(
            `是否重新识别所有 ${
              totalPhonesToProcess + phonesWithLocation
            } 个号码（包括已有归属地的）？`,
            "重新识别全部",
            {
              confirmButtonText: "全部重新识别",
              cancelButtonText: "取消",
              type: "warning",
            }
          );
          forceRerecognize = true;
          totalPhonesToProcess += phonesWithLocation;
        } catch {
          return;
        }
      } else {
        // 用户关闭了对话框
        return;
      }
    }
  } else {
    // 没有已识别的号码，直接确认
    try {
      await ElMessageBox.confirm(
        `将为 ${totalPhonesToProcess} 个电话号码识别归属地，是否继续？`,
        "批量识别归属地",
        {
          confirmButtonText: "开始识别",
          cancelButtonText: "取消",
          type: "info",
        }
      );
    } catch {
      return;
    }
  }

  const startTime = Date.now();
  scanning.value = true;
  progress.value = 0;
  batchLogs.value = [];
  batchSummary.value = null;
  batchCancelled.value = false;
  batchLogFilter.value = "all"; // 重置筛选
  showBatchDialog.value = true;
  batchProgressText.value = `0 / ${totalPhonesToProcess}`;

  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let updatedLandlordCount = 0;

  try {
    for (const landlord of landlords) {
      // 检查是否中断
      if (batchCancelled.value) {
        break;
      }

      const phones = landlord.phoneNumbers;
      // 根据 forceRerecognize 决定是否需要更新
      const needsUpdate = phones.some(
        ([phone, location]) =>
          phone && phone.trim() && (forceRerecognize || !location)
      );

      if (needsUpdate) {
        // 逐个查询电话号码，以便记录日志
        const updatedPhones: [string, string][] = [];

        for (const [phone, existingLocation] of phones) {
          // 再次检查是否中断
          if (batchCancelled.value) {
            // 保留剩余未处理的电话
            updatedPhones.push([phone, existingLocation]);
            continue;
          }

          // 根据 forceRerecognize 决定是否需要识别这个号码
          const shouldProcess =
            phone && phone.trim() && (forceRerecognize || !existingLocation);

          if (shouldProcess) {
            try {
              const location = await queryPhoneLocation(phone);
              processedCount++;

              if (location) {
                successCount++;
                batchLogs.value.unshift({
                  phone,
                  location,
                  status: "success",
                });
                updatedPhones.push([phone, location]);
              } else {
                failedCount++;
                batchLogs.value.unshift({
                  phone,
                  location: "",
                  status: "error",
                  message: "未找到归属地信息",
                });
                updatedPhones.push([phone, ""]);
              }
            } catch (error: any) {
              processedCount++;
              failedCount++;
              batchLogs.value.unshift({
                phone,
                location: "",
                status: "error",
                message: error.message || "查询失败",
              });
              updatedPhones.push([phone, ""]);
            }

            // 更新进度
            batchProgressText.value = `${processedCount} / ${totalPhonesToProcess}`;
            progress.value = Math.round(
              (processedCount / totalPhonesToProcess) * 100
            );

            // 添加小延迟避免请求过快
            await new Promise((resolve) => setTimeout(resolve, 300));
          } else {
            // 已有归属地或空号码，保留原值
            updatedPhones.push([phone, existingLocation]);
          }
        }

        // 保存到数据库 (即使被中断也要保存已处理的部分)
        await propertyStore.updateLandlordData(landlord.id, {
          phoneNumbers: JSON.parse(JSON.stringify(updatedPhones)),
        });

        updatedLandlordCount++;
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // 设置汇总信息
    batchSummary.value = {
      total: totalPhonesToProcess,
      success: successCount,
      failed: failedCount,
      duration: Math.round(duration * 10) / 10,
      interrupted: batchCancelled.value,
    };

    if (batchCancelled.value) {
      ElMessage.warning(`已中断！已处理 ${processedCount} 个电话号码`);
    } else {
      ElMessage.success(
        `已更新 ${updatedLandlordCount} 个房东的 ${successCount} 个电话号码归属地`
      );
    }
  } catch (error: any) {
    console.error("批量识别归属地失败:", error);
    ElMessage.error(`批量识别失败: ${error.message}`);
  } finally {
    scanning.value = false;
    progress.value = 0;
    batchProgressText.value = "";
  }
};

// 中断批量识别
const cancelBatchRecognize = () => {
  batchCancelled.value = true;
  ElMessage.info("正在中断，请稍候...");
};

// ========== 快速整理功能 ==========

const showQuickOrganize = ref(false);
const organizeIndex = ref(0);
const currentPhones = ref<[string, string][]>([["", ""]]); // [手机号, 归属地][]
const deleteWithImages = ref(true);
const deleteConfirmCount = ref(0);
const currentImageUrls = ref<string[]>([]);
// 图片缩放模式: 0=正常展示, 1=竖屏放大, 2=横屏放大
const imageZoomMode = ref(0);
const phoneInputRefs = ref<any[]>([]);
let loadingImagesVersion = 0;

const organizeLandlord = computed(() => {
  if (propertyStore.landlords.length === 0) return null;
  return propertyStore.landlords[organizeIndex.value];
});

// 缩放模式文本提示
const zoomModeText = computed(() => {
  switch (imageZoomMode.value) {
    case 1:
      return "📐 竖屏放大模式";
    case 2:
      return "📐 横屏放大模式";
    default:
      return "";
  }
});

const loadImagesForCurrentLandlord = async () => {
  const myVersion = ++loadingImagesVersion;

  // 释放旧的 URL
  currentImageUrls.value.forEach((url) => URL.revokeObjectURL(url));
  currentImageUrls.value = [];
  phoneInputRefs.value = [];

  if (!organizeLandlord.value) return;

  // 设置当前电话 (新格式已经是 [string, string][])
  if (organizeLandlord.value.phoneNumbers?.length) {
    currentPhones.value = organizeLandlord.value.phoneNumbers.map(
      (phone) => [...phone] as [string, string]
    );
  } else {
    currentPhones.value = [["", ""]];
  }
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

// 图片缩放切换函数，支持正向和反向
const toggleImageZoom = (direction: "forward" | "backward" = "forward") => {
  if (direction === "forward") {
    // + 键：正向循环 0 → 1 → 2 → 0
    imageZoomMode.value = (imageZoomMode.value + 1) % 3;
  } else {
    // - 键：反向循环 0 → 2 → 1 → 0
    imageZoomMode.value = (imageZoomMode.value - 1 + 3) % 3;
  }

  // 使用双重 nextTick + requestAnimationFrame 确保 DOM 和 CSS 样式都完全更新
  nextTick(() => {
    nextTick(() => {
      // 使用 requestAnimationFrame 确保浏览器完成重排和重绘
      requestAnimationFrame(() => {
        // 反向切换时需要等待 CSS transition 动画完成，正向切换时立即执行
        const delay = direction === "backward" ? 350 : 0;

        setTimeout(() => {
          if (imageZoomMode.value > 0) {
            // 放大时滚动到中间
            const wrappers = document.querySelectorAll(
              ".image-wrapper[data-zoom-mode]"
            );
            wrappers.forEach((wrapper) => {
              const img = wrapper.querySelector("img");
              if (img) {
                // 等待图片完全加载后再计算滚动位置
                if (img.complete) {
                  centerImage(wrapper as HTMLElement, img as HTMLImageElement);
                } else {
                  img.onload = () => {
                    centerImage(
                      wrapper as HTMLElement,
                      img as HTMLImageElement
                    );
                  };
                }
              }
            });
          }

          if (phoneInputRefs.value.length > 0) {
            phoneInputRefs.value[0]?.focus();
          }
        }, delay); // + 键无延迟，- 键等待 350ms
      });
    });
  });
};

// 居中图片的辅助函数
const centerImage = (wrapper: HTMLElement, img: HTMLImageElement) => {
  // 垂直居中
  wrapper.scrollTop = (img.scrollHeight - wrapper.clientHeight) / 2;
  // 横向居中
  wrapper.scrollLeft = (img.scrollWidth - wrapper.clientWidth) / 2;
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
    imageZoomMode.value = 0;
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
    imageZoomMode.value = 0;
    loadImagesForCurrentLandlord();
    nextTick(() => {
      if (phoneInputRefs.value.length > 0) {
        phoneInputRefs.value[0]?.focus();
      }
    });
  }
};

const addPhoneField = () => {
  currentPhones.value.push(["", ""] as [string, string]);
  // 使用双重 nextTick 确保 DOM 完全更新后再聚焦
  nextTick(() => {
    nextTick(() => {
      const inputs = phoneInputRefs.value;
      if (inputs && inputs.length > 0) {
        const lastInput = inputs[inputs.length - 1];
        if (lastInput) {
          // 如果是 Element Plus 的 input 组件，需要访问其内部的 input 元素
          if (lastInput.$el) {
            const inputElement = lastInput.$el.querySelector("input");
            inputElement?.focus();
          } else {
            lastInput.focus();
          }
        }
      }
    });
  });
};

// 聚焦到上一个输入框
const focusPrevInput = (currentIndex: number) => {
  if (currentIndex > 0) {
    nextTick(() => {
      const inputs = phoneInputRefs.value;
      if (inputs && inputs[currentIndex - 1]) {
        const prevInput = inputs[currentIndex - 1];
        if (prevInput.$el) {
          const inputElement = prevInput.$el.querySelector("input");
          inputElement?.focus();
        } else {
          prevInput.focus();
        }
      }
    });
  }
};

// 聚焦到下一个输入框
const focusNextInput = (currentIndex: number) => {
  if (currentIndex < currentPhones.value.length - 1) {
    nextTick(() => {
      const inputs = phoneInputRefs.value;
      if (inputs && inputs[currentIndex + 1]) {
        const nextInput = inputs[currentIndex + 1];
        if (nextInput.$el) {
          const inputElement = nextInput.$el.querySelector("input");
          inputElement?.focus();
        } else {
          nextInput.focus();
        }
      }
    });
  }
};

const saveAndNext = async () => {
  if (organizeLandlord.value) {
    // 保存电话 (过滤掉空的电话号码，保留归属地信息)
    // 使用 JSON.parse/stringify 确保是纯数组
    const validPhones: [string, string][] = JSON.parse(
      JSON.stringify(currentPhones.value.filter(([phone]) => phone.trim()))
    );

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

// 只保存当前房东，不跳转
const saveCurrentLandlord = async () => {
  if (organizeLandlord.value) {
    // 使用 JSON.parse/stringify 确保是纯数组
    const validPhones: [string, string][] = JSON.parse(
      JSON.stringify(currentPhones.value.filter(([phone]) => phone.trim()))
    );

    if (
      validPhones.length > 0 ||
      organizeLandlord.value.phoneNumbers.length > 0
    ) {
      await propertyStore.updateLandlordData(organizeLandlord.value.id, {
        phoneNumbers: validPhones,
      });
      ElMessage.success("保存成功");
    } else {
      ElMessage.warning("请至少输入一个电话号码");
    }
  }
};

const handleDeleteRequest = async () => {
  deleteConfirmCount.value++;
  if (deleteConfirmCount.value >= 2) {
    if (organizeLandlord.value) {
      const idToDelete = organizeLandlord.value.id;
      await propertyStore.removeLandlord(idToDelete, deleteWithImages.value);
      ElMessage.success("已删除");
      deleteConfirmCount.value = 0;

      if (propertyStore.landlords.length === 0) {
        closeQuickOrganize();
      } else {
        if (organizeIndex.value >= propertyStore.landlords.length) {
          organizeIndex.value = propertyStore.landlords.length - 1;
        }
        // 重新加载当前（新的）房东
        imageZoomMode.value = 0;
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
  } else if (e.key === "+" || e.key === "=") {
    // + 键：正向循环
    e.preventDefault();
    toggleImageZoom("forward");
  } else if (e.key === "-") {
    // - 键：反向循环
    e.preventDefault();
    toggleImageZoom("backward");
  }
};

// Clean up unused code
// const handleDeleteDialogKeydown = ...
// watch(showDeleteDialog, ...
// onUnmounted(() => ...

function formatProgress(_percentage: number): string {
  // 如果有批量识别进度文本，优先显示
  if (batchProgressText.value) {
    return batchProgressText.value;
  }
  return `${currentFile.value} / ${totalFiles.value}`;
}
</script>

<style lang="scss" scoped>
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

.help-section {
  margin-bottom: 15px;
  border: none;

  :deep(.el-collapse-item__header) {
    background-color: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 0 12px;
    font-weight: 500;
    height: 40px;
    line-height: 40px;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 12px;
    background-color: #fafafa;
    border: 1px solid #e4e7ed;
    border-top: none;
    border-radius: 0 0 4px 4px;
  }
}

.help-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #409eff;

  .el-icon {
    font-size: 16px;
  }
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-step {
  h4 {
    margin: 0 0 6px 0;
    color: #303133;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0 0 6px 0;
    color: #606266;
    line-height: 1.5;
    font-size: 13px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    color: #606266;
    line-height: 1.6;
    font-size: 13px;

    li {
      margin-bottom: 3px;
    }
  }

  kbd {
    display: inline-block;
    padding: 1px 5px;
    font-size: 11px;
    font-family: "Courier New", monospace;
    color: #303133;
    background-color: #f4f4f5;
    border: 1px solid #d3d4d6;
    border-radius: 3px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.button-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  .el-button {
    flex: 1;
  }
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

/* 竖屏放大模式 */
.image-wrapper.zoom-portrait-large {
  display: block;
  overflow-y: auto;
  overflow-x: hidden;
}
.image-wrapper.zoom-portrait-large .carousel-image {
  width: 100%;
  height: auto;
  max-width: none;
  max-height: none;
  object-fit: unset;
}

/* 横屏放大模式 */
.image-wrapper.zoom-landscape-large {
  display: block;
  overflow-y: auto;
  overflow-x: auto;
}
.image-wrapper.zoom-landscape-large .carousel-image {
  width: auto;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: unset;
  margin: 0 auto;
  display: block;
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

.zoom-mode-indicator {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: white;
  background: rgba(67, 160, 71, 0.8);
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
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

/* 批量识别日志样式 */
.batch-log-container {
  min-height: 200px;
}

.batch-summary {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.filter-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
}

.clickable-stat {
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  &.success {
    color: #67c23a;
    &:hover,
    &.active {
      background: #f0f9eb;
    }
  }

  &.error {
    color: #f56c6c;
    &:hover,
    &.active {
      background: #fef0f0;
    }
  }

  &.active {
    background: #ecf5ff;
    box-shadow: 0 0 0 2px #409eff40;
  }
}

.batch-log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-family: monospace;
  font-size: 13px;

  &.success {
    background: #f0f9eb;
    border: 1px solid #e1f3d8;
  }

  &.error {
    background: #fef0f0;
    border: 1px solid #fde2e2;
  }

  .phone {
    font-weight: 600;
    color: #303133;
    min-width: 120px;
  }

  .arrow {
    color: #909399;
  }

  .location {
    color: #67c23a;
    font-weight: 500;
  }

  .error {
    color: #f56c6c;
  }
}
</style>
