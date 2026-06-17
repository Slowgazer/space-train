/**
 * 安全区与倒计时系统
 * 管理玩家与列车安全区域的距离检测和倒计时逻辑
 */
export class SafeZoneSystem {
  margin = 3;
  maxCountdown = 10;
  hpDamagePerTick = 10;

  private currentCountdown = 10;
  private _isInside = true;
  private countdownExpired = false;
  private continuousTimer = 0;

  check(
    playerX: number, playerY: number,
    trainX: number, trainY: number,
    trainWidth: number, trainHeight: number,
  ): void {
    const halfH = trainHeight / 2;
    const minX = trainX - this.margin;
    const maxX = trainX + trainWidth + this.margin;
    const minY = trainY - halfH - this.margin;
    const maxY = trainY + halfH + this.margin;
    this._isInside = playerX >= minX && playerX <= maxX && playerY >= minY && playerY <= maxY;
  }

  update(dt: number): number {
    if (this._isInside) {
      this.currentCountdown = this.maxCountdown;
      this.countdownExpired = false;
      this.continuousTimer = 0;
      return 0;
    }

    if (!this.countdownExpired) {
      this.currentCountdown -= dt;
      if (this.currentCountdown <= 0) {
        this.countdownExpired = true;
        this.continuousTimer = 0;
        return this.hpDamagePerTick;
      }
      return 0;
    }

    this.continuousTimer += dt;
    if (this.continuousTimer >= 1) {
      this.continuousTimer -= 1;
      return this.hpDamagePerTick;
    }
    return 0;
  }

  get isInside(): boolean {
    return this._isInside;
  }

  get timeLeft(): number {
    if (this.countdownExpired) return 0;
    return Math.ceil(this.currentCountdown);
  }
}
