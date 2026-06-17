/** 弹球小游戏 — 用 p5.js 实现 */
import type { MiniGameCallbacks } from './types';

declare var p5: any;

interface Brick {
  x: number; y: number; w: number; h: number;
  hp: number; color: number;
}

export class PinballGame {
  private p5Instance: any = null;
  private container: HTMLElement;
  private cb: MiniGameCallbacks;
  private running = false;

  // 游戏状态
  private ball = { x: 300, y: 200, vx: 0, vy: 0, r: 8 };
  private paddle = { x: 300, w: 80, h: 12 };
  private bricks: Brick[] = [];
  private score = 0;
  private lives = 3;
  private started = false;
  private phase: 'ready' | 'playing' | 'over' = 'ready';
  private W = 600;
  private H = 500;
  private trail: { x: number; y: number }[] = [];

  constructor(container: HTMLElement, cb: MiniGameCallbacks) {
    this.container = container;
    this.cb = cb;
  }

  start(): void {
    this.running = true;
    this.bricks = [];
    this.score = 0;
    this.lives = 3;
    this.phase = 'ready';
    this.started = false;

    this.container.style.display = 'block';
    this.container.style.pointerEvents = 'auto';

    const that = this;
    this.p5Instance = new p5((p: any) => {
      p.setup = () => {
        that.W = Math.min(600, window.innerWidth - 40);
        that.H = Math.min(500, window.innerHeight - 40);
        p.createCanvas(that.W, that.H);
        that.resetBall();
        that.generateBricks();
      };

      p.draw = () => {
        const W = that.W;
        const H = that.H;

        p.background(15, 15, 30);

        // Draw bricks
        for (const brick of that.bricks) {
          const colors = [0xff4444, 0xff8844, 0xffcc44, 0x44ff44, 0x4488ff];
          p.fill(brick.color);
          p.noStroke();
          p.rect(brick.x, brick.y, brick.w, brick.h, 3);
        }

        // Draw paddle
        p.fill(255, 220, 50);
        p.noStroke();
        p.rectMode(p.CENTER);
        that.paddle.x = p.mouseX;
        that.paddle.x = Math.max(that.paddle.w / 2, Math.min(W - that.paddle.w / 2, that.paddle.x));
        p.rect(that.paddle.x, H - 25, that.paddle.w, that.paddle.h, 4);
        p.rectMode(p.CORNER);

        if (that.phase === 'ready') {
          // Ready phase - show ball above paddle, wait for click
          that.ball.x = that.paddle.x;
          that.ball.y = H - 25 - that.ball.r - 6;
          that.ball.vx = 0;
          that.ball.vy = 0;

          // Draw ball
          p.fill(255);
          p.circle(that.ball.x, that.ball.y, that.ball.r * 2);

          // HUD
          p.fill(255);
          p.textSize(18);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('点击鼠标左键发射！', W / 2, H / 2 - 30);
          p.textSize(14);
          p.text(`得分: ${that.score}  命: ${'❤️'.repeat(that.lives)}`, W / 2, H / 2 + 10);

          // Check mouse click
          if (p.mouseIsPressed && that.started === false) {
            that.started = true;
            that.phase = 'playing';
            that.ball.vy = 5;
            that.ball.vx = (Math.random() - 0.5) * 2;
          }
        } else if (that.phase === 'playing') {
          // Physics
          that.ball.x += that.ball.vx;
          that.ball.y += that.ball.vy;

          // Trail
          that.trail.push({ x: that.ball.x, y: that.ball.y });
          if (that.trail.length > 8) that.trail.shift();

          // Wall collisions
          if (that.ball.x - that.ball.r < 0) { that.ball.x = that.ball.r; that.ball.vx *= -1; }
          if (that.ball.x + that.ball.r > W) { that.ball.x = W - that.ball.r; that.ball.vx *= -1; }
          if (that.ball.y - that.ball.r < 0) { that.ball.y = that.ball.r; that.ball.vy *= -1; }

          // Paddle collision (perfect elastic)
          if (that.ball.vy > 0 &&
              that.ball.y + that.ball.r > H - 25 - that.paddle.h / 2 &&
              that.ball.y + that.ball.r < H - 25 + that.paddle.h / 2 &&
              that.ball.x > that.paddle.x - that.paddle.w / 2 &&
              that.ball.x < that.paddle.x + that.paddle.w / 2) {
            that.ball.y = H - 25 - that.paddle.h / 2 - that.ball.r;
            // Reflect angle based on where it hits the paddle
            const hitPos = (that.ball.x - that.paddle.x) / (that.paddle.w / 2);
            that.ball.vx = hitPos * 4;
            that.ball.vy = -Math.abs(that.ball.vy);
          }

          // Bottom (miss)
          if (that.ball.y - that.ball.r > H) {
            that.lives--;
            if (that.lives <= 0) {
              that.phase = 'over';
              that.endGame();
              return;
            }
            that.phase = 'ready';
            that.started = false;
            return;
          }

          // Brick collisions (perfect elastic)
          for (let i = that.bricks.length - 1; i >= 0; i--) {
            const b = that.bricks[i];
            if (that.ball.x + that.ball.r > b.x && that.ball.x - that.ball.r < b.x + b.w &&
                that.ball.y + that.ball.r > b.y && that.ball.y - that.ball.r < b.y + b.h) {

              // Determine collision side
              const overlapX = Math.min(that.ball.x + that.ball.r - b.x, b.x + b.w - (that.ball.x - that.ball.r));
              const overlapY = Math.min(that.ball.y + that.ball.r - b.y, b.y + b.h - (that.ball.y - that.ball.r));

              if (overlapX < overlapY) {
                that.ball.vx *= -1;
              } else {
                that.ball.vy *= -1;
              }

              b.hp--;
              if (b.hp <= 0) {
                that.bricks.splice(i, 1);
                that.score += 10;
                that.cb.addEvolutionResource(2);
              }
              break;
            }
          }

          // Draw trail
          p.noStroke();
          for (const t of that.trail) {
            p.fill(255, 255, 255, 30);
            p.circle(t.x, t.y, that.ball.r * 1.5);
          }

          // Draw ball
          p.fill(255);
          p.circle(that.ball.x, that.ball.y, that.ball.r * 2);
          // Ball glow
          p.fill(200, 200, 255, 50);
          p.circle(that.ball.x, that.ball.y, that.ball.r * 4);

          // HUD
          p.fill(255);
          p.textSize(14);
          p.textAlign(p.LEFT, p.TOP);
          p.text(`得分: ${that.score}  砖块: ${that.bricks.length}  命: ${'❤️'.repeat(that.lives)}`, 10, 10);

          // Win check
          if (that.bricks.length === 0) {
            that.phase = 'over';
            that.endGame();
          }
        }
      };
    }, this.container);
  }

  private generateBricks(): void {
    const cols = 8;
    const rows = 4;
    const bw = (this.W - 40) / cols;
    const bh = 22;
    const colors = [0xff4444, 0xff8844, 0xffcc44, 0x44ff44];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Random missing bricks for variety
        if (Math.random() < 0.15) continue;
        this.bricks.push({
          x: 20 + c * bw,
          y: 30 + r * (bh + 6),
          w: bw - 4,
          h: bh,
          hp: r < 2 ? 2 : 1,
          color: colors[r % colors.length],
        });
      }
    }
  }

  private resetBall(): void {
    this.ball.x = this.paddle.x;
    this.ball.y = this.H - 30;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  private endGame(): void {
    if (!this.running) return;
    this.running = false;
    const bonus = this.bricks.length === 0 ? 20 : 0;
    const reward = this.score + bonus;
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
