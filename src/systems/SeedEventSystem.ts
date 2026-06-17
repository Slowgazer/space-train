/** 种子事件系统 - 种子车厢上的随机事件（对话/小游戏） */

import type { DialogueEntry } from './DialogueSystem';

export type SeedEventType = 'dialogue' | 'minigame';

export interface SeedEvent {
  type: SeedEventType;
  title: string;
  data: DialogueEntry | MinigameData;
}

export interface MinigameData {
  type: 'raindrop' | 'pinball';
  instruction: string;
  duration: number;
}

export class SeedEventSystem {
  private cooldown = 0;
  private readonly COOLDOWN_TIME = 20; // 秒
  private _active = false;
  private _currentEvent: SeedEvent | null = null;
  private triggered = false;

  get active(): boolean { return this._active; }
  get currentEvent(): SeedEvent | null { return this._currentEvent; }

  /** 每帧调用：玩家靠近种子车厢时传参 */
  update(dt: number, nearSeed: boolean): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.triggered) return;

    // 玩家在种子车厢附近 && 冷却结束 && 概率触发(1%)
    if (nearSeed && this.cooldown <= 0 && Math.random() < 0.005) {
      this.spawnEvent();
    }
  }

  /** 生成事件 */
  private spawnEvent(): void {
    this._active = true;
    this.triggered = false;

    if (Math.random() < 0.6) {
      // 对话事件
      this._currentEvent = {
        type: 'dialogue',
        title: '💬 种子的悄悄话',
        data: this.generateDialogueEvent(),
      };
    } else {
      // 小游戏事件
      this._currentEvent = {
        type: 'minigame',
        title: '🎮 种子小游戏',
        data: this.generateMinigameEvent(),
      };
    }
  }

  /** 触发事件（玩家按 F） */
  tryTrigger(): SeedEvent | null {
    if (!this._active) return null;
    this.triggered = true;
    return this._currentEvent;
  }

  /** 事件结束 */
  resolve(): void {
    this._active = false;
    this._currentEvent = null;
    this.triggered = false;
    this.cooldown = this.COOLDOWN_TIME;
  }

  /** 生成科普对话事件 */
  private generateDialogueEvent(): DialogueEntry {
    const pool = this.getDialoguePool();
    const entry = pool[Math.floor(Math.random() * pool.length)];
    return entry;
  }

  /** 生成迷你游戏事件 */
  private generateMinigameEvent(): MinigameData {
    const games: MinigameData[] = [
      {
        type: 'raindrop',
        instruction: '☔ 接雨滴小游戏！移动鼠标接住雨滴，获得进化因子！',
        duration: 30,
      },
      {
        type: 'pinball',
        instruction: '🔮 弹球小游戏！点击发射，打碎砖块获得进化因子！',
        duration: 60,
      },
    ];
    return games[Math.floor(Math.random() * games.length)];
  }

  private getDialoguePool(): DialogueEntry[] {
    return [
      {
        text: '你知道吗？在沙漠中，有些植物的根能深入地下30米找水……你说我们也能这么厉害吗？',
        options: [
          { text: '当然可以！我们也要进化出强大的根系', correct: true },
          { text: '太夸张了吧，不可能', correct: false },
          { text: '扎根太深会不会错过沿途的风景？', correct: false },
        ],
        rewardMin: 50,
        rewardMax: 100,
        buffType: 1,
      },
      {
        text: '我听说松树能在零下几十度生存…它们的叶子为什么不会冻坏？',
        options: [
          { text: '是不是因为针状叶减少了热量散失？', correct: true },
          { text: '松树皮厚所以不怕冷', correct: false },
          { text: '它们体内有防冻液', correct: false },
        ],
        rewardMin: 50,
        rewardMax: 100,
        buffType: 1,
      },
      {
        text: '好渴啊…要是我有仙人掌那样的储水能力就好了。',
        options: [
          { text: '我们也可以进化出肉质茎来存水！', correct: true },
          { text: '忍着吧，前面可能有水源', correct: false },
          { text: '你太娇气了', correct: false },
        ],
        rewardMin: 50,
        rewardMax: 100,
        buffType: 1,
      },
      {
        text: '你知道吗？一朵花为了让蜜蜂来传粉，可能花了几百万年来改变自己的样子。',
        options: [
          { text: '这就是协同进化吧，互相塑造', correct: true },
          { text: '蜜蜂太挑剔了', correct: false },
          { text: '花为什么要讨好蜜蜂？', correct: false },
        ],
        rewardMin: 60,
        rewardMax: 110,
        buffType: 1,
      },
      {
        text: '在我很小很小的时候，我就想…如果我能像凤仙花一样把种子弹射出去，那该多酷啊！',
        options: [
          { text: '弹射传播确实很厉害，速度能达到10m/s！', correct: true },
          { text: '小心别砸到人', correct: false },
          { text: '我还是喜欢安静地长大', correct: false },
        ],
        rewardMin: 50,
        rewardMax: 100,
        buffType: 1,
      },
      {
        text: '如果我有一片很大的叶子，就能吸收更多阳光了…你喜欢大叶子还是小叶子？',
        options: [
          { text: '大叶子光合效率高，但水分消耗也大', correct: true },
          { text: '小叶子可爱！', correct: false },
          { text: '都一样吧', correct: false },
        ],
        rewardMin: 40,
        rewardMax: 90,
        buffType: 1,
      },
      {
        text: '有没有想过，为什么草莓长得满地都是？那不是随便长的，是它在用匍匐茎扩张领地呢！',
        options: [
          { text: '匍匐茎是聪明的生存策略，克隆自己风险低', correct: true },
          { text: '草莓只是长得比较乱吧', correct: false },
          { text: '所以草莓是一个巨大的克隆体？', correct: false },
        ],
        rewardMin: 55,
        rewardMax: 100,
        buffType: 1,
      },
      {
        text: '我的叶子好像有点蔫……是不是应该像龙舌兰那样给自己上一层蜡？',
        options: [
          { text: '蜡质层能减少水分蒸发和反射强光，是好主意', correct: true },
          { text: '涂蜡多麻烦啊', correct: false },
          { text: '你该多喝点水', correct: false },
        ],
        rewardMin: 50,
        rewardMax: 100,
        buffType: 1,
      },
    ];
  }
}
