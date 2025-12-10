<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Upload,
  Star,
  StarFilled,
  Filter,
  Setting,
  QuestionFilled,
} from "@element-plus/icons-vue";
import PhotoUpload from "./components/PhotoUpload.vue";
import MapView from "./components/MapView.vue";
import PropertyDetail from "./components/PropertyDetail.vue";
import LandlordAvatar from "./components/LandlordAvatar.vue";
import { usePropertyStore } from "./stores/property";
import { exportToExcel, exportToJson, importFromJson } from "./utils/export";
import { getStoredAmapConfig, saveAmapConfig } from "./utils/geocode";
import {
  LandlordType,
  ContactStatus,
  WechatStatus,
  type FilterOptions,
  ROOM_TYPES,
} from "./types";
import { el } from "element-plus/es/locales.mjs";

const propertyStore = usePropertyStore();
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Tour 状态
const tourOpen = ref(false);
const tourCurrent = ref(0);

// 设置状态
const settingDialogVisible = ref(false);
const amapForm = ref({
  key: "",
  securityCode: "",
});

// 初始化设置表单
const initSettings = () => {
  const config = getStoredAmapConfig();
  amapForm.value = { ...config };
};

// 保存设置
const handleSaveSettings = () => {
  if (!amapForm.value.key || !amapForm.value.securityCode) {
    ElMessage.warning("请输入 Key 和 安全密钥");
    return;
  }
  saveAmapConfig(amapForm.value.key, amapForm.value.securityCode);
  settingDialogVisible.value = false;
  ElMessageBox.alert("设置已保存，请刷新页面以生效。", "提示", {
    confirmButtonText: "刷新页面",
    callback: () => {
      window.location.reload();
    },
  });
};

// 筛选状态
const showFilterDrawer = ref(false);
const filterContact = ref("all"); // all, contacted, uncontacted
const filterWechat = ref("all"); // all, added, not_added
const hideRepeatedPhones = ref(
  localStorage.getItem("hideRepeatedPhones") === "true"
);
const filterLandlordType = ref<LandlordType[]>([]);
const filterWaterType = ref("all"); // 'all', 'civil', 'custom'
const filterElectricityType = ref("all"); // 'all', 'civil', 'custom'
const filterRoomTypes = ref<string[]>([]);
const filterRentMin = ref<number | undefined>(undefined);
const filterRentMax = ref<number | undefined>(undefined);

// 删除确认状态
const deleteDialogVisible = ref(false);
const deleteWithImages = ref(true);
const landlordToDelete = ref<any>(null);

onMounted(async () => {
  await propertyStore.loadLandlords();
});

// 监听筛选条件变化，同步到 Store
watch(
  [
    filterContact,
    filterWechat,
    hideRepeatedPhones,
    filterLandlordType,
    filterWaterType,
    filterElectricityType,
    filterRoomTypes,
    filterRentMin,
    filterRentMax,
  ],
  () => {
    const filters: FilterOptions = {};

    if (filterContact.value !== "all") {
      filters.contactStatus = [filterContact.value as ContactStatus];
    }

    if (filterWechat.value !== "all") {
      filters.wechatStatus = [filterWechat.value as WechatStatus];
    }

    filters.hideRepeatedPhones = hideRepeatedPhones.value;
    localStorage.setItem(
      "hideRepeatedPhones",
      String(hideRepeatedPhones.value)
    );

    if (filterLandlordType.value.length > 0) {
      filters.landlordType = filterLandlordType.value;
    }

    if (filterWaterType.value !== "all") {
      filters.waterType = filterWaterType.value;
    }

    if (filterElectricityType.value !== "all") {
      filters.electricityType = filterElectricityType.value;
    }

    if (filterRoomTypes.value.length > 0) {
      filters.roomTypes = filterRoomTypes.value;
    }

    if (
      (filterRentMin.value !== undefined && filterRentMin.value !== null) ||
      (filterRentMax.value !== undefined && filterRentMax.value !== null)
    ) {
      filters.rentRange = [
        filterRentMin.value || 0,
        filterRentMax.value || 999999,
      ];
    } else {
      filters.rentRange = undefined;
    }

    propertyStore.setFilters(filters);
  },
  { immediate: true }
);

// 过滤后的房东列表 (直接使用 Store 的计算属性)
const filteredLandlords = computed(() => propertyStore.filteredLandlords);

// 监听当前聚焦的房东，自动滚动到列表位置
watch(
  () => propertyStore.focusedLandlordId,
  (newId) => {
    if (newId) {
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        const el = document.getElementById(`landlord-item-${newId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }
);

// 导出功能
const handleExport = () => {
  exportToExcel(propertyStore.landlords);
  ElMessage.success("导出成功");
};

// 备份功能
const handleBackup = () => {
  const filename = `租房信息备份_${
    new Date().toISOString().split("T")[0]
  }.json`;
  exportToJson(propertyStore.landlords, filename);
  ElMessage.success("备份文件已生成");
};

// 导入备份
const handleImport = async (_event: Event) => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  try {
    const data = await importFromJson(file);
    await propertyStore.restoreBackup(data);
    ElMessage.success(`成功恢复 ${data.length} 条数据`);
  } catch (error) {
    console.error(error);
    ElMessage.error("导入失败，请检查文件格式");
  } finally {
    // 清空 input，允许重复选择同一文件
    target.value = "";
  }
};

const getPhoneDisplay = (phones: string[]) => {
  if (!phones || phones.length === 0 || !phones[0]) return "未填写电话";
  if (phones.length === 1) return phones[0];
  return `${phones[0]} (+${phones.length - 1})`;
};

const getLandlordTypeLabel = (type: LandlordType) => {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: "一手",
    [LandlordType.SecondHand]: "二手",
    [LandlordType.Agent]: "中介",
    [LandlordType.Other]: "其他",
  };
  return map[type] || "未知";
};

const getLandlordTypeTagType = (type: LandlordType) => {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: "success",
    [LandlordType.SecondHand]: "warning",
    [LandlordType.Agent]: "danger",
    [LandlordType.Other]: "info",
  };
  return map[type] || "info";
};

const handleLandlordClick = (landlord: any) => {
  propertyStore.setFocusedLandlord(landlord.id);
  if (mapViewRef.value) {
    mapViewRef.value.focusLandlord(landlord);
  }
};

const handleDeleteLandlord = (landlord: any) => {
  landlordToDelete.value = landlord;
  deleteWithImages.value = true; // 默认勾选
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  if (!landlordToDelete.value) return;

  try {
    await propertyStore.removeLandlord(
      landlordToDelete.value.id,
      deleteWithImages.value
    );
    ElMessage.success("删除成功");
  } catch (error) {
    ElMessage.error("删除失败");
  } finally {
    deleteDialogVisible.value = false;
    landlordToDelete.value = null;
  }
};

const showPhotoUpload = ref(false);
</script>

<template>
  <div class="app-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="logo">
        <h1>📍 租房信息管理系统</h1>
      </div>
      <div class="actions">
        <el-button
          id="btn-import-photos"
          type="primary"
          @click="showPhotoUpload = true"
          :icon="Upload"
        >
          批量导入照片
        </el-button>
        <el-button
          id="btn-export-excel"
          @click="handleExport"
          :disabled="propertyStore.landlords.length === 0"
        >
          导出Excel
        </el-button>
        <el-button id="btn-backup-import" type="primary" @click="handleImport">
          导入备份
        </el-button>
        <el-button
          id="btn-backup"
          @click="handleBackup"
          :disabled="propertyStore.landlords.length === 0"
        >
          导出备份
        </el-button>
        <el-button :icon="Filter" @click="showFilterDrawer = true" title="筛选">
          筛选
        </el-button>
        <el-button
          :icon="QuestionFilled"
          circle
          @click="tourOpen = true"
          title="使用说明"
        />
        <el-button
          :icon="Setting"
          circle
          @click="
            initSettings();
            settingDialogVisible = true;
          "
          title="设置"
        />
        <el-tag type="info" style="margin-left: 12px">
          共 {{ propertyStore.landlords.length }} 个房东
        </el-tag>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：列表 -->
      <div class="left-panel" id="left-panel">
        <!-- 房东列表 -->
        <div class="property-list">
          <div class="list-header">
            <h3>房东列表 ({{ filteredLandlords.length }})</h3>
          </div>

          <el-scrollbar height="calc(100vh - 150px)">
            <div
              v-for="landlord in filteredLandlords"
              :key="landlord.id"
              :id="'landlord-item-' + landlord.id"
              class="property-item"
              :class="{
                active: propertyStore.focusedLandlordId === landlord.id,
              }"
              @click="handleLandlordClick(landlord)"
            >
              <div class="landlord-icon">
                <LandlordAvatar
                  :avatar="landlord.avatar"
                  :photo="
                    landlord.photos && landlord.photos.length > 0
                      ? landlord.photos[0].fileName
                      : undefined
                  "
                  :nickname="landlord.wechatNickname"
                  :size="40"
                />
              </div>

              <div class="property-info">
                <div class="info-row">
                  <span class="nickname" v-if="landlord.wechatNickname">{{
                    landlord.wechatNickname
                  }}</span>
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span
                      class="phone"
                      :class="{ secondary: landlord.wechatNickname }"
                      >{{ getPhoneDisplay(landlord.phoneNumbers) }}</span
                    >
                  </div>
                </div>

                <div class="address">
                  {{ landlord.address || "未知地址" }}
                </div>

                <div class="stats">
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      gap: 2px;
                      flex-wrap: wrap;
                    "
                  >
                    <el-tag
                      size="small"
                      :type="getLandlordTypeTagType(landlord.landlordType)"
                      effect="plain"
                    >
                      {{ getLandlordTypeLabel(landlord.landlordType) }}
                    </el-tag>
                    <el-tag
                      size="small"
                      :type="
                        landlord.contactStatus === 'contacted'
                          ? 'primary'
                          : 'info'
                      "
                      effect="plain"
                    >
                      {{
                        landlord.contactStatus === "contacted"
                          ? "已联系"
                          : "未联系"
                      }}
                    </el-tag>
                    <el-tag
                      size="small"
                      type="success"
                      v-if="landlord.wechatStatus === 'added'"
                      effect="plain"
                      >已加WX</el-tag
                    >
                    <span style="margin-left: 4px"
                      >{{ landlord.properties?.length || 0 }} 个房源</span
                    >
                  </div>
                  <div style="display: flex; gap: 2px">
                    <el-button
                      type="primary"
                      link
                      size="small"
                      style="margin-left: 0px"
                      @click.stop="propertyStore.selectLandlord(landlord)"
                    >
                      详情
                    </el-button>
                    <el-button
                      :type="landlord.isFavorite ? 'warning' : 'info'"
                      link
                      style="margin-left: 0px"
                      size="small"
                      :icon="landlord.isFavorite ? StarFilled : Star"
                      @click.stop="propertyStore.toggleFavorite(landlord.id)"
                    />
                    <el-popconfirm
                      title="确定删除此房东？"
                      @confirm="handleDeleteLandlord(landlord)"
                      @click.stop
                    >
                      <template #reference>
                        <el-button
                          type="danger"
                          link
                          size="small"
                          style="margin-left: 0px"
                          :icon="Delete"
                          @click.stop
                        />
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
            </div>
            <el-empty
              v-if="filteredLandlords.length === 0"
              description="暂无符合条件的数据"
            />
          </el-scrollbar>
        </div>
      </div>

      <!-- 右侧：地图 -->
      <div class="right-panel" id="right-panel">
        <MapView ref="mapViewRef" />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <PropertyDetail />

    <!-- 照片上传对话框 -->
    <el-dialog
      v-model="showPhotoUpload"
      title="批量导入照片"
      width="600px"
      destroy-on-close
    >
      <PhotoUpload />
    </el-dialog>

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept=".json"
      @change="handleFileChange"
    />

    <!-- 筛选抽屉 -->
    <el-drawer v-model="showFilterDrawer" title="筛选条件" size="300px">
      <el-form label-position="top">
        <el-form-item label="联系状态">
          <el-select v-model="filterContact">
            <el-option label="全部" value="all" />
            <el-option label="已联系" value="contacted" />
            <el-option label="未联系" value="uncontacted" />
          </el-select>
        </el-form-item>

        <el-form-item label="微信状态">
          <el-select v-model="filterWechat">
            <el-option label="全部" value="all" />
            <el-option label="已加" value="added" />
            <el-option label="未加" value="not_added" />
          </el-select>
        </el-form-item>

        <el-form-item label="房东类型">
          <el-select v-model="filterLandlordType" multiple placeholder="请选择">
            <el-option label="一手房东" value="first_hand" />
            <el-option label="二手房东" value="second_hand" />
            <el-option label="中介" value="agent" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="水费类型">
          <el-select v-model="filterWaterType">
            <el-option label="全部" value="all" />
            <el-option label="民用水" value="civil" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="电费类型">
          <el-select v-model="filterElectricityType">
            <el-option label="全部" value="all" />
            <el-option label="民用电" value="civil" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="房型">
          <el-select v-model="filterRoomTypes" multiple placeholder="请选择">
            <el-option
              v-for="item in ROOM_TYPES"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="租金范围">
          <div style="display: flex; gap: 10px">
            <el-input-number
              v-model="filterRentMin"
              :min="0"
              placeholder="最低"
              style="width: 100%"
              :controls="false"
            />
            <span>-</span>
            <el-input-number
              v-model="filterRentMax"
              :min="0"
              placeholder="最高"
              style="width: 100%"
              :controls="false"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-tooltip content="（疑似二房东到处贴广告）" placement="top">
            <el-checkbox
              v-model="hideRepeatedPhones"
              label="隐藏重复电话房东"
            />
          </el-tooltip>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="删除确认" width="30%">
      <span>确定要删除这个房东吗？此操作无法撤销。</span>
      <div style="margin-top: 15px">
        <el-checkbox
          v-model="deleteWithImages"
          label="同时删除对应的图片文件"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete"> 删除 </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 设置对话框 -->
    <el-dialog v-model="settingDialogVisible" title="系统设置" width="500px">
      <el-form :model="amapForm" label-width="100px">
        <el-form-item label="高德 Key">
          <el-input
            v-model="amapForm.key"
            placeholder="请输入高德地图 Web 端 (JS API) Key"
          />
        </el-form-item>
        <el-form-item label="安全密钥">
          <el-input
            v-model="amapForm.securityCode"
            placeholder="请输入高德地图安全密钥 (Security Code)"
            type="password"
            show-password
          />
        </el-form-item>
        <div
          style="
            margin-left: 100px;
            font-size: 12px;
            color: #909399;
            line-height: 1.5;
          "
        >
          <p>
            请前往
            <a
              href="https://console.amap.com/dev/key/app"
              target="_blank"
              style="color: #409eff"
              >高德开放平台</a
            >
            注册账号并创建 Web 端 (JS API) 应用，获取 Key 和 安全密钥。
          </p>
          <p>注意：修改设置后需要刷新页面才能生效。</p>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveSettings">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 使用说明 Tour -->
    <el-tour
      v-model="tourOpen"
      :current="tourCurrent"
      @change="tourCurrent = $event"
    >
      <el-tour-step
        title="准备工作"
        description="请先准备好一个文件夹，里面放入您扫楼时拍摄的照片。请确保照片包含 GPS 地理位置信息（手机拍照默认开启）。"
      />
      <el-tour-step
        target="#btn-import-photos"
        title="导入照片"
        description="点击此按钮，选择您准备好的照片文件夹。然后点击【扫描文件夹】，系统会自动扫描其中的照片，并根据 GPS 信息识别位置。"
      />
      <el-tour-step
        target="#btn-import-photos"
        title="快速整理"
        description="点击打开的弹窗里面有个【快速整理】，勾选后可以根据图片快速输入房东的联系方式，节省大量时间。"
      />
      <el-tour-step
        target="#left-panel"
        title="房东列表"
        placement="right"
        description="识别完成后，房东信息会出现在这里。系统会自动根据位置将照片分组为不同的房东。"
      />
      <el-tour-step
        target="#right-panel"
        title="地图模式"
        placement="left"
        description="您也可以在地图上查看房东的分布情况。点击地图上的标记可以快速定位到房东。"
      />
      <el-tour-step
        target="#btn-export-excel"
        title="导出Excel"
        description="整理完成后，您可以将数据导出为 Excel 表格，方便后续跟进。"
      />
      <el-tour-step
        target="#btn-backup"
        title="导出备份"
        description="定期导出备份文件，防止数据丢失。备份文件是一个 JSON 格式的文件，可以随时导入恢复数据。"
      />
      <el-tour-step
        target="#btn-backup-import"
        title="导入备份"
        description="需先点击“批量导入照片中”的选择文件夹，选择你存放图片的文件夹（不选择的话，没法加载图片），然后选择之前导出的备份文件即可恢复数据。"
      />
      <el-tour-step
        title="温馨提示"
        description="全部数据保存在您的本地计算机上，系统不会上传任何信息。请定期备份重要数据。祝您使用愉快！"
      />
    </el-tour>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.toolbar {
  height: 60px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}

.logo h1 {
  font-size: 20px;
  color: #409eff;
  margin: 0;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 420px;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.property-list {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header h3 {
  font-size: 16px;
  color: #303133;
}

.filters {
  display: flex;
  gap: 8px;
}

.property-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  margin-right: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.property-item:hover {
  background: #e6f7ff;
  border: 2px solid #409eff70;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-tag {
  padding: 0 6px;
}

.property-item.active {
  border-color: #409eff;
  background: #e6f7ff;
}

.property-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.property-info .phone {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.property-info .phone.secondary {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.property-info .nickname {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.property-info .address {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-info .stats {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}

.landlord-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: #f0f9ff;
  border-radius: 50%;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  background: white;
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
