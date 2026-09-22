import { EFFECTS, MELODY, BASS, frequency } from './audio-score.js';
const KEY = 'sold-out-audio-v1';
const clamp = (v) => Math.max(0, Math.min(1, v));
export class AudioSystem {
  constructor(options = {}) {
    this.context = null;
    this.voices = new Set();
    this.unlockRequest = 0;
    this.hidden = false;
    this.error = '';
    this._enabled = true;
    this.volumes = { master: 0.8, effects: 0.85, music: 0.25 };
    this.nextMusic = 0;
    this.beat = 0;
    this.lastEffects = new Map();
    this.factory =
      options.contextFactory ||
      (() => {
        const C = globalThis.AudioContext || globalThis.webkitAudioContext;
        return C ? new C() : null;
      });
    try {
      this.storage = Object.hasOwn(options, 'storage') ? options.storage : globalThis.localStorage;
      const saved = JSON.parse(this.storage?.getItem(KEY) || 'null');
      if (saved) {
        if (typeof saved.enabled === 'boolean') this._enabled = saved.enabled;
        for (const k of Object.keys(this.volumes))
          if (Number.isFinite(saved.volumes?.[k])) this.volumes[k] = clamp(saved.volumes[k]);
      }
    } catch {
      this.storage = null;
    }
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = !!value;
    if (!this._enabled) this.stop();
    this.applyVolumes();
    this.persist();
  }
  persist() {
    try {
      this.storage?.setItem(KEY, JSON.stringify({ enabled: this.enabled, volumes: this.volumes }));
    } catch {}
  }
  setVolume(channel, value) {
    if (!Object.hasOwn(this.volumes, channel) || !Number.isFinite(value)) return;
    this.volumes[channel] = clamp(value);
    this.applyVolumes();
    this.persist();
  }
  applyVolumes() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.master.gain.setValueAtTime(this.enabled && !this.hidden ? this.volumes.master : 0, t);
    this.effects.gain.setValueAtTime(this.volumes.effects, t);
    this.music.gain.setValueAtTime(this.volumes.music, t);
  }
  async unlock() {
    const request = ++this.unlockRequest;
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = this.factory();
        if (!this.context) {
          this.error = '이 브라우저는 오디오를 지원하지 않아요.';
          return false;
        }
        const c = this.context;
        this.master = c.createGain();
        this.effects = c.createGain();
        this.music = c.createGain();
        this.analyser = c.createAnalyser();
        this.analyser.fftSize = 256;
        this.samples = new Float32Array(256);
        this.effects.connect(this.master);
        this.music.connect(this.master);
        this.master.connect(this.analyser);
        this.analyser.connect(c.destination);
        this.applyVolumes();
      }
      if (this.context.state !== 'running') {
        this.error = '오디오 활성화 대기 중 · 소리 테스트로 다시 시도하세요.';
        // A pending resume must never block a later trusted gesture.
        await this.context.resume();
      }
      if (request === this.unlockRequest)
        this.error =
          this.context.state === 'running' ? '' : '소리 테스트를 눌러 오디오를 활성화해주세요.';
      return this.context.state === 'running';
    } catch {
      if (request === this.unlockRequest)
        this.error = '오디오 활성화가 보류됐어요. 소리 테스트를 다시 눌러주세요.';
      return false;
    }
  }
  tone(freq, start, duration, volume, wave, bus) {
    if (this.voices.size >= 64) return;
    const c = this.context,
      osc = c.createOscillator(),
      gain = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(bus);
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
  play(type) {
    const score = EFFECTS[type];
    if (
      !score ||
      !this.enabled ||
      this.hidden ||
      this.context?.state !== 'running' ||
      !this.volumes.master ||
      !this.volumes.effects
    )
      return false;
    const now = this.context.currentTime;
    if (now - (this.lastEffects.get(type) ?? -Infinity) < (type === 'click' ? 0.06 : 0.18))
      return false;
    this.lastEffects.set(type, now);
    score.notes.forEach((freq, i) =>
      this.tone(
        freq,
        now + 0.01 + i * score.duration * 0.72,
        score.duration,
        score.volume,
        score.wave,
        this.effects,
      ),
    );
    return true;
  }
  update() {
    if (
      !this.enabled ||
      this.hidden ||
      this.context?.state !== 'running' ||
      !this.volumes.music ||
      !this.volumes.master
    )
      return;
    const now = this.context.currentTime;
    if (this.nextMusic < now) this.nextMusic = now + 0.05;
    while (this.nextMusic < now + 0.2) {
      this.tone(
        frequency(MELODY[this.beat % MELODY.length]),
        this.nextMusic,
        0.65,
        0.17,
        'triangle',
        this.music,
      );
      if (this.beat % 4 === 0)
        this.tone(
          frequency(BASS[Math.floor(this.beat / 8) % 4]),
          this.nextMusic,
          1.4,
          0.13,
          'sine',
          this.music,
        );
      this.beat++;
      this.nextMusic += 0.48;
    }
  }
  stop() {
    for (const osc of [...this.voices]) {
      try {
        osc.stop();
      } catch {}
    }
    this.nextMusic = 0;
    this.lastEffects.clear();
  }
  setHidden(hidden) {
    this.hidden = hidden;
    if (hidden) this.stop();
    this.applyVolumes();
  }
  get level() {
    if (!this.analyser || this.context?.state !== 'running') return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.sqrt(this.samples.reduce((sum, v) => sum + v * v, 0) / this.samples.length);
  }
  get status() {
    if (!this.enabled) return '전체 음소거';
    if (!this.volumes.master) return '전체 음량 0%';
    if (this.error) return this.error;
    return this.context?.state === 'running'
      ? '오디오 활성화됨'
      : '첫 클릭 또는 소리 테스트로 시작';
  }
}
