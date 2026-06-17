import { PerspectiveCamera, Raycaster, Vector2, Vector3, Plane } from 'three';

/** 摄像机距地面的高度 */
const CAMERA_HEIGHT = 10;
/** 摄像机在玩家后方的偏移距离 */
const CAMERA_BEHIND = 8;

/**
 * 游戏透视相机 (2.5D 俯视)
 * 固定角度从斜上方俯瞰，能看到物体的3D厚度
 */
export interface GameCamera extends PerspectiveCamera {
  shakeOffsetX: number;
  shakeOffsetY: number;
}

export function createGameCamera(): GameCamera {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new PerspectiveCamera(65, aspect, 0.5, 200) as GameCamera;
  camera.position.set(0, -CAMERA_BEHIND, CAMERA_HEIGHT);
  camera.lookAt(0, 0, 0);
  camera.shakeOffsetX = 0;
  camera.shakeOffsetY = 0;
  return camera;
}

/** 触发屏幕震动 */
export function triggerScreenShake(
  camera: GameCamera,
  intensity: number,
): void {
  camera.shakeOffsetX = (Math.random() - 0.5) * intensity * 2;
  camera.shakeOffsetY = (Math.random() - 0.5) * intensity * 2;
}

/** 更新相机位置，跟随玩家，叠加震屏偏移 */
export function updateCamera(
  camera: GameCamera,
  targetX: number,
  targetY: number,
  shakeDecay = 0.85,
): void {
  camera.shakeOffsetX *= shakeDecay;
  camera.shakeOffsetY *= shakeDecay;

  const cx = targetX + camera.shakeOffsetX;
  const cy = targetY + camera.shakeOffsetY;

  camera.position.set(cx + camera.shakeOffsetX, cy + camera.shakeOffsetY - CAMERA_BEHIND, CAMERA_HEIGHT);
  camera.lookAt(cx, cy, 0);
}

/** 屏幕坐标 (NDC -1~1) → 世界坐标 (z=0 平面) */
const _raycaster = new Raycaster();
const _plane = new Plane(new Vector3(0, 0, 1), 0);
const _vec2 = new Vector2();
const _vec3 = new Vector3();

export function screenToWorld(
  camera: GameCamera,
  sx: number,
  sy: number,
): { x: number; y: number } {
  _vec2.set(sx, sy);
  _raycaster.setFromCamera(_vec2, camera);
  _raycaster.ray.intersectPlane(_plane, _vec3);
  return { x: _vec3.x, y: _vec3.y };
}

/** 世界坐标 → 屏幕像素坐标 */
export function worldToScreen(
  camera: GameCamera,
  wx: number,
  wy: number,
  wz: number,
  width: number,
  height: number,
): { x: number; y: number } {
  _vec3.set(wx, wy, wz);
  _vec3.project(camera);
  return {
    x: (_vec3.x * 0.5 + 0.5) * width,
    y: (-_vec3.y * 0.5 + 0.5) * height,
  };
}
