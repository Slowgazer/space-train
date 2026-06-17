import { PlanetDef } from '../config/planets';

/**
 * 星球选择面板
 * 到达抉择距离时弹出，展示 3 个星球供玩家选择
 */
export class PlanetSelectionPanel {
  private container: HTMLElement;
  private _visible = false;
  private onSelect: ((planet: PlanetDef) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'planet-selection-panel';
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.75);display:none;align-items:center;
      justify-content:center;z-index:300;font-family:monospace;
    `;
    document.body.appendChild(this.container);
  }

  get visible(): boolean {
    return this._visible;
  }

  show(planets: PlanetDef[], onSelect: (planet: PlanetDef) => void): void {
    this._visible = true;
    this.onSelect = onSelect;
    this.container.innerHTML = '';
    this.container.style.display = 'flex';

    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(10,10,30,0.95);border:1px solid #8844ff;
      border-radius:16px;padding:32px;max-width:820px;width:90%;
      text-align:center;
    `;
    box.innerHTML = `
      <h2 style="color:#ce93d8;margin:0 0 8px;font-size:22px;">🌟 前方出现星球</h2>
      <p style="color:#aaa;margin:0 0 24px;font-size:14px;">
        种子感受到星球的召唤…选择一个方向继续旅程
      </p>
    `;

    const cards = document.createElement('div');
    cards.style.cssText = `
      display:flex;gap:16px;justify-content:center;flex-wrap:wrap;
    `;

    for (const p of planets) {
      const card = document.createElement('div');
      card.style.cssText = `
        background:linear-gradient(180deg,rgba(20,20,50,0.95),rgba(10,10,30,0.95));
        border:2px solid ${p.color};border-radius:12px;padding:20px;width:220px;
        cursor:pointer;transition:all 0.25s;text-align:center;position:relative;
        overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.4);
      `;
      card.addEventListener('mouseenter', () => {
        card.style.background = `rgba(${hexToRgb(p.color)},0.15)`;
        card.style.transform = 'translateY(-6px)';
        card.style.boxShadow = `0 8px 30px ${p.color}44`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.background = 'rgba(20,20,50,0.9)';
        card.style.transform = '';
        card.style.boxShadow = '';
      });
      card.addEventListener('click', () => {
        this.container.style.display = 'none';
        this._visible = false;
        onSelect(p);
      });

      card.innerHTML = `
        <div style="font-size:48px;margin-bottom:8px;">${p.emoji}</div>
        <div style="color:${p.color};font-size:16px;font-weight:bold;margin-bottom:4px;">
          ${p.name}
        </div>
        <div style="color:#888;font-size:12px;margin-bottom:10px;">${p.subtitle}</div>
        <div style="color:#ccc;font-size:13px;margin-bottom:10px;line-height:1.5;">
          ${p.description}
        </div>
        <div style="color:${p.accentColor};font-size:13px;border-top:1px solid rgba(255,255,255,0.1);
          padding-top:10px;margin-top:4px;">
          ✦ ${p.buff}
        </div>
      `;
      cards.appendChild(card);
    }

    box.appendChild(cards);

    // 每次选择出现的星球不同，增加重选功能
    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top:16px;color:#666;font-size:12px;';
    footer.textContent = '选择一个星球，种子将获得该星球的祝福';
    box.appendChild(footer);

    this.container.appendChild(box);
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
  }
}

function hexToRgb(hex: string): string {
  const v = parseInt(hex.slice(1), 16);
  return `${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}`;
}
