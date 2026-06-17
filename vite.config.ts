// Vite 构建配置 - 太空列车物语
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // 设置 @ 别名指向 src 目录，方便模块导入
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',   // 监听所有网络接口
    port: 5173,         // 开发服务器端口
  },
});
