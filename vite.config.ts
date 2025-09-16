import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  build: {
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production' // 开发时关闭压缩，便于调试
  },
  css: {
    devSourcemap: process.env.NODE_ENV === 'development',
    preprocessorOptions: {
      less: {
        additionalData: `@import "@/styles/index.less";`
      }
    }
  },
  // 微信小程序特殊配置
  define: {
    __VUE_PROD_DEVTOOLS__: process.env.NODE_ENV === 'development'
  }
});
