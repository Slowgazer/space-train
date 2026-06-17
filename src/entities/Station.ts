import {
  Scene, Group, SphereGeometry, MeshToonMaterial, Mesh,
  TorusGeometry,
} from 'three';
import { createToonMaterial, addOutlineToMesh } from '../effects/ToonRenderer';

export class Station {
  group: Group;
  triggerRadius = 3;
  vacuumRadius = 4;
  x = 0;
  y = 0;
  private body: Mesh;
  private ring: Mesh;

  constructor(scene: Scene) {
    this.group = new Group();
    this.group.visible = false;
    scene.add(this.group);

    const bodyMat = createToonMaterial('#ffd740');
    const bodyGeo = new SphereGeometry(2.5, 8, 6);
    this.body = new Mesh(bodyGeo, bodyMat);
    this.group.add(this.body);
    addOutlineToMesh(this.body);

    const ringMat = new MeshToonMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.6,
      side: 2,
    });
    const ringGeo = new TorusGeometry(3.5, 0.12, 6, 32);
    this.ring = new Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.z = -0.1;
    this.group.add(this.ring);
  }

  spawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.group.position.set(x, y, 0);
    this.group.visible = true;
  }

  despawn(): void {
    this.group.visible = false;
  }

  get active(): boolean {
    return this.group.visible;
  }
}
