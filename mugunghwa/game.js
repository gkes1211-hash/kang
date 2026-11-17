// 게임 규칙만 담은 모듈 (화면·카메라와 분리되어 있어 따로 시험하기 쉽다).

// 움직임을 재는 방식마다 "얼마나 움직였나" 숫자의 크기가 달라서 기준을 따로 둔다.
//  - pose : 몸 뼈대(어깨·팔·다리)가 1초에 몸통 길이의 몇 배만큼 움직였나
//  - pixel: 화면에서 바뀐 점의 비율 (몸 인식을 못 켰을 때 쓰는 예비 방식)
export const PROFILES = {
  pose: {
    fullEffort: 1.5, // 이만큼이면 "힘껏" (팔을 크게 흔들면 2~8 정도 나온다)
    idle: 0.2, // 이보다 작은 움직임은 앞으로 가지 않음
    noiseCap: 0.6, // 가만히 있을 때의 몸 점 떨림은 카메라·조명에 따라 0.2~0.7 정도
    noiseMul: 1.2,
    noisePad: 0.1,
    freeze: { easy: 1.0, normal: 0.55, hawk: 0.3 },
  },
  pixel: {
    fullEffort: 0.15,
    idle: 0.01,
    noiseCap: 0.012,
    noiseMul: 1.5,
    noisePad: 0.005,
    freeze: { easy: 0.07, normal: 0.04, hawk: 0.022 },
  },
};

export const DIFFICULTY = {
  // grace: "얼음!" 뒤 몸이 멈출 때까지 봐주는 시간(초). 아이 반응 시간 + 카메라·몸 인식 지연(약 0.5초)을 더한 값.
  // hold: 그 뒤 이만큼(초) 계속 움직여야 걸린다.
  easy: { label: '너그러움', hold: 0.45, grace: 1.3, penalty: 0.12, go: [4, 6] },
  normal: { label: '보통', hold: 0.25, grace: 1.0, penalty: 0.15, go: [3, 5.5] },
  hawk: { label: '매의 눈', hold: 0.12, grace: 0.75, penalty: 0.2, go: [2.2, 5] },
};

export const FIND_SECONDS = 1.2; // 이만큼 계속 보이면 "찾았다!"
export const CALIBRATE_SECONDS = 3; // 찾은 뒤 가만히 서서 흔들림(잡음)을 재는 시간
const CALIBRATE_SKIP = 1; // 그중 앞부분은 자리 잡는 시간이라 버린다
const RUN_SECONDS = 18; // 쉬지 않고 힘껏 움직이면 이만큼 걸려 도착
const FREEZE_RANGE = [2.5, 4];
const CHANT = '무궁화 꽃이 피었습니다';

const between = (rng, [a, b]) => a + rng() * (b - a);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export class Game {
  constructor({ players = 1, difficulty = 'normal', profile = 'pose', rng = Math.random } = {}) {
    this.rules = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    this.profile = PROFILES[profile] || PROFILES.pose;
    this.difficulty = DIFFICULTY[difficulty] ? difficulty : 'normal';
    this.rng = rng;
    this.players = Array.from({ length: players }, (_, i) => ({
      id: i + 1,
      progress: 0,
      motion: 0,
      present: false,
      seen: 0,
      found: false,
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
    this.enter('find', Infinity);
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
    const pr = this.profile;
    return Math.max(pr.freeze[this.difficulty], p.noise * pr.noiseMul + pr.noisePad);
  }

  // dt: 지난번 이후 흐른 초
  // motions: 플레이어별 움직임 크기, present: 플레이어별로 카메라에 보이는지
  update(dt, motions, present = motions.map(() => true)) {
    if (this.phase === 'end') return;
    this.t += dt;
    if (this.phase !== 'find' && this.phase !== 'calibrate') this.elapsed += dt;
    const pr = this.profile;

    this.players.forEach((p, i) => {
      p.present = !!present[i];
      const m = p.present ? (motions[i] ?? 0) : 0;
      p.motion = m;
      if (this.phase === 'find') {
        // 잠깐 안 보이는 순간이 있어도 처음부터 다시 세지 않고 조금씩만 깎는다
        p.seen = p.present ? p.seen + dt : Math.max(0, p.seen - dt * 0.5);
        if (!p.found && p.seen >= FIND_SECONDS) {
          p.found = true;
          this.events.push({ type: 'found', player: p.id });
        }
      } else if (this.phase === 'calibrate') {
        if (this.t > CALIBRATE_SKIP && p.present) p.samples.push(m);
      } else if (this.phase === 'go') {
        const effort = clamp((m - p.noise - pr.idle) / (pr.fullEffort - pr.idle), 0, 1);
        p.progress = Math.min(1, p.progress + (effort * dt) / RUN_SECONDS);
      } else if (this.phase === 'freeze' && this.t > this.rules.grace && !p.caughtThisRound && p.present) {
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

    if (this.phase === 'find') {
      if (this.players.every((p) => p.found)) this.enter('calibrate', CALIBRATE_SECONDS);
      return;
    }

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
          // 가만히 있을 때 떨림의 "거의 최대치"(상위 10%)를 잡음으로 본다.
          // 가운데 값만 보면 가끔 튀는 떨림 때문에 가만히 있어도 걸릴 수 있다.
          const s = p.samples.slice().sort((a, b) => a - b);
          const p90 = s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.9))] : 0;
          p.noise = Math.min(pr.noiseCap, p90);
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
