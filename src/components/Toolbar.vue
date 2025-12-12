<template>
  <div class="toolbar">
    <div class="logo">
      <h1>📍 租房信息管理系统</h1>
    </div>
    <div class="actions">
      <!-- 视图切换按钮 -->
      <el-radio-group
        v-model="propertyStore.viewMode"
        size="default"
        style="margin-right: 12px"
      >
        <el-radio-button label="landlord">房东视图</el-radio-button>
        <el-radio-button label="property">房源视图</el-radio-button>
      </el-radio-group>

      <el-button
        id="btn-import-photos"
        type="primary"
        @click="emit('import-photos')"
        :icon="Upload"
      >
        批量导入照片
      </el-button>

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

      <el-tooltip content="使用说明" placement="bottom">
        <el-button
          id="btn-tour"
          :icon="QuestionFilled"
          circle
          plain
          @click="emit('tour')"
        />
      </el-tooltip>

      <el-tooltip content="设置" placement="bottom">
        <el-button
          id="btn-settings"
          :icon="Setting"
          circle
          plain
          @click="emit('settings')"
        />
      </el-tooltip>

      <el-tag type="info">
        共 {{ propertyStore.landlords.length }} 个房东
      </el-tag>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Upload,
  Filter,
  Setting,
  QuestionFilled,
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
  padding: 0 24px;
  z-index: 100;
}

.logo h1 {
  font-size: 20px;
  color: #409eff;
  margin: 0;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.actions .el-button {
  margin-left: 0;
  font-size: 16px;
}
</style>
