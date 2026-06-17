/** 接雨滴小游戏 — 用 p5.js 实现 */
import type { MiniGameCallbacks } from './types';

declare var p5: any;

export class RaindropGame {
  private p5Instance: any = null;
  private container: HTMLElement;
  private cb: MiniGameCallbacks;
  private running = false;

  // 游戏状态
  private raindrops: any[] = [];
  private playerX = 200;
  private score = 0;
  private missed = 0;
  private splashParticles: any[] = [];
  private frame = 0;
  private gameTime = 0;
  private duration = 30;
  private spawnTimer = 0;

  constructor(container: HTMLElement, cb: MiniGameCallbacks) {
    this.container = container;
    this.cb = cb;
  }

  start(): void {
    this.running = true;
    this.raindrops = [];
    this.splashParticles = [];
    this.score = 0;
    this.missed = 0;
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.frame = 0;

    // 显示容器
    this.container.style.display = 'block';
    this.container.style.pointerEvents = 'auto';

    // 创建 p5 实例（instance mode）
    const that = this;
    this.p5Instance = new p5((p: any) => {
      p.setup = () => {
        const w = Math.min(600, window.innerWidth - 40);
        const h = Math.min(500, window.innerHeight - 40);
        p.createCanvas(w, h);
        that.playerX = w / 2;
      };

      p.draw = () => {
        that.frame++;
        const W = p.width;
        const H = p.height;

        // 背景
        p.background(20, 20, 40);

        // 游戏时间
        that.gameTime += 1 / 60;
        const remain = Math.max(0, that.duration - that.gameTime);

        // 生成雨滴
        that.spawnTimer -= 1 / 60;
        if (that.spawnTimer <= 0) {
          that.spawnTimer = 0.2 + Math.random() * 0.3;
          that.raindrops.push({
            x: Math.random() * (W - 20) + 10,
            y: -10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0,
            r: 3 + Math.random() * 4,
          });
        }

        // 物理更新：重力
        for (const drop of that.raindrops) {
          drop.vy += 0.15; // 重力
          drop.x += drop.vx;
          drop.y += drop.vy;
        }

        // 碰撞检测：玩家矩形接雨滴
        const pw = 80;
        const ph = 12;
        for (let i = that.raindrops.length - 1; i >= 0; i--) {
          const d = that.raindrops[i];
          if (d.y + d.r > H - 35 && d.y - d.r < H - 35 + ph &&
              d.x + d.r > that.playerX - pw / 2 && d.x - d.r < that.playerX + pw / 2) {
            // 接住了！
            that.score++;
            // 蓝色溅射粒子
            for (let j = 0; j < 8; j++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 1 + Math.random() * 3;
              that.splashParticles.push({
                x: d.x, y: H - 35,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                r: 2 + Math.random() * 3,
              });
            }
            that.raindrops.splice(i, 1);
          } else if (d.y - d.r > H) {
            // 落到地面
            that.missed++;
            // 地面溅射
            for (let j = 0; j < 4; j++) {
              that.splashParticles.push({
                x: d.x, y: H - 20,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random() * 2,
                life: 1,
                r: 2 + Math.random() * 2,
              });
            }
            that.raindrops.splice(i, 1);
          }
        }

        // 更新粒子
        for (let i = that.splashParticles.length - 1; i >= 0; i--) {
          const pt = that.splashParticles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.1;
          pt.life -= 0.03;
          if (pt.life <= 0) {
            that.splashParticles.splice(i, 1);
          }
        }

        // 绘制雨滴
        p.noStroke();
        for (const drop of that.raindrops) {
          p.fill(100, 150, 255, 200);
          p.circle(drop.x, drop.y, drop.r * 2);
        }

        // 绘制溅射粒子
        for (const pt of that.splashParticles) {
          const alpha = pt.life * 200;
          p.fill(80, 180, 255, alpha);
          p.circle(pt.x, pt.y, pt.r * 2);
        }

        // 绘制玩家（黄色矩形）
        p.fill(255, 220, 50);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(that.playerX, H - 35, pw, ph, 3);

        // 鼠标控制
        that.playerX = p.mouseX;
        that.playerX = Math.max(pw / 2, Math.min(W - pw / 2, that.playerX));

        // HUD
        p.fill(255);
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`接住: ${that.score}  错过: ${that.missed}  时间: ${Math.ceil(remain)}s`, 10, 10);

        // 倒计时结束
        if (remain <= 0) {
          that.endGame();
        }
      };
    }, this.container);
  }

  private endGame(): void {
    if (!this.running) return;
    this.running = false;
    const reward = this.score * 2;
    this.cb.addEvolutionResource(reward);
    this.destroy();
    this.cb.onComplete(reward);
  }

  destroy(): void {
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }
    this.container.style.display = 'none';
    this.container.style.pointerEvents = 'none';
    this.container.innerHTML = '';
  }
}
