/** 小游戏公共类型 */
export interface MiniGameCallbacks {
  onComplete: (reward: number) => void;
  addEvolutionResource: (amount: number) => void;
}
