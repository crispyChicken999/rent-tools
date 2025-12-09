import AMapLoader from '@amap/amap-jsapi-loader'
import type { GPS } from '@/types'

// 高德地图配置
const AMAP_KEY = 'e60ae69fab449fe000427408f10e5376'
const AMAP_SECURITY_CODE = 'd3ae266c0437b1a93d309d3f8cf98d86'

// 设置安全密钥
;(window as any)._AMapSecurityConfig = {
  securityJsCode: AMAP_SECURITY_CODE
}

let amapInstance: any = null

/** 加载高德地图 API */
export async function loadAMap(): Promise<any> {
  if (amapInstance) {
    return amapInstance
  }

  try {
    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder', 'AMap.Geolocation', 'AMap.Scale', 'AMap.ToolBar']
    })

    amapInstance = AMap
    return AMap
  } catch (error) {
    console.error('高德地图加载失败:', error)
    throw error
  }
}

/** 逆地理编码：根据 GPS 坐标获取地址 */
export async function getAddressFromGps(gps: GPS): Promise<string> {
  try {
    const AMap = await loadAMap()
    const geocoder = new AMap.Geocoder()

    return new Promise((resolve) => {
      geocoder.getAddress([gps.lng, gps.lat], (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const address = result.regeocode.formattedAddress
          resolve(address)
        } else {
          // reject(new Error('逆地理编码失败'))
        }
      })
    })
  } catch (error) {
    console.error('获取地址失败:', error)
    return '未知地址'
  }
}

/** 批量逆地理编码（带节流，避免超出 API 限额） */
export async function batchGetAddresses(
  gpsList: GPS[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const addressMap = new Map<string, string>()
  const total = gpsList.length

  for (let i = 0; i < total; i++) {
    const gps = gpsList[i]
    const key = `${gps.lng},${gps.lat}`

    try {
      const address = await getAddressFromGps(gps)
      addressMap.set(key, address)
    } catch (error) {
      console.error(`获取地址失败 (${key}):`, error)
      addressMap.set(key, '未知地址')
    }

    if (onProgress) {
      onProgress(i + 1, total)
    }

    // 节流：每次请求间隔 100ms，避免超出限额
    if (i < total - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return addressMap
}

/** 正向地理编码：根据地址获取 GPS 坐标 */
export async function getGpsFromAddress(address: string): Promise<GPS | null> {
  try {
    const AMap = await loadAMap()
    const geocoder = new AMap.Geocoder()

    return new Promise((resolve, reject) => {
      geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const location = result.geocodes[0].location
          resolve({
            lng: location.lng,
            lat: location.lat
          })
        } else {
          reject(new Error('地理编码失败'))
        }
      })
    })
  } catch (error) {
    console.error('获取坐标失败:', error)
    return null
  }
}

/** 获取当前位置（浏览器定位） */
export async function getCurrentLocation(): Promise<GPS | null> {
  try {
    const AMap = await loadAMap()
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000
    })

    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          resolve({
            lng: result.position.lng,
            lat: result.position.lat
          })
        } else {
          reject(new Error('定位失败'))
        }
      })
    })
  } catch (error) {
    console.error('获取当前位置失败:', error)
    return null
  }
}

/** 格式化地址（提取主要信息） */
export function formatAddress(fullAddress: string): string {
  // 移除省份和城市前缀，保留区县及后续内容
  const patterns = [
    /^.*?(市|自治州|地区|盟|县)(.*)/,
    /^.*?(区|县)(.*)/
  ]

  for (const pattern of patterns) {
    const match = fullAddress.match(pattern)
    if (match) {
      return match[1] + match[2]
    }
  }

  return fullAddress
}
