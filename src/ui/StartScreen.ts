export class StartScreen {
  private container: HTMLElement;
  private onStart: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'start-screen';
    this.container.innerHTML = `
      <style>
        @keyframes starFloat {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        @keyframes shootingStar {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          100% { transform: translateX(-300px) translateY(200px); opacity: 0; }
        }
        @keyframes titleGlow {
          0%,100% { text-shadow: 0 0 20px rgba(136,68,255,0.4), 0 0 60px rgba(136,68,255,0.2); }
          50% { text-shadow: 0 0 30px rgba(136,68,255,0.7), 0 0 80px rgba(136,68,255,0.35), 0 0 120px rgba(136,68,255,0.15); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 20px rgba(136,68,255,0.4); }
          50% { box-shadow: 0 0 40px rgba(136,68,255,0.7), 0 0 80px rgba(136,68,255,0.2); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes seedBounce {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes trainMove {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(100px); }
        }
      </style>
      <div id="start-stars"></div>
      <div id="start-shooting-stars"></div>
      <div id="start-content">
        <div id="start-icon">🌱</div>
        <h1 id="start-title">星际种子航行</h1>
        <p id="start-subtitle">护送宇宙最后的生命火种，穿越星海寻找希望</p>
        <div id="start-deco-line"></div>
        <p id="start-quote">「每一粒尘埃里，都藏着一个星系的记忆」</p>
        <button id="start-btn">✦ 开始航行 ✦</button>
        <p id="start-hint">WASD 移动 · 鼠标瞄准 · 左键射击</p>
      </div>
    `;

    const style = this.container.querySelector('style')!;
    style.textContent += `
      #start-screen {
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:linear-gradient(180deg,#0a0a1a 0%,#0d0d24 30%,#151530 60%,#0a0a1a 100%);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;font-family:monospace;overflow:hidden;
      }
      #start-stars {
        position:absolute;top:0;left:0;width:100%;height:100%;
        pointer-events:none;
      }
      #start-shooting-stars {
        position:absolute;top:0;left:0;width:100%;height:100%;
        pointer-events:none;overflow:hidden;
      }
      #start-content {
        text-align:center;z-index:1;animation:fadeIn 1.2s ease-out;
        display:flex;flex-direction:column;align-items:center;
      }
      #start-icon {
        font-size:72px;animation:seedBounce 2.5s ease-in-out infinite;
        margin-bottom:8px;filter:drop-shadow(0 0 30px rgba(136,68,255,0.5));
      }
      #start-title {
        font-size:42px;font-weight:bold;color:#ce93d8;
        animation:titleGlow 3s ease-in-out infinite;
        margin:0;letter-spacing:6px;
      }
      #start-subtitle {
        color:#8888aa;font-size:14px;margin:10px 0 16px;
        letter-spacing:2px;
      }
      #start-deco-line {
        width:120px;height:1px;
        background:linear-gradient(90deg,transparent,rgba(136,68,255,0.5),transparent);
        margin:12px 0;
      }
      #start-quote {
        color:#6655aa;font-size:13px;font-style:italic;margin:8px 0 24px;
      }
      #start-btn {
        padding:14px 48px;font-size:18px;font-family:monospace;
        background:linear-gradient(180deg,rgba(136,68,255,0.3),rgba(136,68,255,0.15));
        border:1px solid rgba(136,68,255,0.5);border-radius:8px;
        color:#ddd;cursor:pointer;letter-spacing:4px;
        animation:pulse 2.5s ease-in-out infinite;
        transition:all 0.25s;
      }
      #start-btn:hover {
        background:linear-gradient(180deg,rgba(136,68,255,0.5),rgba(136,68,255,0.3));
        color:#fff;transform:scale(1.04);
      }
      #start-hint {
        color:#555;font-size:12px;margin-top:20px;letter-spacing:2px;
      }
    `;

    document.body.appendChild(this.container);
    this.spawnStars();
    this.spawnShootingStars();
    this.container.querySelector('#start-btn')!.addEventListener('click', () => this.onStart?.());
  }

  private spawnStars(): void {
    const container = this.container.querySelector('#start-stars')!;
    for (let i = 0; i < 120; i++) {
      const star = document.createElement('div');
      const size = 1 + Math.random() * 2.5;
      const delay = Math.random() * 20;
      const duration = 12 + Math.random() * 20;
      star.style.cssText = `
        position:absolute;left:${Math.random() * 100}%;top:${Math.random() * 100}%;
        width:${size}px;height:${size}px;border-radius:50%;
        background:${['#fff','#aaccff','#ffddaa','#ccaaff'][Math.floor(Math.random() * 4)]};
        animation:starFloat ${duration}s linear ${delay}s infinite;
        opacity:${0.3 + Math.random() * 0.7};
      `;
      container.appendChild(star);
    }
  }

  private spawnShootingStars(): void {
    const container = this.container.querySelector('#start-shooting-stars')!;
    const spawn = () => {
      const star = document.createElement('div');
      const tail = 40 + Math.random() * 80;
      star.style.cssText = `
        position:absolute;left:${60 + Math.random() * 40}%;top:${Math.random() * 40}%;
        width:${tail}px;height:1.5px;
        background:linear-gradient(90deg,rgba(255,255,255,0.8),transparent);
        animation:shootingStar ${0.6 + Math.random() * 0.6}s linear forwards;
        transform:rotate(${-30 + Math.random() * 20}deg);
      `;
      container.appendChild(star);
      setTimeout(() => { star.remove(); spawn(); }, 2000 + Math.random() * 6000);
    };
    spawn();
  }

  show(): void {
    this.container.style.display = '';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  onPlay(cb: () => void): void {
    this.onStart = cb;
  }
}
