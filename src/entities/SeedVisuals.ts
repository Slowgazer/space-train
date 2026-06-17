import {
  AdditiveBlending, Group, Mesh, SphereGeometry,
  Sprite, SpriteMaterial, Texture,
} from 'three';
import { createToonMaterial, addOutlineToMesh } from '../effects/ToonRenderer';

export enum GrowthStage {
  SPROUT,
  GROWING,
  BLOOMING,
  FLOWERING,
  FRUITING,
}

export const STAGE_NAMES = ['萌芽', '成长', '繁茂', '开花', '结果'];

const PREF_COLORS: Record<string, { main: number; inner: number; glow: string }> = {
  water:  { main: 0x4fc3f7, inner: 0x0288d1, glow: '#4fc3f7' },
  fire:   { main: 0xff5252, inner: 0xd32f2f, glow: '#ff5252' },
  forest: { main: 0x69f0ae, inner: 0x2e7d32, glow: '#69f0ae' },
  light:  { main: 0xffd740, inner: 0xff8f00, glow: '#ffd740' },
  void:   { main: 0xb39ddb, inner: 0x6a1b9a, glow: '#b39ddb' },
};

const DEFAULT_COLOR = { main: 0x2e7d32, inner: 0x66bb6a, glow: '#66bb6a' };

export function getStage(choiceCount: number): GrowthStage {
  if (choiceCount >= 4) return GrowthStage.FRUITING;
  if (choiceCount >= 3) return GrowthStage.FLOWERING;
  if (choiceCount >= 2) return GrowthStage.BLOOMING;
  if (choiceCount >= 1) return GrowthStage.GROWING;
  return GrowthStage.SPROUT;
}

export class SeedVisuals {
  private group: Group;
  private bodyMesh: Mesh;
  private innerMesh: Mesh;
  private faceSprite: Sprite;
  private glowSprite: Sprite;
  private stage: GrowthStage = GrowthStage.SPROUT;
  private preferredPlanet = '';
  private choiceCount = 0;
  private timer = 0;

  constructor(group: Group) {
    this.group = group;

    // 主体球体
    const bodyGeo = new SphereGeometry(0.55, 12, 7);
    const bodyMat = createToonMaterial(0x2e7d32);
    this.bodyMesh = new Mesh(bodyGeo, bodyMat);
    addOutlineToMesh(this.bodyMesh, { thickness: 0.06 });
    this.group.add(this.bodyMesh);

    // 内核球
    const innerGeo = new SphereGeometry(0.25, 6, 4);
    const innerMat = createToonMaterial(0x66bb6a);
    this.innerMesh = new Mesh(innerGeo, innerMat);
    this.innerMesh.position.z = 0.15;
    addOutlineToMesh(this.innerMesh, { thickness: 0.07 });
    this.group.add(this.innerMesh);

    // 表情 Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌱', 32, 32);
    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const faceMat = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    this.faceSprite = new Sprite(faceMat);
    this.faceSprite.scale.set(0.7, 0.7, 1);
    this.faceSprite.position.z = 0.65;
    this.group.add(this.faceSprite);

    // 光环 Sprite
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const gCtx = glowCanvas.getContext('2d')!;
    const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(102,187,106,0.3)');
    grad.addColorStop(0.5, 'rgba(102,187,106,0.1)');
    grad.addColorStop(1, 'rgba(102,187,106,0)');
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, 64, 64);
    const glowTex = new Texture(glowCanvas);
    glowTex.needsUpdate = true;
    const glowMat = new SpriteMaterial({
      map: glowTex, transparent: true, blending: AdditiveBlending,
      depthTest: false, opacity: 0.4,
    });
    this.glowSprite = new Sprite(glowMat);
    this.glowSprite.position.z = 0;
    this.group.add(this.glowSprite);
  }

  recordChoice(planetId: string): void {
    this.choiceCount++;
    this.preferredPlanet = planetId;
    this.stage = getStage(this.choiceCount);
    this.updateVisuals();
  }

  getStage(): GrowthStage { return this.stage; }
  getChoiceCount(): number { return this.choiceCount; }

  private updateVisuals(): void {
    const pal = PREF_COLORS[this.preferredPlanet] || DEFAULT_COLOR;
    (this.bodyMesh.material as any).color.setHex(pal.main);
    (this.innerMesh.material as any).color.setHex(pal.inner);

    const emojis = ['🌱', '🌿', '🌳', '🌸', '🌟'];
    const idx = Math.min(this.stage, emojis.length - 1);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojis[idx], 32, 32);
    (this.faceSprite.material as SpriteMaterial).map = new Texture(canvas);
    (this.faceSprite.material as SpriteMaterial).map!.needsUpdate = true;

    const scale = 0.7 + this.stage * 0.15;
    this.faceSprite.scale.set(scale, scale, 1);

    const glowScale = 1.0 + this.stage * 0.6;
    this.glowSprite.scale.set(glowScale, glowScale, 1);
    (this.glowSprite.material as SpriteMaterial).opacity = 0.2 + this.stage * 0.12;
  }

  update(dt: number): void {
    this.timer += dt;
    const breathe = 1 + Math.sin(this.timer * 2) * 0.03 * (this.stage + 1);
    this.group.scale.set(breathe, breathe, breathe);
  }
}
