// 몸 뼈대를 "각도"로 바꾸고, 각도로 구멍 모양(사람 실루엣)을 만든다.
//
// 각도 약속 (모든 팔·다리 마디에 똑같이):
//   0° = 아래로 축 늘어뜨림, 90° = 몸 바깥쪽으로 수평, 180° = 위로 번쩍,
//   음수 = 몸 안쪽(가운데) 방향. 왼쪽·오른쪽은 "화면에 보이는 쪽" 기준이다.
// 이렇게 하면 왼쪽 팔과 오른쪽 팔을 같은 숫자로 적을 수 있다 (만세 = 160, 160).

export const ARM_SEGS = ['uL', 'fL', 'uR', 'fR']; // 위팔·아래팔 (화면 왼쪽, 오른쪽)
export const LEG_SEGS = ['tL', 'sL', 'tR', 'sR']; // 허벅지·종아리
export const SEG_NAME = {
  uL: '왼팔', fL: '왼팔', uR: '오른팔', fR: '오른팔',
  tL: '왼다리', sL: '왼다리', tR: '오른다리', sR: '오른다리',
};
const STANDING_LEGS = [6, 0, 6, 0];

const RAD = Math.PI / 180;
const VISIBLE = 0.5;

// MediaPipe 몸 점 번호 (사람 기준 왼쪽 A, 오른쪽 B)
const A = { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27 };
const B = { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28 };

export const angleDiff = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ok = (pts, i) => pts[i] && (pts[i].visibility ?? 1) > VISIBLE;

// 화면 왼쪽에 보이는 쪽을 L 로. (거울 화면이라도 위치로 정하면 헷갈리지 않는다)
function sides(pts) {
  return pts[A.sh].x <= pts[B.sh].x ? [A, B] : [B, A];
}

// 각도 → 방향 (s = -1 화면 왼쪽, +1 화면 오른쪽)
const dir = (s, deg) => ({ x: s * Math.sin(deg * RAD), y: Math.cos(deg * RAD) });
const segAngle = (p, q, s) => Math.atan2(s * (q.x - p.x), q.y - p.y) / RAD;

// pts: 화면 픽셀 좌표의 몸 점 33개 → 마디별 각도 (안 보이면 null)
export function measure(pts) {
  const out = {};
  if (!pts) return out;
  const [L, R] = sides(pts);
  const seg = (key, side, s, a, b) => {
    out[key] = ok(pts, side[a]) && ok(pts, side[b]) ? segAngle(pts[side[a]], pts[side[b]], s) : null;
  };
  seg('uL', L, -1, 'sh', 'el'); seg('fL', L, -1, 'el', 'wr');
  seg('uR', R, 1, 'sh', 'el'); seg('fR', R, 1, 'el', 'wr');
  seg('tL', L, -1, 'hip', 'kn'); seg('sL', L, -1, 'kn', 'an');
  seg('tR', R, 1, 'hip', 'kn'); seg('sR', R, 1, 'kn', 'an');
  return out;
}

export function legsVisible(pts) {
  return !!pts && [25, 26, 27, 28].every((i) => ok(pts, i));
}

// 몸 크기와 팔·다리 길이 비율. S = 어깨 가운데~엉덩이 가운데 길이(몸통).
export const DEFAULT_PROPS = { shoulder: 0.42, hip: 0.24, upper: 0.6, fore: 0.55, thigh: 0.85, shin: 0.8 };

export function bodyFrame(pts) {
  if (!pts || !ok(pts, 11) || !ok(pts, 12)) return null;
  const [L, R] = sides(pts);
  const anchor = mid(pts[11], pts[12]);
  const shW = dist(pts[11], pts[12]);
  let S = shW * 1.25;
  const hips = ok(pts, 23) && ok(pts, 24);
  if (hips) S = Math.max(S * 0.8, dist(anchor, mid(pts[23], pts[24])));
  S = Math.max(S, 20);
  const props = { shoulder: shW / 2 / S };
  const len = (a, b) => {
    const v = [L, R].filter((s) => ok(pts, s[a]) && ok(pts, s[b])).map((s) => dist(pts[s[a]], pts[s[b]]) / S);
    return v.length ? Math.max(...v) : null;
  };
  props.upper = len('sh', 'el');
  props.fore = len('el', 'wr');
  props.thigh = len('hip', 'kn');
  props.shin = len('kn', 'an');
  props.hip = hips ? dist(pts[23], pts[24]) / 2 / S : null;
  return { anchor, S, props };
}

// 자세(각도)와 몸 크기로 관절 위치를 만든다. 구멍 그리기, 연습용 가짜 몸에 쓴다.
export function figure(anchor, S, pose, props = DEFAULT_PROPS) {
  const [uL, fL, uR, fR] = pose.arms;
  const [tL, sL, tR, sR] = pose.legs || STANDING_LEGS;
  const at = (p, d, l) => ({ x: p.x + d.x * l * S, y: p.y + d.y * l * S });
  const shL = { x: anchor.x - props.shoulder * S, y: anchor.y };
  const shR = { x: anchor.x + props.shoulder * S, y: anchor.y };
  const hipC = { x: anchor.x, y: anchor.y + S };
  const hipL = { x: hipC.x - props.hip * S, y: hipC.y };
  const hipR = { x: hipC.x + props.hip * S, y: hipC.y };
  const elL = at(shL, dir(-1, uL), props.upper);
  const wrL = at(elL, dir(-1, fL), props.fore);
  const elR = at(shR, dir(1, uR), props.upper);
  const wrR = at(elR, dir(1, fR), props.fore);
  const knL = at(hipL, dir(-1, tL), props.thigh);
  const anL = at(knL, dir(-1, sL), props.shin);
  const knR = at(hipR, dir(1, tR), props.thigh);
  const anR = at(knR, dir(1, sR), props.shin);
  const head = { x: anchor.x, y: anchor.y - 0.55 * S, r: 0.3 * S };
  return { anchor, S, head, shL, shR, hipL, hipR, elL, wrL, elR, wrR, knL, anL, knR, anR };
}

// figure → MediaPipe 몸 점 배열 (연습 모드에서 가짜 몸을 만들 때)
export function figureToLandmarks(f) {
  const pts = Array.from({ length: 33 }, () => ({ x: f.anchor.x, y: f.anchor.y, visibility: 0 }));
  const put = (i, p) => { pts[i] = { x: p.x, y: p.y, visibility: 1 }; };
  put(0, f.head);
  put(11, f.shL); put(12, f.shR); put(13, f.elL); put(14, f.elR); put(15, f.wrL); put(16, f.wrR);
  put(23, f.hipL); put(24, f.hipR); put(25, f.knL); put(26, f.knR); put(27, f.anL); put(28, f.anR);
  return pts;
}

// 사람 실루엣 경로를 그린다 (구멍 뚫기·테두리에 같이 쓴다). w = 팔다리 굵기
export function traceSilhouette(ctx, f, w) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.beginPath();
  // 몸통
  ctx.moveTo(f.shL.x, f.shL.y);
  ctx.lineTo(f.shR.x, f.shR.y);
  ctx.lineTo(f.hipR.x, f.hipR.y);
  ctx.lineTo(f.hipL.x, f.hipL.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  for (const [a, b, c] of [
    [f.shL, f.elL, f.wrL], [f.shR, f.elR, f.wrR], [f.hipL, f.knL, f.anL], [f.hipR, f.knR, f.anR],
  ]) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
  }
  ctx.moveTo(f.anchor.x, f.anchor.y);
  ctx.lineTo(f.head.x, f.head.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(f.head.x, f.head.y, f.head.r + w * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

// 지금 내 자세가 목표 자세와 얼마나 맞나
// 결과: { pass, perfect, score(0~1), segs: {key: 차이각 | Infinity}, need: [...] }
export function judge(pose, meas, tol, useLegs) {
  const need = [...ARM_SEGS];
  const target = { uL: pose.arms[0], fL: pose.arms[1], uR: pose.arms[2], fR: pose.arms[3] };
  if (useLegs && pose.legs) {
    need.push(...LEG_SEGS);
    Object.assign(target, { tL: pose.legs[0], sL: pose.legs[1], tR: pose.legs[2], sR: pose.legs[3] });
  }
  const segs = {};
  let sum = 0;
  let worst = 0;
  for (const k of need) {
    const d = meas[k] == null ? Infinity : angleDiff(meas[k], target[k]);
    segs[k] = d;
    worst = Math.max(worst, d);
    sum += Math.max(0, Math.min(1, 1 - (d - tol * 0.5) / (tol * 1.5)));
  }
  return { pass: worst <= tol, perfect: worst <= tol * 0.55, score: sum / need.length, segs, need };
}
