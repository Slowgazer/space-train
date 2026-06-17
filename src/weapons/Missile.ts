import {
  Mesh, MeshBasicMaterial, Scene, RingGeometry, DoubleSide,
} from 'three';
import { Weapon, WeaponContext } from './types';
import { ITEMS } from '../systems/InventorySystem';

enum MissileState {
  IDLE,
  AIMING,
  EXPLODING,
}

const RESTOCK_INTERVAL = 60;

export class Missile implements Weapon {
  stock = 1;
  maxStock = 1;
  blastRadius = 3.5;
  aimTime = 2.25;

  private state = MissileState.IDLE;
  private aimTimer = 0;
  private aimX = 0;
  private aimY = 0;
  private restockTimer = 0;
  private explosionTimer = 0;
  private explosionActive = false;

  /** 瞄准范围边界（浅红圈） */
  private aimBorder: Mesh;
  /** 充能填充（深红实心圆，从中心放大） */
  private aimFill: Mesh;
  /** 爆炸扩散环 */
  private explosionRing: Mesh;

  constructor(scene: Scene) {
    // 边界圈
    const borderGeo = new RingGeometry(0.92, 1, 32);
    const borderMat = new MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.25,
      side: DoubleSide,
      depthTest: false,
    });
    this.aimBorder = new Mesh(borderGeo, borderMat);
    this.aimBorder.visible = false;
    this.aimBorder.position.z = 0.4;
    scene.add(this.aimBorder);

    // 充能填充（开始时缩到极小）
    const fillGeo = new RingGeometry(0, 1, 32);
    const fillMat = new MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.35,
      side: DoubleSide,
      depthTest: false,
    });
    this.aimFill = new Mesh(fillGeo, fillMat);
    this.aimFill.visible = false;
    this.aimFill.position.z = 0.39;
    this.aimFill.scale.set(0.01, 0.01, 1);
    scene.add(this.aimFill);

    // 爆炸扩散环
    const expGeo = new RingGeometry(0, 1, 32);
    const expMat = new MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
      depthTest: false,
    });
    this.explosionRing = new Mesh(expGeo, expMat);
    this.explosionRing.visible = false;
    this.explosionRing.position.z = 0.5;
    scene.add(this.explosionRing);
  }

  update(ctx: WeaponContext): void {
    switch (this.state) {
      case MissileState.IDLE:
        this.updateIdle(ctx);
        break;
      case MissileState.AIMING:
        this.updateAiming(ctx);
        break;
      case MissileState.EXPLODING:
        this.updateExploding(ctx);
        break;
    }
  }

  updatePassive(dt: number): void {
    if (this.stock < this.maxStock) {
      this.restockTimer += dt;
      while (this.restockTimer >= RESTOCK_INTERVAL) {
        this.restockTimer -= RESTOCK_INTERVAL;
        this.stock++;
      }
    }
  }

  onSwitchAway(): void {
    this.cancel();
  }

  private cancel(): void {
    this.state = MissileState.IDLE;
    this.aimTimer = 0;
    this.aimBorder.visible = false;
    this.aimFill.visible = false;
    this.explosionRing.visible = false;
    this.explosionActive = false;
  }

  private updateIdle(ctx: WeaponContext): void {
    // 不按左键时浅红圈跟随鼠标
    this.aimBorder.position.set(ctx.aimX, ctx.aimY, 0.4);
    this.aimBorder.scale.set(this.blastRadius, this.blastRadius, 1);
    this.aimBorder.visible = true;

    if (ctx.input.mouseDown && this.stock > 0) {
      this.state = MissileState.AIMING;
      this.aimTimer = 0;
      this.aimX = ctx.aimX;
      this.aimY = ctx.aimY;

      // 边界圈锁定位置
      this.aimBorder.position.set(this.aimX, this.aimY, 0.4);
      (this.aimBorder.material as MeshBasicMaterial).opacity = 0.4;

      // 填充圈初始化
      this.aimFill.position.set(this.aimX, this.aimY, 0.39);
      this.aimFill.scale.set(0.01, 0.01, 1);
      this.aimFill.visible = true;
    }
  }

  private updateAiming(ctx: WeaponContext): void {
    if (!ctx.input.mouseDown) {
      this.cancel();
      return;
    }

    this.aimTimer += ctx.dt;
    const progress = Math.min(this.aimTimer / this.aimTime, 1);

    // 填充圈从 0 扩大到 blastRadius
    const scale = 0.01 + progress * (this.blastRadius - 0.01);
    this.aimFill.scale.set(scale, scale, 1);
    (this.aimFill.material as MeshBasicMaterial).opacity = 0.15 + progress * 0.3;

    if (progress >= 1) {
      this.activate(ctx);
    }
  }

  private activate(ctx: WeaponContext): void {
    ctx.audio.play('missile_launch');
    this.stock--;
    this.aimBorder.visible = false;
    this.aimFill.visible = false;
    this.state = MissileState.EXPLODING;
    this.explosionActive = true;
    this.explosionTimer = 0;

    this.explosionRing.position.set(this.aimX, this.aimY, 0.5);
    this.explosionRing.scale.set(0.01, 0.01, 1);
    this.explosionRing.visible = true;

    for (let i = ctx.asteroids.length - 1; i >= 0; i--) {
      const a = ctx.asteroids[i];
      const dx = a.x - this.aimX;
      const dy = a.y - this.aimY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.blastRadius) {
        // 次数盾被导弹直接击杀
        if (a.shieldHp > 0) {
          a.removeAllShields();
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
          continue;
        }
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
    }

    // 爆炸对怪物的伤害
    for (let i = ctx.monsters.length - 1; i >= 0; i--) {
      const m = ctx.monsters[i];
      const dx = m.x - this.aimX;
      const dy = m.y - this.aimY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.blastRadius) {
        const dead = m.takeDamage(50);
        ctx.particles.emit(m.x, m.y, 10, 1, 0.2, 0.2);
        if (dead) {
          ctx.addCurrency(25, m.x, m.y);
          ctx.monsters.splice(i, 1);
        }
      }
    }

    ctx.audio.play('missile_explode');
    ctx.particles.emit(this.aimX, this.aimY, 30, 1, 0.4, 0);
    ctx.screenShake(0.15);
  }

  private updateExploding(ctx: WeaponContext): void {
    if (!this.explosionActive) return;

    this.explosionTimer += ctx.dt;
    const t = this.explosionTimer / 0.4;

    if (t >= 1) {
      this.explosionRing.visible = false;
      this.explosionActive = false;
      this.state = MissileState.IDLE;
      return;
    }

    const scale = t;
    this.explosionRing.scale.set(scale, scale, 1);
    (this.explosionRing.material as MeshBasicMaterial).opacity = 0.5 * (1 - t);
  }
}
