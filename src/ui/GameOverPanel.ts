export class GameOverPanel {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'gameover-panel';
    this.container.innerHTML = `
      <style>
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRed {
          0%,100% { text-shadow: 0 0 20px rgba(255,50,50,0.4), 0 0 60px rgba(255,50,50,0.2); }
          50% { text-shadow: 0 0 30px rgba(255,50,50,0.7), 0 0 80px rgba(255,50,50,0.35); }
        }
      </style>
      <div id="gameover-box">
        <div id="gameover-icon">💀</div>
        <h1 id="gameover-title">游戏结束</h1>
        <div id="gameover-reason"></div>
        <div id="gameover-stats"></div>
        <button id="gameover-restart-btn">✦ 重新开始 ✦</button>
      </div>
    `;

    const style = this.container.querySelector('style')!;
    style.textContent += `
      #gameover-panel {
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.85);
        display:none;align-items:center;justify-content:center;
        z-index:9998;font-family:monospace;
      }
      #gameover-box {
        text-align:center;animation:fadeInUp 0.6s ease-out;
        display:flex;flex-direction:column;align-items:center;
        padding:32px 48px;
        background:linear-gradient(180deg,rgba(30,10,10,0.95),rgba(15,5,5,0.95));
        border:2px solid rgba(255,50,50,0.3);border-radius:12px;
        box-shadow:0 8px 32px rgba(255,50,50,0.15);
      }
      #gameover-icon { font-size:64px; margin-bottom:4px; }
      #gameover-title {
        font-size:36px;color:#ff4444;margin:0 0 12px;
        animation:pulseRed 2s ease-in-out infinite;
        letter-spacing:8px;
      }
      #gameover-reason { color:#ff8888;font-size:15px;margin-bottom:16px; }
      #gameover-stats { color:#aaa;font-size:13px;line-height:1.8;margin-bottom:24px; }
      #gameover-restart-btn {
        padding:12px 40px;font-size:16px;font-family:monospace;
        background:linear-gradient(180deg,rgba(200,50,50,0.3),rgba(200,50,50,0.15));
        border:1px solid rgba(255,80,80,0.4);border-radius:8px;
        color:#ddd;cursor:pointer;letter-spacing:4px;
        transition:all 0.25s;
      }
      #gameover-restart-btn:hover {
        background:linear-gradient(180deg,rgba(200,50,50,0.5),rgba(200,50,50,0.3));
        color:#fff;transform:scale(1.04);
      }
    `;

    document.body.appendChild(this.container);
    this.container.querySelector('#gameover-restart-btn')!.addEventListener('click', () => {
      location.reload();
    });
  }

  show(reason: string, stats: { label: string; value: string }[]): void {
    const reasonEl = this.container.querySelector('#gameover-reason')!;
    reasonEl.textContent = reason;

    const statsEl = this.container.querySelector('#gameover-stats')!;
    statsEl.innerHTML = stats.map(s => `${s.label}: ${s.value}`).join('<br>');

    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
