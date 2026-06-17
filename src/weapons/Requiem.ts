import { Scene, Sprite, SpriteMaterial, AdditiveBlending } from 'three';
import { Weapon, WeaponContext } from './types';
import { ITEMS } from '../systems/InventorySystem';

enum RequiemState {
  IDLE,
  RELOADING,
}

interface Bullet {
  active: boolean;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  maxDist: number;
  distTraveled: number;
  sprite: Sprite;
}

export class Requiem implements Weapon {
  magazine = 6;
  maxMagazine = 6;
  reloadTime = 5;
  damage = 100;
  range = 20;
  bulletSpeed = 66.67;

  private state = RequiemState.IDLE;
  private reloadTimer = 0;
  private fireTimer = 0;
  private fireInterval = 0.15;
  private bullet: Bullet | null = null;
  /** 防止按住鼠标连续发射 */
  private prevMouseDown = false;

  get isReloading(): boolean {
    return this.state === RequiemState.RELOADING;
  }
  get reloadProgress(): number {
    if (this.state !== RequiemState.RELOADING) return 0;
    return Math.min(this.reloadTimer / this.reloadTime * 100, 100);
  }

  constructor(scene: Scene) {
    const mat = new SpriteMaterial({
      color: 0xffdd44,
      transparent: true,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new Sprite(mat);
    sprite.scale.set(0.2, 0.2, 1);
    sprite.visible = false;
    sprite.renderOrder = 5;
    scene.add(sprite);

    this.bullet = {
      active: false,
      x: 0, y: 0,
      dirX: 0, dirY: 0,
      speed: this.bulletSpeed,
      maxDist: this.range,
      distTraveled: 0,
      sprite,
    };
  }

  update(ctx: WeaponContext): void {
    // 射击冷却计时
    this.fireTimer = Math.max(0, this.fireTimer - ctx.dt);

    if (this.bullet && this.bullet.active) {
      this.updateBullet(ctx);
    }

    if (this.state === RequiemState.IDLE) {
      this.updateIdle(ctx);
    }

    this.prevMouseDown = ctx.input.mouseDown;
  }

  updatePassive(dt: number): void {
    if (this.state === RequiemState.RELOADING) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.reloadTime) {
        this.magazine = this.maxMagazine;
        this.state = RequiemState.IDLE;
        this.reloadTimer = 0;
      }
    }
  }

  onSwitchAway(): void {
    // 仅停止当前子弹，不重置换弹
    if (this.bullet) {
      this.bullet.active = false;
      this.bullet.sprite.visible = false;
    }
    this.prevMouseDown = false;
  }

  private updateIdle(ctx: WeaponContext): void {
    // 松开→按下边缘触发，防止按住连发
    const justPressed = ctx.input.mouseDown && !this.prevMouseDown;
    if (justPressed && this.magazine > 0 && this.fireTimer <= 0 && (!this.bullet || !this.bullet.active)) {
      this.fire(ctx);
      this.fireTimer = this.fireInterval;
    }

    // 弹夹打空 → 自动换弹
    if (this.magazine <= 0 && this.state === RequiemState.IDLE) {
      this.state = RequiemState.RELOADING;
      this.reloadTimer = 0;
    }
  }

  private fire(ctx: WeaponContext): void {
    if (!this.bullet || this.bullet.active) return;

    const dx = ctx.aimX - ctx.playerX;
    const dy = ctx.aimY - ctx.playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    const bulletDist = Math.min(dist, this.range);
    this.bullet.active = true;
    this.bullet.x = ctx.playerX + dirX * 0.3;
    this.bullet.y = ctx.playerY + dirY * 0.3;
    this.bullet.dirX = dirX;
    this.bullet.dirY = dirY;
    this.bullet.distTraveled = 0.3;
    this.bullet.maxDist = bulletDist;
    this.bullet.sprite.position.set(this.bullet.x, this.bullet.y, 1);
    this.bullet.sprite.visible = true;

    this.magazine--;
    ctx.screenShake(0.05);
    ctx.audio.play('requiem_fire');
  }

  private updateBullet(ctx: WeaponContext): void {
    if (!this.bullet || !this.bullet.active) return;

    const dt = ctx.dt;
    const b = this.bullet;

    const step = b.speed * dt;
    b.x += b.dirX * step;
    b.y += b.dirY * step;
    b.distTraveled += step;

    b.sprite.position.set(b.x, b.y, 1);

    ctx.particles.emit(b.x, b.y, 2, 1, 0.85, 0.4);

    for (let i = ctx.asteroids.length - 1; i >= 0; i--) {
      const a = ctx.asteroids[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const hitDist = Math.sqrt(dx * dx + dy * dy);
      if (hitDist < a.radius + 0.2) {
        const result = a.hit(this.damage);
        ctx.particles.emit(b.x, b.y, 10, 1, 0.5, 0);
        ctx.screenShake(0.1);
        ctx.audio.play('requiem_hit');

        if (result.killed) {
          const reward = a.getReward();
          const drop = a.getDrop();
          a.destroyAll();
          ctx.asteroids.splice(i, 1);
          ctx.particles.emit(a.x, a.y, 15, 0.6, 0.6, 0.6);
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

        b.active = false;
        b.sprite.visible = false;
        return;
      }
    }

    // 检测子弹对怪物的伤害
    for (let i = ctx.monsters.length - 1; i >= 0; i--) {
      const m = ctx.monsters[i];
      const dx = b.x - m.x;
      const dy = b.y - m.y;
      const hitDist = Math.sqrt(dx * dx + dy * dy);
      if (hitDist < 0.5) {
        const dead = m.takeDamage(this.damage);
        ctx.particles.emit(b.x, b.y, 8, 1, 0.2, 0.2);
        ctx.screenShake(0.08);
        ctx.audio.play('requiem_hit');
        if (dead) {
          ctx.addCurrency(25, m.x, m.y);
          ctx.monsters.splice(i, 1);
        }
        b.active = false;
        b.sprite.visible = false;
        return;
      }
    }

    if (b.distTraveled >= b.maxDist) {
      b.active = false;
      b.sprite.visible = false;
    }
  }
}
