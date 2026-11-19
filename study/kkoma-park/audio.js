// 꼬마 탐험대 공원의 소리: 배경음악·효과음·목소리를 따로 켜고 끈다.
// 체육시간 공통 소리 도우미(common/sound.js)는 그대로 쓰고, 여기서 켜짐/꺼짐만 살핀다.
import { unlockAudio, beep as rawBeep, sfx as rawSfx, speak as rawSpeak, hush, makeStore } from '../../pe/common/sound.js';

const store = makeStore('kkoma');
export const sound = {
  music: store.get('music', 'on') !== 'off',
  sfx: store.get('sfx', 'on') !== 'off',
  voice: store.get('voice', 'on') !== 'off',
};
export function setSound(key, on) {
  sound[key] = on;
  store.set(key, on ? 'on' : 'off');
  if (key === 'music') { if (on && bgm.wanted) bgm.start(); else bgm.stop(); }
  if (key === 'voice' && !on) hush();
}

export { unlockAudio, hush };
// 효과음 (끄면 조용)
export const beep = (...a) => { if (sound.sfx) rawBeep(...a); };
export const sfx = Object.fromEntries(Object.keys(rawSfx).map((k) => [k, (...a) => { if (sound.sfx) rawSfx[k](...a); }]));
// 건반 소리는 문제를 푸는 데 필요해서 효과음을 꺼도 난다
export const note = (...a) => rawBeep(...a);
// 안내 목소리 (끄면 조용, 글자는 화면에 그대로)
export const speak = (text) => { if (sound.voice) rawSpeak(text, true); };
// 아이가 직접 🔊 를 누르면 목소리를 꺼 두었어도 읽어 준다
export const speakNow = (text) => rawSpeak(text, true);

// ============================================================
// 배경음악: 오르골 같은 종소리 가락 + 통통 튀는 베이스 + 살랑이는 셰이커
// 새로 지은 짧은 노래를 8마디씩 되풀이한다 (가락 있는 판 / 반짝이 판 번갈아)
// ============================================================
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const CHORDS = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48], [48, 52, 55], [41, 45, 48], [43, 47, 50], [48, 52, 55]];
const MELODY = [
  [76, 79, 84, 79, 76, 0, 74, 76], [74, 0, 71, 74, 79, 0, 0, 0], [72, 76, 81, 76, 72, 0, 71, 72], [69, 72, 77, 76, 74, 0, 0, 0],
  [76, 76, 79, 79, 81, 79, 76, 0], [77, 77, 81, 81, 79, 77, 76, 0], [74, 76, 77, 79, 81, 83, 84, 83], [84, 0, 79, 0, 72, 0, 0, 0],
];
const BPM = 100;

class Bgm {
  constructor() { this.timer = 0; this.master = null; this.duckLevel = 1; }
  get ac() { return unlockAudio(); }
  start() {
    const ac = this.ac;
    if (!ac || this.timer || !sound.music) return;
    this.master = ac.createGain();
    this.master.gain.setValueAtTime(0.0001, ac.currentTime);
    this.master.gain.exponentialRampToValueAtTime(0.16 * this.duckLevel + 0.0001, ac.currentTime + 1.5);
    this.master.connect(ac.destination);
    if (!this.noise) {
      const len = Math.floor(ac.sampleRate * 0.1);
      this.noise = ac.createBuffer(1, len, ac.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    this.next = ac.currentTime + 0.15;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 40);
  }
  stop() {
    if (!this.timer) return;
    clearInterval(this.timer); this.timer = 0;
    const m = this.master; this.master = null;
    const ac = this.ac;
    if (m && ac) { const t = ac.currentTime; m.gain.cancelScheduledValues(t); m.gain.setValueAtTime(Math.max(0.0001, m.gain.value), t); m.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); setTimeout(() => m.disconnect(), 700); }
  }
  // 문제를 풀 때는 작게, 건반·듣기 문제는 거의 안 들리게
  duck(level) {
    this.duckLevel = level;
    const ac = this.ac;
    if (!this.master || !ac) return;
    const t = ac.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
    this.master.gain.exponentialRampToValueAtTime(0.16 * level + 0.0001, t + 0.4);
  }
  tone(freq, t, dur, type, vol) {
    const ac = this.ac;
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  bell(m, t, vol = 0.1) { this.tone(mtof(m), t, 0.7, 'sine', vol); this.tone(mtof(m + 12), t, 0.35, 'sine', vol * 0.3); this.tone(mtof(m + 19), t, 0.15, 'sine', vol * 0.08); }
  shaker(t, vol) {
    const ac = this.ac;
    const s = ac.createBufferSource(); s.buffer = this.noise;
    const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + 0.08);
  }
  schedule() {
    const ac = this.ac;
    if (!this.master || !ac) return;
    const eighth = 60 / BPM / 2;
    while (this.next < ac.currentTime + 0.25) {
      const t = this.next;
      const loop = Math.floor(this.step / 64) % 2; // 0: 가락, 1: 반짝이
      const bar = Math.floor(this.step / 8) % 8;
      const i = this.step % 8;
      const ch = CHORDS[bar];
      // 베이스: 1·3박
      if (i === 0 || i === 4) this.tone(mtof(ch[0] - 12 + (i === 4 ? 7 : 0)), t, 0.32, 'triangle', 0.13);
      // 통통 화음: 2·4박 뒤
      if (i === 2 || i === 6) ch.forEach((m) => this.tone(mtof(m + 12), t, 0.16, 'triangle', 0.022));
      // 셰이커
      if (i % 2 === 1) this.shaker(t, 0.018);
      // 가락 또는 반짝이 아르페지오
      if (loop === 0) { const m = MELODY[bar][i]; if (m) this.bell(m, t); }
      else { const arp = [0, 1, 2, 1, 0, 2, 1, 2][i]; if (i % 2 === 0 || bar % 2 === 1) this.bell(ch[arp] + 24, t, 0.05); }
      this.step += 1;
      this.next += eighth;
    }
  }
}
export const bgm = new Bgm();
// 탭을 다른 데로 옮기면 쉬었다가 돌아오면 다시
document.addEventListener('visibilitychange', () => { if (document.hidden) bgm.stop(); else if (sound.music && bgm.wanted) bgm.start(); });
