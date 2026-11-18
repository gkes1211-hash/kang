// 노래 연습장: 마이크 소리에서 음 높이 찾기(YIN), 기준음 소리 내기, 음 이름.
// 마이크 소리는 이 기기 안에서 바로 계산만 하고, 저장하거나 어디로 보내지 않는다.
'use strict';

const KO_NOTES = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
const EN_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Notes = {
  a4: 440,
  freq(m) { return this.a4 * 2 ** ((m - 69) / 12); },
  midi(f) { return 69 + 12 * Math.log2(f / this.a4); },
  pc(m) { return ((Math.round(m) % 12) + 12) % 12; },
  oct(m) { return Math.floor(Math.round(m) / 12) - 1; },
  ko(m) { return KO_NOTES[this.pc(m)]; },
  en(m) { return EN_NOTES[this.pc(m)] + this.oct(m); },
  black(m) { return [1, 3, 6, 8, 10].includes(this.pc(m)); },
};

// ---------- 음 높이 찾기: YIN ----------
const MIN_F = 65; // 도2 근처 (낮은 남자 목소리)
const MAX_F = 1100; // 도6 근처 (높은 아이·여자 목소리)
let yinD = null;
function yin(buf, sr) {
  const maxTau = Math.min(Math.floor(sr / MIN_F), (buf.length >> 1));
  const minTau = Math.max(2, Math.floor(sr / MAX_F));
  const n = buf.length - maxTau;
  if (!yinD || yinD.length < maxTau + 2) yinD = new Float32Array(maxTau + 2);
  const d = yinD;
  d[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < n; i++) { const x = buf[i] - buf[i + tau]; s += x * x; }
    run += s;
    d[tau] = run ? (s * tau) / run : 1; // 누적 평균으로 나눈 차이
  }
  let tau = -1;
  for (let t = minTau; t < maxTau; t++) {
    if (d[t] < 0.15) {
      while (t + 1 < maxTau && d[t + 1] < d[t]) t++;
      tau = t; break;
    }
  }
  if (tau < 0) return null;
  // 꼭짓점을 포물선으로 다듬기
  const a = d[tau - 1], b = d[tau], c = d[tau + 1];
  const den = a - 2 * b + c;
  const shift = den ? (a - c) / (2 * den) : 0;
  return { freq: sr / (tau + (Math.abs(shift) < 1 ? shift : 0)), clarity: 1 - b };
}

// ---------- 마이크 ----------
const Mic = {
  ctx: null, stream: null, src: null, analyser: null, buf: null, hist: [], gate: 0.006, openedAt: 0,
  ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  get on() { return !!this.stream; },
  async open() {
    this.ensureCtx();
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('nomic');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.stream = stream;
    this.src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.hist = [];
    this.openedAt = performance.now();
  },
  close() {
    if (!this.stream) return 0;
    this.stream.getTracks().forEach((t) => t.stop());
    try { this.src.disconnect(); } catch { /* 무시 */ }
    this.stream = this.src = this.analyser = null;
    return (performance.now() - this.openedAt) / 1000;
  },
  // 지금 들리는 소리: { rms, voiced, midi, freq }
  read() {
    if (!this.analyser) return { rms: 0, voiced: false };
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sum / this.buf.length);
    if (rms < this.gate) { this.hist = []; return { rms, voiced: false }; }
    const r = yin(this.buf, this.ctx.sampleRate);
    if (!r || r.freq < MIN_F || r.freq > MAX_F) { this.hist.length = Math.max(0, this.hist.length - 1); return { rms, voiced: false }; }
    const m = Notes.midi(r.freq);
    // 가끔 한 옥타브 튀는 값을 가운데 값으로 걸러 낸다
    this.hist.push(m);
    if (this.hist.length > 5) this.hist.shift();
    const sorted = [...this.hist].sort((x, y) => x - y);
    const med = sorted[sorted.length >> 1];
    const midi = Math.abs(m - med) > 0.7 ? med : m;
    return { rms, voiced: true, midi, freq: Notes.freq(midi), clarity: r.clarity };
  },
};

// ---------- 기준음 (부드러운 건반 소리) ----------
const Synth = {
  live: new Set(),
  // midi 음을 dur 초 동안. to 를 주면 그 음까지 미끄러진다.
  note(midi, dur, when = 0, to = null, vol = 0.22) {
    const ctx = Mic.ensureCtx();
    const t = ctx.currentTime + 0.02 + when;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.025);
    g.gain.exponentialRampToValueAtTime(vol * 0.7, t + 0.25);
    g.gain.setValueAtTime(vol * 0.7, Math.max(t + 0.26, t + dur - 0.09));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(ctx.destination);
    const parts = [['triangle', 1, 1], ['sine', 2, 0.25], ['sine', 3, 0.08]];
    const oscs = parts.map(([type, mul, lvl]) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type;
      og.gain.value = lvl;
      o.frequency.setValueAtTime(Notes.freq(midi) * mul, t);
      if (to != null) o.frequency.exponentialRampToValueAtTime(Notes.freq(to) * mul, t + dur);
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
      return o;
    });
    const item = { oscs, g };
    this.live.add(item);
    oscs[0].onended = () => { this.live.delete(item); try { g.disconnect(); } catch { /* 무시 */ } };
  },
  tick(when = 0) { // 박자 똑딱
    const ctx = Mic.ensureCtx();
    const t = ctx.currentTime + 0.02 + when;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 1500; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.06);
  },
  stopAll() {
    for (const it of this.live) { it.oscs.forEach((o) => { try { o.stop(); } catch { /* 무시 */ } }); try { it.g.disconnect(); } catch { /* 무시 */ } }
    this.live.clear();
  },
};
