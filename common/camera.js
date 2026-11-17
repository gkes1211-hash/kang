// 체육시간 게임들이 같이 쓰는 카메라·몸 인식 도우미.
// 카메라 영상은 기기 안에서만 쓰고, 어디로도 보내지 않는다.
import { PoseSensor } from '../mugunghwa/pose.js';

export { PoseSensor };

export async function startCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('이 주소에서는 카메라를 켤 수 없어요. https:// 주소나 이 기기(localhost)에서 열어 주세요.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (err) {
    if (err?.name === 'NotAllowedError') throw new Error('카메라를 쓰도록 허락해 주세요. (주소창 옆 카메라 아이콘)');
    if (err?.name === 'NotFoundError') throw new Error('카메라를 찾지 못했어요.');
    throw new Error('카메라를 켤 수 없어요. 다른 앱이 카메라를 쓰고 있지 않은지 봐 주세요.');
  }
  video.srcObject = stream;
  await video.play().catch(() => {});
  return stream;
}

export function stopCamera(video, stream) {
  stream?.getTracks().forEach((t) => t.stop());
  if (video) video.srcObject = null;
}

// 몸 인식기 (인원수별로 하나씩 만들어 다시 쓴다)
const sensors = {};
export async function getSensor(video, players) {
  const loading = PoseSensor.load();
  const s = sensors[players] || (sensors[players] = new PoseSensor(video, players));
  try {
    await loading;
    await s.init();
  } catch {
    throw new Error('몸 인식을 켤 수 없어요. 크롬·사파리·엣지 최신 버전에서 열어 주세요.');
  }
  s.reset();
  return s;
}

// 캔버스를 화면 크기에 맞춘다 (선명함은 1.5배까지만: 느린 기기 배려)
export function fitCanvas(canvas) {
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const W = Math.round(canvas.clientWidth * DPR);
  const H = Math.round(canvas.clientHeight * DPR);
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  return { W, H, DPR };
}

// 카메라 화면을 캔버스에 꽉 차게 그릴 때의 위치
export function videoRect(video, W, H) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const k = Math.max(W / vw, H / vh);
  const w = vw * k;
  const h = vh * k;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

// 거울처럼 뒤집어 그린다
export function drawMirrored(ctx, video, r) {
  ctx.save();
  ctx.translate(r.x + r.w, r.y);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, r.w, r.h);
  ctx.restore();
}

// 몸 인식 결과(0~1, 이미 거울 방향) → 캔버스 픽셀 좌표
export function toPixels(landmarks, r) {
  return landmarks.map((p) => ({ x: r.x + p.x * r.w, y: r.y + p.y * r.h, visibility: p.visibility ?? 1 }));
}

// 화면 꺼짐 막기
export async function holdScreenOn() {
  try {
    const lock = await navigator.wakeLock?.request('screen');
    return lock || null;
  } catch { return null; }
}

// MediaPipe 몸 점 번호
export const P = {
  nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28,
  lHeel: 29, rHeel: 30, lFoot: 31, rFoot: 32,
};
export const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
  [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32],
];
export const vis = (pts, i) => !!pts && pts[i] && pts[i].visibility > 0.5;
export const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// 몸통 길이(어깨 가운데 ~ 엉덩이 가운데). 멀리 서도 가까이 서도 같은 기준으로 재려고 쓴다.
export function torso(pts) {
  if (!vis(pts, 11) || !vis(pts, 12)) return null;
  const sh = mid(pts[11], pts[12]);
  const shW = dist(pts[11], pts[12]);
  if (vis(pts, 23) && vis(pts, 24)) return Math.max(shW * 1.0, dist(sh, mid(pts[23], pts[24])));
  return shW * 1.25;
}

// 몸 뼈대 그리기. colorOf(뼈 [a,b]) 로 마디마다 색을 바꿀 수 있다.
export function drawSkeleton(ctx, pts, { width = 6, color = 'rgba(255,255,255,0.9)', colorOf = null, head = true } = {}) {
  if (!pts) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const [a, b] of BONES) {
    if (!vis(pts, a) || !vis(pts, b)) continue;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = width + 4;
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
    ctx.strokeStyle = (colorOf && colorOf(a, b)) || color;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    if (!vis(pts, i)) continue;
    ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, width * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  if (head && vis(pts, 11) && vis(pts, 12)) {
    const s = torso(pts) || 100;
    const a = mid(pts[11], pts[12]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.arc(a.x, a.y - 0.55 * s, 0.27 * s, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
