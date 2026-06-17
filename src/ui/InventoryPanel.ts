import { InventorySystem, ItemStack } from '../systems/InventorySystem';

/**
 * 背包 UI 面板
 * 按 B 键打开，展示所有物品
 */
export class InventoryPanel {
  private container: HTMLElement;
  private gridEl: HTMLElement;
  private infoEl: HTMLElement;
  private _visible = false;
  private inventory: InventorySystem | null = null;
  private game: any = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'inventory-panel';
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.7);display:none;align-items:center;
      justify-content:center;z-index:250;font-family:monospace;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:linear-gradient(180deg,rgba(15,15,40,0.95),rgba(8,8,25,0.95));
      border:1px solid #ffd740;border-radius:12px;padding:24px;
      max-width:520px;width:90%;
      box-shadow:0 10px 40px rgba(255,215,64,0.2),0 4px 12px rgba(0,0,0,0.5);
    `;
    box.innerHTML = '<h2 style="color:#ffd740;margin:0 0 16px;text-align:center;font-size:18px;">🎒 背包</h2>';

    this.gridEl = document.createElement('div');
    this.gridEl.style.cssText = `
      display:grid;grid-template-columns:repeat(4,1fr);gap:8px;
      margin-bottom:12px;
    `;
    box.appendChild(this.gridEl);

    this.infoEl = document.createElement('div');
    this.infoEl.style.cssText = 'color:#888;font-size:13px;text-align:center;min-height:20px;';
    box.appendChild(this.infoEl);

    const hint = document.createElement('div');
    hint.textContent = 'B 关闭  |  点击使用消耗品';
    hint.style.cssText = 'color:#666;font-size:12px;text-align:center;margin-top:12px;';
    box.appendChild(hint);

    this.container.appendChild(box);
    document.body.appendChild(this.container);
  }

  get visible(): boolean {
    return this._visible;
  }

  show(inventory: InventorySystem, game: any): void {
    this._visible = true;
    this.inventory = inventory;
    this.game = game;
    this.render();
    this.container.style.display = 'flex';
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
  }

  private render(): void {
    if (!this.inventory) return;
    this.gridEl.innerHTML = '';
    this.infoEl.textContent = '';

    for (const slot of this.inventory.getSlots()) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        background:linear-gradient(180deg,rgba(20,20,50,0.95),rgba(12,12,35,0.95));
        border:1px solid #333;border-radius:8px;padding:12px;text-align:center;
        cursor:pointer;min-height:70px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;transition:all 0.15s;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      `;

      if (slot) {
        const rarityColors: Record<string, string> = {
          common: '#aaa', rare: '#4fc3f7', epic: '#ce93d8', legendary: '#ffd740',
        };
        const borderColor = rarityColors[slot.def.rarity] || '#333';

        cell.style.borderColor = borderColor;
        cell.innerHTML = `
          <div style="font-size:24px;line-height:1.2;">${slot.def.icon}</div>
          <div style="font-size:11px;color:#ccc;margin-top:4px;">${slot.def.name}</div>
          ${slot.def.stackable ? `<div style="font-size:10px;color:${borderColor};">×${slot.count}</div>` : ''}
        `;

        cell.addEventListener('mouseenter', () => {
          cell.style.background = 'linear-gradient(180deg,rgba(40,40,80,0.95),rgba(25,25,55,0.95))';
          cell.style.transform = 'translateY(-2px)';
          this.infoEl.textContent = `${slot.def.name}: ${slot.def.description}`;
        });
        cell.addEventListener('mouseleave', () => {
          cell.style.background = 'linear-gradient(180deg,rgba(20,20,50,0.95),rgba(12,12,35,0.95))';
          cell.style.transform = '';
          this.infoEl.textContent = '';
        });
        cell.addEventListener('click', () => {
          if (slot.def.usable && this.game) {
            this.inventory?.useItem(slot.def.id, this.game);
            this.render();
          }
        });
      } else {
        cell.style.opacity = '0.3';
        cell.textContent = '·';
      }

      this.gridEl.appendChild(cell);
    }
  }
}
