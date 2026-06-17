import { BuffType, Personality } from './DialogueSystem';
import { GrowthStage } from '../entities/SeedVisuals';

/** AI 对话响应模板 */
interface AIResponse {
  text: string;
  buffType: BuffType;
  reward: number;
}

/** 关键词 → 响应模板映射 */
interface KeywordEntry {
  keywords: string[];
  responses: AIResponse[];
}

/** 成长阶段影响对话风格 */
const STAGE_CONTEXT: Record<GrowthStage, string> = {
  [GrowthStage.SPROUT]: '种子刚苏醒，充满好奇和不安',
  [GrowthStage.GROWING]: '种子开始生长，对世界充满探索欲',
  [GrowthStage.BLOOMING]: '种子枝繁叶茂，充满自信和活力',
  [GrowthStage.FLOWERING]: '种子开出花朵，满怀期待和希望',
  [GrowthStage.FRUITING]: '种子即将结果，显得沉稳而睿智',
};

/** 性格提示词 */
const PERSONALITY_STYLE: Record<Personality, string> = {
  [Personality.CHEERFUL]: '语气开朗活泼，喜欢用感叹号和表情',
  [Personality.MELANCHOLY]: '语气温柔略带忧伤，喜欢用省略号',
  [Personality.TSUNDERE]: '语气傲娇，嘴上不承认其实很关心',
  [Personality.SILENT]: '话很少，但每句都很精炼有深意',
};

/** 关键词模板库（按科普主题分类） */
const KEYWORD_TEMPLATES: KeywordEntry[] = [
  {
    keywords: ['生命', '活着', '存在', '意义'],
    responses: [
      { text: '妈妈说，生命的意义不是找到答案，而是体验整个过程。', buffType: BuffType.SPEED, reward: 30 },
      { text: '你知道一棵树每天要呼吸多少空气吗？我们每个人都是一个小小的生态系统。', buffType: BuffType.DAMAGE, reward: 30 },
    ],
  },
  {
    keywords: ['星星', '宇宙', '太空', '星系'],
    responses: [
      { text: '我们身体里的每一个原子，都来自一颗爆炸的恒星。我们就是星辰的孩子。', buffType: BuffType.SPEED, reward: 40 },
      { text: '宇宙有上千亿个星系，每个星系有上千亿颗恒星。而我们在这里相遇……多幸运啊。', buffType: BuffType.NONE, reward: 50 },
    ],
  },
  {
    keywords: ['家', '归宿', '家乡', '回家'],
    responses: [
      { text: '地球是生命的摇篮，但生命不能永远待在摇篮里。我们要找到新的家。', buffType: BuffType.SPEED, reward: 35 },
      { text: '家不是一个地方，而是有人等你的地方。有你在，哪里都是家。', buffType: BuffType.DAMAGE, reward: 35 },
    ],
  },
  {
    keywords: ['种子', '生长', '发芽', '植物'],
    responses: [
      { text: '一粒种子可以长成参天大树，一个人的梦想也是。', buffType: BuffType.SPEED, reward: 30 },
      { text: '我在努力长大！你看我是不是比昨天高了一点点？', buffType: BuffType.NONE, reward: 25 },
    ],
  },
  {
    keywords: ['害怕', '担心', '危险', '困难', '怕'],
    responses: [
      { text: '害怕说明我们懂得珍惜。没关系，我们一起面对。', buffType: BuffType.DAMAGE, reward: 35 },
      { text: '星光之所以美丽，是因为它穿越了亿万年的黑暗才到达我们眼里。', buffType: BuffType.SPEED, reward: 40 },
    ],
  },
  {
    keywords: ['谢谢', '感谢', '感恩'],
    responses: [
      { text: '应该是我谢谢你才对。没有你，我可能早就消失在宇宙里了。', buffType: BuffType.DAMAGE, reward: 50 },
      { text: '你是我见过最温柔的守护者。', buffType: BuffType.SPEED, reward: 50 },
    ],
  },
  {
    keywords: ['陨石', '敌人', '危险', '战斗'],
    responses: [
      { text: '那些陨石只是迷路的孩子。不过它们撞人确实很疼……小心点！', buffType: BuffType.NONE, reward: 20 },
      { text: '每次你击碎陨石的时候，我都感觉你超帅！', buffType: BuffType.DAMAGE, reward: 30 },
    ],
  },
];

/** 通用安慰响应（无关键词匹配时使用） */
const FALLBACK_RESPONSES: AIResponse[] = [
  { text: '嗯……我不太明白你的意思，但我相信你。', buffType: BuffType.NONE, reward: 15 },
  { text: '你说什么都好，有你在我就安心。', buffType: BuffType.SPEED, reward: 15 },
  { text: '我好像还不太懂，你能换个说法吗？', buffType: BuffType.NONE, reward: 10 },
  { text: '宇宙那么大，能遇见你真好。', buffType: BuffType.NONE, reward: 20 },
];

/**
 * AI 对话系统（本地关键词匹配）
 * 在固定对话用尽后启用，根据关键词 + 性格 + 成长阶段生成响应
 */
export class AIDialogueSystem {
  private personality: Personality;
  private stage: GrowthStage;
  private usedIndices = new Set<string>();
  private coolDown = 0;
  private readonly COOLDOWN_TIME = 15;
  private fallbackCycle = 0;

  constructor(personality: Personality, stage: GrowthStage = GrowthStage.SPROUT) {
    this.personality = personality;
    this.stage = stage;
  }

  get canTalk(): boolean {
    return this.coolDown <= 0;
  }

  get coolDownLeft(): number {
    return Math.ceil(this.coolDown);
  }

  /** 更新成长阶段 */
  setStage(stage: GrowthStage): void {
    this.stage = stage;
  }

  /** 生成 AI 响应 */
  generate(keywords: string[]): AIResponse {
    this.coolDown = this.COOLDOWN_TIME;

    // 尝试关键词匹配
    for (const entry of KEYWORD_TEMPLATES) {
      const match = keywords.some(k =>
        entry.keywords.some(ek => k.includes(ek) || ek.includes(k)),
      );
      if (!match) continue;

      // 从未使用的响应中选一个
      const available = entry.responses.filter(
        (_, i) => !this.usedIndices.has(`kw_${entry.keywords[0]}_${i}`),
      );
      if (available.length > 0) {
        const idx = Math.floor(Math.random() * available.length);
        this.usedIndices.add(`kw_${entry.keywords[0]}_${idx}`);
        return this.decorate(available[idx]);
      }
    }

    // 保底：循环使用 fallback
    const fb = FALLBACK_RESPONSES[this.fallbackCycle % FALLBACK_RESPONSES.length];
    this.fallbackCycle++;
    return this.decorate(fb);
  }

  /** 根据性格和成长阶段润色响应文本 */
  private decorate(response: AIResponse): AIResponse {
    const style = PERSONALITY_STYLE[this.personality] || '';
    const stage = STAGE_CONTEXT[this.stage] || '';

    // 简单的性格装饰
    let text = response.text;
    switch (this.personality) {
      case Personality.CHEERFUL:
        text = text.replace(/[。！]/g, '！').replace(/？/g, '？');
        text += ' ✨';
        break;
      case Personality.MELANCHOLY:
        text = text.replace(/[！]/g, '。') + '……';
        break;
      case Personality.TSUNDERE:
        text = '哼、' + text;
        break;
      case Personality.SILENT:
        text = '（沉默片刻）' + text;
        break;
    }

    return { ...response, text };
  }

  update(dt: number): void {
    if (this.coolDown > 0) {
      this.coolDown -= dt;
    }
  }
}
