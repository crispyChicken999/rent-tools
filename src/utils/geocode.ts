import AMapLoader from '@amap/amap-jsapi-loader'
import type { GPS } from '@/types'

// 高德地图配置
const DEFAULT_AMAP_KEY = 'e60ae69fab449fe000427408f10e5376'
const DEFAULT_AMAP_SECURITY_CODE = 'd3ae266c0437b1a93d309d3f8cf98d86'

// 获取存储的 Key
export function getStoredAmapConfig() {
  return {
    key: localStorage.getItem('amap_key') || DEFAULT_AMAP_KEY,
    securityCode: localStorage.getItem('amap_security_code') || DEFAULT_AMAP_SECURITY_CODE
  }
}

// 保存 Key
export function saveAmapConfig(key: string, securityCode: string) {
  localStorage.setItem('amap_key', key)
  localStorage.setItem('amap_security_code', securityCode)
}

// 是否使用 AutoAI (四维图新) 服务
// 替代 OSM，国内速度更快
const USE_AUTOAI = true

// 设置安全密钥
const { securityCode } = getStoredAmapConfig()
;(window as any)._AMapSecurityConfig = {
  securityJsCode: securityCode
}

let amapInstance: any = null

/** 加载高德地图 API */
export async function loadAMap(): Promise<any> {
  if (amapInstance) {
    return amapInstance
  }

  const { key } = getStoredAmapConfig()

  try {
    const AMap = await AMapLoader.load({
      key: key,
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

/** 逆地理编码 (AutoAI) */
async function getAddressFromGpsAutoAI(gps: GPS): Promise<string> {
  try {
    // AutoAI API
    // inGb=g01 (WGS84), road=true (包含道路信息), poi=true (包含POI信息)
    const url = `https://restapi.autoai.com/geocoder/v1/regeo?ak=n51ZGv79DCVk7397i97il7u11dP5G13K&guid=&lonlats=${gps.lng},${gps.lat}&inGb=g01&outGb=g02&road=true&poi=true&language=ch`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Network response was not ok')
    
    const data = await response.json()
    
    if (data.status === 200 && data.data && data.data.length > 0) {
      const result = data.data[0]
      const ad = result.ad || {}
      const cityDist = (ad.city || '') + (ad.dist || '')

      // 1. 优先使用 POI (兴趣点) - 通常最准确
      if (result.pois && result.pois.length > 0) {
        const poi = result.pois[0]
        if (poi.addr) {
          // 例如：广州市天河区岑村红花岗上街1号 (金康药房)
          return `${cityDist}${poi.addr} (${poi.nm})`
        }
        if (poi.nm) {
          return `${cityDist}${poi.nm}`
        }
      }

      // 2. 其次使用道路信息
      if (result.roads && result.roads.length > 0) {
        const road = result.roads[0]
        if (road.rnm) {
          return `${cityDist}${road.rnm}附近`
        }
      }

      // 3. 兜底使用 faddr (通常比较宽泛，如"xx市xx区")
      return result.faddr || '未知地址'
    }

    return '未知地址'
  } catch (error) {
    console.error('AutoAI 获取地址失败:', error)
    return '未知地址'
  }
}

/** 逆地理编码：根据 GPS 坐标获取地址 */
export async function getAddressFromGps(gps: GPS): Promise<string> {
  if (USE_AUTOAI) {
    return getAddressFromGpsAutoAI(gps)
  }

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

    // 节流：AutoAI 速度较快，设置 200ms
    const delay = USE_AUTOAI ? 200 : 100
    if (i < total - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
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
