/**
 * 网络层工厂函数
 *
 * 根据配置自动选择本地或远程网络实现。
 * 游戏入口只需调用 getNetwork()，无需关心具体实现。
 */
import { API_CONFIG, type NetworkMode } from '../config/api';
import { LocalNetwork } from './LocalNetwork';
import type { GameNetwork } from './GameNetwork';

export function getNetwork(): GameNetwork {
  const mode: NetworkMode = API_CONFIG.networkMode as NetworkMode;

  switch (mode) {
    case 'local':
    default:
      return new LocalNetwork();
    // case 'remote':
    //   return new RemoteNetwork(); // 后续联机时实现
  }
}
