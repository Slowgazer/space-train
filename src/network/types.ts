/**
 * 网络层类型定义
 *
 * 所有游戏网络交互的数据格式在此定义。
 * 后续联机时，前后端共用此类型定义。
 */

/** 游戏操作（玩家输入） */
export interface GameAction {
  type: string;
  payload: unknown;
  timestamp: number;
}

/** 游戏状态同步（服务端 -> 客户端） */
export interface GameStateSync {
  tick: number;
  state: Record<string, unknown>;
  timestamp: number;
}

/** 房间信息 */
export interface RoomInfo {
  id: string;
  players: string[];
  maxPlayers: number;
}

/** 网络事件回调 */
export interface NetworkCallbacks {
  onStateSync: (data: GameStateSync) => void;
  onPlayerJoin: (playerId: string) => void;
  onPlayerLeave: (playerId: string) => void;
  onError: (error: Error) => void;
}
