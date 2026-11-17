// 카메라 화면에서 사람 몸(어깨·팔·다리 뼈대)을 찾고, 팔·다리가 얼마나 움직였는지 잰다.
// 구글 MediaPipe 몸 인식 모델을 이 앱 폴더(vendor/)에 넣어 두고 기기 안에서만 돌린다.
// 영상은 어디에도 보내지 않는다 (index.html 의 보안 규칙이 바깥 연결을 모두 막는다).

// MediaPipe 몸 점 번호
export const P = {
  nose: 0,
  lShoulder: 11, rShoulder: 12,
  lElbow: 13, rElbow: 14,
  lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24,
  lKnee: 25, rKnee: 26,
  lAnkle: 27, rAnkle: 28,
};
const ARMS = [P.lElbow, P.rElbow, P.lWrist, P.rWrist];
const LEGS = [P.lKnee, P.rKnee, P.lAnkle, P.rAnkle];
const TRACKED = [P.nose, P.lShoulder, P.rShoulder, ...ARMS, P.lHip, P.rHip, ...LEGS];
export const BONES = [
  [P.lShoulder, P.rShoulder], [P.lShoulder, P.lElbow], [P.lElbow, P.lWrist],
  [P.rShoulder, P.rElbow], [P.rElbow, P.rWrist], [P.lShoulder, P.lHip], [P.rShoulder, P.rHip],
  [P.lHip, P.rHip], [P.lHip, P.lKnee], [P.lKnee, P.lAnkle], [P.rHip, P.rKnee], [P.rKnee, P.rAnkle],
];

const VISIBLE = 0.5; // 이 점수보다 높아야 "보이는 점"으로 친다
const MOTION_VISIBLE = 0.65; // 움직임을 잴 때는 더 확실히 보이는 점만 쓴다 (흐릿한 점은 떨림이 크다)
const LOST_AFTER = 0.6; // 이만큼(초) 안 보이면 "사라짐"
// 떨림 줄이기 정도 (0~1, 클수록 새 값 비중 = 반응이 빠름). 너무 작으면 멈춘 뒤에도
// 움직임이 한동안 남아 "얼음!" 때 억울하게 걸린다.
const SMOOTH = 0.7;
const ACTIVITY_SMOOTH = 0.6;

const vis = (lm, i) => lm[i] && (lm[i].visibility ?? 1) > VISIBLE;
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// 화면에 보이는 대로 좌우를 뒤집는다 (거울: 왼쪽 = 1P)
export function mirror(landmarks) {
  return landmarks.map((p) => ({ x: 1 - p.x, y: p.y, visibility: p.visibility ?? 1 }));
}

// 몸 크기(몸통 길이). 멀리 서 있든 가까이 서 있든 같은 기준으로 재기 위해 쓴다.
export function bodyInfo(lm) {
  if (!vis(lm, P.lShoulder) || !vis(lm, P.rShoulder)) return null;
  const sh = mid(lm[P.lShoulder], lm[P.rShoulder]);
  const shoulderW = dist(lm[P.lShoulder], lm[P.rShoulder]);
  let size = shoulderW * 1.4;
  if (vis(lm, P.lHip) && vis(lm, P.rHip)) {
    size = Math.max(size, dist(sh, mid(lm[P.lHip], lm[P.rHip])));
  }
  return { anchor: sh, size: Math.max(0.05, size), cx: sh.x };
}

// 한 사람의 움직임을 계속 따라가며 "얼마나 움직였나"를 계산한다.
export class BodyTrack {
  constructor() {
    this.reset();
  }

  reset() {
    this.points = null; // 떨림을 줄인 몸 점
    this.prevRel = null; // 지난번 (몸 점 - 어깨 가운데) / 몸 크기
    this.prevAnchor = null;
    this.activity = 0;
    this.lastSeen = -Infinity;
    this.landmarks = null;
    this.parts = { arms: 0, legs: 0, body: 0 };
  }

  present(now) {
    return now - this.lastSeen <= LOST_AFTER;
  }

  // lm: 거울 뒤집기 한 몸 점들, dt: 지난번 이후 초
  update(lm, now, dt) {
    const info = bodyInfo(lm);
    if (!info) return this.miss(now);
    this.lastSeen = now;
    this.landmarks = lm;

    // 떨림 줄이기
    if (!this.points) this.points = lm.map((p) => ({ ...p }));
    else {
      for (const i of TRACKED) {
        const s = this.points[i];
        const c = lm[i];
        s.x += (c.x - s.x) * SMOOTH;
        s.y += (c.y - s.y) * SMOOTH;
        s.visibility = c.visibility;
      }
    }
    const pts = this.points;
    const smoothInfo = bodyInfo(pts) || info;
    const rel = {};
    for (const i of TRACKED) {
      if (vis(pts, i)) rel[i] = { x: (pts[i].x - smoothInfo.anchor.x) / smoothInfo.size, y: (pts[i].y - smoothInfo.anchor.y) / smoothInfo.size };
    }

    let arms = 0;
    let legs = 0;
    let body = 0;
    if (this.prevRel && dt > 0) {
      // 잘 보이는 점들의 속도 중 가운데 값(중앙값). 점 하나가 튀는 떨림은 무시되고,
      // 팔 전체(팔꿈치·손목)가 같이 움직일 때만 크게 나온다.
      const speed = (ids, need) => {
        const v = [];
        for (const i of ids) {
          if (rel[i] && this.prevRel[i] && pts[i].visibility > MOTION_VISIBLE) {
            v.push(Math.hypot(rel[i].x - this.prevRel[i].x, rel[i].y - this.prevRel[i].y));
          }
        }
        if (v.length < need) return 0;
        v.sort((a, b) => a - b);
        const m = v.length >> 1;
        const median = v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
        return median / dt;
      };
      arms = speed(ARMS, 2);
      legs = speed(LEGS, 2);
      body = dist(smoothInfo.anchor, this.prevAnchor) / smoothInfo.size / dt;
    }
    this.prevRel = rel;
    this.prevAnchor = smoothInfo.anchor;
    this.parts = { arms, legs, body };
    // 팔 흔들기, 제자리 달리기(무릎·발), 몸 들썩임 중 가장 큰 것
    const raw = Math.max(arms, legs, body * 1.5);
    this.activity += (raw - this.activity) * ACTIVITY_SMOOTH;
    return this.activity;
  }

  miss(now) {
    if (!this.present(now)) {
      this.points = null;
      this.prevRel = null;
      this.prevAnchor = null;
      this.landmarks = null;
      this.activity = 0;
    } else {
      this.activity *= 0.7;
    }
    return this.activity;
  }
}

// 몸 인식기를 만든다. 둘이서 할 때는 한 사람에 하나씩 따로 쓴다:
// 하나로 두 사람을 같이 보면, 한 사람이 크게 움직일 때 가만히 있는 옆 사람의 몸 점까지
// 흔들리게 읽혀서 억울하게 걸리는 일이 있었다.
async function createLandmarker(engine) {
  const { PoseLandmarker, fileset, model } = engine;
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: model, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  try {
    return await PoseLandmarker.createFromOptions(fileset, options('GPU'));
  } catch {
    return await PoseLandmarker.createFromOptions(fileset, options('CPU'));
  }
}

export class PoseSensor {
  constructor(video, players) {
    this.video = video;
    this.players = players;
    this.tracks = Array.from({ length: players }, () => new BodyTrack());
    this.landmarkers = [];
    this.lastTs = 0;
    this.frame = document.createElement('canvas'); // 거울처럼 뒤집은 화면
    this.halves = [document.createElement('canvas'), document.createElement('canvas')];
  }

  // 몸 인식 엔진과 모델을 불러온다 (처음 한 번만 몇 초 걸림)
  static async load() {
    if (!PoseSensor.loading) {
      PoseSensor.loading = (async () => {
        const { FilesetResolver, PoseLandmarker } = await import('./vendor/vision_bundle.mjs');
        const wasmBase = new URL('./vendor/wasm', import.meta.url).href;
        const model = new URL('./vendor/pose_landmarker_lite.task', import.meta.url).href;
        const fileset = await FilesetResolver.forVisionTasks(wasmBase);
        const engine = { PoseLandmarker, fileset, model, pool: [] };
        engine.pool.push(await createLandmarker(engine)); // 하나는 미리 만들어 둔다
        return engine;
      })();
      PoseSensor.loading.catch(() => { PoseSensor.loading = null; });
    }
    return PoseSensor.loading;
  }

  async init() {
    const engine = await PoseSensor.load();
    while (engine.pool.length < this.players) engine.pool.push(await createLandmarker(engine));
    this.landmarkers = engine.pool.slice(0, this.players);
    return this;
  }

  reset() {
    this.tracks.forEach((t) => t.reset());
  }

  // 혼자: 화면 전체에서 한 사람 / 둘이서: 왼쪽 절반 = 1P, 오른쪽 절반 = 2P 를 따로 찾는다
  detect(now) {
    const v = this.video;
    if (this.players === 1) {
      const r = this.landmarkers[0].detectForVideo(v, now);
      return [r.landmarks?.[0] ? mirror(r.landmarks[0]) : null];
    }
    const w = v.videoWidth;
    const h = v.videoHeight;
    const f = this.frame;
    if (f.width !== w || f.height !== h) { f.width = w; f.height = h; }
    const fctx = f.getContext('2d');
    fctx.setTransform(-1, 0, 0, 1, w, 0);
    fctx.drawImage(v, 0, 0, w, h);
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    const hw = Math.floor(w / 2);
    return this.halves.map((c, side) => {
      if (c.width !== hw || c.height !== h) { c.width = hw; c.height = h; }
      c.getContext('2d').drawImage(f, side * hw, 0, hw, h, 0, 0, hw, h);
      const r = this.landmarkers[side].detectForVideo(c, now);
      const lm = r.landmarks?.[0];
      if (!lm) return null;
      // 절반 화면 좌표 → 전체 화면 좌표 (이미 거울 방향이라 다시 뒤집지 않는다)
      return lm.map((p) => ({ x: (side * hw + p.x * hw) / w, y: p.y, visibility: p.visibility ?? 1 }));
    });
  }

  // 지금 화면을 보고 플레이어별 { present, motion, landmarks } 를 돌려준다
  sample(dt) {
    const v = this.video;
    if (!this.landmarkers.length || !v || v.readyState < 2 || !v.videoWidth) return null;
    let now = performance.now();
    if (now <= this.lastTs) now = this.lastTs + 1;
    this.lastTs = now;
    const assigned = this.detect(now);
    const t = now / 1000;
    return this.tracks.map((track, i) => {
      const lm = assigned[i];
      const motion = lm ? track.update(lm, t, dt) : track.miss(t);
      return { present: track.present(t), motion, landmarks: track.present(t) ? track.landmarks : null, parts: track.parts };
    });
  }
}
PoseSensor.loading = null;
