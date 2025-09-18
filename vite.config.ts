import { defineConfig } from "vite";
import path from 'path';
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  build: {
    // sourcemap: process.env.NODE_ENV === 'development',
    // minify: process.env.NODE_ENV === 'production' // 开发时关闭压缩，便于调试
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        sourcemapPathTransform: (relativeSourcePath) => {
          // ✅ 保留原始路径，方便微信开发者工具回溯到源码
          return path.resolve(relativeSourcePath)
        }
      }
    }
  },
  css: {
    // devSourcemap: process.env.NODE_ENV === 'development',
    devSourcemap: true,
    preprocessorOptions: {
      less: {
        additionalData: `@import "@/styles/index.less";`
      }
    }
  },
  // 微信小程序特殊配置
  define: {
    // __VUE_PROD_DEVTOOLS__: process.env.NODE_ENV === 'development'
    __VUE_PROD_DEVTOOLS__: true
  }
});
