import {
  BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Scene,
} from 'three';
import { Weapon, WeaponContext } from './types';
import { ITEMS } from '../systems/InventorySystem';

/**
 * 激光武器
 * 从玩家向鼠标方向射出的持续光束
 * - 判定用满射程（fire 时立即生效）
 * - 绘制有从玩家向外延伸的动画
 * - 遇到陨石时截断视觉长度
 */
export class Laser implements Weapon {
  private mesh: Mesh;
  private active = false;
  private originX = 0;
  private originY = 0;
  private dirX = 0;
  private dirY = 1;

  /** 视觉绘制长度（动画用，从 0 增长到 maxRange） */
  private visualLength = 0;
  /** 因命中陨石而截断的位置（距离起点的长度） */
  private truncateDist = Infinity;
  /** 延伸速度（单位/秒），约 0.067 秒到满射程 */
  private drawSpeed = 60;

  maxRange = 4;
  beamWidth = 0.08;
  damage = 10;

  constructor(scene: Scene) {
    const halfW = this.beamWidth / 2;
    const verts = new Float32Array([
      0, -halfW, 0,
      1, -halfW, 0,
      0, halfW, 0,
      1, halfW, 0,
    ]);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
    geo.setIndex([0, 1, 2, 2, 1, 3]);

    const mat = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    });
    this.mesh = new Mesh(geo, mat);
    this.mesh.visible = false;
    this.mesh.position.z = 0.5;
    scene.add(this.mesh);
  }

  /** 发射激光（立即设定方向，判定用满射程） */
  fire(originX: number, originY: number, targetX: number, targetY: number): void {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    this.originX = originX;
    this.originY = originY;
    this.dirX = dx / len;
    this.dirY = dy / len;

    if (!this.active) {
      this.visualLength = 0;
      this.truncateDist = Infinity;
    }
    this.active = true;
    this.mesh.visible = true;
  }

  /** 设置截断距离（被陨石阻挡），取最近命中点 */
  setHitPoint(dist: number): void {
    if (dist < this.truncateDist) {
      this.truncateDist = dist;
    }
  }

  /** 清除截断（当前帧未命中任何陨石时调用） */
  clearHitPoint(): void {
    this.truncateDist = Infinity;
  }

  /** 每帧更新：绘制延伸动画 + 截断 */
  updateLaser(dt: number): void {
    if (!this.active) return;

    this.visualLength = Math.min(
      this.visualLength + this.drawSpeed * dt,
      this.maxRange,
    );

    // 实际显示长度 = min(动画进度, 陨石截断)
    const displayLen = Math.min(this.visualLength, this.truncateDist);

    // Mesh 几何体左端在 x=0，右端在 x=1
    // 放缩后左端在原点，右端在 origin + dir * displayLen
    this.mesh.position.set(this.originX, this.originY, 0.5);
    this.mesh.scale.set(displayLen, 1, 1);
    this.mesh.rotation.z = Math.atan2(this.dirY, this.dirX);

    if (displayLen <= 0) {
      this.mesh.visible = false;
    }
  }

  /** 隐藏激光 */
  hide(): void {
    this.active = false;
    this.mesh.visible = false;
    this.visualLength = 0;
    this.truncateDist = Infinity;
  }

  update(ctx: WeaponContext): void {
    if (ctx.input.mouseDown) {
      this.fire(ctx.playerX, ctx.playerY, ctx.aimX, ctx.aimY);
      this.checkHit(ctx);

      const dx = ctx.aimX - ctx.playerX;
      const dy = ctx.aimY - ctx.playerY;
      const beamLen = Math.sqrt(dx * dx + dy * dy);
      if (beamLen > 0) {
        ctx.particles.emitAlongRay(
          ctx.playerX, ctx.playerY,
          dx / beamLen, dy / beamLen,
          this.maxRange, 20, 0.5, 1, 1,
        );
      }
    } else {
      this.hide();
    }
    this.updateLaser(ctx.dt);
  }

  onSwitchAway(): void {
    this.hide();
  }

  private checkHit(ctx: WeaponContext): void {
    if (!this.isActive) return;

    const dx = ctx.aimX - ctx.playerX;
    const dy = ctx.aimY - ctx.playerY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const nx = dx / len;
    const ny = dy / len;

    let hitAny = false;
    let closestSurfaceDist = Infinity;
    let closestHitX = 0;
    let closestHitY = 0;

    for (let i = ctx.asteroids.length - 1; i >= 0; i--) {
      const a = ctx.asteroids[i];
      const toAx = a.x - ctx.playerX;
      const toAy = a.y - ctx.playerY;
      const proj = toAx * nx + toAy * ny;

      if (proj < 0 || proj > this.maxRange) continue;

      const closestX = ctx.playerX + nx * proj;
      const closestY = ctx.playerY + ny * proj;
      const dist = Math.sqrt((a.x - closestX) ** 2 + (a.y - closestY) ** 2);

      if (dist < a.radius + 0.1) {
        const surfaceDist = Math.max(0, proj - a.radius);
        if (surfaceDist < closestSurfaceDist) {
          closestSurfaceDist = surfaceDist;
          closestHitX = closestX;
          closestHitY = closestY;
        }
        const result = a.hit(this.damage * ctx.dt, ctx.dt);
        if (result.killed) {
          const ax = a.x, ay = a.y, reward = a.getReward();
          const drop = a.getDrop();
          a.destroyAll();
          ctx.asteroids.splice(i, 1);
          ctx.particles.emit(ax, ay, 15, 0.6, 0.6, 0.6);
          ctx.screenShake(0.08);
          ctx.addCurrency(reward, ax, ay);
          ctx.addEvolutionResource?.(a.getEvolutionResource(), ax, ay);
          if (drop && ctx.addItem && ctx.showDropNotification) {
            const item = ITEMS[drop];
            ctx.addItem(drop);
            ctx.showDropNotification(item ? item.name : drop);
          }
        }
        if (result.shieldBroken) {
          ctx.particles.emit(a.x, a.y, 10, 0.3, 0.6, 1);
        }
        hitAny = true;
      }
    }

    // 检测激光对怪物的伤害
    for (let i = ctx.monsters.length - 1; i >= 0; i--) {
      const m = ctx.monsters[i];
      const toMx = m.x - ctx.playerX;
      const toMy = m.y - ctx.playerY;
      const proj = toMx * nx + toMy * ny;
      if (proj < 0 || proj > this.maxRange) continue;
      const closestX = ctx.playerX + nx * proj;
      const closestY = ctx.playerY + ny * proj;
      const dist = Math.sqrt((m.x - closestX) ** 2 + (m.y - closestY) ** 2);
      if (dist < 0.5) {
        const dead = m.takeDamage(this.damage * ctx.dt);
        ctx.particles.emit(m.x, m.y, 6, 1, 0.2, 0.2);
        if (dead) {
          ctx.addCurrency(25, m.x, m.y);
          ctx.monsters.splice(i, 1);
        }
        hitAny = true;
      }
    }

    if (hitAny) {
      this.setHitPoint(closestSurfaceDist);
      ctx.particles.emit(closestHitX, closestHitY, 8, 1, 0.67, 0.27);
      ctx.screenShake(0.03);
    } else {
      this.clearHitPoint();
    }
  }

  get isActive(): boolean {
    return this.active;
  }

  get range(): number {
    return this.maxRange;
  }
}
