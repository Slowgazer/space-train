/** 小游戏启动器 — 管理选取/启动/回调 */
import { RaindropGame } from './RaindropGame';
import { PinballGame } from './PinballGame';
import type { MiniGameCallbacks } from './types';

export class MiniGameManager {
  private container: HTMLElement;
  private activeGame: RaindropGame | PinballGame | null = null;
  private overlay: HTMLElement | null = null;
  private _onGameEnd: ((reward: number) => void) | null = null;
  private addEvoRes: ((amount: number) => void) | null = null;

  constructor() {
    this.container = document.getElementById('minigame-container')!;
  }

  setCallbacks(addEvoRes: (amount: number) => void, onGameEnd: (reward: number) => void): void {
    this.addEvoRes = addEvoRes;
    this._onGameEnd = onGameEnd;
  }

  get active(): boolean {
    return this.activeGame !== null;
  }

  /** 显示游戏选择界面（编辑模式按钮用） */
  showLauncher(): void {
    this.createLauncherOverlay();
  }

  /** 随机触发一个小游戏（种子事件用） */
  launchRandom(cb: (reward: number) => void): void {
    if (this.activeGame) return;
    const games = ['raindrop', 'pinball'];
    const choice = games[Math.floor(Math.random() * games.length)];
    this.launch(choice, cb);
  }

  /** 启动指定小游戏 */
  launch(type: string, onEnd?: (reward: number) => void): void {
    if (this.activeGame) return;

    const cb: MiniGameCallbacks = {
      addEvolutionResource: (amount: number) => {
        this.addEvoRes?.(amount);
      },
      onComplete: (reward: number) => {
        this.activeGame = null;
        onEnd?.(reward);
        this._onGameEnd?.(reward);
      },
    };

    if (type === 'raindrop') {
      this.activeGame = new RaindropGame(this.container, cb);
      this.activeGame.start();
    } else if (type === 'pinball') {
      this.activeGame = new PinballGame(this.container, cb);
      this.activeGame.start();
    }
  }

  /** 关闭当前游戏 */
  close(): void {
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.removeLauncherOverlay();
  }

  private createLauncherOverlay(): void {
    this.removeLauncherOverlay();

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.75);z-index:600;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-family:sans-serif;
    `;

    const title = document.createElement('h2');
    title.textContent = '🎮 迷你游戏';
    title.style.cssText = 'color:#fff;font-size:28px;margin-bottom:20px;';

    const desc = document.createElement('p');
    desc.textContent = '选择一个小游戏来赚取进化因子！';
    desc.style.cssText = 'color:#aaa;font-size:14px;margin-bottom:30px;';

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:20px;flex-wrap:wrap;justify-content:center;';

    const btnStyle = `
      padding:16px 32px;font-size:18px;border:2px solid rgba(255,255,255,0.2);
      border-radius:12px;background:rgba(255,255,255,0.05);color:#fff;
      cursor:pointer;transition:all 0.2s;min-width:200px;
      font-family:sans-serif;
    `;

    const raindropBtn = document.createElement('button');
    raindropBtn.textContent = '☔ 接雨滴';
    raindropBtn.style.cssText = btnStyle;
    raindropBtn.onmouseenter = () => { raindropBtn.style.borderColor = '#4a9eff'; raindropBtn.style.background = 'rgba(74,158,255,0.15)'; };
    raindropBtn.onmouseleave = () => { raindropBtn.style.borderColor = 'rgba(255,255,255,0.2)'; raindropBtn.style.background = 'rgba(255,255,255,0.05)'; };
    raindropBtn.onclick = () => { this.removeLauncherOverlay(); this.launch('raindrop'); };

    const pinballBtn = document.createElement('button');
    pinballBtn.textContent = '🔮 弹球';
    pinballBtn.style.cssText = btnStyle;
    pinballBtn.onmouseenter = () => { pinballBtn.style.borderColor = '#ffcc44'; pinballBtn.style.background = 'rgba(255,204,68,0.15)'; };
    pinballBtn.onmouseleave = () => { pinballBtn.style.borderColor = 'rgba(255,255,255,0.2)'; pinballBtn.style.background = 'rgba(255,255,255,0.05)'; };
    pinballBtn.onclick = () => { this.removeLauncherOverlay(); this.launch('pinball'); };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ 关闭';
    closeBtn.style.cssText = `
      ${btnStyle} border-color:#666;color:#999;margin-top:20px;min-width:auto;
    `;
    closeBtn.onclick = () => this.removeLauncherOverlay();

    btnContainer.appendChild(raindropBtn);
    btnContainer.appendChild(pinballBtn);
    this.overlay.appendChild(title);
    this.overlay.appendChild(desc);
    this.overlay.appendChild(btnContainer);
    this.overlay.appendChild(closeBtn);
    document.body.appendChild(this.overlay);
  }

  private removeLauncherOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
