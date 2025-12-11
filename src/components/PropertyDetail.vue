<template>
  <el-drawer
    v-model="visible"
    title="房东详情"
    :size="800"
    direction="rtl"
    destroy-on-close
    @closed="handleClosed"
    class="detail-drawer"
  >
    <div v-if="landlord" class="landlord-detail">
      <el-tabs v-model="activeTab">
        <!-- 基本信息 Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <el-scrollbar>
            <div class="tab-content-wrapper">
              <!-- 照片展示区 -->
              <div class="photo-section">
                <!-- 主图展示 -->
                <div class="main-photo-container">
                  <div v-if="mainPhotoUrl" class="main-photo">
                    <el-image
                      :src="mainPhotoUrl"
                      :preview-src-list="allPhotoUrls"
                      :initial-index="currentPhotoIndex"
                      fit="contain"
                      hide-on-click-modal
                      class="main-image"
                    >
                      <template #error>
                        <div class="image-error">
                          <el-icon :size="48"><Picture /></el-icon>
                          <div>照片加载失败</div>
                        </div>
                      </template>
                    </el-image>
                    <div class="photo-actions">
                      <el-button
                        type="danger"
                        size="small"
                        :icon="Delete"
                        @click="deletePhoto(currentPhotoIndex)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                  <div
                    v-else
                    class="no-photo-placeholder"
                    @click="openFileSelector('photo')"
                  >
                    <el-icon :size="64" color="#909399"><Picture /></el-icon>
                    <div class="placeholder-text">点击上传照片</div>
                  </div>
                </div>

                <!-- 缩略图列表 + 上传按钮 -->
                <div class="thumbnails-container">
                  <div
                    v-for="(url, index) in photoUrls"
                    :key="editForm.photos[index]?.id || index"
                    class="thumbnail-item"
                    :class="{ active: index === currentPhotoIndex }"
                    @click="currentPhotoIndex = index"
                  >
                    <el-image :src="url" fit="cover" class="thumbnail-image" />
                    <div class="thumbnail-overlay">
                      <el-icon><View /></el-icon>
                    </div>
                  </div>

                  <!-- 上传按钮 -->
                  <div
                    class="upload-btn-wrapper"
                    @click="openFileSelector('photo')"
                  >
                    <div class="upload-btn">
                      <el-icon :size="24"><Plus /></el-icon>
                      <div class="upload-text">上传</div>
                    </div>
                  </div>
                </div>

                <div class="photo-count" v-if="photoUrls.length > 0">
                  共 {{ photoUrls.length }} 张照片
                </div>
              </div>

              <el-form :model="editForm" label-width="100px">
                <!-- 电话号码 (动态添加) -->
                <el-form-item label="电话号码" required>
                  <div style="display: flex; flex-direction: column; gap: 8px">
                    <div
                      v-for="(_phone, index) in editForm.phoneNumbers"
                      :key="index"
                      class="phone-item"
                    >
                      <el-input
                        v-model="editForm.phoneNumbers[index]"
                        placeholder="输入电话号码"
                        @blur="
                          checkDuplicatePhone(
                            editForm.phoneNumbers[index],
                            index
                          )
                        "
                      >
                        <template #append>
                          <el-button
                            :icon="CopyDocument"
                            @click="
                              copyToClipboard(editForm.phoneNumbers[index])
                            "
                            title="复制号码"
                          />
                        </template>
                      </el-input>
                      <el-button
                        v-if="editForm.phoneNumbers.length > 1"
                        :icon="Delete"
                        @click="removePhone(index)"
                        title="删除号码"
                      />
                    </div>
                    <el-button
                      type="primary"
                      link
                      :icon="Plus"
                      @click="addPhone"
                      >添加电话</el-button
                    >
                  </div>
                </el-form-item>

                <el-form-item label="房东类型">
                  <el-radio-group v-model="editForm.landlordType">
                    <el-radio-button
                      v-for="opt in LANDLORD_TYPES"
                      :key="opt.value"
                      :label="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="微信状态">
                  <el-radio-group v-model="editForm.wechatStatus">
                    <el-radio
                      v-for="opt in WECHAT_STATUS_TYPES"
                      :key="opt.value"
                      :label="opt.value"
                      >{{ opt.label }}</el-radio
                    >
                  </el-radio-group>
                </el-form-item>

                <!-- 微信头像 -->
                <el-form-item label="微信头像">
                  <div
                    style="
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      gap: 5px;
                    "
                  >
                    <div
                      class="avatar-uploader"
                      @click="openFileSelector('avatar')"
                    >
                      <el-image
                        v-if="avatarUrl"
                        :src="avatarUrl"
                        class="avatar"
                        :preview-src-list="[avatarUrl]"
                        hide-on-click-modal
                        :preview-teleported="true"
                        fit="cover"
                        @click.stop
                      />
                      <el-icon v-else class="avatar-uploader-icon"
                        ><Plus
                      /></el-icon>
                    </div>
                    <div class="sub-text" v-if="!avatarUrl">点击选择头像</div>
                    <div v-if="avatarUrl" style="display: flex; gap: 8px">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click="openFileSelector('avatar')"
                      >
                        更换
                      </el-button>
                      <el-button
                        type="danger"
                        link
                        size="small"
                        :icon="Delete"
                        @click.stop="clearAvatar"
                      >
                        清除
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="微信昵称">
                  <el-input
                    v-model="editForm.wechatNickname"
                    placeholder="输入微信昵称"
                  />
                </el-form-item>

                <el-form-item label="联系状态">
                  <el-radio-group v-model="editForm.contactStatus">
                    <el-radio
                      v-for="opt in CONTACT_STATUS_TYPES"
                      :key="opt.value"
                      :label="opt.value"
                      >{{ opt.label }}</el-radio
                    >
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="位置信息" style="flex: 1">
                  <div class="location-info">
                    <el-input
                      v-model="editForm.address"
                      placeholder="输入地址"
                      clearable
                    >
                      <template #prefix>📍</template>
                      <template #append>
                        <el-button
                          :icon="Refresh"
                          :loading="refreshingAddress"
                          @click="refreshAddress"
                          title="根据 GPS 重新获取地址"
                        />
                      </template>
                    </el-input>
                    <div v-if="editForm.gps" class="gps-coords">
                      GPS: {{ editForm.gps.lng.toFixed(6) }},
                      {{ editForm.gps.lat.toFixed(6) }}
                    </div>
                  </div>
                </el-form-item>

                <el-form-item label="拍摄时间">
                  {{
                    editForm.captureTime
                      ? new Date(editForm.captureTime).toLocaleString()
                      : "未知"
                  }}
                </el-form-item>

                <el-form-item label="押金方式">
                  <el-select
                    v-model="editForm.deposit"
                    placeholder="选择押金方式"
                    allow-create
                    filterable
                  >
                    <el-option
                      v-for="opt in DEPOSIT_METHODS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="补充信息">
                  <el-input
                    v-model="editForm.additionalInfo"
                    type="textarea"
                    :rows="2"
                    placeholder="备注一些额外的信息..."
                  />
                </el-form-item>
              </el-form>
            </div>
          </el-scrollbar>
        </el-tab-pane>

        <!-- 费用设置 Tab -->
        <el-tab-pane label="费用设置" name="fees">
          <el-scrollbar>
            <div class="tab-content-wrapper">
              <el-form :model="editForm.commonFees" label-width="100px">
                <el-form-item label="电费">
                  <el-select
                    v-model="editForm.commonFees.electricity.type"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in ELECTRICITY_TYPES"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                  <el-input
                    v-if="editForm.commonFees.electricity.type === 'custom'"
                    v-model.number="editForm.commonFees.electricity.price"
                    type="number"
                  >
                    <template #append>元/度</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="水费">
                  <el-select
                    v-model="editForm.commonFees.water.type"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in WATER_TYPES"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                  <el-input
                    v-if="editForm.commonFees.water.type === 'custom'"
                    v-model.number="editForm.commonFees.water.price"
                    type="number"
                  >
                    <template #append>元/吨</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="其他费用">
                  <div class="fee-grid">
                    <el-input
                      v-model.number="editForm.commonFees.internet"
                      placeholder="网费"
                      type="number"
                    >
                      <template #prepend>网费</template>
                      <template #append>元</template>
                    </el-input>
                    <el-input
                      v-model.number="editForm.commonFees.management"
                      placeholder="管理费"
                      type="number"
                    >
                      <template #prepend>管理费</template>
                      <template #append>元</template>
                    </el-input>
                    <el-input
                      v-model.number="editForm.commonFees.garbage"
                      placeholder="垃圾费"
                      type="number"
                    >
                      <template #prepend>垃圾费</template>
                      <template #append>元</template>
                    </el-input>
                  </div>
                  <el-input
                    v-model="editForm.commonFees.other"
                    placeholder="其他费用说明"
                    type="textarea"
                    :rows="2"
                    style="margin-top: 10px"
                  />
                </el-form-item>
              </el-form>
            </div>
          </el-scrollbar>
        </el-tab-pane>

        <!-- 房源管理 Tab -->
        <el-tab-pane label="房源管理" name="rooms">
          <el-scrollbar>
            <div class="tab-content-wrapper">
              <div class="properties-list">
                <el-card
                  v-for="(room, index) in editForm.properties"
                  :key="room.id"
                  class="room-card"
                  shadow="hover"
                >
                  <template #header>
                    <div class="card-header">
                      <span>房源 {{ index + 1 }}</span>
                      <el-button
                        type="danger"
                        size="small"
                        text
                        @click="removeRoom(index)"
                        >删除</el-button
                      >
                    </div>
                  </template>

                  <el-form label-width="80px" size="default" class="room-form">
                    <el-form-item label="房型">
                      <el-select
                        v-model="room.roomType"
                        placeholder="请选择房型"
                      >
                        <el-option
                          v-for="opt in ROOM_TYPES"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="楼层">
                      <el-select
                        v-model="room.floor"
                        placeholder="请选择楼层"
                        filterable
                        allow-create
                      >
                        <el-option
                          v-for="opt in FLOOR_OPTIONS"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="租金">
                      <el-input
                        v-model.number="room.rent"
                        type="number"
                        placeholder="输入租金"
                      >
                        <template #append>元/月</template>
                      </el-input>
                    </el-form-item>

                    <el-form-item label="配套设施">
                      <el-checkbox-group v-model="room.amenities">
                        <el-checkbox
                          v-for="opt in AMENITY_OPTIONS"
                          :key="opt"
                          :label="opt"
                        />
                      </el-checkbox-group>
                    </el-form-item>

                    <el-form-item label="房源描述">
                      <el-input
                        v-model="room.description"
                        type="textarea"
                        :rows="2"
                      />
                    </el-form-item>

                    <el-form-item label="视频">
                      <div
                        style="display: flex; flex-direction: column; gap: 8px"
                      >
                        <div
                          v-for="(video, vIndex) in room.videos"
                          :key="video.id"
                          class="video-item"
                        >
                          <div class="video-header">
                            <span>{{ video.fileName }}</span>
                            <el-button
                              :icon="Delete"
                              size="small"
                              text
                              type="danger"
                              @click="room.videos.splice(vIndex, 1)"
                            />
                          </div>
                          <div class="video-wrapper">
                            <video
                              v-if="videoUrls.get(video.fileName)"
                              controls
                              preload="metadata"
                              class="video-preview"
                              :src="videoUrls.get(video.fileName)"
                            >
                              您的浏览器不支持视频播放
                            </video>
                            <div v-else class="video-loading">
                              <el-icon class="is-loading"><Loading /></el-icon>
                              <span style="margin-left: 8px">加载中...</span>
                            </div>
                          </div>
                        </div>
                        <el-button
                          plain
                          @click="openFileSelector('video', index)"
                        >
                          <el-icon><Plus /></el-icon> 添加视频
                        </el-button>
                      </div>
                    </el-form-item>

                    <el-form-item label="状态">
                      <el-switch
                        v-model="room.available"
                        active-text="可租"
                        inactive-text="已租"
                      />
                    </el-form-item>
                  </el-form>
                </el-card>

                <el-button
                  type="primary"
                  plain
                  class="add-room-btn"
                  @click="addRoom"
                >
                  <el-icon><Plus /></el-icon> 添加房源
                </el-button>
              </div>
            </div>
          </el-scrollbar>
        </el-tab-pane>

        <!-- 沟通记录 Tab -->
        <el-tab-pane label="沟通记录" name="notes">
          <el-scrollbar>
            <div class="tab-content-wrapper">
              <el-input
                v-model="editForm.contactNotes"
                type="textarea"
                :rows="10"
                placeholder="记录每一次沟通的详情..."
              />
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <!-- 底部操作栏 -->
      <div class="action-buttons">
        <el-button
          :type="editForm.isFavorite ? 'warning' : 'default'"
          @click="toggleFavorite"
          size="large"
        >
          <el-icon
            ><component :is="editForm.isFavorite ? StarFilled : Star"
          /></el-icon>
          {{ editForm.isFavorite ? "已收藏" : "收藏" }}
        </el-button>
        <el-button
          type="primary"
          @click="saveChanges"
          :loading="saving"
          size="large"
          >保存修改</el-button
        >
        <el-button @click="closeDrawer" size="large">关闭</el-button>
        <el-button
          type="danger"
          size="large"
          @click="deleteDialogVisible = true"
          >删除</el-button
        >
      </div>
    </template>

    <!-- 文件选择对话框 -->
    <el-dialog
      v-model="fileDialogVisible"
      :title="fileDialogMode === 'video' ? '选择视频' : '选择图片'"
      width="500px"
      append-to-body
    >
      <div
        class="dialog-content-wrapper"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div v-if="isDragging" class="drag-overlay">
          <el-icon class="drag-icon"><UploadFilled /></el-icon>
          <div class="drag-text">释放文件以上传</div>
        </div>

        <div class="dialog-toolbar" style="margin-bottom: 15px">
          <el-button type="primary" @click="handleUpload">
            <el-icon><Plus /></el-icon> 上传新文件
          </el-button>
          <span
            class="tip-text"
            style="margin-left: 10px; font-size: 12px; color: #909399"
          >
            (支持拖拽或 Ctrl+V 粘贴上传，文件将保存到
            {{
              fileDialogMode === "avatar"
                ? "微信头像"
                : fileDialogMode === "video"
                ? "视频"
                : "上传图片"
            }}
            目录)
          </span>
        </div>

        <div v-if="fileList.length === 0" class="file-list">
          <el-empty description="文件夹中没有找到相关文件，可拖拽上传" />
        </div>
        <RecycleScroller
          v-else
          class="file-list-scroller"
          :items="fileListRows"
          :item-size="140"
          key-field="id"
          v-slot="{ item: row }"
        >
          <div class="file-row">
            <div
              v-for="file in row.items"
              :key="file.name"
              class="file-item"
              @click="handleFileSelect(file)"
            >
              <div class="file-preview">
                <el-image
                  v-if="file.type === 'image'"
                  :src="file.url"
                  fit="cover"
                  lazy
                  class="preview-image"
                >
                  <template #error>
                    <div class="image-error-small">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <el-icon
                  v-if="file.type === 'image'"
                  class="preview-eye-icon"
                  @click.stop="previewImage(file.url)"
                >
                  <View />
                </el-icon>
                <video
                  v-else
                  :src="file.url"
                  class="preview-image"
                  style="object-fit: cover"
                  muted
                  preload="metadata"
                  @mouseenter="(e) => (e.target as HTMLVideoElement).play()"
                  @mouseleave="(e) => (e.target as HTMLVideoElement).pause()"
                ></video>
              </div>
              <span class="file-name" :title="file.name">{{ file.name }}</span>
            </div>
          </div>
        </RecycleScroller>
      </div>
    </el-dialog>

    <!-- 隐藏的图片预览器 -->
    <el-image
      ref="hiddenImagePreview"
      v-show="false"
      :src="previewImageUrl"
      :preview-src-list="[previewImageUrl]"
      :initial-index="0"
      hide-on-click-modal
      :preview-teleported="true"
    />

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="450px"
      append-to-body
    >
      <div style="margin-bottom: 20px">
        <p style="margin-bottom: 15px; font-size: 14px; color: #606266">
          确定要删除此房东信息吗？
        </p>
        <el-checkbox v-model="deleteWithImages">
          同时删除根目录下的照片（不会删除"上传图片"文件夹中的照片）
        </el-checkbox>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteLandlord">确认删除</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  onUnmounted,
  onMounted,
  toRaw,
  reactive,
} from "vue";
import { RecycleScroller } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  Picture,
  UploadFilled,
  Loading,
  Refresh,
  CopyDocument,
  View,
  Star,
  StarFilled,
} from "@element-plus/icons-vue";
import { usePropertyStore } from "@/stores/property";
import {
  getValidDirectoryHandle,
  ensureDirectory,
  saveFileToDirectory,
  scanSubdirectory,
  getFileByPath,
} from "@/utils/fileSystem";
import {
  LANDLORD_TYPES,
  WECHAT_STATUS_TYPES,
  CONTACT_STATUS_TYPES,
  ELECTRICITY_TYPES,
  WATER_TYPES,
  ROOM_TYPES,
  AMENITY_OPTIONS,
  DEPOSIT_METHODS,
  type Landlord,
  type RoomInfo,
  type Photo,
} from "@/types";
import { getAddressFromGps } from "@/utils/geocode";

const FLOOR_OPTIONS = Array.from({ length: 99 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}楼`,
}));

const propertyStore = usePropertyStore();
const saving = ref(false);
const activeTab = ref("basic");
const photoUrls = ref<string[]>([]);
const currentPhotoIndex = ref(0);

// 文件选择相关
interface FileItem {
  name: string;
  url: string;
  type: "image" | "video";
}

const fileDialogVisible = ref(false);
const fileDialogMode = ref<"avatar" | "video" | "photo">("avatar");
const fileList = ref<FileItem[]>([]);
const currentRoomIndex = ref(-1);
const previewImageUrl = ref("");
const hiddenImagePreview = ref<any>(null);

// 将文件列表按照每行4个分组
const fileListRows = computed(() => {
  const rows: Array<{ id: number; items: FileItem[] }> = [];
  for (let i = 0; i < fileList.value.length; i += 4) {
    rows.push({
      id: i / 4,
      items: fileList.value.slice(i, i + 4),
    });
  }
  return rows;
});
const videoUrls = reactive(new Map<string, string>()); // 缓存视频 URL
const isDragging = ref(false);
const refreshingAddress = ref(false);
const deleteDialogVisible = ref(false);
const deleteWithImages = ref(true);

const visible = computed({
  get: () => !!propertyStore.currentLandlord,
  set: (val) => {
    if (!val) propertyStore.selectLandlord(null);
  },
});

const landlord = computed(() => propertyStore.currentLandlord);

// 初始化空表单
const createEmptyForm = (): Landlord => ({
  id: "",
  photos: [],
  phoneNumbers: [""],
  landlordType: "other" as any,
  wechatStatus: "not_added" as any,
  contactStatus: "uncontacted" as any,
  deposit: "",
  gps: undefined,
  address: "",
  captureTime: "",
  commonFees: {
    electricity: { type: "civil" },
    water: { type: "civil" },
  },
  properties: [],
  isPerfect: false,
  createdAt: "",
  updatedAt: "",
  avatar: "",
  wechatNickname: "",
});

const editForm = ref<Landlord>(createEmptyForm());
const avatarUrl = ref("");

// 监听选中房东变化，填充表单
watch(
  landlord,
  async (newVal) => {
    if (newVal) {
      // 深拷贝以避免直接修改 store
      const data = JSON.parse(JSON.stringify(newVal));
      // 确保数组存在
      if (!data.phoneNumbers || data.phoneNumbers.length === 0)
        data.phoneNumbers = [""];
      if (!data.properties) data.properties = [];
      if (!data.photos) data.photos = [];

      // 确保 commonFees 存在
      if (!data.commonFees) {
        data.commonFees = {
          electricity: { type: "civil" },
          water: { type: "civil" },
        };
      }
      if (!data.commonFees.electricity)
        data.commonFees.electricity = { type: "civil" };
      if (!data.commonFees.water) data.commonFees.water = { type: "civil" };

      editForm.value = data;
      activeTab.value = "basic";
      currentPhotoIndex.value = 0;

      // 加载照片
      await loadPhotos(data.photos);

      // 加载视频
      videoUrls.forEach((url) => URL.revokeObjectURL(url));
      videoUrls.clear();
      await loadVideos(data.properties);

      // 加载头像
      if (data.avatar) {
        await loadAvatar(data.avatar);
      } else {
        avatarUrl.value = "";
      }
    }
  },
  { immediate: true }
);

const loadAvatar = async (fileName: string) => {
  if (!fileName) {
    avatarUrl.value = "";
    return;
  }
  try {
    const dirHandle = await getValidDirectoryHandle();
    if (!dirHandle) return;

    // 尝试直接获取（兼容旧数据）或通过路径获取
    let file: File | null = null;
    if (fileName.includes("/") || fileName.includes("\\")) {
      file = await getFileByPath(dirHandle, fileName);
    } else {
      // 旧数据或根目录文件
      try {
        const fileHandle = await dirHandle.getFileHandle(fileName);
        file = await fileHandle.getFile();
      } catch {
        // 尝试在"微信头像"目录查找
        file = await getFileByPath(dirHandle, `微信头像/${fileName}`);
      }
    }

    if (file) {
      if (avatarUrl.value) URL.revokeObjectURL(avatarUrl.value);
      avatarUrl.value = URL.createObjectURL(file);
    }
  } catch (e) {
    console.error("Failed to load avatar", e);
  }
};

const clearAvatar = () => {
  if (avatarUrl.value) {
    URL.revokeObjectURL(avatarUrl.value);
    avatarUrl.value = "";
  }
  editForm.value.avatar = "";
};

const loadPhotos = async (photos: any[]) => {
  // 清理旧的 URL
  photoUrls.value.forEach((url) => URL.revokeObjectURL(url));
  photoUrls.value = [];

  if (!photos || photos.length === 0) return;

  try {
    const dirHandle = await getValidDirectoryHandle();
    if (!dirHandle) {
      // 如果没有权限，可能无法显示照片
      return;
    }

    for (const photo of photos) {
      try {
        // 使用 getFileByPath 处理可能包含路径的文件名
        const file = await getFileByPath(dirHandle, photo.fileName);
        if (file) {
          const url = URL.createObjectURL(file);
          photoUrls.value.push(url);
        } else {
          console.error(`加载照片失败: ${photo.fileName} - 文件不存在`);
          photoUrls.value.push("");
        }
      } catch (e) {
        console.error(`加载照片失败: ${photo.fileName}`, e);
        // 占位符或错误处理
        photoUrls.value.push("");
      }
    }
  } catch (e) {
    console.error("获取文件夹权限失败", e);
  }
};

// 上传文件的核心逻辑
const uploadFiles = async (files: File[]) => {
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    ElMessage.warning("没有找到图片文件");
    return;
  }

  try {
    const dirHandle = await getValidDirectoryHandle();

    if (!dirHandle) {
      ElMessage.warning("请先在主页面选择照片文件夹");
      return;
    }

    const writePermission = await dirHandle.requestPermission({
      mode: "readwrite",
    });
    if (writePermission !== "granted") {
      ElMessage.error("需要文件夹写入权限才能上传图片");
      return;
    }

    const uploadFolder = await ensureDirectory(dirHandle, "上传图片");
    const uploadedPhotos: Photo[] = [];

    for (const file of imageFiles) {
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const ext = file.name.substring(file.name.lastIndexOf("."));
        const newFileName = `upload_${timestamp}_${random}${ext}`;

        await saveFileToDirectory(uploadFolder, file, newFileName);

        const photo: Photo = {
          id: `${timestamp}-${random}`,
          fileName: `上传图片/${newFileName}`,
          folderId: "user-uploaded",
        };

        uploadedPhotos.push(photo);
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
      }
    }

    if (uploadedPhotos.length > 0) {
      editForm.value.photos = [...editForm.value.photos, ...uploadedPhotos];
      await loadPhotos(editForm.value.photos);
      await saveChanges();
      ElMessage.success(`成功上传 ${uploadedPhotos.length} 张照片`);
    }
  } catch (error) {
    console.error("上传失败:", error);
    ElMessage.error("上传失败，请重试");
  }
};

// 处理粘贴事件（在基本信息 tab 时上传照片）
const handlePhotosPaste = async (e: ClipboardEvent) => {
  // 只在基本信息 tab 且不在文件选择对话框时处理
  if (activeTab.value !== "basic" || fileDialogVisible.value) return;

  // 避免在输入框中粘贴时触发
  const target = e.target as HTMLElement;
  if (
    ["INPUT", "TEXTAREA"].includes(target.tagName) ||
    target.isContentEditable
  ) {
    return;
  }

  const items = e.clipboardData?.items;
  if (!items) return;

  const imageFiles: File[] = [];
  for (const item of Array.from(items)) {
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      if (file) imageFiles.push(file);
    }
  }

  if (imageFiles.length > 0) {
    e.preventDefault();
    await uploadFiles(imageFiles);
  }
};

// 删除照片
const deletePhoto = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      "确定要从记录中删除这张照片吗？（文件不会被删除）",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 只从记录中删除，不删除源文件
    editForm.value.photos.splice(index, 1);

    // 重置索引，避免越界
    if (currentPhotoIndex.value >= editForm.value.photos.length) {
      currentPhotoIndex.value = Math.max(0, editForm.value.photos.length - 1);
    }

    await loadPhotos(editForm.value.photos);
    ElMessage.success("照片已从记录中删除");
    await saveChanges();
  } catch {
    // 用户取消
  }
};

// 监听粘贴事件
onMounted(() => {
  document.addEventListener("paste", handlePhotosPaste);
});

onUnmounted(() => {
  document.removeEventListener("paste", handlePhotosPaste);
  window.removeEventListener("paste", handlePaste);
  handleClosed();
});

const loadVideos = async (properties: RoomInfo[]) => {
  if (!properties) return;

  for (const room of properties) {
    if (room.videos) {
      for (const video of room.videos) {
        await getVideoUrl(video.fileName);
      }
    }
  }
};

const handleClosed = () => {
  photoUrls.value.forEach((url) => URL.revokeObjectURL(url));
  photoUrls.value = [];
  if (avatarUrl.value) URL.revokeObjectURL(avatarUrl.value);
  avatarUrl.value = "";
  videoUrls.forEach((url) => URL.revokeObjectURL(url));
  videoUrls.clear();
};

onUnmounted(() => {
  handleClosed();
});

const allPhotoUrls = computed(() => {
  return photoUrls.value.filter((url) => url);
});

const mainPhotoUrl = computed(() => {
  return photoUrls.value[currentPhotoIndex.value] || "";
});

const addPhone = () => {
  editForm.value.phoneNumbers.push("");
};

const removePhone = (index: number) => {
  editForm.value.phoneNumbers.splice(index, 1);
};

const checkDuplicatePhone = async (phone: string, _index: number) => {
  if (!phone || phone.length < 8) return;
  const duplicate = propertyStore.landlords.find(
    (l) => l.id !== editForm.value.id && l.phoneNumbers.includes(phone)
  );

  if (duplicate) {
    ElMessage.warning(
      `该号码已存在于房东 [${duplicate.address || "未知地址"}] 中`
    );
  }
};

const addRoom = () => {
  const newRoom: RoomInfo = {
    id: crypto.randomUUID(),
    roomType: "单间",
    rent: undefined,
    description: "",
    amenities: [],
    videos: [],
    available: true,
  };
  editForm.value.properties.push(newRoom);
};

const removeRoom = (index: number) => {
  editForm.value.properties.splice(index, 1);
};

// 文件选择器逻辑
const openFileSelector = async (
  mode: "avatar" | "video" | "photo",
  roomIndex = -1
) => {
  fileDialogMode.value = mode;
  currentRoomIndex.value = roomIndex;

  // 清理旧的预览 URL
  fileList.value.forEach((item) => {
    if (item.url) URL.revokeObjectURL(item.url);
  });
  fileList.value = [];

  try {
    const dirHandle = await getValidDirectoryHandle();
    if (!dirHandle) {
      ElMessage.warning("请先在左侧授权照片文件夹");
      return;
    }

    let fileNames: string[] = [];
    let targetDirHandle = dirHandle;

    if (mode === "avatar") {
      // 扫描 "微信头像" 目录
      fileNames = await scanSubdirectory(dirHandle, "微信头像", ["image"]);
      try {
        targetDirHandle = await dirHandle.getDirectoryHandle("微信头像");
      } catch {}
    } else if (mode === "video") {
      // 扫描 "视频" 目录
      fileNames = await scanSubdirectory(dirHandle, "视频", ["video"]);
      try {
        targetDirHandle = await dirHandle.getDirectoryHandle("视频");
      } catch {}
    } else {
      // 照片模式：扫描 "上传图片" 目录
      fileNames = await scanSubdirectory(dirHandle, "上传图片", ["image"]);
      try {
        targetDirHandle = await dirHandle.getDirectoryHandle("上传图片");
      } catch {}
    }

    // 生成预览
    const items: FileItem[] = [];
    for (const name of fileNames) {
      try {
        const fileHandle = await targetDirHandle.getFileHandle(name);
        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);
        items.push({
          name,
          url,
          type: mode === "video" ? "video" : "image",
        });
      } catch (e) {
        console.error(`Failed to create preview for ${name}`, e);
        items.push({
          name,
          url: "",
          type: mode === "video" ? "video" : "image",
        });
      }
    }
    fileList.value = items;

    fileDialogVisible.value = true;
  } catch (e) {
    console.error("Failed to scan directory", e);
    ElMessage.error("无法扫描文件夹");
  }
};

const saveFile = async (file: File) => {
  const dirHandle = await getValidDirectoryHandle();
  if (!dirHandle) return null;

  let targetDirName = "";

  // 验证文件类型
  if (fileDialogMode.value === "avatar") {
    targetDirName = "微信头像";
    if (!file.type.startsWith("image/")) {
      ElMessage.warning(`文件 ${file.name} 不是图片`);
      return null;
    }
  } else if (fileDialogMode.value === "video") {
    targetDirName = "视频";
    if (!file.type.startsWith("video/")) {
      ElMessage.warning(`文件 ${file.name} 不是视频`);
      return null;
    }
  } else {
    // 照片模式
    targetDirName = "上传图片";
    if (!file.type.startsWith("image/")) {
      ElMessage.warning(`文件 ${file.name} 不是图片`);
      return null;
    }
  }

  try {
    let savedName = "";
    // 现在所有模式都有 targetDirName
    const targetDir = await ensureDirectory(dirHandle, targetDirName);
    savedName = await saveFileToDirectory(targetDir, file);
    return savedName;
  } catch (e) {
    console.error("Save file failed", e);
    return null;
  }
};

const handleDrop = async (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  let successCount = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const savedName = await saveFile(file);
    if (savedName) {
      successCount++;
    }
  }

  if (successCount > 0) {
    ElMessage.success(`成功上传 ${successCount} 个文件`);
    // 重新加载列表
    await openFileSelector(fileDialogMode.value, currentRoomIndex.value);
  }
};

const handlePaste = async (e: ClipboardEvent) => {
  if (!fileDialogVisible.value) return;

  // 避免在输入框中粘贴时触发
  const target = e.target as HTMLElement;
  if (
    ["INPUT", "TEXTAREA"].includes(target.tagName) ||
    target.isContentEditable
  ) {
    return;
  }

  const items = e.clipboardData?.items;
  if (!items) return;

  const filesToProcess: File[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) filesToProcess.push(file);
    }
  }

  if (filesToProcess.length === 0) return;

  e.preventDefault();

  let successCount = 0;
  for (const file of filesToProcess) {
    const savedName = await saveFile(file);
    if (savedName) {
      successCount++;
    }
  }

  if (successCount > 0) {
    ElMessage.success(`成功粘贴并上传 ${successCount} 个文件`);
    await openFileSelector(fileDialogMode.value, currentRoomIndex.value);
  }
};

// 监听对话框关闭，清理资源
watch(fileDialogVisible, (val) => {
  if (val) {
    window.addEventListener("paste", handlePaste);
  } else {
    window.removeEventListener("paste", handlePaste);
    fileList.value.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });
    fileList.value = [];
    isDragging.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener("paste", handlePaste);
});

const handleUpload = async () => {
  try {
    const dirHandle = await getValidDirectoryHandle();
    if (!dirHandle) return;

    // 确定目标目录和类型
    let acceptTypes: FilePickerAcceptType[] = [];

    if (fileDialogMode.value === "avatar") {
      acceptTypes = [
        {
          description: "Images",
          accept: { "image/*": [".jpg", ".jpeg", ".png", ".gif"] },
        },
      ];
    } else if (fileDialogMode.value === "video") {
      acceptTypes = [
        {
          description: "Videos",
          accept: { "video/*": [".mp4", ".mov", ".webm"] },
        },
      ];
    } else {
      acceptTypes = [
        {
          description: "Images",
          accept: { "image/*": [".jpg", ".jpeg", ".png", ".gif"] },
        },
      ];
    }

    // 选择文件
    let file: File | null = null;
    if ("showOpenFilePicker" in window) {
      const [fileHandle] = await window.showOpenFilePicker({
        types: acceptTypes,
        multiple: false,
      });
      file = await fileHandle.getFile();
    } else {
      // 降级方案：使用 input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = fileDialogMode.value === "video" ? "video/*" : "image/*";

      await new Promise<void>((resolve) => {
        input.onchange = () => {
          if (input.files && input.files.length > 0) {
            file = input.files[0];
          }
          resolve();
        };
        input.click();
      });
    }

    if (!file) return;

    const savedName = await saveFile(file);
    if (savedName) {
      ElMessage.success(`已上传: ${savedName}`);
      // 重新加载列表
      await openFileSelector(fileDialogMode.value, currentRoomIndex.value);
    }
  } catch (e: any) {
    if (e.name !== "AbortError") {
      console.error("Upload failed", e);
      ElMessage.error("上传失败");
    }
  }
};

const handleFileSelect = (fileItem: FileItem) => {
  const fileName = fileItem.name;
  let finalPath = fileName;

  if (fileDialogMode.value === "avatar") {
    finalPath = `微信头像/${fileName}`;
    editForm.value.avatar = finalPath;
    loadAvatar(finalPath);
  } else if (
    fileDialogMode.value === "video" &&
    currentRoomIndex.value !== -1
  ) {
    finalPath = `视频/${fileName}`;
    const room = editForm.value.properties[currentRoomIndex.value];
    if (!room.videos) room.videos = [];
    room.videos.push({
      id: crypto.randomUUID(),
      fileName: finalPath,
      folderId: "default",
    });
    getVideoUrl(finalPath);
  } else if (fileDialogMode.value === "photo") {
    // 照片模式：上传图片目录
    finalPath = `上传图片/${fileName}`;
    editForm.value.photos.push({
      id: crypto.randomUUID(),
      fileName: finalPath,
      folderId: "default",
    });
    loadPhotos(editForm.value.photos);
  }
  fileDialogVisible.value = false;
};

const getVideoUrl = async (fileName: string) => {
  if (videoUrls.has(fileName)) return videoUrls.get(fileName);

  try {
    const dirHandle = await getValidDirectoryHandle();
    if (!dirHandle) return "";

    let file: File | null = null;
    if (fileName.includes("/") || fileName.includes("\\")) {
      file = await getFileByPath(dirHandle, fileName);
    } else {
      try {
        const fileHandle = await dirHandle.getFileHandle(fileName);
        file = await fileHandle.getFile();
      } catch {
        file = await getFileByPath(dirHandle, `视频/${fileName}`);
      }
    }

    if (file) {
      const url = URL.createObjectURL(file);
      videoUrls.set(fileName, url);
      return url;
    }
    return "";
  } catch (e) {
    console.error("Failed to load video", e);
    return "";
  }
};

const refreshAddress = async () => {
  if (!editForm.value.gps) {
    ElMessage.warning("没有 GPS 信息，无法刷新地址");
    return;
  }

  refreshingAddress.value = true;
  try {
    const address = await getAddressFromGps(editForm.value.gps);
    if (address && address !== "未知地址") {
      editForm.value.address = address;
      ElMessage.success("地址已更新");
    } else {
      ElMessage.warning("未能获取到有效地址");
    }
  } catch (e) {
    console.error("刷新地址失败", e);
    ElMessage.error("刷新地址失败");
  } finally {
    refreshingAddress.value = false;
  }
};

const saveChanges = async () => {
  const validPhones = editForm.value.phoneNumbers.filter((p) => p.trim());

  saving.value = true;
  try {
    const rawData = toRaw(editForm.value);
    const dataToSave = {
      ...rawData,
      photos: toRaw(editForm.value.photos), // 确保 photos 也是原始数据
      phoneNumbers: validPhones,
      updatedAt: new Date().toISOString(),
      isPerfect: true,
    };
    await propertyStore.updateLandlordData(editForm.value.id, dataToSave);
    ElMessage.success("保存成功");
  } catch (error: any) {
    console.error("Save failed:", error);
    ElMessage.error("保存失败: " + (error.message || "未知错误"));
  } finally {
    saving.value = false;
  }
};

const deleteLandlord = async () => {
  if (!landlord.value) return;
  try {
    await propertyStore.removeLandlord(
      landlord.value.id,
      deleteWithImages.value
    );
    ElMessage.success("删除成功");
    deleteDialogVisible.value = false;
    closeDrawer();
  } catch (error) {
    ElMessage.error("删除失败");
    deleteDialogVisible.value = false;
  }
};

const closeDrawer = () => {
  propertyStore.selectLandlord(null);
};

const copyToClipboard = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("复制成功");
  } catch (err) {
    ElMessage.error("复制失败");
  }
};

const toggleFavorite = async () => {
  try {
    await propertyStore.toggleFavorite(editForm.value.id);
    editForm.value.isFavorite = !editForm.value.isFavorite;
    ElMessage.success(editForm.value.isFavorite ? "已收藏" : "已取消收藏");
  } catch (err) {
    ElMessage.error("操作失败");
  }
};

const previewImage = (url: string) => {
  previewImageUrl.value = url;
  // 等待 DOM 更新后触发预览
  setTimeout(() => {
    if (
      hiddenImagePreview.value &&
      typeof hiddenImagePreview.value.showPreview === "function"
    ) {
      hiddenImagePreview.value.showPreview();
    }
  }, 100);
};
</script>
<style>
.el-drawer__header {
  margin: 0;
}
.el-drawer__body {
  padding: 0 20px;
}
</style>
<style scoped>
.landlord-detail {
  padding: 0;
}

.photo-section {
  margin-bottom: 20px;
  background: #f9f9f9;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
}

.photo-thumbnails {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.thumbnail.active {
  border-color: #409eff;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.sub-text {
  font-size: 12px;
  margin-top: 4px;
  color: #909399;
  text-align: center;
}

/* 照片轮播样式 */
.photo-carousel-container {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

/* 照片展示区域 */
.photo-section {
  margin-bottom: 24px;
}

.main-photo-container {
  border-radius: 8px;
  overflow: hidden;
}

.main-photo {
  position: relative;
  width: 100%;
  height: 280px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
}

.photo-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
}

.no-photo-placeholder {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.no-photo-placeholder:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.placeholder-text {
  margin-top: 12px;
  color: #606266;
  font-size: 15px;
  font-weight: 500;
}

.placeholder-hint {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

/* 缩略图列表 */
.thumbnails-container {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-top: 8px;
}

.thumbnail-item {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.thumbnail-item:hover .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-item.active {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
  font-size: 20px;
}

.upload-btn-wrapper {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.upload-btn {
  width: 100%;
  height: 100%;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  color: #909399;
}

.upload-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f9ff;
}

.upload-btn .upload-text {
  font-size: 12px;
  margin-top: 4px;
}

.photo-count {
  text-align: center;
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.phone-item {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.fee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-card {
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-item {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  padding: 8px;
  border-radius: 4px;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: #606266;
}

.video-preview {
  width: 100%;
  max-height: 300px;
  background: #000;
  border-radius: 4px;
}

.video-wrapper {
  width: 100%;
  min-height: 150px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-loading {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.add-room-btn {
  width: 100%;
  height: 40px;
}

.action-buttons {
  /* margin-top: 30px; */
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  gap: 15px;
  position: sticky;
  bottom: 0;
  background: #fff;
  z-index: 10;
}

.location-info {
  flex: 1;
}

.location-info .address {
  font-weight: bold;
  color: #409eff;
}

.location-info .gps-coords {
  font-size: 12px;
  color: #909399;
}

/* Avatar Uploader */
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

/* Room Form Font Size */
.room-form :deep(.el-form-item__label) {
  font-size: 14px;
}

.room-form :deep(.el-input__inner),
.room-form :deep(.el-textarea__inner) {
  font-size: 14px;
}

/* File List Dialog */
.file-list {
  max-height: 400px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 10px;
}

.file-list-scroller {
  height: 400px;
  padding: 10px;
}

.file-row {
  display: grid;
  grid-template-columns: repeat(4, 100px);
  gap: 10px;
  margin-bottom: 10px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 5px;
  cursor: pointer;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  transition: all 0.3s;
}

.file-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.file-preview {
  position: relative;
  width: 100%;
  height: 80px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-eye-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
}

.file-item:hover .preview-eye-icon {
  opacity: 1;
}

.preview-eye-icon:hover {
  background: rgba(0, 0, 0, 0.7);
}

.image-error-small {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.video-placeholder {
  color: #909399;
}

.file-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-content-wrapper {
  position: relative;
  min-height: 300px;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(64, 158, 255, 0.1);
  border: 2px dashed #409eff;
  border-radius: 4px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 10px;
}

.drag-text {
  font-size: 16px;
  color: #409eff;
  font-weight: bold;
}

/* Drawer Layout Fixes */
:deep(.detail-drawer .el-drawer__body) {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.landlord-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.landlord-detail :deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.landlord-detail :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  background: #fff;
  z-index: 1;
  flex-shrink: 0;
}

.landlord-detail :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.landlord-detail :deep(.el-tab-pane) {
  height: 100%;
}

.tab-content-wrapper {
  padding: 20px;
}
</style>
