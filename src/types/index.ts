// ========== 枚举类型定义 ==========

/** 房东类型 */
export enum LandlordType {
  FirstHand = "first_hand", // 一手房东
  SecondHand = "second_hand", // 二手房东
  Agent = "agent", // 中介
  Other = "other", // 其他
}

/** 微信状态 */
export enum WechatStatus {
  NotAdded = "not_added", // 未添加
  Added = "added", // 已添加
  Rejected = "rejected", // 已拒绝
}

/** 联系状态 */
export enum ContactStatus {
  NotContacted = "not_contacted", // 未联系
  Contacted = "contacted", // 已联系
}

/** 押金方式 */
export enum DepositMethod {
  OneOne = "1_1", // 押一付一
  OneTwo = "1_2", // 押一付二
  OneThree = "1_3", // 押一付三
  TwoOne = "2_1", // 押二付一
  TwoTwo = "2_2", // 押二付二
  TwoThree = "2_3", // 押二付三
  Other = "other", // 其他
}

/** 房型 */
export enum RoomType {
  Single = "single", // 单间
  OneRoom = "1_room_1_hall", // 一房一厅
  TwoRoom = "2_room_1_hall", // 两房一厅
  ThreeRoom = "3_room_1_hall", // 三房一厅
  Other = "other", // 其他
}

/** 朝向 */
export enum Orientation {
  East = "east",
  South = "south",
  West = "west",
  North = "north",
  Southeast = "southeast",
  Southwest = "southwest",
  Northeast = "northeast",
  Northwest = "northwest",
  Other = "other",
}

// ========== 数据结构定义 ==========

/** GPS 坐标 (GCJ-02) */
export interface GPS {
  lng: number; // 经度
  lat: number; // 纬度
}

/** 照片信息 */
export interface Photo {
  id: string; // 唯一标识
  fileName: string; // 文件名
  folderId: string; // 文件夹标识符
  captureTime?: string; // 拍摄时间 (ISO 8601)
  gps?: GPS; // GPS 坐标
  roomId?: string; // 关联房源 ID (可选)
  notes?: string; // 备注
}

/** 视频信息 */
export interface Video {
  id: string;
  fileName: string;
  folderId: string;
  captureTime?: string;
  roomId?: string;
  notes?: string;
}

/** 家电家具配置 */
export interface Appliances {
  airConditioner: boolean; // 空调
  washingMachine: boolean; // 洗衣机
  waterHeater: boolean; // 热水器
  refrigerator: boolean; // 冰箱
  bed: boolean; // 床
  wardrobe: boolean; // 衣柜
  internet: boolean; // 宽带
  television: boolean; // 电视
  desk: boolean; // 书桌
  chair: boolean; // 椅子
  sofa: boolean; // 沙发
  diningTable: boolean; // 餐桌
  custom?: string[]; // 自定义家电（用户添加的非标准项）
}

/** 房源信息 */
export interface Property {
  id: string; // 唯一标识
  landlordId: string; // 关联房东 ID
  roomType: RoomType; // 房型
  rent: number; // 租金（元/月）
  floor?: string; // 楼层
  appliances?: Appliances; // 家电家具配置
  amenities: string[]; // 配套设施
  videos: Video[]; // 视频列表
  notes?: string; // 房源专属备注
  available: boolean; // 是否可租
  createdAt: string; // 创建时间 (ISO 8601)
  updatedAt: string; // 更新时间 (ISO 8601)
}

/** 房东信息 */
export interface Landlord {
  id: string; // 唯一标识

  // 基础信息
  photos: Photo[]; // 照片列表（第一张为主图）
  phoneNumbers: string[]; // 电话号码列表
  landlordType: LandlordType; // 房东类型
  alias?: string; // 备注名/称呼

  // 微信/联系状态
  wechatStatus: WechatStatus; // 微信状态
  contactStatus: ContactStatus; // 联系状态
  wechatNickname?: string; // 微信昵称
  avatar?: string; // 头像（文件名或 Base64）
  isFavorite?: boolean; // 是否收藏

  // 位置信息
  gps?: GPS; // GPS 坐标
  address?: string; // 逆地理编码地址
  captureTime?: string; // 首次拍摄时间 (ISO 8601)

  // 费用与押金
  deposit: string; // 押金方式 (如 "押一付一")
  commonFees: {
    // 水电费
    electricity: {
      type: string; // 类型：民用电/自定义
      price?: number; // 价格（元/度）
      unit?: string; // 单位
    };
    water: {
      type: string; // 类型：民用水/自定义
      price?: number; // 价格（元/吨）
      unit?: string; // 单位
    };

    // 其他费用
    internet?: number; // 网费
    management?: number; // 管理费
    garbage?: number; // 垃圾费
    other?: string; // 其他费用说明
  };

  // 沟通记录
  contactNotes?: string; // 沟通记录
  additionalInfo?: string; // 补充信息

  // 关联房源
  properties: RoomInfo[]; // 房源列表

  // 系统字段
  isPerfect: boolean; // 是否已完善（false = 待完善）
  createdAt: string; // 创建时间 (ISO 8601)
  updatedAt: string; // 更新时间 (ISO 8601)
}

/** 单个房源信息 */
export interface RoomInfo {
  id: string; // 房源ID
  roomType: string; // 房型
  rent?: number; // 租金（元/月）
  floor?: string; // 楼层
  description?: string; // 房源描述

  // 配套设施
  amenities: string[]; // 例如 ['空调', '洗衣机']

  // 视频
  videos: Video[]; // 视频列表

  available?: boolean; // 是否可租
  isFavorite?: boolean; // 是否收藏（房源级别）
}

// ========== 常量定义 ==========

// 押金方式选项
export const DEPOSIT_METHODS = [
  { value: "押一付一", label: "押一付一" },
  { value: "押二付一", label: "押二付一" },
  { value: "押一付二", label: "押一付二" },
  { value: "押二付二", label: "押二付二" },
  { value: "其他", label: "其他" },
];

// 房东类型选项
export const LANDLORD_TYPES = [
  { value: "first_hand", label: "一手房东" },
  { value: "second_hand", label: "二手房东" },
  { value: "agent", label: "中介" },
  { value: "other", label: "其他" },
];

// 微信状态选项
export const WECHAT_STATUS_TYPES = [
  { value: "not_added", label: "未添加" },
  { value: "added", label: "已添加" },
];

// 联系状态选项
export const CONTACT_STATUS_TYPES = [
  { value: "uncontacted", label: "未联系" },
  { value: "contacted", label: "已联系" },
];

// 电费类型选项
export const ELECTRICITY_TYPES = [
  { value: "unset", label: "未设置" },
  { value: "civil", label: "0.6元/度（民用电）" },
  { value: "0.88", label: "0.88元/度" },
  { value: "1.0", label: "1.0元/度" },
  { value: "1.5", label: "1.5元/度" },
  { value: "custom", label: "自定义" },
];

// 水费类型选项
export const WATER_TYPES = [
  { value: "unset", label: "未设置" },
  { value: "civil", label: "3元/吨（民用水）" },
  { value: "5.0", label: "5元/吨" },
  { value: "custom", label: "自定义" },
];

// 房型选项
export const ROOM_TYPES = [
  { value: "单间", label: "单间" },
  { value: "一房一厅", label: "一房一厅" },
  { value: "两房一厅", label: "两房一厅" },
  { value: "三房一厅", label: "三房一厅" },
  { value: "其他", label: "其他" },
];

// 配套设施选项
export const AMENITY_OPTIONS = [
  "空调",
  "洗衣机",
  "热水器",
  "冰箱",
  "床",
  "衣柜",
  "宽带",
  "沙发",
  "电视",
  "油烟机",
  "燃气灶",
];

export interface FileSystemHandleStore {
  id: string; // 标识符（如 'userPhotosFolder'）
  handle: FileSystemDirectoryHandle; // 目录句柄
  displayPath: string; // 用户友好路径（如 'D:\租房照片'）
  lastAccess: string; // 最后访问时间 (ISO 8601)
}

// ========== 筛选和视图相关 ==========

/** 筛选条件 */
export interface FilterOptions {
  wechatStatus?: WechatStatus[];
  contactStatus?: ContactStatus[];
  landlordType?: LandlordType[];
  rentRange?: [number, number]; // 租金区间
  roomTypes?: string[];
  available?: boolean; // 是否可租
  isPerfect?: boolean; // 是否已完善
  hideRepeatedPhones?: boolean; // 隐藏重复电话（二房东）
  showRepeatedPhones?: boolean; // 只显示重复电话（二房东）
  waterType?: string; // 水费类型
  electricityType?: string; // 电费类型
  waterPriceMax?: number; // 最大水费（自定义时使用）
  electricityPriceMax?: number; // 最大电费（自定义时使用）
  phoneSearch?: string; // 电话号码搜索关键词
  isFavorite?: 'all' | 'favorite' | 'unfavorite'; // 收藏状态筛选
}

/** 房源视图筛选条件 */
export interface PropertyFilterOptions {
  // 房源维度
  roomTypes?: string[]; // 房型：单间、一房一厅等
  rentRange?: [number, number]; // 租金区间：[1000, 2000]
  amenities?: string[]; // 配套设施：空调、洗衣机等
  floor?: string; // 楼层：低楼层(<3)、中楼层(3-7)、高楼层(>7)
  available?: boolean; // 是否可租
  favoriteStatus?: "all" | "favorite" | "unfavorite"; // 收藏状态

  // 房东维度（关联筛选）
  landlordType?: LandlordType[]; // 房东类型
  depositMethod?: string[]; // 押金方式
  waterType?: string; // 水费类型
  electricityType?: string; // 电费类型
  waterPriceMax?: number; // 最大水费（自定义时使用）
  electricityPriceMax?: number; // 最大电费（自定义时使用）

  // 搜索
  keyword?: string; // 关键词搜索（地址、备注）
  
  // 排序
  sortBy?: "default" | "rentAsc" | "rentDesc" | "roomType"; // 排序方式
}

/** 房源视图项（扁平化的房源数据） */
export interface PropertyViewItem {
  // 房源信息
  propertyId: string;
  roomType: string;
  rent?: number;
  floor?: string;
  amenities: string[];
  available?: boolean;
  description?: string;
  videos: Video[];

  // 从房东继承的信息
  landlordId: string;
  landlordPhone: string;
  landlordType: LandlordType;
  address?: string;
  gps?: GPS;

  // 公共费用（从房东继承）
  water: {
    type: string;
    price?: number;
    unit?: string;
  };
  electricity: {
    type: string;
    price?: number;
    unit?: string;
  };
  deposit: string;

  // 照片（使用房东主图）
  photo?: Photo;

  // 收藏状态（从房东继承）
  isFavorite?: boolean;
}

/** 视图模式 */
export type ViewMode = 'landlord' | 'property';

/** 地图标记样式配置 */
export interface MarkerStyle {
  color: string; // 颜色
  opacity: number; // 透明度（已联系 1.0，未联系 0.5）
  icon?: string; // 图标（可选）
}

// ========== 导出数据格式 ==========

/** Excel 导出行数据 */
export interface ExcelRow {
  房东ID: string;
  房东类型: string;
  电话号码: string;
  微信状态: string;
  联系状态: string;
  微信昵称: string;
  地址: string;
  GPS经度: number | string;
  GPS纬度: number | string;
  押金方式: string;
  电费: number | string;
  水费: number | string;
  网费: number | string;
  管理费: number | string;
  房源数量: number;
  是否完善: string;
  创建时间: string;
}
