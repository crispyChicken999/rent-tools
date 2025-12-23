<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { DArrowLeft, DArrowRight } from "@element-plus/icons-vue";

import PhotoUpload from "./components/PhotoUpload.vue";
import MapView from "./components/MapView.vue";
import PropertyDetail from "./components/PropertyDetail.vue";
import PropertyList from "./components/PropertyList.vue";
import LandlordList from "./components/LandlordList.vue";
import PropertyDetailPage from "./components/PropertyDetailPage.vue";
import PropertyFilter from "./components/PropertyFilter.vue";
import LandlordFilter from "./components/LandlordFilter.vue";
import Toolbar from "./components/Toolbar.vue";
import { usePropertyStore } from "./stores/property";
import { exportToExcel, exportToJson, importFromJson } from "./utils/export";
import { getStoredAmapConfig, saveAmapConfig } from "./utils/geocode";

const propertyStore = usePropertyStore();
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Tour 状态
const tourOpen = ref(false);
const tourCurrent = ref(0);
watch(tourCurrent, () => {
  showPhotoUpload.value = [2, 3, 4, 5, 6, 7].includes(tourCurrent.value);
});

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

// 房源详情页状态
const propertyDetailVisible = ref(false);
const currentPropertyId = ref("");
const currentLandlordId = ref("");

// 房源筛选抽屉状态
const showPropertyFilterDrawer = ref(false);

onMounted(async () => {
  if (
    !localStorage.getItem("amap_key") ||
    !localStorage.getItem("amap_security_code")
  ) {
    settingDialogVisible.value = true;
  }
  await propertyStore.loadLandlords();

  // 监听地图房源标记点击事件
  window.addEventListener("open-property-detail", ((e: CustomEvent) => {
    handlePropertyDetailView(e.detail.propertyId);
  }) as EventListener);

  // 监听房源切换事件（来自详情页的Alt+左右键）
  window.addEventListener("switchProperty", ((e: CustomEvent) => {
    currentPropertyId.value = e.detail.propertyId;
    currentLandlordId.value = e.detail.landlordId;
    propertyDetailVisible.value = true;
  }) as EventListener);
});

// 监听视图模式切换，重置筛选
watch(
  () => propertyStore.viewMode,
  (newMode, oldMode) => {
    // 只有在模式真正改变时才重置
    if (oldMode && newMode !== oldMode) {
      if (newMode === "landlord") {
        // 切换到房东视图时，重置房东筛选
        propertyStore.clearLandlordFilters();
      } else if (newMode === "property") {
        // 切换到房源视图时，重置房源筛选
        propertyStore.clearPropertyFilters();
      }
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
const handleImport = () => {
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

// 房源视图相关事件处理
const handlePropertyDetailView = (propertyId: string) => {
  // 打开房源详情页
  const property = propertyStore.flattenedProperties.find(
    (p) => p.propertyId === propertyId
  );
  if (property) {
    currentPropertyId.value = propertyId;
    currentLandlordId.value = property.landlordId;
    propertyDetailVisible.value = true;
  } else {
    ElMessage.error("房源不存在");
  }
};

const handlePropertyDetailSaved = () => {
  // 房源详情保存后，刷新列表
  propertyStore.loadLandlords();
};

const handleGoToLandlordFromDetail = (landlordId: string) => {
  // 从详情页跳转到房东视图
  propertyDetailVisible.value = false;
  propertyStore.setViewMode("landlord");
  propertyStore.setFocusedLandlord(landlordId);
  propertyStore.selectLandlord(
    propertyStore.landlords.find((l) => l.id === landlordId) || null
  );
};

const handlePropertyLocate = (gps: { lng: number; lat: number }) => {
  // 地图定位到指定位置
  if (mapViewRef.value) {
    mapViewRef.value.locateToPosition(gps);
  }
};

const handleViewLandlordFromProperty = (landlordId: string) => {
  // 切换到房东视图并定位到该房东
  propertyStore.setViewMode("landlord");
  propertyStore.setFocusedLandlord(landlordId);

  // 地图聚焦这个房东的marker
  if (mapViewRef.value) {
    const landlord = propertyStore.landlords.find((l) => l.id === landlordId);
    if (landlord) {
      setTimeout(() => {
        mapViewRef.value?.focusLandlord(landlord);
      }, 1000); // 等待模式切换完成
    }
  }
};

const showPhotoUpload = ref(false);
</script>

<template>
  <div class="app-container">
    <!-- 顶部工具栏 -->
    <Toolbar
      @import-photos="showPhotoUpload = true"
      @export="handleExport"
      @import-backup="handleImport"
      @backup="handleBackup"
      @tour="tourOpen = true"
      @settings="
        initSettings();
        settingDialogVisible = true;
      "
      @filter-landlord="showFilterDrawer = true"
      @filter-property="showPropertyFilterDrawer = true"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：列表 -->
      <div
        class="left-panel"
        id="left-panel"
        :class="{ collapsed: propertyStore.isSidebarCollapsed }"
      >
        <!-- Toggle按钮 -->
        <div
          class="sidebar-toggle"
          :class="{ visible: propertyStore.isSidebarCollapsed }"
          @click="propertyStore.toggleSidebar()"
          title="展开/收起侧边栏"
        >
          <el-icon :size="14">
            <DArrowRight v-if="propertyStore.isSidebarCollapsed" />
            <DArrowLeft v-else />
          </el-icon>
        </div>

        <!-- 房东列表 -->
        <LandlordList
          v-if="propertyStore.viewMode === 'landlord'"
          ref="virtualListRef"
          :map-view-ref="mapViewRef"
        />

        <!-- 房源列表 -->
        <PropertyList
          v-else-if="propertyStore.viewMode === 'property'"
          @view-detail="handlePropertyDetailView"
          @locate="handlePropertyLocate"
          @view-landlord="handleViewLandlordFromProperty"
        />
      </div>

      <!-- 右侧：地图 -->
      <div class="right-panel" id="right-panel">
        <MapView
          ref="mapViewRef"
          :view-mode="propertyStore.viewMode"
          :properties="propertyStore.filteredProperties"
        />
      </div>
    </div>

    <!-- 房东详情抽屉 -->
    <PropertyDetail />

    <!-- 房源详情页 -->
    <PropertyDetailPage
      v-model="propertyDetailVisible"
      :property-id="currentPropertyId"
      :landlord-id="currentLandlordId"
      @saved="handlePropertyDetailSaved"
      @go-to-landlord="handleGoToLandlordFromDetail"
    />

    <!-- 房源筛选抽屉 -->
    <el-drawer
      v-model="showPropertyFilterDrawer"
      title="筛选房源"
      direction="rtl"
      size="400px"
    >
      <PropertyFilter
        v-if="propertyStore.viewMode === 'property'"
        @apply-filter="showPropertyFilterDrawer = false"
      />
    </el-drawer>

    <!-- 照片上传对话框 -->
    <el-dialog
      v-model="showPhotoUpload"
      title="批量导入照片"
      width="600px"
      destroy-on-close
    >
      <PhotoUpload />
    </el-dialog>

    <!-- 隐藏的文件输入框，用来恢复备份用的 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept=".json"
      @change="handleFileChange"
    />

    <!-- 房东筛选抽屉 -->
    <el-drawer
      v-model="showFilterDrawer"
      title="筛选房东"
      direction="rtl"
      size="400px"
    >
      <LandlordFilter
        v-if="propertyStore.viewMode === 'landlord'"
        @apply-filter="showFilterDrawer = false"
      />
    </el-drawer>

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
      :z-index="9999"
      @change="tourCurrent = $event"
    >
      <el-tour-step
        title="欢迎使用租房信息管理系统 🎉"
        description="这是一个帮助您高效管理扫楼信息的工具。通过导入照片自动识别位置，快速整理房东信息，支持地图查看、数据筛选和导出。让我们开始吧！（按⬅或➡切换步骤，按ESC关闭）"
      />
      <el-tour-step
        title="准备工作 📸"
        description="请先准备好一个文件夹，里面放入您扫楼时拍摄的照片。请确保照片包含 GPS 地理位置信息（手机拍照默认开启）。"
      />
      <el-tour-step
        target="#btn-import-photos"
        title="导入照片 🖼️"
        description="点击此按钮打开上传弹窗，里面包含了「选择照片文件夹」、「扫描文件夹」、「快速整理」、「清空所有数据」的功能。"
      />
      <el-tour-step
        target="#btn-select-folder"
        title="选择文件夹 📂"
        description="点击此按钮打开弹窗，点击「选择照片文件夹」。选择您准备好的文件夹。"
      />
      <el-tour-step
        target="#btn-scan-folder"
        title="扫描文件夹 ♻️"
        description="点击「扫描文件夹」，系统会自动扫描其中的照片，并根据 GPS 信息识别位置。"
      />
      <el-tour-step
        target="#btn-fast-origanize"
        title="快速整理 ⚡"
        description="点击「快速整理」，会打开弹窗。该弹窗为左右布局，左边放的是图片，右边是手机输入框。可以根据图片快速输入房东的联系方式，节省时间。详细操作说明请点击「操作说明」查看。"
      />
      <el-tour-step
        target="#btn-batch-scan-phone-location"
        title="批量识别手机号码归属地 📍"
        description="系统支持自动识别手机号归属地功能！输入手机号后，系统会自动查询并显示该号码的归属地信息（省份、城市），帮助您更好地了解房东来源。"
      />
      <el-tour-step
        target="#btn-clear-data"
        title="清空所有数据 🗑️"
        description="点击「清空所有数据」，会将所有数据清空，删除后无法恢复，情谨慎操作！"
      />
      <el-tour-step
        target="#left-panel"
        title="房东/房源列表 📋"
        placement="right"
        description="识别完成后，房东信息会出现在这里。系统会自动根据位置将照片分组为不同的房东，支持收藏、删除和查看详情，点击房东会自动在地图上定位。切换为房源视图后则为房源的信息。"
      />
      <el-tour-step
        target="#right-panel"
        title="地图模式 🗺️"
        placement="left"
        description="您也可以在地图上查看房东/房源的分布情况。点击地图上的标记可以快速定位到房东/房源，并查看其详情。"
      />
      <el-tour-step
        target="#btn-map-controls"
        title="地图控制 🎮"
        placement="left"
        description="右侧的控制按钮可以帮助您更好地使用地图功能：查看图例说明、定位当前位置、框选区域筛选房源/房东、切换区域显示等。"
      />
      <el-tour-step
        target="#btn-list-mode"
        title="切换视图 🗺️"
        description="切换房东/房源视图，查看现在已有的房源信息。"
      />
      <el-tour-step
        target="#btn-export-excel"
        title="导出Excel 📊"
        description="整理完成后，您可以将数据导出为 Excel 表格，方便后续跟进。"
      />
      <el-tour-step
        target="#btn-backup-import"
        title="导入备份 📥"
        description="选择之前导出的备份文件即可恢复数据。导入后会覆盖已有数据，如果发现图片未加载 🖼️，则需点击「批量导入照片」中的「选择照片文件夹」，选择你存放之前图片的文件夹后刷新页面即可。"
      />
      <el-tour-step
        target="#btn-backup"
        title="导出备份 💾"
        description="定期导出备份文件，防止数据丢失。备份文件是一个 JSON 格式的文件，可以随时导入恢复数据。数据无价，请妥善保管。"
      />
      <el-tour-step
        target="#btn-filter"
        title="筛选功能 🔍"
        description="可以根据联系状态、微信状态、房东类型等条件进行筛选，快速找到目标房东/房源。切换不同视图，则此处为对应视图的筛选。"
      />
      <el-tour-step
        target="#btn-settings"
        title="设置高德地图 API 🔧"
        description="本软件使用到地图功能，请在「设置」中输入高德地图的 Key 和安全密钥。可以在高德开放平台注册账号获取。注册为个人开发者享受免费额度。"
      />
      <el-tour-step
        target="#btn-tour"
        title="使用说明 Tour 🎓"
        description="点击此按钮可以重新查看使用说明。"
      />
      <el-tour-step
        target="#btn-github"
        title="开源项目 ⭐"
        description="本项目是开源的！如果您觉得这个工具对您有帮助，欢迎访问我们的 GitHub 仓库，给我们一个 Star 支持一下~ 您的支持是我们持续改进的动力！💪"
      />
      <el-tour-step
        title="温馨提示 💡"
        description="全部数据保存在您的本地计算机 💻上，系统不会上传任何信息。请定期备份重要数据。祝您使用愉快！🎉"
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
  position: relative;
  transition: width 0.3s ease, margin 0.3s ease;

  &.collapsed {
    width: 0;
    margin-right: 0;
    box-shadow: none;
  }

  /* Toggle按钮 */
  .sidebar-toggle {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 40px;
    background: white;
    border: 1px solid #e4e7ed;
    border-left: none;
    border-radius: 0 8px 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

    &:hover {
      background: #f5f7fa;
      border-color: #409eff;
      color: #409eff;
    }

    &.visible {
      opacity: 1;
    }
  }

  &:hover .sidebar-toggle {
    opacity: 1;
  }
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
