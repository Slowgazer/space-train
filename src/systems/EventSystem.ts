/**
 * 航行事件系统
 * 航线两侧随机出现事件星球，靠近后触发文字对话抉择
 */

export interface EventOption {
  text: string;
  result: string;
  reward: number;
  rewardType: 'currency' | 'vitality';
}

export interface GameEvent {
  id: string;
  title: string;
  emoji: string;
  text: string;
  options: EventOption[];
}

/** 事件池 */
const EVENT_POOL: GameEvent[] = [
  {
    id: 'distress_signal',
    title: '求救信号',
    emoji: '🆘',
    text: '一颗破碎的卫星发出微弱的求救信号。接收器显示里面还有生命迹象，但救援需要消耗大量资源。',
    options: [
      { text: '派出救援小队', result: '救援成功了！幸存者赠予你珍贵的能量矿石作为答谢。', reward: 80, rewardType: 'currency' },
      { text: '无视信号继续前进', result: '信号渐渐消失在星海中。你心中有些不安，但节省了资源。', reward: 10, rewardType: 'vitality' },
    ],
  },
  {
    id: 'space_debris',
    title: '太空残骸',
    emoji: '🛰️',
    text: '前方漂浮着大片飞船残骸，似乎是某次星际战争的遗迹。探测器显示残骸中可能藏有可回收的稀有材料。',
    options: [
      { text: '靠近搜寻残骸', result: '在残骸中找到了几块完好的星核碎片，价值不菲！', reward: 60, rewardType: 'currency' },
      { text: '绕行避让', result: '你选择安全第一。但观察残骸时，种子吸收到了散逸的宇宙能量。', reward: 40, rewardType: 'vitality' },
    ],
  },
  {
    id: 'cosmic_flower',
    title: '宇宙花海',
    emoji: '🌸',
    text: '一片由光能结晶构成的"花海"漂浮在航线旁。晶体中蕴含着浓郁的生命能量，种子兴奋地颤动起来。',
    options: [
      { text: '让种子吸收能量', result: '种子沉浸在花海中，大量生命活性涌入！种子开心地发光。', reward: 70, rewardType: 'vitality' },
      { text: '采集晶体带走', result: '你小心翼翼地采集了部分晶体。虽然吸收量减少了，但获得了可交易的矿石。', reward: 50, rewardType: 'currency' },
    ],
  },
  {
    id: 'wandering_trader',
    title: '流浪商人',
    emoji: '🧑‍🚀',
    text: '一位独自漂流在星际间的商人向你们挥手。他的飞船看起来破旧但装满了货物。"嘿！想不想做笔交易？"',
    options: [
      { text: '用活性交换矿物', result: '商人很高兴！他给了你一些珍贵的星际矿石作为交换。', reward: 90, rewardType: 'currency' },
      { text: '请他喝杯太空茶', result: '商人被你的善意打动，分享了他多年星际旅行的智慧。种子从中获得了成长的能量。', reward: 55, rewardType: 'vitality' },
    ],
  },
  {
    id: 'nebula_cloud',
    title: '星云雾团',
    emoji: '🌫️',
    text: '一团神秘的紫色星云横亘在航线侧方。星云中闪烁着奇异的光芒，似乎隐藏着某种古老的秘密。',
    options: [
      { text: '深入星云探索', result: '在星云核心发现了一颗古老的记忆水晶。它蕴含着宇宙诞生时的信息，种子深受启发！', reward: 75, rewardType: 'vitality' },
      { text: '在边缘观察', result: '虽然只在边缘游荡，但星云的辐射还是让设备收集到了大量数据，可以变卖换成金币。', reward: 55, rewardType: 'currency' },
    ],
  },
  {
    id: 'abandoned_station',
    title: '废弃空间站',
    emoji: '🏚️',
    text: '一座被遗弃的古老空间站静静地漂浮着。灯光早已熄灭，但能源核心似乎仍有微弱的脉动。',
    options: [
      { text: '进入空间站搜刮', result: '找到了遗留的能源储备和大量金属材料！赚了一大笔。', reward: 85, rewardType: 'currency' },
      { text: '用种子感应站内残留', result: '种子感应到空间站中曾经生活过的生命痕迹，这些记忆化作了珍贵的生命活性。', reward: 65, rewardType: 'vitality' },
    ],
  },
  {
    id: 'solar_flare',
    title: '太阳耀斑',
    emoji: '☀️',
    text: '邻近的恒星突然爆发出强烈的耀斑！高能粒子流正向航线涌来。必须迅速做出决定。',
    options: [
      { text: '开启能量护盾硬扛', result: '护盾吸收了耀斑能量并转化为可用资源！列车系统因祸得福。', reward: 70, rewardType: 'currency' },
      { text: '让种子吸收辐射', result: '种子展现出惊人的适应力，将辐射转化为生命活性。虽然冒险但收获巨大。', reward: 80, rewardType: 'vitality' },
    ],
  },
  {
    id: 'ancient_monument',
    title: '远古纪念碑',
    emoji: '🗿',
    text: '一座巨大的石碑漂浮在虚空中，上面刻满了未知文明的文字。种子似乎能感受到石碑散发出的古老能量。',
    options: [
      { text: '让种子解读石碑', result: '种子触碰到石碑的瞬间，大量古老的知识涌入，化作了珍贵的生命活性！', reward: 70, rewardType: 'vitality' },
      { text: '拓印碑文带走', result: '你将碑文完整拓印下来。这些古代知识可以卖给星际学者换取金币。', reward: 65, rewardType: 'currency' },
    ],
  },
];

/** 随机取一个事件 */
function randomEvent(): GameEvent {
  return EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
}

export class EventSystem {
  /** 距上次事件的航行距离 */
  private distanceSinceLast = 0;
  /** 事件触发间隔 */
  private eventInterval = 15;
  /** 当前是否有活跃事件 */
  private _active = false;
  /** 当前事件数据 */
  currentEvent: GameEvent | null = null;
  /** 事件在世界中的位置 */
  eventX = 0;
  eventY = 0;
  /** 是否已被触发（防止重复） */
  triggered = false;
  /** 事件是否已生成等待玩家靠近 */
  spawned = false;

  get active(): boolean { return this._active; }

  /** 每帧更新，返回事件位置（用于标记）或 null */
  update(dt: number, speed: number, playerX: number): { x: number; y: number } | null {
    this.distanceSinceLast += speed * dt;

    if (!this.spawned && this.distanceSinceLast >= this.eventInterval) {
      this.spawnEvent(playerX);
    }

    if (this.spawned && !this.triggered) {
      return { x: this.eventX, y: this.eventY };
    }
    return null;
  }

  /** 玩家按F触发事件，返回事件数据 */
  tryTrigger(playerX: number, playerY: number): GameEvent | null {
    if (!this.spawned || this.triggered || !this.currentEvent) return null;

    const dx = playerX - this.eventX;
    const dy = playerY - this.eventY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3.5) {
      this.triggered = true;
      this._active = true;
      return this.currentEvent;
    }
    return null;
  }

  /** 生成事件在航线侧面 */
  private spawnEvent(playerX: number): void {
    this.spawned = true;
    this.currentEvent = randomEvent();
    // 事件出现在玩家前方 + 航线上下方（不挡路）
    this.eventX = playerX + 10;
    this.eventY = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4);
    // 下次事件间隔随机
    this.eventInterval = 10 + Math.random() * 15;
  }

  /** 完成事件，重置状态 */
  resolve(): void {
    this._active = false;
    this.triggered = false;
    this.spawned = false;
    this.currentEvent = null;
    this.distanceSinceLast = 0;
  }

  /** 距下次事件剩余距离 */
  getRemainingDistance(): number {
    return Math.max(0, this.eventInterval - this.distanceSinceLast);
  }
}
