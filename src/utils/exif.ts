import exifr from 'exifr'
import type { GPS } from '@/types'

/** EXIF 数据提取结果 */
export interface ExifData {
  gps?: GPS
  captureTime?: string
  make?: string       // 设备制造商
  model?: string      // 设备型号
  orientation?: number // 图片方向
}

/** 从图片文件中提取 EXIF 信息 */
export async function extractExif(file: File): Promise<ExifData> {
  try {
    const exifData = await exifr.parse(file, {
      gps: true,
      pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'DateTime', 'CreateDate']
    })

    if (!exifData) {
      return {}
    }

    let gps: GPS | undefined
    let captureTime: string | undefined

    // 提取 GPS 坐标 (WGS-84)
    if (exifData.latitude && exifData.longitude) {
      const wgs84 = {
        lng: exifData.longitude,
        lat: exifData.latitude
      }
      
      // 转换为 GCJ-02（火星坐标系）
      gps = wgs84ToGcj02(wgs84.lng, wgs84.lat)
    }

    // 提取拍摄时间
    if (exifData.DateTimeOriginal) {
      captureTime = new Date(exifData.DateTimeOriginal).toISOString()
    } else if (exifData.CreateDate) {
      captureTime = new Date(exifData.CreateDate).toISOString()
    } else if (exifData.DateTime) {
      captureTime = new Date(exifData.DateTime).toISOString()
    }

    return {
      gps,
      captureTime
    }
  } catch (error) {
    console.error('EXIF 提取失败:', error)
    return {}
  }
}

/** 批量提取 EXIF 信息 */
export async function batchExtractExif(files: File[]): Promise<Map<string, ExifData>> {
  const results = new Map<string, ExifData>()

  for (const file of files) {
    const exifData = await extractExif(file)
    results.set(file.name, exifData)
  }

  return results
}

// ========== 坐标转换工具 ==========

const X_PI = (Math.PI * 3000.0) / 180.0
const PI = Math.PI
const A = 6378245.0 // 长半轴
const EE = 0.00669342162296594323 // 偏心率平方

/** WGS-84 转 GCJ-02（火星坐标系） */
export function wgs84ToGcj02(lng: number, lat: number): GPS {
  if (outOfChina(lng, lat)) {
    return { lng, lat }
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  
  const mgLat = lat + dLat
  const mgLng = lng + dLng
  
  return { lng: mgLng, lat: mgLat }
}

/** GCJ-02（火星坐标系）转 WGS-84 */
export function gcj02ToWgs84(lng: number, lat: number): GPS {
  if (outOfChina(lng, lat)) {
    return { lng, lat }
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  
  const mgLat = lat + dLat
  const mgLng = lng + dLng
  
  return { lng: lng * 2 - mgLng, lat: lat * 2 - mgLat }
}

/** GCJ-02（火星坐标系）转 BD-09（百度坐标系） */
export function gcj02ToBd09(lng: number, lat: number): GPS {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI)
  
  const bdLng = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  
  return { lng: bdLng, lat: bdLat }
}

/** BD-09（百度坐标系）转 GCJ-02（火星坐标系） */
export function bd09ToGcj02(lng: number, lat: number): GPS {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  
  const gcjLng = z * Math.cos(theta)
  const gcjLat = z * Math.sin(theta)
  
  return { lng: gcjLng, lat: gcjLat }
}

/** 判断坐标是否在中国境外 */
function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

/** 纬度转换辅助函数 */
function transformLat(lng: number, lat: number): number {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

/** 经度转换辅助函数 */
function transformLng(lng: number, lat: number): number {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

/** 计算两个坐标之间的距离（米） */
export function calculateDistance(gps1: GPS, gps2: GPS): number {
  const radLat1 = (gps1.lat * Math.PI) / 180.0
  const radLat2 = (gps2.lat * Math.PI) / 180.0
  const a = radLat1 - radLat2
  const b = (gps1.lng * Math.PI) / 180.0 - (gps2.lng * Math.PI) / 180.0
  
  let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
  s = s * 6378137.0 // 地球半径（米）
  s = Math.round(s * 10000) / 10000
  
  return s
}

/** 应用 GPS 微偏移（避免地图标记重叠） */
export function applyGpsOffset(existingCoords: GPS[], newCoord: GPS): GPS {
  const THRESHOLD = 0.00002 // 约 2 米
  const OFFSET = 0.00010     // 约 5 米偏移量

  // 检查是否与现有坐标过于接近
  const hasDuplicate = existingCoords.some(coord => 
    Math.abs(coord.lng - newCoord.lng) < THRESHOLD &&
    Math.abs(coord.lat - newCoord.lat) < THRESHOLD
  )

  if (hasDuplicate) {
    // 随机方向微小偏移
    const angle = Math.random() * 2 * Math.PI
    return {
      lng: newCoord.lng + Math.cos(angle) * OFFSET,
      lat: newCoord.lat + Math.sin(angle) * OFFSET
    }
  }

  return newCoord
}
