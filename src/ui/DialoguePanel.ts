import { DialogueEntry } from '../systems/DialogueSystem';

export class DialoguePanel {
  private container: HTMLElement;
  private personalityEl: HTMLElement;
  private textEl: HTMLElement;
  private optionsEl: HTMLElement;
  private resultEl: HTMLElement;
  private onSelect: ((index: number) => void) | null = null;
  private _visible = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'dialogue-panel';
    this.container.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      background:linear-gradient(180deg,rgba(15,15,40,0.95),rgba(8,8,25,0.95));
      border:1px solid #8844ff;border-radius:12px;padding:24px 32px;
      min-width:360px;max-width:500px;z-index:200;display:none;
      font-family:monospace;color:#eee;
      box-shadow:0 10px 40px rgba(136,68,255,0.25),0 4px 12px rgba(0,0,0,0.6);
    `;

    this.personalityEl = document.createElement('div');
    this.personalityEl.style.cssText = 'color:#9966ff;font-size:14px;margin-bottom:6px;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = 'font-size:18px;margin-bottom:20px;line-height:1.5;';

    this.optionsEl = document.createElement('div');
    this.optionsEl.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    this.resultEl = document.createElement('div');
    this.resultEl.style.cssText = 'font-size:16px;margin-top:16px;text-align:center;display:none;';

    this.container.appendChild(this.personalityEl);
    this.container.appendChild(this.textEl);
    this.container.appendChild(this.optionsEl);
    this.container.appendChild(this.resultEl);
    document.body.appendChild(this.container);
  }

  show(dialogue: DialogueEntry, personalityName: string, onSelect: (index: number) => void): void {
    this._visible = true;
    this.onSelect = onSelect;
    this.resultEl.style.display = 'none';
    this.personalityEl.textContent = `【${personalityName}的种子】`;
    this.textEl.textContent = `"${dialogue.text}"`;

    this.optionsEl.innerHTML = '';
    dialogue.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt.text}`;
      btn.style.cssText = `
        background:linear-gradient(180deg,rgba(136,68,255,0.3),rgba(136,68,255,0.15));
        border:1px solid #8844ff;border-radius:6px;padding:10px 16px;
        color:#ddd;font-size:15px;font-family:monospace;cursor:pointer;
        text-align:left;transition:all 0.15s;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      `;
      btn.addEventListener('mouseenter', () => { btn.style.background = 'linear-gradient(180deg,rgba(136,68,255,0.5),rgba(136,68,255,0.3))'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'linear-gradient(180deg,rgba(136,68,255,0.3),rgba(136,68,255,0.15))'; });
      btn.addEventListener('click', () => {
        this.optionsEl.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = true);
        onSelect(i);
      });
      this.optionsEl.appendChild(btn);
    });

    this.container.style.display = '';
  }

  showResult(text: string, color = '#44ff44'): void {
    this.resultEl.textContent = text;
    this.resultEl.style.color = color;
    this.resultEl.style.display = '';
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
    this.onSelect = null;
  }

  get visible(): boolean {
    return this._visible;
  }

  destroy(): void {
    this.container.remove();
  }
}
