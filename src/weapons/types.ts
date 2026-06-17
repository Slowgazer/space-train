import { InputState } from '../engine/Input';
import { Asteroid } from '../entities/Asteroid';
import { Monster } from '../entities/Monster';
import { ParticleBurst } from '../effects/ParticleBurst';
import { GameCamera } from '../engine/Camera';
import { AudioManager } from '../systems/AudioManager';

/** 每帧传入武器的上下文 */
export interface WeaponContext {
  dt: number;
  input: InputState;
  playerX: number;
  playerY: number;
  aimX: number;
  aimY: number;
  asteroids: Asteroid[];
  monsters: Monster[];
  particles: ParticleBurst;
  camera: GameCamera;
  audio: AudioManager;
  addCurrency(amount: number, worldX: number, worldY: number): void;
  screenShake(intensity: number): void;
  addItem?(itemId: string): void;
  showDropNotification?(itemName: string): void;
  addEvolutionResource?(amount: number, worldX: number, worldY: number): void;
}

/** 武器必须实现的接口 */
export interface Weapon {
  update(ctx: WeaponContext): void;
  /** 切走此武器时调用（释放资源、清理状态） */
  onSwitchAway(): void;
  /** 后台更新（换弹/冷却等，即使武器未激活也调用） */
  updatePassive?(dt: number): void;
}
