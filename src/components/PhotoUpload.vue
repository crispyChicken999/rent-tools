<template>
  <div class="photo-upload">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>批量导入照片</span>
          <el-tag v-if="folderPath" type="success">{{ folderPath }}</el-tag>
        </div>
      </template>

      <div class="upload-section">
        <el-alert
          v-if="!isSupported"
          title="浏览器不支持"
          type="warning"
          description="当前浏览器不支持 File System Access API，请使用 Chrome 86+ 或 Edge 86+"
          :closable="false"
          show-icon
        />

        <div v-else class="button-group">
          <el-button
            type="primary"
            size="large"
            :icon="Folder"
            @click="selectFolder"
            :loading="scanning"
          >
            选择照片文件夹
          </el-button>

          <el-button
            v-if="folderPath"
            type="success"
            size="large"
            :icon="Refresh"
            @click="scanFolder"
            :loading="scanning"
          >
            扫描文件夹
          </el-button>
        </div>

        <el-progress
          v-if="scanning"
          :percentage="progress"
          :format="formatProgress"
        />

        <div v-if="scanResult" class="scan-result">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总文件数">
              {{ scanResult.total }}
            </el-descriptions-item>
            <el-descriptions-item label="成功导入">
              {{ scanResult.success }}
            </el-descriptions-item>
            <el-descriptions-item label="失败数">
              {{ scanResult.failed }}
            </el-descriptions-item>
            <el-descriptions-item label="用时">
              {{ scanResult.duration }}秒
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder, Refresh } from '@element-plus/icons-vue'
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  getValidDirectoryHandle,
  scanDirectory
} from '@/utils/fileSystem'
import { extractExif } from '@/utils/exif'
import { usePropertyStore } from '@/stores/property'
import type { Photo } from '@/types'

const propertyStore = usePropertyStore()

const isSupported = ref(isFileSystemAccessSupported())
const folderPath = ref('')
const scanning = ref(false)
const progress = ref(0)
const currentFile = ref(0)
const totalFiles = ref(0)

const scanResult = ref<{
  total: number
  success: number
  failed: number
  duration: number
} | null>(null)

let dirHandle: FileSystemDirectoryHandle | null = null

onMounted(async () => {
  // 尝试恢复已保存的文件夹访问权限
  const savedHandle = await getValidDirectoryHandle()
  if (savedHandle) {
    dirHandle = savedHandle
    folderPath.value = savedHandle.name
  }
})

async function selectFolder() {
  try {
    const result = await requestDirectoryAccess()
    dirHandle = result.handle
    folderPath.value = result.displayPath
    ElMessage.success('文件夹访问权限已授予')
  } catch (error: any) {
    if (error.message.includes('取消')) {
      ElMessage.info('已取消选择')
    } else {
      ElMessage.error(`选择文件夹失败: ${error.message}`)
    }
  }
}

async function scanFolder() {
  if (!dirHandle) {
    ElMessage.warning('请先选择文件夹')
    return
  }

  scanning.value = true
  scanResult.value = null
  const startTime = Date.now()

  try {
    // 扫描文件
    const files = await scanDirectory(dirHandle, (current, total) => {
      currentFile.value = current
      totalFiles.value = total
      progress.value = Math.round((current / total) * 100)
    })

    let successCount = 0
    let failedCount = 0

    // 处理每个文件
    for (const fileEntry of files) {
      try {
        if (fileEntry.type === 'image') {
          const file = await fileEntry.handle.getFile()
          const exifData = await extractExif(file)

          const photo: Photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileName: fileEntry.name,
            folderId: 'userPhotosFolder',
            captureTime: exifData.captureTime,
            gps: exifData.gps
          }

          // 自动建档
          await propertyStore.createLandlord({
            photos: [photo],
            gps: exifData.gps,
            captureTime: exifData.captureTime,
            folderId: 'userPhotosFolder'
          })

          successCount++
        }
      } catch (error) {
        console.error(`处理文件失败 ${fileEntry.name}:`, error)
        failedCount++
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    scanResult.value = {
      total: files.length,
      success: successCount,
      failed: failedCount,
      duration: Number(duration)
    }

    ElMessage.success(`扫描完成！成功导入 ${successCount} 个文件`)
  } catch (error: any) {
    ElMessage.error(`扫描失败: ${error.message}`)
  } finally {
    scanning.value = false
    progress.value = 0
  }
}

function formatProgress(percentage: number): string {
  return `${currentFile.value} / ${totalFiles.value}`
}
</script>

<style scoped>
.photo-upload {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.scan-result {
  margin-top: 20px;
}
</style>
