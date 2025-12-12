<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="95%"
    :fullscreen="true"
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="property-detail-container">
      <!-- 左侧：视频播放器 -->
      <div class="video-section">
        <div
          v-if="currentProperty && currentProperty.videos.length > 0"
          class="video-player-wrapper"
        >
          <!-- 视频加载成功 -->
          <video
            v-if="currentVideoUrl"
            ref="videoPlayerRef"
            :src="currentVideoUrl"
            class="video-player"
            controls
            @loadedmetadata="handleVideoLoaded"
          >
            您的浏览器不支持视频播放
          </video>
          <!-- 视频丢失 -->
          <div v-else-if="videoLoadError" class="video-error">
            <div class="video-error-content">
              <el-icon :size="64" color="#f56c6c"><VideoCamera /></el-icon>
              <div class="video-error-text">
                <div>视频已丢失</div>
                <div class="video-error-filename">
                  {{ currentProperty.videos[currentVideoIndex]?.fileName }}
                </div>
              </div>
              <el-button type="danger" size="small" @click="handleGoToLandlord">
                去房东详情删除
              </el-button>
            </div>
          </div>
          <!-- 加载中 -->
          <div v-else class="video-loading">
            <el-icon class="is-loading" :size="48"><Loading /></el-icon>
            <span style="margin-top: 12px">加载中...</span>
          </div>

          <!-- 视频切换控制 -->
          <div class="video-controls">
            <el-button
              :disabled="currentVideoIndex === 0"
              @click="previousVideo"
            >
              <el-icon><ArrowLeft /></el-icon>
              上一个
            </el-button>
            <span class="video-count">
              {{ currentVideoIndex + 1 }} /
              {{ currentProperty?.videos.length || 0 }}
            </span>
            <el-button
              :disabled="
                currentVideoIndex === (currentProperty?.videos.length || 0) - 1
              "
              @click="nextVideo"
            >
              下一个
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <!-- 视频列表缩略图 -->
          <div
            v-if="currentProperty && currentProperty.videos.length > 1"
            class="video-thumbnails"
          >
            <div
              v-for="(video, index) in currentProperty?.videos || []"
              :key="video.id"
              class="thumbnail-item"
              :class="{ active: index === currentVideoIndex }"
              @click="currentVideoIndex = index"
            >
              <div v-if="videoThumbnails[index]" class="thumbnail-image">
                <img :src="videoThumbnails[index]" alt="视频缩略图" />
              </div>
              <div v-else class="thumbnail-placeholder">
                <div class="thumbnail-number">{{ index + 1 }}</div>
                <div class="thumbnail-video">视频 {{ index + 1 }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-video-section">
          <el-empty description="暂无视频">
            <el-button type="primary" @click="handleGoToLandlord">
              去房东详情编辑
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 右侧：表单编辑 -->
      <div class="form-section">
        <el-scrollbar class="form-scrollbar">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="100px"
            label-position="left"
          >
            <!-- 房源基本信息 -->
            <el-divider content-position="left">
              <el-icon><HomeFilled /></el-icon>
              房源基本信息
            </el-divider>

            <el-form-item label="房型" prop="roomType">
              <el-select v-model="formData.roomType" placeholder="请选择房型">
                <el-option
                  v-for="type in ROOM_TYPES"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="租金" prop="rent">
              <el-input-number
                v-model="formData.rent"
                :min="0"
                :step="100"
                placeholder="租金金额"
                controls-position="right"
                style="width: 200px"
              />
              <span class="unit">元/月</span>
            </el-form-item>

            <el-form-item label="楼层" prop="floor">
              <el-input-number
                v-model="formData.floor"
                :min="1"
                :max="99"
                placeholder="输入楼层数"
                style="width: 200px"
              >
                <template #suffix>楼</template>
              </el-input-number>
            </el-form-item>

            <el-form-item label="是否可租" prop="available">
              <el-switch
                v-model="formData.available"
                active-text="可租"
                inactive-text="已租出"
              />
            </el-form-item>

            <!-- 配套设施 -->
            <el-divider content-position="left">
              <el-icon><ShoppingCart /></el-icon>
              配套设施
            </el-divider>

            <el-form-item label="设施清单">
              <el-checkbox-group v-model="formData.amenities">
                <el-checkbox
                  v-for="amenity in AMENITY_OPTIONS"
                  :key="amenity"
                  :label="amenity"
                >
                  {{ amenity }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <!-- 公共费用 -->
            <el-divider content-position="left">
              <el-icon><Money /></el-icon>
              公共费用
            </el-divider>

            <el-alert
              v-if="feesModified"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            >
              <template #title>
                修改公共费用会同步到房东信息，影响该房东下的所有房源
              </template>
            </el-alert>

            <el-form-item label="水费">
              <el-select
                v-model="formData.water.type"
                placeholder="请选择水费类型"
                style="width: 200px"
              >
                <el-option
                  v-for="type in WATER_TYPES"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
              <el-input-number
                v-if="formData.water.type === 'custom'"
                v-model="formData.water.price"
                :min="0"
                :step="0.1"
                :precision="2"
                controls-position="right"
                style="width: 150px; margin-left: 8px"
              />
              <span v-if="formData.water.type === 'custom'" class="unit"
                >元/吨</span
              >
            </el-form-item>

            <el-form-item label="电费">
              <el-select
                v-model="formData.electricity.type"
                placeholder="请选择电费类型"
                style="width: 200px"
              >
                <el-option
                  v-for="type in ELECTRICITY_TYPES"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
              <el-input-number
                v-if="formData.electricity.type === 'custom'"
                v-model="formData.electricity.price"
                :min="0"
                :step="0.01"
                :precision="2"
                controls-position="right"
                style="width: 150px; margin-left: 8px"
              />
              <span v-if="formData.electricity.type === 'custom'" class="unit"
                >元/度</span
              >
            </el-form-item>

            <el-form-item label="押金方式">
              <el-select
                v-model="formData.deposit"
                placeholder="请选择押金方式"
                style="width: 200px"
              >
                <el-option
                  v-for="method in DEPOSIT_METHODS"
                  :key="method.value"
                  :label="method.label"
                  :value="method.value"
                />
              </el-select>
            </el-form-item>

            <!-- 房源备注 -->
            <el-divider content-position="left">
              <el-icon><EditPen /></el-icon>
              房源备注
            </el-divider>

            <el-form-item label="备注说明">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="4"
                placeholder="补充说明..."
              />
            </el-form-item>

            <!-- 房东信息（只读） -->
            <el-divider content-position="left">
              <el-icon><User /></el-icon>
              房东信息
            </el-divider>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="电话">
                <el-tooltip placement="top" content="点我跳转房东详情页">
                  <el-link type="primary" @click="handleGoToLandlord">
                    {{ landlordInfo?.phoneNumbers[0] || "--" }}
                  </el-link>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="类型">
                {{ getLandlordTypeLabel(landlordInfo?.landlordType) }}
              </el-descriptions-item>
              <el-descriptions-item label="地址">
                {{ landlordInfo?.address || "暂无地址" }}
              </el-descriptions-item>
            </el-descriptions>
          </el-form>
        </el-scrollbar>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="handleGoToLandlord">
            <el-icon><EditPen /></el-icon>
            编辑房源信息
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            :disabled="!hasChanges"
            :loading="saving"
            @click="handleSave"
          >
            保存修改
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRaw } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  HomeFilled,
  ShoppingCart,
  Money,
  EditPen,
  User,
  VideoCamera,
  Loading,
} from "@element-plus/icons-vue";
import { usePropertyStore } from "@/stores/property";
import {
  ROOM_TYPES,
  AMENITY_OPTIONS,
  WATER_TYPES,
  ELECTRICITY_TYPES,
  DEPOSIT_METHODS,
  LandlordType,
  type Property,
} from "@/types";

import { getValidDirectoryHandle, getFileByPath } from "@/utils/fileSystem";

const props = defineProps<{
  modelValue: boolean;
  propertyId: string;
  landlordId: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
  goToLandlord: [landlordId: string];
}>();

const propertyStore = usePropertyStore();
const visible = ref(props.modelValue);
const formRef = ref<FormInstance>();
// const videoPlayerRef = ref<HTMLVideoElement>();
const currentVideoIndex = ref(0);
const saving = ref(false);
const videoThumbnails = ref<{ [key: number]: string }>({}); // 视频缩略图映射
const videoLoadError = ref(false); // 视频加载失败状态

// 获取房东信息
const landlordInfo = computed(() => {
  return propertyStore.landlords.find((l) => l.id === props.landlordId);
});

// 获取房源信息
const currentProperty = computed(() => {
  const landlord = landlordInfo.value;
  if (!landlord) return null;
  return landlord.properties.find((p) => p.id === props.propertyId);
});

// 对话框标题
const dialogTitle = computed(() => {
  if (!currentProperty.value) return "房源详情";
  return `房源详情 - ${currentProperty.value.roomType} · ${
    landlordInfo.value?.address || ""
  }`;
});

// 表单数据
interface FormData {
  roomType: string;
  rent?: number;
  floor?: string;
  description?: string;
  amenities: string[];
  available?: boolean;
  water: {
    type: string;
    price?: number;
    unit?: string;
  };
  electricity: {
    type: string;
    price?: number;
    unit?: string;
  };
  deposit: string;
}

const formData = ref<FormData>({
  roomType: "",
  rent: undefined,
  floor: "",
  description: "",
  amenities: [],
  available: true,
  water: {
    type: "civil",
    price: undefined,
    unit: "吨",
  },
  electricity: {
    type: "civil",
    price: undefined,
    unit: "度",
  },
  deposit: "押一付一",
});

// 原始数据（用于比较是否有修改）
const originalData = ref<string>("");

// 表单验证规则
const formRules: FormRules = {
  roomType: [{ required: true, message: "请选择房型", trigger: "change" }],
  rent: [
    { required: true, message: "请输入租金", trigger: "blur" },
    { type: "number", min: 0, message: "租金必须大于0", trigger: "blur" },
  ],
};

// 初始化表单数据
const initFormData = () => {
  if (!currentProperty.value || !landlordInfo.value) return;

  const property = currentProperty.value as Property;
  const landlord = landlordInfo.value;

  formData.value = {
    roomType: property.roomType,
    rent: property.rent,
    floor: property.floor,
    description: property.notes || "",
    amenities: [...property.amenities],
    available: property.available,
    water: {
      type: landlord.commonFees.water.type,
      price: landlord.commonFees.water.price,
      unit: landlord.commonFees.water.unit,
    },
    electricity: {
      type: landlord.commonFees.electricity.type,
      price: landlord.commonFees.electricity.price,
      unit: landlord.commonFees.electricity.unit,
    },
    deposit: landlord.deposit,
  };

  // 保存原始数据用于比较
  originalData.value = JSON.stringify(formData.value);
};

// 检测是否有修改
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== originalData.value;
});

// 检测公共费用是否被修改
const feesModified = computed(() => {
  if (!landlordInfo.value) return false;

  const original = landlordInfo.value;
  return (
    JSON.stringify(formData.value.water) !==
      JSON.stringify(original.commonFees.water) ||
    JSON.stringify(formData.value.electricity) !==
      JSON.stringify(original.commonFees.electricity) ||
    formData.value.deposit !== original.deposit
  );
});

// 当前视频URL
const currentVideoUrl = ref("");

// 监听视频索引变化，加载视频
watch(
  [currentVideoIndex, currentProperty],
  async () => {
    videoLoadError.value = false;
    currentVideoUrl.value = "";

    if (!currentProperty.value?.videos.length) {
      return;
    }

    const url = await getVideoUrl(
      currentProperty.value.videos[currentVideoIndex.value].fileName
    );
    if (url) {
      currentVideoUrl.value = url;
      videoLoadError.value = false;
    } else {
      videoLoadError.value = true;
    }
  },
  { immediate: true }
);

// 获取视频URL
const getVideoUrl = async (fileName: string) => {
  try {
    const dirHandle = await getValidDirectoryHandle("userPhotosFolder");
    if (!dirHandle) {
      console.error("获取目录句柄失败");
      return "";
    }

    const file = await getFileByPath(dirHandle, fileName);
    if (!file) {
      console.error("视频文件不存在:", fileName);
      return "";
    }

    return URL.createObjectURL(file);
  } catch (error) {
    console.error("获取视频失败:", fileName, error);
    return "";
  }
};

// 视频加载完成，生成缩略图
const handleVideoLoaded = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  generateVideoThumbnail(video, currentVideoIndex.value);
};

// 生成视频缩略图
const generateVideoThumbnail = (video: HTMLVideoElement, index: number) => {
  try {
    // 设置视频到第一帧
    video.currentTime = 1; // 第1秒

    video.addEventListener(
      "seeked",
      () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/jpeg", 0.7);
          videoThumbnails.value[index] = thumbnail;
        }
      },
      { once: true }
    );
  } catch (error) {
    console.error("生成视频缩略图失败:", error);
  }
};

// 切换到上一个视频
const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    currentVideoIndex.value--;
  }
};

// 切换到下一个视频
const nextVideo = () => {
  if (
    currentVideoIndex.value <
    (currentProperty.value?.videos.length || 0) - 1
  ) {
    currentVideoIndex.value++;
  }
};

// 获取房东类型标签
const getLandlordTypeLabel = (type?: LandlordType) => {
  if (!type) return "未知";
  const labels: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: "一手房东",
    [LandlordType.SecondHand]: "二手房东",
    [LandlordType.Agent]: "中介",
    [LandlordType.Other]: "其他",
  };
  return labels[type] || "未知";
};

// 跳转到房东详情
const handleGoToLandlord = () => {
  emit("goToLandlord", props.landlordId);
  visible.value = false;
};

// 保存修改
const handleSave = async () => {
  if (!formRef.value) return;

  // 表单验证
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning("请检查表单填写是否正确");
      return;
    }

    saving.value = true;
    try {
      // 使用 toRaw 获取原始数据，模仿房东详情的保存方式
      const rawLandlord = toRaw(landlordInfo.value!);

      // 更新房源信息
      const updatedProperties = rawLandlord.properties.map((p: any) => {
        if (p.id === props.propertyId) {
          return {
            ...toRaw(p),
            roomType: formData.value.roomType as any,
            rent: formData.value.rent,
            floor: formData.value.floor,
            notes: formData.value.description,
            amenities: toRaw(formData.value.amenities),
            available: formData.value.available,
            updatedAt: new Date().toISOString(),
          };
        }
        return toRaw(p);
      });

      // 构建完整的更新数据
      const dataToSave: any = {
        properties: updatedProperties,
        updatedAt: new Date().toISOString(),
      };

      // 如果公共费用有修改，同步到房东
      if (feesModified.value) {
        dataToSave.commonFees = {
          electricity: {
            type: formData.value.electricity.type,
            price: formData.value.electricity.price,
            unit: formData.value.electricity.unit,
          },
          water: {
            type: formData.value.water.type,
            price: formData.value.water.price,
            unit: formData.value.water.unit,
          },
          internet: toRaw(rawLandlord.commonFees.internet),
          management: toRaw(rawLandlord.commonFees.management),
          garbage: toRaw(rawLandlord.commonFees.garbage),
          other: toRaw(rawLandlord.commonFees.other),
        };
        dataToSave.deposit = formData.value.deposit;
      }

      await propertyStore.updateLandlordData(props.landlordId, dataToSave);

      ElMessage.success("保存成功");
      emit("saved");
      visible.value = false;
    } catch (error: any) {
      console.error("保存失败:", error);
      ElMessage.error("保存失败: " + (error.message || "未知错误"));
    } finally {
      saving.value = false;
    }
  });
};

// 取消修改
const handleCancel = () => {
  if (hasChanges.value) {
    ElMessageBox.confirm("有未保存的修改，确定要关闭吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        visible.value = false;
      })
      .catch(() => {
        // 用户取消
      });
  } else {
    visible.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  emit("update:modelValue", false);
};

// 监听 visible 变化
watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 监听 props.modelValue 变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initFormData();
      currentVideoIndex.value = 0;
      // 添加键盘监听
      document.addEventListener("keydown", handleKeyDown);
    } else {
      // 移除键盘监听
      document.removeEventListener("keydown", handleKeyDown);
    }
  }
);

// 组件挂载时初始化
watch(
  () => currentProperty.value,
  () => {
    if (currentProperty.value) {
      initFormData();
    }
  },
  { immediate: true }
);

// 获取当前房源在房源列表中的索引（使用筛选后的列表）
const currentPropertyIndex = computed(() => {
  // 使用 flattenedProperties 获取所有房源列表
  const properties = propertyStore.flattenedProperties;
  return properties.findIndex((p) => p.propertyId === props.propertyId);
});

// 是否有上一个房源
const hasPreviousProperty = computed(() => {
  return currentPropertyIndex.value > 0;
});

// 是否有下一个房源
const hasNextProperty = computed(() => {
  const properties = propertyStore.flattenedProperties;
  return (
    currentPropertyIndex.value >= 0 &&
    currentPropertyIndex.value < properties.length - 1
  );
});

// 切换到上一个房源
const goToPreviousProperty = () => {
  if (!hasPreviousProperty.value) return;

  const properties = propertyStore.flattenedProperties;
  const prevProperty = properties[currentPropertyIndex.value - 1];

  // 发出事件通知父组件切换房源
  emit("update:modelValue", false);
  setTimeout(() => {
    const event = new CustomEvent("switchProperty", {
      detail: {
        propertyId: prevProperty.propertyId,
        landlordId: prevProperty.landlordId,
      },
    });
    window.dispatchEvent(event);
  }, 100);
};

// 切换到下一个房源
const goToNextProperty = () => {
  if (!hasNextProperty.value) return;

  const properties = propertyStore.flattenedProperties;
  const nextProperty = properties[currentPropertyIndex.value + 1];

  emit("update:modelValue", false);
  setTimeout(() => {
    const event = new CustomEvent("switchProperty", {
      detail: {
        propertyId: nextProperty.propertyId,
        landlordId: nextProperty.landlordId,
      },
    });
    window.dispatchEvent(event);
  }, 100);
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // Alt + 左方向键：上一个房源
  if (event.altKey && event.key === "ArrowLeft") {
    event.preventDefault();
    if (hasPreviousProperty.value) {
      goToPreviousProperty();
    }
  }
  // Alt + 右方向键：下一个房源
  else if (event.altKey && event.key === "ArrowRight") {
    event.preventDefault();
    if (hasNextProperty.value) {
      goToNextProperty();
    }
  }
};
</script>

<style scoped lang="scss">
.property-detail-container {
  display: flex;
  gap: 24px;
  height: calc(100vh - 125px);
  min-height: 600px;
}

.video-section {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-player-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.video-player {
  width: 100%;
  height: 0;
  flex: 1;
  background: #000;
  border-radius: 8px;
  object-fit: contain;
}

.video-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;

  .video-count {
    font-size: 14px;
    color: #606266;
    min-width: 60px;
    text-align: center;
  }
}

.video-thumbnails {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

.thumbnail-item {
  position: relative;
  width: 80px;
  height: 60px;
  flex-shrink: 0;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    transform: scale(1.05);
  }

  &.active {
    border-color: #409eff;
    box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
  }

  .thumbnail-number {
    position: absolute;
    top: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 2px;
    z-index: 1;
  }

  .thumbnail-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-scrollbar {
  flex: 1;

  :deep(.el-scrollbar__view) {
    padding-right: 16px;
  }
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.el-divider {
  margin: 24px 0 16px;

  :deep(.el-divider__text) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
  }
}

.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.footer-right {
  display: flex;
  gap: 12px;
}

.no-video-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fafafa;
}

.video-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef0f0;
  border-radius: 8px;
  border: 2px dashed #f56c6c;
}

.video-error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
}

.video-error-text {
  text-align: center;
  color: #f56c6c;
}

.video-error-text > div:first-child {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 8px;
}

.video-error-filename {
  font-size: 13px;
  color: #909399;
  word-break: break-all;
  max-width: 400px;
}

.video-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
  font-size: 16px;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #909399;
}

// 响应式适配
@media (max-width: 1200px) {
  .property-detail-container {
    flex-direction: column;
    height: auto;
  }

  .video-section {
    flex: none;
    height: 400px;
  }

  .form-section {
    flex: none;
    height: 500px;
  }
}
</style>
