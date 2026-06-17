export class SeedPanel {
  private container: HTMLElement;
  private portraitEl: HTMLElement;
  private bubbleEl: HTMLElement;
  private typewriterEl: HTMLElement;
  private optionsEl: HTMLElement;
  private vitalityEl: HTMLElement;
  private upgradeBtn: HTMLElement;
  private onSelect: ((index: number) => void) | null = null;
  private _visible = false;
  private typewriterTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'seed-panel';
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.75);display:none;align-items:center;
      justify-content:center;z-index:200;font-family:monospace;
    `;

    const mainBox = document.createElement('div');
    mainBox.style.cssText = `
      background:linear-gradient(180deg,rgba(15,15,40,0.97),rgba(8,8,25,0.97));
      border:2px solid #8844ff;border-radius:14px;padding:24px 28px;
      max-width:520px;width:90%;color:#eee;
      box-shadow:0 10px 40px rgba(136,68,255,0.2),0 4px 12px rgba(0,0,0,0.6);
    `;

    // 顶部：种子名 + 活性
    const topBar = document.createElement('div');
    topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;';
    const titleEl = document.createElement('span');
    titleEl.textContent = '🌱 种子';
    titleEl.style.cssText = 'color:#9966ff;font-size:16px;';
    this.vitalityEl = document.createElement('span');
    this.vitalityEl.style.cssText = 'color:#aa88ff;font-size:14px;';
    this.vitalityEl.textContent = '活性: 0';
    topBar.appendChild(titleEl);
    topBar.appendChild(this.vitalityEl);
    mainBox.appendChild(topBar);

    // 立绘区
    this.portraitEl = document.createElement('div');
    this.portraitEl.style.cssText = `
      text-align:center;font-size:80px;padding:12px 0;cursor:default;
      text-shadow:0 0 30px rgba(136,68,255,0.3);
    `;
    this.portraitEl.textContent = '🌱';
    mainBox.appendChild(this.portraitEl);

    // 气泡框
    this.bubbleEl = document.createElement('div');
    this.bubbleEl.style.cssText = `
      background:rgba(136,68,255,0.1);border:1px solid rgba(136,68,255,0.3);
      border-radius:12px;padding:14px 18px;margin:12px 0;min-height:56px;
      position:relative;
    `;
    // 气泡三角
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position:absolute;top:-8px;left:24px;
      width:0;height:0;
      border-left:8px solid transparent;border-right:8px solid transparent;
      border-bottom:8px solid rgba(136,68,255,0.3);
    `;
    this.bubbleEl.appendChild(arrow);

    this.typewriterEl = document.createElement('div');
    this.typewriterEl.style.cssText = 'color:#ddd;font-size:15px;line-height:1.6;min-height:24px;';
    this.bubbleEl.appendChild(this.typewriterEl);
    mainBox.appendChild(this.bubbleEl);

    // 选项区
    this.optionsEl = document.createElement('div');
    this.optionsEl.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:8px;';
    mainBox.appendChild(this.optionsEl);

    // 底部：升级按钮 + 关闭提示
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:14px;';

    this.upgradeBtn = document.createElement('button');
    this.upgradeBtn.textContent = '⚡ 升级';
    this.upgradeBtn.style.cssText = `
      padding:8px 18px;background:linear-gradient(180deg,#9c27b0,#7b1fa2);
      border:none;border-radius:6px;color:#fff;font-family:monospace;
      font-size:14px;cursor:pointer;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    `;
    bottomBar.appendChild(this.upgradeBtn);

    const hint = document.createElement('span');
    hint.textContent = 'Z 关闭';
    hint.style.cssText = 'color:#666;font-size:12px;';
    bottomBar.appendChild(hint);

    mainBox.appendChild(bottomBar);
    this.container.appendChild(mainBox);
    document.body.appendChild(this.container);
  }

  get visible(): boolean { return this._visible; }

  show(
    vitality: number,
    personalityName: string,
    dialogueText: string,
    options: { text: string }[],
    onSelect: (index: number) => void,
    onUpgrade: () => void,
  ): void {
    this._visible = true;
    this.container.style.display = 'flex';

    this.vitalityEl.textContent = `活性: ${Math.floor(vitality)}`;
    this.onSelect = onSelect;
    this.upgradeBtn.onclick = onUpgrade;

    // 更新立绘表情（根据性格）
    const emojis: Record<string, string> = {
      CHEERFUL: '🌞', MELANCHOLY: '🌧️', TSUNDERE: '🌸', SILENT: '🌙',
    };
    this.portraitEl.textContent = emojis[personalityName] || '🌱';

    // 打字机效果
    this.typewriteText(dialogueText);

    // 选项按钮
    this.optionsEl.innerHTML = '';
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt.text}`;
      btn.style.cssText = `
        background:linear-gradient(180deg,rgba(136,68,255,0.3),rgba(136,68,255,0.15));
        border:1px solid #8844ff;border-radius:6px;padding:10px 16px;
        color:#ddd;font-size:14px;font-family:monospace;cursor:pointer;
        text-align:left;transition:all 0.15s;
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'linear-gradient(180deg,rgba(136,68,255,0.5),rgba(136,68,255,0.3))';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'linear-gradient(180deg,rgba(136,68,255,0.3),rgba(136,68,255,0.15))';
      });
      btn.addEventListener('click', () => {
        this.stopTypewriter();
        this.optionsEl.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = true);
        onSelect(i);
      });
      this.optionsEl.appendChild(btn);
    });
  }

  showResult(text: string, color = '#44ff44'): void {
    this.stopTypewriter();
    this.optionsEl.innerHTML = '';
    const resultEl = document.createElement('div');
    resultEl.textContent = text;
    resultEl.style.cssText = `color:${color};font-size:16px;text-align:center;padding:16px;`;
    this.optionsEl.appendChild(resultEl);
  }

  hide(): void {
    this._visible = false;
    this.stopTypewriter();
    this.container.style.display = 'none';
    this.onSelect = null;
  }

  updateVitality(v: number): void {
    this.vitalityEl.textContent = `活性: ${Math.floor(v)}`;
  }

  private typewriteText(text: string): void {
    this.stopTypewriter();
    this.typewriterEl.textContent = '';
    let idx = 0;
    this.typewriterTimer = setInterval(() => {
      if (idx < text.length) {
        this.typewriterEl.textContent += text[idx];
        idx++;
      } else {
        this.stopTypewriter();
      }
    }, 40);
  }

  private stopTypewriter(): void {
    if (this.typewriterTimer !== null) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
  }
}
