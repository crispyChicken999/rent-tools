<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Delete, Upload } from "@element-plus/icons-vue";
import PhotoUpload from "./components/PhotoUpload.vue";
import MapView from "./components/MapView.vue";
import PropertyDetail from "./components/PropertyDetail.vue";
import LandlordAvatar from "./components/LandlordAvatar.vue";
import { usePropertyStore } from "./stores/property";
import { exportToExcel, exportToJson, importFromJson } from "./utils/export";
import { LandlordType, ContactStatus, WechatStatus, type FilterOptions } from "./types";

const propertyStore = usePropertyStore();
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// 筛选状态
const filterContact = ref("all"); // all, contacted, uncontacted
const filterWechat = ref("all"); // all, added, not_added
const hideRepeatedPhones = ref(false);

onMounted(async () => {
  await propertyStore.loadLandlords();
});

// 监听筛选条件变化，同步到 Store
watch(
  [filterContact, filterWechat, hideRepeatedPhones],
  () => {
    const filters: FilterOptions = {};

    if (filterContact.value !== "all") {
      filters.contactStatus = [filterContact.value as ContactStatus];
    }

    if (filterWechat.value !== "all") {
      filters.wechatStatus = [filterWechat.value as WechatStatus];
    }

    filters.hideRepeatedPhones = hideRepeatedPhones.value;

    propertyStore.setFilters(filters);
  },
  { immediate: true }
);

// 过滤后的房东列表 (直接使用 Store 的计算属性)
const filteredLandlords = computed(() => propertyStore.filteredLandlords);

// 导出功能
const handleExport = () => {
  exportToExcel(propertyStore.landlords);
  ElMessage.success("导出成功");
};

// 备份功能
const handleBackup = () => {
  const filename = `租房信息备份_${new Date().toISOString().split("T")[0]}.json`;
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
  if (mapViewRef.value) {
    mapViewRef.value.focusLandlord(landlord);
  }
};

const handleDeleteLandlord = async (landlord: any) => {
  try {
    await propertyStore.removeLandlord(landlord.id);
    ElMessage.success("删除成功");
  } catch (error) {
    ElMessage.error("删除失败");
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
          type="primary"
          @click="showPhotoUpload = true"
          :icon="Upload"
        >
          批量导入照片
        </el-button>
        <el-button
          @click="handleExport"
          :disabled="propertyStore.landlords.length === 0"
        >
          导出Excel
        </el-button>
        <el-button
          type="primary"
          @click="handleImport"
          :disabled="propertyStore.landlords.length === 0"
        >
          导入备份
        </el-button>
        <el-button
          @click="handleBackup"
          :disabled="propertyStore.landlords.length === 0"
        >
          备份数据
        </el-button>
        <el-tag type="info" style="margin-left: 12px">
          共 {{ propertyStore.landlords.length }} 个房东
        </el-tag>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：列表 -->
      <div class="left-panel">
        <!-- 房东列表 -->
        <div class="property-list">
          <div class="list-header">
            <h3>房东列表 ({{ filteredLandlords.length }})</h3>
            <div class="filters">
              <el-select
                v-model="filterContact"
                style="width: 90px"
                placeholder="联系状态"
              >
                <el-option label="全部" value="all" />
                <el-option label="已联系" value="contacted" />
                <el-option label="未联系" value="uncontacted" />
              </el-select>
              <el-select
                v-model="filterWechat"
                style="width: 90px"
                placeholder="微信状态"
              >
                <el-option label="全部" value="all" />
                <el-option label="已加" value="added" />
                <el-option label="未加" value="not_added" />
              </el-select>
              <el-tooltip
                content="隐藏电话号码重复出现的房东（可能是二房东）"
                placement="top"
              >
                <el-checkbox
                  v-model="hideRepeatedPhones"
                  label="隐藏重复"
                  border
                  style="margin-right: 0; height: 32px; padding: 0 10px"
                />
              </el-tooltip>
            </div>
          </div>

          <el-scrollbar height="calc(100vh - 0px)">
            <div
              v-for="landlord in filteredLandlords"
              :key="landlord.id"
              class="property-item"
              :class="{
                active: propertyStore.currentLandlord?.id === landlord.id,
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
                  <el-tag
                    size="small"
                    :type="getLandlordTypeTagType(landlord.landlordType)"
                    effect="plain"
                    style="margin-right: 4px"
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
                    style="margin-right: 4px"
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
                  >已加WX</el-tag>
                  <span style="margin-left: 8px"
                    >{{ landlord.properties?.length || 0 }} 个房源</span
                  >
                  <el-button
                    type="primary"
                    link
                    size="small"
                    style="margin-left: auto"
                    @click.stop="propertyStore.selectLandlord(landlord)"
                  >
                    详情
                  </el-button>
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
                        :icon="Delete"
                        @click.stop
                      />
                    </template>
                  </el-popconfirm>
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
      <div class="right-panel">
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
  </div>
</template>

<style scoped>
*:not(.el-button) {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

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
  align-items: center;
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
