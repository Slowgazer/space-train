interface StationGood {
  id: string;
  name: string;
  icon: string;
  price: number;
  currencyType: 'coin' | 'vitality';
}

const ALL_GOODS: StationGood[] = [
  { id: 'stardust', name: '星尘', icon: '✨', price: 30, currencyType: 'coin' },
  { id: 'energy_crystal', name: '能量水晶', icon: '🔮', price: 80, currencyType: 'coin' },
  { id: 'life_dew', name: '生命甘露', icon: '💧', price: 50, currencyType: 'vitality' },
  { id: 'core_shard', name: '星核碎片', icon: '💎', price: 60, currencyType: 'coin' },
  { id: 'soul_petal', name: '灵魂花瓣', icon: '🌸', price: 120, currencyType: 'vitality' },
  { id: 'ancient_seed', name: '古老种子', icon: '🌟', price: 200, currencyType: 'vitality' },
];

const STATION_EVENTS = [
  { text: '站台上的商人对你微笑：「远方来的旅人，这是我在废墟中找到的——」你获得了 25 金币。', reward: () => 25 },
  { text: '一股奇异的能量从星球表面升起，你的种子吸收了它，生命活性产出暂时提升。', reward: () => 0, buff: 'vitality_boost' },
  { text: '一个流浪者递给你一块发光的石头：「拿着吧，它能在关键时刻保护你。」获得能量水晶。', reward: () => 0, item: 'energy_crystal' },
  { text: '你听到从星球深处传来的低语…种子似乎很平静。什么也没有发生。', reward: () => 0 },
  { text: '一阵流星雨划过天际，你收集到一些闪耀的碎片。获得 15 金币。', reward: () => 15 },
];

export class StationPanel {
  private container: HTMLElement;
  private contentEl: HTMLElement;
  private onDepart: (() => void) | null = null;
  private game: any = null;
  private _visible = false;
  private goods: StationGood[] = [];
  private eventUsed = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'station-panel';
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.7);display:none;align-items:center;
      justify-content:center;z-index:200;font-family:monospace;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:linear-gradient(180deg,rgba(20,25,50,0.97),rgba(10,12,30,0.97));
      border:2px solid #ffd740;border-radius:14px;padding:24px 28px;
      min-width:400px;max-width:520px;width:90%;
      box-shadow:0 12px 48px rgba(255,215,64,0.2),0 4px 12px rgba(0,0,0,0.6);
      color:#eee;
    `;

    box.innerHTML = '<h2 style="color:#ffd740;margin:0 0 4px;text-align:center;font-size:20px;">🪐 空间站</h2>' +
      '<p style="color:#888;margin:0 0 16px;text-align:center;font-size:13px;">欢迎来到星际驿站</p>';

    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;';

    const tradeTab = document.createElement('button');
    tradeTab.textContent = '📦 交易';
    tradeTab.style.cssText = `flex:1;padding:8px;background:rgba(255,215,64,0.15);border:1px solid #ffd740;border-radius:6px;
      color:#ffd740;font-family:monospace;font-size:14px;cursor:pointer;`;
    tradeTab.onclick = () => this.renderTrade();

    const eventTab = document.createElement('button');
    eventTab.textContent = '📜 事件';
    eventTab.style.cssText = `flex:1;padding:8px;background:rgba(79,195,247,0.12);border:1px solid #4fc3f7;border-radius:6px;
      color:#4fc3f7;font-family:monospace;font-size:14px;cursor:pointer;`;
    eventTab.onclick = () => this.renderEvent();

    tabs.appendChild(tradeTab);
    tabs.appendChild(eventTab);
    box.appendChild(tabs);

    this.contentEl = document.createElement('div');
    this.contentEl.style.cssText = 'min-height:160px;';
    box.appendChild(this.contentEl);

    const departBtn = document.createElement('button');
    departBtn.textContent = '🚀 出发';
    departBtn.style.cssText = `
      display:block;width:100%;margin-top:16px;padding:12px;
      background:linear-gradient(180deg,#ffd740,#ff8f00);border:none;border-radius:8px;
      color:#1a1a2e;font-family:monospace;font-size:16px;font-weight:bold;
      cursor:pointer;box-shadow:0 4px 16px rgba(255,215,64,0.3);
    `;
    departBtn.onclick = () => this.onDepart?.();
    box.appendChild(departBtn);

    this.container.appendChild(box);
    document.body.appendChild(this.container);
  }

  get visible(): boolean { return this._visible; }

  show(onDepart: () => void, game: any): void {
    this._visible = true;
    this.onDepart = onDepart;
    this.game = game;
    this.eventUsed = false;
    this.container.style.display = 'flex';

    // 随机选取 3 种商品
    const shuffled = [...ALL_GOODS].sort(() => Math.random() - 0.5);
    this.goods = shuffled.slice(0, 3);

    this.renderTrade();
  }

  hide(): void {
    this._visible = false;
    this.container.style.display = 'none';
    this.onDepart = null;
    this.game = null;
  }

  private renderTrade(): void {
    this.contentEl.innerHTML = '';

    for (const g of this.goods) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;' +
        'margin:6px 0;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:8px;' +
        'border:1px solid rgba(255,215,64,0.15);';

      const info = document.createElement('span');
      info.textContent = `${g.icon} ${g.name}  —  ${g.price} ${g.currencyType === 'coin' ? '金币' : '活性'}`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = '购买';
      buyBtn.style.cssText = 'padding:5px 14px;background:rgba(255,215,64,0.2);border:1px solid #ffd740;' +
        'border-radius:4px;color:#ffd740;font-family:monospace;font-size:13px;cursor:pointer;';
      buyBtn.onclick = () => this.buy(g);
      row.appendChild(info);
      row.appendChild(buyBtn);
      this.contentEl.appendChild(row);
    }
  }

  private buy(g: StationGood): void {
    if (!this.game) return;

    if (g.currencyType === 'coin') {
      if (this.game.currency < g.price) return;
      this.game.currency -= g.price;
      this.game.coinHUD.textContent = `金币: ${this.game.currency}`;
    } else {
      if (this.game.vitality < g.price) return;
      this.game.vitality -= g.price;
      this.game.vitalityHUD.textContent = `活性: ${Math.floor(this.game.vitality)}`;
    }

    this.game.inventory.addItem(g.id);
    this.renderTrade();
  }

  private renderEvent(): void {
    this.contentEl.innerHTML = '';

    if (this.eventUsed) {
      const doneEl = document.createElement('div');
      doneEl.style.cssText = 'color:#888;font-size:14px;text-align:center;padding:32px;';
      doneEl.textContent = '本空间站的事件已探索完成，前往下一站吧。';
      this.contentEl.appendChild(doneEl);
      return;
    }

    const evt = STATION_EVENTS[Math.floor(Math.random() * STATION_EVENTS.length)];

    const textEl = document.createElement('div');
    textEl.style.cssText = 'color:#ccc;font-size:14px;line-height:1.7;padding:16px;' +
      'background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(79,195,247,0.2);';
    textEl.textContent = evt.text;
    this.contentEl.appendChild(textEl);

    // 应用奖励
    if (evt.reward) {
      const coin = evt.reward();
      if (coin > 0 && this.game) {
        this.game.addCurrency(coin, 0, 0);
      }
    }
    if (evt.item && this.game) {
      this.game.inventory.addItem(evt.item);
    }
    if (evt.buff === 'vitality_boost' && this.game) {
      this.game.vitalityPerSecond *= 1.3;
    }

    this.eventUsed = true;
  }
}
