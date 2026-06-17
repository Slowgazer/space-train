import { Scene, Sprite, SpriteMaterial, Texture } from 'three';

/**
 * 事件标记 - 3D 感叹号精灵
 * 漂浮在事件位置上方，提示玩家靠近
 */
export class EventMarker {
  sprite: Sprite;
  private timer = 0;

  constructor(scene: Scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // 圆形背景
    ctx.fillStyle = 'rgba(255,180,0,0.25)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    // 感叹号
    ctx.fillStyle = '#ffbb00';
    ctx.font = 'bold 40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 32, 32);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const mat = new SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.sprite = new Sprite(mat);
    this.sprite.scale.set(1.2, 1.2, 1);
    this.sprite.visible = false;
    this.sprite.renderOrder = 2;
    scene.add(this.sprite);
  }

  /** 设置标记位置 */
  setPosition(x: number, y: number): void {
    this.sprite.position.set(x, y, 1);
  }

  show(): void { this.sprite.visible = true; }
  hide(): void { this.sprite.visible = false; }

  /** 每帧更新：上下浮动动画 */
  update(dt: number): void {
    if (!this.sprite.visible) return;
    this.timer += dt;
    this.sprite.position.z = 1 + Math.sin(this.timer * 3) * 0.3;
    this.sprite.material.opacity = 0.7 + Math.sin(this.timer * 5) * 0.3;
  }

  /** 清理 */
  destroy(): void {
    this.sprite.parent?.remove(this.sprite);
    this.sprite.material.dispose();
  }
}
