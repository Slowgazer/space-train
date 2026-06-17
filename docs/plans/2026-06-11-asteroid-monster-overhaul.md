# 陨石/怪物系统大改实现计划

## 改动范围

### 陨石多等级系统
- 5 种陨石：普通(灰)、二级(土黄)、三级(黑铁)、金色(金+辉光)、次数盾(蓝灰+方块血条)
- 随站点推进逐渐解锁高级陨石概率
- 全部配置化

### 次数盾陨石
- 受击方块血条横排显示在陨石上方
- 每种武器击中一次消耗一个方块
- 方块全破后陨石死亡

### 金色陨石 + 掉落系统
- 金色陨石必定掉落随机道具到背包
- 普通陨石极小概率掉落
- 掉落时浮动文字提示

### 追踪怪
- 朝种子方向移动
- 碰到种子造成伤害
- 低多边形几何体

### 刷新动态变化
- 随航行时间逐渐缩短生成间隔
- 随站点推进增加高级陨石比例

## 文件改动

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/entities/Asteroid.ts` | 重写 | 多等级、盾、金色、掉落 |
| `src/entities/Monster.ts` | 新建 | 追踪怪实体 |
| `src/game/Game.ts` | 修改 | 动态生成、怪物更新、掉落提示 |
| `src/weapons/Laser.ts` | 修改 | 改用 a.hit() |
| `src/weapons/Requiem.ts` | 修改 | 改用 a.hit() |
| `src/weapons/Missile.ts` | 修改 | 盾牌处理 |
| `src/weapons/SuctionGun.ts` | 修改 | 改用 a.hit() |
| `src/config/gameConfig.ts` | 修改 | 新增配置项 |

## API 设计

```ts
// Asteroid.hit(damage, dt?) → { killed, shieldHit, shieldBroken, dropItem }
// Asteroid.destroy() → void (remove mesh + shield blocks)
// Asteroid.getReward() → number
// Asteroid.isOffScreen() → boolean
```
