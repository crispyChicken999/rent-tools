<p align="center">
  <img src="public/logo.png" alt="Rent Tools Logo" width="180" height="180" />
</p>

<h1 align="center">🏠 租房信息管理系统</h1>

<p align="center">
  <strong>高效管理扫楼采集的租房信息，让找房变得更简单</strong>
</p>

<p align="center">
  基于 Vue 3 + TypeScript + Vite 的纯前端本地应用，无需后端服务器，数据完全本地化存储
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4+-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Element_Plus-2.9+-409EFF?style=for-the-badge&logo=element&logoColor=white" alt="Element Plus" />
</p>

<p align="center">
  <a href="https://rent-tools.netlify.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀_在线体验-点击立即使用-FF6B6B?style=for-the-badge" alt="在线体验" />
  </a>
</p>

## 📖 目录

- [📖 目录](#-目录)
- [✨ 功能特性](#-功能特性)
  - [📸 智能照片导入](#-智能照片导入)
  - [🗺️ 地图可视化](#️-地图可视化)
  - [🏠 房源管理](#-房源管理)
  - [📊 数据导出](#-数据导出)
  - [💾 离线存储](#-离线存储)
  - [🔍 高级筛选](#-高级筛选)
- [🎯 核心工作流](#-核心工作流)
- [📚 使用指南](#-使用指南)
  - [1. 首次使用](#1-首次使用)
  - [2. 导入照片](#2-导入照片)
  - [3. 补录信息](#3-补录信息)
  - [4. 数据管理](#4-数据管理)
  - [拍照建议](#拍照建议)
- [🖼️ 界面预览](#️-界面预览)
- [🚀 快速开始](#-快速开始)
  - [环境要求](#环境要求)
  - [一键启动](#一键启动)
- [📦 安装](#-安装)
  - [使用 pnpm（推荐）](#使用-pnpm推荐)
  - [使用 npm](#使用-npm)
  - [使用 yarn](#使用-yarn)
- [💻 开发](#-开发)
  - [开发模式](#开发模式)
  - [构建生产版本](#构建生产版本)
  - [预览生产版本](#预览生产版本)
  - [类型检查](#类型检查)
- [🔧 配置](#-配置)
  - [高德地图 API](#高德地图-api)
  - [Vite 配置](#vite-配置)
- [📁 项目结构](#-项目结构)
- [🛠️ 技术栈](#️-技术栈)
- [🌐 浏览器要求](#-浏览器要求)
- [🔮 未来规划](#-未来规划)
  - [近期计划](#近期计划)
  - [中期规划](#中期规划)
  - [长期展望](#长期展望)
- [❓ 常见问题](#-常见问题)
- [🤝 贡献指南](#-贡献指南)
  - [提交 Issue](#提交-issue)
  - [提交 PR](#提交-pr)
  - [开发规范](#开发规范)
- [📄 许可证](#-许可证)

---

## ✨ 功能特性

### 📸 智能照片导入

- **批量导入照片**：使用 File System Access API 直接访问本地照片文件夹，无需复制文件
- **EXIF 信息提取**：自动读取 GPS 坐标和拍摄时间
- **持久化访问**：保存文件夹访问权限，后续无需重复授权
- **自动建档**：导入时自动创建"待完善"房东记录，无需即时填写信息

### 🗺️ 地图可视化

- **高德地图集成**：基于高德地图 JS API 展示房东位置
- **智能标记**：根据房东类型显示不同颜色标记（一手房东 🟢、二手房东 🔵、中介 🔴）
- **地图圈选**：支持在地图上圈选区域进行批量操作
- **标记聚合**：密集区域自动聚合，点击展开查看

### 🏠 房源管理

- **多房源支持**：每个房东可关联多个房源
- **完善的信息字段**：房型、租金、楼层、朝向、家电配置等
- **费用标准管理**：押金方式、水电费、网费、管理费等
- **房源收藏**：一键收藏心仪房源

### 📊 数据导出

- **Excel 导出**：适配新的字段结构，便于分享和整理
- **JSON 备份**：完整导出数据库内容，用于数据迁移和备份

### 💾 离线存储

- **IndexedDB 存储**：使用浏览器原生数据库实现本地数据持久化
- **无需服务器**：纯前端应用，数据完全本地化

### 🔍 高级筛选

- **多维度筛选**：按微信状态、联系状态、房东类型筛选
- **全局搜索**：支持电话号码、地址、备注等多字段搜索
- **虚拟滚动**：大量数据也能流畅滚动

---

## 🎯 核心工作流

```
批量拍摄招租广告 → 批量导入系统 → 自动提取位置 → 后期人工补录详情 → 地图可视化筛选与管理
```

1. **批量采集**：在实地拍摄大量招租广告照片
2. **首次设置**：选择照片所在文件夹，系统请求持久化访问权限
3. **批量导入**：扫描文件夹，自动读取 EXIF 信息并建档
4. **后期补录**：空闲时间查看照片，手动录入电话、房源详情
5. **数据清洗**：自动检测重复电话，支持合并或独立记录

---

## 📚 使用指南

> 💡 **推荐**：访问 [在线体验](https://rent-tools.netlify.app/)，点击工具栏中的 **「使用说明」** 按钮，即可查看完整的交互式使用教程！

### 1. 首次使用

1. 打开应用，点击 **"选择照片文件夹"**
2. 选择存放租房照片的本地文件夹
3. 授权浏览器访问该文件夹（权限会被保存）

### 2. 导入照片

1. 点击 **"扫描文件夹"**
2. 系统会自动：
   - 遍历文件夹中的图片/视频
   - 提取 EXIF 信息（GPS、拍摄时间）
   - 创建"待完善"的房东记录
   - 在地图上显示位置标记

### 3. 补录信息

1. 在列表或地图中点击房东记录
2. 查看高清大图，识别电话号码
3. 手动录入电话、房源详情等信息
4. 系统会自动检测重复电话并提示

### 4. 数据管理

- **筛选**：使用筛选器按状态、类型筛选
- **搜索**：全局搜索电话、地址
- **导出**：导出 Excel 或 JSON 备份
- **地图操作**：圈选、拖拽标记调整位置

### 拍照建议

为确保照片包含正确的位置信息：

- ✅ **使用原生相机 APP** 拍摄，保留完整 EXIF 信息
- ❌ **避免微信/QQ 传输**，会清除 GPS 数据
- ✅ **推荐传输方式**：
  - AirDrop（iOS/Mac）
  - 数据线直连
  - 云盘原图上传（OneDrive/iCloud）

---

## 🖼️ 界面预览

> 💡 项目运行后可查看完整界面

- **主页面**：左侧房东列表 + 右侧地图可视化
- **详情面板**：滑出式抽屉展示房东/房源详细信息
- **照片查看器**：支持缩放、平移的高清图片浏览

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0（推荐）或 npm >= 9.0.0

### 一键启动

```bash
# 克隆项目
git clone https://github.com/crispyChicken999/rent-tools.git
cd rent-tools

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:5173 即可查看应用。

---

## 📦 安装

### 使用 pnpm（推荐）

```bash
pnpm install
```

### 使用 npm

```bash
npm install
```

### 使用 yarn

```bash
yarn install
```

---

## 💻 开发

### 开发模式

```bash
pnpm dev
```

启动开发服务器，支持热更新。

### 构建生产版本

```bash
pnpm build
```

构建产物位于 `dist/` 目录。

### 预览生产版本

```bash
pnpm preview
```

本地预览构建后的生产版本。

### 类型检查

```bash
pnpm vue-tsc -b
```

---

## 🔧 配置

### 高德地图 API

本项目使用高德地图 JS API，需要配置 API Key。在 `src/components/MapView.vue` 中配置：

```typescript
const AMAP_KEY = "your-amap-key";
const AMAP_SECURITY_CODE = "your-security-code";
```

如需获取 API Key，请访问 [高德开放平台](https://lbs.amap.com/)。

### Vite 配置

项目配置文件位于 `vite.config.ts`，可根据需要调整构建配置。

---

## 📁 项目结构

```
rent-tools/
├── 📂 docs/                          # 项目文档
│   ├── 完整项目需求文档_v2.md        # 完整需求文档
│   ├── 快速启动指南.md               # 快速启动指南
│   ├── 房源浏览功能设计文档.md       # 功能设计文档
│   └── ...                           # 其他功能说明文档
├── 📂 public/                        # 静态资源
│   └── vite.svg
├── 📂 src/                           # 源代码
│   ├── 📂 components/                # Vue 组件
│   │   ├── CompactPropertyItem.vue   # 紧凑房源项
│   │   ├── LandlordAvatar.vue        # 房东头像组件
│   │   ├── LandlordFilter.vue        # 房东筛选器
│   │   ├── LandlordList.vue          # 房东列表
│   │   ├── MapView.vue               # 高德地图组件
│   │   ├── PhotoUpload.vue           # 照片上传/扫描组件
│   │   ├── PropertyCard.vue          # 房源卡片
│   │   ├── PropertyDetail.vue        # 房源详情抽屉
│   │   ├── PropertyDetailPage.vue    # 房源详情页
│   │   ├── PropertyFilter.vue        # 房源筛选器
│   │   ├── PropertyList.vue          # 房源列表
│   │   └── Toolbar.vue               # 工具栏
│   ├── 📂 stores/                    # Pinia 状态管理
│   │   └── property.ts               # 房产状态管理
│   ├── 📂 types/                     # TypeScript 类型定义
│   │   └── index.ts                  # 主类型定义文件
│   ├── 📂 utils/                     # 工具函数
│   │   ├── exif.ts                   # EXIF 提取 + 坐标转换
│   │   ├── export.ts                 # Excel/JSON 导出
│   │   ├── fileSystem.ts             # File System Access API 封装
│   │   ├── geocode.ts                # 逆地理编码
│   │   ├── phoneLocation.ts          # 手机号归属地查询
│   │   └── storage.ts                # IndexedDB 操作
│   ├── App.vue                       # 主应用组件
│   ├── main.ts                       # 入口文件
│   ├── style.css                     # 全局样式
│   └── vite-env.d.ts                 # Vite 环境类型
├── index.html                        # HTML 入口
├── package.json                      # 项目配置
├── tsconfig.json                     # TypeScript 配置
├── tsconfig.node.json                # Node TypeScript 配置
├── vite.config.ts                    # Vite 配置
└── README.md                         # 项目说明（本文件）
```

---

## 🛠️ 技术栈

| 分类        | 技术                   | 版本         | 用途                  |
| ----------- | ---------------------- | ------------ | --------------------- |
| 🖼️ 框架     | Vue 3                  | 3.4+         | 响应式 UI 框架        |
| 📝 语言     | TypeScript             | 5.3+         | 类型安全              |
| ⚡ 构建     | Vite                   | 5.0+         | 开发服务器 + 构建工具 |
| 🎨 UI 库    | Element Plus           | 2.9+         | 组件库                |
| 🗺️ 地图     | 高德地图 JS API        | v2.0         | 地图展示、逆地理编码  |
| 📦 状态     | Pinia                  | 2.2+         | 全局状态管理          |
| 💾 存储     | IndexedDB              | 原生 API     | 本地数据持久化        |
| 📷 EXIF     | exifr                  | 7.1+         | GPS/时间提取          |
| 📊 导出     | xlsx                   | 0.18+        | Excel 文件生成        |
| 📜 虚拟滚动 | vue-virtual-scroller   | 2.0.0-beta.8 | 大列表性能优化        |
| 📁 文件访问 | File System Access API | 原生 API     | 持久化文件夹访问      |

---

## 🌐 浏览器要求

本项目使用 File System Access API 实现本地文件夹访问，需要现代浏览器支持：

| 浏览器  | 最低版本 | 支持状态            |
| ------- | -------- | ------------------- |
| Chrome  | 86+      | ✅ 完全支持         |
| Edge    | 86+      | ✅ 完全支持         |
| Opera   | 72+      | ✅ 完全支持         |
| Firefox | -        | ⚠️ 需启用实验性功能 |
| Safari  | -        | ❌ 暂不支持         |

> **注意**：对于不支持 File System Access API 的浏览器，系统会自动降级到传统文件选择器模式，但每次查看都需重新选择文件。建议使用 Chrome/Edge 以获得最佳体验。

---

## 🔮 未来规划

### 近期计划

- [ ] 📸 多照片管理：每个房东支持关联多张照片
- [ ] 🎥 视频功能完善：视频缩略图、多视频支持
- [ ] 🗺️ 热力图模式：可视化房源密度分布
- [ ] 📊 数据分析仪表盘：统计卡片、图表可视化

### 中期规划

- [ ] 🏷️ 标签系统：自定义标签分类
- [ ] 🔍 智能搜索：全文搜索、模糊匹配
- [ ] 📱 移动端优化：响应式布局、PWA 支持
- [ ] 🔔 提醒功能：待联系提醒、备份提醒

### 长期展望

- [ ] 🤖 智能推荐：基于偏好推荐房源
- [ ] 👥 协同工作：多人共同扫楼、数据同步
- [ ] 🧠 AI 辅助：智能地址补全、OCR 识别

---

## ❓ 常见问题

<details>
<summary><strong>Q1: 为什么不把照片复制到项目目录？</strong></summary>

为避免文件重复占用空间，用户可以继续用其他软件管理照片。系统只存储文件引用，不复制文件内容。

</details>

<details>
<summary><strong>Q2: 文件夹权限会过期吗？</strong></summary>

浏览器重启后权限仍然有效（已序列化存储），除非用户手动撤销或清除浏览器数据。

</details>

<details>
<summary><strong>Q3: 不支持的浏览器怎么办？</strong></summary>

系统会自动降级到传统文件选择器模式，但每次查看都需重新选择文件。建议使用 Chrome 或 Edge 浏览器。

</details>

<details>
<summary><strong>Q4: 可以同时管理多个文件夹吗？</strong></summary>

可以，系统支持保存多个文件夹的访问权限。

</details>

<details>
<summary><strong>Q5: 数据会丢失吗？</strong></summary>

IndexedDB 数据持久化存储，除非用户清除浏览器数据或手动删除。建议定期使用导出功能进行备份。

</details>

<details>
<summary><strong>Q6: 照片没有 GPS 信息怎么办？</strong></summary>

如果照片没有 EXIF GPS 数据，记录会被标记为"位置未知"。您可以在地图上手动标记位置或输入地址。

</details>

<details>
<summary><strong>Q7: 高德地图 API 有调用限制吗？</strong></summary>

个人开发者每日限额 30 万次，每秒 300 次并发。系统已实现缓存策略，正常使用不会超限。

</details>

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

### 提交 Issue

1. 检查是否已存在相同问题
2. 使用清晰的标题描述问题
3. 提供详细的复现步骤
4. 附上浏览器版本和操作系统信息

### 提交 PR

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 开发规范

- 使用 TypeScript 编写代码
- 遵循 Vue 3 Composition API 风格
- 组件使用 `<script setup>` 语法
- 提交信息使用语义化格式

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。详情请查看 [LICENSE](LICENSE) 文件。

---

<p align="center">
  Made with ❤️ for finding the perfect rental
</p>

<p align="center">
  <a href="#-目录">回到顶部 ⬆️</a>
</p>
