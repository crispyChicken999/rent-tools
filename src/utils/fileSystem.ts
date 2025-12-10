import { saveDirectoryHandle, getDirectoryHandle } from './storage'

/** 检查浏览器是否支持 File System Access API */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window
}

/** 请求用户选择文件夹并获取持久化访问权限 */
export async function requestDirectoryAccess(id: string = 'userPhotosFolder'): Promise<{
  handle: FileSystemDirectoryHandle
  displayPath: string
}> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('当前浏览器不支持 File System Access API，请使用 Chrome 86+ 或 Edge 86+')
  }

  try {
    // 请求目录访问权限（只读模式）
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    })

    // 尝试获取用户友好的路径显示
    const displayPath = dirHandle.name || '用户选择的文件夹'

    // 保存到 IndexedDB
    await saveDirectoryHandle(id, dirHandle, displayPath)

    return { handle: dirHandle, displayPath }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('用户取消了文件夹选择')
    }
    throw error
  }
}

/** 验证已保存的文件夹权限是否仍然有效 */
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  withWrite: boolean = false
): Promise<boolean> {
  const mode = withWrite ? 'readwrite' : 'read'
  
  const options: any = { mode }
  
  // 检查当前权限状态
  if ((await handle.queryPermission(options)) === 'granted') {
    return true
  }

  // 尝试请求权限
  if ((await handle.requestPermission(options)) === 'granted') {
    return true
  }

  return false
}

/** 获取已保存的文件夹句柄并验证权限 */
export async function getValidDirectoryHandle(id: string = 'userPhotosFolder'): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await getDirectoryHandle(id)
    
    if (!handle) {
      return null
    }

    // 验证权限
    const hasPermission = await verifyPermission(handle)
    
    if (!hasPermission) {
      console.warn('文件夹访问权限已失效，需要重新授权')
      return null
    }

    return handle
  } catch (error) {
    console.error('获取文件夹句柄失败:', error)
    return null
  }
}

/** 扫描文件夹中的所有图片和视频文件 */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{
  name: string
  handle: FileSystemFileHandle
  type: 'image' | 'video'
}>> {
  const files: Array<{
    name: string
    handle: FileSystemFileHandle
    type: 'image' | 'video'
  }> = []

  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i
  const videoExtensions = /\.(mp4|mov|avi|mkv|wmv|flv)$/i

  // 第一遍：统计总数
  let totalCount = 0
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const name = entry.name
      if (imageExtensions.test(name) || videoExtensions.test(name)) {
        totalCount++
      }
    }
  }

  // 第二遍：收集文件
  let currentCount = 0
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const name = entry.name
      let type: 'image' | 'video' | null = null

      if (imageExtensions.test(name)) {
        type = 'image'
      } else if (videoExtensions.test(name)) {
        type = 'video'
      }

      if (type) {
        files.push({
          name,
          handle: entry as FileSystemFileHandle,
          type
        })

        currentCount++
        if (onProgress) {
          onProgress(currentCount, totalCount)
        }
      }
    }
  }

  return files
}

/** 从文件句柄获取 File 对象 */
export async function getFileFromHandle(handle: FileSystemFileHandle): Promise<File> {
  return await handle.getFile()
}

/** 生成文件的 Blob URL */
export async function createBlobUrlFromHandle(handle: FileSystemFileHandle): Promise<string> {
  const file = await getFileFromHandle(handle)
  return URL.createObjectURL(file)
}

/** 通过文件名从目录句柄中获取文件 */
export async function getFileByName(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<File | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName)
    return await fileHandle.getFile()
  } catch (error) {
    console.error(`文件 ${fileName} 不存在或无法访问:`, error)
    return null
  }
}

/** 批量获取文件的 Blob URLs */
export async function batchCreateBlobUrls(
  dirHandle: FileSystemDirectoryHandle,
  fileNames: string[]
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>()

  for (const fileName of fileNames) {
    try {
      const file = await getFileByName(dirHandle, fileName)
      if (file) {
        const blobUrl = URL.createObjectURL(file)
        urlMap.set(fileName, blobUrl)
      }
    } catch (error) {
      console.error(`无法创建 ${fileName} 的 Blob URL:`, error)
    }
  }

  return urlMap
}

/** 释放 Blob URL 资源 */
export function revokeBlobUrl(url: string) {
  URL.revokeObjectURL(url)
}

/** 批量释放 Blob URLs */
export function revokeBlobUrls(urls: string[]) {
  urls.forEach(url => URL.revokeObjectURL(url))
}

/** 降级方案：传统文件选择器（返回 File 对象数组）*/
export async function selectFilesLegacy(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*,video/*'

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) {
        resolve(Array.from(target.files))
      } else {
        resolve([])
      }
    }

    input.oncancel = () => {
      resolve([])
    }

    input.click()
  })
}

/** 确保子目录存在，不存在则创建 */
export async function ensureDirectory(
  parentHandle: FileSystemDirectoryHandle,
  dirName: string
): Promise<FileSystemDirectoryHandle> {
  return await parentHandle.getDirectoryHandle(dirName, { create: true });
}

/** 将文件保存到指定目录 */
export async function saveFileToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  file: File,
  fileName?: string
): Promise<string> {
  const name = fileName || file.name;
  // 获取文件句柄（如果不存在则创建）
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  
  // 创建可写流
  // @ts-ignore - FileSystemFileHandle.createWritable is not yet in all TS definitions
  const writable = await fileHandle.createWritable();
  
  // 写入内容
  await writable.write(file);
  
  // 关闭文件
  await writable.close();
  
  return name;
}

/** 扫描指定目录下的文件 */
export async function scanSubdirectory(
  dirHandle: FileSystemDirectoryHandle,
  subDirName: string,
  types: ('image' | 'video')[] = ['image', 'video']
): Promise<string[]> {
  try {
    const subDir = await dirHandle.getDirectoryHandle(subDirName, { create: false });
    const files: string[] = [];
    
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    const videoExtensions = /\.(mp4|mov|avi|mkv|wmv|flv)$/i;

    for await (const entry of subDir.values()) {
      if (entry.kind === 'file') {
        const name = entry.name;
        let isMatch = false;
        
        if (types.includes('image') && imageExtensions.test(name)) isMatch = true;
        if (types.includes('video') && videoExtensions.test(name)) isMatch = true;
        
        if (isMatch) {
          files.push(name);
        }
      }
    }
    return files;
  } catch (e) {
    // 目录可能不存在
    return [];
  }
}

/** 根据路径获取文件 (支持 "folder/file.ext" 格式) */
export async function getFileByPath(
  rootHandle: FileSystemDirectoryHandle,
  path: string
): Promise<File | null> {
  try {
    const parts = path.split(/[/\\]/);
    let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = rootHandle;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      
      if (i === parts.length - 1) {
        // 最后一个部分是文件
        if (currentHandle.kind !== 'directory') return null;
        const fileHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(part);
        return await fileHandle.getFile();
      } else {
        // 中间部分是目录
        if (currentHandle.kind !== 'directory') return null;
        currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(part);
      }
    }
    return null;
  } catch (e) {
    // console.error(`无法获取文件: ${path}`, e);
    return null;
  }
}

/** 删除文件 */
export async function deleteFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  try {
    await dirHandle.removeEntry(fileName);
  } catch (error) {
    console.error(`删除文件 ${fileName} 失败:`, error);
    throw error;
  }
}

/** 将文件移动到回收站 (.trash 文件夹) */
export async function moveToTrash(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  try {
    // 1. 获取或创建 .trash 目录
    // 注意：有些文件系统可能不允许创建以 . 开头的文件夹，如果失败可以尝试 'trash'
    let trashHandle: FileSystemDirectoryHandle;
    try {
      trashHandle = await dirHandle.getDirectoryHandle('.trash', { create: true });
    } catch (e) {
      trashHandle = await dirHandle.getDirectoryHandle('trash_bin', { create: true });
    }

    // 2. 获取源文件句柄
    const sourceHandle = await dirHandle.getFileHandle(fileName);
    const sourceFile = await sourceHandle.getFile();

    // 3. 生成新文件名 (避免冲突)
    // 格式: YYYYMMDD-HHmmss_原始文件名
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const newFileName = `${timestamp}_${fileName}`;

    // 4. 在 .trash 中创建新文件
    const newFileHandle = await trashHandle.getFileHandle(newFileName, { create: true });
    const writable = await newFileHandle.createWritable();

    // 5. 写入内容
    await writable.write(sourceFile);
    await writable.close();

    // 6. 删除源文件
    await dirHandle.removeEntry(fileName);

  } catch (error) {
    console.error(`移动文件 ${fileName} 到回收站失败:`, error);
    // 如果移动失败，不执行删除，抛出错误
    throw error;
  }
}
