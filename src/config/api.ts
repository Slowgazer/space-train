/**
 * API 配置文件
 *
 * 所有服务器地址和密钥在此集中管理。
 * 联机功能开发时，只需修改此文件和 .env 即可切换环境。
 *
 * 环境变量前缀使用 VITE_ 以便 Vite 暴露给前端。
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  networkMode: import.meta.env.VITE_NETWORK_MODE || 'local', // 'local' | 'remote'
  timeout: 5000,
  reconnectInterval: 3000,
} as const;

export type NetworkMode = 'local' | 'remote';
