<template>
  <div class="toolbar">
    <div class="logo">
      <h1>📍 租房信息管理系统</h1>
    </div>
    <el-scrollbar>
      <div class="actions">
        <el-button
          id="btn-import-photos"
          type="primary"
          @click="emit('import-photos')"
          :icon="Upload"
        >
          批量导入照片
        </el-button>

        <!-- 视图切换按钮 -->
        <el-radio-group v-model="propertyStore.viewMode" id="btn-list-mode">
          <el-tooltip placement="bottom" content="房东视图">
            <el-radio-button label="landlord">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5m8 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"
                />
              </svg>
            </el-radio-button>
          </el-tooltip>

          <el-tooltip placement="bottom" content="房源视图">
            <el-radio-button label="property">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="m11.997 1.658l10.416 9.259l-1.329 1.495l-1.083-.963v10.55H15.5V15h-7v7H4V11.454l-1.093.957l-1.317-1.505L6 7.046V3h2v2.254z"
                />
                <path fill="currentColor" d="M10.5 22v-5h3v5z" />
              </svg>
            </el-radio-button>
          </el-tooltip>
        </el-radio-group>

        <el-tooltip content="导出Excel" placement="bottom">
          <el-button
            id="btn-export-excel"
            :icon="Document"
            circle
            @click="emit('export')"
            type="success"
            plain
            :disabled="propertyStore.landlords.length === 0"
          />
        </el-tooltip>

        <el-tooltip placement="bottom">
          <template #content>
            <p><b>导入备份</b></p>
            <p>需选择存放照片的文件夹（不然图片加载不出来）</p>
            <p>点击「批量导入图片」-「选择照片文件夹」</p>
            <p>然后选择之前导出的备份文件</p>
          </template>
          <el-button
            id="btn-backup-import"
            :icon="Upload"
            circle
            type="primary"
            plain
            @click="emit('import-backup')"
          />
        </el-tooltip>

        <el-tooltip content="导出备份（JSON文件）" placement="bottom">
          <el-button
            id="btn-backup"
            :icon="Download"
            circle
            plain
            type="warning"
            @click="emit('backup')"
            :disabled="propertyStore.landlords.length === 0"
          />
        </el-tooltip>

        <!-- 房东视图筛选按钮 -->
        <el-tooltip content="筛选房东" placement="bottom">
          <el-button
            v-if="propertyStore.viewMode === 'landlord'"
            id="btn-filter"
            :icon="Filter"
            @click="emit('filter-landlord')"
            type="primary"
            plain
            circle
          />
        </el-tooltip>

        <!-- 房源视图筛选按钮 -->
        <el-tooltip content="筛选房源" placement="bottom">
          <el-button
            v-if="propertyStore.viewMode === 'property'"
            :icon="Filter"
            @click="emit('filter-property')"
            id="btn-filter"
            type="primary"
            plain
            circle
          />
        </el-tooltip>

        <el-tag type="info">
          共 {{ propertyStore.landlords.length }} 个房东
        </el-tag>

        <el-tooltip content="设置" placement="bottom">
          <el-button
            id="btn-settings"
            :icon="Setting"
            circle
            plain
            @click="emit('settings')"
          />
        </el-tooltip>

        <el-tooltip content="使用说明" placement="bottom">
          <el-button id="btn-tour" circle plain @click="emit('tour')">
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 16 16"
              >
                <path
                  fill="currentColor"
                  d="m9.708 6.075l-3.024.379l-.108.502l.595.108c.387.093.464.232.38.619l-.975 4.577c-.255 1.183.14 1.74 1.067 1.74c.72 0 1.554-.332 1.933-.789l.116-.549c-.263.232-.65.325-.905.325c-.363 0-.494-.255-.402-.704zm.091-2.755a1.32 1.32 0 1 1-2.64 0a1.32 1.32 0 0 1 2.64 0"
                />
              </svg>
            </template>
          </el-button>
        </el-tooltip>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import {
  Upload,
  Filter,
  Setting,
  Download,
  Document,
} from "@element-plus/icons-vue";
import { usePropertyStore } from "@/stores/property";

const propertyStore = usePropertyStore();

const emit = defineEmits<{
  "import-photos": [];
  export: [];
  "import-backup": [];
  backup: [];
  tour: [];
  settings: [];
  "filter-landlord": [];
  "filter-property": [];
}>();
</script>

<style lang="scss" scoped>
.toolbar {
  height: 60px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  padding: 0 12px;
  gap: 12px;
}

.logo h1 {
  font-size: 20px;
  color: #409eff;
  margin: 0;
  white-space: nowrap;
}

:deep(.el-radio-button__inner) {
  padding: 4px 8px;
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  .el-radio-group {
    flex-wrap: nowrap;
  }
  .el-button:not(:first-of-type) {
    margin-left: 0;
    font-size: 16px;
  }
}
</style>
