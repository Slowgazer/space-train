import { Station } from '../entities/Station';
import { StationPanel } from '../ui/StationPanel';
import { PlanetSelectionPanel } from '../ui/PlanetSelectionPanel';
import { PLANETS, PLANETS_PER_CHOICE, PlanetDef } from '../config/planets';
import { SeedVisuals } from '../entities/SeedVisuals';

const STATION_INTERVAL = 20;
const SPAWN_AHEAD = 12;

export class StationSystem {
  private station: Station;
  private panel: StationPanel;
  private planetPanel: PlanetSelectionPanel;
  private _distanceTraveled = 0;
  private lastStationDistance = 0;
  isNearStation = false;
  playerDist = 999;

  private _active = false;
  private onActivate?: () => void;
  private onDeactivate?: () => void;
  private panelOpen = false;

  constructor(station: Station) {
    this.station = station;
    this.panel = new StationPanel();
    this.planetPanel = new PlanetSelectionPanel();
  }

  get active(): boolean {
    return this._active;
  }

  get distanceTraveled(): number {
    return this._distanceTraveled;
  }

  setOnActivate(cb: () => void): void {
    this.onActivate = cb;
  }

  setOnDeactivate(cb: () => void): void {
    this.onDeactivate = cb;
  }

  update(dt: number, speed: number, playerX: number, playerY: number, trainX: number, trainY: number, game: any, seedVisuals: SeedVisuals): void {
    if (this.panelOpen) return;

    if (!this._active) {
      this._distanceTraveled += speed * dt;
      const sinceLast = this._distanceTraveled - this.lastStationDistance;

      if (sinceLast >= STATION_INTERVAL) {
        this.spawnStation(trainX, trainY);
      }
    }

    if (this.station.active) {
      const dx = playerX - this.station.x;
      const dy = playerY - this.station.y;
      this.playerDist = Math.sqrt(dx * dx + dy * dy);
      this.isNearStation = this.playerDist <= this.station.vacuumRadius;

      if (this.playerDist <= this.station.triggerRadius && !this.panelOpen && this._active) {
        this.openPanel(game, seedVisuals);
      }
    } else {
      this.isNearStation = false;
      this.playerDist = 999;
    }
  }

  private spawnStation(trainX: number, trainY: number): void {
    this._active = true;

    const side = Math.random() > 0.5 ? 1 : -1;
    const yOffset = 5 + Math.random() * 2;
    const sx = trainX + SPAWN_AHEAD;
    const sy = trainY + side * yOffset;
    this.station.spawn(sx, sy);
  }

  private openPanel(game: any, seedVisuals: SeedVisuals): void {
    this.panelOpen = true;
    this.onActivate?.();

    this.panel.show(
      () => this.onDepart(game, seedVisuals),
      game,
    );
  }

  private onDepart(game: any, seedVisuals: SeedVisuals): void {
    this.panel.hide();

    const shuffled = [...PLANETS].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, PLANETS_PER_CHOICE);

    this.planetPanel.show(options, (chosen: PlanetDef) => {
      chosen.apply(game);
      seedVisuals.recordChoice(chosen.id);

      this.planetPanel.hide();
      this.station.despawn();
      this._active = false;
      this.panelOpen = false;
      this.lastStationDistance = this._distanceTraveled;
      this.isNearStation = false;
      this.playerDist = 999;
      this.onDeactivate?.();
    });
  }

  getRemainingDistance(): number {
    const sinceLast = this._distanceTraveled - this.lastStationDistance;
    return Math.max(0, STATION_INTERVAL - sinceLast);
  }

  forceTrigger(trainX: number, trainY: number): void {
    this.lastStationDistance = this._distanceTraveled - STATION_INTERVAL + 1;
    this.spawnStation(trainX, trainY);
  }
}
