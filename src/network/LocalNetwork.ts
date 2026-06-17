import type { GameAction, NetworkCallbacks } from './types';
import type { GameNetwork } from './GameNetwork';

/**
 * 本地网络实现（单机调试）
 *
 * 在本地模拟网络行为，不走真实服务器。
 * 后续开发联机时，此文件可作为参考实现。
 */
export class LocalNetwork implements GameNetwork {
  private callbacks: NetworkCallbacks | null = null;

  async connect(): Promise<void> {
    console.log('[LocalNetwork] 已连接（本地模式）');
  }

  disconnect(): void {
    console.log('[LocalNetwork] 已断开');
  }

  sendAction(action: GameAction): void {
    console.log('[LocalNetwork] 发送操作:', action.type);
    this.callbacks?.onStateSync({
      tick: Date.now(),
      state: {},
      timestamp: Date.now(),
    });
  }

  onCallbacks(callbacks: NetworkCallbacks): void {
    this.callbacks = callbacks;
  }
}
