import { PLANETS, PLANETS_PER_CHOICE, PLANET_CHOICE_DISTANCE, PlanetDef } from '../config/planets';
import { SeedVisuals } from '../entities/SeedVisuals';
import { PlanetSelectionPanel } from '../ui/PlanetSelectionPanel';

/**
 * 星球抉择系统
 * 追踪航行距离，触发星球选择事件
 */
export class PlanetSelectionSystem {
  private distanceTraveled = 0;
  private lastChoiceDistance = 0;
  private panel: PlanetSelectionPanel;
  /** 当前是否在选择中 */
  private _active = false;
  private onActivate?: () => void;
  private onDeactivate?: () => void;

  constructor() {
    this.panel = new PlanetSelectionPanel();
  }

  get active(): boolean {
    return this._active;
  }

  setOnActivate(cb: () => void): void {
    this.onActivate = cb;
  }

  setOnDeactivate(cb: () => void): void {
    this.onDeactivate = cb;
  }

  /** 每帧更新，传入列车的移动距离 */
  update(dt: number, speed: number, seedVisuals: SeedVisuals, game: any): void {
    if (this._active) return;

    this.distanceTraveled += speed * dt;
    const sinceLast = this.distanceTraveled - this.lastChoiceDistance;

    if (sinceLast >= PLANET_CHOICE_DISTANCE) {
      this.trigger(seedVisuals, game);
    }
  }

  /** 触发星球选择 */
  private trigger(seedVisuals: SeedVisuals, game: any): void {
    this._active = true;
    this.onActivate?.();

    // 随机选取 PLANETS_PER_CHOICE 个星球（不重复）
    const shuffled = [...PLANETS].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, PLANETS_PER_CHOICE);

    this.panel.show(options, (chosen: PlanetDef) => {
      // 应用 buff
      chosen.apply(game);
      // 记录选择到种子视觉
      seedVisuals.recordChoice(chosen.id);
      // 更新最后选择距离
      this.lastChoiceDistance = this.distanceTraveled;
      this._active = false;
      this.onDeactivate?.();
    });
  }

  /** 距离下次抉择的剩余距离 */
  getRemainingDistance(): number {
    const sinceLast = this.distanceTraveled - this.lastChoiceDistance;
    return Math.max(0, PLANET_CHOICE_DISTANCE - sinceLast);
  }

  /** 强制在当前位置触发（调试用） */
  forceTrigger(seedVisuals: SeedVisuals, game: any): void {
    this.lastChoiceDistance = this.distanceTraveled - PLANET_CHOICE_DISTANCE + 1;
    this.trigger(seedVisuals, game);
  }
}
