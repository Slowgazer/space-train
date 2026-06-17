/**
 * AI 自由对话服务
 * 使用 DeepSeek API 驱动种子的自由对话（需配置 API key）
 * 无 API key 时自动降级为本地规则回复
 */

// 改为 let，允许运行时设置
let apiKey = '';
let apiConfigured = false;

export function configureAI(key: string): void {
  apiKey = key;
  apiConfigured = !!key;
}

export const AI_SERVICE = {
  get configured(): boolean { return apiConfigured; },

  /** 向 DeepSeek 发送对话请求 */
  async chat(
    history: { role: string; content: string }[],
    stage: string,
  ): Promise<string> {
    if (apiConfigured && apiKey) {
      try {
        return await this._callDeepSeek(history, stage);
      } catch (e) {
        console.warn('[AI] DeepSeek 调用失败，降级到本地回复:', e);
        return this._localFallback(history);
      }
    }
    return this._localFallback(history);
  },

  async _callDeepSeek(
    history: { role: string; content: string }[],
    stage: string,
  ): Promise<string> {
    const systemPrompt = `你是一颗在太空旅行的神奇种子，性格开朗好奇，处于"${stage}"阶段。
你的使命是和玩家做朋友，用日常聊天的方式自然地科普植物进化知识。

规则：
- 用第一人称，语气亲切自然，像朋友聊天
- 每次回复 1-3 句话，不要长篇大论
- 把植物学知识融入日常话题（比如：渴了→聊储水；冷了→聊抗寒）
- 如果玩家问了严肃问题，认真回答
- 如果玩家开玩笑，可以配合开玩笑
- 可以偶尔反问玩家，让对话继续
- 不要生硬地"上课"，让知识自然流露
- 如果不知道答案，就承认不知道，别编造

参考知识：
- 针状叶减少蒸腾（仙人掌、松树）
- 蜡质层反射强光（龙舌兰）
- 肉质茎储水（仙人掌）
- 深根系找水（骆驼刺可达30米）
- 宽大叶片增加光合（龟背竹）
- C4光合减少光呼吸（玉米）
- CAM光合夜间固碳（仙人掌）
- 匍匐茎克隆繁殖（草莓）
- 攀援茎借力生长（牵牛花）
- 块茎储存养分（土豆）
- 风媒花大量花粉（玉米5000万粒/株）
- 虫媒花精准传粉（兰花拟雌蜂）
- 弹射传播速度10m/s（凤仙花）
- 菌根共生90%植物都有
- 种子休眠可长达万年`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // 只保留最近10轮
    ];

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '……（陷入沉思）';
  },

  /** 本地降级回复 */
  _localFallback(history: { role: string; content: string }[]): string {
    const lastMsg = history[history.length - 1]?.content || '';
    const lower = lastMsg.toLowerCase();

    if (lower.includes('水') || lower.includes('渴') || lower.includes('干')) {
      return '说起来，在沙漠里有些植物的根能长到30米深找水呢！我们要是也能进化出那样的根系就好了…';
    }
    if (lower.includes('冷') || lower.includes('冻') || lower.includes('寒')) {
      return '唔，冷的话可以学松树，针一样的叶子能减少热量散失，在零下几十度都能活下来哦！';
    }
    if (lower.includes('热') || lower.includes('晒') || lower.includes('太阳')) {
      return '要是太晒了，像龙舌兰那样给自己上一层蜡质外衣就能反射阳光啦，还能减少水分蒸发！';
    }
    if (lower.includes('风') || lower.includes('飞') || lower.includes('远')) {
      return '你知道吗？一株玉米能产生5000万粒花粉，就靠风把它们带到远方。虽然99.99%都会浪费掉……';
    }
    if (lower.includes('种子') || lower.includes('宝宝') || lower.includes('孩子')) {
      return '有些种子能休眠上万年还在等合适的时机发芽呢！比如北极羽扇豆，在冻土里睡了一万年…';
    }
    if (lower.includes('朋友') || lower.includes('孤独') || lower.includes('寂寞')) {
      return '有你在身边我就不孤独啦！而且你知道吗？植物之间也会通过菌根网络互相传递消息哦~';
    }
    if (lower.includes('吃') || lower.includes('饿')) {
      return '我们植物不用"吃"啦，有阳光和水就能做光合作用！不过要是光线不够，就得像龟背竹一样长大大的叶子~';
    }

    const generic = [
      '嗯…说起来，草莓其实是一个巨大的克隆体家族！它们用匍匐茎不停地复制自己，漫山遍野都是兄弟姐妹。',
      '你知道吗，凤仙花弹射种子的速度能达到每秒10米，比很多动物跑得还快！',
      '兰花为了吸引特定的昆虫传粉，有些花朵甚至进化成了雌蜂的样子……大自然太有想象力了。',
      '如果有一天我们也能像攀援植物一样，借助列车的力量快速生长就好了~牵牛花一天能长5-10厘米呢！',
      '土豆看起来普通，但它的块茎能储存大量淀粉当"粮食"，就算遇到恶劣环境也能活下去。',
    ];
    return generic[Math.floor(Math.random() * generic.length)];
  },
};
