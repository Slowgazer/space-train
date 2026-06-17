import { ConfigMeta, GAME_CONFIG_META } from '../config/gameConfig';

type ValueAccessor = { get: () => number; set: (v: number) => void };

export class EditModePanel {
  private toolbar: HTMLElement;
  private editorOverlay: HTMLElement;
  private tabContent: HTMLElement;
  private tabBar: HTMLElement;
  private valueMap = new Map<string, ValueAccessor>();
  private categories: string[] = [];
  private _editorOpen = false;
  private onPauseToggle: (() => void) | null = null;
  private paused = false;

  constructor() {
    this.toolbar = this.createToolbar();
    const editor = this.createEditor();
    this.editorOverlay = editor.overlay;
    this.tabBar = editor.tabBar;
    this.tabContent = editor.tabContent;
  }

  private createToolbar(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'edit-toolbar';
    el.style.cssText = `
      position:fixed;top:0;left:0;right:0;height:44px;
      background:rgba(0,0,0,0.85);border-bottom:2px solid #00e5ff;
      display:none;align-items:center;padding:0 16px;gap:12px;
      z-index:400;font-family:monospace;font-size:14px;
    `;

    const title = document.createElement('span');
    title.textContent = '⚙ 编辑模式';
    title.style.cssText = 'color:#00e5ff;font-weight:bold;font-size:15px;margin-right:8px;';

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = '⏸ 暂停游戏';
    pauseBtn.style.cssText = this.btnStyle('#ffd740');
    pauseBtn.onclick = () => {
      this.paused = !this.paused;
      pauseBtn.textContent = this.paused ? '▶ 继续游戏' : '⏸ 暂停游戏';
      this.onPauseToggle?.();
    };

    const editorBtn = document.createElement('button');
    editorBtn.textContent = '✏ 数值编辑器';
    editorBtn.style.cssText = this.btnStyle('#4fc3f7');
    editorBtn.onclick = () => this.toggleEditor();

    const gridLabel = document.createElement('span');
    gridLabel.textContent = '网格 ✓';
    gridLabel.style.cssText = 'color:#888;font-size:12px;margin-left:auto;';

    const axesLabel = document.createElement('span');
    axesLabel.textContent = '坐标轴 ✓';
    axesLabel.style.cssText = 'color:#888;font-size:12px;margin-left:12px;';

    el.appendChild(title);
    el.appendChild(pauseBtn);
    el.appendChild(editorBtn);
    el.appendChild(gridLabel);
    el.appendChild(axesLabel);
    document.body.appendChild(el);
    return el;
  }

  private btnStyle(color: string): string {
    return `
      padding:6px 14px;background:rgba(0,0,0,0.4);border:1px solid ${color};
      border-radius:6px;color:${color};font-family:monospace;font-size:13px;
      cursor:pointer;transition:all 0.15s;
    `;
  }

  private createEditor(): { overlay: HTMLElement; tabBar: HTMLElement; tabContent: HTMLElement } {
    const overlay = document.createElement('div');
    overlay.id = 'edit-editor';
    overlay.style.cssText = `
      position:fixed;top:44px;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.85);display:none;z-index:450;
      font-family:monospace;overflow:hidden;
    `;

    const layout = document.createElement('div');
    layout.style.cssText = 'display:flex;flex-direction:column;height:100%;';

    const tabBar = document.createElement('div');
    tabBar.style.cssText = `
      display:flex;overflow-x:auto;gap:2px;padding:8px 12px 0;
      background:rgba(0,0,0,0.4);flex-shrink:0;
    `;

    const content = document.createElement('div');
    content.style.cssText = 'flex:1;overflow-y:auto;padding:12px 16px;';

    layout.appendChild(tabBar);
    layout.appendChild(content);
    overlay.appendChild(layout);
    document.body.appendChild(overlay);

    return { overlay, tabBar, tabContent: content };
  }

  /** 注册所有数值的 getter/setter */
  registerAll(accessors: Map<string, ValueAccessor>): void {
    this.valueMap = accessors;
    const catSet = new Set<string>();
    for (const meta of GAME_CONFIG_META) {
      catSet.add(meta.category);
    }
    this.categories = Array.from(catSet);
    this.buildTabs();
  }

  private buildTabs(): void {
    this.tabBar.innerHTML = '';
    this.tabContent.innerHTML = '';

    if (this.categories.length === 0) return;

    this.categories.forEach((cat, ci) => {
      const tab = document.createElement('button');
      tab.textContent = cat;
      tab.style.cssText = `
        padding:7px 16px;background:rgba(255,255,255,0.05);border:none;
        border-radius:6px 6px 0 0;color:#888;font-family:monospace;font-size:13px;
        cursor:pointer;white-space:nowrap;transition:all 0.15s;
      `;
      tab.onclick = () => this.switchTab(ci);
      tab.onmouseenter = () => { if (!tab.classList.contains('active')) tab.style.background = 'rgba(255,255,255,0.1)'; };
      tab.onmouseleave = () => { if (!tab.classList.contains('active')) tab.style.background = 'rgba(255,255,255,0.05)'; };
      this.tabBar.appendChild(tab);
    });

    this.switchTab(0);
  }

  private switchTab(index: number): void {
    const tabs = this.tabBar.querySelectorAll('button');
    tabs.forEach((t, i) => {
      const el = t as HTMLElement;
      if (i === index) {
        el.style.background = 'rgba(0,229,255,0.15)';
        el.style.color = '#00e5ff';
        el.classList.add('active');
      } else {
        el.style.background = 'rgba(255,255,255,0.05)';
        el.style.color = '#888';
        el.classList.remove('active');
      }
    });

    this.renderCategory(this.categories[index]);
  }

  private renderCategory(category: string): void {
    this.tabContent.innerHTML = '';

    const entries = GAME_CONFIG_META.filter(e => e.category === category);
    const objectSet = new Set(entries.map(e => e.object));

    for (const obj of objectSet) {
      const section = document.createElement('div');
      section.style.cssText = 'margin-bottom:18px;';

      const objTitle = document.createElement('div');
      objTitle.textContent = `▸ ${obj}`;
      objTitle.style.cssText = 'color:#00e5ff;font-size:14px;margin-bottom:6px;padding:4px 8px;background:rgba(0,229,255,0.06);border-radius:4px;';
      section.appendChild(objTitle);

      const fields = document.createElement('div');
      fields.style.cssText = 'display:grid;grid-template-columns:1fr;gap:4px;padding-left:8px;';

      for (const entry of entries.filter(e => e.object === obj)) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:3px 0;';

        const label = document.createElement('span');
        label.textContent = entry.label;
        label.style.cssText = 'color:#ccc;font-size:13px;width:140px;flex-shrink:0;';

        const input = document.createElement('input');
        input.type = 'number';
        const acc = this.valueMap.get(entry.key);
        input.value = acc ? String(acc.get()) : String(entry.defaultVal);
        if (entry.min !== undefined) input.min = String(entry.min);
        if (entry.max !== undefined) input.max = String(entry.max);
        if (entry.step !== undefined) input.step = String(entry.step);
        input.style.cssText = `
          width:100px;padding:3px 6px;background:rgba(0,0,0,0.4);
          border:1px solid rgba(255,255,255,0.15);border-radius:4px;
          color:#fff;font-family:monospace;font-size:13px;outline:none;text-align:right;
        `;
        input.addEventListener('focus', () => { input.style.borderColor = '#00e5ff'; });
        input.addEventListener('blur', () => { input.style.borderColor = 'rgba(255,255,255,0.15)'; });
        input.addEventListener('input', () => {
          const v = parseFloat(input.value);
          if (!isNaN(v) && acc) acc.set(v);
        });

        row.appendChild(label);
        row.appendChild(input);

        if (entry.defaultVal !== undefined) {
          const def = document.createElement('span');
          def.textContent = `(默认 ${entry.defaultVal})`;
          def.style.cssText = 'color:#555;font-size:11px;';
          row.appendChild(def);
        }

        fields.appendChild(row);
      }

      section.appendChild(fields);
      this.tabContent.appendChild(section);
    }
  }

  setOnPauseToggle(cb: () => void): void {
    this.onPauseToggle = cb;
  }

  get isPaused(): boolean { return this.paused; }

  show(): void {
    this.toolbar.style.display = 'flex';
  }

  hide(): void {
    this.toolbar.style.display = 'none';
    this.editorOverlay.style.display = 'none';
    this._editorOpen = false;
  }

  private toggleEditor(): void {
    this._editorOpen = !this._editorOpen;
    this.editorOverlay.style.display = this._editorOpen ? '' : 'none';
  }
}
