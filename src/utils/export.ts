import * as XLSX from 'xlsx'
import type { Landlord, ExcelRow } from '@/types'
import { 
  LandlordType, 
  WechatStatus, 
  ContactStatus, 
  DepositMethod 
} from '@/types'

/** 导出为 Excel 文件 */
export function exportToExcel(landlords: Landlord[], filename: string = '租房信息.xlsx') {
  // 转换数据为 Excel 行格式
  const rows: ExcelRow[] = landlords.map(landlord => ({
    房东ID: landlord.id,
    房东类型: translateLandlordType(landlord.landlordType),
    电话号码: landlord.phoneNumbers.join(', '),
    微信状态: translateWechatStatus(landlord.wechatStatus),
    联系状态: translateContactStatus(landlord.contactStatus),
    微信昵称: landlord.wechatNickname || '',
    地址: landlord.address || '未知',
    GPS经度: landlord.gps?.lng || '',
    GPS纬度: landlord.gps?.lat || '',
    押金方式: landlord.depositMethod ? translateDepositMethod(landlord.depositMethod) : '',
    电费: landlord.electricity || '',
    水费: landlord.water || '',
    网费: landlord.internet || '',
    管理费: landlord.management || '',
    房源数量: landlord.properties.length,
    是否完善: landlord.isPerfect ? '是' : '否',
    创建时间: formatDate(landlord.createdAt)
  }))

  // 创建工作簿
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '房东信息')

  // 导出文件
  XLSX.writeFile(workbook, filename)
}

/** 导出为 JSON 文件（完整数据） */
export function exportToJson(landlords: Landlord[], filename: string = '租房信息.json') {
  const dataStr = JSON.stringify(landlords, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/** 从 JSON 导入数据 */
export async function importFromJson(file: File): Promise<Landlord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          resolve(data as Landlord[])
        } else {
          reject(new Error('JSON 格式错误：应为数组'))
        }
      } catch (error) {
        reject(new Error('JSON 解析失败'))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// ========== 枚举翻译函数 ==========

function translateLandlordType(type: LandlordType): string {
  const map: Record<LandlordType, string> = {
    [LandlordType.FirstHand]: '一手房东',
    [LandlordType.SecondHand]: '二手房东',
    [LandlordType.Agent]: '中介',
    [LandlordType.Other]: '其他'
  }
  return map[type] || '未知'
}

function translateWechatStatus(status: WechatStatus): string {
  const map: Record<WechatStatus, string> = {
    [WechatStatus.NotAdded]: '未添加',
    [WechatStatus.Added]: '已添加',
    [WechatStatus.Rejected]: '已拒绝'
  }
  return map[status] || '未知'
}

function translateContactStatus(status: ContactStatus): string {
  const map: Record<ContactStatus, string> = {
    [ContactStatus.NotContacted]: '未联系',
    [ContactStatus.Contacted]: '已联系'
  }
  return map[status] || '未知'
}

function translateDepositMethod(method: DepositMethod): string {
  const map: Record<DepositMethod, string> = {
    [DepositMethod.OneOne]: '押一付一',
    [DepositMethod.OneTwo]: '押一付二',
    [DepositMethod.OneThree]: '押一付三',
    [DepositMethod.TwoOne]: '押二付一',
    [DepositMethod.TwoTwo]: '押二付二',
    [DepositMethod.TwoThree]: '押二付三',
    [DepositMethod.Other]: '其他'
  }
  return map[method] || '未知'
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return isoDate
  }
}
