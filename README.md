# 租房信息管理系统

基于 Vue 3 + TypeScript + Vite 的纯前端本地应用，用于高效管理扫楼采集的租房信息。

## 功能特性

- 📸 **批量导入照片**：使用 File System Access API 直接访问本地照片文件夹
- 🗺️ **地图可视化**：基于高德地图展示房东位置，支持筛选
- 🏠 **房源管理**：完善的房东和房源信息管理
- 📊 **数据导出**：支持导出为 Excel 和 JSON 格式
- 💾 **离线存储**：使用 IndexedDB 实现本地数据持久化

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 浏览器要求

- Chrome 86+
- Edge 86+
- Opera 72+

注意：Firefox 和 Safari 暂不支持 File System Access API，需使用降级方案。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- 高德地图 JS API
- IndexedDB
- File System Access API

## 文档

详细需求文档见 `docs/完整项目需求文档_v2.md`
