<template>
  <div id="map-container" ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { loadAMap } from '@/utils/geocode'
import { usePropertyStore } from '@/stores/property'
import { LandlordType, ContactStatus } from '@/types'
import type { Landlord } from '@/types'

const propertyStore = usePropertyStore()
const mapContainer = ref<HTMLDivElement>()

let map: any = null
let markers: Map<string, any> = new Map()

onMounted(async () => {
  await initMap()
  await renderMarkers()
})

watch(() => propertyStore.filteredLandlords, () => {
  renderMarkers()
})

async function initMap() {
  try {
    const AMap = await loadAMap()
    
    map = new AMap.Map(mapContainer.value, {
      zoom: 13,
      center: [113.38061599999992,23.160803000000005], // 广州市中心
      viewMode: '3D',
      pitch: 0
    })

    // 添加地图控件
    map.addControl(new AMap.Scale())
    map.addControl(new AMap.ToolBar())
  } catch (error) {
    console.error('地图初始化失败:', error)
  }
}

async function renderMarkers() {
  if (!map) return

  // 清除现有标记
  markers.forEach(marker => {
    map.remove(marker)
  })
  markers.clear()

  const AMap = await loadAMap()
  const landlords = propertyStore.filteredLandlords

  // 筛选有GPS的房东
  const validLandlords = landlords.filter(l => l.gps)

  if (validLandlords.length === 0) return

  // 创建标记
  validLandlords.forEach(landlord => {
    if (!landlord.gps) return

    const marker = new AMap.Marker({
      position: [landlord.gps.lng, landlord.gps.lat],
      title: landlord.alias || landlord.phoneNumbers[0] || '待完善',
      extData: { landlordId: landlord.id }
    })

    // 设置标记样式
    const style = getMarkerStyle(landlord)
    marker.setIcon(createMarkerIcon(style))

    // 点击事件
    marker.on('click', () => {
      showInfoWindow(marker, landlord)
    })

    map.add(marker)
    markers.set(landlord.id, marker)
  })

  // 自动调整视野
  if (validLandlords.length > 0) {
    map.setFitView()
  }
}

function getMarkerStyle(landlord: Landlord) {
  let color = '#999999' // 默认灰色
  
  // 根据房东类型设置颜色
  switch (landlord.landlordType) {
    case LandlordType.FirstHand:
      color = '#67C23A' // 绿色
      break
    case LandlordType.SecondHand:
      color = '#409EFF' // 蓝色
      break
    case LandlordType.Agent:
      color = '#F56C6C' // 红色
      break
    default:
      color = '#909399' // 灰色
  }

  // 根据联系状态调整透明度
  const opacity = landlord.contactStatus === ContactStatus.Contacted ? 1.0 : 0.5

  return { color, opacity }
}

function createMarkerIcon(style: { color: string; opacity: number }) {
  const { color, opacity } = style
  
  // 创建SVG标记图标
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="${color}" opacity="${opacity}" stroke="#fff" stroke-width="2"/>
    </svg>
  `
  
  return new (window as any).AMap.Icon({
    content: svg,
    size: new (window as any).AMap.Size(32, 32),
    imageSize: new (window as any).AMap.Size(32, 32)
  })
}

async function showInfoWindow(marker: any, landlord: Landlord) {
  const AMap = await loadAMap()
  
  const content = `
    <div style="padding: 12px; min-width: 200px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">
        ${landlord.alias || '待完善房东'}
      </h3>
      <div style="font-size: 14px; line-height: 1.8;">
        <p><strong>电话:</strong> ${landlord.phoneNumbers.join(', ') || '未填写'}</p>
        <p><strong>地址:</strong> ${landlord.address || '未知'}</p>
        <p><strong>房源数:</strong> ${landlord.properties.length}</p>
        <p><strong>类型:</strong> ${translateLandlordType(landlord.landlordType)}</p>
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
  `
  
  const infoWindow = new AMap.InfoWindow({
    content,
    offset: new AMap.Pixel(0, -30)
  })
  
  infoWindow.open(map, marker.getPosition())
}

function translateLandlordType(type: LandlordType): string {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: '一手房东',
    [LandlordType.SecondHand]: '二手房东',
    [LandlordType.Agent]: '中介',
    [LandlordType.Other]: '其他'
  }
  return map[type] || '未知'
}

// 暴露给全局的方法
;(window as any).openLandlordDetail = (landlordId: string) => {
  const landlord = propertyStore.landlords.find(l => l.id === landlordId)
  if (landlord) {
    propertyStore.setCurrentLandlord(landlord)
  }
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 600px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
