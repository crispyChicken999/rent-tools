import type { Landlord, FileSystemHandleStore } from '@/types'

const DB_NAME = 'RentToolsDB'
const DB_VERSION = 3

/** 打开数据库并初始化结构 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建房东存储
      if (!db.objectStoreNames.contains('landlords')) {
        const landlordStore = db.createObjectStore('landlords', { keyPath: 'id' })
        landlordStore.createIndex('wechatStatus', 'wechatStatus', { unique: false })
        landlordStore.createIndex('contactStatus', 'contactStatus', { unique: false })
        landlordStore.createIndex('landlordType', 'landlordType', { unique: false })
        landlordStore.createIndex('isPerfect', 'isPerfect', { unique: false })
      }

      // 创建文件系统句柄存储
      if (!db.objectStoreNames.contains('fileSystemHandles')) {
        db.createObjectStore('fileSystemHandles', { keyPath: 'id' })
      }
    }
  })
}

// ========== 房东 CRUD 操作 ==========

/** 添加房东 */
export async function addLandlord(landlord: Landlord): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readwrite')
    const store = transaction.objectStore('landlords')
    const request = store.add(landlord)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** 获取所有房东 */
export async function getAllLandlords(): Promise<Landlord[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readonly')
    const store = transaction.objectStore('landlords')
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 根据 ID 获取房东 */
export async function getLandlordById(id: string): Promise<Landlord | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readonly')
    const store = transaction.objectStore('landlords')
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 更新房东 */
export async function updateLandlord(landlord: Landlord): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readwrite')
    const store = transaction.objectStore('landlords')
    const request = store.put(landlord)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** 删除房东 */
export async function deleteLandlord(id: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readwrite')
    const store = transaction.objectStore('landlords')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** 根据电话号码查找房东 */
export async function findLandlordsByPhone(phone: string): Promise<Landlord[]> {
  const allLandlords = await getAllLandlords()
  return allLandlords.filter(landlord =>
    landlord.phoneNumbers.includes(phone)
  )
}

// ========== 文件系统句柄操作 ==========

/** 保存文件系统句柄 */
export async function saveDirectoryHandle(
  id: string,
  handle: FileSystemDirectoryHandle,
  displayPath: string
): Promise<void> {
  const db = await openDatabase()
  
  const handleStore: FileSystemHandleStore = {
    id,
    handle,
    displayPath,
    lastAccess: new Date().toISOString()
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['fileSystemHandles'], 'readwrite')
    const store = transaction.objectStore('fileSystemHandles')
    const request = store.put(handleStore)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** 获取文件系统句柄 */
export async function getDirectoryHandle(id: string): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['fileSystemHandles'], 'readonly')
    const store = transaction.objectStore('fileSystemHandles')
    const request = store.get(id)

    request.onsuccess = () => {
      const result = request.result as FileSystemHandleStore | undefined
      resolve(result?.handle)
    }
    request.onerror = () => reject(request.error)
  })
}

/** 获取所有文件系统句柄 */
export async function getAllDirectoryHandles(): Promise<FileSystemHandleStore[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['fileSystemHandles'], 'readonly')
    const store = transaction.objectStore('fileSystemHandles')
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 删除文件系统句柄 */
export async function deleteDirectoryHandle(id: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['fileSystemHandles'], 'readwrite')
    const store = transaction.objectStore('fileSystemHandles')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ========== 批量操作 ==========

/** 批量添加房东 */
export async function batchAddLandlords(landlords: Landlord[]): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readwrite')
    const store = transaction.objectStore('landlords')

    let completed = 0
    const total = landlords.length

    landlords.forEach(landlord => {
      const request = store.add(landlord)
      request.onsuccess = () => {
        completed++
        if (completed === total) {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })

    if (total === 0) {
      resolve()
    }
  })
}

/** 清空所有房东数据 */
export async function clearAllLandlords(): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['landlords'], 'readwrite')
    const store = transaction.objectStore('landlords')
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
