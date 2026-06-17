/** 种子对话面板：选项模式 + 自由对话模式 */

import type { DialogueEntry } from '../systems/DialogueSystem';
import { AI_SERVICE } from '../systems/AIService';

export class SeedDialoguePanel {
  private container: HTMLElement;
  private portraitEl: HTMLElement;
  private stageEl: HTMLElement;
  private bubbleEl: HTMLElement;
  private typewriterEl: HTMLElement;
  private modeBarEl: HTMLElement;
  private inputArea: HTMLElement;
  private inputBox: HTMLInputElement;
  private sendBtn: HTMLElement;
  private bottomBtns: HTMLElement;
  private _visible = false;
  private currentMode: 'option' | 'free' = 'option';
  private onSelectOption: ((index: number) => void) | null = null;
  private onUpgrade: (() => void) | null = null;
  private onEvolve: (() => void) | null = null;
  private onClose: (() => void) | null = null;
  private freeHistory: { role: string; content: string }[] = [];
  private typewriterTimer: ReturnType<typeof setInterval> | null = null;
  private closeLock = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'seed-dialogue-panel';
    this.container.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:linear-gradient(180deg,rgba(0,0,0,0.9) 0%,rgba(10,5,30,0.95) 100%);' +
      'z-index:280;display:none;flex-direction:column;align-items:center;color:#fff;font-family:monospace;';

    this.container.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:90%;max-width:600px;gap:8px;">
        <!-- 顶部信息 -->
        <div id="sd-stage" style="font-size:14px;color:#aaa;"></div>

        <!-- 种子立绘 -->
        <div id="sd-portrait" style="font-size:100px;line-height:1.2;margin:8px 0;filter:drop-shadow(0 0 20px rgba(100,200,100,0.4));"></div>

        <!-- 对话气泡 -->
        <div id="sd-bubble" style="width:100%;min-height:80px;padding:16px;background:rgba(255,255,255,0.08);border-radius:12px;border:1px solid rgba(255,255,255,0.1);position:relative;">
          <div id="sd-typewriter" style="font-size:14px;line-height:1.6;color:#ddd;"></div>
          <div id="sd-options" style="margin-top:12px;display:flex;flex-direction:column;gap:8px;"></div>
        </div>

        <!-- 输入区域（自由对话模式） -->
        <div id="sd-input-area" style="display:none;width:100%;gap:8px;">
          <div style="display:flex;gap:8px;">
            <input id="sd-input-box" type="text" placeholder="对种子说些什么..."
              style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:14px;font-family:monospace;outline:none;" />
            <button id="sd-send-btn" style="padding:10px 20px;background:#4CAF50;border:none;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;font-family:monospace;">发送</button>
          </div>
        </div>

        <!-- 底部按钮两行 -->
        <div style="width:100%;display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <!-- 模式切换 -->
          <div id="sd-mode-bar" style="display:flex;gap:8px;justify-content:center;"></div>
          <!-- 功能按钮 -->
          <div id="sd-bottom-btns" style="display:flex;gap:12px;justify-content:center;"></div>
        </div>
      </div>
    `;

    this.stageEl = this.container.querySelector('#sd-stage')!;
    this.portraitEl = this.container.querySelector('#sd-portrait')!;
    this.bubbleEl = this.container.querySelector('#sd-bubble')!;
    this.typewriterEl = this.container.querySelector('#sd-typewriter')!;
    this.modeBarEl = this.container.querySelector('#sd-mode-bar')!;
    this.inputArea = this.container.querySelector('#sd-input-area')!;
    this.inputBox = this.container.querySelector('#sd-input-box')! as HTMLInputElement;
    this.sendBtn = this.container.querySelector('#sd-send-btn')!;
    this.bottomBtns = this.container.querySelector('#sd-bottom-btns')!;

    // 输入框回车发送
    this.inputBox.onkeydown = (e) => {
      if (e.key === 'Enter') this.sendFreeMessage();
    };
    this.sendBtn.onclick = () => this.sendFreeMessage();

    document.body.appendChild(this.container);
  }

  /** 选项模式：显示对话+选项 */
  showOption(portrait: string, stage: string, text: string, options: string[], onSelect: (idx: number) => void): void {
    this.closeLock = true;
    this.currentMode = 'option';
    this.onSelectOption = onSelect;
    this.stopTypewriter();

    this._visible = true;
    this.container.style.display = 'flex';
    this.portraitEl.textContent = portrait;
    this.stageEl.textContent = stage;
    this.inputArea.style.display = 'none';

    this.renderModeBar();
    this.renderBottomBtns();
    this.typewriteText(text);
    this.renderOptions(options);
    this.closeLock = false;
  }

  /** 自由对话模式：显示输入框 */
  showFree(portrait: string, stage: string, initialMsg: string): void {
    this.closeLock = true;
    this.currentMode = 'free';
    this._visible = true;
    this.container.style.display = 'flex';
    this.portraitEl.textContent = portrait;
    this.stageEl.textContent = stage;
    this.inputArea.style.display = 'flex';

    this.freeHistory = [{ role: 'assistant', content: initialMsg }];
    this.renderModeBar();
    this.renderBottomBtns();
    this.stopTypewriter();
    this.typewriteText(initialMsg);
    this.clearOptions();
    this.inputBox.value = '';
    this.inputBox.focus();
    this.closeLock = false;
  }

  /** 显示结果文本 */
  showResult(text: string, color = '#44ff44'): void {
    this.stopTypewriter();
    this.clearOptions();
    this.typewriterEl.style.color = color;
    this.typewriterEl.textContent = text;
  }

  /** 追加自由对话回复 */
  appendFreeReply(text: string): void {
    this.freeHistory.push({ role: 'assistant', content: text });
    this.stopTypewriter();
    this.typewriterEl.style.color = '#ddd';
    this.typewriteText(text);
    this.inputBox.disabled = false;
    this.sendBtn.style.opacity = '1';
    this.inputBox.focus();
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
    this.stopTypewriter();
    this.onClose?.();
  }

  setOnUpgrade(cb: () => void): void { this.onUpgrade = cb; }
  setOnEvolve(cb: () => void): void { this.onEvolve = cb; }
  setOnClose(cb: () => void): void { this.onClose = cb; }

  get visible(): boolean { return this._visible; }

  private renderModeBar(): void {
    this.modeBarEl.innerHTML = '';
    const modes = [
      { id: 'option', label: '📋 选项对话' },
      { id: 'free', label: '💬 自由对话' },
    ];
    modes.forEach(m => {
      const btn = document.createElement('button');
      btn.textContent = m.label;
      const active = m.id === this.currentMode;
      btn.style.cssText =
        `padding:6px 16px;border:2px solid ${active ? '#4CAF50' : '#555'};` +
        `background:${active ? 'rgba(76,175,80,0.2)' : 'transparent'};` +
        'border-radius:20px;color:#fff;cursor:pointer;font-size:13px;font-family:monospace;';
      btn.onclick = () => {
        if (m.id === 'free' && this.currentMode === 'option') {
          // 切到自由模式，用种子性格和当前阶段开场
          const seedMsg = this.freeHistory.find(m => m.role === 'assistant')?.content
            || '你来了……我一直在感受着这片星空。你知道吗，有些植物能在最恶劣的环境中生存下来。';
          this.showFree(this.portraitEl.textContent || '🌱', this.stageEl.textContent || '', seedMsg);
        } else if (m.id === 'option' && this.currentMode === 'free') {
          // 切回选项模式，不需要做额外事情，面板会保留上次的选项 content
          // 但为了简单，我们调用同一个rebuild
          this.currentMode = 'option';
          this.inputArea.style.display = 'none';
          this.renderModeBar();
        }
      };
      this.modeBarEl.appendChild(btn);
    });
  }

  private renderBottomBtns(): void {
    this.bottomBtns.innerHTML = '';
    const btns = [
      { label: '⚡ 升级', action: () => this.onUpgrade?.() },
      { label: '🌳 进化', action: () => this.onEvolve?.() },
    ];
    btns.forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.style.cssText =
        'padding:8px 20px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);' +
        'border-radius:8px;color:#ddd;cursor:pointer;font-size:13px;font-family:monospace;';
      btn.onclick = b.action;
      this.bottomBtns.appendChild(btn);
    });
  }

  private renderOptions(options: string[]): void {
    const el = this.container.querySelector('#sd-options')!;
    el.innerHTML = '';
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.cssText =
        'padding:10px 16px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);' +
        'border-radius:8px;color:#fff;cursor:pointer;font-size:13px;font-family:monospace;text-align:left;' +
        'transition:background 0.15s;';
      btn.onmouseenter = () => { btn.style.background = 'rgba(76,175,80,0.2)'; };
      btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.05)'; };
      btn.onclick = () => {
        const btns = el.querySelectorAll('button');
        btns.forEach(b => (b as HTMLButtonElement).disabled = true);
        this.onSelectOption?.(idx);
      };
      el.appendChild(btn);
    });
  }

  private clearOptions(): void {
    const el = this.container.querySelector('#sd-options')!;
    el.innerHTML = '';
  }

  private async sendFreeMessage(): Promise<void> {
    const text = this.inputBox.value.trim();
    if (!text) return;

    this.freeHistory.push({ role: 'user', content: text });
    this.inputBox.value = '';
    this.inputBox.disabled = true;
    this.sendBtn.style.opacity = '0.5';

    // 在气泡中显示玩家消息
    this.stopTypewriter();
    this.typewriterEl.innerHTML += `<div style="color:#8BC34A;margin-top:8px;">🧑 你：${text}</div>`;

    try {
      const personalityStage = this.stageEl.textContent || '萌芽';
      const reply = await AI_SERVICE.chat(this.freeHistory, personalityStage);
      this.appendFreeReply(reply);
    } catch {
      // 降级：本地回复
      const fallbacks = [
        '嗯…这个问题让我想想。你知道吗，有些植物的根系能深入地下30米找水。',
        '就像我们种子一样，只要有合适的环境，生命总能找到出路。',
        '在自然界中，每个性状都不是偶然出现的，都是亿万年来自然选择的结果。',
      ];
      const reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      this.appendFreeReply(reply);
    }
  }

  private typewriteText(text: string): void {
    this.typewriterEl.textContent = '';
    let idx = 0;
    this.typewriterTimer = setInterval(() => {
      if (idx < text.length) {
        this.typewriterEl.textContent += text[idx];
        idx++;
      } else {
        this.stopTypewriter();
      }
    }, 30);
  }

  private stopTypewriter(): void {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
  }
}
