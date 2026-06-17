import {
  AxesHelper, BufferGeometry, Float32BufferAttribute, Line,
  LineBasicMaterial, Scene, WebGLRenderer, Vector3, Color,
  GridHelper, Sprite, SpriteMaterial, CanvasTexture,
} from 'three';
import { createGameCamera, updateCamera, triggerScreenShake, screenToWorld, worldToScreen, GameCamera } from '../engine/Camera';
import { setupToonLights } from '../effects/ToonRenderer';
import { ParticleBurst } from '../effects/ParticleBurst';
import { Starfield } from '../effects/Starfield';
import { SafeZoneSystem } from '../systems/SafeZoneSystem';
import { initInput, getInput } from '../engine/Input';
import { Player } from '../entities/Player';
import { Train, SEED_CAR_INDEX } from '../entities/Train';
import { UpgradePanel, UpgradeOption } from '../ui/UpgradePanel';
import { DialogueSystem, BuffType } from '../systems/DialogueSystem';
import { AIDialogueSystem } from '../systems/AIDialogueSystem';
import { DialoguePanel } from '../ui/DialoguePanel';
import { SeedPanel } from '../ui/SeedPanel';
import { Laser } from '../weapons/Laser';
import { SuctionGun } from '../weapons/SuctionGun';
import { Missile } from '../weapons/Missile';
import { Requiem } from '../weapons/Requiem';
import { Weapon } from '../weapons/types';
import { Asteroid, pickTier } from '../entities/Asteroid';
import { Monster } from '../entities/Monster';
import { Seed } from '../entities/Seed';
import { SeedVisuals, GrowthStage } from '../entities/SeedVisuals';
import { AudioManager } from '../systems/AudioManager';
import { InventorySystem, ITEMS } from '../systems/InventorySystem';
import { InventoryPanel } from '../ui/InventoryPanel';
import { EventSystem, GameEvent } from '../systems/EventSystem';
import { EventMarker } from '../entities/EventMarker';
import { Station } from '../entities/Station';
import { StationSystem } from '../systems/StationSystem';
import { EditModePanel } from '../ui/EditModePanel';
import { GameOverPanel } from '../ui/GameOverPanel';
import { GAME_CONFIG_META } from '../config/gameConfig';
import { SeedDialoguePanel } from '../ui/SeedDialoguePanel';
import { SeedEvolutionPanel } from '../ui/SeedEvolutionPanel';
import { SeedEventSystem } from '../systems/SeedEventSystem';
import { EVOLUTION_TREE, type EvolutionNode } from '../config/evolutionData';
import { configureAI } from '../systems/AIService';

/** 安全区矩形在世界坐标中的范围 */
interface SafeZoneBounds {
  minX: number; minY: number;
  maxX: number; maxY: number;
}

/**
 * 游戏主类
 * 管理所有游戏实体和系统
 */
export class Game {
  scene: Scene;
  camera: GameCamera;
  renderer: WebGLRenderer;
  player: Player;
  train: Train;
  weapons: Weapon[] = [];
  currentWeaponIndex = 0;
  seed: Seed;
  asteroids: Asteroid[] = [];
  monsters: Monster[] = [];
  playerX = 0;
  playerY = 0;
  playerHP = 100;
  playerDead = false;
  respawnTimer = 0;
  totalKills = 0;
  currency = 0;
  vitality = 0;
  vitalityPerSecond = 1;
  spawnTimer = 0;
  spawnInterval = 1.5;
  monsterSpawnTimer = 0;
  stationCount = 0;
  private dropNotificationEl: HTMLElement;
  private mouseWorld = { x: 0, y: 0 };
  private particles: ParticleBurst;
  private starfield: Starfield;
  private safeZone: SafeZoneSystem;
  private safeZoneLine: Line;
  /** 安全区边界数据（每帧更新，用于绘制） */
  private currentBounds: SafeZoneBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  /** 倒计时 HUD 元素 */
  private countdownHUD: HTMLElement;
  /** HP HUD 元素 */
  private hpHUD: HTMLElement;
  /** 列车 HP HUD 元素 */
  private playerHpBar: { container: HTMLElement; fill: HTMLElement; text: HTMLElement };
  private trainHpBar: { container: HTMLElement; fill: HTMLElement; text: HTMLElement };
  private seedHpBar: { container: HTMLElement; fill: HTMLElement; text: HTMLElement };
  /** 货币 HUD 元素 */
  private coinHUD: HTMLElement;
  /** 生命活性 HUD 元素 */
  private vitalityHUD: HTMLElement;
  /** 按 F 升级 提示 HUD */
  private upgradePromptHUD: HTMLElement;
  private upgradePanel: UpgradePanel;
  private gamePaused = false;
  private prevFDown = false;
  private prevQDown = false;
  private prevEDown = false;
  private prevZDown = false;
  private weaponHUD: HTMLElement;
  private aimTriangle: HTMLElement;
  /** 升级等级 */
  private laserDamageLv = 1;
  private laserRangeLv = 1;
  private playerSpeedLv = 1;
  private safeTimeLv = 1;
  private missileStockLv = 1;
  private missileBlastLv = 1;
  private missileAimLv = 1;
  private trainHpLv = 1;
  private requiemMagLv = 1;
  private requiemReloadLv = 1;
  private requiemDamageLv = 1;
  private suctionChargeLv = 1;
  private suctionDamageLv = 1;
  private suctionSpeedLv = 1;
  private dialogueSystem: DialogueSystem;
  private aiDialogue: AIDialogueSystem;
  private dialoguePanel: DialoguePanel;
  private seedPanel: SeedPanel;
  private dialogueCoolDownHUD: HTMLElement;
  private activeBuff: BuffType = BuffType.NONE;
  private buffTimer = 0;
  private seedVisuals: SeedVisuals;
  private stationSystem: StationSystem;
  private stationDistanceHUD: HTMLElement;
  private audio: AudioManager;
  private inventory: InventorySystem;
  private inventoryPanel: InventoryPanel;
  private eventSystem: EventSystem;
  private eventMarker: EventMarker;
  private gameOverPanel: GameOverPanel;
  private respawnOverlay: HTMLElement | null = null;
  private eventDistanceHUD: HTMLElement;
  private prevBDown = false;
  speedBuffTimer = 0;
  invincibleTimer = 0;
  aiDialogueUnlocked = false;
  private evolutionResource = 0;
  private evolutionHUD: HTMLElement;
  private seedDialoguePanel: SeedDialoguePanel;
  private seedEvolutionPanel: SeedEvolutionPanel;
  private seedEventSystem: SeedEventSystem;
  private evolvedNodes: Set<string> = new Set();
  private editMode = false;
  private gridHelper: GridHelper;
  private axisLabels: Sprite[] = [];
  private editModePanel: EditModePanel;
  private konamiBuffer: string[] = [];
  private readonly KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.scene.background = new Color('#0a0a1a');
    setupToonLights(this.scene);

    // 坐标轴辅助线：红=X, 绿=Y, 蓝=Z，方便描述方向
    const axes = new AxesHelper(15);
    axes.position.set(-5, 0, 0);
    this.scene.add(axes);

    // 编辑模式网格（隐藏，秘籍打开）
    this.gridHelper = new GridHelper(100, 100, 0x444466, 0x333355);
    this.gridHelper.rotation.x = Math.PI / 2;
    this.gridHelper.position.z = -0.01;
    this.gridHelper.visible = false;
    this.scene.add(this.gridHelper);

    // 坐标轴字母标签
    const labelDefs = [
      { text: 'X', color: '#ff4444', px: 12, py: 0, pz: 0 },
      { text: 'Y', color: '#44ff44', px: 0, py: 12, pz: 0 },
      { text: 'Z', color: '#4488ff', px: 0, py: 0, pz: 12 },
    ];
    for (const d of labelDefs) {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = d.color;
      ctx.font = 'bold 44px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.text, 32, 32);
      const tex = new CanvasTexture(canvas);
      const mat = new SpriteMaterial({ map: tex, depthTest: false, transparent: true });
      const sprite = new Sprite(mat);
      sprite.scale.set(2.4, 2.4, 1);
      sprite.position.set(d.px, d.py, d.pz);
      sprite.visible = false;
      this.scene.add(sprite);
      this.axisLabels.push(sprite);
    }
    this.camera = createGameCamera();
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.player = new Player({ color: '#4fc3f7', face: '^^' });
    this.scene.add(this.player.group);

    this.train = new Train();
    this.scene.add(this.train.group);

    this.seed = new Seed();
    this.scene.add(this.seed.group);

    this.seedVisuals = new SeedVisuals(this.seed.group);

    const stationEntity = new Station(this.scene);
    this.stationSystem = new StationSystem(stationEntity);
    this.stationSystem.setOnActivate(() => {
      this.stationCount++;
      this.gamePaused = true;
    });
    this.stationSystem.setOnDeactivate(() => { this.gamePaused = false; });

    this.stationDistanceHUD = this.createHUD('station-distance', '#ffd740', '');
    this.stationDistanceHUD.style.bottom = '50px';
    this.stationDistanceHUD.style.right = '20px';
    this.stationDistanceHUD.style.display = 'none';

    this.eventDistanceHUD = this.createHUD('event-distance', '#ff8800', '');
    this.eventDistanceHUD.style.bottom = '80px';
    this.eventDistanceHUD.style.right = '20px';
    this.eventDistanceHUD.style.display = 'none';

    this.audio = new AudioManager();
    this.inventory = new InventorySystem();
    this.inventoryPanel = new InventoryPanel();
    this.eventSystem = new EventSystem();
    this.eventMarker = new EventMarker(this.scene);
    this.gameOverPanel = new GameOverPanel();

    // 复活倒计时 UI
    this.respawnOverlay = document.createElement('div');
    this.respawnOverlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      display:none;align-items:center;justify-content:center;
      z-index:500;font-family:monospace;pointer-events:none;
    `;
    this.respawnOverlay.innerHTML = '<div id="respawn-text" style="color:#ff6666;font-size:28px;text-shadow:0 0 20px rgba(255,50,50,0.5);"></div>';
    document.body.appendChild(this.respawnOverlay);

    // 首次交互初始化音频
    const initAudio = () => {
      this.audio.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    this.weapons.push(new Laser(this.scene));
    this.weapons.push(new SuctionGun(this.scene));
    this.weapons.push(new Requiem(this.scene));
    this.weapons.push(new Missile(this.scene));
    this.dialogueSystem = new DialogueSystem();
    this.aiDialogue = new AIDialogueSystem(this.dialogueSystem.personality, this.seedVisuals.getStage());
    this.dialoguePanel = new DialoguePanel();
    this.seedPanel = new SeedPanel();
    this.seedDialoguePanel = new SeedDialoguePanel();
    this.seedDialoguePanel.setOnUpgrade(() => this.openSeedUpgrade());
    this.seedDialoguePanel.setOnEvolve(() => this.openSeedEvolution());
    this.seedDialoguePanel.setOnClose(() => { this.gamePaused = false; });
    this.seedEvolutionPanel = new SeedEvolutionPanel();
    this.seedEvolutionPanel.setOnEvolve((nodeId) => this.evolveNode(nodeId));
    this.seedEvolutionPanel.setOnClose(() => { this.gamePaused = false; });
    this.seedEventSystem = new SeedEventSystem();
    this.dialogueCoolDownHUD = this.createHUD('dialogue-cooldown', '#9966ff', '');
    this.dialogueCoolDownHUD.style.bottom = '60px';
    this.dialogueCoolDownHUD.style.right = '20px';
    this.dialogueCoolDownHUD.style.display = 'none';
    this.particles = new ParticleBurst(this.scene);
    this.starfield = new Starfield(this.scene);
    this.safeZone = new SafeZoneSystem();

    // 安全区边界线（矩形虚线框）
    const lineGeo = new BufferGeometry();
    const rectVerts = new Float32Array(5 * 3);
    lineGeo.setAttribute('position', new Float32BufferAttribute(rectVerts, 3));
    const lineMat = new LineBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      depthWrite: false,
    });
    this.safeZoneLine = new Line(lineGeo, lineMat);
    this.safeZoneLine.renderOrder = 999;
    this.safeZoneLine.position.z = 0.1;
    this.scene.add(this.safeZoneLine);

    // 创建 HUD 元素
    this.countdownHUD = this.createHUD('safe-zone-countdown', '#ff4444', '');
    this.countdownHUD.style.top = '60px';
    this.countdownHUD.style.left = '50%';
    this.countdownHUD.style.transform = 'translateX(-50%)';

    this.hpHUD = this.createHUD('player-hp', '#44ff44', `HP: ${this.playerHP}`);
    this.hpHUD.style.top = '20px';
    this.hpHUD.style.right = '20px';

    this.playerHpBar = this.createHealthBar('player-hp-bar', '❤️ 玩家', '#44ff44');
    this.playerHpBar.container.style.display = 'none';

    this.coinHUD = this.createHUD('player-coin', '#ffcc00', `金币: ${this.currency}`);
    this.coinHUD.style.top = '48px';
    this.coinHUD.style.right = '20px';

    this.evolutionHUD = this.createHUD('evolution-resource', '#88ff44', `🌀 进化因子: 0`);
    this.evolutionHUD.style.top = '80px';
    this.evolutionHUD.style.right = '20px';

    this.trainHpBar = this.createHealthBar('train-hp-bar', '🚂 列车', '#ff8844');
    this.trainHpBar.container.style.display = 'none';

    this.seedHpBar = this.createHealthBar('seed-hp-bar', '🌱 种子', '#44ff88');
    this.seedHpBar.container.style.display = 'none';
    this.seedHpBar.container.style.top = '104px';
    this.seedHpBar.container.style.right = '20px';
    this.seedHpBar.container.style.display = 'none';

    this.vitalityHUD = this.createHUD('player-vitality', '#aa88ff', `活性: ${this.vitality}`);
    this.vitalityHUD.style.top = '104px';
    this.vitalityHUD.style.right = '20px';

    this.upgradePromptHUD = this.createHUD('upgrade-prompt', '#ce93d8', '');
    this.upgradePromptHUD.style.bottom = '60px';
    this.upgradePromptHUD.style.left = '50%';
    this.upgradePromptHUD.style.transform = 'translateX(-50%)';
    this.upgradePromptHUD.style.display = 'none';

    this.weaponHUD = this.createHUD('weapon-name', '#00ffff', '激光');
    this.weaponHUD.style.bottom = '20px';
    this.weaponHUD.style.left = '20px';

    // === 掉落提示 ===
    this.dropNotificationEl = document.createElement('div');
    this.dropNotificationEl.id = 'drop-notification';
    this.dropNotificationEl.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'color:#ffd740;font-size:28px;font-family:monospace;pointer-events:none;z-index:150;' +
      'text-shadow:0 0 20px rgba(255,215,64,0.5);opacity:0;transition:opacity 0.3s;' +
      'display:none;';
    document.body.appendChild(this.dropNotificationEl);
    this.dropNotificationEl.textContent = '';

    // === 安魂曲瞄准三角（默认隐藏） ===
    const triStyle = document.createElement('style');
    triStyle.textContent = '@keyframes req-spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }';
    document.head.appendChild(triStyle);

    this.aimTriangle = document.createElement('div');
    this.aimTriangle.id = 'requiem-triangle';
    this.aimTriangle.style.cssText =
      'position:fixed;pointer-events:none;z-index:200;' +
      'width:0;height:0;' +
      'border-left:7px solid transparent;' +
      'border-right:7px solid transparent;' +
      'border-bottom:12px solid #ff3333;' +
      'animation:req-spin 1s linear infinite;' +
      'display:none;';
    document.body.appendChild(this.aimTriangle);

    this.upgradePanel = new UpgradePanel();
    this.upgradePanel.setOnClose(() => { this.gamePaused = false; });

    initInput(this.renderer.domElement);
    window.addEventListener('resize', () => this.onResize(container));

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.mouseWorld.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      this.mouseWorld.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    });

    // === 编辑模式（上上下下左右左右） ===
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (e.repeat) return;
        this.konamiBuffer.push(e.key);
        if (this.konamiBuffer.length > this.KONAMI_CODE.length) {
          this.konamiBuffer.shift();
        }
        if (this.konamiBuffer.length === this.KONAMI_CODE.length &&
            this.konamiBuffer.every((v, i) => v === this.KONAMI_CODE[i])) {
          this.toggleEditMode();
          this.konamiBuffer = [];
        }
      }
    });

    this.editModePanel = new EditModePanel();
    this.editModePanel.setOnPauseToggle(() => {
      this.gamePaused = this.editModePanel.isPaused;
    });
    this.registerEditParams();
  }

  /** 创建 HUD 文字元素 */
  private createHUD(id: string, color: string, text: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = `position:absolute;color:${color};font-size:22px;font-family:monospace;pointer-events:none;z-index:100;`;
    el.textContent = text;
    document.body.appendChild(el);
    return el;
  }

  private updatePlayerHpBar(): void {
    const pct = Math.max(0, this.playerHP / 100);
    this.playerHpBar.fill.style.width = `${pct * 100}%`;
    this.playerHpBar.text.textContent = `${Math.max(0, Math.floor(this.playerHP))}/100`;
  }

  private updateTrainHpBar(): void {
    const pct = Math.max(0, this.train.hp / this.train.maxHp);
    this.trainHpBar.fill.style.width = `${pct * 100}%`;
    this.trainHpBar.text.textContent = `${Math.max(0, Math.floor(this.train.hp))}/${this.train.maxHp}`;
  }

  private updateSeedHpBar(): void {
    const pct = Math.max(0, this.seed.hp / this.seed.maxHp);
    this.seedHpBar.fill.style.width = `${pct * 100}%`;
    this.seedHpBar.text.textContent = `${Math.max(0, Math.floor(this.seed.hp))}/${this.seed.maxHp}`;
  }

  private createHealthBar(id: string, label: string, color: string): { container: HTMLElement; fill: HTMLElement; text: HTMLElement } {
    const container = document.createElement('div');
    container.id = id;
    container.style.cssText = `
      position:fixed;transform:translate(-50%,-100%);padding:4px 8px;
      background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.08);
      border-radius:5px;font-family:monospace;pointer-events:none;z-index:100;
      white-space:nowrap;width:130px;
    `;

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:12px;';

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = `color:${color};font-size:11px;`;

    const textEl = document.createElement('span');
    textEl.style.cssText = 'color:#ccc;font-size:11px;';
    textEl.textContent = '100/100';

    topRow.appendChild(labelEl);
    topRow.appendChild(textEl);
    container.appendChild(topRow);

    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width:100%;min-width:100px;height:5px;
      background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;
    `;

    const fill = document.createElement('div');
    fill.style.cssText = `
      width:100%;height:100%;background:${color};
      border-radius:3px;transition:width 0.2s;
    `;
    barBg.appendChild(fill);
    container.appendChild(barBg);

    document.body.appendChild(container);
    return { container, fill, text: textEl };
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return screenToWorld(this.camera, sx, sy);
  }

  /** 增加货币并显示浮动文字 */
  addCurrency(amount: number, worldX: number, worldY: number): void {
    this.currency += amount;
    this.coinHUD.textContent = `金币: ${this.currency}`;
    this.audio.play('coin_pickup');

    const canvas = this.renderer.domElement;
    const wv = new Vector3(worldX, worldY, 0);
    wv.project(this.camera);
    const targetSX = (wv.x * 0.5 + 0.5) * canvas.clientWidth;
    const targetSY = (-wv.y * 0.5 + 0.5) * canvas.clientHeight;

    setTimeout(() => {
      const el = document.createElement('div');
      el.textContent = `+${amount}`;
      el.style.cssText = 'position:absolute;color:#ffcc00;font-size:18px;font-family:monospace;pointer-events:none;z-index:100;transition:all 0.8s ease-out;opacity:1;';
      const rect = canvas.getBoundingClientRect();
      el.style.left = `${targetSX + rect.left}px`;
      el.style.top = `${targetSY + rect.top}px`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = 'translateY(-40px)';
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 800);
    }, 300);
  }

  /** 构建消耗金币的升级选项（升级车厢） */
  private buildCoinUpgradeOptions(): void {
    const refresh = () => {
      this.coinHUD.textContent = `金币: ${this.currency}`;
    };
    const opts: UpgradeOption[] = [
      {
        label: '列车装甲',
        desc: `增加列车最大 HP ${this.train.maxHp} → ${this.train.maxHp + 30}`,
        cost: this.trainHpLv * 40,
        currencyType: 'coin',
        level: this.trainHpLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.currency < this.trainHpLv * 40) return;
          this.currency -= this.trainHpLv * 40;
          this.trainHpLv++;
          this.train.upgradeMaxHp(30);
          this.updateTrainHpBar();
          refresh();
          this.buildCoinUpgradeOptions();
        },
      },
      {
        label: '列车维修',
        desc: `回复 ${Math.min(40, this.train.maxHp - this.train.hp)} HP（当前 ${this.train.hp}/${this.train.maxHp}）`,
        cost: 25,
        currencyType: 'coin',
        onBuy: () => {
          if (this.currency < 25 || this.train.hp >= this.train.maxHp) return;
          this.currency -= 25;
          this.train.repair(40);
          this.updateTrainHpBar();
          refresh();
          this.buildCoinUpgradeOptions();
        },
      },
    ];
    this.upgradePanel.setCategories([
      { name: '列车维护', icon: '🚂', options: opts },
    ]);
    this.upgradePanel.updateCurrency(this.currency, this.vitality);
  }

  /** 构建消耗活性的升级选项（种子处） */
  private buildVitalityUpgradeOptions(): void {
    const refresh = () => {
      this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
    };
    const opts: UpgradeOption[] = [
      {
        label: '激光伤害',
        desc: `DPS ${(this.weapons[0] as Laser).damage} → ${10 + this.laserDamageLv * 5}`,
        cost: this.laserDamageLv * 20,
        currencyType: 'vitality',
        level: this.laserDamageLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.laserDamageLv * 20) return;
          this.vitality -= this.laserDamageLv * 20;
          this.laserDamageLv++;
          (this.weapons[0] as Laser).damage = 10 + (this.laserDamageLv - 1) * 5;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '激光射程',
        desc: `射程 ${(this.weapons[0] as Laser).maxRange} → ${4 + this.laserRangeLv * 1}`,
        cost: this.laserRangeLv * 15,
        currencyType: 'vitality',
        level: this.laserRangeLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.laserRangeLv * 15) return;
          this.vitality -= this.laserRangeLv * 15;
          this.laserRangeLv++;
          (this.weapons[0] as Laser).maxRange = 4 + (this.laserRangeLv - 1) * 1;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '移动速度',
        desc: `移速 ${2 + (this.playerSpeedLv - 1) * 0.5} → ${2 + this.playerSpeedLv * 0.5}`,
        cost: this.playerSpeedLv * 10,
        currencyType: 'vitality',
        level: this.playerSpeedLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.playerSpeedLv * 10) return;
          this.vitality -= this.playerSpeedLv * 10;
          this.playerSpeedLv++;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '太空活动时间',
        desc: `安全区倒计时 ${10 + (this.safeTimeLv - 1) * 5} → ${10 + this.safeTimeLv * 5}s`,
        cost: this.safeTimeLv * 25,
        currencyType: 'vitality',
        level: this.safeTimeLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.safeTimeLv * 25) return;
          this.vitality -= this.safeTimeLv * 25;
          this.safeTimeLv++;
          this.safeZone.maxCountdown = 10 + (this.safeTimeLv - 1) * 5;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '导弹库存',
        desc: `库存 ${(this.weapons[3] as Missile).maxStock} → ${this.missileStockLv + 1}`,
        cost: this.missileStockLv * 30,
        currencyType: 'vitality',
        level: this.missileStockLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.missileStockLv * 30) return;
          this.vitality -= this.missileStockLv * 30;
          this.missileStockLv++;
          const m = this.weapons[3] as Missile;
          m.maxStock = this.missileStockLv;
          m.stock = Math.min(m.stock + 1, m.maxStock);
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '导弹范围',
        desc: `爆炸半径 ${(this.weapons[3] as Missile).blastRadius} → ${3.5 + this.missileBlastLv * 0.5}`,
        cost: this.missileBlastLv * 25,
        currencyType: 'vitality',
        level: this.missileBlastLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.missileBlastLv * 25) return;
          this.vitality -= this.missileBlastLv * 25;
          this.missileBlastLv++;
          (this.weapons[3] as Missile).blastRadius = 3.5 + (this.missileBlastLv - 1) * 0.5;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '导弹瞄准',
        desc: `瞄准时间 ${(this.weapons[3] as Missile).aimTime.toFixed(2)} → ${Math.max(0.5, 2.25 - this.missileAimLv * 0.25).toFixed(2)}s`,
        cost: this.missileAimLv * 20,
        currencyType: 'vitality',
        level: this.missileAimLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.missileAimLv * 20) return;
          this.vitality -= this.missileAimLv * 20;
          this.missileAimLv++;
          (this.weapons[3] as Missile).aimTime = Math.max(0.5, 2.25 - (this.missileAimLv - 1) * 0.25);
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '安魂曲弹夹',
        desc: `容量 ${(this.weapons[2] as Requiem).maxMagazine} → ${6 + this.requiemMagLv * 2}`,
        cost: this.requiemMagLv * 25,
        currencyType: 'vitality',
        level: this.requiemMagLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.requiemMagLv * 25) return;
          this.vitality -= this.requiemMagLv * 25;
          this.requiemMagLv++;
          (this.weapons[2] as Requiem).maxMagazine = 6 + (this.requiemMagLv - 1) * 2;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '安魂曲上弹',
        desc: `换弹时间 ${(this.weapons[2] as Requiem).reloadTime.toFixed(1)} → ${Math.max(2, 5 - this.requiemReloadLv * 0.5).toFixed(1)}s`,
        cost: this.requiemReloadLv * 20,
        currencyType: 'vitality',
        level: this.requiemReloadLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.requiemReloadLv * 20) return;
          this.vitality -= this.requiemReloadLv * 20;
          this.requiemReloadLv++;
          (this.weapons[2] as Requiem).reloadTime = Math.max(2, 5 - (this.requiemReloadLv - 1) * 0.5);
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '安魂曲伤害',
        desc: `伤害 ${(this.weapons[2] as Requiem).damage} → ${100 + this.requiemDamageLv * 30}`,
        cost: this.requiemDamageLv * 30,
        currencyType: 'vitality',
        level: this.requiemDamageLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.requiemDamageLv * 30) return;
          this.vitality -= this.requiemDamageLv * 30;
          this.requiemDamageLv++;
          (this.weapons[2] as Requiem).damage = 100 + (this.requiemDamageLv - 1) * 30;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '吸盘蓄力速度',
        desc: `蓄力时间 ${(0.6 - this.suctionChargeLv * 0.08).toFixed(2)}s/段`,
        cost: this.suctionChargeLv * 25,
        currencyType: 'vitality',
        level: this.suctionChargeLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.suctionChargeLv * 25) return;
          this.vitality -= this.suctionChargeLv * 25;
          this.suctionChargeLv++;
          (this.weapons[1] as SuctionGun).chargeSpeedBonus = this.suctionChargeLv * 0.08;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '吸盘发射力度',
        desc: `伤害预算 ${30 + this.suctionDamageLv * 10} → ${30 + (this.suctionDamageLv + 1) * 10}`,
        cost: this.suctionDamageLv * 30,
        currencyType: 'vitality',
        level: this.suctionDamageLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.suctionDamageLv * 30) return;
          this.vitality -= this.suctionDamageLv * 30;
          this.suctionDamageLv++;
          (this.weapons[1] as SuctionGun).damageBonus = this.suctionDamageLv * 10;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
      {
        label: '吸盘飞行速度',
        desc: `初速 ${5 + this.suctionSpeedLv * 1} → ${5 + (this.suctionSpeedLv + 1) * 1}`,
        cost: this.suctionSpeedLv * 15,
        currencyType: 'vitality',
        level: this.suctionSpeedLv,
        maxLevel: 5,
        onBuy: () => {
          if (this.vitality < this.suctionSpeedLv * 15) return;
          this.vitality -= this.suctionSpeedLv * 15;
          this.suctionSpeedLv++;
          (this.weapons[1] as SuctionGun).launchSpeedBonus = this.suctionSpeedLv * 1;
          refresh();
          this.buildVitalityUpgradeOptions();
        },
      },
    ];
    this.upgradePanel.setCategories([
      {
        name: '属性强化', icon: '💪',
        options: opts.filter((_, i) => i >= 2 && i <= 3),
      },
      {
        name: '武器升级', icon: '🔫',
        options: opts.filter((_, i) => i <= 1 || i >= 4),
      },
    ]);
    this.upgradePanel.updateCurrency(this.currency, this.vitality);
  }

  private spawnAsteroid(): void {
    if (this.stationSystem.isNearStation) return;
    const cameraRight = this.camera.position.x + 20;
    const tier = pickTier(this.stationCount);
    const radius = 0.3 + Math.random() * 0.5;
    const y = this.train.group.position.y + (Math.random() - 0.5) * 35;
    const a = new Asteroid(this.scene, cameraRight, y, radius, tier);
    this.asteroids.push(a);
  }

  /** 检测陨石与列车碰撞 */
  private checkTrainCollisions(): void {
    const trainX = this.train.group.position.x;
    const trainY = this.train.group.position.y;
    const trainW = this.train.width;
    const halfH = this.train.halfHeight;

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      const ax = a.x;
      const ay = a.y;
      const ar = a.radius;

      // AABB vs 圆形碰撞
      const closestX = Math.max(trainX, Math.min(ax, trainX + trainW));
      const closestY = Math.max(trainY - halfH, Math.min(ay, trainY + halfH));
      const dx = ax - closestX;
      const dy = ay - closestY;
      if (dx * dx + dy * dy < ar * ar) {
        // 碰撞！陨石撞击列车
        const damage = Math.ceil(ar * 8);
        const hpLeft = this.train.takeDamage(damage);
        this.updateTrainHpBar();
        this.particles.emit(ax, ay, 12, 1, 0.4, 0);
        triggerScreenShake(this.camera, 0.12);
        this.audio.play('laser_hit');

        // 移除陨石
        a.destroyAll();
        this.asteroids.splice(i, 1);

        // 游戏结束检测
        if (hpLeft <= 0) {
          this.gameOver('列车损毁', '种子失去了庇护…');
          return;
        }
      }
    }
  }

  private showDropNotification(itemName: string): void {
    const el = this.dropNotificationEl;
    el.textContent = `✨ 获得 ${itemName}`;
    el.style.display = '';
    el.style.opacity = '1';
    clearTimeout((el as any)._fadeTimer);
    (el as any)._fadeTimer = setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => { el.style.display = 'none'; }, 300);
    }, 1500);
  }

  /** 游戏结束 */
  private gameOver(reason: string, detail: string): void {
    this.gamePaused = true;
    this.gameOverPanel.show(reason, [
      { label: '航行距离', value: `${Math.floor(this.stationSystem.distanceTraveled)}m` },
      { label: '击杀敌人', value: `${this.totalKills}` },
    ]);
  }

  private startRespawn(): void {
    this.playerDead = true;
    this.playerHP = 0;
    this.hpHUD.textContent = 'HP: 0';
    this.respawnTimer = 10;
    if (this.respawnOverlay) {
      this.respawnOverlay.style.display = 'flex';
      const text = this.respawnOverlay.querySelector('#respawn-text');
      if (text) text.textContent = '复活倒计时 10s';
    }
  }

  private triggerEvent(): void {
    const ev = this.eventSystem.currentEvent;
    if (!ev) return;

    this.gamePaused = true;
    this.audio.play('dialogue_chime');
    this.eventMarker.hide();
    this.eventDistanceHUD.style.display = 'none';

    // 用对话面板展示事件
    const pseudoEntry = {
      text: `【${ev.emoji} ${ev.title}】\n${ev.text}`,
      options: ev.options.map((opt) => ({
        text: opt.text,
        correct: true,
      })),
      rewardMin: 0,
      rewardMax: 0,
      buffType: 0,
    };

    this.dialoguePanel.show(pseudoEntry as any, ev.title, (index: number) => {
      const chosen = ev.options[index];
      if (chosen.rewardType === 'currency') {
        this.currency += chosen.reward;
        this.coinHUD.textContent = `金币: ${this.currency}`;
      } else {
        this.vitality += chosen.reward;
        this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
      }

      this.dialoguePanel.showResult(`✨ ${chosen.result} (+${chosen.reward}${chosen.rewardType === 'currency' ? '金币' : '活性'})`, '#ffaa00');
      setTimeout(() => {
        this.dialoguePanel.hide();
        this.gamePaused = false;
        this.eventSystem.resolve();
      }, 2500);
    });
  }

  /** 打开新版种子对话面板（休息状态） */
  private openSeedDialoguePanel(): void {
    if (!this.playerDead) {
      this.gamePaused = true;
      const stageNames = ['萌芽', '成长', '繁茂', '开花', '结果'];
      const stageIdx = this.seedVisuals.getStage();
      const stage = stageNames[stageIdx] || '萌芽';
      const portrait = '🌱';

      this.seedDialoguePanel.showOption(
        portrait,
        `种子 · ${stage}`,
        '…我有点累了，你想跟我聊聊天，还是看看我有哪些新能力？',
        ['聊聊天吧', '看看你的能力'],
        (idx) => {
          if (idx === 0) {
            // 切换到自由对话模式
            this.seedDialoguePanel.showFree(
              portrait,
              `种子 · ${stage}`,
              '你知道吗…在宇宙中漂流的时候，我一直在想，要是能像沙漠里的植物一样，找到在最恶劣环境中生存的方法就好了。你愿意听听我的想法吗？',
            );
          } else {
            this.seedDialoguePanel.hide();
            this.gamePaused = false;
          }
        },
      );
    }
  }

  /** 处理种子事件触发 */
  private triggerSeedEvent(ev: import('../systems/SeedEventSystem').SeedEvent): void {
    this.gamePaused = true;
    const stageNames = ['萌芽', '成长', '繁茂', '开花', '结果'];
    const stageIdx = this.seedVisuals.getStage();

    if (ev.type === 'dialogue') {
      const d = ev.data as import('../systems/DialogueSystem').DialogueEntry;
      this.seedDialoguePanel.showOption(
        '🌱',
        `种子 · ${stageNames[stageIdx] || '萌芽'}`,
        d.text,
        d.options.map(o => o.text),
        (idx) => {
          const chosen = d.options[idx];
          if (chosen.correct) {
            const reward = d.rewardMin + Math.floor(Math.random() * (d.rewardMax - d.rewardMin));
            this.vitality += reward;
            this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
            this.seedDialoguePanel.showResult(`✨ ${chosen.text}！（获得 ${reward} 活性）`);
          } else {
            const reward = 10 + Math.floor(Math.random() * 10);
            this.vitality += reward;
            this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
            this.seedDialoguePanel.showResult(`嗯…也许我们可以换个角度想。（获得 ${reward} 活性）`, '#ffaa44');
          }
          setTimeout(() => {
            this.seedDialoguePanel.hide();
            this.seedEventSystem.resolve();
            this.gamePaused = false;
          }, 2500);
        },
      );
    } else if (ev.type === 'minigame') {
      // 小游戏占位 - 简单显示消息
      this.seedDialoguePanel.showOption(
        '🌱',
        '🎮 小游戏',
        (ev.data as import('../systems/SeedEventSystem').MinigameData).instruction,
        ['准备好了！', '下次吧'],
        (idx) => {
          if (idx === 0) {
            this.seedDialoguePanel.showResult('反应不错！+20 活性', '#44ff44');
            this.vitality += 20;
            this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
          }
          setTimeout(() => {
            this.seedDialoguePanel.hide();
            this.seedEventSystem.resolve();
            this.gamePaused = false;
          }, 1500);
        },
      );
    }
  }

  /** 打开进化面板 */
  private openSeedEvolution(): void {
    if (!this.gamePaused) this.gamePaused = true;
    this.seedEvolutionPanel.setEvolved([...this.evolvedNodes]);
    this.seedEvolutionPanel.show(this.evolutionResource);
  }

  /** 进化节点 */
  private evolveNode(nodeId: string): boolean {
    const node = EVOLUTION_TREE.find(n => n.id === nodeId);
    if (!node) return false;
    if (this.evolvedNodes.has(nodeId)) return false;
    if (this.evolutionResource < node.cost) return false;

    // 检查前置
    const allPrereqs = node.prerequisites.every(p => this.evolvedNodes.has(p));
    if (!allPrereqs) return false;

    this.evolutionResource -= node.cost;
    this.evolutionHUD.textContent = `🌀 进化因子: ${this.evolutionResource}`;
    this.evolvedNodes.add(nodeId);
    this.seedEvolutionPanel.setEvolved([...this.evolvedNodes]);

    // 应用游戏效果（根据节点 id 映射到游戏属性）
    this.applyEvolutionEffect(nodeId);

    return true;
  }

  /** 应用进化效果 */
  private applyEvolutionEffect(nodeId: string): void {
    const effects: Record<string, () => void> = {
      leaf_wide: () => { this.vitalityPerSecond += 0.3; },
      leaf_needle: () => { this.seed.maxHp += 10; },
      leaf_wax: () => { this.seed.maxHp += 5; },
      leaf_c4: () => { this.vitalityPerSecond += 0.5; },
      stem_creeper: () => { /* 领地扩散 - 预留 */ },
      stem_climber: () => { this.vitalityPerSecond += 0.3; },
      stem_tuber: () => { this.seed.maxHp += 15; },
      stem_tendril: () => { /* 攀援稳定性 - 预留 */ },
      root_deep: () => { this.seed.maxHp += 20; },
      root_mycorrhiza: () => { this.vitalityPerSecond += 0.4; },
      reproduce_wind: () => { /* 繁殖范围 - 预留 */ },
      reproduce_insect: () => { this.vitalityPerSecond += 0.3; },
      reproduce_explode: () => { /* 领地扩散 - 预留 */ },
      cam_photosynth: () => { this.vitalityPerSecond += 0.8; },
      seed_dormancy: () => { this.seed.maxHp += 30; },
    };
    const effect = effects[nodeId];
    if (effect) {
      effect();
      // 确保种子血量不超过上限
      this.seed.hp = Math.min(this.seed.hp, this.seed.maxHp);
    }
  }

  private openSeedUpgrade(): void {
    this.buildVitalityUpgradeOptions();
    // 升级面板从种子界面打开 → 关闭时回到种子界面
    this.upgradePanel.setOnClose(() => {
      this.seedPanel.updateVitality(this.vitality);
    });
    this.upgradePanel.show('🌱 种子升级', this.currency, this.vitality);
  }

  private startSeedDialogue(): void {
    this.audio.play('dialogue_chime');

    // 固定对话未用完 → 用固定对话
    const d = this.dialogueSystem.getCurrentDialogue();
    if (d) {
      this.gamePaused = true;
      this.seedPanel.show(
        this.vitality,
        this.dialogueSystem.personalityName,
        d.text,
        d.options.map(o => ({ text: o.text })),
        (index) => { this.handleDialogueChoice(index); },
        () => { this.openSeedUpgrade(); },
      );
      return;
    }

    // 固定对话用尽 → AI 对话
    if (!this.aiDialogue.canTalk) return;
    this.gamePaused = true;

    const aiOptions = [
      { text: '聊聊生命的意义', keywords: ['生命', '存在', '意义'] },
      { text: '聊聊星星和宇宙', keywords: ['星星', '宇宙', '太空'] },
      { text: '问问你在想什么', keywords: ['家', '归宿', '种子'] },
      { text: '给你打打气', keywords: ['谢谢', '感谢', '勇敢'] },
    ];

    const greetings = ['我一直在想你什么时候会来找我聊天……', '今天的星星特别亮，你看到了吗？', '你来得正好，我有好多话想跟你说。'];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    this.seedPanel.show(
      this.vitality,
      this.dialogueSystem.personalityName,
      greeting,
      aiOptions.map(o => ({ text: o.text })),
      (index) => {
        const chosen = aiOptions[index];
        const result = this.aiDialogue.generate(chosen.keywords);
        this.vitality += result.reward;
        this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
        this.seedPanel.updateVitality(this.vitality);

        if (result.buffType !== BuffType.NONE) {
          this.activeBuff = result.buffType;
          this.buffTimer = 12;
        }

        this.seedPanel.showResult(`💬 ${result.text}`, '#88ddff');
        setTimeout(() => {
          this.seedPanel.hide();
          this.gamePaused = false;
        }, 2000);
      },
      () => { this.openSeedUpgrade(); },
    );
  }

  private handleDialogueChoice(index: number): void {
    const result = this.dialogueSystem.selectOption(index);
    if (!result) { this.seedPanel.hide(); this.gamePaused = false; return; }

    if (result.correct) {
      this.seedPanel.showResult(`✓ +${result.reward} 活性！`, '#44ff44');
      this.vitality += result.reward;
      this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
      this.seedPanel.updateVitality(this.vitality);
      if (result.buffType !== BuffType.NONE) {
        this.activeBuff = result.buffType;
        this.buffTimer = 15;
      }
    } else {
      this.seedPanel.showResult(`× +${result.reward} 活性（安慰奖）`, '#ff8844');
      this.vitality += result.reward;
      this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;
      this.seedPanel.updateVitality(this.vitality);
    }

    setTimeout(() => {
      this.seedPanel.hide();
      this.gamePaused = false;
    }, 1200);
  }

  /** 更新安全区边界线（矩形顶点） */
  private updateSafeZoneLine(): void {
    const b = this.currentBounds;
    const z = 0;
    const attr = this.safeZoneLine.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    arr[0] = b.minX; arr[1] = b.minY; arr[2] = z;
    arr[3] = b.maxX; arr[4] = b.minY; arr[5] = z;
    arr[6] = b.maxX; arr[7] = b.maxY; arr[8] = z;
    arr[9] = b.minX; arr[10] = b.maxY; arr[11] = z;
    arr[12] = b.minX; arr[13] = b.minY; arr[14] = z;
    attr.needsUpdate = true;
  }

  private toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.gridHelper.visible = this.editMode;
    for (const label of this.axisLabels) {
      label.visible = this.editMode;
    }
    if (this.editMode) {
      this.editModePanel.show();
    } else {
      this.editModePanel.hide();
    }
  }

  private registerEditParams(): void {
    const map = new Map<string, { get: () => number; set: (v: number) => void }>();

    const reg = (key: string, get: () => number, set: (v: number) => void) => { map.set(key, { get, set }); };
    const weapon = (i: number) => this.weapons[i] as any;

    // 列车
    reg('train_speed', () => this.train.speed, v => { this.train.speed = v; });
    reg('train_hp', () => this.train.hp, v => { this.train.hp = v; this.updateTrainHpBar(); });
    reg('train_maxHp', () => this.train.maxHp, v => { this.train.maxHp = v; this.updateTrainHpBar(); });
    reg('train_carCount', () => 5, v => {});
    reg('train_carSpacing', () => 0.1, v => {});
    reg('train_armorUpgradeHp', () => 30, v => {});
    reg('train_repairAmount', () => 40, v => {});
    reg('train_repairCost', () => 25, v => {});

    // 玩家
    reg('player_hp', () => this.playerHP, v => { this.playerHP = v; this.hpHUD.textContent = `HP: ${this.playerHP}`; });
    reg('player_speedBase', () => 2, v => {});
    reg('player_speedPerLv', () => 0.5, v => {});
    reg('player_speedBuffMultiplier', () => 1.5, v => {});
    reg('player_interactRange', () => 4, v => {});

    // 种子
    reg('seed_hp', () => this.seed.hp, v => { this.seed.hp = v; });
    reg('seed_maxHp', () => this.seed.maxHp, v => { this.seed.maxHp = v; });
    reg('seed_vitalityPerSecond', () => this.vitalityPerSecond, v => { this.vitalityPerSecond = v; });
    reg('seed_dialogueCooldown', () => 30, v => {});
    reg('seed_aiDialogueCooldown', () => 15, v => {});
    reg('seed_dialogueCorrectRewardMin', () => 50, v => {});
    reg('seed_dialogueCorrectRewardMax', () => 100, v => {});
    reg('seed_dialogueWrongReward', () => 15, v => {});
    reg('seed_buffDuration', () => 15, v => {});

    // 安全区
    reg('safeZone_margin', () => this.safeZone.margin, v => { this.safeZone.margin = v; });
    reg('safeZone_countdown', () => this.safeZone.maxCountdown, v => { this.safeZone.maxCountdown = v; });
    reg('safeZone_damagePerTick', () => this.safeZone.hpDamagePerTick, v => { this.safeZone.hpDamagePerTick = v; });
    reg('safeZone_timePerLv', () => 5, v => {});

    // 经济
    reg('eco_currency', () => this.currency, v => { this.currency = Math.floor(v); this.coinHUD.textContent = `金币: ${this.currency}`; });
    reg('eco_vitality', () => this.vitality, v => { this.vitality = Math.floor(v); this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`; });
    reg('eco_asteroidReward', () => 10, v => {});

    // 陨石
    reg('asteroid_spawnInterval', () => this.spawnInterval, v => { this.spawnInterval = v; });
    reg('asteroid_radiusMin', () => 0.3, v => {});
    reg('asteroid_radiusMax', () => 0.8, v => {});
    reg('asteroid_speedXBase', () => -1, v => {});
    reg('asteroid_speedXRange', () => 2, v => {});
    reg('asteroid_speedYRange', () => 0.5, v => {});
    reg('asteroid_hpPerRadius', () => 20, v => {});
    reg('asteroid_collisionDamage', () => 8, v => {});
    reg('asteroid_spawnYRange', () => 35, v => {});

    // 激光
    reg('laser_damage', () => weapon(0).damage, v => { weapon(0).damage = v; });
    reg('laser_damagePerLv', () => 5, v => {});
    reg('laser_range', () => weapon(0).maxRange, v => { weapon(0).maxRange = v; });
    reg('laser_rangePerLv', () => 1, v => {});
    reg('laser_beamWidth', () => weapon(0).beamWidth, v => { weapon(0).beamWidth = v; });
    reg('laser_upgradeCostBase', () => 20, v => {});

    // 安魂曲
    reg('requiem_maxMagazine', () => weapon(2).maxMagazine, v => { weapon(2).maxMagazine = Math.floor(v); });
    reg('requiem_reloadTime', () => weapon(2).reloadTime, v => { weapon(2).reloadTime = v; });
    reg('requiem_damage', () => weapon(2).damage, v => { weapon(2).damage = v; });
    reg('requiem_range', () => weapon(2).range, v => { weapon(2).range = v; });
    reg('requiem_bulletSpeed', () => weapon(2).bulletSpeed, v => { weapon(2).bulletSpeed = v; });
    reg('requiem_fireInterval', () => weapon(2).fireInterval, v => { weapon(2).fireInterval = v; });

    // 导弹
    reg('missile_maxStock', () => weapon(3).maxStock, v => { weapon(3).maxStock = Math.floor(v); });
    reg('missile_blastRadius', () => weapon(3).blastRadius, v => { weapon(3).blastRadius = v; });
    reg('missile_aimTime', () => weapon(3).aimTime, v => { weapon(3).aimTime = v; });
    reg('missile_restockInterval', () => 60, v => {});
    reg('missile_blastPerLv', () => 0.5, v => {});
    reg('missile_aimPerLv', () => 0.25, v => {});

    // 吸盘枪
    reg('suction_coneLength', () => 6, v => {});
    reg('suction_captureDist', () => 1, v => {});
    reg('suction_maxFlight', () => 15, v => {});
    reg('suction_charge0_time', () => 0.6, v => {});
    reg('suction_charge0_budget', () => 30, v => {});
    reg('suction_charge0_speed', () => 5, v => {});
    reg('suction_charge1_time', () => 1.2, v => {});
    reg('suction_charge1_budget', () => 50, v => {});
    reg('suction_charge1_speed', () => 8, v => {});
    reg('suction_charge2_time', () => 2, v => {});
    reg('suction_charge2_budget', () => 80, v => {});
    reg('suction_charge2_speed', () => 12, v => {});

    // 站点
    reg('station_interval', () => 20, v => {});
    reg('station_spawnAhead', () => 12, v => {});
    reg('station_triggerRadius', () => 3, v => {});
    reg('station_vacuumRadius', () => 4, v => {});
    reg('station_yOffset', () => 5, v => {});

    // 怪物
    reg('monster_spawnInterval', () => Math.max(3, 8 - this.train.group.position.x * 0.002), v => {});
    reg('monster_hp', () => 30, v => {});
    reg('monster_speed', () => 1.2, v => {});
    reg('monster_damage', () => 8, v => {});
    reg('monster_spawnYRange', () => 20, v => {});
    reg('monster_killReward', () => 25, v => {});

    // 陨石分阶
    reg('tier_normalChance', () => 0.6, v => {});
    reg('tier_reinforcedChance', () => 0.25, v => {});
    reg('tier_eliteChance', () => 0.1, v => {});
    reg('tier_goldenChance', () => 0.03, v => {});
    reg('tier_shieldChance', () => 0.02, v => {});
    reg('tier_dropChance', () => 0.03, v => {});

    // 掉落提示
    reg('hud_notificationDuration', () => 1.5, v => {});

    // 事件
    reg('event_intervalBase', () => 15, v => {});
    reg('event_intervalRandom', () => 15, v => {});
    reg('event_xOffset', () => 10, v => {});
    reg('event_yOffsetBase', () => 5, v => {});
    reg('event_yOffsetRandom', () => 4, v => {});
    reg('event_triggerDist', () => 3.5, v => {});
    reg('event_rewardMin', () => 60, v => {});
    reg('event_rewardMax', () => 90, v => {});
    reg('event_vitalityMin', () => 40, v => {});
    reg('event_vitalityMax', () => 80, v => {});

    this.editModePanel.registerAll(map);
  }

  update(dt: number): void {
    const input = getInput();

    // === F 键交互（升级车厢 / 种子对话） ===
    const fDown = input.keys.has('f');
    const trainY = this.train.group.position.y;
    const upgX = this.train.getCarPosition(1);
    const seedX = this.train.getCarPosition(SEED_CAR_INDEX);
    const dUpg = Math.sqrt((this.playerX - upgX) ** 2 + (this.playerY - trainY) ** 2);
    const dSeed = Math.sqrt((this.playerX - seedX) ** 2 + (this.playerY - trainY) ** 2);
    const fixedDialogueAvailable = !!this.dialogueSystem.getCurrentDialogue();
    const aiDialogueAvailable = this.aiDialogue.canTalk;
    const anyDialogueAvailable = fixedDialogueAvailable || aiDialogueAvailable;

    // 取最近的可交互车厢（检测半径内）
    const INTERACT_RANGE = 4;
    const nearest: 'upg' | 'seed' | null =
      dUpg < INTERACT_RANGE || dSeed < INTERACT_RANGE
        ? dUpg <= dSeed ? 'upg' : 'seed'
        : null;

    if (fDown && !this.prevFDown && !this.gamePaused && !this.playerDead) {
      // 优先检测种子车厢事件
      if (nearest === 'seed' && this.seedEventSystem.active) {
        const ev = this.seedEventSystem.tryTrigger();
        if (ev) {
          this.triggerSeedEvent(ev);
        }
      } else if (nearest === 'upg') {
        this.gamePaused = true;
        this.buildCoinUpgradeOptions();
        this.upgradePanel.show('🚂 升级车厢', this.currency, this.vitality);
      } else if (nearest === 'seed') {
        if (anyDialogueAvailable) {
          this.startSeedDialogue();
        } else {
          // 种子在休息，打开新版种子界面
          this.openSeedDialoguePanel();
        }
      } else {
        // 尝试触发航行事件
        const ev = this.eventSystem.tryTrigger(this.playerX, this.playerY);
        if (ev) {
          this.triggerEvent();
        }
      }
    }
    this.prevFDown = fDown;

    // === 车厢靠近提示 HUD ===
    const nearEvent = this.eventSystem.spawned && !this.eventSystem.triggered && !this.eventSystem.active;
    const stationActive = this.stationSystem.active && !this.gamePaused;
    const stationDist = this.stationSystem.playerDist;

    // 种子事件提示优先
    if (nearest === 'seed' && this.seedEventSystem.active && !this.gamePaused) {
      this.upgradePromptHUD.style.display = '';
      const evTitle = this.seedEventSystem.currentEvent?.title || '事件';
      this.upgradePromptHUD.textContent = `按 F ${evTitle}`;
    } else if (nearest === 'upg' && !this.gamePaused) {
      this.upgradePromptHUD.style.display = '';
      this.upgradePromptHUD.textContent = '按 F 打开升级';
    } else if (nearest === 'seed' && !this.gamePaused && !anyDialogueAvailable) {
      this.upgradePromptHUD.style.display = '';
      this.upgradePromptHUD.textContent = '按 F 查看种子';
    } else if (nearest === 'seed' && !this.gamePaused && anyDialogueAvailable) {
      this.upgradePromptHUD.style.display = '';
      this.upgradePromptHUD.textContent = '按 F 和种子对话';
    } else if (stationActive && stationDist <= 5 && nearest === null) {
      this.upgradePromptHUD.style.display = '';
      this.upgradePromptHUD.textContent = stationDist <= 3 ? '🪐 到达空间站' : '🪐 前方空间站';
    } else if (nearEvent && !this.gamePaused && nearest === null) {
      const dist = Math.sqrt((this.playerX - this.eventSystem.eventX) ** 2 + (this.playerY - this.eventSystem.eventY) ** 2);
      if (dist < 4) {
        this.upgradePromptHUD.style.display = '';
        this.upgradePromptHUD.textContent = '按 F 探索事件';
      } else {
        this.upgradePromptHUD.style.display = 'none';
      }
    } else {
      this.upgradePromptHUD.style.display = 'none';
    }

    // === 靠近时显示血条 ===
    // === 玩家血条（固定在右上角） ===
    this.playerHpBar.container.style.display = '';
    this.playerHpBar.container.style.left = '';
    this.playerHpBar.container.style.right = '20px';
    this.playerHpBar.container.style.top = '20px';
    this.playerHpBar.container.style.transform = 'none';
    this.updatePlayerHpBar();

    // === 列车/种子血条（跟随车厢，靠近显示） ===
    const w = window.innerWidth;
    const h = window.innerHeight;
    const BAR_PROXIMITY = 4;
    const locoX = this.train.getCarPosition(0);

    const trainDist = Math.sqrt((this.playerX - locoX) ** 2 + (this.playerY - trainY) ** 2);
    if (trainDist < BAR_PROXIMITY) {
      const trainScreen = worldToScreen(this.camera, locoX, trainY, 2, w, h);
      this.trainHpBar.container.style.display = '';
      this.trainHpBar.container.style.left = `${trainScreen.x}px`;
      this.trainHpBar.container.style.top = `${trainScreen.y}px`;
      this.updateTrainHpBar();
    } else {
      this.trainHpBar.container.style.display = 'none';
    }

    if (dSeed < BAR_PROXIMITY) {
      const sx = this.train.getCarPosition(SEED_CAR_INDEX);
      const sy = this.train.group.position.y;
      const seedScr = worldToScreen(this.camera, sx, sy, 2, w, h);
      this.seedHpBar.container.style.display = '';
      this.seedHpBar.container.style.left = `${seedScr.x}px`;
      this.seedHpBar.container.style.top = `${seedScr.y}px`;
      this.updateSeedHpBar();
    } else {
      this.seedHpBar.container.style.display = 'none';
    }

    // === B 键背包（放在暂停检测之前，支持关闭） ===
    const bDown = input.keys.has('b');
    if (bDown && !this.prevBDown) {
      if (this.inventoryPanel.visible) {
        this.gamePaused = false;
        this.inventoryPanel.hide();
      } else if (!this.gamePaused && !this.playerDead) {
        this.gamePaused = true;
        this.inventoryPanel.show(this.inventory, this);
      }
    }
    this.prevBDown = bDown;

    // === Z 关闭所有面板 ===
    if (input.keys.has('z') && !this.prevZDown) {
      if (this.inventoryPanel.visible) {
        this.gamePaused = false;
        this.inventoryPanel.hide();
      } else if (this.seedEvolutionPanel.visible) {
        this.seedEvolutionPanel.hide();
        this.gamePaused = false;
      } else if (this.seedDialoguePanel.visible) {
        this.seedDialoguePanel.hide();
        this.gamePaused = false;
      } else if (this.upgradePanel.visible) {
        this.upgradePanel.hide();
        // 如果是从种子界面打开的升级，回到种子界面
        if (!this.seedPanel.visible && !this.seedDialoguePanel.visible) {
          this.gamePaused = false;
        }
      } else if (this.seedPanel.visible) {
        this.gamePaused = false;
        this.seedPanel.hide();
      } else if (this.dialoguePanel.visible) {
        this.dialoguePanel.hide();
        this.gamePaused = false;
      }
    }
    this.prevZDown = input.keys.has('z');

    // === 暂停时跳过游戏逻辑 ===
    if (this.gamePaused) return;

    // === 玩家死亡 → 复活倒计时（不暂停游戏，仅禁止操作） ===
    if (this.playerDead) {
      this.respawnTimer -= dt;
      const respawnText = this.respawnOverlay?.querySelector('#respawn-text');
      if (respawnText) respawnText.textContent = `复活倒计时 ${Math.ceil(this.respawnTimer)}s`;
      if (this.respawnTimer <= 0) {
        this.playerDead = false;
        this.playerHP = 100;
        this.hpHUD.textContent = `HP: ${this.playerHP}`;
        this.invincibleTimer = 3;
        this.playerX = this.train.group.position.x;
        this.playerY = this.train.group.position.y;
        if (this.respawnOverlay) this.respawnOverlay.style.display = 'none';
      }
      // 不 return，继续更新游戏世界（死亡惩罚：列车无人保护）
    }

    let speed = 2 + (this.playerSpeedLv - 1) * 0.5;
    if (this.activeBuff === BuffType.SPEED) speed *= 1.5;
    if (!this.playerDead) {
      if (input.keys.has('w')) this.playerY += speed * dt;
      if (input.keys.has('s')) this.playerY -= speed * dt;
      if (input.keys.has('a')) this.playerX -= speed * dt;
      if (input.keys.has('d')) this.playerX += speed * dt;
    }

    this.player.setPosition(this.playerX, this.playerY);
    this.train.update(dt);

    // 种子跟随种子车厢 + 放在车厢顶部
    const seedWorldX = this.train.getCarPosition(SEED_CAR_INDEX);
    this.seed.group.position.set(seedWorldX, -2, 1.5);
    this.seedVisuals.update(dt);
    this.vitality += this.vitalityPerSecond * dt;
    this.vitalityHUD.textContent = `活性: ${Math.floor(this.vitality)}`;

    // === 种子事件系统 ===
    const nearSeed = dSeed < 6;
    this.seedEventSystem.update(dt, nearSeed);

    // === 站点系统 ===
    this.stationSystem.update(dt, this.train.speed, this.playerX, this.playerY,
      this.train.group.position.x, this.train.group.position.y, this, this.seedVisuals);

    if (!this.stationSystem.active) {
      this.stationDistanceHUD.textContent = `下次站点: ${Math.ceil(this.stationSystem.getRemainingDistance())}`;
      this.stationDistanceHUD.style.display = '';
    } else {
      this.stationDistanceHUD.style.display = 'none';
    }

    // === 航行事件系统 ===
    if (!this.eventSystem.active && !this.gamePaused) {
      const pos = this.eventSystem.update(dt, this.train.speed, this.playerX);

      if (pos && !this.eventSystem.triggered) {
        this.eventMarker.setPosition(pos.x, pos.y);
        this.eventMarker.show();
        this.eventMarker.update(dt);
        const dist = Math.sqrt((this.playerX - pos.x) ** 2 + (this.playerY - pos.y) ** 2);
        this.eventDistanceHUD.textContent = `事件: ${Math.ceil(dist)}`;
        this.eventDistanceHUD.style.display = '';
      } else {
        this.eventMarker.hide();
        this.eventDistanceHUD.style.display = 'none';
      }
    }

    updateCamera(this.camera, this.playerX, this.playerY);

    // === 动态生成 ===
    this.spawnTimer += dt;
    const dist = this.train.group.position.x;
    this.spawnInterval = Math.max(0.5, 1.5 - dist * 0.001);
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    this.monsterSpawnTimer += dt;
    const monsterInterval = Math.max(3, 8 - dist * 0.002);
    if (this.monsterSpawnTimer >= monsterInterval) {
      this.monsterSpawnTimer = 0;
      const cameraRight = this.camera.position.x + 20;
      const y = this.train.group.position.y + (Math.random() - 0.5) * 20;
      this.monsters.push(new Monster(this.scene, cameraRight, y));
    }

    for (const a of this.asteroids) {
      a.update(dt);
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.update(dt, this.train.group.position.x, this.train.group.position.y);
      // 检测怪物与种子碰撞
      const seedX = this.train.getCarPosition(SEED_CAR_INDEX);
      const seedY = this.train.group.position.y;
      const dx = m.x - seedX;
      const dy = m.y - seedY;
      if (dx * dx + dy * dy < 9) {
        const seedDied = this.seed.takeDamage(8);
        this.particles.emit(m.x, m.y, 10, 0.8, 0.2, 0.2);
        triggerScreenShake(this.camera, 0.1);
        this.audio.play('laser_hit');
        m.remove();
        this.monsters.splice(i, 1);
        if (seedDied) {
          this.gameOver('种子枯萎', '宇宙最后的火种熄灭了…');
          return;
        }
      }
    }

    // === 移除超出屏幕的实体 ===
    const removeLeft = this.camera.position.x - 30;
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      if (this.asteroids[i].x < removeLeft) {
        this.asteroids[i].destroyAll();
        this.asteroids.splice(i, 1);
      }
    }
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      if (this.monsters[i].x < removeLeft) {
        this.monsters[i].remove();
        this.monsters.splice(i, 1);
      }
    }

    // === 陨石-列车碰撞检测 ===
    this.checkTrainCollisions();

    // === 所有武器后台更新（换弹/冷却等） ===
    for (const w of this.weapons) {
      w.updatePassive?.(dt);
    }

    // === 安魂曲瞄准三角 ===
    const WEAPON_REQUIEM = 2;
    if (this.currentWeaponIndex === WEAPON_REQUIEM) {
      const aimWorld = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
      const dx = aimWorld.x - this.playerX;
      const dy = aimWorld.y - this.playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.aimTriangle.style.display = dist <= 20 ? '' : 'none';
      this.aimTriangle.style.left = input.mouseX + 'px';
      this.aimTriangle.style.top = input.mouseY + 'px';
    } else {
      this.aimTriangle.style.display = 'none';
    }

    // === Buff / 无敌计时器 ===
    if (this.speedBuffTimer > 0) this.speedBuffTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

    // === Q/E 武器切换（死亡时不可切换） ===
    const qDown = input.keys.has('q');
    const eDown = input.keys.has('e');
    if (!this.playerDead && qDown && !this.prevQDown) {
      this.weapons[this.currentWeaponIndex].onSwitchAway();
      this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    }
    if (eDown && !this.prevEDown) {
      this.weapons[this.currentWeaponIndex].onSwitchAway();
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    }
    this.prevQDown = qDown;
    this.prevEDown = eDown;

    // === 当前武器更新（死亡时不可操作） ===
    if (!this.playerDead) {
      const world = this.screenToWorld(this.mouseWorld.x, this.mouseWorld.y);
      this.weapons[this.currentWeaponIndex].update({
        dt,
        input,
        playerX: this.playerX,
        playerY: this.playerY,
        aimX: world.x,
        aimY: world.y,
        asteroids: this.asteroids,
        monsters: this.monsters,
        particles: this.particles,
        camera: this.camera,
        audio: this.audio,
        addCurrency: (amount, wx, wy) => {
          this.addCurrency(amount, wx, wy);
          this.totalKills++;
        },
        addEvolutionResource: (amount, wx, wy) => {
          this.evolutionResource += amount;
          this.evolutionHUD.textContent = `🌀 进化因子: ${this.evolutionResource}`;
        },
        screenShake: (intensity) => triggerScreenShake(this.camera, intensity),
        addItem: (id) => this.inventory.addItem(id),
        showDropNotification: (name) => this.showDropNotification(name),
      });
    }

    // === 更新武器 HUD ===
    const wi = this.currentWeaponIndex;
    if (this.playerDead) {
      this.weaponHUD.textContent = '💀 阵亡';
    } else if (wi === 0) {
      this.weaponHUD.textContent = '激光';
    } else if (wi === 1) {
      this.weaponHUD.textContent = '吸盘枪';
    } else if (wi === 2) {
      const r = this.weapons[2] as Requiem;
      this.weaponHUD.textContent = `安魂曲 ${r.magazine}/${r.maxMagazine}`;
      if (r.isReloading) {
        this.weaponHUD.textContent += ` 换弹中...${r.reloadProgress.toFixed(0)}%`;
      }
    } else if (wi === 3) {
      const m = this.weapons[3] as Missile;
      this.weaponHUD.textContent = `导弹: ${m.stock}`;
    }

    // === 对话系统更新 ===
    this.dialogueSystem.update(dt);
    this.aiDialogue.update(dt);
    this.aiDialogue.setStage(this.seedVisuals.getStage());

    const fixedAvailable = !!this.dialogueSystem.getCurrentDialogue();
    const aiAvailable = this.aiDialogue.canTalk;
    if (!fixedAvailable && !aiAvailable && !this.gamePaused) {
      this.dialogueCoolDownHUD.textContent = `种子冷却: ${this.aiDialogue.coolDownLeft}s`;
      this.dialogueCoolDownHUD.style.display = '';
    } else if (!this.dialogueSystem.canTalk && fixedAvailable && !this.gamePaused) {
      this.dialogueCoolDownHUD.textContent = `种子冷却: ${this.dialogueSystem.coolDownLeft}s`;
      this.dialogueCoolDownHUD.style.display = '';
    } else {
      this.dialogueCoolDownHUD.style.display = 'none';
    }

    // === Buff 计时 ===
    if (this.activeBuff !== BuffType.NONE) {
      this.buffTimer -= dt;
      if (this.buffTimer <= 0) {
        this.activeBuff = BuffType.NONE;
        (this.weapons[0] as Laser).damage = 10 + (this.laserDamageLv - 1) * 5;
      } else if (this.activeBuff === BuffType.DAMAGE) {
        (this.weapons[0] as Laser).damage = 10 + (this.laserDamageLv - 1) * 5 + 10;
      }
    }

    this.particles.update(dt);

    // === 安全区检测与倒计时 ===
    const trainYW = this.train.group.position.y;
    this.safeZone.check(
      this.playerX, this.playerY,
      this.train.positionX, trainYW,
      this.train.width, 1.6,
    );

    const damage = this.safeZone.update(dt);
    if (damage > 0 && this.invincibleTimer <= 0 && !this.playerDead) {
      this.playerHP -= damage;
      this.hpHUD.textContent = `HP: ${this.playerHP}`;
      triggerScreenShake(this.camera, 0.1);
      if (this.playerHP <= 0 && !this.playerDead) {
        this.startRespawn();
      }
    }

    // 更新安全区矩形世界坐标（用于绘制边界线）
    const halfH = 1.6 / 2;
    this.currentBounds = {
      minX: this.train.positionX - this.safeZone.margin,
      minY: trainYW - halfH - this.safeZone.margin,
      maxX: this.train.positionX + this.train.width + this.safeZone.margin,
      maxY: trainYW + halfH + this.safeZone.margin,
    };
    this.updateSafeZoneLine();

    // 更新倒计时 HUD
    if (!this.safeZone.isInside) {
      if (this.safeZone.timeLeft > 0) {
        this.countdownHUD.textContent = `危险! 离开安全区 ${this.safeZone.timeLeft}s`;
      } else {
        this.countdownHUD.textContent = '危险! 持续扣血中!';
        this.countdownHUD.style.color = '#ff0000';
      }
      this.countdownHUD.style.display = '';
    } else {
      this.countdownHUD.style.display = 'none';
      this.countdownHUD.style.color = '#ff4444';
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
