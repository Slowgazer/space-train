/** 物品稀有度 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** 物品定义 */
export interface ItemDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: string;
  stackable: boolean;
  maxStack: number;
  usable: boolean;
}

/** 物品实例（带数量） */
export interface ItemStack {
  def: ItemDef;
  count: number;
}

/** 预设物品表 */
export const ITEMS: Record<string, ItemDef> = {
  stardust: {
    id: 'stardust', name: '星尘', description: '蕴藏宇宙能量的星尘颗粒',
    rarity: 'common', icon: '✨', stackable: true, maxStack: 99, usable: true,
  },
  energy_crystal: {
    id: 'energy_crystal', name: '能量水晶', description: '使用后 8 秒内移速 ×1.5 且免疫伤害',
    rarity: 'rare', icon: '🔮', stackable: true, maxStack: 5, usable: true,
  },
  life_dew: {
    id: 'life_dew', name: '生命甘露', description: '种子 HP +20',
    rarity: 'rare', icon: '💧', stackable: true, maxStack: 10, usable: true,
  },
  core_shard: {
    id: 'core_shard', name: '星核碎片', description: '星球核心的碎片，可用于合成',
    rarity: 'rare', icon: '💎', stackable: true, maxStack: 20, usable: false,
  },
  soul_petal: {
    id: 'soul_petal', name: '灵魂花瓣', description: '用于种子进化',
    rarity: 'epic', icon: '🌸', stackable: true, maxStack: 5, usable: false,
  },
  ancient_seed: {
    id: 'ancient_seed', name: '古老种子', description: '解锁专属 AI 对话内容',
    rarity: 'legendary', icon: '🌟', stackable: false, maxStack: 1, usable: true,
  },
};

/**
 * 背包系统
 */
export class InventorySystem {
  private slots: (ItemStack | null)[] = [];
  private maxSlots = 16;

  constructor(maxSlots = 16) {
    this.maxSlots = maxSlots;
    this.slots = new Array(maxSlots).fill(null);
  }

  getSlots(): (ItemStack | null)[] {
    return this.slots;
  }

  /** 添加物品，返回是否成功 */
  addItem(id: string, count = 1): boolean {
    const def = ITEMS[id];
    if (!def) return false;

    let remaining = count;

    // 先尝试堆叠到已有同物品槽
    if (def.stackable) {
      for (const slot of this.slots) {
        if (slot && slot.def.id === id && slot.count < def.maxStack) {
          const canAdd = Math.min(remaining, def.maxStack - slot.count);
          slot.count += canAdd;
          remaining -= canAdd;
          if (remaining <= 0) return true;
        }
      }
    }

    // 找空格
    while (remaining > 0) {
      const emptyIdx = this.slots.indexOf(null);
      if (emptyIdx === -1) return false; // 背包满

      const addNow = def.stackable ? Math.min(remaining, def.maxStack) : 1;
      this.slots[emptyIdx] = { def, count: addNow };
      remaining -= addNow;
    }

    return true;
  }

  /** 使用物品，返回是否成功 */
  useItem(id: string, game: any): boolean {
    const idx = this.slots.findIndex(s => s && s.def.id === id && s.count > 0);
    if (idx === -1) return false;

    const stack = this.slots[idx]!;
    if (!stack.def.usable) return false;

    // 应用效果
    switch (id) {
      case 'stardust':
        game.addCurrency(50, 0, 0);
        break;
      case 'energy_crystal':
        game.speedBuffTimer = Math.min((game.speedBuffTimer || 0) + 8, 24);
        game.invincibleTimer = Math.min((game.invincibleTimer || 0) + 8, 24);
        break;
      case 'life_dew':
        game.seed.hp = Math.min(game.seed.hp + 20, game.seed.maxHp);
        break;
      case 'ancient_seed':
        // 解锁 AI 对话（标记）
        game.aiDialogueUnlocked = true;
        break;
    }

    stack.count--;
    if (stack.count <= 0) {
      this.slots[idx] = null;
    }

    return true;
  }

  /** 移除物品 */
  removeItem(id: string, count = 1): boolean {
    let remaining = count;
    for (let i = this.slots.length - 1; i >= 0; i--) {
      const s = this.slots[i];
      if (s && s.def.id === id) {
        const remove = Math.min(remaining, s.count);
        s.count -= remove;
        remaining -= remove;
        if (s.count <= 0) this.slots[i] = null;
        if (remaining <= 0) return true;
      }
    }
    return false;
  }

  /** 是否有指定物品 */
  hasItem(id: string, count = 1): boolean {
    let total = 0;
    for (const s of this.slots) {
      if (s && s.def.id === id) total += s.count;
    }
    return total >= count;
  }

  /** 清空 */
  clear(): void {
    this.slots = new Array(this.maxSlots).fill(null);
  }
}
