# Phase 1: 项目骨架 + 基础渲染 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 Vite + TypeScript + Three.js 项目，实现游戏窗口、正交相机、玩家移动、列车自动滚动和玩家/列车渲染

**Architecture:** 入口 `main.ts` 初始化 Three.js 场景 → `Game.ts` 管理游戏循环 → `Input.ts` 统一处理输入 → 实体（Player, Train, Seed）各自管理自身渲染和更新

**Tech Stack:** Vite 6, TypeScript 5, Three.js 0.170+, Node.js 24

### 全局代码规范

1. **注释**：所有代码必须包含中文注释（类说明、方法说明、关键逻辑说明）
2. **文件分离**：HTML、CSS、JS 各自独立文件，每个类一个独立 TS 文件
3. **面向对象**：优先使用 class + interface 组织代码
4. **命名**：类名 PascalCase，方法/变量 camelCase

---

### Task 1: 初始化项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "space-train",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.170.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@types/three": "^0.170.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
```

- [ ] **Step 4: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>太空列车物语</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: 创建 src/style.css**

```css
/* 全局样式 - 太空列车物语 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

#game-container {
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
}
```

- [ ] **Step 6: 安装依赖**

Run: `npm install`

Run: `npm install`
Expected: node_modules/ 创建完成，无报错

- [ ] **Step 7: 验证启动**

Run: `npx vite --host 0.0.0.0` — 确认终端输出 `Local: http://localhost:5173`
按 Ctrl+C 停止

---

### Task 2: Three.js 场景 + 正交相机

**Files:**
- Create: `src/engine/Camera.ts`
- Create: `src/engine/Input.ts`
- Create: `src/game/Game.ts`
- Create: `src/main.ts`

- [ ] **Step 1: 创建 Camera.ts**

```ts
import { OrthographicCamera } from 'three';

export function createGameCamera(): OrthographicCamera {
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 10;
  const camera = new OrthographicCamera(
    -viewSize * aspect,
    viewSize * aspect,
    viewSize,
    -viewSize,
    0.1,
    100,
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function updateCamera(
  camera: OrthographicCamera,
  targetX: number,
  targetY: number,
): void {
  camera.position.x = targetX;
  camera.position.y = targetY;
  camera.lookAt(targetX, targetY, 0);
}
```

- [ ] **Step 2: 创建 Input.ts**

```ts
export interface InputState {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
}

const state: InputState = {
  keys: new Set(),
  mouseX: 0,
  mouseY: 0,
  mouseDown: false,
};

export function initInput(canvas: HTMLCanvasElement): void {
  window.addEventListener('keydown', (e) => state.keys.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));
  canvas.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
  });
  canvas.addEventListener('mousedown', () => { state.mouseDown = true; });
  canvas.addEventListener('mouseup', () => { state.mouseDown = false; });
}

export function getInput(): InputState {
  return state;
}
```

- [ ] **Step 3: 创建 Game.ts**

```ts
import { Scene, WebGLRenderer } from 'three';
import { createGameCamera, updateCamera } from '../engine/Camera';
import { initInput, getInput } from '../engine/Input';

export class Game {
  scene: Scene;
  camera: ReturnType<typeof createGameCamera>;
  renderer: WebGLRenderer;
  playerX = 0;

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.camera = createGameCamera();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const viewSize = 10;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    const input = getInput();
    const speed = 5;
    if (input.keys.has('w')) this.playerY += speed * dt;
    if (input.keys.has('s')) this.playerY -= speed * dt;
    if (input.keys.has('a')) this.playerX -= speed * dt;
    if (input.keys.has('d')) this.playerX += speed * dt;

    updateCamera(this.camera, this.playerX, this.playerY);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

Wait — `playerY` is not declared. Let me fix:

```ts
export class Game {
  scene: Scene;
  camera: ReturnType<typeof createGameCamera>;
  renderer: WebGLRenderer;
  playerX = 0;
  playerY = 0;

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.camera = createGameCamera();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const viewSize = 10;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    const input = getInput();
    const speed = 5;
    if (input.keys.has('w')) this.playerY += speed * dt;
    if (input.keys.has('s')) this.playerY -= speed * dt;
    if (input.keys.has('a')) this.playerX -= speed * dt;
    if (input.keys.has('d')) this.playerX += speed * dt;

    updateCamera(this.camera, this.playerX, this.playerY);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 4: 创建 main.ts**

```ts
import { Game } from './game/Game';

const container = document.getElementById('game-container')!;
const game = new Game(container);

let lastTime = performance.now();
function loop(time: number): void {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  game.update(dt);
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

- [ ] **Step 5: 验证运行**

Run: `npx vite --host 0.0.0.0`
Expected: 浏览器打开 http://localhost:5173 看到黑色画面，无控制台报错
按 Ctrl+C 停止

---

### Task 3: 玩家实体渲染

**Files:**
- Create: `src/entities/Player.ts`
- Modify: `src/game/Game.ts`

- [ ] **Step 1: 创建 Player.ts**

```ts
import { Color, Group, Mesh, MeshBasicMaterial, RingGeometry, Sprite, SpriteMaterial, Texture, TextureLoader } from 'three';

export interface PlayerConfig {
  color: string;
  face: string;
}

const FACE_TEXTURES: Record<string, string> = {
  '^^': '😊',
  '>_<': '😣',
  '0_0': '😮',
  '-_-': '😑',
};

export class Player {
  group: Group;
  body: Mesh;
  face: Sprite;

  constructor(config: PlayerConfig) {
    this.group = new Group();

    const bodyGeo = new RingGeometry(0.4, 0.5, 32);
    this.body = new Mesh(bodyGeo, new MeshBasicMaterial({ color: config.color }));
    this.group.add(this.body);

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.face, 32, 32);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const material = new SpriteMaterial({ map: texture, transparent: true });
    this.face = new Sprite(material);
    this.face.scale.set(0.6, 0.6, 1);
    this.face.position.z = 0.1;
    this.group.add(this.face);
  }

  setPosition(x: number, y: number): void {
    this.group.position.set(x, y, 1);
  }
}
```

- [ ] **Step 2: 修改 Game.ts（导入 Player 并添加至场景）**

```ts
import { Scene, WebGLRenderer } from 'three';
import { createGameCamera, updateCamera } from '../engine/Camera';
import { initInput, getInput } from '../engine/Input';
import { Player } from '../entities/Player';

export class Game {
  scene: Scene;
  camera: ReturnType<typeof createGameCamera>;
  renderer: WebGLRenderer;
  player: Player;
  playerX = 0;
  playerY = 0;

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.camera = createGameCamera();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.player = new Player({ color: '#4fc3f7', face: '^^' });
    this.scene.add(this.player.group);

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const viewSize = 10;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    const input = getInput();
    const speed = 5;
    if (input.keys.has('w')) this.playerY += speed * dt;
    if (input.keys.has('s')) this.playerY -= speed * dt;
    if (input.keys.has('a')) this.playerX -= speed * dt;
    if (input.keys.has('d')) this.playerX += speed * dt;

    this.player.setPosition(this.playerX, this.playerY);
    updateCamera(this.camera, this.playerX, this.playerY);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 3: 验证**

Run: `npx vite --host 0.0.0.0`
Expected: 浏览器中看到一个彩色圆环 + 颜文字，WASD 可移动

---

### Task 4: 列车实体渲染 + 自动滚动

**Files:**
- Create: `src/entities/Train.ts`
- Modify: `src/game/Game.ts`

- [ ] **Step 1: 创建 Train.ts**

```ts
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';

interface CarConfig {
  color: string;
  width: number;
  height: number;
  label?: string;
}

const CARS: CarConfig[] = [
  { color: '#e53935', width: 1.2, height: 0.6, label: '车头' },
  { color: '#7b1fa2', width: 1.0, height: 0.6, label: '升级' },
  { color: '#2e7d32', width: 1.2, height: 0.8, label: '种子' },
  { color: '#546e7a', width: 1.0, height: 0.6, label: '车厢' },
  { color: '#546e7a', width: 1.0, height: 0.6, label: '车厢' },
];

export class Train {
  group: Group;
  speed = 2;

  constructor() {
    this.group = new Group();
    this.buildCars();
    this.group.position.y = -2;
  }

  private buildCars(): void {
    let offsetX = 0;
    // 从右到左排列：车头（最右）在最前
    for (let i = CARS.length - 1; i >= 0; i--) {
      const car = CARS[i];
      const geo = new BoxGeometry(car.width, car.height, 0.3);
      const mat = new MeshBasicMaterial({ color: car.color });
      const mesh = new Mesh(geo, mat);
      mesh.position.x = offsetX + car.width / 2;
      this.group.add(mesh);
      offsetX += car.width + 0.1;
    }
  }

  update(dt: number): void {
    this.group.position.x += this.speed * dt;
  }

  get positionX(): number {
    return this.group.position.x;
  }

  get width(): number {
    return CARS.reduce((sum, c) => sum + c.width + 0.1, 0);
  }
}
```

- [ ] **Step 2: 修改 Game.ts（添加 Train）**

```ts
import { Scene, WebGLRenderer } from 'three';
import { createGameCamera, updateCamera } from '../engine/Camera';
import { initInput, getInput } from '../engine/Input';
import { Player } from '../entities/Player';
import { Train } from '../entities/Train';

export class Game {
  scene: Scene;
  camera: ReturnType<typeof createGameCamera>;
  renderer: WebGLRenderer;
  player: Player;
  train: Train;
  playerX = 0;
  playerY = 0;

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.camera = createGameCamera();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.player = new Player({ color: '#4fc3f7', face: '^^' });
    this.scene.add(this.player.group);

    this.train = new Train();
    this.scene.add(this.train.group);

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const viewSize = 10;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    const input = getInput();
    const speed = 5;
    if (input.keys.has('w')) this.playerY += speed * dt;
    if (input.keys.has('s')) this.playerY -= speed * dt;
    if (input.keys.has('a')) this.playerX -= speed * dt;
    if (input.keys.has('d')) this.playerX += speed * dt;

    this.player.setPosition(this.playerX, this.playerY);
    this.train.update(dt);
    updateCamera(this.camera, this.playerX, this.playerY);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 3: 验证**

Run: `npx vite --host 0.0.0.0`
Expected: 列车从右向左自动移动，玩家可用 WASD 在场景中移动

---

### Task 5: 基础激光射击

**Files:**
- Create: `src/weapons/Laser.ts`
- Modify: `src/game/Game.ts`

- [ ] **Step 1: 创建 Laser.ts**

```ts
import { BufferGeometry, Color, Float32BufferAttribute, Line, LineBasicMaterial, Scene } from 'three';

export class Laser {
  private line: Line;
  private active = false;
  private start = 0;
  range = 4;
  damage = 10;

  constructor(scene: Scene) {
    const geo = new BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
    this.line = new Line(geo, mat);
    this.line.visible = false;
    scene.add(this.line);
  }

  fire(originX: number, originY: number, targetX: number, targetY: number): void {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const nx = dx / len;
    const ny = dy / len;
    const endX = originX + nx * this.range;
    const endY = originY + ny * this.range;

    const pos = this.line.geometry.attributes.position.array as Float32Array;
    pos[0] = originX; pos[1] = originY; pos[2] = 0.5;
    pos[3] = endX; pos[4] = endY; pos[5] = 0.5;
    this.line.geometry.attributes.position.needsUpdate = true;
    this.line.visible = true;
    this.active = true;
  }

  hide(): void {
    this.line.visible = false;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }
}
```

- [ ] **Step 2: 修改 Game.ts（添加激光射击逻辑）**

```ts
import { Scene, WebGLRenderer, Vector2 } from 'three';
import { createGameCamera, updateCamera } from '../engine/Camera';
import { initInput, getInput } from '../engine/Input';
import { Player } from '../entities/Player';
import { Train } from '../entities/Train';
import { Laser } from '../weapons/Laser';

export class Game {
  scene: Scene;
  camera: ReturnType<typeof createGameCamera>;
  renderer: WebGLRenderer;
  player: Player;
  train: Train;
  laser: Laser;
  playerX = 0;
  playerY = 0;
  private mouseWorld = new Vector2();

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.camera = createGameCamera();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.player = new Player({ color: '#4fc3f7', face: '^^' });
    this.scene.add(this.player.group);

    this.train = new Train();
    this.scene.add(this.train.group);

    this.laser = new Laser(this.scene);

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.mouseWorld.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      this.mouseWorld.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    });
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const viewSize = 10;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
    const viewSize = 10;
    return {
      x: sx * viewSize * aspect + this.camera.position.x,
      y: -sy * viewSize + this.camera.position.y,
    };
  }

  update(dt: number): void {
    const input = getInput();
    const speed = 5;
    if (input.keys.has('w')) this.playerY += speed * dt;
    if (input.keys.has('s')) this.playerY -= speed * dt;
    if (input.keys.has('a')) this.playerX -= speed * dt;
    if (input.keys.has('d')) this.playerX += speed * dt;

    this.player.setPosition(this.playerX, this.playerY);
    this.train.update(dt);
    updateCamera(this.camera, this.playerX, this.playerY);

    if (input.mouseDown) {
      const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
      this.laser.fire(this.playerX, this.playerY, world.x, world.y);
    } else {
      this.laser.hide();
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 3: 验证**

Run: `npx vite --host 0.0.0.0`
Expected: 按住鼠标左键，从玩家位置向鼠标方向发射一条青色激光线，松开后消失

---

### Task 6: 生成基础陨石 + 碰撞检测

**Files:**
- Create: `src/entities/Asteroid.ts`
- Modify: `src/game/Game.ts`

- [ ] **Step 1: 创建 Asteroid.ts**

```ts
import { CircleGeometry, Color, Mesh, MeshBasicMaterial, Scene } from 'three';

export class Asteroid {
  mesh: Mesh;
  vx: number;
  vy: number;
  hp: number;
  radius: number;

  constructor(scene: Scene, x: number, y: number, radius: number) {
    this.radius = radius;
    this.hp = radius * 10;
    const geo = new CircleGeometry(radius, 8);
    const mat = new MeshBasicMaterial({ color: 0x888888 });
    this.mesh = new Mesh(geo, mat);
    this.mesh.position.set(x, y, 0);
    scene.add(this.mesh);
    this.vx = -1 - Math.random() * 2;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  update(dt: number): void {
    this.mesh.position.x += this.vx * dt;
    this.mesh.position.y += this.vy * dt;
  }

  takeDamage(damage: number): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.mesh.parent?.remove(this.mesh);
      return true;
    }
    return false;
  }

  get x(): number { return this.mesh.position.x; }
  get y(): number { return this.mesh.position.y; }
}
```

- [ ] **Step 2: 修改 Game.ts（陨石生成 + 激光碰撞检测）**

添加陨石生成逻辑和碰撞检测到 Game.ts。修改后的文件：

```ts
import { Scene, WebGLRenderer } from 'three';
import { createGameCamera, updateCamera } from '../engine/Camera';
import { initInput, getInput } from '../engine/Input';
import { Player } from '../entities/Player';
import { Train } from '../entities/Train';
import { Laser } from '../weapons/Laser';
import { Asteroid } from '../entities/Asteroid';

export class Game {
  scene: Scene;
  camera: ReturnType<typeof createGameCamera>;
  renderer: WebGLRenderer;
  player: Player;
  train: Train;
  laser: Laser;
  asteroids: Asteroid[] = [];
  playerX = 0;
  playerY = 0;
  spawnTimer = 0;
  spawnInterval = 1.5;
  private mouseWorld = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.camera = createGameCamera();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.player = new Player({ color: '#4fc3f7', face: '^^' });
    this.scene.add(this.player.group);

    this.train = new Train();
    this.scene.add(this.train.group);

    this.laser = new Laser(this.scene);

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.mouseWorld.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      this.mouseWorld.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    });
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const viewSize = 10;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
    const viewSize = 10;
    return {
      x: sx * viewSize * aspect + this.camera.position.x,
      y: -sy * viewSize + this.camera.position.y,
    };
  }

  private spawnAsteroid(): void {
    const cameraRight = this.camera.position.x + 15;
    const radius = 0.3 + Math.random() * 0.5;
    const y = this.camera.position.y + (Math.random() - 0.5) * 12;
    this.asteroids.push(new Asteroid(this.scene, cameraRight, y, radius));
  }

  private checkLaserHit(): void {
    if (!this.laser.isActive) return;

    const input = getInput();
    const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
    const dx = world.x - this.playerX;
    const dy = world.y - this.playerY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const nx = dx / len;
    const ny = dy / len;

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      const toAsteroidX = a.x - this.playerX;
      const toAsteroidY = a.y - this.playerY;
      const proj = toAsteroidX * nx + toAsteroidY * ny;

      if (proj < 0 || proj > this.laser.range) continue;

      const closestX = this.playerX + nx * proj;
      const closestY = this.playerY + ny * proj;
      const dist = Math.sqrt((a.x - closestX) ** 2 + (a.y - closestY) ** 2);

      if (dist < a.radius + 0.1) {
        const destroyed = a.takeDamage(this.laser.damage);
        if (destroyed) {
          this.asteroids.splice(i, 1);
        }
      }
    }
  }

  update(dt: number): void {
    const input = getInput();
    const speed = 5;
    if (input.keys.has('w')) this.playerY += speed * dt;
    if (input.keys.has('s')) this.playerY -= speed * dt;
    if (input.keys.has('a')) this.playerX -= speed * dt;
    if (input.keys.has('d')) this.playerX += speed * dt;

    this.player.setPosition(this.playerX, this.playerY);
    this.train.update(dt);
    updateCamera(this.camera, this.playerX, this.playerY);

    // 陨石生成
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    // 更新陨石
    for (const a of this.asteroids) {
      a.update(dt);
    }

    // 激光
    if (input.mouseDown) {
      const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
      this.laser.fire(this.playerX, this.playerY, world.x, world.y);
      this.checkLaserHit();
    } else {
      this.laser.hide();
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 3: 验证**

Run: `npx vite --host 0.0.0.0`
Expected: 陨石从右侧生成并向左移动，鼠标按住发射激光可击碎陨石

---

### Task 7: 种子实体 + 种子车厢标记

**Files:**
- Create: `src/entities/Seed.ts`
- Modify: `src/game/Game.ts`
- Modify: `src/entities/Train.ts`（给种子车厢特殊标记）

- [ ] **Step 1: 创建 Seed.ts**

```ts
import { Color, Group, Mesh, MeshBasicMaterial, RingGeometry, Sprite, SpriteMaterial, Texture } from 'three';

export class Seed {
  group: Group;
  hp = 50;
  maxHp = 50;

  constructor() {
    this.group = new Group();

    const bodyGeo = new RingGeometry(0.5, 0.6, 32);
    const bodyMat = new MeshBasicMaterial({ color: 0x2e7d32 });
    const body = new Mesh(bodyGeo, bodyMat);
    this.group.add(body);

    const innerGeo = new RingGeometry(0.15, 0.3, 16);
    const innerMat = new MeshBasicMaterial({ color: 0x66bb6a });
    const inner = new Mesh(innerGeo, innerMat);
    inner.position.z = 0.05;
    this.group.add(inner);

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#a5d6a7';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌱', 32, 32);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const faceMat = new SpriteMaterial({ map: texture, transparent: true });
    const face = new Sprite(faceMat);
    face.scale.set(0.7, 0.7, 1);
    face.position.z = 0.1;
    this.group.add(face);
  }

  takeDamage(damage: number): boolean {
    this.hp -= damage;
    return this.hp <= 0;
  }
}
```

- [ ] **Step 2: 修改 Train.ts — 添加车厢索引和位置方法**

完整修改后的 `Train.ts`：

```ts
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';

interface CarConfig {
  color: string;
  width: number;
  height: number;
}

const CARS: CarConfig[] = [
  { color: '#e53935', width: 1.2, height: 0.6 },   // 车头 (index 0, 最右)
  { color: '#7b1fa2', width: 1.0, height: 0.6 },   // 升级 (index 1)
  { color: '#2e7d32', width: 1.2, height: 0.8 },   // 种子 (index 2)
  { color: '#546e7a', width: 1.0, height: 0.6 },   // 车厢 (index 3)
  { color: '#546e7a', width: 1.0, height: 0.6 },   // 车厢 (index 4)
];

export const SEED_CAR_INDEX = 2;

export class Train {
  group: Group;
  speed = 2;

  constructor() {
    this.group = new Group();
    this.buildCars();
    this.group.position.y = -2;
  }

  private buildCars(): void {
    let offsetX = 0;
    for (let i = CARS.length - 1; i >= 0; i--) {
      const car = CARS[i];
      const geo = new BoxGeometry(car.width, car.height, 0.3);
      const mat = new MeshBasicMaterial({ color: car.color });
      const mesh = new Mesh(geo, mat);
      mesh.position.x = offsetX + car.width / 2;
      this.group.add(mesh);
      offsetX += car.width + 0.1;
    }
  }

  update(dt: number): void {
    this.group.position.x += this.speed * dt;
  }

  getCarPosition(index: number): number {
    let pos = this.group.position.x;
    for (let i = CARS.length - 1; i > index; i--) {
      pos += CARS[i].width + 0.1;
    }
    pos += CARS[index].width / 2;
    return pos;
  }

  get positionX(): number {
    return this.group.position.x;
  }

  get width(): number {
    return CARS.reduce((sum, c) => sum + c.width + 0.1, 0);
  }
}
```

- [ ] **Step 3: 修改 Game.ts — 将 Seed 添加到种子车厢位置**

```ts
// 在 constructor 中，train 初始化之后添加：
import { Seed } from '../entities/Seed';
import { SEED_CAR_INDEX } from '../entities/Train';

// ...
this.seed = new Seed();
this.scene.add(this.seed.group);
// seed 的初始位置在 update 中跟随列车

// 在 update() 中添加：
const seedWorldX = this.train.getCarPosition(SEED_CAR_INDEX);
this.seed.group.position.set(seedWorldX, -2, 0.5);
```

- [ ] **Step 4: 验证**

Run: `npx vite --host 0.0.0.0`
Expected: 种子随列车移动，显示在绿色车厢位置

---

## 完成标准

运行 `npx vite --host 0.0.0.0` 后：
1. 黑色背景的 Three.js 场景正常显示
2. 玩家（圆环+颜文字）可用 WASD 移动
3. 列车从右向左自动滚动
4. 按住鼠标左键发射激光，松开消失
5. 陨石从右侧生成，可被激光击碎
6. 种子车厢显示特殊标记
