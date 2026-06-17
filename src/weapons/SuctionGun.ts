import {
  Mesh, MeshBasicMaterial, Scene, RingGeometry, DoubleSide,
} from 'three';
import { Weapon, WeaponContext } from './types';
import { ITEMS } from '../systems/InventorySystem';

/** 吸盘枪状态 */
enum SGState {
  IDLE,
  ATTRACTING,
  CAPTURED,
  LAUNCHED,
}

/** 蓄力段位配置 */
const CHARGE_TABLE = [
  { time: 0.6, budget: 30, speed: 5 },
  { time: 1.2, budget: 50, speed: 8 },
  { time: 2.0, budget: 80, speed: 12 },
];

const CONE_LEN = 6;
const CAPTURE_DIST = 1;
const MAX_FLIGHT = 15;
const CONE_HALF_ANGLE_COS = Math.cos(25 * Math.PI / 180); // cos(25°) ≈ 0.906

export class SuctionGun implements Weapon {
  /** 升级加成 */
  public chargeSpeedBonus = 0;
  public damageBonus = 0;
  public launchSpeedBonus = 0;

  private state = SGState.IDLE;
  private targetAsteroidIdx = -1;
  private targetMonsterIdx = -1;
  private capturedFromMonster = false;
  private capturedRadius = 0;
  private chargeTimer = 0;
  private chargeLevel = 0;
  private projX = 0;
  private projY = 0;
  private projVx = 0;
  private projVy = 0;
  private projBudget = 0;
  private projMesh: Mesh | null = null;
  private flightDist = 0;
  private readyToFire = false;
  private coneMesh: Mesh;
  private coneVisible = false;

  constructor(scene: Scene) {
    const geo = new RingGeometry(0, CONE_LEN, 24, 1, -25 * Math.PI / 180, 50 * Math.PI / 180);
    const mat = new MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.12,
      side: DoubleSide,
      depthTest: false,
    });
    this.coneMesh = new Mesh(geo, mat);
    this.coneMesh.visible = false;
    this.coneMesh.position.z = 0.3;
    scene.add(this.coneMesh);
  }

  update(ctx: WeaponContext): void {
    switch (this.state) {
      case SGState.IDLE: this.updateIdle(ctx); break;
      case SGState.ATTRACTING: this.updateAttracting(ctx); break;
      case SGState.CAPTURED: this.updateCaptured(ctx); break;
      case SGState.LAUNCHED: this.updateLaunched(ctx); break;
    }

    const show = this.state === SGState.ATTRACTING || this.state === SGState.CAPTURED;
    if (show !== this.coneVisible) {
      this.coneMesh.visible = show;
      this.coneVisible = show;
    }
    if (show) {
      const angle = Math.atan2(ctx.aimY - ctx.playerY, ctx.aimX - ctx.playerX);
      this.coneMesh.position.set(ctx.playerX, ctx.playerY, 0.3);
      this.coneMesh.rotation.z = angle;
    }
  }

  onSwitchAway(): void {
    this.reset();
  }

  private reset(): void {
    if (this.projMesh) {
      this.projMesh.parent?.remove(this.projMesh);
    }
    this.state = SGState.IDLE;
    this.targetAsteroidIdx = -1;
    this.targetMonsterIdx = -1;
    this.capturedFromMonster = false;
    this.chargeTimer = 0;
    this.chargeLevel = 0;
    this.capturedRadius = 0;
    this.projMesh = null;
    this.flightDist = 0;
    this.readyToFire = false;
  }

  private updateIdle(ctx: WeaponContext): void {
    if (ctx.input.mouseDown) {
      const idx = this.findNearestInCone(ctx);
      if (idx >= 0) {
        this.targetAsteroidIdx = idx;
        this.targetMonsterIdx = -1;
        this.capturedFromMonster = false;
        this.state = SGState.ATTRACTING;
        return;
      }
      const midx = this.findNearestMonsterInCone(ctx);
      if (midx >= 0) {
        this.targetAsteroidIdx = -1;
        this.targetMonsterIdx = midx;
        this.capturedFromMonster = true;
        this.state = SGState.ATTRACTING;
      }
    }
  }

  private updateAttracting(ctx: WeaponContext): void {
    if (!ctx.input.mouseDown) {
      this.reset();
      return;
    }

    if (this.capturedFromMonster) {
      this.updateAttractingMonster(ctx);
    } else {
      this.updateAttractingAsteroid(ctx);
    }
  }

  private updateAttractingMonster(ctx: WeaponContext): void {
    if (this.targetMonsterIdx < 0 || this.targetMonsterIdx >= ctx.monsters.length) {
      this.reset();
      return;
    }

    const m = ctx.monsters[this.targetMonsterIdx];
    const dx = ctx.playerX - m.x;
    const dy = ctx.playerY - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!this.isInCone(m.x, m.y, ctx)) {
      this.reset();
      return;
    }

    const force = 3 / (dist + 0.5);
    const nx = dx / dist;
    const ny = dy / dist;
    m.mesh.position.x += nx * force * ctx.dt;
    m.mesh.position.y += ny * force * ctx.dt;

    ctx.particles.emitAlongRay(
      m.x, m.y, nx, ny, dist, 3, 1, 0.2, 0.2,
    );

    if (dist < CAPTURE_DIST) {
      this.capturedRadius = 0.5;
      this.projMesh = m.mesh;
      this.projMesh.position.z = 0.5;
      ctx.monsters.splice(this.targetMonsterIdx, 1);
      this.targetMonsterIdx = -1;
      this.chargeTimer = 0;
      this.chargeLevel = 0;
      this.readyToFire = false;
      this.state = SGState.CAPTURED;
    }
  }

  private updateAttractingAsteroid(ctx: WeaponContext): void {
    if (this.targetAsteroidIdx < 0 || this.targetAsteroidIdx >= ctx.asteroids.length) {
      this.reset();
      return;
    }

    const a = ctx.asteroids[this.targetAsteroidIdx];
    const dx = ctx.playerX - a.x;
    const dy = ctx.playerY - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!this.isInCone(a.x, a.y, ctx)) {
      this.reset();
      return;
    }

    const force = 3 / (dist + 0.5);
    const nx = dx / dist;
    const ny = dy / dist;
    a.setPosition(a.x + nx * force * ctx.dt, a.y + ny * force * ctx.dt);

    ctx.particles.emitAlongRay(
      a.x, a.y, nx, ny, dist, 3, 0.27, 1, 0.27,
    );

    if (dist < CAPTURE_DIST && a.shieldHp <= 0) {
      ctx.audio.play('suction_catch');
      this.capturedRadius = a.radius;
      this.projMesh = a.mesh;
      this.projMesh.position.z = 0.5;
      ctx.asteroids.splice(this.targetAsteroidIdx, 1);
      this.targetAsteroidIdx = -1;
      this.chargeTimer = 0;
      this.chargeLevel = 0;
      this.readyToFire = false;
      this.state = SGState.CAPTURED;
    }
  }

  private updateCaptured(ctx: WeaponContext): void {
    if (!this.projMesh) { this.reset(); return; }

    const dx = ctx.aimX - ctx.playerX;
    const dy = ctx.aimY - ctx.playerY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const nx = dx / len;
      const ny = dy / len;
      this.projMesh.position.set(
        ctx.playerX + nx * CAPTURE_DIST,
        ctx.playerY + ny * CAPTURE_DIST,
        0.5,
      );
    }

    this.chargeTimer += ctx.dt;
    const chargeTimeStep = Math.max(0.1, CHARGE_TABLE[0].time - this.chargeSpeedBonus);
    this.chargeLevel = Math.min(
      CHARGE_TABLE.length - 1,
      Math.floor(this.chargeTimer / chargeTimeStep),
    );

    const totalTime = CHARGE_TABLE[CHARGE_TABLE.length - 1].time - this.chargeSpeedBonus;
    const progress = Math.min(this.chargeTimer / Math.max(0.1, totalTime), 1);
    const r = Math.min(progress * 2, 1);
    const g = Math.min((1 - progress) * 2, 1);
    (this.projMesh.material as MeshBasicMaterial).color.setRGB(r, g, 0);

    // 等待松开鼠标后再按下才发射
    if (!ctx.input.mouseDown) this.readyToFire = true;

    if (ctx.input.mouseDown && this.readyToFire) {
      ctx.audio.play('suction_launch');
      const table = CHARGE_TABLE[this.chargeLevel];
      const speed = table.speed + this.launchSpeedBonus;
      const aimLen = Math.sqrt(
        (ctx.aimX - ctx.playerX) ** 2 + (ctx.aimY - ctx.playerY) ** 2,
      );
      if (aimLen > 0) {
        this.projVx = (ctx.aimX - ctx.playerX) / aimLen * speed;
        this.projVy = (ctx.aimY - ctx.playerY) / aimLen * speed;
      } else {
        this.projVx = speed;
        this.projVy = 0;
      }
      this.projBudget = table.budget + this.damageBonus;
      this.projX = this.projMesh.position.x;
      this.projY = this.projMesh.position.y;
      this.flightDist = 0;
      this.state = SGState.LAUNCHED;
    }
  }

  private updateLaunched(ctx: WeaponContext): void {
    if (!this.projMesh) { this.reset(); return; }

    this.projX += this.projVx * ctx.dt;
    this.projY += this.projVy * ctx.dt;
    this.flightDist += Math.sqrt(
      (this.projVx * ctx.dt) ** 2 + (this.projVy * ctx.dt) ** 2,
    );
    this.projMesh.position.set(this.projX, this.projY, 0.5);

    ctx.particles.emit(this.projX, this.projY, 1, 0.6, 0.3, 0);

    for (let i = ctx.asteroids.length - 1; i >= 0; i--) {
      const a = ctx.asteroids[i];
      const dx = this.projX - a.x;
      const dy = this.projY - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < a.radius + this.capturedRadius) {
        // 次数盾：打掉一层后发射物消失
        if (a.shieldHp > 0) {
          const result = a.hit(1);
          ctx.particles.emit(a.x, a.y, 8, 0.3, 0.6, 1);
          if (result.killed) {
            const reward = a.getReward();
            const drop = a.getDrop();
            a.destroyAll();
            ctx.asteroids.splice(i, 1);
            ctx.addCurrency(reward, a.x, a.y);
            if (drop && ctx.addItem && ctx.showDropNotification) {
              const item = ITEMS[drop];
              ctx.addItem(drop);
              ctx.showDropNotification(item ? item.name : drop);
            }
          }
          this.explodeProjectile(ctx);
          return;
        }
        const damage = Math.min(this.projBudget, a.hp);
        const result = a.hit(damage);
        this.projBudget -= damage;
        ctx.particles.emit(a.x, a.y, 8, 1, 0.67, 0.27);
        ctx.screenShake(0.03);
        if (result.killed) {
          const reward = a.getReward();
          const drop = a.getDrop();
          a.destroyAll();
          ctx.asteroids.splice(i, 1);
          ctx.particles.emit(a.x, a.y, 15, 0.6, 0.6, 0.6);
          ctx.screenShake(0.08);
          ctx.addCurrency(reward, a.x, a.y);
          if (drop && ctx.addItem && ctx.showDropNotification) {
            const item = ITEMS[drop];
            ctx.addItem(drop);
            ctx.showDropNotification(item ? item.name : drop);
          }
        }
        if (result.shieldBroken) {
          ctx.particles.emit(a.x, a.y, 10, 0.3, 0.6, 1);
        }
        if (this.projBudget <= 0) {
          this.explodeProjectile(ctx);
          return;
        }
      }
    }

    // 发射物对怪物的伤害
    for (let i = ctx.monsters.length - 1; i >= 0; i--) {
      const m = ctx.monsters[i];
      const dx = this.projX - m.x;
      const dy = this.projY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.5 + this.capturedRadius) {
        const damage = Math.min(this.projBudget, 50);
        const dead = m.takeDamage(damage);
        this.projBudget -= damage;
        ctx.particles.emit(m.x, m.y, 8, 1, 0.2, 0.2);
        ctx.screenShake(0.03);
        if (dead) {
          ctx.addCurrency(25, m.x, m.y);
          ctx.monsters.splice(i, 1);
        }
        if (this.projBudget <= 0) {
          this.explodeProjectile(ctx);
          return;
        }
      }
    }

    if (this.flightDist > MAX_FLIGHT) {
      this.explodeProjectile(ctx);
    }
  }

  private explodeProjectile(ctx: WeaponContext): void {
    ctx.particles.emit(this.projX, this.projY, 15, 0.6, 0.3, 0);
    ctx.screenShake(0.06);
    if (this.projMesh) {
      this.projMesh.parent?.remove(this.projMesh);
      this.projMesh = null;
    }
    this.reset();
  }

  private findNearestInCone(ctx: WeaponContext): number {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < ctx.asteroids.length; i++) {
      const a = ctx.asteroids[i];
      if (!this.isInCone(a.x, a.y, ctx)) continue;
      if (a.shieldHp > 0) continue;
      const d = Math.sqrt((a.x - ctx.playerX) ** 2 + (a.y - ctx.playerY) ** 2);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  private findNearestMonsterInCone(ctx: WeaponContext): number {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < ctx.monsters.length; i++) {
      const m = ctx.monsters[i];
      if (!this.isInCone(m.x, m.y, ctx)) continue;
      const d = Math.sqrt((m.x - ctx.playerX) ** 2 + (m.y - ctx.playerY) ** 2);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  private isInCone(x: number, y: number, ctx: WeaponContext): boolean {
    const dx = x - ctx.playerX;
    const dy = y - ctx.playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > CONE_LEN) return false;

    const aimDx = ctx.aimX - ctx.playerX;
    const aimDy = ctx.aimY - ctx.playerY;
    const aimLen = Math.sqrt(aimDx * aimDx + aimDy * aimDy);
    if (aimLen === 0) return false;

    const dot = (dx * aimDx + dy * aimDy) / (dist * aimLen);
    return dot > CONE_HALF_ANGLE_COS;
  }

  destroy(): void {
    this.coneMesh.parent?.remove(this.coneMesh);
    this.coneMesh.geometry.dispose();
    (this.coneMesh.material as MeshBasicMaterial).dispose();
    if (this.projMesh) {
      this.projMesh.parent?.remove(this.projMesh);
    }
  }
}
