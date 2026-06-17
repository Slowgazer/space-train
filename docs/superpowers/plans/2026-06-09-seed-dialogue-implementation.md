# 种子对话系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现种子对话系统，含性格随机生成、对话分支选择、活性+buff 奖励、30s 冷却

**Architecture:** DialogueSystem 管理对话数据池与性格，DialoguePanel 渲染 DOM 覆盖层，Game.ts 处理 F 键交互与 buff 计时

**Tech Stack:** TypeScript + DOM API

---

### Task 1: DialogueSystem — 对话池与性格

**Files:**
- Create: `src/systems/DialogueSystem.ts`

- [ ] **Step 1: 创建 DialogueSystem 类**

```ts
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
  private exclusiveUsed = 0;  // 已用的专属对话数(0~2)
  private genericUsed = 0;    // 已用的通用对话数(0~3)
  private coolDown = 0;
  private readonly COOLDOWN_TIME = 30;

  constructor() {
    const pList = [Personality.CHEERFUL, Personality.MELANCHOLY, Personality.TSUNDERE, Personality.SILENT];
    this.personality = pList[Math.floor(Math.random() * pList.length)];
    this.personalityName = PERSONALITY_NAMES[this.personality];
  }

  /** 是否可以对话 */
  get canTalk(): boolean {
    return this.coolDown <= 0 && (this.exclusiveUsed < 2 || this.genericUsed < GENERIC_DIALOGUE.length);
  }

  /** 获取剩余冷却秒数 */
  get coolDownLeft(): number {
    return Math.ceil(this.coolDown);
  }

  /** 获取当前对话，无可用对话时返回 null */
  getCurrentDialogue(): DialogueEntry | null {
    if (!this.canTalk) return null;

    // 优先出专属对话
    if (this.exclusiveUsed < 2) {
      return DIALOGUES[this.personality][this.exclusiveUsed];
    }
    if (this.genericUsed < GENERIC_DIALOGUE.length) {
      return GENERIC_DIALOGUE[this.genericUsed];
    }
    return null;
  }

  /** 提交选择，返回结果并推进状态 */
  selectOption(optionIndex: number): DialogueResult | null {
    const d = this.getCurrentDialogue();
    if (!d) return null;

    const opt = d.options[optionIndex];
    const reward = opt.correct
      ? Math.floor(d.rewardMin + Math.random() * (d.rewardMax - d.rewardMin))
      : Math.floor(10 + Math.random() * 10);

    // 推进对话
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

  /** 每帧更新冷却 */
  update(dt: number): void {
    if (this.coolDown > 0) {
      this.coolDown -= dt;
    }
  }
}
```

---

### Task 2: DialoguePanel — DOM 对话面板

**Files:**
- Create: `src/ui/DialoguePanel.ts`

- [ ] **Step 1: 创建 DialoguePanel 类**

```ts
import { DialogueEntry, DialogueOption } from '../systems/DialogueSystem';

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
      background:rgba(10,10,30,0.92);border:1px solid #8844ff;
      border-radius:12px;padding:24px 32px;min-width:360px;max-width:500px;
      z-index:200;display:none;font-family:monospace;color:#eee;
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

  /** 显示对话 */
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
        background:rgba(136,68,255,0.2);border:1px solid #8844ff;
        border-radius:6px;padding:10px 16px;color:#ddd;font-size:15px;
        font-family:monospace;cursor:pointer;text-align:left;transition:all 0.15s;
      `;
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(136,68,255,0.4)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(136,68,255,0.2)'; });
      btn.addEventListener('click', () => {
        // 禁用所有按钮防止重复点击
        this.optionsEl.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = true);
        onSelect(i);
      });
      this.optionsEl.appendChild(btn);
    });

    this.container.style.display = '';
  }

  /** 显示选择结果 */
  showResult(text: string, color = '#44ff44'): void {
    this.resultEl.textContent = text;
    this.resultEl.style.color = color;
    this.resultEl.style.display = '';
  }

  /** 关闭面板 */
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
```

---

### Task 3: Game.ts — 集成对话 + Buff 系统

**Files:**
- Modify: `src/game/Game.ts`

- [ ] **Step 1: 添加导入与字段**

```ts
import { DialogueSystem, BuffType } from '../systems/DialogueSystem';
import { DialoguePanel } from '../ui/DialoguePanel';
```

**新增字段：**
```ts
private dialogueSystem: DialogueSystem;
private dialoguePanel: DialoguePanel;
private dialogueCoolDownHUD: HTMLElement;

// buff 追踪
private activeBuff: BuffType = BuffType.NONE;
private buffTimer = 0;
// 保存原始值用于 buff 恢复
private baseSpeed = 2;
private baseDamage = 10;
```

- [ ] **Step 2: 构造函数初始化**

```ts
this.dialogueSystem = new DialogueSystem();
this.dialoguePanel = new DialoguePanel();

this.dialogueCoolDownHUD = this.createHUD('dialogue-cooldown', '#9966ff', '');
this.dialogueCoolDownHUD.style.bottom = '60px';
this.dialogueCoolDownHUD.style.right = '20px';
this.dialogueCoolDownHUD.style.display = 'none';
```

- [ ] **Step 3: 修改 F 键处理逻辑**

**原逻辑：** 仅检测升级车厢  
**新逻辑：** 依次检测升级车厢 → 种子车厢

在 `update()` 中的 F 键块后面添加种子对话检测：

```ts
// === 种子对话冷却 HUD ===
this.dialogueSystem.update(dt);
if (!this.dialogueSystem.canTalk && !this.gamePaused) {
  this.dialogueCoolDownHUD.textContent = `种子冷却: ${this.dialogueSystem.coolDownLeft}s`;
  this.dialogueCoolDownHUD.style.display = '';
} else {
  this.dialogueCoolDownHUD.style.display = 'none';
}

// === 种子对话交互（F 键 + 靠近种子车厢） ===
const seedX = this.train.getCarPosition(SEED_CAR_INDEX);
const seedY = this.train.group.position.y;
const nearSeed = Math.sqrt((this.playerX - seedX) ** 2 + (this.playerY - seedY) ** 2) < 4;

// 种子冷却时显示提示
if (nearSeed && !this.gamePaused && !this.dialogueSystem.canTalk) {
  this.upgradePromptHUD.textContent = '种子在休息…';
  this.upgradePromptHUD.style.display = '';
} else if (nearSeed && !this.gamePaused && this.dialogueSystem.canTalk && !this.upgradePanel.visible) {
  this.upgradePromptHUD.textContent = '按 F 和种子对话';
  this.upgradePromptHUD.style.display = '';
}

// 原有升级车厢提示只在不是种子提示时显示
if (!nearSeed && nearUpg && !this.gamePaused) { ... }
```

然后修改 F 键按下处理，在升级车厢判断之后增加种子车厢判断：

```ts
// 在 F 键处理中，升级车厢判断之后：
} else if (fDown && !this.prevFDown && !this.gamePaused && nearSeed && this.dialogueSystem.canTalk) {
  this.startDialogue();
}
```

- [ ] **Step 4: 添加对话流程方法**

```ts
private startDialogue(): void {
  const d = this.dialogueSystem.getCurrentDialogue();
  if (!d) return;
  this.gamePaused = true;
  this.dialoguePanel.show(d, this.dialogueSystem.personalityName, (index) => {
    this.handleDialogueChoice(index);
  });
}

private handleDialogueChoice(index: number): void {
  const result = this.dialogueSystem.selectOption(index);
  if (!result) { this.dialoguePanel.hide(); this.gamePaused = false; return; }

  if (result.correct) {
    this.dialoguePanel.showResult(`✓ +${result.reward} 活性！`, '#44ff44');
    this.vitality += result.reward;
    this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;

    if (result.buffType === BuffType.SPEED) {
      this.activeBuff = BuffType.SPEED;
      this.buffTimer = 15;
    } else if (result.buffType === BuffType.DAMAGE) {
      this.activeBuff = BuffType.DAMAGE;
      this.buffTimer = 15;
    }
  } else {
    this.dialoguePanel.showResult(`× +${result.reward} 活性（安慰奖）`, '#ff8844');
    this.vitality += result.reward;
    this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
  }

  // 1.2s 后自动关闭面板
  setTimeout(() => {
    this.dialoguePanel.hide();
    this.gamePaused = false;
  }, 1200);
}
```

- [ ] **Step 5: Buff 更新逻辑**

在 `update()` 中的移动速度计算处：

```ts
let speed = 2 + (this.playerSpeedLv - 1) * 0.5;
if (this.activeBuff === BuffType.SPEED) speed *= 1.5;

// 移动代码...

// buff 计时
if (this.activeBuff !== BuffType.NONE) {
  this.buffTimer -= dt;
  if (this.buffTimer <= 0) {
    this.activeBuff = BuffType.NONE;
    // 恢复激光伤害（如果 buff 是热力）
    (this.weapons[0] as Laser).damage = this.baseDamage + (this.laserDamageLv - 1) * 5;
  } else if (this.activeBuff === BuffType.DAMAGE) {
    (this.weapons[0] as Laser).damage = this.baseDamage + (this.laserDamageLv - 1) * 5 + 10;
  }
}
```

**注意：** 基础速度 `2` 已经在 speed 变量中，不需要额外的 baseSpeed 字段。

---

### Task 4: 构建验证

- [ ] **Step 1: 编译检查**

```bash
cd "C:\Users\28766\Desktop\作业"
npx tsc --noEmit 2>&1
```

常见问题：
- `DialogueSystem` / `DialoguePanel` 类名拼写错误
- `BuffType` 导入路径正确性
- `startDialogue` / `handleDialogueChoice` 方法拼写

- [ ] **Step 2: 生产构建**

```bash
npx vite build 2>&1
```
