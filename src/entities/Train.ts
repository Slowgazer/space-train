import {
  BoxGeometry, Group, Mesh,
  MeshToonMaterial,
} from 'three';
import { createToonMaterial, addOutlineToMesh } from '../effects/ToonRenderer';

interface CarConfig {
  color: string;
  width: number;   // X 轴（列车延伸方向）
  height: number;  // Z 轴（上下方向）
  depth: number;   // Y 轴（前后厚度）
}

const CARS: CarConfig[] = [
  { color: '#e53935', width: 2.4, height: 1.8, depth: 1.2 },
  { color: '#7b1fa2', width: 2.0, height: 1.5, depth: 1.2 },
  { color: '#2e7d32', width: 2.4, height: 1.8, depth: 1.6 },
  { color: '#78909c', width: 2.0, height: 1.5, depth: 1.2 },
  { color: '#78909c', width: 2.0, height: 1.5, depth: 1.2 },
];

export const SEED_CAR_INDEX = 2;

export class Train {
  group: Group;
  speed = 0.3;
  hp = 100;
  maxHp = 100;
  private flashTimer = 0;
  private bodyMeshes: Mesh[] = [];
  private bodyColors: string[] = [];
  private seedCarBody: Mesh | null = null;

  constructor() {
    this.group = new Group();
    this.buildCars();
    this.group.position.x = -12;
    this.group.position.y = -2;
  }

  private buildCars(): void {
    let offsetX = 0;
    for (let i = CARS.length - 1; i >= 0; i--) {
      const car = CARS[i];
      const w = car.width;
      const h = car.height;
      const d = car.depth;

      // 主车厢体: BoxGeometry(X宽, Y厚, Z高)
      const bodyGeo = new BoxGeometry(w * 0.88, d * 0.6, h * 0.72, 2, 2, 2);
      const isSeedCar = (i === SEED_CAR_INDEX);
      const bodyMat = isSeedCar
        ? new MeshToonMaterial({ color: '#4fc3f7', transparent: true, opacity: 0.35, depthWrite: false })
        : createToonMaterial(car.color);
      const body = new Mesh(bodyGeo, bodyMat);
      body.position.set(offsetX + w / 2, 0, h * 0.36);
      if (!isSeedCar) addOutlineToMesh(body, { thickness: 0.06 });
      this.group.add(body);
      this.bodyMeshes.push(body);
      this.bodyColors.push(isSeedCar ? '#4fc3f7' : car.color);
      if (isSeedCar) this.seedCarBody = body;

      // 底盘
      const baseGeo = new BoxGeometry(w, d, h * 0.2, 2, 1, 2);
      const base = new Mesh(baseGeo, createToonMaterial('#3e3e3e'));
      base.position.set(offsetX + w / 2, 0, h * 0.1);
      addOutlineToMesh(base, { thickness: 0.06 });
      this.group.add(base);

      // 车头顶部标识
      if (i === 0) {
        const topGeo = new BoxGeometry(w * 0.3, d * 0.3, h * 0.25, 1, 1, 1);
        const top = new Mesh(topGeo, createToonMaterial('#ffcc00'));
        top.position.set(offsetX + w * 0.55, 0, h * 0.6);
        addOutlineToMesh(top, { thickness: 0.06 });
        this.group.add(top);
      }

      // 种子车厢顶部标识
      if (i === SEED_CAR_INDEX) {
        const roofGeo = new BoxGeometry(w * 0.5, d * 0.4, h * 0.2, 1, 1, 1);
        const roof = new Mesh(roofGeo, createToonMaterial('#4caf50'));
        roof.position.set(offsetX + w / 2, 0, h * 0.55);
        addOutlineToMesh(roof, { thickness: 0.06 });
        this.group.add(roof);
      }

      offsetX += w + 0.1;
    }
  }

  update(dt: number): void {
    this.group.position.x += this.speed * dt;

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      const flashOn = Math.floor(this.flashTimer * 10) % 2 === 0;
      if (this.flashTimer <= 0) {
        this.restoreColors();
      } else if (flashOn) {
        for (const m of this.bodyMeshes) {
          if (m.material instanceof MeshToonMaterial) {
            m.material.color.set('#ff4444');
          }
        }
      } else {
        this.restoreColors();
      }
    }
  }

  private restoreColors(): void {
    for (let i = 0; i < this.bodyMeshes.length; i++) {
      const m = this.bodyMeshes[i];
      if (m.material instanceof MeshToonMaterial) {
        m.material.color.set(this.bodyColors[i]);
      }
    }
  }

  /** 受到伤害，返回剩余 HP */
  takeDamage(damage: number): number {
    this.hp -= damage;
    this.flashTimer = 0.3;
    return this.hp;
  }

  /** 维修列车 */
  repair(amount: number): void {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  /** 升级最大 HP */
  upgradeMaxHp(amount: number): void {
    this.maxHp += amount;
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  /** 列车包围盒高度 */
  get halfHeight(): number {
    return 1.2;
  }

  getCarPosition(index: number): number {
    let pos = this.group.position.x;
    for (let i = CARS.length - 1; i > index; i--) {
      pos += CARS[i].width + 0.1;
    }
    pos += CARS[index].width / 2;
    return pos;
  }

  get positionX(): number {
    return this.group.position.x;
  }

  get width(): number {
    return CARS.reduce((sum, c) => sum + c.width + 0.1, 0);
  }
}
