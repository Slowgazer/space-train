# 吸盘枪实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现吸盘枪武器系统，含 Q/E 武器切换、扇形吸附、三段蓄力、穿甲弹发射

**Architecture:** 定义 `Weapon` 接口统一武器交互，`SuctionGun` 类实现状态机（IDLE→ATTRACTING→CAPTURED→LAUNCHED），Game.ts 维护武器数组处理切换与委托

**Tech Stack:** TypeScript + Three.js (RingGeometry/Mesh/BufferGeometry)

---

### Task 1: 武器接口与上下文类型

**Files:**
- Create: `src/weapons/types.ts`

**说明:** 定义 `Weapon` 接口和 `WeaponContext` 上下文，所有武器实现相同的 update 签名，Game.ts 通过数组统一调用。

- [ ] **Step 1: 创建 WeaponContext 和 Weapon 类型**

```ts
import { InputState } from '../engine/Input';
import { Asteroid } from '../entities/Asteroid';
import { ParticleBurst } from '../effects/ParticleBurst';
import { GameCamera } from '../engine/Camera';

/** 每帧传入武器的上下文 */
export interface WeaponContext {
  dt: number;
  input: InputState;
  playerX: number;
  playerY: number;
  aimX: number;
  aimY: number;
  asteroids: Asteroid[];
  particles: ParticleBurst;
  camera: GameCamera;
  addCurrency(amount: number, worldX: number, worldY: number): void;
  screenShake(intensity: number): void;
}

/** 武器必须实现的接口 */
export interface Weapon {
  update(ctx: WeaponContext): void;
  /** 切走此武器时调用（释放资源、清理状态） */
  onSwitchAway(): void;
}
```

---

### Task 2: Laser 适配 Weapon 接口

**Files:**
- Modify: `src/weapons/Laser.ts`
- Create: (none)

**说明:** 将 Game.ts 中激光碰撞检测逻辑移入 Laser.update()，新增 `onSwitchAway()` 方法。

- [ ] **Step 1: 添加 `update()` 和 `onSwitchAway()` 方法，导入新类型**

**文件顶部新增导入：**
```ts
import { Weapon, WeaponContext } from './types';
```

**类声明改为：**
```ts
export class Laser implements Weapon {
```

**新增方法 `update()`（替换之前由 Game.ts 调用的 fire/hide/updateLaser）：**
```ts
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
```

**新增 `checkHit` 方法（从 Game.ts 的 `checkLaserHit` 移入）：**
```ts
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
      const destroyed = a.takeDamage(this.damage * ctx.dt);
      if (destroyed) {
        const ax = a.x, ay = a.y, reward = Math.ceil(a.radius * 10);
        ctx.asteroids.splice(i, 1);
        ctx.particles.emit(ax, ay, 15, 0.6, 0.6, 0.6);
        ctx.screenShake(0.08);
        ctx.addCurrency(reward, ax, ay);
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
```

**关键:** 保持 `damage`、`maxRange`、`beamWidth` 等属性公开，升级系统继续直接修改它们。

---

### Task 3: Asteroid 属性调整

**Files:**
- Modify: `src/entities/Asteroid.ts`

- [ ] **Step 1: HP 改为 radius × 20，添加 setPosition 方法**

```ts
constructor(scene: Scene, x: number, y: number, radius: number) {
    this.radius = radius;
    this.hp = radius * 20;  // ← 原来是 radius * 10
    // ... 其余不变
}
```

**新增方法：**
```ts
/** 强制设置位置（被吸盘枪捕获时使用） */
setPosition(x: number, y: number): void {
  this.mesh.position.x = x;
  this.mesh.position.y = y;
}
```

---

### Task 4: SuctionGun 类实现

**Files:**
- Create: `src/weapons/SuctionGun.ts`

- [ ] **Step 1: 创建 SuctionGun 类的完整实现**

```ts
import {
  Mesh, MeshBasicMaterial, Scene, RingGeometry, DoubleSide,
} from 'three';
import { Weapon, WeaponContext } from './types';

/** 吸盘枪状态 */
enum SGState {
  IDLE,
  ATTRACTING,   // 按住左键，吸引前方陨石
  CAPTURED,     // 陨石被捕获，自动蓄力
  LAUNCHED,     // 陨石已发射，飞行中
}

/** 蓄力段位配置 */
const CHARGE_TABLE = [
  { time: 0.6, budget: 30, speed: 5 },
  { time: 1.2, budget: 50, speed: 8 },
  { time: 2.0, budget: 80, speed: 12 },
];

const CONE_LEN = 6;       // 扇形吸附最远距离
const CAPTURE_DIST = 0.5; // 捕获距离
const MAX_FLIGHT = 15;    // 发射后最大飞行距离

export class SuctionGun implements Weapon {
  private state = SGState.IDLE;

  // 被吸引/捕获的陨石
  private targetAsteroidIdx = -1;
  private capturedRadius = 0;

  // 蓄力
  private chargeTimer = 0;
  private chargeLevel = 0; // 0,1,2

  // 发射后的弹体
  private projX = 0;
  private projY = 0;
  private projVx = 0;
  private projVy = 0;
  private projBudget = 0;
  private projMesh: Mesh | null = null;
  private flightDist = 0;

  // 扇形视觉网格
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
      case SGState.IDLE:
        this.updateIdle(ctx);
        break;
      case SGState.ATTRACTING:
        this.updateAttracting(ctx);
        break;
      case SGState.CAPTURED:
        this.updateCaptured(ctx);
        break;
      case SGState.LAUNCHED:
        this.updateLaunched(ctx);
        break;
    }

    // 扇形只在吸盘枪活动时显示（ATTRACTING + CAPTURED）
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

  /** 释放当前状态 */
  private reset(): void {
    this.state = SGState.IDLE;
    this.targetAsteroidIdx = -1;
    this.chargeTimer = 0;
    this.chargeLevel = 0;
    this.projMesh = null;
    this.flightDist = 0;
  }

  /** IDLE: 等待左键按下 */
  private updateIdle(ctx: WeaponContext): void {
    if (ctx.input.mouseDown) {
      const idx = this.findNearestInCone(ctx);
      if (idx >= 0) {
        this.targetAsteroidIdx = idx;
        this.state = SGState.ATTRACTING;
      }
    }
  }

  /** ATTRACTING: 按住左键，吸引目标陨石 */
  private updateAttracting(ctx: WeaponContext): void {
    if (!ctx.input.mouseDown) {
      this.reset();
      return;
    }

    if (this.targetAsteroidIdx < 0 || this.targetAsteroidIdx >= ctx.asteroids.length) {
      this.reset();
      return;
    }

    const a = ctx.asteroids[this.targetAsteroidIdx];
    const dx = ctx.playerX - a.x;
    const dy = ctx.playerY - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 如果陨石脱离扇形，取消吸引
    if (!this.isInCone(a.x, a.y, ctx)) {
      this.reset();
      return;
    }

    // 吸引力：越近越大
    const force = 3 / (dist + 0.5);
    const nx = dx / dist;
    const ny = dy / dist;
    a.setPosition(a.x + nx * force * ctx.dt, a.y + ny * force * ctx.dt);

    // 粒子流：从陨石流向玩家
    ctx.particles.emitAlongRay(
      a.x, a.y,
      nx, ny,
      dist, 3,
      0.27, 1, 0.27,
    );

    // 检测捕获
    if (dist < CAPTURE_DIST) {
      this.capturedRadius = a.radius;
      this.projMesh = a.mesh;
      this.projMesh.position.z = 0.5;
      ctx.asteroids.splice(this.targetAsteroidIdx, 1);
      this.targetAsteroidIdx = -1;
      this.chargeTimer = 0;
      this.chargeLevel = 0;
      this.state = SGState.CAPTURED;
    }
  }

  /** CAPTURED: 悬浮在准星方向 + 自动蓄力 */
  private updateCaptured(ctx: WeaponContext): void {
    if (!this.projMesh) { this.reset(); return; }

    // 悬浮在准星方向，距玩家 0.5
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

    // 自动蓄力
    this.chargeTimer += ctx.dt;
    const prevLevel = this.chargeLevel;
    this.chargeLevel = Math.min(
      CHARGE_TABLE.length - 1,
      Math.floor(this.chargeTimer / CHARGE_TABLE[0].time),
    );

    // 蓄力进度视觉：颜色变化 (绿→黄→红)
    const progress = Math.min(this.chargeTimer / CHARGE_TABLE[CHARGE_TABLE.length - 1].time, 1);
    const r = Math.min(progress * 2, 1);
    const g = Math.min((1 - progress) * 2, 1);
    (this.projMesh.material as MeshBasicMaterial).color.setRGB(r, g, 0);

    // 左键发射
    if (ctx.input.mouseDown) {
      const table = CHARGE_TABLE[this.chargeLevel];
      const aimLen = Math.sqrt(
        (ctx.aimX - ctx.playerX) ** 2 + (ctx.aimY - ctx.playerY) ** 2,
      );
      if (aimLen > 0) {
        this.projVx = (ctx.aimX - ctx.playerX) / aimLen * table.speed;
        this.projVy = (ctx.aimY - ctx.playerY) / aimLen * table.speed;
      } else {
        this.projVx = table.speed;
        this.projVy = 0;
      }
      this.projBudget = table.budget;
      this.projX = this.projMesh.position.x;
      this.projY = this.projMesh.position.y;
      this.flightDist = 0;
      this.state = SGState.LAUNCHED;
    }
  }

  /** LAUNCHED: 弹体飞行，碰撞检测 */
  private updateLaunched(ctx: WeaponContext): void {
    if (!this.projMesh) { this.reset(); return; }

    // 飞行
    this.projX += this.projVx * ctx.dt;
    this.projY += this.projVy * ctx.dt;
    this.flightDist += Math.sqrt(
      (this.projVx * ctx.dt) ** 2 + (this.projVy * ctx.dt) ** 2,
    );
    this.projMesh.position.set(this.projX, this.projY, 0.5);

    // 拖尾粒子
    ctx.particles.emit(this.projX, this.projY, 1, 0.6, 0.3, 0);

    // 碰撞检测
    for (let i = ctx.asteroids.length - 1; i >= 0; i--) {
      const a = ctx.asteroids[i];
      const dx = this.projX - a.x;
      const dy = this.projY - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < a.radius + this.capturedRadius) {
        // 造成伤害
        const damage = Math.min(this.projBudget, a.hp);
        a.takeDamage(damage);
        this.projBudget -= damage;
        // 命中爆炸粒子
        ctx.particles.emit(a.x, a.y, 8, 1, 0.67, 0.27);
        ctx.screenShake(0.03);
        // 目标陨石摧毁
        if (a.hp <= 0) {
          const reward = Math.ceil(a.radius * 10);
          ctx.asteroids.splice(i, 1);
          ctx.particles.emit(a.x, a.y, 15, 0.6, 0.6, 0.6);
          ctx.screenShake(0.08);
          ctx.addCurrency(reward, a.x, a.y);
        }
        // 弹药耗尽
        if (this.projBudget <= 0) {
          this.explodeProjectile(ctx);
          return;
        }
      }
    }

    // 超出射程
    if (this.flightDist > MAX_FLIGHT) {
      this.explodeProjectile(ctx);
    }
  }

  /** 弹体爆炸消失 */
  private explodeProjectile(ctx: WeaponContext): void {
    ctx.particles.emit(this.projX, this.projY, 15, 0.6, 0.3, 0);
    ctx.screenShake(0.06);
    if (this.projMesh) {
      this.projMesh.parent?.remove(this.projMesh);
      this.projMesh = null;
    }
    this.reset();
  }

  /** 查找前方 50° 扇形内最近的陨石，返回索引或 -1 */
  private findNearestInCone(ctx: WeaponContext): number {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < ctx.asteroids.length; i++) {
      const a = ctx.asteroids[i];
      if (!this.isInCone(a.x, a.y, ctx)) continue;
      const d = Math.sqrt((a.x - ctx.playerX) ** 2 + (a.y - ctx.playerY) ** 2);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /** 判断陨石是否在扇形区域内 */
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
    // 夹角的余弦 > cos(25°) ≈ 0.906
    return dot > 0.906;
  }

  /** 释放资源 */
  destroy(): void {
    this.coneMesh.parent?.remove(this.coneMesh);
    this.coneMesh.geometry.dispose();
    (this.coneMesh.material as MeshBasicMaterial).dispose();
    if (this.projMesh) {
      this.projMesh.parent?.remove(this.projMesh);
    }
  }
}
```

**注解:** 被捕获时陨石从 asteroids 数组 splice 移除，弹体发射后每帧检测与剩余陨石的距离。命中时先扣弹药预算，预算 ≤ 0 则爆炸消失。粒子流用 `emitAlongRay` 从陨石到玩家方向。

---

### Task 5: Game.ts 武器系统集成

**Files:**
- Modify: `src/game/Game.ts`

- [ ] **Step 1: 添加导入**

```ts
import { Laser } from '../weapons/Laser';
import { SuctionGun } from '../weapons/SuctionGun';
import { Weapon } from '../weapons/types';
```

- [ ] **Step 2: 替换 laser 字段为武器数组**

**替换：**
```ts
laser: Laser;
```
**改为：**
```ts
weapons: Weapon[] = [];
currentWeaponIndex = 0;
```

- [ ] **Step 3: 替换构造函数中的激光初始化**

**替换：**
```ts
this.laser = new Laser(this.scene);
```
**改为：**
```ts
this.weapons.push(new Laser(this.scene));
this.weapons.push(new SuctionGun(this.scene));
```

- [ ] **Step 4: 修正升级选项中对 laser.damage / laser.maxRange 的引用**

将所有 `this.laser.damage` 改为 `(this.weapons[0] as Laser).damage`，将所有 `this.laser.maxRange` 改为 `(this.weapons[0] as Laser).maxRange`。

**具体改动（buildUpgradeOptions 方法内）：**
```ts
(this.weapons[0] as Laser).damage = 10 + (this.laserDamageLv - 1) * 5;
(this.weapons[0] as Laser).maxRange = 4 + (this.laserRangeLv - 1) * 1;
```

- [ ] **Step 5: 替换 update 方法中的激光逻辑**

**删除以下行：**
```ts
if (input.mouseDown) {
  const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
  this.laser.fire(this.playerX, this.playerY, world.x, world.y);
  this.checkLaserHit(dt);
  ...
}
this.laser.updateLaser(dt);
```

**以及整个 `checkLaserHit` 方法。**

**替换为武器委托：**
```ts
// === Q/E 武器切换 ===
const qDown = input.keys.has('q');
const eDown = input.keys.has('e');
if (qDown && !this.prevQDown) {
  this.weapons[this.currentWeaponIndex].onSwitchAway();
  this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
}
if (eDown && !this.prevEDown) {
  this.weapons[this.currentWeaponIndex].onSwitchAway();
  this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
}
this.prevQDown = qDown;
this.prevEDown = eDown;

// === 当前武器更新 ===
const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
this.weapons[this.currentWeaponIndex].update({
  dt,
  input,
  playerX: this.playerX,
  playerY: this.playerY,
  aimX: world.x,
  aimY: world.y,
  asteroids: this.asteroids,
  particles: this.particles,
  camera: this.camera,
  addCurrency: (amount, wx, wy) => this.addCurrency(amount, wx, wy),
  screenShake: (intensity) => triggerScreenShake(this.camera, intensity),
});
```

- [ ] **Step 6: 新增 Q/E 按键追踪字段**

```ts
private prevQDown = false;
private prevEDown = false;
```

- [ ] **Step 7: 添加武器切换 HUD**

```ts
private weaponHUD: HTMLElement;
```

**初始化（构造函数中）：**
```ts
this.weaponHUD = this.createHUD('weapon-name', '#00ffff', '激光');
this.weaponHUD.style.bottom = '20px';
this.weaponHUD.style.left = '20px';
```

**更新 HUD（update 方法中，武器切换后）：**
```ts
this.weaponHUD.textContent = this.currentWeaponIndex === 0 ? '激光' : '吸盘枪';
```

- [ ] **Step 8: 删除原来的 `checkLaserHit` 方法**

移除 `private checkLaserHit(dt: number): boolean` 的整个方法体。

---

### Task 6: 构建验证

- [ ] **Step 1: 编译并修复类型错误**

```bash
cd "C:\Users\28766\Desktop\作业"
npx tsc --noEmit 2>&1
```

预期：0 错误。常见问题：
- `WeaponContext` 中 `addCurrency`/`screenShake` 类型与 Game.ts 方法签名不匹配 → 检查参数类型
- 属性名拼写错误 → 按编译器提示修复

- [ ] **Step 2: 构建生产版本**

```bash
npx vite build 2>&1
```

预期：构建成功，modules 数 = 18（新增 types.ts + SuctionGun.ts）
