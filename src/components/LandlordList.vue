<template>
  <div class="landlord-list">
    <div class="list-header">
      <h3>房东列表 ({{ filteredLandlords.length }})</h3>
    </div>

    <DynamicScroller
      ref="virtualListRef"
      :items="filteredLandlords"
      :min-item-size="80"
      key-field="id"
      class="virtual-scroller"
      style="height: calc(100vh - 130px)"
    >
      <template v-slot="{ item: landlord, index, active }">
        <DynamicScrollerItem
          :item="landlord"
          :active="active"
          :size-dependencies="[
            landlord.wechatNickname,
            landlord.phoneNumbers,
            landlord.address,
            landlord.properties?.length,
          ]"
          :data-index="index"
          class="scroller-item"
        >
          <div
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
              <div
                style="display: flex; flex-direction: column; gap: 4px"
              >
                <div class="info-row">
                  <span class="nickname" v-if="landlord.wechatNickname">{{
                    landlord.wechatNickname
                  }}</span>
                  <div
                    style="display: flex; align-items: center; gap: 8px"
                  >
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
                    @click.stop="handleViewDetail(landlord)"
                  >
                    详情
                  </el-button>
                  <el-button
                    :type="landlord.isFavorite ? 'warning' : 'info'"
                    link
                    style="margin-left: 0px"
                    size="small"
                    :icon="landlord.isFavorite ? StarFilled : Star"
                    @click.stop="handleToggleFavorite(landlord.id)"
                  />
                  <el-popconfirm
                    title="确定删除此房东？"
                    @confirm="handleDelete(landlord)"
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
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    
    <el-empty
      v-if="filteredLandlords.length === 0"
      description="暂无符合条件的数据"
      style="
        height: calc(100vh - 130px);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    />

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="删除确认" width="450px">
      <span>确定要删除这个房东吗？此操作无法撤销。</span>
      <div style="margin-top: 15px">
        <el-checkbox
          v-model="deleteWithImages"
          label="同时删除对应的图片文件（图片会移动到 .trash 文件夹内）"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete"> 删除 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { Delete, Star, StarFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import LandlordAvatar from './LandlordAvatar.vue';
import { usePropertyStore } from '@/stores/property';
import { LandlordType } from '@/types';
import type { Landlord } from '@/types';

const propertyStore = usePropertyStore();
const virtualListRef = ref<any>(null);

const filteredLandlords = computed(() => propertyStore.filteredLandlords);

// Props用于接收MapView的ref
const props = defineProps<{
  mapViewRef?: any;
}>();

// 删除确认状态
const deleteDialogVisible = ref(false);
const deleteWithImages = ref(true);
const landlordToDelete = ref<Landlord | null>(null);

// 监听当前聚焦的房东，自动滚动到列表位置
watch(
  () => propertyStore.focusedLandlordId,
  (newId) => {
    if (newId && virtualListRef.value) {
      setTimeout(() => {
        const index = filteredLandlords.value.findIndex((l) => l.id === newId);
        if (index !== -1) {
          virtualListRef.value.scrollToItem(index);
        }
      }, 100);
    }
  }
);

// 暴露方法给父组件
defineExpose({
  scrollToItem: (index: number) => {
    if (virtualListRef.value) {
      virtualListRef.value.scrollToItem(index);
    }
  },
  virtualListRef,
  deleteDialogVisible,
  deleteWithImages,
  landlordToDelete
});

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

const handleLandlordClick = (landlord: Landlord) => {
  // 设置聚焦的房东
  propertyStore.setFocusedLandlord(landlord.id);
  // 地图聚焦
  if (props.mapViewRef) {
    props.mapViewRef.focusLandlord(landlord);
  }
};

const handleViewDetail = (landlord: Landlord) => {
  propertyStore.selectLandlord(landlord);
};

const handleToggleFavorite = (landlordId: string) => {
  propertyStore.toggleFavorite(landlordId);
};

const handleDelete = (landlord: Landlord) => {
  landlordToDelete.value = landlord;
  deleteWithImages.value = true;
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
</script>

<style scoped lang="scss">
.landlord-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fdfdfd;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: white;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.virtual-scroller {
  flex: 1;
}

.scroller-item {
  padding: 8px 16px;
}

.property-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #409eff;
    background: #ecf5ff;
  }
}

.landlord-icon {
  flex-shrink: 0;
}

.property-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nickname {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.phone {
  color: #606266;
  font-size: 14px;

  &.secondary {
    font-size: 13px;
    color: #909399;
  }
}

.address {
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
}
</style>
