/** 种子进化树节点定义 */

export interface EvolutionNode {
  id: string;
  name: string;
  organ: 'leaf' | 'stem' | 'root' | 'reproduce';
  description: string;
  scienceDesc: string;
  cost: number;
  prerequisites: string[];
  icon: string;
}

export const EVOLUTION_TREE: EvolutionNode[] = [
  // ── 叶片路线 ──
  {
    id: 'leaf_basic', name: '基础叶片', organ: 'leaf',
    description: '光合效率 +10%',
    scienceDesc: '叶片是植物最主要的能量来源器官。叶绿体将光能转化为化学能，为植物提供生长所需的全部能量。',
    cost: 0, prerequisites: [], icon: '🌿',
  },
  {
    id: 'leaf_needle', name: '针状叶', organ: 'leaf',
    description: '耐旱度 +20%',
    scienceDesc: '仙人掌、松树等植物进化出针状叶以减少蒸腾面积。松树叶面积仅为同等重量阔叶的1/10，蒸腾作用降低90%以上。',
    cost: 30, prerequisites: ['leaf_basic'], icon: '🌵',
  },
  {
    id: 'leaf_wide', name: '宽大叶片', organ: 'leaf',
    description: '光合效率 +30%',
    scienceDesc: '热带雨林阴生植物增大叶片面积捕获散射光。龟背竹单片叶面积可达1平方米，最大程度捕获仅占全光照1-5%的林下散射光。',
    cost: 30, prerequisites: ['leaf_basic'], icon: '🌴',
  },
  {
    id: 'leaf_wax', name: '蜡质层', organ: 'leaf',
    description: '耐旱度 +15%',
    scienceDesc: '龙舌兰叶表蜡质层可反射30%以上太阳辐射，降低叶面温度5-8°C。沙漠植物蜡质层厚度可达普通植物的10倍。',
    cost: 40, prerequisites: ['leaf_needle'], icon: '✨',
  },
  {
    id: 'leaf_c4', name: 'C4光合路径', organ: 'leaf',
    description: '高温光合效率 +50%',
    scienceDesc: '玉米、甘蔗等C4植物进化出CO₂浓缩泵。叶肉细胞将CO₂固定为4碳化合物转运到维管束鞘，使Rubisco周围CO₂浓度提高10倍。',
    cost: 60, prerequisites: ['leaf_wide'], icon: '🌽',
  },

  // ── 茎路线 ──
  {
    id: 'stem_basic', name: '基础茎干', organ: 'stem',
    description: '支撑强度 +10%',
    scienceDesc: '茎干是植物的支撑结构，内部维管束负责输送水分和养分。木质部向上输水，韧皮部向下输送光合产物。',
    cost: 0, prerequisites: [], icon: '🌱',
  },
  {
    id: 'stem_creeper', name: '匍匐茎', organ: 'stem',
    description: '领地扩散 +20%',
    scienceDesc: '草莓的匍匐茎每5-10cm长出一个新植株，一株母株一个生长季可产生30-50株子株。这种无性繁殖策略风险低、效率高。',
    cost: 30, prerequisites: ['stem_basic'], icon: '🍓',
  },
  {
    id: 'stem_climber', name: '攀援茎', organ: 'stem',
    description: '生长速度 +30%',
    scienceDesc: '牵牛花茎生长速度可达每天5-10cm。攀援植物通过卷须、不定根缠绕攀爬，节省了构建支撑组织的能量。',
    cost: 30, prerequisites: ['stem_basic'], icon: '🌺',
  },
  {
    id: 'stem_tuber', name: '块茎储存', organ: 'stem',
    description: '抗逆性 +25%',
    scienceDesc: '土豆的块茎是地下茎变态组织，薄壁细胞中充满淀粉粒，含量可达15-25%。洋葱的球茎由肉质叶鞘层层包裹。',
    cost: 40, prerequisites: ['stem_creeper'], icon: '🥔',
  },
  {
    id: 'stem_tendril', name: '卷须触性', organ: 'stem',
    description: '攀援稳定性 +30%',
    scienceDesc: '丝瓜卷须接触物体后20-30秒内开始卷曲，数小时内完成缠绕。源于细胞膨压变化——接触侧失水收缩，另一侧吸水膨胀。',
    cost: 40, prerequisites: ['stem_climber'], icon: '🥒',
  },

  // ── 根路线 ──
  {
    id: 'root_basic', name: '基础根系', organ: 'root',
    description: '吸收效率 +10%',
    scienceDesc: '根系从土壤中吸收水分和矿质元素。根尖的根毛区大大增加了吸收表面积，一株黑麦的根毛总长度可达10000公里。',
    cost: 0, prerequisites: [], icon: '🌰',
  },
  {
    id: 'root_deep', name: '深根系', organ: 'root',
    description: '耐旱度 +30%',
    scienceDesc: '骆驼刺根系可达地下15-30米，是地上部分的10倍以上。梭梭根系水平扩展30米，立体化捕获降水。',
    cost: 35, prerequisites: ['root_basic'], icon: '🏜️',
  },
  {
    id: 'root_mycorrhiza', name: '菌根共生', organ: 'root',
    description: '营养吸收效率 +40%',
    scienceDesc: '95%以上陆生植物与真菌形成菌根共生。菌丝网络延伸到根系无法到达的土壤微孔中。树木间通过菌根网络传递碳、氮甚至预警信号。',
    cost: 45, prerequisites: ['root_basic'], icon: '🍄',
  },

  // ── 繁殖路线 ──
  {
    id: 'reproduce_basic', name: '基础繁殖', organ: 'reproduce',
    description: '繁殖效率 +10%',
    scienceDesc: '植物的繁殖策略直接决定种群延续。从孢子到种子，从无性到有性，植物进化出了极其多样的繁殖方式。',
    cost: 0, prerequisites: [], icon: '🌻',
  },
  {
    id: 'reproduce_wind', name: '风媒传粉', organ: 'reproduce',
    description: '繁殖范围 +30%',
    scienceDesc: '一株玉米可产生5000万粒花粉随风扩散数百公里。松树花粉粒有气囊结构适应风力传播，但99.99%的花粉不会到达目标柱头。',
    cost: 30, prerequisites: ['reproduce_basic'], icon: '🌾',
  },
  {
    id: 'reproduce_insect', name: '虫媒传粉', organ: 'reproduce',
    description: '繁殖效率 +30%',
    scienceDesc: '油菜花花粉表面有黏性物质附着蜜蜂体表。兰花进化出精密传粉结构——某些兰花花型可模拟雌蜂诱导雄蜂交配传粉。',
    cost: 35, prerequisites: ['reproduce_basic'], icon: '🐝',
  },
  {
    id: 'reproduce_explode', name: '弹射传播', organ: 'reproduce',
    description: '领地扩散 +20%',
    scienceDesc: '凤仙花果实5片果瓣瞬间螺旋卷曲，种子以10m/s速度弹射至2-5米外。利用纤维层干燥过程的应力累积类似弹簧储能。',
    cost: 30, prerequisites: ['reproduce_basic'], icon: '💥',
  },

  // ── 高级进化（跨路线）──
  {
    id: 'cam_photosynth', name: 'CAM光合', organ: 'leaf',
    description: '干旱光合效率 +80%',
    scienceDesc: '仙人掌夜间开气孔吸收CO₂以苹果酸形式储存于液泡；白天关闭气孔释放CO₂进行光合。水分利用效率达C3植物的10倍。',
    cost: 80, prerequisites: ['leaf_wax', 'stem_tuber'], icon: '🌙',
  },
  {
    id: 'seed_dormancy', name: '种子休眠', organ: 'reproduce',
    description: '逆境存活率 +50%',
    scienceDesc: '北极羽扇豆种子在冻土中休眠10000年后仍可萌发。由脱落酸/赤霉素比例、种皮透性和萌发抑制物共同调控。',
    cost: 70, prerequisites: ['reproduce_wind', 'stem_tuber'], icon: '⏳',
  },
];

export function getNodeById(id: string): EvolutionNode | undefined {
  return EVOLUTION_TREE.find(n => n.id === id);
}

export function getNodesByOrgan(organ: string): EvolutionNode[] {
  return EVOLUTION_TREE.filter(n => n.organ === organ);
}

export const ORGAN_INFO: Record<string, { name: string; icon: string; desc: string }> = {
  leaf: { name: '叶片', icon: '🌿', desc: '光合作用与能量获取' },
  stem: { name: '茎干', icon: '🌱', desc: '支撑、运输与储存' },
  root: { name: '根系', icon: '🌰', desc: '吸收水分与矿物质' },
  reproduce: { name: '繁殖', icon: '🌻', desc: '传播与种群延续' },
};
