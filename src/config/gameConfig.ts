/**
 * 游戏数值配置文件
 * 所有可调数值集中管理，编辑器通过此结构自动生成界面
 */
export interface ConfigMeta {
  key: string;
  category: string;
  object: string;
  label: string;
  defaultVal: number;
  min?: number;
  max?: number;
  step?: number;
}

export const GAME_CONFIG_META: ConfigMeta[] = [
  // ==================== 列车 ====================
  { key: 'train_speed', category: '列车', object: '移动', label: '前进速度', defaultVal: 0.3, min: 0, step: 0.05 },
  { key: 'train_hp', category: '列车', object: '生存', label: '当前 HP', defaultVal: 100, min: 0, step: 1 },
  { key: 'train_maxHp', category: '列车', object: '生存', label: '最大 HP', defaultVal: 100, min: 1, step: 10 },
  { key: 'train_carCount', category: '列车', object: '结构', label: '车厢数量', defaultVal: 5, min: 1, max: 10, step: 1 },
  { key: 'train_carSpacing', category: '列车', object: '结构', label: '车厢间距', defaultVal: 0.1, min: 0, step: 0.05 },
  { key: 'train_armorUpgradeHp', category: '列车', object: '升级', label: '装甲每级加 HP', defaultVal: 30, min: 0, step: 5 },
  { key: 'train_repairAmount', category: '列车', object: '升级', label: '维修回复 HP', defaultVal: 40, min: 0, step: 5 },
  { key: 'train_repairCost', category: '列车', object: '升级', label: '维修费用', defaultVal: 25, min: 0, step: 5 },

  // ==================== 玩家 ====================
  { key: 'player_hp', category: '玩家', object: '属性', label: 'HP', defaultVal: 100, min: 0, step: 10 },
  { key: 'player_speedBase', category: '玩家', object: '属性', label: '基础移速', defaultVal: 2, min: 0, step: 0.5 },
  { key: 'player_speedPerLv', category: '玩家', object: '升级', label: '速度每级增量', defaultVal: 0.5, min: 0, step: 0.1 },
  { key: 'player_speedBuffMultiplier', category: '玩家', object: 'Buff', label: '速度 Buff 倍率', defaultVal: 1.5, min: 1, step: 0.1 },
  { key: 'player_interactRange', category: '玩家', object: '交互', label: '交互检测半径', defaultVal: 4, min: 1, step: 0.5 },

  // ==================== 种子 ====================
  { key: 'seed_hp', category: '种子', object: '生存', label: '当前 HP', defaultVal: 50, min: 0, step: 5 },
  { key: 'seed_maxHp', category: '种子', object: '生存', label: '最大 HP', defaultVal: 50, min: 1, step: 10 },
  { key: 'seed_vitalityPerSecond', category: '种子', object: '产出', label: '活性产出率', defaultVal: 1, min: 0, step: 0.1 },
  { key: 'seed_dialogueCooldown', category: '种子', object: '对话', label: '对话冷却(秒)', defaultVal: 30, min: 0, step: 5 },
  { key: 'seed_aiDialogueCooldown', category: '种子', object: '对话', label: 'AI 对话冷却(秒)', defaultVal: 15, min: 0, step: 5 },
  { key: 'seed_dialogueCorrectRewardMin', category: '种子', object: '对话', label: '正确回答最小奖励', defaultVal: 50, min: 0, step: 10 },
  { key: 'seed_dialogueCorrectRewardMax', category: '种子', object: '对话', label: '正确回答最大奖励', defaultVal: 100, min: 0, step: 10 },
  { key: 'seed_dialogueWrongReward', category: '种子', object: '对话', label: '错误回答奖励', defaultVal: 15, min: 0, step: 5 },
  { key: 'seed_buffDuration', category: '种子', object: '对话', label: '对话 Buff 持续(秒)', defaultVal: 15, min: 0, step: 3 },

  // ==================== 安全区 ====================
  { key: 'safeZone_margin', category: '安全区', object: '边界', label: '安全区范围', defaultVal: 3, min: 0, step: 0.5 },
  { key: 'safeZone_countdown', category: '安全区', object: '倒计时', label: '倒计时秒数', defaultVal: 10, min: 1, step: 1 },
  { key: 'safeZone_damagePerTick', category: '安全区', object: '倒计时', label: '超时扣血/秒', defaultVal: 10, min: 0, step: 5 },
  { key: 'safeZone_timePerLv', category: '安全区', object: '升级', label: '每级加秒数', defaultVal: 5, min: 0, step: 1 },

  // ==================== 经济 ====================
  { key: 'eco_currency', category: '经济', object: '当前持有', label: '金币', defaultVal: 0, min: 0, step: 10 },
  { key: 'eco_vitality', category: '经济', object: '当前持有', label: '生命活性', defaultVal: 0, min: 0, step: 10 },
  { key: 'eco_asteroidReward', category: '经济', object: '产出', label: '陨石金币系数', defaultVal: 10, min: 0, step: 1 },

  // ==================== 陨石 ====================
  { key: 'asteroid_spawnInterval', category: '陨石', object: '生成', label: '生成间隔(秒)', defaultVal: 1.5, min: 0.1, step: 0.1 },
  { key: 'asteroid_radiusMin', category: '陨石', object: '生成', label: '最小半径', defaultVal: 0.3, min: 0.1, step: 0.1 },
  { key: 'asteroid_radiusMax', category: '陨石', object: '生成', label: '最大半径', defaultVal: 0.8, min: 0.1, step: 0.1 },
  { key: 'asteroid_speedXBase', category: '陨石', object: '移动', label: 'X 速度基数', defaultVal: -1, step: 0.5 },
  { key: 'asteroid_speedXRange', category: '陨石', object: '移动', label: 'X 速度随机范围', defaultVal: 2, min: 0, step: 0.5 },
  { key: 'asteroid_speedYRange', category: '陨石', object: '移动', label: 'Y 漂移范围', defaultVal: 0.5, min: 0, step: 0.1 },
  { key: 'asteroid_hpPerRadius', category: '陨石', object: '战斗', label: 'HP = 半径 × 系数', defaultVal: 20, min: 1, step: 5 },
  { key: 'asteroid_collisionDamage', category: '陨石', object: '战斗', label: '碰撞伤害系数', defaultVal: 8, min: 0, step: 1 },
  { key: 'asteroid_spawnYRange', category: '陨石', object: '生成', label: 'Y 散布范围', defaultVal: 35, min: 1, step: 1 },

  // ==================== 激光 ====================
  { key: 'laser_damage', category: '武器', object: '激光', label: '基础 DPS', defaultVal: 10, min: 0, step: 1 },
  { key: 'laser_damagePerLv', category: '武器', object: '激光', label: '每级 +DPS', defaultVal: 5, min: 0, step: 1 },
  { key: 'laser_range', category: '武器', object: '激光', label: '基础射程', defaultVal: 4, min: 0, step: 0.5 },
  { key: 'laser_rangePerLv', category: '武器', object: '激光', label: '每级 +射程', defaultVal: 1, min: 0, step: 0.5 },
  { key: 'laser_beamWidth', category: '武器', object: '激光', label: '光束宽度', defaultVal: 0.08, min: 0.01, step: 0.02 },
  { key: 'laser_upgradeCostBase', category: '武器', object: '激光', label: '升级基础费用', defaultVal: 20, min: 0, step: 5 },

  // ==================== 安魂曲 ====================
  { key: 'requiem_maxMagazine', category: '武器', object: '安魂曲', label: '弹夹容量', defaultVal: 6, min: 1, step: 1 },
  { key: 'requiem_reloadTime', category: '武器', object: '安魂曲', label: '换弹时间(秒)', defaultVal: 5, min: 0, step: 0.5 },
  { key: 'requiem_damage', category: '武器', object: '安魂曲', label: '单发伤害', defaultVal: 100, min: 0, step: 10 },
  { key: 'requiem_range', category: '武器', object: '安魂曲', label: '射程', defaultVal: 20, min: 1, step: 1 },
  { key: 'requiem_bulletSpeed', category: '武器', object: '安魂曲', label: '子弹速度', defaultVal: 66.67, min: 1, step: 5 },
  { key: 'requiem_fireInterval', category: '武器', object: '安魂曲', label: '射击间隔(秒)', defaultVal: 0.15, min: 0, step: 0.05 },

  // ==================== 导弹 ====================
  { key: 'missile_maxStock', category: '武器', object: '导弹', label: '最大库存', defaultVal: 1, min: 0, step: 1 },
  { key: 'missile_blastRadius', category: '武器', object: '导弹', label: '爆炸半径', defaultVal: 3.5, min: 0, step: 0.5 },
  { key: 'missile_aimTime', category: '武器', object: '导弹', label: '瞄准时间(秒)', defaultVal: 2.25, min: 0.1, step: 0.25 },
  { key: 'missile_restockInterval', category: '武器', object: '导弹', label: '补货间隔(秒)', defaultVal: 60, min: 0, step: 10 },
  { key: 'missile_blastPerLv', category: '武器', object: '导弹', label: '每级 +爆炸半径', defaultVal: 0.5, min: 0, step: 0.1 },
  { key: 'missile_aimPerLv', category: '武器', object: '导弹', label: '每级 -瞄准时间', defaultVal: 0.25, min: 0, step: 0.05 },

  // ==================== 吸盘枪 ====================
  { key: 'suction_coneLength', category: '武器', object: '吸盘枪', label: '锥体长度', defaultVal: 6, min: 1, step: 0.5 },
  { key: 'suction_captureDist', category: '武器', object: '吸盘枪', label: '捕获距离', defaultVal: 1, min: 0.1, step: 0.1 },
  { key: 'suction_maxFlight', category: '武器', object: '吸盘枪', label: '最大弹射距离', defaultVal: 15, min: 1, step: 1 },
  { key: 'suction_charge0_time', category: '武器', object: '吸盘枪', label: '蓄力0所需时间', defaultVal: 0.6, min: 0, step: 0.1 },
  { key: 'suction_charge0_budget', category: '武器', object: '吸盘枪', label: '蓄力0伤害预算', defaultVal: 30, min: 0, step: 5 },
  { key: 'suction_charge0_speed', category: '武器', object: '吸盘枪', label: '蓄力0发射速度', defaultVal: 5, min: 0, step: 1 },
  { key: 'suction_charge1_time', category: '武器', object: '吸盘枪', label: '蓄力1所需时间', defaultVal: 1.2, min: 0, step: 0.1 },
  { key: 'suction_charge1_budget', category: '武器', object: '吸盘枪', label: '蓄力1伤害预算', defaultVal: 50, min: 0, step: 5 },
  { key: 'suction_charge1_speed', category: '武器', object: '吸盘枪', label: '蓄力1发射速度', defaultVal: 8, min: 0, step: 1 },
  { key: 'suction_charge2_time', category: '武器', object: '吸盘枪', label: '蓄力2所需时间', defaultVal: 2, min: 0, step: 0.1 },
  { key: 'suction_charge2_budget', category: '武器', object: '吸盘枪', label: '蓄力2伤害预算', defaultVal: 80, min: 0, step: 5 },
  { key: 'suction_charge2_speed', category: '武器', object: '吸盘枪', label: '蓄力2发射速度', defaultVal: 12, min: 0, step: 1 },

  // ==================== 站点 ====================
  { key: 'station_interval', category: '站点', object: '出现', label: '出现间隔距离', defaultVal: 20, min: 1, step: 5 },
  { key: 'station_spawnAhead', category: '站点', object: '出现', label: '生成在列车前方', defaultVal: 12, min: 1, step: 1 },
  { key: 'station_triggerRadius', category: '站点', object: '交互', label: '触发面板半径', defaultVal: 3, min: 0.5, step: 0.5 },
  { key: 'station_vacuumRadius', category: '站点', object: '交互', label: '真空区半径', defaultVal: 4, min: 1, step: 0.5 },
  { key: 'station_yOffset', category: '站点', object: '出现', label: '航线侧方偏移基数', defaultVal: 5, min: 0, step: 1 },

  // ==================== 怪物 ====================
  { key: 'monster_spawnInterval', category: '怪物', object: '生成', label: '生成间隔基数', defaultVal: 8, min: 1, step: 0.5 },
  { key: 'monster_hp', category: '怪物', object: '属性', label: 'HP', defaultVal: 30, min: 1, step: 5 },
  { key: 'monster_speed', category: '怪物', object: '属性', label: '速度', defaultVal: 1.2, min: 0.1, step: 0.1 },
  { key: 'monster_damage', category: '怪物', object: '属性', label: '碰撞伤害', defaultVal: 8, min: 0, step: 1 },
  { key: 'monster_spawnYRange', category: '怪物', object: '生成', label: 'Y 散布范围', defaultVal: 20, min: 1, step: 1 },
  { key: 'monster_killReward', category: '怪物', object: '奖励', label: '击杀金币', defaultVal: 25, min: 0, step: 5 },

  // ==================== 陨石分阶 ====================
  { key: 'tier_normalChance', category: '陨石分阶', object: '概率', label: '普通权重', defaultVal: 0.6, min: 0, max: 1, step: 0.05 },
  { key: 'tier_reinforcedChance', category: '陨石分阶', object: '概率', label: '强化权重', defaultVal: 0.25, min: 0, max: 1, step: 0.05 },
  { key: 'tier_eliteChance', category: '陨石分阶', object: '概率', label: '精英权重', defaultVal: 0.1, min: 0, max: 1, step: 0.05 },
  { key: 'tier_goldenChance', category: '陨石分阶', object: '概率', label: '黄金权重', defaultVal: 0.03, min: 0, max: 1, step: 0.01 },
  { key: 'tier_shieldChance', category: '陨石分阶', object: '概率', label: '盾牌权重', defaultVal: 0.02, min: 0, max: 1, step: 0.01 },
  { key: 'tier_dropChance', category: '陨石分阶', object: '掉落', label: '普通掉落概率', defaultVal: 0.03, min: 0, max: 1, step: 0.01 },

  // ==================== HUD ====================
  { key: 'hud_notificationDuration', category: 'HUD', object: '掉落提示', label: '显示时长(秒)', defaultVal: 1.5, min: 0.5, step: 0.1 },

  // ==================== 事件 ====================
  { key: 'event_intervalBase', category: '事件', object: '出现', label: '间隔基数', defaultVal: 15, min: 1, step: 5 },
  { key: 'event_intervalRandom', category: '事件', object: '出现', label: '间隔随机范围', defaultVal: 15, min: 0, step: 5 },
  { key: 'event_xOffset', category: '事件', object: '出现', label: '玩家前方偏移', defaultVal: 10, min: 0, step: 1 },
  { key: 'event_yOffsetBase', category: '事件', object: '出现', label: 'Y 偏移基数', defaultVal: 5, min: 0, step: 1 },
  { key: 'event_yOffsetRandom', category: '事件', object: '出现', label: 'Y 偏移随机范围', defaultVal: 4, min: 0, step: 1 },
  { key: 'event_triggerDist', category: '事件', object: '交互', label: '触发距离', defaultVal: 3.5, min: 0.5, step: 0.5 },
  { key: 'event_rewardMin', category: '事件', object: '奖励', label: '最小金币奖励', defaultVal: 60, min: 0, step: 10 },
  { key: 'event_rewardMax', category: '事件', object: '奖励', label: '最大金币奖励', defaultVal: 90, min: 0, step: 10 },
  { key: 'event_vitalityMin', category: '事件', object: '奖励', label: '最小活性奖励', defaultVal: 40, min: 0, step: 10 },
  { key: 'event_vitalityMax', category: '事件', object: '奖励', label: '最大活性奖励', defaultVal: 80, min: 0, step: 10 },

  // ==================== 升级费用 ====================
  { key: 'upgrade_laserDamageCost', category: '升级费用', object: '激光', label: '伤害初始费用', defaultVal: 20, min: 0, step: 5 },
  { key: 'upgrade_laserRangeCost', category: '升级费用', object: '激光', label: '射程初始费用', defaultVal: 15, min: 0, step: 5 },
  { key: 'upgrade_playerSpeedCost', category: '升级费用', object: '玩家', label: '速度初始费用', defaultVal: 10, min: 0, step: 5 },
  { key: 'upgrade_safeTimeCost', category: '升级费用', object: '安全区', label: '活动时间初始费用', defaultVal: 25, min: 0, step: 5 },
  { key: 'upgrade_missileStockCost', category: '升级费用', object: '导弹', label: '库存初始费用', defaultVal: 30, min: 0, step: 5 },
  { key: 'upgrade_missileBlastCost', category: '升级费用', object: '导弹', label: '范围初始费用', defaultVal: 25, min: 0, step: 5 },
  { key: 'upgrade_missileAimCost', category: '升级费用', object: '导弹', label: '瞄准初始费用', defaultVal: 20, min: 0, step: 5 },
  { key: 'upgrade_trainArmorCost', category: '升级费用', object: '列车', label: '装甲初始费用', defaultVal: 40, min: 0, step: 5 },
  { key: 'upgrade_maxLevel', category: '升级费用', object: '通用', label: '最大等级', defaultVal: 5, min: 1, max: 10, step: 1 },

  // ==================== 渲染 ====================
  { key: 'render_ambientLight', category: '渲染', object: '灯光', label: '环境光强度', defaultVal: 0.55, min: 0, max: 1, step: 0.05 },
  { key: 'render_directionalLight', category: '渲染', object: '灯光', label: '主方向光强度', defaultVal: 0.85, min: 0, max: 1, step: 0.05 },
  { key: 'render_fillLight', category: '渲染', object: '灯光', label: '补光强度', defaultVal: 0.3, min: 0, max: 1, step: 0.05 },
  { key: 'render_outlineThickness', category: '渲染', object: '描边', label: '默认描边厚度', defaultVal: 0.06, min: 0, step: 0.01 },
  { key: 'render_outlineOpacity', category: '渲染', object: '描边', label: '描边透明度', defaultVal: 0.85, min: 0, max: 1, step: 0.05 },
  { key: 'camera_height', category: '渲染', object: '摄像机', label: '相机高度', defaultVal: 10, min: 1, step: 1 },
  { key: 'camera_behind', category: '渲染', object: '摄像机', label: '相机后方偏移', defaultVal: 8, min: 0, step: 1 },
  { key: 'camera_fov', category: '渲染', object: '摄像机', label: '视场角', defaultVal: 65, min: 10, max: 179, step: 5 },
  { key: 'camera_shakeDecay', category: '渲染', object: '摄像机', label: '震屏衰减', defaultVal: 0.85, min: 0, max: 1, step: 0.05 },

  // ==================== 背包 ====================
  { key: 'inventory_maxSlots', category: '背包', object: '容量', label: '最大格数', defaultVal: 16, min: 1, step: 1 },
  { key: 'item_stardustReward', category: '背包', object: '星尘', label: '使用获得金币', defaultVal: 50, min: 0, step: 10 },
  { key: 'item_crystalDuration', category: '背包', object: '能量水晶', label: 'Buff 持续(秒)', defaultVal: 8, min: 0, step: 1 },
  { key: 'item_lifeDewHeal', category: '背包', object: '生命甘露', label: '种子回血量', defaultVal: 20, min: 0, step: 5 },
];
