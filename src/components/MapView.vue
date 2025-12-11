<template>
  <div class="map-wrapper">
    <div id="map-container" ref="mapContainer" class="map-container"></div>
    <div class="legend">
      <div class="legend-item"><span class="dot green"></span> 一手房东</div>
      <div class="legend-item"><span class="dot yellow"></span> 二手房东</div>
      <div class="legend-item"><span class="dot red"></span> 中介</div>
      <div class="legend-item"><span class="dot gray"></span> 其他</div>
      <div class="legend-item">
        <span class="dot bright"></span> 已联系 (亮色)
      </div>
      <div class="legend-item">
        <span class="dot dark"></span> 未联系 (暗色)
      </div>
      <div class="legend-divider"></div>
      <div class="legend-item">
        <span class="dot square"></span> 疑似二房东 (方形)
      </div>
      <div class="legend-divider"></div>
      <div class="legend-tip">💡 右键地图创建房东</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, h, render } from "vue";
import {
  ElImage,
  ElButton,
  ElMessage,
  ElIcon,
  ElMessageBox,
} from "element-plus";
import { CopyDocument } from "@element-plus/icons-vue";
import { loadAMap } from "@/utils/geocode";
import { usePropertyStore } from "@/stores/property";
import { LandlordType, ContactStatus } from "@/types";
import type { Landlord } from "@/types";
import { getValidDirectoryHandle, getFileByPath } from "@/utils/fileSystem";

const propertyStore = usePropertyStore();
const mapContainer = ref<HTMLDivElement>();

let map: any = null;
let markers: Map<string, any> = new Map();
let currentInfoWinImage: string | null = null;
let highlightedPhones = ref<Set<string>>(new Set()); // 当前高亮的手机号集合

// 判断房东是否为疑似二房东（电话出现3次及以上）
function isSuspectedSecondHand(landlord: Landlord): boolean {
  if (!landlord.phoneNumbers || landlord.phoneNumbers.length === 0)
    return false;

  // 统计所有电话号码的出现次数
  const phoneCounts = new Map<string, number>();
  propertyStore.landlords.forEach((l) => {
    if (l.phoneNumbers && l.phoneNumbers.length > 0) {
      l.phoneNumbers.forEach((phone) => {
        phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
      });
    }
  });

  // 只要有一个电话号码出现次数 >= 3，就认为是疑似二房东
  return landlord.phoneNumbers.some(
    (phone) => (phoneCounts.get(phone) || 0) >= 3
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

watch(
  () => propertyStore.filteredLandlords,
  () => {
    renderMarkers();
  },
  { deep: true }
);

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
            await createLandlordAtLocation({
              lng: position.lng,
              lat: position.lat,
            });
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
      landlord.wechatNickname || landlord.phoneNumbers[0] || "待完善";

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
          propertyStore.setFocusedLandlord(current.id);
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
        ElMessage.success("房东已删除");
        await renderMarkers();
      } catch (error: any) {
        if (error !== "cancel") {
          ElMessage.error("删除失败");
        }
      }
    },
    0
  );

  contextMenu.addItem(
    "📋 查看详情",
    () => {
      const landlord = propertyStore.landlords.find((l) => l.id === landlordId);
      if (landlord) {
        propertyStore.selectLandlord(landlord);
      }
    },
    1
  );

  return contextMenu;
}

// 高亮具有相同手机号的marker
function highlightMarkersWithSamePhone(landlord: Landlord) {
  if (!landlord.phoneNumbers || landlord.phoneNumbers.length === 0) {
    clearHighlight();
    return;
  }

  const oldPhones = new Set(highlightedPhones.value);
  const newPhones = new Set(landlord.phoneNumbers);

  // 设置新的高亮手机号
  highlightedPhones.value = newPhones;

  // 只更新受影响的marker(之前高亮或现在高亮的)
  markers.forEach((marker, id) => {
    const l = propertyStore.landlords.find((x) => x.id === id);
    if (!l || !l.gps) return;

    const wasHighlighted =
      l.phoneNumbers?.some((p) => oldPhones.has(p)) || false;
    const isHighlighted =
      l.phoneNumbers?.some((p) => newPhones.has(p)) || false;

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
        l.phoneNumbers?.some((p) => oldPhones.has(p)) || false;
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

  return landlord.phoneNumbers.some((phone) =>
    highlightedPhones.value.has(phone)
  );
}

function getMarkerStyle(landlord: Landlord) {
  // 颜色定义
  const COLORS = {
    [LandlordType.FirstHand]: "#67C23A", // 绿色
    [LandlordType.SecondHand]: "#E4A13C", // 蓝色
    [LandlordType.Agent]: "#F56C6C", // 红色
    [LandlordType.Other]: "#909399", // 灰色
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
    opacity: isContacted ? 1.0 : 0.6,
    borderColor: isHighlighted ? "#FF4444" : isFavorite ? "#E6A23C" : "#FFFFFF", // 高亮时显示红色边框
    borderWidth: isHighlighted
      ? "4px"
      : isFavorite
      ? "3px"
      : isContacted
      ? "2px"
      : "1px",
    scale: isFavorite ? 1.4 : isContacted ? 1.2 : 1.0, // 高亮时不放大,保持原始大小
    zIndex: isHighlighted ? 300 : isFavorite ? 200 : isContacted ? 100 : 10,
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
  } = style;
  const size = 18 * scale;

  // 如果是收藏，显示星星图标
  if (isFavorite) {
    return `
      <div style="
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
      <div style="
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
    <div style="
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
            ? landlord.phoneNumbers.map((phone) =>
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "2px",
                    },
                  },
                  [
                    h("span", phone),
                    h(
                      ElIcon,
                      {
                        style: {
                          marginLeft: "4px",
                          cursor: "pointer",
                          color: "#409EFF",
                        },
                        onClick: () => copyText(phone),
                        title: "复制",
                      },
                      () => h(CopyDocument)
                    ),
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
    h("div", { style: { marginTop: "10px", display: "flex", gap: "8px", justifyContent: "center" } }, [
      h(
        ElButton,
        {
          type: landlord.isFavorite ? "warning" : "default",
          size: "small",
          onClick: async () => {
            await propertyStore.toggleFavorite(landlord.id);
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
        () => landlord.isFavorite ? "⭐ 取消收藏" : "☆ 收藏"
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
    ]),
  ]);

  // 渲染
  render(vnode, container);

  const infoWindow = new AMap.InfoWindow({
    content: container,
    offset: new AMap.Pixel(0, -30),
    closeWhenClickMap: true,
  });

  // 监听关闭，清理 Vue 实例
  infoWindow.on("close", () => {
    render(null, container);
  });

  infoWindow.open(map, marker.getPosition());
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

defineExpose({
  focusLandlord,
});
</script>

<style scoped>
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
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  z-index: 100;
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
  text-align: center;
  color: #409eff;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 500;
}

.legend-divider {
  height: 1px;
  background: #ebeef5;
  margin: 8px 0;
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
}

.dot.square {
  border-radius: 2px;
  background: #909399;
}

.dot.green {
  background: #67c23a;
}
.dot.yellow {
  background: #e4a13c;
}
.dot.blue {
  background: #409eff;
}
.dot.red {
  background: #f56c6c;
}
.dot.gray {
  background: #909399;
}
.dot.bright {
  background: #409eff;
  opacity: 1;
}
.dot.dark {
  background: #409eff;
  opacity: 0.6;
}
</style>
