import { defineStore } from "pinia";
import { ref, computed, toRaw } from "vue";
import type { Landlord, Property, FilterOptions, GPS, PropertyFilterOptions, PropertyViewItem, ViewMode } from "@/types";
import { LandlordType, WechatStatus, ContactStatus } from "@/types";
import {
  getAllLandlords,
  addLandlord,
  updateLandlord,
  deleteLandlord,
  findLandlordsByPhone,
  clearAllLandlords as clearDbLandlords,
} from "@/utils/storage";
import { getAddressFromGps } from "@/utils/geocode";
import { applyGpsOffset } from "@/utils/exif";
import {  getValidDirectoryHandle, moveToTrash } from "@/utils/fileSystem";

export const usePropertyStore = defineStore("property", () => {
  // ========== 状态 ==========
  const landlords = ref<Landlord[]>([]);
  const currentLandlord = ref<Landlord | null>(null);
  const focusedLandlordId = ref<string | null>(null);
  const filters = ref<FilterOptions>({});
  const loading = ref(false);

  // ========== 房源视图相关状态 ==========
  const viewMode = ref<ViewMode>('landlord'); // 当前视图模式
  const propertyFilters = ref<PropertyFilterOptions>({}); // 房源筛选条件

  // ========== 计算属性 ==========
  const filteredLandlords = computed(() => {
    let result = landlords.value;

    if (filters.value.wechatStatus && filters.value.wechatStatus.length > 0) {
      result = result.filter((l) =>
        filters.value.wechatStatus!.includes(l.wechatStatus)
      );
    }

    if (filters.value.contactStatus && filters.value.contactStatus.length > 0) {
      result = result.filter((l) =>
        filters.value.contactStatus!.includes(l.contactStatus)
      );
    }

    // 电话号码筛选
    if (filters.value.phoneSearch && filters.value.phoneSearch.trim()) {
      const keyword = filters.value.phoneSearch.trim();
      result = result.filter(l => l.phoneNumbers.some(phone => phone.includes(keyword)));
    }

    if (filters.value.landlordType && filters.value.landlordType.length > 0) {
      result = result.filter((l) =>
        filters.value.landlordType!.includes(l.landlordType)
      );
    }

    if (filters.value.isPerfect !== undefined) {
      result = result.filter((l) => l.isPerfect === filters.value.isPerfect);
    }

    if (filters.value.available !== undefined) {
      result = result.filter((l) =>
        l.properties.some((p) => p.available === filters.value.available)
      );
    }

    if (filters.value.rentRange) {
      const [min, max] = filters.value.rentRange;
      result = result.filter((l) =>
        l.properties.some((p: any) => p.rent >= min && p.rent <= max)
      );
    }

    if (filters.value.roomTypes && filters.value.roomTypes.length > 0) {
      result = result.filter((l) =>
        l.properties.some((p) => filters.value.roomTypes!.includes(p.roomType))
      );
    }

    if (filters.value.waterType && filters.value.waterType !== 'all') {
      result = result.filter((l) => {
        if (filters.value.waterType === 'civil') return l.commonFees.water.type === 'civil';
        if (filters.value.waterType === 'custom') {
          // 自定义水费且价格筛选
          if (l.commonFees.water.type === 'civil') return false;
          if (filters.value.waterPriceMax !== undefined && l.commonFees.water.price !== undefined) {
            return l.commonFees.water.price <= filters.value.waterPriceMax;
          }
          return true;
        }
        return true;
      });
    }

    if (filters.value.electricityType && filters.value.electricityType !== 'all') {
      result = result.filter((l) => {
        if (filters.value.electricityType === 'civil') return l.commonFees.electricity.type === 'civil';
        if (filters.value.electricityType === 'custom') {
          // 自定义电费且价格筛选
          if (l.commonFees.electricity.type === 'civil') return false;
          if (filters.value.electricityPriceMax !== undefined && l.commonFees.electricity.price !== undefined) {
            return l.commonFees.electricity.price <= filters.value.electricityPriceMax;
          }
          return true;
        }
        return true;
      });
    }

    if (filters.value.isFavorite && filters.value.isFavorite !== 'all') {
      result = result.filter((l) => {
        if (filters.value.isFavorite === 'favorite') return l.isFavorite === true;
        if (filters.value.isFavorite === 'unfavorite') return !l.isFavorite;
        return true;
      });
    }

    if (filters.value.hideRepeatedPhones) {
      // 统计所有电话号码的出现次数
      const phoneCounts = new Map<string, number>();
      landlords.value.forEach((l) => {
        if (l.phoneNumbers && l.phoneNumbers.length > 0) {
          l.phoneNumbers.forEach((phone) => {
            phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
          });
        }
      });

      // 过滤掉包含重复电话号码的房东
      result = result.filter((l) => {
        if (!l.phoneNumbers || l.phoneNumbers.length === 0) return true; // 没有电话的不过滤
        // 只要有一个电话号码出现次数 >= 3，就认为是二房东，过滤掉
        return !l.phoneNumbers.some((phone) => (phoneCounts.get(phone) || 0) >= 3);
      });
    }

    if (filters.value.showRepeatedPhones) {
      // 统计所有电话号码的出现次数
      const phoneCounts = new Map<string, number>();
      landlords.value.forEach((l) => {
        if (l.phoneNumbers && l.phoneNumbers.length > 0) {
          l.phoneNumbers.forEach((phone) => {
            phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
          });
        }
      });

      // 只显示包含出现3次及以上电话号码的房东
      result = result.filter((l) => {
        if (!l.phoneNumbers || l.phoneNumbers.length === 0) return false; // 没有电话的不显示
        // 只要有一个电话号码出现次数 >= 3，就显示
        return l.phoneNumbers.some((phone) => (phoneCounts.get(phone) || 0) >= 3);
      });
    }

    // 排序：收藏的排在前面，然后按更新时间倒序
    result.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  });

  const perfectCount = computed(
    () => landlords.value.filter((l) => l.isPerfect).length
  );
  const imperfectCount = computed(
    () => landlords.value.filter((l) => !l.isPerfect).length
  );
  const contactedCount = computed(
    () =>
      landlords.value.filter((l) => l.contactStatus === ContactStatus.Contacted)
        .length
  );

  // ========== 房源视图计算属性 ==========
  
  // 扁平化房源列表（从房东列表中提取所有房源）
  const flattenedProperties = computed(() => {
    const items: PropertyViewItem[] = [];
    landlords.value.forEach(landlord => {
      landlord.properties.forEach(property => {
        items.push({
          // 房源信息
          propertyId: property.id,
          roomType: property.roomType,
          rent: property.rent,
          floor: property.floor,
          amenities: property.amenities,
          available: property.available,
          description: property.description,
          videos: property.videos,
          
          // 从房东继承的信息
          landlordId: landlord.id,
          landlordPhone: landlord.phoneNumbers[0] || '',
          landlordType: landlord.landlordType,
          address: landlord.address,
          gps: landlord.gps,
          
          // 公共费用（从房东继承）
          water: landlord.commonFees.water,
          electricity: landlord.commonFees.electricity,
          deposit: landlord.deposit,
          
          // 照片（使用房东主图）
          photo: landlord.photos[0],
        });
      });
    });
    return items;
  });

  // 筛选后的房源列表
  const filteredProperties = computed(() => {
    let result = flattenedProperties.value;
    
    // 应用房型筛选
    if (propertyFilters.value.roomTypes?.length) {
      result = result.filter(p => 
        propertyFilters.value.roomTypes!.includes(p.roomType)
      );
    }
    
    // 应用租金区间筛选
    if (propertyFilters.value.rentRange) {
      const [min, max] = propertyFilters.value.rentRange;
      result = result.filter(p => 
        p.rent !== undefined && p.rent >= min && p.rent <= max
      );
    }
    
    // 应用配套设施筛选
    if (propertyFilters.value.amenities?.length) {
      result = result.filter(p => 
        propertyFilters.value.amenities!.every(amenity => 
          p.amenities.includes(amenity)
        )
      );
    }
    
    // 应用是否可租筛选
    if (propertyFilters.value.available !== undefined) {
      result = result.filter(p => p.available === propertyFilters.value.available);
    }
    
    // 应用房东类型筛选
    if (propertyFilters.value.landlordType?.length) {
      result = result.filter(p => 
        propertyFilters.value.landlordType!.includes(p.landlordType)
      );
    }
    
    // 应用押金方式筛选
    if (propertyFilters.value.depositMethod?.length) {
      result = result.filter(p => 
        propertyFilters.value.depositMethod!.includes(p.deposit)
      );
    }
    
    // 应用水费类型筛选
    if (propertyFilters.value.waterType && propertyFilters.value.waterType !== 'all') {
      result = result.filter(p => {
        if (propertyFilters.value.waterType === 'civil') return p.water.type === 'civil';
        if (propertyFilters.value.waterType === 'custom') {
          // 自定义水费且价格筛选
          if (p.water.type === 'civil') return false;
          if (propertyFilters.value.waterPriceMax !== undefined && p.water.price !== undefined) {
            return p.water.price <= propertyFilters.value.waterPriceMax;
          }
          return true;
        }
        return true;
      });
    }
    
    // 应用电费类型筛选
    if (propertyFilters.value.electricityType && propertyFilters.value.electricityType !== 'all') {
      result = result.filter(p => {
        if (propertyFilters.value.electricityType === 'civil') return p.electricity.type === 'civil';
        if (propertyFilters.value.electricityType === 'custom') {
          // 自定义电费且价格筛选
          if (p.electricity.type === 'civil') return false;
          if (propertyFilters.value.electricityPriceMax !== undefined && p.electricity.price !== undefined) {
            return p.electricity.price <= propertyFilters.value.electricityPriceMax;
          }
          return true;
        }
        return true;
      });
    }
    
    // 应用关键词搜索
    if (propertyFilters.value.keyword) {
      const keyword = propertyFilters.value.keyword.toLowerCase();
      result = result.filter(p => 
        p.address?.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        p.landlordPhone.includes(keyword)
      );
    }
    
    return result;
  });

  // 按 GPS 分组的房源（用于地图标记）
  const groupedPropertiesByGps = computed(() => {
    const groups = new Map<string, PropertyViewItem[]>();
    
    filteredProperties.value.forEach(property => {
      if (!property.gps) return;
      
      const key = `${property.gps.lng.toFixed(6)},${property.gps.lat.toFixed(6)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(property);
    });
    
    return Array.from(groups.entries()).map(([, properties]) => ({
      gps: properties[0].gps!,
      properties,
      count: properties.length
    }));
  });

  // ========== 操作方法 ==========

  /** 加载所有房东数据 */
  async function loadLandlords() {
    loading.value = true;
    try {
      landlords.value = await getAllLandlords();
    } catch (error) {
      console.error("加载房东数据失败:", error);
    } finally {
      loading.value = false;
    }
  }

  /** 创建新房东（自动建档） */
  async function createLandlord(data: {
    photos: Landlord["photos"];
    gps?: GPS;
    captureTime?: string;
    folderId: string;
  }): Promise<Landlord> {
    const now = new Date().toISOString();

    // GPS 去重处理
    let finalGps = data.gps;
    if (finalGps) {
      const existingCoords = landlords.value
        .filter((l) => l.gps)
        .map((l) => l.gps!);
      finalGps = applyGpsOffset(existingCoords, finalGps);
    }

    // 如果有 GPS，获取地址
    let address: string | undefined;
    if (finalGps) {
      try {
        address = await getAddressFromGps(finalGps);
      } catch (error) {
        // 忽略逆地理编码失败，地址保持为空
      }
    }

    const landlord: Landlord = {
      id: generateId(),
      photos: data.photos,
      phoneNumbers: [],
      landlordType: LandlordType.Other,
      wechatStatus: WechatStatus.NotAdded,
      contactStatus: ContactStatus.NotContacted,
      gps: finalGps,
      address,
      captureTime: data.captureTime,
      deposit: "",
      commonFees: {
        electricity: { type: "civil" },
        water: { type: "civil" },
      },
      properties: [],
      isPerfect: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    await addLandlord(landlord);
    landlords.value.push(landlord);

    return landlord;
  }

  /** 更新房东信息 */
  async function updateLandlordData(id: string, updates: Partial<Landlord>) {
    const index = landlords.value.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error("房东不存在");
    }

    const landlord = landlords.value[index];
    const updatedLandlord = {
      ...toRaw(landlord),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // 使用 toRaw 确保传入 IndexedDB 的是原始对象，避免 Proxy 克隆错误
    await updateLandlord(toRaw(updatedLandlord));
    landlords.value[index] = updatedLandlord;

    if (currentLandlord.value?.id === id) {
      currentLandlord.value = updatedLandlord;
    }
  }

  /** 删除房东 */
  async function removeLandlord(id: string, deleteImages: boolean = false) {
    if (deleteImages) {
      const landlord = landlords.value.find((l) => l.id === id);
      if (landlord && landlord.photos && landlord.photos.length > 0) {
        try {
          const dirHandle = await getValidDirectoryHandle();
          if (dirHandle) {
            for (const photo of landlord.photos) {
              try {
                // 只处理根目录下的图片（不包含路径分隔符的文件名）
                const isRootFile = !photo.fileName.includes('/') && !photo.fileName.includes('\\');
                
                if (!isRootFile) {
                  // 跳过"上传图片"等子目录中的文件
                  continue;
                }
                
                // 检查该图片是否被其他房东使用
                const isUsedByOthers = landlords.value.some(l => 
                  l.id !== id && 
                  l.photos && 
                  l.photos.some(p => p.fileName === photo.fileName)
                );
                
                if (isUsedByOthers) {
                  // 如果被其他房东使用，不删除
                  console.log(`文件 ${photo.fileName} 被其他房东使用，跳过删除`);
                  continue;
                }
                
                // 移动到回收站
                await moveToTrash(dirHandle, photo.fileName);
              } catch (e) {
                console.warn(`无法删除文件 ${photo.fileName}:`, e);
              }
            }
          }
        } catch (error) {
          console.error("删除图片失败:", error);
        }
      }
    }

    await deleteLandlord(id);
    landlords.value = landlords.value.filter((l) => l.id !== id);

    if (currentLandlord.value?.id === id) {
      currentLandlord.value = null;
    }
  }

  /** 检查电话号码重复 */
  async function checkPhoneDuplicate(phone: string): Promise<Landlord[]> {
    return await findLandlordsByPhone(phone);
  }

  /** 切换收藏状态 */
  async function toggleFavorite(id: string) {
    const landlord = landlords.value.find((l) => l.id === id);
    if (landlord) {
      await updateLandlordData(id, { isFavorite: !landlord.isFavorite });
    }
  }

  /** 合并房东记录 */
  async function mergeLandlords(targetId: string, sourceId: string) {
    const target = landlords.value.find((l) => l.id === targetId);
    const source = landlords.value.find((l) => l.id === sourceId);

    if (!target || !source) {
      throw new Error("房东不存在");
    }

    // 合并照片
    const mergedPhotos = [...target.photos, ...source.photos];

    // 合并电话号码（去重）
    const mergedPhones = Array.from(
      new Set([...target.phoneNumbers, ...source.phoneNumbers])
    );

    // 合并房源
    const mergedProperties = [...target.properties, ...source.properties];

    await updateLandlordData(targetId, {
      photos: mergedPhotos,
      phoneNumbers: mergedPhones,
      properties: mergedProperties,
    });

    // 删除源记录
    await removeLandlord(sourceId);
  }

  /** 添加房源到房东 */
  async function addProperty(
    landlordId: string,
    property: Omit<Property, "id" | "landlordId" | "createdAt" | "updatedAt">
  ) {
    const landlord = landlords.value.find((l) => l.id === landlordId);
    if (!landlord) {
      throw new Error("房东不存在");
    }

    const now = new Date().toISOString();
    const newProperty: Property = {
      ...property,
      id: generateId(),
      landlordId,
      createdAt: now,
      updatedAt: now,
    };

    await updateLandlordData(landlordId, {
      properties: [...landlord.properties, newProperty],
    });
  }

  /** 更新房源 */
  async function updateProperty(
    landlordId: string,
    propertyId: string,
    updates: Partial<Property>
  ) {
    const landlord = landlords.value.find((l) => l.id === landlordId);
    if (!landlord) {
      throw new Error("房东不存在");
    }

    const updatedProperties = landlord.properties.map((p) => {
      if (p.id === propertyId) {
        // 深度序列化更新数据，确保数组是纯数据
        const serializedUpdates = JSON.parse(JSON.stringify(updates));
        return { 
          ...p, 
          ...serializedUpdates, 
          updatedAt: new Date().toISOString() 
        };
      }
      return p;
    });

    await updateLandlordData(landlordId, {
      properties: updatedProperties,
    });
  }

  /** 删除房源 */
  async function removeProperty(landlordId: string, propertyId: string) {
    const landlord = landlords.value.find((l) => l.id === landlordId);
    if (!landlord) {
      throw new Error("房东不存在");
    }

    const updatedProperties = landlord.properties.filter(
      (p) => p.id !== propertyId
    );

    await updateLandlordData(landlordId, {
      properties: updatedProperties,
    });
  }

  /** 设置筛选条件 */
  function setFilters(newFilters: FilterOptions) {
    filters.value = { ...newFilters };
  }

  /** 清空筛选条件 */
  function clearFilters() {
    filters.value = {};
  }

  /** 设置当前查看的房东 */
  function selectLandlord(landlord: Landlord | null) {
    currentLandlord.value = landlord;
    if (landlord) {
      focusedLandlordId.value = landlord.id;
    }
  }

  /** 设置当前聚焦的房东（仅高亮，不打开详情） */
  function setFocusedLandlord(id: string | null) {
    focusedLandlordId.value = id;
  }

  /** 清空所有数据 */
  async function clearAllData() {
    await clearDbLandlords();
    landlords.value = [];
    currentLandlord.value = null;
  }

  /** 生成唯一 ID */
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /** 恢复备份数据 */
  async function restoreBackup(data: Landlord[]) {
    loading.value = true;
    try {
      // 1. 清空现有数据
      await clearDbLandlords();
      landlords.value = [];
      currentLandlord.value = null;

      // 2. 批量添加数据
      // 使用 toRaw 确保数据纯净
      const promises = data.map((item) => addLandlord(toRaw(item)));
      await Promise.all(promises);

      // 3. 更新内存状态
      landlords.value = data;
    } catch (error) {
      console.error("恢复备份失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /** 设置房源筛选条件 */
  function setPropertyFilters(newFilters: PropertyFilterOptions) {
    propertyFilters.value = { ...newFilters };
  }

  /** 清空房源筛选条件 */
  function clearPropertyFilters() {
    propertyFilters.value = {};
  }

  /** 切换视图模式 */
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
  }

  return {
    // 状态
    landlords,
    currentLandlord,
    focusedLandlordId,
    filters,
    loading,

    // 房源视图状态
    viewMode,
    propertyFilters,

    // 计算属性
    filteredLandlords,
    perfectCount,
    imperfectCount,
    contactedCount,

    // 房源视图计算属性
    flattenedProperties,
    filteredProperties,
    groupedPropertiesByGps,

    // 方法
    loadLandlords,
    createLandlord,
    updateLandlordData,
    removeLandlord,
    checkPhoneDuplicate,
    mergeLandlords,
    addProperty,
    updateProperty,
    removeProperty,
    setFilters,
    clearFilters,
    selectLandlord,
    setFocusedLandlord,
    clearAllData,
    restoreBackup,
    toggleFavorite,

    // 房源视图方法
    setPropertyFilters,
    clearPropertyFilters,
    setViewMode,
  };
});
