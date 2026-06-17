import {
  Group, Mesh, SphereGeometry,
  Sprite, SpriteMaterial, Texture, TorusGeometry,
} from 'three';
import { createToonMaterial, addOutlineToMesh } from '../effects/ToonRenderer';

export interface PlayerConfig {
  color: string;
  face: string;
}

export class Player {
  group: Group;
  body: Mesh;
  face: Sprite;

  constructor(config: PlayerConfig) {
    this.group = new Group();

    // 光环 (Torus 默认在 XY 面)
    const ringGeo = new TorusGeometry(0.52, 0.05, 6, 16);
    const ring = new Mesh(ringGeo, createToonMaterial(config.color));
    addOutlineToMesh(ring, { thickness: 0.06 });
    this.group.add(ring);

    // 主体球体
    const bodyGeo = new SphereGeometry(0.48, 10, 6);
    const bodyMat = createToonMaterial(config.color);
    this.body = new Mesh(bodyGeo, bodyMat);
    addOutlineToMesh(this.body, { thickness: 0.06 });
    this.group.add(this.body);

    // 颜文字 Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.face, 32, 32);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    this.face = new Sprite(material);
    this.face.scale.set(0.65, 0.65, 1);
    this.face.position.set(0, 0.38, -0.05);
    this.group.add(this.face);
  }

  setPosition(x: number, y: number): void {
    this.group.position.set(x, y, 0.5);
  }
}
