<template>
  <div class="map-wrapper">
    <div id="map-container" ref="mapContainer" class="map-container"></div>

    <!-- 右侧控制按钮组 -->
    <div class="map-controls" id="btn-map-controls">
      <!-- 图例按钮 -->
      <el-tooltip placement="left-end" raw-content>
        <template #content>
          <div class="legend-content">
            <div class="legend-section-title">房东类型</div>
            <div class="legend-item">
              <span class="dot green"></span> 一手房东
            </div>
            <div class="legend-item">
              <span class="dot yellow"></span> 二手房东
            </div>
            <div class="legend-item"><span class="dot red"></span> 中介</div>
            <div class="legend-item"><span class="dot gray"></span> 其他</div>
            <div class="legend-divider"></div>
            <div class="legend-section-title">联系状态</div>
            <div class="legend-item">
              <span class="dot bright"></span> 已联系（大且亮）
            </div>
            <div class="legend-item">
              <span class="dot dark"></span> 未联系（小且暗）
            </div>
            <div class="legend-divider"></div>
            <div class="legend-section-title">特殊标记</div>
            <div class="legend-item">
              <span class="dot star">⭐</span> 收藏（金边）
            </div>
            <div class="legend-item">
              <span class="dot square"></span> 疑似二房东
            </div>
            <div class="legend-item">
              <span class="dot square highlighted"></span> 重复电话
            </div>
            <div class="legend-divider"></div>
            <div class="legend-tip">💡 右键地图创建房东</div>
            <div class="legend-tip">📍 右键房东调整位置（ESC取消）</div>
          </div>
        </template>
        <div class="control-button">
          <el-icon :size="18">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M11 18h2v-2h-2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5c0-2.21-1.79-4-4-4"
              />
            </svg>
          </el-icon>
        </div>
      </el-tooltip>

      <!-- 定位按钮 -->
      <el-tooltip content="定位至当前位置" placement="left">
        <div class="control-button" @click="locateUser">
          <el-icon :size="20" :class="{ 'is-loading': isLocating }">
            <Location />
          </el-icon>
        </div>
      </el-tooltip>

      <!-- 圈选工具按钮 -->
      <el-tooltip content="在地图上框选区域筛选房源/房东" placement="left">
        <div
          class="control-button"
          :class="{ active: isDrawing }"
          @click="toggleDrawMode"
        >
          <el-icon :size="20">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="currentColor"
                d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640V512z"
              />
              <path
                fill="currentColor"
                d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088l-105.6 15.104a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
              />
            </svg>
          </el-icon>
        </div>
      </el-tooltip>

      <!-- 切换区域可见性按钮 -->
      <el-tooltip
        v-if="propertyStore.selectedArea"
        :content="isPolygonVisible ? '隐藏圈选区域' : '显示圈选区域'"
        placement="left"
      >
        <div
          class="control-button"
          :class="{ active: isPolygonVisible }"
          @click="togglePolygonVisibility"
        >
          <el-icon :size="20">
            <svg
              v-if="isPolygonVisible"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                d="M12 19c.946 0 1.81-.103 2.598-.281l-1.757-1.757c-.273.021-.55.038-.841.038c-5.351 0-7.424-3.846-7.926-5a8.6 8.6 0 0 1 1.508-2.297L4.184 8.305c-1.538 1.667-2.121 3.346-2.132 3.379a1 1 0 0 0 0 .633C2.073 12.383 4.367 19 12 19m0-14c-1.837 0-3.346.396-4.604.981L3.707 2.293L2.293 3.707l18 18l1.414-1.414l-3.319-3.319c2.614-1.951 3.547-4.615 3.561-4.657a1 1 0 0 0 0-.633C21.927 11.617 19.633 5 12 5m4.972 10.558l-2.28-2.28c.19-.39.308-.819.308-1.278c0-1.641-1.359-3-3-3c-.459 0-.888.118-1.277.309L8.915 7.501A9.3 9.3 0 0 1 12 7c5.351 0 7.424 3.846 7.926 5c-.302.692-1.166 2.342-2.954 3.558"
              />
            </svg>
            <svg v-else viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="currentColor"
                d="M.2 10a11 11 0 0 1 19.6 0A11 11 0 0 1 .2 10m9.8 4a4 4 0 1 0 0-8a4 4 0 0 0 0 8m0-2a2 2 0 1 1 0-4a2 2 0 0 1 0 4"
              />
            </svg>
          </el-icon>
        </div>
      </el-tooltip>

      <!-- 清除圈选区域按钮 -->
      <el-tooltip
        v-if="propertyStore.selectedArea"
        content="清除圈选区域"
        placement="left"
      >
        <div class="control-button clear" @click="clearDrawing">
          <el-icon :size="20">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="currentColor"
                d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336L512 457.664z"
              />
            </svg>
          </el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, h, render, toRaw } from "vue";
import {
  ElImage,
  ElButton,
  ElMessage,
  ElIcon,
  ElMessageBox,
} from "element-plus";
import { CopyDocument, Location } from "@element-plus/icons-vue";
import { loadAMap, getAddressFromGps } from "@/utils/geocode";
import { usePropertyStore } from "@/stores/property";
import { LandlordType, ContactStatus } from "@/types";
import type { Landlord, PropertyViewItem, ViewMode } from "@/types";
import { getValidDirectoryHandle, getFileByPath } from "@/utils/fileSystem";

// 接收 props
const props = withDefaults(
  defineProps<{
    viewMode?: ViewMode;
    properties?: PropertyViewItem[];
  }>(),
  {
    viewMode: "landlord",
    properties: () => [],
  }
);

const propertyStore = usePropertyStore();
const mapContainer = ref<HTMLDivElement>();

let map: any = null;
let markers: Map<string, any> = new Map();
let propertyMarkers: Map<string, any> = new Map(); // 房源标记
let currentInfoWinImage: string | null = null;
let highlightedPhones = ref<Set<string>>(new Set()); // 当前高亮的手机号集合
let currentInfoWindow: any = null; // 当前打开的 InfoWindow
const isLocating = ref(false); // 定位中状态
let userLocationMarker: any = null; // 用户位置标记

// 地图圈选相关
const isDrawing = ref(false); // 是否正在绘制
const isPolygonVisible = ref(true); // 圈选区域是否可见
let mouseTool: any = null; // 高德地图鼠标绘制工具
let drawnPolygon: any = null; // 绘制的多边形对象

// 判断房东是否为疑似二房东（电话出现3次及以上）
function isSuspectedSecondHand(landlord: Landlord): boolean {
  if (!landlord.phoneNumbers || landlord.phoneNumbers.length === 0)
    return false;

  // 使用store中缓存的phoneCounts，避免重复遍历
  const counts = propertyStore.phoneCounts;

  // 只要有一个电话号码出现次数 >= 3，就认为是疑似二房东
  return landlord.phoneNumbers.some(
    ([phoneNumber]) => (counts.get(phoneNumber) || 0) >= 3
  );
}

onMounted(async () => {
  await initMap();
  await renderMarkers();
  if (map && markers.size > 0) {
    map.setFitView();
  }
});

onUnmounted(() => {
  if (currentInfoWinImage) {
    URL.revokeObjectURL(currentInfoWinImage);
  }
});

// 使用防抖优化marker渲染
let renderMarkersTimer: ReturnType<typeof setTimeout> | null = null;

const debouncedRenderMarkers = () => {
  if (renderMarkersTimer) {
    clearTimeout(renderMarkersTimer);
  }
  renderMarkersTimer = setTimeout(() => {
    renderMarkers();
  }, 100); // 100ms防抖
};

// 监听筛选后的房东列表变化（不使用deep，只监听数组本身的变化）
watch(
  () => propertyStore.filteredLandlords,
  (newList, oldList) => {
    if (props.viewMode !== "landlord") return;

    // 如果数组长度没变，检查ID是否有变化
    if (newList.length === oldList?.length) {
      const newIds = new Set(newList.map((l) => l.id));
      const oldIds = new Set(oldList?.map((l) => l.id) || []);

      // ID完全相同，不需要重新渲染
      if (
        newIds.size === oldIds.size &&
        [...newIds].every((id) => oldIds.has(id))
      ) {
        return;
      }
    }

    debouncedRenderMarkers();
  }
);

// 监听视图模式变化
watch(
  () => props.viewMode,
  (newMode) => {
    if (!map) return;

    // 关闭当前打开的 InfoWindow
    if (currentInfoWindow) {
      currentInfoWindow.close();
      currentInfoWindow = null;
    }

    if (newMode === "landlord") {
      clearPropertyMarkers();
      renderMarkers();
    } else if (newMode === "property") {
      clearLandlordMarkers();
      renderPropertyMarkers();
    }
  }
);

// 房源marker渲染防抖
let renderPropertyMarkersTimer: ReturnType<typeof setTimeout> | null = null;

const debouncedRenderPropertyMarkers = () => {
  if (renderPropertyMarkersTimer) {
    clearTimeout(renderPropertyMarkersTimer);
  }
  renderPropertyMarkersTimer = setTimeout(() => {
    renderPropertyMarkers();
  }, 100);
};

// 监听房源数据变化（不使用deep）
watch(
  () => props.properties,
  (newList, oldList) => {
    if (props.viewMode !== "property") return;

    // 简单比较数组长度，避免深度比较
    if (newList.length === oldList?.length) {
      return;
    }

    debouncedRenderPropertyMarkers();
  }
);

// 定位用户当前位置（使用高德地图定位）
const locateUser = async () => {
  if (!map) {
    ElMessage.warning("地图未初始化");
    return;
  }

  if (isLocating.value) return;

  isLocating.value = true;

  try {
    const AMap = await loadAMap();

    // 使用高德地图的 Geolocation 插件
    AMap.plugin(["AMap.Geolocation"], () => {
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true, // 是否使用高精度定位，默认：true
        timeout: 10000, // 超过10秒后停止定位，默认：5s
        position: "RB", // 定位按钮的停靠位置（右下角）
        offset: [10, 20], // 定位按钮与设置的停靠位置的偏移量
        zoomToAccuracy: true, // 定位成功后是否自动调整地图视野到定位点
        showCircle: true, // 定位成功后是否显示精度圈
        showMarker: true, // 定位成功后是否显示定位点
        showButton: false, // 是否显示定位按钮（我们自己有按钮）
        markerOptions: {
          // 自定义定位点样式
          offset: new AMap.Pixel(-18, -36),
          content: `
            <div style="position: relative;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                <circle cx="12" cy="12" r="10" fill="#409eff" opacity="0.3"/>
                <circle cx="12" cy="12" r="5" fill="#409eff"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            </div>
          `,
        },
        circleOptions: {
          // 精度圈样式
          strokeColor: "#409EFF",
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: "#409EFF",
          fillOpacity: 0.15,
        },
      });

      // 执行定位
      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === "complete") {
          // 定位成功
          const { accuracy } = result;

          ElMessage.success(`定位成功！精度：${Math.round(accuracy)}米`);

          // 保存用户位置标记的引用（高德自动创建的）
          userLocationMarker = result.marker;

          isLocating.value = false;
        } else {
          // 定位失败
          console.error("定位失败:", result);

          let errorMsg = "定位失败";
          if (result.message) {
            errorMsg = result.message;
          }

          // 如果高德定位失败，尝试使用浏览器原生定位作为降级方案
          if (navigator.geolocation) {
            ElMessage.warning("高德定位失败，尝试使用浏览器定位...");

            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { longitude, latitude } = position.coords;
                const userPos = [longitude, latitude];

                // 移除旧的用户位置标记
                if (userLocationMarker) {
                  map.remove(userLocationMarker);
                }

                // 创建用户位置标记
                userLocationMarker = new AMap.Marker({
                  position: userPos,
                  content: `
                    <div style="position: relative;">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                        <circle cx="12" cy="12" r="10" fill="#409eff" opacity="0.3"/>
                        <circle cx="12" cy="12" r="5" fill="#409eff"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    </div>
                  `,
                  offset: new AMap.Pixel(-18, -36),
                  zIndex: 1000,
                  title: "我的位置（浏览器定位）",
                });

                map.add(userLocationMarker);
                map.setZoomAndCenter(15, userPos);

                ElMessage.success("浏览器定位成功");
                isLocating.value = false;
              },
              (error) => {
                console.error("浏览器定位也失败:", error);
                ElMessage.error(errorMsg);
                isLocating.value = false;
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            );
          } else {
            ElMessage.error(errorMsg);
            isLocating.value = false;
          }
        }
      });
    });
  } catch (error) {
    console.error("定位出错:", error);
    ElMessage.error("定位出错");
    isLocating.value = false;
  }
};

async function initMap() {
  try {
    const AMap = await loadAMap();

    map = new AMap.Map(mapContainer.value, {
      zoom: 13,
      center: [113.38061599999992, 23.160803000000005], // 广州市中心
      viewMode: "3D",
      pitch: 0,
    });

    // 添加地图控件
    map.addControl(new AMap.Scale());
    map.addControl(new AMap.ToolBar());

    // 点击地图空白处，清除选中状态和高亮
    map.on("click", () => {
      propertyStore.setFocusedLandlord(null);
      clearHighlight();
    });

    // 创建右键菜单
    const contextMenu = new AMap.ContextMenu();

    // 添加"创建房东"菜单项
    contextMenu.addItem(
      "📍 在此位置创建房东",
      async () => {
        const position = contextMenu.getPosition();
        if (position) {
          try {
            // 如果当前不是房东视图，切换到房东视图
            if (props.viewMode !== "landlord") {
              propertyStore.setViewMode("landlord");
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            await createLandlordAtLocation({
              lng: position.lng,
              lat: position.lat,
            });
            contextMenu.close();
          } catch (error) {
            console.error("创建房东失败:", error);
            ElMessage.error("创建房东失败");
          }
        }
      },
      0
    );

    // 地图右键事件 - 显示创建房东菜单
    map.on("rightclick", (e: any) => {
      contextMenu.open(map, e.lnglat);
    });
  } catch (error) {
    console.error("地图初始化失败:", error);
  }
}

async function renderMarkers() {
  if (!map) return;

  const AMap = await loadAMap();
  const landlords = propertyStore.filteredLandlords;

  // 筛选有GPS的房东
  const validLandlords = landlords.filter((l) => l.gps);
  const validIds = new Set(validLandlords.map((l) => l.id));

  // 1. 移除不再列表中的标记
  for (const [id, marker] of markers.entries()) {
    if (!validIds.has(id)) {
      map.remove(marker);
      markers.delete(id);
    }
  }

  if (validLandlords.length === 0) return;

  // 2. 更新或创建标记
  validLandlords.forEach((landlord) => {
    if (!landlord.gps) return;

    // 设置标记样式
    const style = getMarkerStyle(landlord);
    const content = createMarkerContent(style);
    const position = [landlord.gps.lng, landlord.gps.lat];
    const title =
      landlord.wechatNickname || landlord.phoneNumbers[0]?.[0] || "待完善";

    if (markers.has(landlord.id)) {
      // 更新现有标记
      const marker = markers.get(landlord.id);
      marker.setPosition(position);
      marker.setContent(content);
      marker.setTitle(title);
      marker.setExtData({ landlordId: landlord.id });
      marker.setOffset(new AMap.Pixel(-9 * style.scale, -9 * style.scale)); // 更新offset以保持居中
      // 确保 zIndex 正确，已联系的在上面
      marker.setzIndex(style.zIndex);
    } else {
      // 创建新标记
      const marker = new AMap.Marker({
        position: position,
        title: title,
        content: content,
        offset: new AMap.Pixel(-9 * style.scale, -9 * style.scale), // 根据缩放动态调整中心对齐
        extData: { landlordId: landlord.id },
        zIndex: style.zIndex,
      });

      // 点击事件 - 获取最新数据并高亮相同手机号的marker
      marker.on("click", () => {
        const current = propertyStore.landlords.find(
          (l) => l.id === landlord.id
        );
        if (current) {
          // 只有在侧边栏未折叠时才执行聚焦操作（性能优化）
          if (!propertyStore.isSidebarCollapsed) {
            propertyStore.setFocusedLandlord(current.id);
          }
          highlightMarkersWithSamePhone(current);
          showInfoWindow(marker, current);
        }
      });

      // 创建标记的右键菜单
      const markerContextMenu = createMarkerContextMenu(landlord.id);
      marker.on("rightclick", (e: any) => {
        markerContextMenu.open(map, e.lnglat);
      });

      map.add(marker);
      markers.set(landlord.id, marker);
    }
  });
}

// 创建标记的右键菜单
function createMarkerContextMenu(landlordId: string) {
  const AMap = (window as any).AMap;
  const contextMenu = new AMap.ContextMenu();

  // 调整位置
  contextMenu.addItem(
    "📍 调整位置",
    () => {
      const marker = markers.get(landlordId);
      if (marker) {
        enableMarkerDrag(marker, landlordId);
        contextMenu.close();
      }
    },
    0
  );

  contextMenu.addItem(
    "🗑️ 删除此房东",
    async () => {
      try {
        await ElMessageBox.confirm("确定要删除这个房东吗？", "确认删除", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        await propertyStore.removeLandlord(landlordId, false);
        currentInfoWindow?.close();
        ElMessage.success("房东已删除");
        await renderMarkers();
        contextMenu.close();
      } catch (error: any) {
        if (error !== "cancel") {
          ElMessage.error("删除失败");
        }
      }
    },
    1
  );

  contextMenu.addItem(
    "📋 查看详情",
    () => {
      const landlord = propertyStore.landlords.find((l) => l.id === landlordId);
      if (landlord) {
        propertyStore.selectLandlord(landlord);
        contextMenu.close();
      }
    },
    2
  );

  return contextMenu;
}

// 启用marker拖拽
function enableMarkerDrag(marker: any, landlordId: string) {
  // 保存原始内容和右键菜单
  const originalContent = marker.getContent();

  // 设置marker可拖拽
  marker.setDraggable(true);

  // 改变marker图标为移动图标
  const dragIcon = `
    <div style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #409eff;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
      cursor: move;
      animation: pulse 1.5s ease-in-out infinite;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
      </svg>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `;
  marker.setContent(dragIcon);
  marker.setOffset(new (window as any).AMap.Pixel(-16, -16)); // 居中对齐

  ElMessage.info({
    message: "拖拽模式已开启，拖动marker到目标位置后松开鼠标（按ESC取消）",
    duration: 3000,
  });

  // 恢复marker样式的函数
  const restoreMarker = () => {
    marker.setDraggable(false);
    marker.setContent(originalContent);
    const landlord = propertyStore.landlords.find((l) => l.id === landlordId);
    if (landlord) {
      const style = getMarkerStyle(landlord);
      marker.setOffset(
        new (window as any).AMap.Pixel(-9 * style.scale, -9 * style.scale)
      );
    }
  };

  // ESC键取消拖拽
  const handleEscKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      restoreMarker();
      marker.off("dragend", dragEndHandler);
      document.removeEventListener("keydown", handleEscKey);
      ElMessage.info("已取消调整位置");
    }
  };
  document.addEventListener("keydown", handleEscKey);

  // 监听拖拽结束事件
  const dragEndHandler = async (e: any) => {
    const newPosition = e.lnglat;

    // 移除ESC键监听
    document.removeEventListener("keydown", handleEscKey);

    try {
      // 获取房东数据
      const landlord = propertyStore.landlords.find((l) => l.id === landlordId);
      if (landlord) {
        // 根据新GPS坐标获取地址
        let newAddress = landlord.address || "";
        try {
          newAddress = await getAddressFromGps({
            lng: newPosition.lng,
            lat: newPosition.lat,
          });
        } catch (error) {
          console.warn("获取地址失败，将保留原地址:", error);
        }

        // 使用toRaw获取原始数据，然后创建新对象（参照PropertyDetail的保存逻辑）
        const rawData = toRaw(landlord);
        const dataToSave = {
          ...rawData,
          gps: {
            lng: newPosition.lng,
            lat: newPosition.lat,
          },
          address: newAddress, // 更新地址
          photos: toRaw(landlord.photos), // 确保photos也是原始数据
          updatedAt: new Date().toISOString(),
        };

        // 保存到数据库
        await propertyStore.updateLandlordData(landlordId, dataToSave);

        ElMessage.success(
          `位置已更新${newAddress ? `\n地址: ${newAddress}` : ""}`
        );
      }
    } catch (error) {
      console.error("更新位置失败:", error);
      ElMessage.error("更新位置失败");
    } finally {
      // 恢复marker样式
      restoreMarker();
      // 移除事件监听
      marker.off("dragend", dragEndHandler);
    }
  };

  marker.on("dragend", dragEndHandler);
}

// 高亮具有相同手机号的marker
function highlightMarkersWithSamePhone(landlord: Landlord) {
  if (!landlord.phoneNumbers || landlord.phoneNumbers.length === 0) {
    clearHighlight();
    return;
  }

  const oldPhones = new Set(highlightedPhones.value);
  const newPhones = new Set(landlord.phoneNumbers.map(([phone]) => phone));

  // 设置新的高亮手机号
  highlightedPhones.value = newPhones;

  // 只更新受影响的marker(之前高亮或现在高亮的)
  markers.forEach((marker, id) => {
    const l = propertyStore.landlords.find((x) => x.id === id);
    if (!l || !l.gps) return;

    const wasHighlighted =
      l.phoneNumbers?.some(([p]) => oldPhones.has(p)) || false;
    const isHighlighted =
      l.phoneNumbers?.some(([p]) => newPhones.has(p)) || false;

    // 只有状态改变的marker才需要更新
    if (wasHighlighted !== isHighlighted) {
      updateSingleMarker(marker, l);
    }
  });
}

// 清除高亮
function clearHighlight() {
  const oldPhones = new Set(highlightedPhones.value);
  highlightedPhones.value = new Set();

  // 只更新之前高亮的marker
  if (oldPhones.size > 0) {
    markers.forEach((marker, id) => {
      const l = propertyStore.landlords.find((x) => x.id === id);
      if (!l || !l.gps) return;

      const wasHighlighted =
        l.phoneNumbers?.some(([p]) => oldPhones.has(p)) || false;
      if (wasHighlighted) {
        updateSingleMarker(marker, l);
      }
    });
  }
}

// 更新单个marker的样式
function updateSingleMarker(marker: any, landlord: Landlord) {
  const style = getMarkerStyle(landlord);
  const content = createMarkerContent(style);

  marker.setContent(content);
  marker.setOffset(
    new (window as any).AMap.Pixel(-9 * style.scale, -9 * style.scale)
  );
  marker.setzIndex(style.zIndex);
}

// 判断房东是否应该被高亮
function shouldHighlight(landlord: Landlord): boolean {
  if (highlightedPhones.value.size === 0) return false;
  if (!landlord.phoneNumbers || landlord.phoneNumbers.length === 0)
    return false;

  return landlord.phoneNumbers.some(([phone]) =>
    highlightedPhones.value.has(phone)
  );
}

function getMarkerStyle(landlord: Landlord) {
  // 颜色定义 - 使用更鲜艳的颜色以提高辨识度
  const COLORS = {
    [LandlordType.FirstHand]: "#52c41a", // 鲜艳的绿色（一手房东）
    [LandlordType.SecondHand]: "#faad14", // 鲜艳的橙色（二手房东）
    [LandlordType.Agent]: "#f5222d", // 鲜艳的红色（中介）
    [LandlordType.Other]: "#8c8c8c", // 深灰色（其他）
  };

  // 获取基础颜色
  let baseColor = COLORS[landlord.landlordType] || COLORS[LandlordType.Other];

  // 根据联系状态调整样式
  const isContacted = landlord.contactStatus === ContactStatus.Contacted;
  const isFavorite = landlord.isFavorite;
  const isSuspected = isSuspectedSecondHand(landlord);
  const isHighlighted = shouldHighlight(landlord); // 是否被高亮

  // 样式配置
  return {
    color: baseColor,
    opacity: isHighlighted ? 1.0 : isContacted ? 1.0 : 0.5, // 高亮和已联系都是100%透明度
    borderColor: isHighlighted
      ? "#FF4444" // 高亮：红色边框
      : isFavorite
      ? "#faad14" // 收藏：金色边框
      : "#FFFFFF", // 默认：白色边框
    borderWidth:
      isFavorite || isHighlighted
        ? "4px" // 收藏/高亮：粗边框
        : isContacted
        ? "2px" // 已联系：中等边框
        : "1px", // 未联系：细边框
    scale: isFavorite
      ? 1.2 // 收藏：最大
      : isContacted
      ? 1.1 // 已联系：较大
      : 1.0, // 未联系：正常
    zIndex: isHighlighted ? 9999 : isFavorite ? 200 : isContacted ? 100 : 10, // 高亮标记使用超高层级
    isFavorite,
    isSuspected,
    isHighlighted,
  };
}

function createMarkerContent(style: {
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: string;
  scale: number;
  isFavorite?: boolean;
  isSuspected?: boolean;
  isHighlighted?: boolean;
}) {
  const {
    color,
    opacity,
    borderColor,
    borderWidth,
    scale,
    isFavorite,
    isSuspected,
    isHighlighted,
  } = style;
  const size = 18 * scale;

  // 添加呼吸动画类名
  const animationClass = isHighlighted ? "marker-breathing" : "";

  // 如果是收藏，显示星星图标
  if (isFavorite) {
    return `
      <div class="${animationClass}" style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;
      ">
        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <path d="M512 73.143l158.286 320.571 353.714 51.429-256 249.714 60.571 352.571L512 880.571l-316.571 166.857 60.571-352.571-256-249.714 353.714-51.429z" fill="${color}" stroke="${borderColor}" stroke-width="50" />
        </svg>
      </div>
    `;
  }

  // 如果是疑似二房东,使用方形标识
  if (isSuspected) {
    return `
      <div class="${animationClass}" style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        opacity: ${opacity};
        border: ${borderWidth} solid ${borderColor};
        border-radius: 3px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s;
      "></div>
    `;
  }

  return `
    <div class="${animationClass}" style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      opacity: ${opacity};
      border: ${borderWidth} solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.3s;
    "></div>
  `;
}

async function showInfoWindow(marker: any, landlord: Landlord) {
  const AMap = await loadAMap();

  // 清理旧图片
  if (currentInfoWinImage) {
    URL.revokeObjectURL(currentInfoWinImage);
    currentInfoWinImage = null;
  }

  // 尝试加载图片
  let imageUrl = "";
  if (landlord.photos && landlord.photos.length > 0) {
    try {
      const dirHandle = await getValidDirectoryHandle();
      if (dirHandle) {
        // 使用 getFileByPath 处理可能包含路径的文件名
        const file = await getFileByPath(
          dirHandle,
          landlord.photos[0].fileName
        );
        if (file) {
          imageUrl = URL.createObjectURL(file);
          currentInfoWinImage = imageUrl;
        }
      }
    } catch (e) {
      console.error("加载房东图片失败", e);
    }
  }

  // 创建容器
  const container = document.createElement("div");

  // 构建 VNode
  const vnode = h("div", { style: { padding: "12px", minWidth: "220px" } }, [
    // 图片
    imageUrl
      ? h(ElImage, {
          src: imageUrl,
          previewSrcList: [imageUrl],
          fit: "cover",
          lazy: true,
          style: {
            width: "100%",
            height: "150px",
            borderRadius: "4px",
            marginBottom: "10px",
            display: "block",
          },
          previewTeleported: true,
          hideOnClickModal: true,
        })
      : null,

    // 标题
    h(
      "h3",
      { style: { margin: "0 0 10px 0", fontSize: "16px" } },
      landlord.wechatNickname || "待完善房东"
    ),

    // 信息列表
    h("div", { style: { fontSize: "14px", lineHeight: "1.8" } }, [
      // 电话
      h("div", { style: { display: "flex", alignItems: "flex-start" } }, [
        h("strong", "电话: "),
        h(
          "div",
          { style: { marginLeft: "4px", flex: 1 } },
          landlord.phoneNumbers && landlord.phoneNumbers.length > 0
            ? landlord.phoneNumbers.map(([phoneNumber, location]) =>
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "4px",
                      flexWrap: "wrap",
                    },
                  },
                  [
                    h("span", phoneNumber),
                    h(
                      ElIcon,
                      {
                        style: {
                          marginLeft: "4px",
                          cursor: "pointer",
                          color: "#409EFF",
                        },
                        onClick: () => copyText(phoneNumber),
                        title: "复制",
                      },
                      () => h(CopyDocument)
                    ),
                    // 归属地信息
                    location
                      ? h(
                          "span",
                          {
                            style: {
                              marginLeft: "6px",
                              fontSize: "12px",
                              color: "#909399",
                              background: "#f4f4f5",
                              padding: "1px 6px",
                              borderRadius: "3px",
                            },
                          },
                          location
                        )
                      : null,
                  ]
                )
              )
            : "未填写"
        ),
      ]),
      // 地址
      h("div", { style: { margin: "4px 0" } }, [
        h("strong", { style: { verticalAlign: "top" } }, "地址: "),
        h(
          "span",
          { style: { maxWidth: "300px", display: "inline-block" } },
          landlord.address || "未知"
        ),
      ]),
      // 房源数
      h("p", { style: { margin: "4px 0" } }, [
        h("strong", "房源数: "),
        h("span", landlord.properties.length),
      ]),
      // 类型
      h("p", { style: { margin: "4px 0" } }, [
        h("strong", "类型: "),
        h("span", translateLandlordType(landlord.landlordType)),
      ]),
    ]),

    // 按钮
    h(
      "div",
      {
        style: {
          marginTop: "10px",
          display: "flex",
          gap: "8px",
          justifyContent: "center",
        },
      },
      [
        h(
          ElButton,
          {
            type: landlord.isFavorite ? "warning" : "default",
            size: "small",
            onClick: async () => {
              await propertyStore.toggleLandlordFavorite(landlord.id);
              // 重新渲染 InfoWindow 以更新按钮状态
              const updatedLandlord = propertyStore.landlords.find(
                (l) => l.id === landlord.id
              );
              if (updatedLandlord) {
                await showInfoWindow(marker, updatedLandlord);
              }
              ElMessage.success(landlord.isFavorite ? "已取消收藏" : "已收藏");
            },
          },
          () => (landlord.isFavorite ? "⭐ 取消收藏" : "☆ 收藏")
        ),
        h(
          ElButton,
          {
            type: "primary",
            size: "small",
            onClick: () => {
              // 每次点击时从 store 获取最新数据
              const latestLandlord = propertyStore.landlords.find(
                (l) => l.id === landlord.id
              );
              if (latestLandlord) {
                propertyStore.selectLandlord(latestLandlord);
              }
            },
          },
          () => "查看详情"
        ),
      ]
    ),
  ]);

  // 渲染
  render(vnode, container);

  // 关闭之前的 InfoWindow
  if (currentInfoWindow) {
    currentInfoWindow.close();
  }

  const infoWindow = new AMap.InfoWindow({
    isCustom: false, // 使用默认样式，包含关闭按钮和小箭头
    content: container,
    offset: new AMap.Pixel(0, -10),
    closeWhenClickMap: true,
  });

  // 监听关闭，清理 Vue 实例
  infoWindow.on("close", () => {
    render(null, container);
    if (currentInfoWindow === infoWindow) {
      currentInfoWindow = null;
    }
  });

  infoWindow.open(map, marker.getPosition());
  currentInfoWindow = infoWindow;
}

async function createLandlordAtLocation(gps: { lng: number; lat: number }) {
  try {
    // 提示用户输入微信昵称
    const { value: wechatNickname } = await ElMessageBox.prompt(
      "在此位置创建新房东，请输入微信昵称（可选）",
      "创建房东",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        inputPlaceholder: "例如：张三",
      }
    );

    // 创建房东
    const newLandlord = await propertyStore.createLandlord({
      photos: [],
      gps: gps,
      folderId: "manual-create", // 手动创建的标记
    });

    // 如果用户输入了微信昵称，更新房东信息
    if (wechatNickname && wechatNickname.trim()) {
      await propertyStore.updateLandlordData(newLandlord.id, {
        wechatNickname: wechatNickname.trim(),
      });
    }

    ElMessage.success("房东创建成功，可在列表中查看并完善信息");

    // 刷新地图标记
    await renderMarkers();

    // 选中新创建的房东（重新从store获取最新数据）
    const updatedLandlord = propertyStore.landlords.find(
      (l) => l.id === newLandlord.id
    );
    if (updatedLandlord) {
      propertyStore.selectLandlord(updatedLandlord);
    }
  } catch (error: any) {
    if (error !== "cancel") {
      throw error;
    }
  }
}

function translateLandlordType(type: LandlordType): string {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: "一手房东",
    [LandlordType.SecondHand]: "二手房东",
    [LandlordType.Agent]: "中介",
    [LandlordType.Other]: "其他",
  };
  return map[type] || "未知";
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("复制成功");
  } catch (err) {
    ElMessage.error("复制失败");
  }
};

const focusLandlord = (landlord: Landlord) => {
  if (!map || !landlord.gps) return;

  // Pan to location
  map.setZoomAndCenter(17, [landlord.gps.lng, landlord.gps.lat]);

  // 高亮相同手机号的marker
  highlightMarkersWithSamePhone(landlord);

  // Find marker
  const marker = markers.get(landlord.id);
  if (marker) {
    showInfoWindow(marker, landlord);
  }
};

// ========== 地图圈选相关函数 ==========

// 初始化鼠标绘制工具
async function initMouseTool() {
  if (!map || mouseTool) return;

  const AMap = await loadAMap();

  // 加载 MouseTool 插件
  return new Promise<void>((resolve, reject) => {
    AMap.plugin(["AMap.MouseTool"], () => {
      try {
        // 创建鼠标绘制工具
        mouseTool = new AMap.MouseTool(map);

        // 监听绘制完成事件
        mouseTool.on("draw", (e: any) => {
          const polygon = e.obj;
          drawnPolygon = polygon;

          // 获取多边形的路径
          const path = polygon.getPath();
          const coordinates = path.map((point: any) => ({
            lng: point.lng,
            lat: point.lat,
          }));

          // 保存到 Store
          propertyStore.setSelectedArea(coordinates);

          // 关闭绘制模式
          isDrawing.value = false;
          mouseTool.close(false); // 保留绘制的图形

          // 设置多边形样式
          polygon.setOptions({
            strokeColor: "#409EFF",
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: "#409EFF",
            fillOpacity: 0.2,
            clickable: false, // 禁用点击,让点击事件穿透到地图
            bubble: true, // 允许事件冒泡
          });

          ElMessage.success(
            `已圈选区域，筛选到 ${
              props.viewMode === "landlord"
                ? propertyStore.filteredLandlords.length
                : propertyStore.filteredProperties.length
            } 条数据`
          );
        });

        resolve();
      } catch (error) {
        console.error("初始化 MouseTool 失败:", error);
        reject(error);
      }
    });
  });
}

// 切换绘制模式
async function toggleDrawMode() {
  if (!map) {
    ElMessage.warning("地图未初始化");
    return;
  }

  // 初始化鼠标工具
  if (!mouseTool) {
    await initMouseTool();
  }

  if (isDrawing.value) {
    // 关闭绘制模式
    isDrawing.value = false;
    mouseTool.close(true);
  } else {
    // 如果已有圈选区域，提示用户
    if (propertyStore.selectedArea) {
      ElMessage.warning("已有圈选区域，请先清除后再绘制新区域");
      return;
    }

    // 开启绘制模式
    isDrawing.value = true;
    mouseTool.polygon({
      strokeColor: "#409EFF",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#409EFF",
      fillOpacity: 0.2,
    });
    ElMessage.info({
      message: "请在地图上绘制圈选区域，点击起点/双击完成绘制",
      duration: 4000,
    });
  }
}

// 清除圈选区域
async function clearDrawing() {
  // 清除绘制的多边形
  if (drawnPolygon && map) {
    map.remove(drawnPolygon);
    drawnPolygon = null;
  }

  // 清除 Store 中的数据
  propertyStore.clearSelectedArea();

  // 关闭绘制模式
  if (mouseTool) {
    mouseTool.close(true);
  }
  isDrawing.value = false;
  isPolygonVisible.value = true; // 重置可见状态

  ElMessage.success("已清除圈选区域");
}

// 切换圈选区域的显示/隐藏
function togglePolygonVisibility() {
  if (!drawnPolygon || !map) return;

  if (isPolygonVisible.value) {
    // 隐藏多边形
    map.remove(drawnPolygon);
    isPolygonVisible.value = false;
    ElMessage.warning("已隐藏圈选区域");
  } else {
    // 显示多边形
    map.add(drawnPolygon);
    isPolygonVisible.value = true;
    ElMessage.success("已显示圈选区域");
  }
}

// ========== 房源视图相关函数 ==========

// 清空房东标记
function clearLandlordMarkers() {
  markers.forEach((marker) => {
    map.remove(marker);
  });
  markers.clear();
}

// 清空房源标记
function clearPropertyMarkers() {
  propertyMarkers.forEach((marker) => {
    map.remove(marker);
  });
  propertyMarkers.clear();
}

// 渲染房源标记（数字徽章）
async function renderPropertyMarkers() {
  if (!map) return;

  const AMap = await loadAMap();

  // 按 GPS 分组房源
  const groupedProperties = propertyStore.groupedPropertiesByGps;

  // 清空现有标记
  clearPropertyMarkers();

  if (groupedProperties.length === 0) return;

  groupedProperties.forEach(({ gps, properties, count }) => {
    // 创建数字徽章标记
    const color = getPropertiesStatusColor(properties);
    const content = createPropertyBadge(count, color);
    const position = [gps.lng, gps.lat];

    const marker = new AMap.Marker({
      position: position,
      content: content,
      offset: new AMap.Pixel(-20, -20),
      extData: { type: "property", properties, gps },
      zIndex: 100,
    });

    // 点击标记显示 InfoWindow
    marker.on("click", () => {
      showPropertyInfoWindow(marker, properties);
    });

    map.add(marker);
    propertyMarkers.set(`${gps.lng},${gps.lat}`, marker);
  });

  // 自动适配地图视野
  if (propertyMarkers.size > 0) {
    map.setFitView();
  }
}

// 创建房源数字徽章
function createPropertyBadge(count: number, color: string) {
  return `
    <div class="property-badge" style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${color};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.3s;
    " onmouseenter="this.style.transform='scale(1.2)'" onmouseleave="this.style.transform='scale(1)'">
      ${count}
    </div>
  `;
}

// 获取房源状态颜色
function getPropertiesStatusColor(properties: PropertyViewItem[]): string {
  const availableCount = properties.filter((p) => p.available).length;
  if (availableCount === properties.length) return "#67c23a"; // 全部可租 - 绿色
  if (availableCount === 0) return "#909399"; // 全部已租 - 灰色
  return "#409eff"; // 部分可租 - 蓝色
}

// 显示房源 InfoWindow
function showPropertyInfoWindow(marker: any, properties: PropertyViewItem[]) {
  const AMap = (window as any).AMap;

  // 关闭之前的 InfoWindow
  if (currentInfoWindow) {
    currentInfoWindow.close();
  }

  const infoWindow = new AMap.InfoWindow({
    isCustom: false, // 使用默认样式，包含关闭按钮和小箭头
    content: createPropertyInfoWindowContent(properties),
    offset: new AMap.Pixel(0, -15),
    closeWhenClickMap: true,
    retainWhenClose: true,
  });

  infoWindow.on("close", () => {
    if (currentInfoWindow === infoWindow) {
      currentInfoWindow = null;
    }
  });

  infoWindow.open(map, marker.getPosition());
  currentInfoWindow = infoWindow;
}

// 创建房源 InfoWindow 内容
function createPropertyInfoWindowContent(
  properties: PropertyViewItem[]
): HTMLElement {
  const container = document.createElement("div");
  container.className = "property-info-window";
  container.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 12px;
    min-width: 300px;
    max-width: 400px;
  `;

  const title = document.createElement("h4");
  title.style.cssText = "margin: 0 0 12px 0; color: #303133;";
  title.textContent = `${properties[0].address || "未知地址"}（共${
    properties.length
  }套房源）`;
  container.appendChild(title);

  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
  `;

  properties.forEach((property) => {
    const item = document.createElement("div");
    item.style.cssText = `
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.3s;
    `;
    item.onmouseenter = () => {
      item.style.borderColor = "#409eff";
      item.style.boxShadow = "0 2px 8px rgba(64, 158, 255, 0.3)";
    };
    item.onmouseleave = () => {
      item.style.borderColor = "#ebeef5";
      item.style.boxShadow = "none";
    };
    item.onclick = () => {
      // 触发打开房源详情事件
      propertyStore.setViewMode("property");
      // 需要通过 emit 通知父组件打开详情页
      window.dispatchEvent(
        new CustomEvent("open-property-detail", {
          detail: { propertyId: property.propertyId },
        })
      );
    };

    const content = `
      <div style="font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 4px;">
        ${property.roomType}
      </div>
      <div style="font-size: 12px; color: #f56c6c;">
        ¥${property.rent || "--"}/月
      </div>
      <div style="font-size: 12px; color: #909399; margin-top: 4px;">
        ${property.available ? "✓ 可租" : "× 已租"}
      </div>
    `;
    item.innerHTML = content;
    grid.appendChild(item);
  });

  container.appendChild(grid);

  const footer = document.createElement("div");
  footer.style.cssText =
    "margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; font-size: 12px; color: #909399; display: flex; align-items: center; gap: 8px;";

  const phoneText = document.createElement("span");
  phoneText.textContent = `📞 房东: ${properties[0].landlordPhone}`;
  footer.appendChild(phoneText);

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "复制";
  copyBtn.style.cssText = `
    padding: 2px 8px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;
  `;
  copyBtn.onmouseenter = () => {
    copyBtn.style.background = "#66b1ff";
  };
  copyBtn.onmouseleave = () => {
    copyBtn.style.background = "#409eff";
  };
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(properties[0].landlordPhone);
      copyBtn.textContent = "已复制";
      setTimeout(() => {
        copyBtn.textContent = "复制";
      }, 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };
  footer.appendChild(copyBtn);

  container.appendChild(footer);

  return container;
}

// 定位到指定位置
function locateToPosition(gps: { lng: number; lat: number }) {
  if (!map) return;

  map.setZoomAndCenter(16, [gps.lng, gps.lat]);

  // 如果是房源视图，找到对应的标记并打开 InfoWindow
  if (props.viewMode === "property") {
    const key = `${gps.lng},${gps.lat}`;
    const marker = propertyMarkers.get(key);
    if (marker) {
      const extData = marker.getExtData();
      if (extData && extData.properties) {
        showPropertyInfoWindow(marker, extData.properties);
      }
    }
  }
}

defineExpose({
  focusLandlord,
  locateToPosition,
});
</script>

<style lang="scss" scoped>
.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.legend {
  position: absolute;
  bottom: 170px;
  right: 20px;
  z-index: 100;

  .legend-trigger {
    width: 30px;
    height: 30px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    color: #409eff;
    cursor: help;
    transition: all 0.3s;

    &:hover {
      background: #eee;
    }
  }

  .legend-content {
    position: absolute;
    bottom: 3px;
    right: 40px;
    background: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 3px #00000080;
    font-size: 12px;
    min-width: 140px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s;
    pointer-events: none;

    &::after {
      content: "";
      position: absolute;
      bottom: 10px;
      right: -4px;
      width: 6px;
      height: 6px;
      transform: rotate(45deg);
      background: white;
      border: 1px solid #c3c3c3;
      z-index: 999;
      clip-path: polygon(0 0, 100% 0, 100% 100%);
    }
  }

  &:hover .legend-content {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-tip {
  color: #409eff;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 500;
}

.legend-divider {
  height: 1px;
  background: #838383;
  margin: 8px 0;
}

.legend-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  margin-bottom: 6px;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-item {
  margin-top: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
  border: 1px solid #eee;
  &.green {
    background: #67c23a;
  }
  &.yellow {
    background: #e4a13c;
  }
  &.blue {
    background: #409eff;
  }
  &.red {
    background: #f56c6c;
  }
  &.gray {
    background: #909399;
  }
  &.bright {
    background: #409eff;
    opacity: 1;
  }
  &.dark {
    background: #409eff;
    opacity: 0.6;
  }
}

.dot.square {
  border-radius: 2px;
  background: #909399;
  &.highlighted {
    border-width: 1px;
    border-color: #ff4444;
  }
}

.dot.star {
  border-radius: 0;
  background: transparent;
  border: none;
  font-size: 12px;
  display: inline-block;
  width: 12px;
  height: 12px;
  line-height: 1;
  text-indent: -3px;
}

// 右侧控制按钮组
.map-controls {
  position: absolute;
  bottom: 90px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
}

.control-button {
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #eee;
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: #409eff;
    .el-icon {
      color: white;
    }
  }

  &.clear {
    background: #f56c6c;
    .el-icon {
      color: white;
    }

    &:hover {
      background: #f78989;
    }
  }

  .el-icon {
    color: #409eff;
  }
}

// 呼吸动画 - 用于高亮标记
:global(.marker-breathing) {
  animation: breathing 2s ease-in-out infinite;
}

@keyframes breathing {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(255, 68, 68, 0.6));
  }
  50% {
    transform: scale(1.15);
    filter: drop-shadow(0 0 8px rgba(255, 68, 68, 0.9));
  }
}
</style>
