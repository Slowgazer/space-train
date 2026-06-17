import { Group } from 'three';

/**
 * 种子实体类
 * 作为列车的一节车厢，是游戏核心保护对象
 * 视觉由 SeedVisuals 管理
 */
export class Seed {
  group: Group;
  hp = 50;
  maxHp = 50;

  constructor() {
    this.group = new Group();
  }

  /** 受到伤害，返回是否死亡 */
  takeDamage(damage: number): boolean {
    this.hp -= damage;
    return this.hp <= 0;
  }
}
