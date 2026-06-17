import {
  AmbientLight, BackSide, DirectionalLight,
  Mesh, MeshBasicMaterial, MeshToonMaterial, Scene,
  ColorRepresentation,
} from 'three';

/** 设置场景光照（卡通渲染需要光源） */
export function setupToonLights(scene: Scene): void {
  const ambient = new AmbientLight(0x8888aa, 0.55);
  scene.add(ambient);

  const sun = new DirectionalLight(0xffffff, 0.85);
  sun.position.set(5, 10, 15);
  scene.add(sun);

  const fill = new DirectionalLight(0x6688cc, 0.3);
  fill.position.set(-3, 0, 5);
  scene.add(fill);
}

/**
 * 创建卡通材质（默认2级色阶，由光源方向产生明暗分界）
 */
export function createToonMaterial(
  color: ColorRepresentation,
  options: { opacity?: number; transparent?: boolean } = {},
): MeshToonMaterial {
  return new MeshToonMaterial({ color, ...options });
}

/**
 * 为 mesh 添加卡通描边（描边作为子节点，父 mesh 销毁时自动清理）
 * @returns 描边 mesh（已添加为 source 的子节点）
 */
export function addOutlineToMesh(
  source: Mesh,
  options: { color?: ColorRepresentation; thickness?: number } = {},
): Mesh {
  const color = options.color ?? 0x111111;
  const thickness = options.thickness ?? 0.06;

  const geo = source.geometry.clone();
  const mat = new MeshBasicMaterial({
    color,
    side: BackSide,
    transparent: true,
    opacity: 0.85,
  });
  const outline = new Mesh(geo, mat);
  outline.scale.setScalar(1 + thickness);
  source.add(outline);
  return outline;
}
