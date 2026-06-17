import { EVOLUTION_TREE, getNodesByOrgan, ORGAN_INFO, type EvolutionNode } from '../config/evolutionData';

export class SeedEvolutionPanel {
  private container: HTMLElement;
  private tabsEl: HTMLElement;
  private treeEl: HTMLElement;
  private resourceEl: HTMLElement;
  private infoEl: HTMLElement;
  private _visible = false;
  private evolvedSet: Set<string>;
  private currentOrgan = 'leaf';
  private onEvolve: ((nodeId: string) => boolean) | null = null;
  private onClose: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'seed-evolution-panel';
    this.container.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:300;' +
      'display:none;flex-direction:column;align-items:center;color:#fff;font-family:monospace;';
    this.container.innerHTML = `
      <div style="width:90%;max-width:800px;margin:20px auto;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;font-size:22px;">🌳 种子进化树</h2>
          <span id="evo-resource" style="font-size:16px;color:#ffd700;">进化因子: 0</span>
        </div>
        <div id="evo-tabs" style="display:flex;gap:8px;"></div>
        <div id="evo-tree" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;min-height:300px;padding:16px;background:rgba(255,255,255,0.05);border-radius:12px;"></div>
        <div id="evo-info" style="padding:12px;background:rgba(255,255,255,0.08);border-radius:8px;font-size:13px;line-height:1.5;min-height:60px;"></div>
        <div style="text-align:center;font-size:12px;color:#888;">按 Z 关闭</div>
      </div>
    `;
    this.tabsEl = this.container.querySelector('#evo-tabs')!;
    this.treeEl = this.container.querySelector('#evo-tree')!;
    this.resourceEl = this.container.querySelector('#evo-resource')!;
    this.infoEl = this.container.querySelector('#evo-info')!;
    this.evolvedSet = new Set();
    document.body.appendChild(this.container);
  }

  setEvolved(ids: string[]): void {
    this.evolvedSet = new Set(ids);
  }

  setOnEvolve(cb: (nodeId: string) => boolean): void {
    this.onEvolve = cb;
  }

  setOnClose(cb: () => void): void {
    this.onClose = cb;
  }

  updateResource(amount: number): void {
    this.resourceEl.textContent = `进化因子: ${amount}`;
  }

  show(resource: number): void {
    if (this._visible) return;
    this._visible = true;
    this.container.style.display = 'flex';
    this.updateResource(resource);
    this.renderTabs();
    this.renderTree();
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
    this.onClose?.();
  }

  get visible(): boolean { return this._visible; }

  private renderTabs(): void {
    this.tabsEl.innerHTML = '';
    Object.entries(ORGAN_INFO).forEach(([key, info]) => {
      const btn = document.createElement('button');
      btn.textContent = `${info.icon} ${info.name}`;
      btn.style.cssText =
        `padding:8px 16px;border:2px solid ${key === this.currentOrgan ? '#4CAF50' : '#555'};` +
        'background:transparent;border-radius:8px;color:#fff;cursor:pointer;font-size:14px;font-family:monospace;' +
        `background:${key === this.currentOrgan ? 'rgba(76,175,80,0.2)' : 'transparent'};`;
      btn.onclick = () => {
        this.currentOrgan = key;
        this.renderTabs();
        this.renderTree();
        this.showInfo(null);
      };
      this.tabsEl.appendChild(btn);
    });
  }

  private renderTree(): void {
    this.treeEl.innerHTML = '';
    const nodes = getNodesByOrgan(this.currentOrgan);

    if (nodes.length === 0) {
      this.treeEl.innerHTML = '<div style="color:#888;padding:40px;">该分类暂无进化节点</div>';
      return;
    }

    // 按层级排列（无前置 = 第1层）
    const layers: EvolutionNode[][] = [];
    const assigned = new Map<string, number>();

    const getLayer = (id: string): number => {
      if (assigned.has(id)) return assigned.get(id)!;
      const node = nodes.find(n => n.id === id);
      if (!node || node.prerequisites.length === 0) {
        assigned.set(id, 0);
        return 0;
      }
      const depth = 1 + Math.max(...node.prerequisites.map(p => {
        const prereqExists = nodes.find(n => n.id === p);
        return prereqExists ? getLayer(p) : -1;
      }));
      assigned.set(id, depth);
      return depth;
    };

    nodes.forEach(n => {
      const layer = getLayer(n.id);
      while (layers.length <= layer) layers.push([]);
      layers[layer].push(n);
    });

    // 渲染层级
    layers.forEach((layerNodes, layerIdx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:12px;justify-content:center;width:100%;flex-wrap:wrap;';
      if (layerIdx > 0) {
        const connector = document.createElement('div');
        connector.style.cssText = 'width:100%;height:2px;background:linear-gradient(90deg,transparent,#666,transparent);margin:4px 0;';
        row.appendChild(connector);
      }
      layerNodes.forEach(node => {
        const card = document.createElement('div');
        const evolved = this.evolvedSet.has(node.id);
        const canEvolve = !evolved && node.prerequisites.every(p => this.evolvedSet.has(p) || p === '');
        const locked = !evolved && !canEvolve;

        let borderColor = '#555';
        if (evolved) borderColor = '#4CAF50';
        else if (locked) borderColor = '#333';

        card.style.cssText =
          `padding:12px;border:2px solid ${borderColor};border-radius:10px;` +
          `background:${evolved ? 'rgba(76,175,80,0.15)' : locked ? 'rgba(50,50,50,0.5)' : 'rgba(255,255,255,0.05)'};` +
          `cursor:${canEvolve ? 'pointer' : 'default'};opacity:${locked ? 0.4 : 1};` +
          'text-align:center;min-width:120px;max-width:140px;transition:all 0.2s;';

        card.innerHTML = `
          <div style="font-size:28px;margin-bottom:4px;">${node.icon}</div>
          <div style="font-size:13px;font-weight:bold;margin-bottom:4px;">${node.name}</div>
          <div style="font-size:11px;color:${evolved ? '#4CAF50' : '#aaa'};">
            ${evolved ? '✅ 已进化' : locked ? '🔒 未解锁' : `🔬 ${node.cost}因子`}
          </div>
        `;

        card.onmouseenter = () => this.showInfo(node);
        card.onmouseleave = () => this.showInfo(null);

        if (canEvolve) {
          card.onclick = () => {
            if (this.onEvolve?.(node.id)) {
              this.renderTree();
            }
          };
          card.onmouseenter = () => {
            card.style.borderColor = '#8BC34A';
            card.style.background = 'rgba(139,195,74,0.2)';
            this.showInfo(node);
          };
          card.onmouseleave = () => {
            card.style.borderColor = '#555';
            card.style.background = 'rgba(255,255,255,0.05)';
            this.showInfo(null);
          };
        }

        row.appendChild(card);
      });
      this.treeEl.appendChild(row);
    });
  }

  private showInfo(node: EvolutionNode | null): void {
    if (!node) {
      this.infoEl.textContent = '将鼠标悬停在节点上查看详细介绍';
      this.infoEl.style.color = '#888';
      return;
    }
    this.infoEl.style.color = '#fff';
    this.infoEl.innerHTML = `
      <div style="font-size:15px;font-weight:bold;margin-bottom:6px;">
        ${node.icon} ${node.name}
        <span style="font-size:12px;color:#888;font-weight:normal;margin-left:8px;">
          ${ORGAN_INFO[node.organ]?.name || ''}路线
        </span>
      </div>
      <div style="margin-bottom:6px;color:#8BC34A;">${node.description}</div>
      <div style="color:#aaa;font-size:12px;line-height:1.6;">
        💡 ${node.scienceDesc}
      </div>
      ${!this.evolvedSet.has(node.id) && node.cost > 0 ? `
        <div style="margin-top:8px;color:#ffd700;font-size:13px;">
          需要进化因子: ${node.cost}
          ${node.prerequisites.length > 0 ? ` | 前置: ${node.prerequisites.map(p => EVOLUTION_TREE.find(n => n.id === p)?.name || p).join(', ')}` : ''}
        </div>
      ` : ''}
    `;
  }
}
