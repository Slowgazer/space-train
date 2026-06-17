import {
  Mesh, Scene, SphereGeometry, BoxGeometry, Group, MeshToonMaterial,
} from 'three';
import { createToonMaterial, addOutlineToMesh } from '../effects/ToonRenderer';

export enum AsteroidTier {
  NORMAL = 1,
  REINFORCED = 2,
  ELITE = 3,
  GOLDEN = 4,
  SHIELD = 5,
}

const TIER_COLORS: Record<number, string> = {
  [AsteroidTier.NORMAL]: '#888888',
  [AsteroidTier.REINFORCED]: '#b8956a',
  [AsteroidTier.ELITE]: '#3a3a4a',
  [AsteroidTier.GOLDEN]: '#ffd700',
  [AsteroidTier.SHIELD]: '#6a7b8b',
};

export interface HitResult {
  killed: boolean;
  shieldHit: boolean;
  shieldBroken: boolean;
}

export function pickTier(stationCount: number): AsteroidTier {
  const r = Math.random();
  if (stationCount >= 2) {
    if (r < 0.02) return AsteroidTier.GOLDEN;
    if (r < 0.12) return AsteroidTier.SHIELD;
    if (r < 0.35) return AsteroidTier.ELITE;
    if (r < 0.65) return AsteroidTier.REINFORCED;
    return AsteroidTier.NORMAL;
  }
  if (stationCount >= 1) {
    if (r < 0.02) return AsteroidTier.GOLDEN;
    if (r < 0.08) return AsteroidTier.SHIELD;
    if (r < 0.15) return AsteroidTier.ELITE;
    if (r < 0.45) return AsteroidTier.REINFORCED;
    return AsteroidTier.NORMAL;
  }
  if (r < 0.01) return AsteroidTier.GOLDEN;
  return AsteroidTier.NORMAL;
}

export function getAsteroidHpMultiplier(tier: AsteroidTier): number {
  switch (tier) {
    case AsteroidTier.REINFORCED: return 2;
    case AsteroidTier.ELITE: return 4;
    case AsteroidTier.GOLDEN: return 3;
    case AsteroidTier.SHIELD: return 1.5;
    default: return 1;
  }
}

export function getShieldHp(tier: AsteroidTier): number {
  return tier === AsteroidTier.SHIELD ? 3 + Math.floor(Math.random() * 3) : 0;
}

const ITEMS_POOL = ['stardust', 'energy_crystal', 'life_dew', 'core_shard'];

export function pickDropItem(isGolden: boolean): string | null {
  if (isGolden) return ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];
  if (Math.random() < 0.03) return ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];
  return null;
}

export class Asteroid {
  mesh: Mesh;
  vx: number;
  vy: number;
  hp: number;
  radius: number;
  tier: AsteroidTier;
  shieldHp = 0;
  maxShieldHp = 0;
  shakeX = 0;
  shakeY = 0;
  private rotSpeedX: number;
  private rotSpeedY: number;
  private rotSpeedZ: number;
  private shieldBlocks: Mesh[] = [];
  private shieldRoot: Group;
  private lastShieldHitTime = 0;

  constructor(scene: Scene, x: number, y: number, radius: number, tier: AsteroidTier) {
    this.radius = radius;
    this.tier = tier;
    this.hp = radius * 20 * getAsteroidHpMultiplier(tier);

    const colorStr = TIER_COLORS[tier];
    const geo = new SphereGeometry(radius, 6, 4);
    const mat = createToonMaterial(colorStr);
    this.mesh = new Mesh(geo, mat);
    this.mesh.position.set(x, y, radius * 0.5);
    scene.add(this.mesh);
    addOutlineToMesh(this.mesh, { thickness: tier === AsteroidTier.GOLDEN ? 0.12 : 0.09 });

    // 次数盾
    this.shieldHp = getShieldHp(tier);
    this.maxShieldHp = this.shieldHp;
    if (this.shieldHp > 0) {
      this.shieldRoot = new Group();
      this.shieldRoot.position.set(x, y + radius + 0.3, radius * 0.5);
      scene.add(this.shieldRoot);
      this.buildShieldBlocks();
    } else {
      this.shieldRoot = new Group();
      scene.add(this.shieldRoot);
    }

    this.vx = -1 - Math.random() * 2;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.rotSpeedX = (Math.random() - 0.5) * 1.5;
    this.rotSpeedY = (Math.random() - 0.5) * 1.5;
    this.rotSpeedZ = (Math.random() - 0.5) * 1.5;
  }

  private buildShieldBlocks(): void {
    const blockSize = 0.3;
    const gap = 0.05;
    const totalW = this.shieldHp * (blockSize + gap) - gap;
    const startX = -totalW / 2 + blockSize / 2;
    for (let i = 0; i < this.shieldHp; i++) {
      const box = new BoxGeometry(blockSize, blockSize * 0.5, 0.1);
      const mat = new MeshToonMaterial({ color: 0x4fc3f7 });
      const block = new Mesh(box, mat);
      block.position.set(startX + i * (blockSize + gap), 0, 0);
      this.shieldRoot.add(block);
      this.shieldBlocks.push(block);
    }
  }

  private removeOneShieldBlock(): void {
    const block = this.shieldBlocks.pop();
    if (block) {
      block.parent?.remove(block);
    }
  }

  private clearShieldBlocks(): void {
    for (const block of this.shieldBlocks) {
      block.parent?.remove(block);
    }
    this.shieldBlocks.length = 0;
  }

  hit(damage: number, dt = 0): HitResult {
    this.triggerHitShake();

    if (this.shieldHp > 0) {
      // 激光连续帧防刷盾
      if (dt > 0 && this.lastShieldHitTime > 0) {
        this.lastShieldHitTime -= dt;
        if (this.lastShieldHitTime > 0) {
          return { killed: false, shieldHit: true, shieldBroken: false };
        }
      }
      this.shieldHp--;
      this.removeOneShieldBlock();
      this.lastShieldHitTime = 0.15;
      if (this.shieldHp <= 0) {
        this.clearShieldBlocks();
        return { killed: true, shieldHit: true, shieldBroken: true };
      }
      return { killed: false, shieldHit: true, shieldBroken: false };
    }

    this.hp -= damage;
    if (this.hp <= 0) {
      this.destroyMesh();
      return { killed: true, shieldHit: false, shieldBroken: false };
    }
    return { killed: false, shieldHit: false, shieldBroken: false };
  }

  /** 导弹等范围伤害—直接移除盾(不计数)，但不杀死 */
  removeAllShields(): void {
    if (this.shieldHp > 0) {
      this.shieldHp = 0;
      this.clearShieldBlocks();
    }
  }

  private destroyMesh(): void {
    this.mesh.parent?.remove(this.mesh);
  }

  destroyAll(): void {
    this.destroyMesh();
    this.clearShieldBlocks();
    this.shieldRoot.parent?.remove(this.shieldRoot);
  }

  getReward(): number {
    const base = Math.ceil(this.radius * 10);
    if (this.tier === AsteroidTier.GOLDEN) return base * 3;
    return base * getAsteroidHpMultiplier(this.tier);
  }

  getDrop(): string | null {
    return pickDropItem(this.tier === AsteroidTier.GOLDEN);
  }

  /** 激光开采获得的进化因子（其他武器只能获得金币） */
  getEvolutionResource(): number {
    const base = Math.ceil(this.radius * 3);
    if (this.tier === AsteroidTier.GOLDEN) return base * 4;
    if (this.tier === AsteroidTier.ELITE) return base * 3;
    if (this.tier === AsteroidTier.REINFORCED) return base * 2;
    return base;
  }

  update(dt: number): void {
    this.mesh.position.x += this.vx * dt;
    this.mesh.position.y += this.vy * dt;
    this.mesh.rotation.x += this.rotSpeedX * dt;
    this.mesh.rotation.y += this.rotSpeedY * dt;
    this.mesh.rotation.z += this.rotSpeedZ * dt;
    this.shakeX *= 0.85;
    this.shakeY *= 0.85;
    this.mesh.position.x += this.shakeX;
    this.mesh.position.y += this.shakeY;

    // 同步盾牌位置
    this.shieldRoot.position.set(this.mesh.position.x, this.mesh.position.y + this.radius + 0.3, this.radius * 0.5);
  }

  triggerHitShake(): void {
    this.shakeX = (Math.random() - 0.5) * 0.08;
    this.shakeY = (Math.random() - 0.5) * 0.08;
  }

  get x(): number { return this.mesh.position.x; }
  get y(): number { return this.mesh.position.y; }

  setPosition(x: number, y: number): void {
    this.mesh.position.x = x;
    this.mesh.position.y = y;
    if (this.shieldRoot) {
      this.shieldRoot.position.x = x;
      this.shieldRoot.position.y = y;
    }
  }

  isOffScreen(cameraX: number): boolean {
    return this.mesh.position.x < cameraX - 25;
  }
}
