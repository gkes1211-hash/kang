// 게임 규칙만 담은 모듈 (화면·카메라와 분리되어 있어 따로 시험하기 쉽다).

export const DIFFICULTY = {
  easy: { label: '너그러움', freezeThreshold: 0.07, hold: 0.45, grace: 0.9, penalty: 0.12, go: [4, 6] },
  normal: { label: '보통', freezeThreshold: 0.04, hold: 0.25, grace: 0.6, penalty: 0.15, go: [3, 5.5] },
  hawk: { label: '매의 눈', freezeThreshold: 0.022, hold: 0.12, grace: 0.4, penalty: 0.2, go: [2.2, 5] },
};

export const CALIBRATE_SECONDS = 4; // 처음에 가만히 서서 카메라 잡음을 재는 시간
const CALIBRATE_SKIP = 1.5; // 그중 앞부분은 자리 잡는 시간이라 버린다
const RUN_SECONDS = 18; // 쉬지 않고 힘껏 움직이면 이만큼 걸려 도착
const FULL_EFFORT = 0.15; // 움직임 비율이 이 정도면 "힘껏"으로 본다
// 가만히 있을 때 카메라 잡음의 최대치. 이보다 크게 잡히면(그때 꼼지락거렸다면) 이 값으로 자른다.
// 너무 크게 두면 술래 눈치가 무뎌진다.
const NOISE_CAP = 0.012;
const FREEZE_RANGE = [2.5, 4];
const CHANT = '무궁화 꽃이 피었습니다';

const between = (rng, [a, b]) => a + rng() * (b - a);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export class Game {
  constructor({ players = 1, difficulty = 'normal', rng = Math.random } = {}) {
    this.rules = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    this.rng = rng;
    this.players = Array.from({ length: players }, (_, i) => ({
      id: i + 1,
      progress: 0,
      motion: 0,
      noise: 0,
      samples: [],
      suspicion: 0,
      caughtThisRound: false,
      caughtCount: 0,
    }));
    this.events = [];
    this.round = 0;
    this.elapsed = 0;
    this.winners = [];
    this.enter('calibrate', CALIBRATE_SECONDS);
  }

  enter(phase, length) {
    this.phase = phase;
    this.t = 0;
    this.length = length;
    if (phase === 'go') this.round++;
    if (phase === 'freeze') {
      for (const p of this.players) {
        p.suspicion = 0;
        p.caughtThisRound = false;
      }
    }
    this.events.push({ type: 'phase', phase, length });
  }

  freezeLimit(p) {
    return Math.max(this.rules.freezeThreshold, p.noise * 1.5 + 0.005);
  }

  // dt: 지난번 이후 흐른 초, motions: 플레이어별 움직임 비율(0~1)
  update(dt, motions) {
    if (this.phase === 'end') return;
    this.t += dt;
    if (this.phase !== 'calibrate') this.elapsed += dt;

    this.players.forEach((p, i) => {
      const m = motions[i] ?? 0;
      p.motion = m;
      if (this.phase === 'calibrate') {
        if (this.t > CALIBRATE_SKIP) p.samples.push(m);
      } else if (this.phase === 'go') {
        const effort = clamp((m - p.noise - 0.01) / FULL_EFFORT, 0, 1);
        p.progress = Math.min(1, p.progress + (effort * dt) / RUN_SECONDS);
      } else if (this.phase === 'freeze' && this.t > this.rules.grace && !p.caughtThisRound) {
        if (m > this.freezeLimit(p)) p.suspicion += dt;
        else p.suspicion = Math.max(0, p.suspicion - dt);
        if (p.suspicion >= this.rules.hold) {
          p.caughtThisRound = true;
          p.caughtCount++;
          p.progress = Math.max(0, p.progress - this.rules.penalty);
          this.events.push({ type: 'caught', player: p.id });
        }
      }
    });

    if (this.phase === 'go') {
      const done = this.players.filter((p) => p.progress >= 1);
      if (done.length) {
        this.winners = done.map((p) => p.id);
        this.enter('end', 0);
        this.events.push({ type: 'win', players: this.winners });
        return;
      }
    }

    if (this.t >= this.length) {
      if (this.phase === 'calibrate') {
        for (const p of this.players) {
          const s = p.samples.slice().sort((a, b) => a - b);
          const median = s.length ? s[Math.floor(s.length / 2)] : 0;
          p.noise = Math.min(NOISE_CAP, median);
          p.samples = [];
        }
        this.enter('go', between(this.rng, this.rules.go));
      } else if (this.phase === 'go') {
        this.enter('freeze', this.rules.grace + between(this.rng, FREEZE_RANGE));
      } else if (this.phase === 'freeze') {
        this.enter('go', between(this.rng, this.rules.go));
      }
    }
  }

  // 지금까지 보여 줄 노래 글자 ("무궁화 꽃이 피..." 처럼 한 글자씩)
  chantText() {
    if (this.phase === 'freeze') return CHANT + '!';
    if (this.phase !== 'go') return '';
    const letters = [...CHANT];
    const syllables = letters.filter((c) => c !== ' ').length;
    const shown = Math.min(syllables, Math.floor((this.t / this.length) * syllables) + 1);
    let count = 0;
    let out = '';
    for (const c of letters) {
      if (c !== ' ') {
        if (count >= shown) break;
        count++;
      }
      out += c;
    }
    return out;
  }

  takeEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }
}

export { CHANT };
