/** 작고 귀여운 효과음 (Web Audio, 파일 없이 합성) */
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, delay = 0) {
  const a = ac();
  if (!a) return;
  try {
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* 소리가 안 나도 앱은 계속 동작 */
  }
}

export const sfx = {
  click: () => tone(660, 0.06, 'triangle', 0.05),
  move: () => tone(520, 0.05, 'sine', 0.035),
  paint: () => tone(880, 0.08, 'triangle', 0.06),
  erase: () => tone(330, 0.08, 'triangle', 0.05),
  color: () => tone(740, 0.07, 'sine', 0.05),
  error: () => {
    tone(392, 0.14, 'triangle', 0.07);
    tone(311, 0.2, 'triangle', 0.07, 0.13);
  },
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.09)),
  almost: () => [523, 494].forEach((f, i) => tone(f, 0.16, 'sine', 0.06, i * 0.12)),
  save: () => [784, 988].forEach((f, i) => tone(f, 0.1, 'triangle', 0.05, i * 0.08)),
};
