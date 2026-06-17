import {
  AdditiveBlending, Sprite, SpriteMaterial, Scene, Texture,
} from 'three';

const MAX_PARTICLES = 500;

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
  active: boolean;
}

/**
 * 粒子效果（基于 Sprite）
 * 池化 Sprite 对象，避免缓冲区管理问题
 */
export class ParticleBurst {
  private particles: Particle[] = [];
  private texture: Texture;

  constructor(scene: Scene) {
    // 生成圆形渐变纹理
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    this.texture = new Texture(canvas);
    this.texture.needsUpdate = true;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const mat = new SpriteMaterial({
        map: this.texture,
        transparent: true,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        opacity: 1,
      });
      const sprite = new Sprite(mat);
      sprite.visible = false;
      sprite.renderOrder = 3;
      scene.add(sprite);
      this.particles.push({
        sprite,
        vx: 0, vy: 0,
        life: 0,
        active: false,
      });
    }
  }

  /** 获取一个空闲粒子 */
  private alloc(): Particle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }

  /** 设置粒子颜色和缩放 */
  private setup(sprite: Sprite, r: number, g: number, b: number): void {
    sprite.material.color.setRGB(r, g, b);
    sprite.scale.set(0.3, 0.3, 1);
  }

  /** 在指定位置向外爆裂发射粒子 */
  emit(
    x: number, y: number, count: number,
    r = 1, g = 0.67, b = 0.27,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.alloc();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0.25 + Math.random() * 0.35;
      p.sprite.position.set(x, y, 0.5);
      this.setup(p.sprite, r, g, b);
      p.sprite.visible = true;
      p.active = true;
    }
  }

  /** 沿射线发射装饰性粒子，近端密集远端稀疏 */
  emitAlongRay(
    ox: number, oy: number,
    dx: number, dy: number,
    length: number,
    count: number,
    r = 0.5, g = 1, b = 1,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.alloc();
      if (!p) break;
      // 二次曲线分布：近端密集远端稀疏
      const rawT = i / (count - 1);
      const t = 0.02 + rawT * rawT * 0.98;
      const perpX = -dy;
      const perpY = dx;
      // 交替在光束两侧刷新（一边各一半），间隔 = 激光宽度
      const side = (i % 2 === 0) ? -1 : 1;
      const offset = 0.04;
      const px = ox + dx * t * length + perpX * offset * side;
      const py = oy + dy * t * length + perpY * offset * side;
      // 朝玩家方向快速回抽 + 两侧抖动
      p.vx = -dx * (0.8 + Math.random() * 0.7) + perpX * (Math.random() - 0.5) * 0.6;
      p.vy = -dy * (0.8 + Math.random() * 0.7) + perpY * (Math.random() - 0.5) * 0.6;
      p.life = 0.25 + Math.random() * 0.15;
      p.sprite.position.set(px, py, 0.5);
      p.sprite.scale.set(0.06, 0.06, 1);
      p.sprite.material.color.setRGB(r, g, b);
      p.sprite.visible = true;
      p.active = true;
    }
  }

  /** 每帧更新粒子 */
  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        p.sprite.visible = false;
        p.active = false;
        continue;
      }
      // 随生命周期衰减透明度
      const alpha = Math.min(p.life / 0.25, 1);
      p.sprite.material.opacity = alpha;
    }
  }

  /** 清理 */
  destroy(): void {
    for (const p of this.particles) {
      p.sprite.parent?.remove(p.sprite);
      p.sprite.material.dispose();
    }
    this.texture.dispose();
  }
}
