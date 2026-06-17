/**
 * 程序化音效管理器
 * 使用 Web Audio API 生成所有音效，无需外部音频文件
 */
export type SoundId =
  | 'laser_fire' | 'laser_hit'
  | 'suction_catch' | 'suction_launch'
  | 'requiem_fire' | 'requiem_hit'
  | 'missile_launch' | 'missile_explode'
  | 'dialogue_chime'
  | 'coin_pickup' | 'ui_click'
  | 'ambient';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume = 0.3;
  private ambientNode: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private initialized = false;
  private volumeHUD: HTMLElement;

  constructor() {
    this.volumeHUD = document.createElement('div');
    this.volumeHUD.id = 'audio-volume';
    this.volumeHUD.style.cssText =
      'position:absolute;bottom:20px;right:20px;z-index:100;' +
      'color:#888;font-size:14px;font-family:monospace;pointer-events:none;';
    this.volumeHUD.textContent = `🔊 ${Math.round(this._volume * 100)}%`;
    document.body.appendChild(this.volumeHUD);
  }

  get volume(): number { return this._volume; }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
    this.volumeHUD.textContent = `🔊 ${Math.round(this._volume * 100)}%`;
  }

  /** 初始化 AudioContext（需用户交互后调用） */
  init(): void {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
    this.startAmbient();
  }

  /** 播放音效 */
  play(id: SoundId): void {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const out = this.masterGain;

    switch (id) {
      case 'laser_fire': {
        // 持续高频振荡扫描
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
        break;
      }
      case 'laser_hit': {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        src.connect(g).connect(out);
        src.start();
        break;
      }
      case 'suction_catch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
        break;
      }
      case 'suction_launch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        const noise = ctx.createBufferSource();
        const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
        noise.buffer = nBuf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.1, ctx.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain).connect(out);
        noise.connect(ng).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
        noise.start();
        break;
      }
      case 'requiem_fire': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        const noise = ctx.createBufferSource();
        const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length) * 0.5;
        noise.buffer = nBuf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.15, ctx.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain).connect(out);
        noise.connect(ng).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
        noise.start();
        break;
      }
      case 'requiem_hit': {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          const t = i / d.length;
          d[i] = (Math.random() * 2 - 1) * (1 - t) * (i < d.length / 2 ? 1 : 0.4);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        og.gain.setValueAtTime(0.1, ctx.currentTime);
        og.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        src.connect(g).connect(out);
        osc.connect(og).connect(out);
        src.start();
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        break;
      }
      case 'missile_launch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
        break;
      }
      case 'missile_explode': {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          const t = i / d.length;
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * 2;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 1);
        og.gain.setValueAtTime(0.2, ctx.currentTime);
        og.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        src.connect(g).connect(out);
        osc.connect(og).connect(out);
        src.start();
        osc.start(); osc.stop(ctx.currentTime + 1);
        break;
      }
      case 'dialogue_chime': {
        [600, 800, 1000].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const t = ctx.currentTime + i * 0.12;
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
          osc.connect(gain).connect(out);
          osc.start(t); osc.stop(t + 0.3);
        });
        break;
      }
      case 'coin_pickup': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
        break;
      }
      case 'ui_click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
        osc.connect(gain).connect(out);
        osc.start(); osc.stop(ctx.currentTime + 0.03);
        break;
      }
    }
  }

  /** 启动背景空间嗡鸣 */
  private startAmbient(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.ambientNode = ctx.createOscillator();
    this.ambientGain = ctx.createGain();
    this.ambientNode.type = 'sine';
    this.ambientNode.frequency.value = 55;
    this.ambientGain.gain.setValueAtTime(0.015, ctx.currentTime);
    this.ambientNode.connect(this.ambientGain).connect(this.masterGain!);
    this.ambientNode.start();
  }

  /** 停止背景嗡鸣 */
  stopAmbient(): void {
    this.ambientNode?.stop();
    this.ambientNode = null;
    this.ambientGain = null;
  }

  /** 销毁 */
  destroy(): void {
    this.stopAmbient();
    this.ctx?.close();
    this.ctx = null;
    this.initialized = false;
    this.volumeHUD.remove();
  }
}
