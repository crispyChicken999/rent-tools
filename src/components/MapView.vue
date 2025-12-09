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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { loadAMap } from "@/utils/geocode";
import { usePropertyStore } from "@/stores/property";
import { LandlordType, ContactStatus } from "@/types";
import type { Landlord } from "@/types";

const propertyStore = usePropertyStore();
const mapContainer = ref<HTMLDivElement>();

let map: any = null;
let markers: Map<string, any> = new Map();

onMounted(async () => {
  await initMap();
  await renderMarkers();
  if (map && markers.size > 0) {
    map.setFitView();
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
    const title = landlord.alias || landlord.phoneNumbers[0] || "待完善";

    if (markers.has(landlord.id)) {
      // 更新现有标记
      const marker = markers.get(landlord.id);
      marker.setPosition(position);
      marker.setContent(content);
      marker.setTitle(title);
      marker.setExtData({ landlordId: landlord.id });
      // 确保 zIndex 正确，已联系的在上面
      marker.setzIndex(style.zIndex);
    } else {
      // 创建新标记
      const marker = new AMap.Marker({
        position: position,
        title: title,
        content: content,
        offset: new AMap.Pixel(-9, -9), // 中心对齐 (18px/2)
        extData: { landlordId: landlord.id },
        zIndex: style.zIndex,
      });

      // 点击事件 - 获取最新数据
      marker.on("click", () => {
        const current = propertyStore.landlords.find(
          (l) => l.id === landlord.id
        );
        if (current) {
          showInfoWindow(marker, current);
        }
      });

      map.add(marker);
      markers.set(landlord.id, marker);
    }
  });
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

  // 样式配置
  return {
    color: baseColor,
    opacity: isContacted ? 1.0 : 0.6,
    borderColor: "#FFFFFF", // 已联系显示黑色边框，未联系白色
    borderWidth: isContacted ? "2px" : "1px",
    scale: isContacted ? 1.2 : 1.0, // 已联系的稍微大一点
    zIndex: isContacted ? 100 : 10, // 已联系的层级更高
  };
}

function createMarkerContent(style: {
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: string;
  scale: number;
}) {
  const { color, opacity, borderColor, borderWidth, scale } = style;
  const size = 18 * scale;

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

  const content = `
    <div style="padding: 12px; min-width: 200px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">
        ${landlord.alias || "待完善房东"}
      </h3>
      <div style="font-size: 14px; line-height: 1.8;">
        <p><strong>电话:</strong> ${
          landlord.phoneNumbers.join(", ") || "未填写"
        }</p>
        <p style="white-space:nowrap;"><strong>地址:</strong> ${
          landlord.address || "未知"
        }</p>
        <p><strong>房源数:</strong> ${landlord.properties.length}</p>
        <p><strong>类型:</strong> ${translateLandlordType(
          landlord.landlordType
        )}</p>
      </div>
      <div style="margin-top: 10px; text-align: center;">
        <button 
          onclick="window.openLandlordDetail('${landlord.id}')"
          style="padding: 6px 16px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          查看详情
        </button>
      </div>
    </div>
  `;

  const infoWindow = new AMap.InfoWindow({
    content,
    offset: new AMap.Pixel(0, -30),
  });

  infoWindow.open(map, marker.getPosition());
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

// 暴露给全局的方法
(window as any).openLandlordDetail = (landlordId: string) => {
  const landlord = propertyStore.landlords.find((l) => l.id === landlordId);
  if (landlord) {
    propertyStore.selectLandlord(landlord);
  }
};

const focusLandlord = (landlord: Landlord) => {
  if (!map || !landlord.gps) return;

  // Pan to location
  map.setZoomAndCenter(17, [landlord.gps.lng, landlord.gps.lat]);

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
