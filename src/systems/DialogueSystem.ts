/** buff 类型 */
export enum BuffType {
  NONE,
  SPEED,   // 疾风：移速 +50%
  DAMAGE,  // 热力：激光伤害 +10
}

/** 种子性格 */
export enum Personality {
  CHEERFUL,
  MELANCHOLY,
  TSUNDERE,
  SILENT,
}

/** 单个选项 */
export interface DialogueOption {
  text: string;
  correct: boolean;
}

/** 对话条目 */
export interface DialogueEntry {
  text: string;
  options: DialogueOption[];
  rewardMin: number;
  rewardMax: number;
  buffType: BuffType;
}

/** 对话结果 */
export interface DialogueResult {
  selectedIndex: number;
  correct: boolean;
  reward: number;
  buffType: BuffType;
}

const PERSONALITY_NAMES: Record<Personality, string> = {
  [Personality.CHEERFUL]: '开朗',
  [Personality.MELANCHOLY]: '忧郁',
  [Personality.TSUNDERE]: '傲娇',
  [Personality.SILENT]: '沉默',
};

const DIALOGUES: Record<Personality, DialogueEntry[]> = {
  [Personality.CHEERFUL]: [
    {
      text: '今天天气真好！我们去冒险吧！',
      options: [
        { text: '好啊！出发！', correct: true },
        { text: '有点累……', correct: false },
        { text: '外面都是陨石诶', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.SPEED,
    },
    {
      text: '我昨晚梦到好多糖果！',
      options: [
        { text: '梦是反的啦', correct: false },
        { text: '听起来好甜！', correct: true },
        { text: '你该少吃糖了', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.DAMAGE,
    },
  ],
  [Personality.MELANCHOLY]: [
    {
      text: '太空好安静……你会一直陪着我吗？',
      options: [
        { text: '当然会', correct: true },
        { text: '我还有工作要做', correct: false },
        { text: '你怎么这么多愁善感', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.SPEED,
    },
    {
      text: '这里的星星虽然多，但感觉好孤独',
      options: [
        { text: '你还有我呢', correct: true },
        { text: '习惯就好', correct: false },
        { text: '那你想回地球吗', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.DAMAGE,
    },
  ],
  [Personality.TSUNDERE]: [
    {
      text: '哼，我才没有在等你过来呢！',
      options: [
        { text: '知道啦知道啦', correct: true },
        { text: '哦', correct: false },
        { text: '那我走了', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.SPEED,
    },
    {
      text: '你别误会了！我只是刚好有空而已！',
      options: [
        { text: '好好好，你说得对', correct: true },
        { text: '我没误会啊', correct: false },
        { text: '你好麻烦', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.DAMAGE,
    },
  ],
  [Personality.SILENT]: [
    {
      text: '……',
      options: [
        { text: '我懂', correct: true },
        { text: '你倒是说话啊', correct: false },
        { text: '那我走了', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.SPEED,
    },
    {
      text: '……嗯。',
      options: [
        { text: '你在想什么', correct: false },
        { text: '那就好', correct: true },
        { text: '说人话', correct: false },
      ],
      rewardMin: 50, rewardMax: 100,
      buffType: BuffType.DAMAGE,
    },
  ],
};

/** 通用对话（所有性格共用） */
const GENERIC_DIALOGUE: DialogueEntry[] = [
  {
    text: '前面好像有什么东西在发光……',
    options: [
      { text: '去看看', correct: true },
      { text: '太危险了', correct: false },
      { text: '你眼花了吧', correct: false },
    ],
    rewardMin: 50, rewardMax: 100,
    buffType: BuffType.SPEED,
  },
  {
    text: '你有没有觉得今天的陨石特别多？',
    options: [
      { text: '有我在不怕', correct: true },
      { text: '确实有点多', correct: false },
      { text: '是你太胆小啦', correct: false },
    ],
    rewardMin: 50, rewardMax: 100,
    buffType: BuffType.DAMAGE,
  },
  {
    text: '我好像听到什么声音……',
    options: [
      { text: '我去检查一下', correct: true },
      { text: '别自己吓自己', correct: false },
      { text: '是引擎声吧', correct: false },
    ],
    rewardMin: 50, rewardMax: 100,
    buffType: BuffType.SPEED,
  },
];

/** 对话系统 */
export class DialogueSystem {
  readonly personality: Personality;
  readonly personalityName: string;
  private exclusiveUsed = 0;
  private genericUsed = 0;
  private coolDown = 0;
  private readonly COOLDOWN_TIME = 30;

  constructor() {
    const pList = [Personality.CHEERFUL, Personality.MELANCHOLY, Personality.TSUNDERE, Personality.SILENT];
    this.personality = pList[Math.floor(Math.random() * pList.length)];
    this.personalityName = PERSONALITY_NAMES[this.personality];
  }

  get canTalk(): boolean {
    return this.coolDown <= 0 && (this.exclusiveUsed < 2 || this.genericUsed < GENERIC_DIALOGUE.length);
  }

  get coolDownLeft(): number {
    return Math.ceil(this.coolDown);
  }

  getCurrentDialogue(): DialogueEntry | null {
    if (!this.canTalk) return null;

    if (this.exclusiveUsed < 2) {
      return DIALOGUES[this.personality][this.exclusiveUsed];
    }
    if (this.genericUsed < GENERIC_DIALOGUE.length) {
      return GENERIC_DIALOGUE[this.genericUsed];
    }
    return null;
  }

  selectOption(optionIndex: number): DialogueResult | null {
    const d = this.getCurrentDialogue();
    if (!d) return null;

    const opt = d.options[optionIndex];
    const reward = opt.correct
      ? Math.floor(d.rewardMin + Math.random() * (d.rewardMax - d.rewardMin))
      : Math.floor(10 + Math.random() * 10);

    if (this.exclusiveUsed < 2) {
      this.exclusiveUsed++;
    } else if (this.genericUsed < GENERIC_DIALOGUE.length) {
      this.genericUsed++;
    }

    this.coolDown = this.COOLDOWN_TIME;

    return {
      selectedIndex: optionIndex,
      correct: opt.correct,
      reward,
      buffType: opt.correct ? d.buffType : BuffType.NONE,
    };
  }

  update(dt: number): void {
    if (this.coolDown > 0) {
      this.coolDown -= dt;
    }
  }
}
