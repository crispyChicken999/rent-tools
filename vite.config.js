import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["pwa-icon.png", "logo.png", "vite.svg"],
            manifest: {
                name: "租房信息管理系统",
                short_name: "租房工具",
                description: "高效管理扫楼采集的租房信息，让找房变得更简单",
                theme_color: "#409EFF",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait-primary",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "/pwa-icon.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/pwa-icon.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/webapi\.amap\.com\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "amap-api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/restapi\.amap\.com\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "amap-rest-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false, // 开发环境不启用 PWA，避免缓存干扰
            },
        }),
    ],
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
