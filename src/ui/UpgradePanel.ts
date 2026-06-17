export interface UpgradeOption {
  label: string;
  desc: string;
  cost: number;
  currencyType: 'coin' | 'vitality';
  onBuy: () => void;
  maxLevel?: number;
  level?: number;
}

export interface UpgradeCategory {
  name: string;
  icon: string;
  options: UpgradeOption[];
}

export class UpgradePanel {
  private container: HTMLElement;
  private titleEl: HTMLElement;
  private currencyEl: HTMLElement;
  private tabBar: HTMLElement;
  private optionsWrap: HTMLElement;
  private optionsEl: HTMLElement;
  private categories: UpgradeCategory[] = [];
  private activeTab = 0;
  private _visible = false;
  private onClose: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'upgrade-panel-overlay';
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.6);display:none;align-items:center;
       justify-content:center;z-index:310;font-family:monospace;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:linear-gradient(180deg,rgba(30,30,60,0.98),rgba(15,15,35,0.98));
      border:2px solid #7b1fa2;border-radius:12px;
      padding:24px 32px;min-width:360px;max-width:460px;width:90%;
      max-height:80vh;display:flex;flex-direction:column;
      color:#fff;
      box-shadow:0 8px 32px rgba(123,31,162,0.3),0 2px 8px rgba(0,0,0,0.5);
    `;

    this.titleEl = document.createElement('h2');
    this.titleEl.style.cssText = 'margin:0 0 4px;color:#ce93d8;text-align:center;font-size:18px;flex-shrink:0;';
    this.titleEl.textContent = '升级面板';
    box.appendChild(this.titleEl);

    this.currencyEl = document.createElement('div');
    this.currencyEl.style.cssText = 'text-align:center;color:#aaa;font-size:13px;margin-bottom:10px;flex-shrink:0;';
    box.appendChild(this.currencyEl);

    this.tabBar = document.createElement('div');
    this.tabBar.style.cssText = `
      display:flex;gap:6px;margin-bottom:12px;flex-shrink:0;
      border-bottom:1px solid rgba(123,31,162,0.3);padding-bottom:8px;
    `;
    box.appendChild(this.tabBar);

    this.optionsWrap = document.createElement('div');
    this.optionsWrap.style.cssText = `
      overflow-y:auto;flex:1;min-height:0;
      scrollbar-width:thin;scrollbar-color:#7b1fa2 transparent;
    `;
    this.optionsWrap.addEventListener('wheel', (e) => {
      this.optionsWrap.scrollTop += e.deltaY;
    }, { passive: true });

    this.optionsEl = document.createElement('div');
    this.optionsWrap.appendChild(this.optionsEl);
    box.appendChild(this.optionsWrap);

    const hint = document.createElement('div');
    hint.textContent = 'Z 关闭';
    hint.style.cssText = 'text-align:center;margin-top:12px;color:#888;font-size:12px;flex-shrink:0;';
    box.appendChild(hint);

    this.container.appendChild(box);
    document.body.appendChild(this.container);
  }

  get visible(): boolean { return this._visible; }

  show(title: string, currency: number, vitality: number, categories?: UpgradeCategory[]): void {
    if (this._visible) return;
    this._visible = true;
    this.titleEl.textContent = title;
    if (categories) this.categories = categories;
    this.activeTab = 0;
    this.renderTabs();
    this.updateCurrency(currency, vitality);
    this.renderOptions();
    this.container.style.display = 'flex';
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
    this.onClose?.();
  }

  setOnClose(cb: () => void): void {
    this.onClose = cb;
  }

  setCategories(cats: UpgradeCategory[]): void {
    this.categories = cats;
    if (this.activeTab >= cats.length) this.activeTab = 0;
    if (this._visible) {
      this.renderTabs();
      this.renderOptions();
    }
  }

  updateCurrency(coin: number, vitality: number): void {
    this.currencyEl.innerHTML =
      `金币: <span style="color:#ffcc00">${coin}</span>` +
      `  |  活性: <span style="color:#aa88ff">${Math.floor(vitality)}</span>`;
    if (this._visible) this.renderOptions();
  }

  private renderTabs(): void {
    this.tabBar.innerHTML = '';
    this.categories.forEach((cat, i) => {
      const tab = document.createElement('button');
      tab.innerHTML = `${cat.icon} ${cat.name}`;
      tab.style.cssText = `
        padding:6px 14px;border:none;border-radius:6px 6px 0 0;
        cursor:pointer;font-family:monospace;font-size:13px;
        background:${i === this.activeTab ? 'rgba(123,31,162,0.35)' : 'transparent'};
        color:${i === this.activeTab ? '#fff' : '#999'};
        border-bottom:${i === this.activeTab ? '2px solid #ce93d8' : '2px solid transparent'};
        transition:all 0.15s;
      `;
      tab.addEventListener('click', () => {
        this.activeTab = i;
        this.renderTabs();
        this.renderOptions();
      });
      this.tabBar.appendChild(tab);
    });
  }

  private renderOptions(): void {
    this.optionsEl.innerHTML = '';
    const cat = this.categories[this.activeTab];
    if (!cat) return;
    for (const opt of cat.options) {
      const row = document.createElement('div');
      row.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        margin:6px 0;padding:10px 12px;background:rgba(34,34,68,0.8);
        border:1px solid rgba(123,31,162,0.2);border-radius:8px;
        flex-shrink:0;
      `;

      const info = document.createElement('div');
      info.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

      const nameEl = document.createElement('span');
      let text = opt.label;
      if (opt.maxLevel !== undefined && opt.level !== undefined) {
        text += ` <span style="color:#888;font-size:12px;">(${opt.level}/${opt.maxLevel})</span>`;
      }
      nameEl.innerHTML = text;
      info.appendChild(nameEl);

      const descEl = document.createElement('span');
      descEl.textContent = opt.desc;
      descEl.style.cssText = 'color:#888;font-size:12px;';
      info.appendChild(descEl);

      const buyBtn = document.createElement('button');
      const coinIcon = opt.currencyType === 'coin' ? '🪙' : '💜';
      buyBtn.innerHTML = `${coinIcon} ${opt.cost}`;
      buyBtn.style.cssText = `
        background:linear-gradient(180deg,#9c27b0,#7b1fa2);color:#fff;
        border:none;border-radius:4px;padding:8px 14px;cursor:pointer;
        font-family:monospace;font-size:13px;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);flex-shrink:0;
      `;
      buyBtn.onclick = () => {
        opt.onBuy();
        if (this._visible) this.renderOptions();
      };

      row.appendChild(info);
      row.appendChild(buyBtn);
      this.optionsEl.appendChild(row);
    }
  }
}
