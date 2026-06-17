---
name: game-editor-developer
description: Use when developing game features, adding configurable values, or managing game data - proactively creates editor modes and asks about tool integration
---

# 游戏编辑器开发 Skill

## 核心原则

在开发过程中，主动识别那些可以通过编辑器模式提升效率的功能点，询问用户是否需要整合到编辑器中。

## 触发条件

出现以下情况时，主动评估是否需要编辑器：

| 场景 | 示例 | 是否推荐编辑器 |
|---|---|---|
| 游戏数值需要频繁调整 | 武器伤害、升级费用、怪物属性 | ✅ |
| 物品/数据需要管理 | 道具列表、掉落表、商店物品 | ✅ |
| 坐标/位置需要配置 | 出生点、NPC 位置、事件触发区域 | ✅ |
| 配置项较多（5+ 个） | 游戏难度、生成参数、规则配置 | ✅ |
| 一次性硬编码也行的 | 仅用一次的常量、临时测试值 | ❌ |

## 编辑器集成模式

### 基本结构（用于数值编辑）

```html
<!-- 编辑器面板 HTML overlay -->
<div id="editor-panel" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999;">
  <div style="max-width:600px; margin:40px auto; background:#222; padding:20px; border-radius:8px; color:#fff;">
    <h2>编辑器标题</h2>
    <div id="editor-content"></div>
    <button onclick="closeEditor()">关闭</button>
  </div>
</div>
```

### 与游戏配置对接

直接从 `gameConfig.ts` 或配置对象中读取写入：

```typescript
// 编辑器读写配置项
function loadConfig() { /* 从 gameConfig 读取 */ }
function saveConfig() { /* 写回 gameConfig */ }
```

## 询问用户的模板

```
检测到 [功能名称] 涉及 [N] 个可配置项（[列举]），
可以考虑做一个编辑器面板来方便调整。
要整合进编辑器吗？
如果需要，你希望：
1. 简单的数值面板
2. 带可视化预览
3. 其他需求
```

## 常见编辑器类型

1. **数值配置编辑器**：调整武器参数、角色属性、费用等
2. **物品/掉落编辑器**：管理道具列表、掉落概率
3. **事件/对话编辑器**：配置事件触发条件、对话内容
4. **关卡/地图编辑器**：放置实体、设置坐标
5. **数据可视化面板**：实时显示游戏状态、调试信息
