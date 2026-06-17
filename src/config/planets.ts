/** 星球类型 */
export interface PlanetDef {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  color: string;
  accentColor: string;
  description: string;
  buff: string;
  apply: (game: any) => void;
}

/** 所有可用星球 */
export const PLANETS: PlanetDef[] = [
  {
    id: 'water',
    name: '水之星 · 澜',
    subtitle: '柔韧滋养',
    emoji: '💧',
    color: '#4fc3f7',
    accentColor: '#0288d1',
    description: '被温暖洋流包裹的蓝色星球。种子在此汲取水的滋养，根系柔韧而顽强。',
    buff: '生命活性产出 +20%',
    apply: (game) => { game.vitalityPerSecond *= 1.2; },
  },
  {
    id: 'fire',
    name: '火之星 · 烬',
    subtitle: '力量爆发',
    emoji: '🔥',
    color: '#ff5252',
    accentColor: '#d32f2f',
    description: '地核涌动着炽热熔岩，空气中充满硫磺与力量。种子在此淬炼坚韧。',
    buff: '武器伤害 +15%',
    apply: (game) => {
      const w = game.weapons[0] as any;
      if (w && typeof w.damage === 'number') {
        w.damage *= 1.15;
      }
    },
  },
  {
    id: 'forest',
    name: '森之星 · 栖',
    subtitle: '坚韧守护',
    emoji: '🌿',
    color: '#69f0ae',
    accentColor: '#2e7d32',
    description: '远古巨树覆盖整个星球表面，空气中弥漫着生命力。种子在此学会守护。',
    buff: '列车 HP +30，安全区扩 +15%',
    apply: (game) => {
      game.safeZone.margin *= 1.15;
    },
  },
  {
    id: 'light',
    name: '光之星 · 辉',
    subtitle: '均衡协调',
    emoji: '✨',
    color: '#ffd740',
    accentColor: '#ff8f00',
    description: '永昼之星，光芒从核心透出，照亮每一寸土地。种子在此找到平衡。',
    buff: '所有属性 +8%',
    apply: (game) => {
      game.vitalityPerSecond *= 1.08;
      game.playerHP = Math.min(game.playerHP * 1.08, 200);
    },
  },
  {
    id: 'void',
    name: '暗之星 · 寂',
    subtitle: '隐秘专注',
    emoji: '🌌',
    color: '#b39ddb',
    accentColor: '#6a1b9a',
    description: '寂静的黑暗星球，星光在这里变得微弱。种子在此学会内省与专注。',
    buff: '对话冷却 -40%，buff 持续时间 ×1.5',
    apply: (game) => {
      Object.defineProperty(game.dialogueSystem, 'COOLDOWN_TIME', { value: 18 });
    },
  },
];

/** 每次抉择随机选取的星球数量 */
export const PLANETS_PER_CHOICE = 3;

/** 抉择触发的航行距离间隔 */
export const PLANET_CHOICE_DISTANCE = 20;
