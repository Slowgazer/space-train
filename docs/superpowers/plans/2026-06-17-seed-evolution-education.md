# 种子系统改造 - 生命教育科普实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**目标：** 将种子系统改为生命教育科普核心，激光开采资源→种子进化树→对话科普

**架构：** 新增 3 个系统 + 3 个 UI 面板，修改激光/陨石交互和 Game.ts 主循环

**依赖：** Three.js, 已有 WeaponContext/DialogueSystem

---

### Task 1: 激光收集进化因子

**文件：**
- 修改: `src/weapons/types.ts:9-25` — WeaponContext 加 `addEvolutionResource`
- 修改: `src/weapons/Laser.ts` — 击败陨石时调 `addEvolutionResource`
- 修改: `src/entities/Asteroid.ts` — 加 `getEvolutionResource()` 方法
- 修改: `src/game/Game.ts` — 实现 `addEvolutionResource` 回调

**步骤：**

扩展 WeaponContext 接口，加可选回调：
```typescript
// src/weapons/types.ts
export interface WeaponContext {
  // ... 现有字段
  addEvolutionResource?(amount: number): void;
}
```

Asteroid 加资源产出方法（按 tier 决定）：
```typescript
// src/entities/Asteroid.ts
getEvolutionResource(): number {
  const base = Math.ceil(this.radius * 3);
  if (this.tier === AsteroidTier.GOLDEN) return base * 4;
  if (this.tier === AsteroidTier.ELITE) return base * 3;
  if (this.tier === AsteroidTier.REINFORCED) return base * 2;
  return base; // NORMAL
}
```

Laser.ts 中击杀陨石时调用（只加在 Laser 的更新逻辑中，其他武器不加）：
- 在 Laser.ts 中找到击杀陨石的分支，添加 `ctx.addEvolutionResource?.(a.getEvolutionResource())`

Game.ts 中在武器 update 时传入回调：
- 在 WeaponContext 的 `addEvolutionResource` 字段中传入箭头函数
- 函数实现：`this.evolutionResource += amount; this.updateEvolutionHUD();`
- 加新字段 `evolutionResource = 0` 和 `evolutionHUD` 显示元素

---

### Task 2: 进化树数据 + UI 面板

**文件：**
- 创建: `src/config/evolutionData.ts` — 进化树节点定义
- 创建: `src/ui/SeedEvolutionPanel.ts` — 进化树 UI

**步骤：**

`src/config/evolutionData.ts`：

```typescript
export interface EvolutionNode {
  id: string;
  name: string;
  organ: 'leaf' | 'stem' | 'root' | 'reproduce';
  description: string;      // 游戏效果描述
  scienceDesc: string;     // 科普说明
  cost: number;            // 消耗进化因子
  prerequisites: string[]; // 前置节点 id
  gameEffect: Record<string, number>; // 游戏数值加成
  icon: string;            // Emoji
}

export const EVOLUTION_TREE: EvolutionNode[] = [
  // 叶片起始
  { id: 'leaf_basic', name: '基础叶片', organ: 'leaf',
    description: '光合效率 +10%', scienceDesc: '叶片是植物最主要的能量来源器官...',
    cost: 0, prerequisites: [], icon: '🌿',
    gameEffect: { photosynthEfficiency: 0.1 } },
  { id: 'leaf_needle', name: '针状叶', organ: 'leaf',
    description: '耐旱度 +20%', scienceDesc: '仙人掌、松树等植物进化出针状叶以减少蒸腾...',
    cost: 30, prerequisites: ['leaf_basic'], icon: '🌵',
    gameEffect: { droughtResist: 20 } },
  { id: 'leaf_wide', name: '宽大叶片', organ: 'leaf',
    description: '光合效率 +30%', scienceDesc: '热带雨林阴生植物增大叶片面积捕获散射光...',
    cost: 30, prerequisites: ['leaf_basic'], icon: '🌴',
    gameEffect: { photosynthEfficiency: 0.3 } },
  { id: 'leaf_wax', name: '蜡质层', organ: 'leaf',
    description: '耐旱度 +15%, 耐热度 +10%',
    scienceDesc: '龙舌兰叶表的蜡质层可反射30%以上的太阳辐射...',
    cost: 40, prerequisites: ['leaf_needle'], icon: '🌵',
    gameEffect: { droughtResist: 15, heatResist: 10 } },
  { id: 'leaf_c4', name: 'C4光合路径', organ: 'leaf',
    description: '高温光合效率 +50%',
    scienceDesc: '玉米、甘蔗等C4植物进化出CO₂浓缩泵...',
    cost: 60, prerequisites: ['leaf_wide'], icon: '🌽',
    gameEffect: { heatPhotosynth: 0.5 } },

  // 茎起始
  { id: 'stem_basic', name: '基础茎干', organ: 'stem',
    description: '支撑强度 +10%', scienceDesc: '茎干支撑叶片并输送水分养分...',
    cost: 0, prerequisites: [], icon: '🌱',
    gameEffect: { supportStr: 0.1 } },
  { id: 'stem_creeper', name: '匍匐茎', organ: 'stem',
    description: '领地扩散 +20%', scienceDesc: '草莓通过匍匐茎每5-10cm长出新植株...',
    cost: 30, prerequisites: ['stem_basic'], icon: '🍓',
    gameEffect: { spreadRange: 20 } },
  { id: 'stem_climber', name: '攀援茎', organ: 'stem',
    description: '生长速度 +30%', scienceDesc: '牵牛花茎生长速度可达每天5-10cm...',
    cost: 30, prerequisites: ['stem_basic'], icon: '🌺',
    gameEffect: { growSpeed: 0.3 } },
  { id: 'stem_tuber', name: '块茎储存', organ: 'stem',
    description: '抗逆性 +25%', scienceDesc: '土豆的块茎淀粉含量可达25%...',
    cost: 40, prerequisites: ['stem_creeper'], icon: '🥔',
    gameEffect: { stressResist: 25 } },
  { id: 'stem_tendril', name: '卷须触性', organ: 'stem',
    description: '攀援稳定性 +30%', scienceDesc: '丝瓜卷须20-30秒内开始卷曲缠绕...',
    cost: 40, prerequisites: ['stem_climber'], icon: '🥒',
    gameEffect: { climbStability: 0.3 } },

  // 根起始
  { id: 'root_basic', name: '基础根系', organ: 'root',
    description: '吸收效率 +10%', scienceDesc: '根系是植物吸收水分和矿物质的器官...',
    cost: 0, prerequisites: [], icon: '🌰',
    gameEffect: { absorbEff: 0.1 } },
  { id: 'root_deep', name: '深根系', organ: 'root',
    description: '耐旱度 +30%', scienceDesc: '骆驼刺根系可达地下30米吸收深层地下水...',
    cost: 35, prerequisites: ['root_basic'], icon: '🏜️',
    gameEffect: { droughtResist: 30 } },
  { id: 'root_mycorrhiza', name: '菌根共生', organ: 'root',
    description: '营养吸收效率 +40%', scienceDesc: '90%以上植物与真菌形成菌根共生...',
    cost: 45, prerequisites: ['root_basic'], icon: '🍄',
    gameEffect: { nutrientAbsorb: 0.4 } },
  { id: 'root_succulent', name: '肉质根', organ: 'root',
    description: '蓄水量 +30%', scienceDesc: '沙漠植物肉质根可储存大量水分...',
    cost: 40, prerequisites: ['root_deep'], icon: '🌵',
    gameEffect: { waterStorage: 30 } },

  // 繁殖起始
  { id: 'reproduce_basic', name: '基础繁殖', organ: 'reproduce',
    description: '繁殖效率 +10%', scienceDesc: '植物的繁殖策略直接决定种群延续...',
    cost: 0, prerequisites: [], icon: '🌻',
    gameEffect: { reproEff: 0.1 } },
  { id: 'reproduce_wind', name: '风媒传粉', organ: 'reproduce',
    description: '繁殖范围 +30%', scienceDesc: '一株玉米可产生5000万粒花粉随风扩散数百公里...',
    cost: 30, prerequisites: ['reproduce_basic'], icon: '🌾',
    gameEffect: { spreadRange: 30 } },
  { id: 'reproduce_insect', name: '虫媒传粉', organ: 'reproduce',
    description: '繁殖效率 +30%', scienceDesc: '油菜花的花粉表面有黏性物质可附着在蜜蜂体表...',
    cost: 35, prerequisites: ['reproduce_basic'], icon: '🐝',
    gameEffect: { reproEff: 0.3 } },
  { id: 'reproduce_explode', name: '弹射传播', organ: 'reproduce',
    description: '领地扩散 +20%', scienceDesc: '凤仙花以10m/s速度弹射种子至2-5米外...',
    cost: 30, prerequisites: ['reproduce_basic'], icon: '💥',
    gameEffect: { spreadRange: 20 } },
  { id: 'reproduce_animal', name: '动物传播', organ: 'reproduce',
    description: '远程扩散 +40%', scienceDesc: '苍耳果实有倒钩刺可附着动物皮毛...',
    cost: 40, prerequisites: ['reproduce_wind', 'reproduce_insect'], icon: '🦊',
    gameEffect: { remoteSpread: 0.4 } },

  // 高级节点
  { id: 'cam_photosynth', name: 'CAM光合', organ: 'leaf',
    description: '干旱光合效率 +80%',
    scienceDesc: '仙人掌夜间开气孔吸收CO₂以苹果酸形式储存...',
    cost: 80, prerequisites: ['leaf_wax', 'root_succulent'], icon: '🌙',
    gameEffect: { dryPhotosynth: 0.8 } },
  { id: 'seed_dormancy', name: '种子休眠', organ: 'reproduce',
    description: '逆境存活率 +50%',
    scienceDesc: '北极羽扇豆种子在冻土中休眠10000年后仍可萌发...',
    cost: 70, prerequisites: ['reproduce_wind', 'stem_tuber'], icon: '⏳',
    gameEffect: { stressSurvival: 0.5 } },
];
```

`src/ui/SeedEvolutionPanel.ts` — 树状图 UI：
- 全屏遮罩面板（参考 UpgradePanel 模式）
- 左侧显示四个器官标签（叶/茎/根/繁殖）
- 右侧显示对应器官的进化树（垂直树形布局）
- 每个节点显示：图标+名称+消耗因子+已进化状态
- 点击可进化节点→消耗因子→解锁
- CSS 绘制连线（用伪元素或 SVG）
- Z 键关闭

---

### Task 3: 种子对话界面改造 + 种子事件系统

**文件：**
- 创建: `src/ui/SeedDialoguePanel.ts` — 新种子对话面板
- 创建: `src/systems/SeedEventSystem.ts` — 种子事件系统
- 修改: `src/game/Game.ts` — 集成种子事件

**步骤：**

`SeedDialoguePanel.ts` 结构：
- 全屏遮罩，布局：上中下三区
- **顶部**：种子名称 + 成长阶段 + 资源显示
- **中部**：大号种子立绘（100px Emoji）
- **中下部**：对话气泡（打字机效果）
- **下部**：两行按钮
  - 第一行：左「选项模式」右「自由对话」（切换对话模式）
  - 第二行：左「升级」右「进化」（打开对应面板）
- 选项模式：显示 2-3 个选项按钮
- 自由对话模式：选项区变为输入框 + 发送按钮
- 模式切换时过渡动画

`SeedEventSystem.ts`：
- 类似 EventSystem 但固定在种子车厢触发
- `update(dt, playerX, playerY, seedX, seedY)` → 概率触发
- 触发时创建 EventMarker 显示在种子车厢上方
- 玩家靠近按 F 时：
  - 50% 概率触发对话事件 → 打开 SeedDialoguePanel 选项模式
  - 50% 概率触发迷你游戏事件 → 简单小游戏
- 对话事件使用科普 skill 数据生成 4-5 轮问答
- 小游戏事件：简单的反应测试/匹配游戏等

Game.ts 修改：
- 在 update 循环的种子相关区域插入种子事件检测
- F 键交互时增加种子事件判断（优先于普通事件）
- Z 键关闭加入 SeedDialoguePanel

---

### Task 4: AI 自由对话 + DeepSeek 集成

**文件：**
- 创建: `src/systems/AIService.ts` — DeepSeek API 客户端
- 修改: `src/ui/SeedDialoguePanel.ts` — 自由对话模式完整实现
- 修改: `src/config/api.ts` — 加 AI API URL/Key 配置

**步骤：**

`AIService.ts`：
```typescript
export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  async chat(messages: {role: string, content: string}[], context?: string): Promise<string> {
    const systemPrompt = `你是一颗具有 ${context || '开朗'} 性格的太空种子。...
    使用日常对话引导玩家了解植物进化知识，自然融入科普内容。...`;
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [...], temperature: 0.7 })
    });
    return res.json().choices[0].message.content;
  }
}
```

种子对话面板自由模式：
- 输入框接收玩家文字
- 发送后调用 AIService.chat()
- 响应以打字机效果显示
- 对话历史保存在会话中
- 引导科普的自然话术（如"好渴啊..."→ AI 回应深根系/肉质茎）

---

### Task 5: 整合进 Game.ts + main.ts

**文件：**
- 修改: `src/game/Game.ts` — 初始化新系统，更新循环
- 修改: `src/main.ts` — 如果需要

**步骤：**

初始化新对象：
```typescript
// 在 Game 构造函数中
this.evolutionResource = 0;
this.evolutionHUD = this.createHUD('evolution-hud', '进化因子: 0', { top:'60px', right:'20px' });
this.evolutionData = EVOLUTION_TREE;
this.evolvedNodes = new Set<string>();
this.seedEventSystem = new SeedEventSystem();
this.seedDialoguePanel = new SeedDialoguePanel(this.seedVisuals); // 传种子立绘
this.aiService = new AIService(aiApiKey);
```

更新循环修改点：
- 每帧调用 `this.seedEventSystem.update()`
- 检测种子事件触发器
- 打开对话面板或小游戏面板
- 武器上下文中传入 `addEvolutionResource`

进化效果应用到种子：
- 遍历已进化节点，累积 gameEffect
- 应用到 seed 属性（hp/maxHp 等）
- 应用到武器/玩家属性（如速度加成）
