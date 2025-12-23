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

        <!-- PWA 安装按钮 -->
        <el-tooltip content="安装应用到桌面" placement="bottom">
          <el-button
            v-if="showInstallButton"
            id="btn-install-pwa"
            circle
            plain
            @click="handleInstallPWA"
          >
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99M17 19H7V5h10zm-4.2-5.78v1.75l3.2-2.99L12.8 9v1.7c-3.11.43-4.35 2.56-4.8 4.7c1.11-1.5 2.58-2.18 4.8-2.18"
                />
              </svg>
            </template>
          </el-button>
        </el-tooltip>

        <!-- PWA 卸载按钮 -->
        <el-tooltip content="卸载应用" placement="bottom">
          <el-button
            v-if="showUninstallButton"
            id="btn-uninstall-pwa"
            circle
            plain
            type="danger"
            @click="handleUninstallPWA"
          >
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99M17 19H7V5h10zm-1.5-7.5v-1h-7v1h1.75v4.75h3.5V11.5z"
                />
              </svg>
            </template>
          </el-button>
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

        <el-tooltip placement="bottom">
          <template #content>
            <div style="text-align: center">
              <p style="margin: 0 0 4px 0"><b>⭐ 开源项目</b></p>
              <p style="margin: 0; font-size: 12px">
                觉得好用的话，欢迎给个 Star 支持一下~
              </p>
            </div>
          </template>
          <el-button id="btn-github" circle plain @click="openGitHub">
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
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
import { ref, onMounted, h } from "vue";
import { ElMessageBox } from "element-plus";
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

// 打开 GitHub 仓库
const openGitHub = () => {
  window.open("https://github.com/crispyChicken999/rent-tools", "_blank");
};

// PWA 安装卸载相关
const showInstallButton = ref(false);
const showUninstallButton = ref(false);
let deferredPrompt: any = null;

onMounted(() => {
  // 检查是否已安装为 PWA
  const checkIfInstalled = () => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;

    if (isStandalone || isInWebAppiOS) {
      showUninstallButton.value = true;
      showInstallButton.value = false;
    }
  };

  checkIfInstalled();

  // 监听 beforeinstallprompt 事件
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!showUninstallButton.value) {
      showInstallButton.value = true;
    }
  });

  // 监听应用安装成功事件
  window.addEventListener("appinstalled", () => {
    showInstallButton.value = false;
    showUninstallButton.value = true;
    deferredPrompt = null;
  });
});

// 处理 PWA 安装
const handleInstallPWA = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") {
    console.log("用户接受了安装");
  }
  deferredPrompt = null;
};

// 处理 PWA 卸载
const handleUninstallPWA = () => {
  const isChrome =
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(navigator.userAgent);

  let content;

  if (isChrome) {
    content = h("div", { style: "line-height: 1.8" }, [
      h(
        "p",
        { style: "font-weight: bold; margin-bottom: 12px" },
        "Chrome 浏览器卸载方法："
      ),
      h("div", { style: "margin-bottom: 16px" }, [
        h("p", { style: "font-weight: 500; margin-bottom: 8px" }, "方法一："),
        h("ol", { style: "margin: 0; padding-left: 20px" }, [
          h("li", "点击地址栏右侧的应用图标"),
          h("li", '选择"卸载"或"从 Chrome 中移除"'),
        ]),
      ]),
      h("div", [
        h("p", { style: "font-weight: 500; margin-bottom: 8px" }, "方法二："),
        h("ol", { style: "margin: 0; padding-left: 20px" }, [
          h("li", [
            "在地址栏输入 ",
            h(
              "code",
              {
                style:
                  "background: #f5f7fa; padding: 2px 6px; border-radius: 3px; color: #409EFF; font-family: monospace; user-select: all;",
              },
              "chrome://apps"
            ),
            " 并回车",
          ]),
          h("li", '右键点击"租房信息管理系统"应用图标'),
          h("li", '选择"从 Chrome 中移除"'),
        ]),
      ]),
    ]);
  } else if (isEdge) {
    content = h("div", { style: "line-height: 1.8" }, [
      h(
        "p",
        { style: "font-weight: bold; margin-bottom: 12px" },
        "Edge 浏览器卸载方法："
      ),
      h("div", { style: "margin-bottom: 16px" }, [
        h("p", { style: "font-weight: 500; margin-bottom: 8px" }, "方法一："),
        h("ol", { style: "margin: 0; padding-left: 20px" }, [
          h("li", "点击地址栏右侧的应用图标"),
          h("li", '选择"卸载"'),
        ]),
      ]),
      h("div", [
        h("p", { style: "font-weight: 500; margin-bottom: 8px" }, "方法二："),
        h("ol", { style: "margin: 0; padding-left: 20px" }, [
          h("li", [
            "在地址栏输入 ",
            h(
              "code",
              {
                style:
                  "background: #f5f7fa; padding: 2px 6px; border-radius: 3px; color: #409EFF; font-family: monospace; user-select: all;",
              },
              "edge://apps"
            ),
            " 并回车",
          ]),
          h("li", '右键点击"租房信息管理系统"应用图标'),
          h("li", '选择"卸载"'),
        ]),
      ]),
    ]);
  } else {
    content = h(
      "p",
      { style: "line-height: 1.8" },
      "请在浏览器的应用管理中找到此应用并卸载。"
    );
  }

  ElMessageBox.confirm(content, "如何卸载应用", {
    confirmButtonText: "我知道了",
    showCancelButton: false,
    type: "info",
    dangerouslyUseHTMLString: false,
  });
};
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
