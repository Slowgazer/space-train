import {
  Mesh, Scene, TetrahedronGeometry, MeshToonMaterial,
} from 'three';
import { addOutlineToMesh } from '../effects/ToonRenderer';

export class Monster {
  mesh: Mesh;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  private shakeX = 0;
  private shakeY = 0;

  constructor(scene: Scene, x: number, y: number) {
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 1.2;
    this.damage = 8;

    const geo = new TetrahedronGeometry(0.5);
    const mat = new MeshToonMaterial({ color: 0xff3366 });
    this.mesh = new Mesh(geo, mat);
    this.mesh.position.set(x, y, 0.3);
    scene.add(this.mesh);

    addOutlineToMesh(this.mesh, { thickness: 0.08, color: 0x991133 });
  }

  update(dt: number, targetX: number, targetY: number): void {
    const dx = targetX - this.mesh.position.x;
    const dy = targetY - this.mesh.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0.3) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.mesh.position.x += nx * this.speed * dt;
      this.mesh.position.y += ny * this.speed * dt;
    }
    this.mesh.rotation.x += dt * 1.5;
    this.mesh.rotation.y += dt * 2;

    this.shakeX *= 0.85;
    this.shakeY *= 0.85;
    this.mesh.position.x += this.shakeX;
    this.mesh.position.y += this.shakeY;
  }

  takeDamage(damage: number): boolean {
    this.hp -= damage;
    this.shakeX = (Math.random() - 0.5) * 0.1;
    this.shakeY = (Math.random() - 0.5) * 0.1;
    if (this.hp <= 0) {
      this.mesh.parent?.remove(this.mesh);
      return true;
    }
    return false;
  }

  remove(): void {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshToonMaterial).dispose();
  }

  get x(): number { return this.mesh.position.x; }
  get y(): number { return this.mesh.position.y; }

  isOffScreen(cameraX: number): boolean {
    return this.mesh.position.x < cameraX - 30;
  }
}
