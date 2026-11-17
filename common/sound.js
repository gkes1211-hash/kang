// 체육시간 게임들이 같이 쓰는 소리: 효과음, 짧은 한국어 목소리, 기기 안에서 만드는 배경음악.
let ac = null;
export function unlockAudio() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch { ac = null; }
  return ac;
}

export function beep(freq, dur = 0.12, type = 'sine', vol = 0.18, when = 0) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  count: () => beep(660, 0.12, 'square', 0.08),
  go: () => beep(990, 0.25, 'square', 0.1),
  good: (n = 0) => beep(523 * 2 ** (Math.min(n, 24) / 24), 0.1, 'triangle', 0.18),
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.16, 'triangle', 0.2, i * 0.08)),
  fail: () => { beep(200, 0.3, 'sawtooth', 0.12); beep(120, 0.4, 'sawtooth', 0.12, 0.1); },
  pop: () => beep(880, 0.06, 'square', 0.08),
};

let koVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  koVoice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('ko')) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}
export function speak(text, on = true) {
  if (!on || !koVoice) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = koVoice;
    u.lang = koVoice.lang;
    u.rate = 1.1;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  } catch { /* 목소리가 안 나와도 게임은 된다 */ }
}
export function hush() { try { speechSynthesis.cancel(); } catch { /* 무시 */ } }

// 배경음악: 코드 진행 위에 베이스·아르페지오·작은 북을 잔잔하게.
// getBpm(): 지금 빠르기, getTense(): true 면 하이햇이 빨라져 두근두근
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
export class Music {
  constructor({ chords, getBpm = () => 112, getTense = () => false, volume = 0.5 }) {
    Object.assign(this, { chords, getBpm, getTense, volume, timer: 0, master: null, noise: null, next: 0, step: 0 });
  }

  start() {
    if (!ac || this.timer) return;
    this.master = ac.createGain();
    this.master.gain.setValueAtTime(0.0001, ac.currentTime);
    this.master.gain.exponentialRampToValueAtTime(this.volume, ac.currentTime + 1.5);
    this.master.connect(ac.destination);
    if (!this.noise) {
      const len = Math.floor(ac.sampleRate * 0.2);
      this.noise = ac.createBuffer(1, len, ac.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    this.next = ac.currentTime + 0.1;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = 0;
    const m = this.master;
    this.master = null;
    if (m && ac) {
      const t = ac.currentTime;
      m.gain.cancelScheduledValues(t);
      m.gain.setValueAtTime(m.gain.value, t);
      m.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      setTimeout(() => m.disconnect(), 600);
    }
  }

  note(freq, t, dur, type, vol, cutoff) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (cutoff) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      g.connect(f);
      out = f;
    }
    o.connect(g);
    out.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  kick(t) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.2);
  }

  hat(t, vol) {
    const s = ac.createBufferSource();
    s.buffer = this.noise;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + 0.06);
  }

  schedule() {
    if (!this.master) return;
    const sp = 60 / this.getBpm() / 4; // 16분음표
    const tense = this.getTense();
    while (this.next < ac.currentTime + 0.15) {
      const t = this.next;
      const s = this.step % (this.chords.length * 16);
      const i = s % 16;
      const chord = this.chords[Math.floor(s / 16)];
      if (i % 8 === 0) this.kick(t);
      if (i % 4 === 2) this.hat(t, 0.05);
      else if (tense && i % 2 === 1) this.hat(t, 0.03);
      if (i % 2 === 0) this.note(mtof(chord[0] - 24 + (i % 4 === 2 ? 12 : 0)), t, sp * 1.7, 'triangle', 0.13);
      const a = ARP[i % 8];
      this.note(mtof((a === 3 ? chord[0] + 12 : chord[a]) + 12), t, sp * 0.9, 'square', 0.022, 2200);
      if (i === 0) chord.forEach((m) => this.note(mtof(m), t, sp * 15, 'sawtooth', 0.012, 900));
      this.step += 1;
      this.next += sp;
    }
  }
}

// 설정 저장 (게임마다 앞글자를 달리 쓴다)
export function makeStore(prefix) {
  return {
    get(k, d) { try { return localStorage.getItem(`${prefix}.${k}`) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`${prefix}.${k}`, v); } catch { /* 저장 못 해도 게임은 된다 */ } },
  };
}
