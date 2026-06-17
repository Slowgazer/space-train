import {
  BufferGeometry, Float32BufferAttribute, Points, PointsMaterial,
  Scene,
} from 'three';

const STAR_COUNT = 2000;

/**
 * 星空背景 - 3D 空间分布
 * 星光分布在 XYZ 空间中，随摄像机移动产生视差效果
 */
export class Starfield {
  private points: Points;

  constructor(scene: Scene) {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);

    const palette = [
      [1.0, 1.0, 1.0],
      [0.6, 0.8, 1.0],
      [1.0, 1.0, 0.7],
      [1.0, 0.7, 0.6],
      [0.7, 1.0, 0.8],
      [1.0, 0.8, 0.5],
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = -2 - Math.random() * 6; // z 深度分布

      const c = palette[Math.floor(Math.random() * palette.length)];
      const bright = 0.5 + Math.random() * 0.5;
      colors[i * 3] = c[0] * bright;
      colors[i * 3 + 1] = c[1] * bright;
      colors[i * 3 + 2] = c[2] * bright;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const mat = new PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: false,
      depthWrite: false,
    });
    this.points = new Points(geo, mat);
    this.points.renderOrder = -1;
    scene.add(this.points);
  }
}
