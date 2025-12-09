import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Landlord, Property, FilterOptions, GPS } from "@/types";
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

export const usePropertyStore = defineStore("property", () => {
  // ========== 状态 ==========
  const landlords = ref<Landlord[]>([]);
  const currentLandlord = ref<Landlord | null>(null);
  const filters = ref<FilterOptions>({});
  const loading = ref(false);

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
        l.properties.some((p:any) => p.rent >= min && p.rent <= max)
      );
    }

    if (filters.value.roomTypes && filters.value.roomTypes.length > 0) {
      result = result.filter((l) =>
        l.properties.some((p) => filters.value.roomTypes!.includes(p.roomType))
      );
    }

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
        console.error("获取地址失败:", error);
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
      ...landlord,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateLandlord(updatedLandlord);
    landlords.value[index] = updatedLandlord;

    if (currentLandlord.value?.id === id) {
      currentLandlord.value = updatedLandlord;
    }
  }

  /** 删除房东 */
  async function removeLandlord(id: string) {
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

    const updatedProperties = landlord.properties.map((p) =>
      p.id === propertyId
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );

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

  return {
    // 状态
    landlords,
    currentLandlord,
    filters,
    loading,

    // 计算属性
    filteredLandlords,
    perfectCount,
    imperfectCount,
    contactedCount,

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
    clearAllData,
  };
});
