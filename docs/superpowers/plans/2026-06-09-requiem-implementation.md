# 安魂曲（狙击枪）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现安魂曲狙击枪，作为第三把武器（索引 2，导弹后移到索引 3）

**Architecture:** 新建 `src/weapons/Requiem.ts` 实现 Weapon 接口，包含子弹飞行、碰撞检测、自动换弹逻辑。Game.ts 新增 crosshair HTML 元素指示射程范围，更新武器 HUD 和注册。

**Tech Stack:** Three.js / TypeScript / Vite

---

### Task 1: 创建 Requiem.ts

**Files:**
- Create: `src/weapons/Requiem.ts`

- [ ] **Step 1: 创建 Requiem 类骨架**

```typescript
import { Scene, Sprite, SpriteMaterial, AdditiveBlending } from 'three';
import { Weapon, WeaponContext } from './types';

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
  bulletSpeed = 66.67; // range / 0.3

  private state = RequiemState.IDLE;
  private reloadTimer = 0;
  private bullet: Bullet | null = null;

  /** 用于 HUD 显示 */
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
    switch (this.state) {
      case RequiemState.IDLE:
        this.updateIdle(ctx);
        break;
      case RequiemState.RELOADING:
        this.updateReloading(ctx);
        break;
    }

    // 更新子弹飞行
    if (this.bullet && this.bullet.active) {
      this.updateBullet(ctx);
    }
  }

  onSwitchAway(): void {
    this.cancel();
  }

  private cancel(): void {
    if (this.bullet) {
      this.bullet.active = false;
      this.bullet.sprite.visible = false;
    }
    this.state = RequiemState.IDLE;
    this.reloadTimer = 0;
  }

  private updateIdle(ctx: WeaponContext): void {
    // 左键点击射击
    if (ctx.input.mouseDown && this.magazine > 0) {
      this.fire(ctx);
    }

    // 弹夹打空 → 自动换弹
    if (this.magazine <= 0) {
      this.state = RequiemState.RELOADING;
      this.reloadTimer = 0;
    }
  }

  private fire(ctx: WeaponContext): void {
    if (!this.bullet || this.bullet.active) return;

    // 计算方向
    const dx = ctx.aimX - ctx.playerX;
    const dy = ctx.aimY - ctx.playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    // 子弹起始位置（玩家位置稍偏前，避免击中玩家自己）
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
  }

  private updateBullet(ctx: WeaponContext): void {
    if (!this.bullet || !this.bullet.active) return;

    const dt = ctx.dt;
    const b = this.bullet;

    // 移动
    const step = b.speed * dt;
    b.x += b.dirX * step;
    b.y += b.dirY * step;
    b.distTraveled += step;

    // 更新子弹位置
    b.sprite.position.set(b.x, b.y, 1);

    // 粒子拖尾（金色）
    ctx.particles.emit(b.x, b.y, 2, 1, 0.85, 0.4);

    // 碰撞检测
    for (let i = ctx.asteroids.length - 1; i >= 0; i--) {
      const a = ctx.asteroids[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const hitDist = Math.sqrt(dx * dx + dy * dy);
      if (hitDist < a.radius + 0.2) {
        // 命中！
        a.hp -= this.damage;
        ctx.particles.emit(b.x, b.y, 10, 1, 0.5, 0);
        ctx.screenShake(0.1);

        if (a.hp <= 0) {
          a.mesh.parent?.remove(a.mesh);
          const reward = Math.ceil(a.radius * 10);
          ctx.addCurrency(reward, a.x, a.y);
          ctx.asteroids.splice(i, 1);
          ctx.particles.emit(a.x, a.y, 15, 0.6, 0.6, 0.6);
        }

        b.active = false;
        b.sprite.visible = false;
        return;
      }
    }

    // 超出最大距离
    if (b.distTraveled >= b.maxDist) {
      b.active = false;
      b.sprite.visible = false;
    }
  }

  private updateReloading(ctx: WeaponContext): void {
    this.reloadTimer += ctx.dt;
    if (this.reloadTimer >= this.reloadTime) {
      this.magazine = this.maxMagazine;
      this.state = RequiemState.IDLE;
      this.reloadTimer = 0;
    }
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无错误

---

### Task 2: 在 Game.ts 注册安魂曲

**Files:**
- Modify: `src/game/Game.ts` (多处修改)

- [ ] **Step 1: 添加 import**

在文件顶部加入：

```typescript
import { Requiem } from '../weapons/Requiem';
```

- [ ] **Step 2: 添加安魂曲到武器数组（index 2，导弹移到 index 3）**

找到构造函数中的 `this.weapons.push` 代码块（约第 104-106 行），修改为：

```typescript
this.weapons.push(new Laser(this.scene));
this.weapons.push(new SuctionGun(this.scene));
this.weapons.push(new Requiem(this.scene));
this.weapons.push(new Missile(this.scene));
```

- [ ] **Step 3: 添加准星（crosshair）HTML 元素**

在构造函数的 HUD 创建区域（约第 155 行附近），添加：

```typescript
this.weaponHUD = this.createHUD('weapon-name', '#00ffff', '激光');
this.weaponHUD.style.bottom = '20px';
this.weaponHUD.style.left = '20px';

// === 安魂曲准星（圆形，默认隐藏） ===
this.crosshair = document.createElement('div');
this.crosshair.id = 'requiem-crosshair';
this.crosshair.style.cssText =
  'position:fixed;pointer-events:none;z-index:200;' +
  'width:24px;height:24px;' +
  'transform:translate(-50%,-50%);' +
  'border:2px solid rgba(255,255,255,0.8);' +
  'border-radius:50%;display:none;';
document.body.appendChild(this.crosshair);
```

同时，在类的字段声明区域（约第 72 行 `private weaponHUD` 附近）添加：

```typescript
private crosshair: HTMLElement;
```

- [ ] **Step 4: 每帧更新准星位置和颜色**

在 `update` 方法的开始处（武器更新之前，约第 470 行之前），添加：

```typescript
// === 安魂曲准星更新 ===
const WEAPON_REQUIEM = 2;
if (this.currentWeaponIndex === WEAPON_REQUIEM) {
  this.crosshair.style.display = '';
  const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
  const dx = world.x - this.playerX;
  const dy = world.y - this.playerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const inRange = dist <= 20;
  this.crosshair.style.borderColor = inRange ? '#ff3333' : 'rgba(255,255,255,0.5)';
  this.crosshair.style.left = this.mouseWorld.x + 'px';
  this.crosshair.style.top = this.mouseWorld.y + 'px';
  // 隐藏默认光标
  this.renderer.domElement.style.cursor = 'none';
} else {
  this.crosshair.style.display = 'none';
  this.renderer.domElement.style.cursor = '';
}
```

注意：这里需要在 Q/E 武器切换代码之前执行。实际放在 Q/E 切换之前，武器更新之前。

具体插入位置约在 `// === Q/E 武器切换 ===` 之前。

- [ ] **Step 5: 更新武器 HUD 逻辑**

找到约第 500-506 行的武器 HUD 更新代码，替换为：

```typescript
// === 更新武器 HUD ===
const wi = this.currentWeaponIndex;
if (wi === 0) {
  this.weaponHUD.textContent = '激光';
} else if (wi === 1) {
  this.weaponHUD.textContent = '吸盘枪';
} else if (wi === 2) {
  const r = this.weapons[2] as Requiem;
  this.weaponHUD.textContent = `安魂曲 ${r.magazine}/${r.maxMagazine}`;
  if (r.isReloading) {
    this.weaponHUD.textContent += ` 换弹中...${r.reloadProgress.toFixed(0)}%`;
  }
} else if (wi === 3) {
  const m = this.weapons[3] as Missile;
  this.weaponHUD.textContent = `导弹: ${m.stock}`;
}
```

Requiem 的 `isReloading` / `reloadProgress` getter 已在 Task 1 中定义。

- [ ] **Step 6: 切换武器时取消射击**

在 Q/E 切换代码中已经调用了 `weapons[currentWeaponIndex].onSwitchAway()`，但为确保切到安魂曲时重置各种状态，需要在切换后进行额外处理。

实际上 `onSwitchAway()` 已经会调用 `cancel()` 清理子弹，不需要额外处理。

---

### Task 3: 构建验证

- [ ] **Step 1: 编译检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 2: Vite 构建**

Run: `npx vite build`
Expected: build 成功，约 21+ modules

- [ ] **Step 3: 功能验证**

Run: `npm run dev -- --host 0.0.0.0`

手动验证清单：
- [ ] Q/E 切换到安魂曲，准星出现（圆形+箭头）
- [ ] 鼠标靠近玩家（射程内）准星变红
- [ ] 鼠标远离（射程外）准星为白色
- [ ] 左键点击发射子弹，有金色拖尾
- [ ] 子弹命中陨石，陨石扣血（100 伤害）
- [ ] 弹夹打空自动换弹 5s，HUD 显示进度
- [ ] 换弹期间不能射击
- [ ] 切换到其他武器，准星隐藏
- [ ] 切回安魂曲，子弹状态重置
