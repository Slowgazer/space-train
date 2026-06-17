import type { GameAction, NetworkCallbacks } from './types';

/**
 * 游戏网络抽象接口
 *
 * 游戏核心逻辑只依赖此接口，不关心底层是本地模拟还是远程服务器。
 * 后续开发联机功能时，只需实现 RemoteNetwork 继承此接口即可。
 */
export interface GameNetwork {
  connect(): Promise<void>;
  disconnect(): void;
  sendAction(action: GameAction): void;
  onCallbacks(callbacks: NetworkCallbacks): void;
}
