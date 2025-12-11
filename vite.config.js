import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    "vue-vendor": ["vue", "pinia"],
                    "element-plus": ["element-plus", "@element-plus/icons-vue"],
                    xlsx: ["xlsx"],
                    amap: ["@amap/amap-jsapi-loader"],
                    exifr: ["exifr"],
                },
            },
        },
    },
});
