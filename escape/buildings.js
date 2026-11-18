// 꼬마 탐험대 공원의 건물들: 놀이 구역마다 생김새가 다른 집
// 모두 정면(문)이 +z 쪽을 본다. 크기 단위는 공원과 같다 (캐릭터 키 ≈ 2).
import { THREE, toon, part, at, sph, cyl, box, OUTLINE } from './toon.js';

// ---------- 무늬 그림 (지붕 기와·벽돌·돌·널빤지) ----------
const texCache = new Map();
function pattern(kind, color) {
  const key = `${kind}|${color}`;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const base = new THREE.Color(color);
  const shade = (k) => `#${base.clone().multiplyScalar(k).getHexString()}`;
  x.fillStyle = color; x.fillRect(0, 0, 128, 128);
  if (kind === 'tile') {
    for (let r = 0; r < 8; r++) {
      const y = r * 16; const off = r % 2 ? 8 : 0;
      x.fillStyle = shade(0.82); x.fillRect(0, y + 13, 128, 3);
      for (let i = -1; i < 9; i++) { x.strokeStyle = shade(0.75); x.lineWidth = 2; x.beginPath(); x.arc(i * 16 + off + 8, y + 2, 8, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); }
      x.fillStyle = shade(1.12); x.fillRect(0, y + 2, 128, 2);
    }
  }
  if (kind === 'brick') {
    for (let r = 0; r < 8; r++) { const off = r % 2 ? 16 : 0; for (let i = -1; i < 5; i++) { x.fillStyle = shade(0.88 + ((r * 7 + i * 3) % 5) * 0.04); x.fillRect(i * 32 + off + 2, r * 16 + 2, 28, 12); } }
  }
  if (kind === 'stone') {
    x.fillStyle = shade(0.8); x.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { x.fillStyle = shade(0.92 + ((r + i * 2) % 4) * 0.05); x.beginPath(); x.roundRect(i * 32 + (r % 2) * 14 - 6, r * 32 + 3, 29, 27, 8); x.fill(); }
  }
  if (kind === 'plank') {
    for (let i = 0; i < 8; i++) { x.fillStyle = shade(0.9 + (i % 3) * 0.06); x.fillRect(i * 16, 0, 15, 128); x.fillStyle = shade(0.7); x.fillRect(i * 16 + 15, 0, 1, 128); }
  }
  if (kind === 'stripe') { for (let i = 0; i < 8; i += 2) { x.fillStyle = '#ffffff'; x.fillRect(i * 16, 0, 16, 128); } }
  if (kind === 'mow') { for (let i = 0; i < 8; i += 2) { x.fillStyle = shade(1.12); x.fillRect(i * 16, 0, 16, 128); } }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}
const matCache = new Map();
function texMat(kind, color, rx = 1, ry = 1) {
  const key = `${kind}|${color}|${rx}|${ry}`;
  if (matCache.has(key)) return matCache.get(key);
  const t = pattern(kind, color).clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
  const m = toon('#ffffff', { map: t });
  matCache.set(key, m);
  return m;
}

// ---------- 부품 ----------
const P = (g, geo, color, x, y, z, o) => { const p = at(part(geo, color, o), x, y, z); g.add(p); return p; };
const M = (g, geo, mat, x, y, z, o = {}) => { const p = at(part(geo, '#fff', { ...o, mat }), x, y, z); g.add(p); return p; };

// 박공지붕: 두 장의 기와판 + 양쪽 삼각 벽 + 용마루
function gableRoof(g, { w, d, rise, y, color, wall, over = 0.6, z = 0 }) {
  const half = w / 2 + over; const slope = Math.hypot(half, rise); const ang = Math.atan2(rise, half);
  for (const s of [-1, 1]) {
    const plate = M(g, box(slope + 0.1, 0.3, d + over * 2), texMat('tile', color, slope / 2.2, (d + over * 2) / 2.2), s * half / 2, y + rise / 2 + 0.12, z, { t: 0.04 });
    plate.rotation.z = -s * ang;
  }
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(0, rise); tri.lineTo(w / 2, 0); tri.closePath();
  const tg = new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }); tg.translate(0, 0, -d / 2);
  P(g, tg, wall, 0, y, z, { t: 0.03 });
  const ridge = P(g, cyl(0.2, 0.2, d + over * 2 + 0.1, 8), new THREE.Color(color).multiplyScalar(0.75).getStyle(), 0, y + rise + 0.18, z, { t: 0.02 });
  ridge.rotation.x = Math.PI / 2;
}
// 창문: 테두리·유리·십자 창살·덧창·꽃상자
function windowAt(g, x, y, z, { w = 1.3, h = 1.4, shutter = '#4f8f4a', flowers = true, round = false } = {}) {
  if (round) {
    const fr = P(g, cyl(w / 2 + 0.12, w / 2 + 0.12, 0.2, 20), '#ffffff', x, y, z + 0.05, { t: 0.02 }); fr.rotation.x = Math.PI / 2;
    const gl = at(new THREE.Mesh(cyl(w / 2, w / 2, 0.22, 20), toon('#8fd3ff')), x, y, z + 0.07); gl.rotation.x = Math.PI / 2; g.add(gl);
    g.add(at(new THREE.Mesh(box(w, 0.08, 0.25), toon('#ffffff')), x, y, z + 0.1)); g.add(at(new THREE.Mesh(box(0.08, w, 0.25), toon('#ffffff')), x, y, z + 0.1));
    return;
  }
  P(g, box(w + 0.25, h + 0.25, 0.18), '#ffffff', x, y, z + 0.04, { t: 0.02 });
  g.add(at(new THREE.Mesh(box(w, h, 0.2), toon('#8fd3ff')), x, y, z + 0.06));
  g.add(at(new THREE.Mesh(box(w * 0.4, h * 0.35, 0.21), toon('#d6f1ff')), x - w * 0.2, y + h * 0.22, z + 0.07));
  g.add(at(new THREE.Mesh(box(w, 0.09, 0.24), toon('#ffffff')), x, y, z + 0.09)); g.add(at(new THREE.Mesh(box(0.09, h, 0.24), toon('#ffffff')), x, y, z + 0.09));
  if (shutter) for (const s of [-1, 1]) P(g, box(w * 0.42, h + 0.1, 0.12), shutter, x + s * (w / 2 + w * 0.26), y, z + 0.06, { t: 0.02 });
  if (flowers) {
    P(g, box(w + 0.3, 0.32, 0.45), '#a8743e', x, y - h / 2 - 0.25, z + 0.25, { t: 0.02 });
    for (let i = 0; i < 5; i++) P(g, sph(0.13, 6, 5), ['#ff6b8b', '#ffd23f', '#ffffff', '#c56cf0', '#ff9f43'][i], x - w / 2 + 0.1 + i * (w / 4.2), y - h / 2 - 0.02, z + 0.3, { line: false });
    for (let i = 0; i < 3; i++) P(g, sph(0.16, 6, 5), '#5cb85c', x - w / 3 + i * w / 3, y - h / 2 - 0.08, z + 0.22, { line: false });
  }
}
// 문: 위가 둥근 나무문·손잡이·디딤돌·작은 차양
function doorAt(g, x, z, { w = 1.4, h = 2.2, color = '#a8743e', awning = null, steps = true } = {}) {
  P(g, box(w + 0.3, h + 0.15, 0.2), '#ffffff', x, h / 2 + 0.1, z + 0.02, { t: 0.02 });
  M(g, box(w, h - w / 2, 0.24), texMat('plank', color, 0.5, 1), x, (h - w / 2) / 2 + 0.1, z + 0.05, { t: 0.02 });
  const top = M(g, new THREE.CylinderGeometry(w / 2, w / 2, 0.24, 16, 1, false, -Math.PI / 2, Math.PI), texMat('plank', color, 0.5, 0.5), x, h - w / 2 + 0.1, z + 0.05, { t: 0.02 });
  top.rotation.x = Math.PI / 2; top.rotation.y = Math.PI / 2;
  P(g, sph(0.09, 8, 6), '#ffd23f', x + w * 0.3, h * 0.45, z + 0.22, { line: false });
  if (steps) { M(g, box(w + 1.0, 0.25, 0.8), texMat('stone', '#c9c2b4', 1, 0.5), x, 0.12, z + 0.45, { t: 0.02 }); }
  if (awning) {
    const aw = M(g, box(w + 1.2, 0.18, 1.2), texMat('stripe', awning, 1, 1), x, h + 0.55, z + 0.55, { t: 0.02 }); aw.rotation.x = 0.35;
  }
}
function chimney(g, x, y, z, h = 1.8) {
  M(g, box(0.9, h, 0.9), texMat('brick', '#b55a3c', 0.6, h / 1.6), x, y + h / 2, z, { t: 0.03 });
  P(g, box(1.1, 0.25, 1.1), '#8a3e28', x, y + h + 0.1, z, { t: 0.02 });
}
// 벽 (기초 돌 + 회벽 + 나무 뼈대)
function walls(g, { w, d, h, wall, frame = '#7a4a24', kind = null }) {
  M(g, box(w + 0.4, 0.6, d + 0.4), texMat('stone', '#c9c2b4', w / 3, 0.4), 0, 0.3, 0, { t: 0.04 });
  if (kind) M(g, box(w, h, d), texMat(kind, wall, w / 3, h / 3), 0, 0.6 + h / 2, 0, { t: 0.04 });
  else P(g, box(w, h, d), wall, 0, 0.6 + h / 2, 0, { t: 0.04 });
  if (frame) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(g, box(0.32, h + 0.05, 0.32), frame, sx * (w / 2 - 0.02), 0.6 + h / 2, sz * (d / 2 - 0.02), { t: 0.02 });
    P(g, box(w + 0.1, 0.28, 0.3), frame, 0, 0.6 + h, d / 2, { t: 0.02 });
    P(g, box(w + 0.1, 0.22, 0.28), frame, 0, 0.7, d / 2, { t: 0.02 });
  }
}
// 간판: 앞에 매다는 나무판 + 그림
function hangingSign(g, x, y, z, emoji, color = '#f6e1b8') {
  P(g, box(0.12, 0.12, 1.2), '#3b3b4f', x, y + 0.75, z + 0.6, { t: 0.01 });
  const b = P(g, box(1.6, 1.1, 0.14), color, x, y, z + 1.1, { t: 0.02 });
  const c = document.createElement('canvas'); c.width = c.height = 128; const cx = c.getContext('2d'); cx.font = '96px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(emoji, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  pl.position.set(x, y, z + 1.18); g.add(pl);
  return b;
}
function emblem(g, x, y, z, emoji, size = 1.6) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const cx = c.getContext('2d'); cx.font = '100px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(emoji, 64, 72);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  pl.position.set(x, y, z); g.add(pl); return pl;
}

// ============================================================
// 구역별 건물
// ============================================================
export function buildBuilding(id) {
  const g = new THREE.Group();
  const B = BUILDERS[id] || BUILDERS.kor;
  const info = B(g);
  g.userData = { door: info.door, w: info.w, d: info.d, spinners: info.spinners || [] };
  g.traverse((o) => { if (o.isMesh && !o.userData.outline) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

const BUILDERS = {
  // 📚 이야기 숲 도서관: 2층 나무 뼈대 집, 동그란 창, 펼친 책 간판, 벽에 덩굴
  kor(g) {
    const w = 8; const d = 6; const h = 5;
    walls(g, { w, d, h, wall: '#f8ecd2', frame: '#6b4226' });
    P(g, box(w + 0.1, 0.24, 0.3), '#6b4226', 0, 0.6 + h / 2, d / 2, { t: 0.02 });
    for (const sx of [-1, 1]) { const br = P(g, box(0.22, h / 2 * 1.15, 0.26), '#6b4226', sx * w * 0.3, 0.6 + h * 0.75, d / 2 + 0.02, { t: 0.01 }); br.rotation.z = sx * 0.7; }
    gableRoof(g, { w, d, rise: 3, y: 0.6 + h, color: '#4f8f4a', wall: '#f8ecd2' });
    windowAt(g, -2.6, 2.1, d / 2, { shutter: '#4f8f4a' }); windowAt(g, 2.6, 2.1, d / 2, { shutter: '#4f8f4a' });
    windowAt(g, -2.4, 4.4, d / 2, { w: 1.1, h: 1.1, shutter: null, flowers: false }); windowAt(g, 2.4, 4.4, d / 2, { w: 1.1, h: 1.1, shutter: null, flowers: false });
    windowAt(g, 0, 7.0, d / 2 + 0.02, { w: 1.2, round: true });
    doorAt(g, 0, d / 2, { awning: null });
    // 펼친 책 간판
    const bk = new THREE.Group(); for (const s of [-1, 1]) { const pg = at(part(box(1.3, 0.12, 1.6), '#ffffff'), s * 0.62, 0, 0); pg.rotation.z = s * 0.28; bk.add(pg); } bk.add(at(part(box(2.8, 0.14, 1.7), '#e8574d'), 0, -0.12, 0)); bk.position.set(0, 3.95, d / 2 + 0.35); bk.rotation.x = Math.PI / 2 - 0.2; g.add(bk);
    chimney(g, 2.6, 6.8, -1, 1.6);
    // 덩굴
    for (let i = 0; i < 14; i++) P(g, sph(0.25, 6, 5), i % 4 ? '#4caf50' : '#ff8fb1', -w / 2 - 0.1 + (i % 3) * 0.3, 0.8 + i * 0.32, d / 2 - 0.2 - (i % 2) * 0.4, { line: false });
    // 책 수레
    P(g, box(1.6, 0.8, 0.9), '#a8743e', 3.8, 0.4, d / 2 + 1.6); ['#e8574d', '#3c8dde', '#f2a516', '#2bab6b'].forEach((c, i) => P(g, box(0.28, 0.6, 0.7), c, 3.3 + i * 0.32, 1.1, d / 2 + 1.6, { t: 0.01 }));
    return { w, d, door: [0, d / 2 + 1.6] };
  },

  // 🔤 ABC 놀이터: 알록달록 유치원 집 + 미끄럼틀·그네·글자 블록
  eng(g) {
    const w = 7; const d = 5.5; const h = 3.8;
    walls(g, { w, d, h, wall: '#fff0f5', frame: '#5aa9f0' });
    gableRoof(g, { w, d, rise: 2.4, y: 0.6 + h, color: '#5aa9f0', wall: '#fff0f5' });
    windowAt(g, -2.1, 2.3, d / 2, { shutter: '#ffd23f' }); windowAt(g, 2.1, 2.3, d / 2, { shutter: '#ff6b8b' });
    doorAt(g, 0, d / 2, { color: '#ffd23f', awning: '#ff6b8b' });
    // 지붕 위 ABC 블록
    [['#ff6b8b', -1.1], ['#ffd23f', 0], ['#1dd1a1', 1.1]].forEach(([c, x]) => P(g, box(0.9, 0.9, 0.9), c, x, 0.6 + h + 2.4 + 0.2 - Math.abs(x) * 0.6, d / 2 + 0.4));
    emblem(g, -1.1, 0.6 + h + 1.95, d / 2 + 0.87, 'A', 0.7); emblem(g, 0, 0.6 + h + 2.6, d / 2 + 0.87, 'B', 0.7); emblem(g, 1.1, 0.6 + h + 1.95, d / 2 + 0.87, 'C', 0.7);
    // 미끄럼틀
    P(g, box(0.15, 2.4, 0.15), '#ff9f43', 5.0, 1.2, -0.6); P(g, box(0.15, 2.4, 0.15), '#ff9f43', 6.1, 1.2, -0.6);
    P(g, box(1.4, 0.15, 1.4), '#ff9f43', 5.55, 2.4, -0.6); const sl = P(g, box(1.0, 0.12, 3.9), '#ffd23f', 5.55, 1.3, 1.0); sl.rotation.x = 0.6;
    for (let i = 0; i < 4; i++) P(g, box(1.0, 0.08, 0.08), '#ffffff', 5.55, 0.5 + i * 0.5, -1.35, { t: 0.01 });
    // 그네
    for (const s of [-1, 1]) { const leg = P(g, box(0.15, 2.8, 0.15), '#3c8dde', -5.2 + s * 1.2, 1.4, 0.8); leg.rotation.z = s * 0.15; }
    P(g, box(2.8, 0.15, 0.15), '#3c8dde', -5.2, 2.8, 0.8); P(g, box(0.7, 0.1, 0.4), '#ff6b8b', -5.2, 0.7, 0.8);
    for (const s of [-1, 1]) g.add(at(new THREE.Mesh(cyl(0.02, 0.02, 2.1, 4), toon(OUTLINE)), -5.2 + s * 0.3, 1.75, 0.8));
    return { w: w + 6, d, door: [0, d / 2 + 1.6] };
  },

  // 🏰 숫자 성: 성벽·둥근 탑 둘·뾰족 지붕·깃발·아치 성문
  math(g) {
    const w = 8; const d = 5; const h = 4.2;
    M(g, box(w, h, d), texMat('stone', '#f2d58a', w / 2.5, h / 2.5), 0, h / 2, 0, { t: 0.05 });
    for (let i = -3; i <= 3; i++) M(g, box(0.8, 0.8, d * 0.3), texMat('stone', '#f2d58a', 0.3, 0.3), i * 1.15, h + 0.4, d / 2 - d * 0.15, { t: 0.03 });
    for (const s of [-1, 1]) {
      M(g, cyl(1.5, 1.6, 7, 16), texMat('stone', '#f6e2a6', 3, 2.5), s * (w / 2 + 0.6), 3.5, 0.2, { t: 0.05 });
      P(g, new THREE.ConeGeometry(1.9, 2.6, 16), '#ff6b8b', s * (w / 2 + 0.6), 8.3, 0.2, { t: 0.05 });
      P(g, cyl(0.05, 0.05, 1.4, 6), '#5b3a1e', s * (w / 2 + 0.6), 10.2, 0.2, { t: 0.01 });
      const fl = P(g, box(0.9, 0.55, 0.06), s < 0 ? '#3c8dde' : '#ffd23f', s * (w / 2 + 0.6) + 0.45, 10.6, 0.2, { t: 0.01 }); void fl;
      windowAt(g, s * (w / 2 + 0.6), 5.2, 1.65, { w: 0.6, h: 1.0, shutter: null, flowers: false });
    }
    // 아치 성문
    const gate = M(g, new THREE.CylinderGeometry(1.4, 1.4, 0.3, 16, 1, false, -Math.PI / 2, Math.PI), texMat('plank', '#8a5a34', 1, 0.5), 0, 2.2, d / 2 + 0.02, { t: 0.02 }); gate.rotation.x = Math.PI / 2; gate.rotation.y = Math.PI / 2;
    M(g, box(2.8, 2.2, 0.3), texMat('plank', '#8a5a34', 1, 1), 0, 1.1, d / 2 + 0.02, { t: 0.02 });
    for (let i = -1; i <= 1; i++) g.add(at(new THREE.Mesh(box(0.08, 3.4, 0.34), toon('#5b3a1e')), i * 0.7, 1.7, d / 2 + 0.06));
    // 숫자 깃발
    [['1', '#48b4e8', -2.6], ['+', '#1dd1a1', 2.6]].forEach(([t, c, x]) => { P(g, box(1.1, 1.6, 0.1), c, x, 2.6, d / 2 + 0.06, { t: 0.01 }); emblem(g, x, 2.6, d / 2 + 0.13, t, 0.9); });
    M(g, box(4, 0.25, 1.2), texMat('stone', '#c9c2b4', 1.5, 0.5), 0, 0.12, d / 2 + 0.8, { t: 0.02 });
    return { w: w + 3, d, door: [0, d / 2 + 1.6] };
  },

  // 🔭 반짝 별 관측소: 둥근 돌탑 + 열린 돔 + 망원경 + 별 간판, 옆에 작은 연구실
  sci(g) {
    M(g, cyl(3.2, 3.4, 4.6, 24), texMat('stone', '#e8e4f2', 6, 2), 0, 2.3, 0, { t: 0.05 });
    P(g, cyl(3.5, 3.5, 0.4, 24), '#7f6cf0', 0, 4.7, 0, { t: 0.03 });
    P(g, new THREE.SphereGeometry(3.3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), '#5b6cff', 0, 4.8, 0, { t: 0.05 });
    P(g, box(1.2, 3.2, 3.4), '#2b2b4a', 0, 6.6, 1.3, { t: 0.02 });
    const tel = P(g, cyl(0.45, 0.6, 3.2, 14), '#d6d6e6', 0, 7.2, 1.9, { t: 0.03 }); tel.rotation.x = -0.75;
    P(g, cyl(0.5, 0.5, 0.3, 14), '#3b3b4f', 0, 8.3, 3.0, { t: 0.02 }).rotation.x = -0.75;
    windowAt(g, -2.0, 3.1, 2.3, { w: 0.9, h: 1.1, shutter: null, flowers: false }); windowAt(g, 2.0, 3.1, 2.3, { w: 0.9, h: 1.1, shutter: null, flowers: false });
    doorAt(g, 0, 3.05, { color: '#5b6cff' });
    emblem(g, 0, 4.0, 3.35, '⭐', 1.2);
    // 작은 연구실
    const lab = new THREE.Group(); lab.position.set(5.2, 0, 0.6); g.add(lab);
    walls(lab, { w: 3.6, d: 3.6, h: 2.8, wall: '#dff7ff', frame: '#5b6cff' });
    gableRoof(lab, { w: 3.6, d: 3.6, rise: 1.6, y: 3.4, color: '#7f6cf0', wall: '#dff7ff', over: 0.4 });
    windowAt(lab, 0, 2.0, 1.8, { w: 1.0, h: 1.0, shutter: '#7f6cf0' });
    // 실험 도구
    P(g, box(1.6, 0.8, 0.8), '#a8743e', -4.6, 0.4, 2.2); P(g, cyl(0.15, 0.3, 0.5, 10), '#7fe0c4', -4.9, 1.05, 2.2, { t: 0.01 }); P(g, cyl(0.12, 0.12, 0.6, 10), '#ff9ec7', -4.3, 1.1, 2.2, { t: 0.01 });
    return { w: 12, d: 7, door: [0, 4.7] };
  },

  // 🤖 삐뽀 로봇 공장: 톱니 지붕 벽돌 공장, 큰 셔터 문, 굴뚝 둘, 돌아가는 톱니, 로봇 동상
  code(g) {
    const w = 11; const d = 7; const h = 4.6;
    M(g, box(w + 0.4, 0.6, d + 0.4), texMat('stone', '#b8b4c4', 4, 0.4), 0, 0.3, 0, { t: 0.04 });
    M(g, box(w, h, d), texMat('brick', '#8f8ad6', w / 2.5, h / 2), 0, 0.6 + h / 2, 0, { t: 0.05 });
    // 톱니 지붕
    for (let i = 0; i < 3; i++) {
      const x = -w / 2 + w / 6 + (i * w) / 3;
      const tri = new THREE.Shape(); tri.moveTo(-w / 6, 0); tri.lineTo(w / 6, 0); tri.lineTo(w / 6, 1.8); tri.closePath();
      const tg = new THREE.ExtrudeGeometry(tri, { depth: d + 0.6, bevelEnabled: false }); tg.translate(0, 0, -(d + 0.6) / 2); tg.rotateY(Math.PI / 2);
      const r = at(part(tg, '#3c5bd6', { t: 0.04 }), x, 0.6 + h, 0); r.rotation.y = Math.PI / 2; g.add(r);
      g.add(at(new THREE.Mesh(box(w / 3 - 0.3, 1.5, 0.1), toon('#9fdcff')), x, 0.6 + h + 0.85, -0.1));
    }
    for (const [x, hh] of [[3.6, 3.2], [1.8, 2.4]]) { M(g, cyl(0.45, 0.55, hh, 12), texMat('brick', '#b55a3c', 1, hh / 1.5), x, 0.6 + h + hh / 2, -2.2, { t: 0.03 }); P(g, cyl(0.6, 0.6, 0.2, 12), '#5b3a1e', x, 0.6 + h + hh, -2.2, { t: 0.02 }); }
    // 셔터 문
    P(g, box(3.6, 3.2, 0.2), '#3b3b4f', -2.2, 2.2, d / 2 + 0.02, { t: 0.02 });
    for (let i = 0; i < 7; i++) g.add(at(new THREE.Mesh(box(3.3, 0.32, 0.24), toon(i % 2 ? '#c9c9d6' : '#e6e6ee')), -2.2, 0.85 + i * 0.4, d / 2 + 0.05));
    P(g, box(4.0, 0.3, 0.3), '#ffd23f', -2.2, 3.95, d / 2 + 0.05, { t: 0.02 });
    windowAt(g, 2.3, 2.6, d / 2, { w: 1.4, h: 1.2, shutter: null, flowers: false }); windowAt(g, 4.3, 2.6, d / 2, { w: 1.4, h: 1.2, shutter: null, flowers: false });
    doorAt(g, 3.3, d / 2, { w: 1.2, h: 2.0, color: '#7b6cf0', steps: true });
    // 톱니바퀴
    const spinners = [];
    for (const [x, y, r, sp] of [[-2.2, 4.9, 0.9, 0.8], [-0.7, 5.3, 0.55, -1.3]]) {
      const gear = new THREE.Group(); gear.position.set(x, y, d / 2 + 0.25); g.add(gear);
      gear.add(part(cyl(r, r, 0.3, 18), '#ffd23f', { t: 0.02 })); gear.children[0].rotation.x = Math.PI / 2;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const t = at(part(box(0.3, 0.35, 0.3), '#ffd23f', { t: 0.015 }), Math.cos(a) * (r + 0.12), Math.sin(a) * (r + 0.12), 0); t.rotation.z = a; gear.add(t); }
      spinners.push({ obj: gear, sp });
    }
    // 로봇 동상
    const rb = new THREE.Group(); rb.position.set(-6.8, 0, 2.6); g.add(rb);
    rb.add(at(part(box(1.4, 0.4, 1.4), '#c9c2b4'), 0, 0.2, 0)); rb.add(at(part(box(1.0, 1.1, 0.7), '#c9c9d6'), 0, 0.95, 0)); rb.add(at(part(box(0.9, 0.75, 0.75), '#e6e6ee'), 0, 1.9, 0));
    for (const s of [-1, 1]) { rb.add(at(new THREE.Mesh(sph(0.11, 8, 6), toon('#5fd38d')), s * 0.2, 1.95, 0.38)); rb.add(at(part(box(0.25, 0.8, 0.25), '#c9c9d6'), s * 0.65, 1.0, 0)); }
    rb.add(at(part(cyl(0.03, 0.03, 0.45, 6), OUTLINE), 0, 2.5, 0)); rb.add(at(part(sph(0.12, 8, 6), '#ff6b8b'), 0, 2.75, 0));
    // 상자 더미
    P(g, box(1, 1, 1), '#c98a52', 6.4, 0.5, 2.2); P(g, box(0.8, 0.8, 0.8), '#c98a52', 6.5, 1.4, 2.0); P(g, cyl(0.45, 0.45, 1.0, 12), '#3c8dde', 6.6, 0.5, 0.8);
    return { w: w + 3, d, door: [3.3, d / 2 + 1.6], spinners };
  },

  // 🎤 딩동 음악 무대: 팔각 정자 무대, 뾰족 지붕, 커튼, 피아노·북, 음표 장식
  music(g) {
    const R = 3.8; const n = 8;
    M(g, cyl(R + 0.3, R + 0.5, 0.9, n), texMat('stone', '#e6d8c0', 4, 0.5), 0, 0.45, 0, { t: 0.05 });
    M(g, cyl(R, R, 0.15, n), texMat('plank', '#c98a52', 4, 4), 0, 0.97, 0, { t: 0.02 });
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / n; P(g, cyl(0.15, 0.15, 3.6, 8), '#ffffff', Math.sin(a) * (R - 0.3), 2.8, Math.cos(a) * (R - 0.3), { t: 0.02 }); }
    P(g, cyl(R + 0.4, R + 0.4, 0.35, n), '#f06aa8', 0, 4.75, 0, { t: 0.04 });
    P(g, new THREE.ConeGeometry(R + 0.6, 2.6, n), '#f06aa8', 0, 6.2, 0, { t: 0.05 });
    P(g, sph(0.35, 10, 8), '#ffd23f', 0, 7.6, 0);
    // 뒤쪽 커튼
    for (let i = -2; i <= 2; i++) P(g, cyl(0.32, 0.32, 3.3, 10), '#d63a6e', i * 0.6, 2.7, -R + 0.8, { t: 0.02 });
    // 피아노·북
    P(g, box(1.8, 0.9, 0.9), '#1f1f1f', -1.2, 1.5, -1.0); g.add(at(new THREE.Mesh(box(1.7, 0.05, 0.3), toon('#ffffff')), -1.2, 1.97, -0.6));
    P(g, cyl(0.55, 0.55, 0.6, 16), '#ff9f43', 1.4, 1.35, -0.8); P(g, cyl(0.4, 0.4, 0.5, 16), '#48b4e8', 2.1, 1.3, 0.1);
    P(g, box(1.4, 0.4, 0.9), '#c9c2b4', 0, 0.2, R + 0.6, { t: 0.02 }); // 계단
    // 음표
    [[-2.4, 6.0], [2.6, 5.6]].forEach(([x, y]) => emblem(g, x, y, 1.8, '🎵', 1.1));
    // 꽃 화분
    for (const s of [-1, 1]) { P(g, cyl(0.5, 0.4, 0.7, 12), '#c0603d', s * 4.8, 0.35, 2.4); for (let i = 0; i < 4; i++) P(g, sph(0.18, 6, 5), ['#ff6b8b', '#ffd23f', '#ffffff', '#c56cf0'][i], s * 4.8 + (i - 1.5) * 0.18, 0.85, 2.4, { line: false }); }
    return { w: 10, d: 9, door: [0, R + 1.8] };
  },

  // 🌈 무지개 물감 공방: 오두막 + 무지개 차양 + 큰 팔레트 간판 + 바깥 이젤 그림들
  art(g) {
    const w = 8; const d = 6; const h = 4;
    walls(g, { w, d, h, wall: '#fff3e0', frame: '#a8743e', kind: 'plank' });
    gableRoof(g, { w, d, rise: 2.6, y: 0.6 + h, color: '#ff9346', wall: '#fff3e0' });
    windowAt(g, -2.4, 2.4, d / 2, { w: 1.6, h: 1.5, shutter: '#ff6b8b' }); windowAt(g, 2.5, 2.4, d / 2, { w: 1.6, h: 1.5, shutter: '#48b4e8' });
    doorAt(g, 0, d / 2, { color: '#48b4e8' });
    // 무지개 차양
    ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'].forEach((c, i) => { const s = P(g, box(w + 0.4, 0.12, 0.3), c, 0, 0.6 + h - 0.15 - i * 0.07, d / 2 + 0.2 + i * 0.28, { t: 0.01 }); s.rotation.x = 0.3; });
    // 팔레트 간판
    const pal = P(g, cyl(1.1, 1.1, 0.15, 20), '#f6e1b8', 0, 0.6 + h + 1.2, d / 2 + 0.25, { t: 0.02 }); pal.rotation.x = Math.PI / 2; pal.scale.z = 0.75;
    ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#8e24aa'].forEach((c, i) => { const a = (i / 5) * Math.PI * 1.6 + 0.4; g.add(at(new THREE.Mesh(sph(0.18, 8, 6), toon(c)), Math.cos(a) * 0.65, 0.6 + h + 1.2 + Math.sin(a) * 0.45, d / 2 + 0.36)); });
    chimney(g, -2.4, 0.6 + h + 0.8, -1, 1.5);
    // 이젤과 그림
    [[5.2, 2.2, '#fdd835', 0.4], [6.6, 0.4, '#81d4fa', -0.3]].forEach(([x, z, c, ry]) => {
      const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry; g.add(e);
      for (const s of [-1, 1]) { const l = at(part(box(0.1, 2.2, 0.1), '#8d5a34'), s * 0.45, 1.1, 0); l.rotation.z = s * 0.12; e.add(l); }
      e.add(at(part(box(1.3, 1.0, 0.08), c), 0, 1.6, 0.08));
      e.add(at(new THREE.Mesh(sph(0.25, 8, 6), toon('#ff6b8b')), -0.2, 1.7, 0.15)); e.add(at(new THREE.Mesh(sph(0.2, 8, 6), toon('#43a047')), 0.3, 1.45, 0.15));
    });
    // 물감 통
    ['#e53935', '#1e88e5', '#fdd835'].forEach((c, i) => P(g, cyl(0.3, 0.3, 0.5, 12), c, -5.0 + i * 0.7, 0.25, 2.6, { t: 0.02 }));
    return { w: w + 4, d, door: [0, d / 2 + 1.6] };
  },

  // 🚂 세계 여행 기차역: 시계탑 역사 + 플랫폼 지붕 + 기찻길과 작은 기차 + 지구본 간판
  soc(g) {
    const w = 8; const d = 5.5; const h = 4;
    walls(g, { w, d, h, wall: '#e6f4e6', frame: '#2f7d55' });
    gableRoof(g, { w, d, rise: 2.2, y: 0.6 + h, color: '#3fbf7f', wall: '#e6f4e6' });
    windowAt(g, -2.4, 2.3, d / 2, { shutter: '#2f7d55' }); windowAt(g, 2.4, 2.3, d / 2, { shutter: '#2f7d55' });
    doorAt(g, 0, d / 2, { color: '#2f7d55', awning: '#3fbf7f' });
    // 시계탑
    M(g, box(2, 3.2, 2), texMat('brick', '#d9a066', 1, 1.5), 0, 0.6 + h + 1.6 + 1.2, -0.5, { t: 0.04 });
    const clk = P(g, cyl(0.75, 0.75, 0.15, 20), '#ffffff', 0, 0.6 + h + 3.4, 0.55, { t: 0.02 }); clk.rotation.x = Math.PI / 2;
    for (const [len, ang] of [[0.45, 0.4], [0.6, 2.2]]) { const hd = at(new THREE.Mesh(box(0.06, len, 0.05), toon(OUTLINE)), Math.sin(ang) * len / 2, 0.6 + h + 3.4 + Math.cos(ang) * len / 2, 0.65); hd.rotation.z = -ang; g.add(hd); }
    P(g, new THREE.ConeGeometry(1.6, 1.6, 4), '#2f7d55', 0, 0.6 + h + 5.6, -0.5, { t: 0.04 }).rotation.y = Math.PI / 4;
    // 플랫폼과 지붕
    M(g, box(14, 0.5, 2.2), texMat('stone', '#d8d2c4', 6, 1), 5.0, 0.25, -d / 2 - 1.8, { t: 0.03 });
    for (const x of [1.0, 5.0, 9.0]) P(g, cyl(0.12, 0.12, 3, 8), '#2f7d55', x, 1.8, -d / 2 - 1.4, { t: 0.02 });
    const can = M(g, box(10, 0.2, 2.8), texMat('stripe', '#3fbf7f', 6, 1), 5.0, 3.3, -d / 2 - 1.6, { t: 0.02 }); can.rotation.x = -0.12;
    // 기찻길과 기차
    for (let i = -6; i <= 16; i++) P(g, box(0.4, 0.1, 1.8), '#8d5a34', i * 0.9, 0.05, -d / 2 - 4.1, { t: 0.01 });
    for (const s of [-1, 1]) P(g, box(21, 0.12, 0.12), '#9e9e9e', 4.5, 0.15, -d / 2 - 4.1 + s * 0.6, { line: false });
    const tr = new THREE.Group(); tr.position.set(9, 0, -d / 2 - 4.1); g.add(tr);
    tr.add(at(part(box(2.6, 1.6, 1.5), '#ef5b5b'), 0, 1.2, 0)); tr.add(at(part(cyl(0.6, 0.6, 2.0, 14), '#3b4a6b'), 2.1, 1.0, 0)); tr.children[1].rotation.z = Math.PI / 2;
    tr.add(at(part(cyl(0.22, 0.3, 0.8, 10), '#3b4a6b'), 2.6, 2.1, 0)); tr.add(at(part(box(2.4, 1.3, 1.5), '#ffd23f'), -2.8, 1.0, 0));
    for (const x of [-3.4, -2.2, -0.7, 0.7, 2.4]) for (const s of [-1, 1]) { const wh = at(part(cyl(0.35, 0.35, 0.15, 14), '#3b3b4f', { t: 0.01 }), x, 0.4, s * 0.8); wh.rotation.x = Math.PI / 2; tr.add(wh); }
    // 지구본 간판
    const gl = new THREE.Group(); gl.position.set(-5.4, 0, 1.8); g.add(gl);
    gl.add(at(part(cyl(0.12, 0.2, 1.6, 8), '#8d5a34'), 0, 0.8, 0)); gl.add(at(part(sph(0.85, 18, 14), '#48b4e8'), 0, 2.3, 0));
    gl.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.87, 18, 14, 0.4, 1.6, 0.5, 1.3), toon('#5cbf3c')), 0, 2.3, 0));
    // 짐가방
    P(g, box(0.9, 0.7, 0.4), '#a8743e', 4.8, 0.35, 2.4); P(g, box(0.7, 0.55, 0.35), '#ff6b8b', 5.6, 0.3, 2.6);
    return { w: w + 4, d: d + 8, door: [0, d / 2 + 1.6] };
  },

  // ⚽ 튼튼 운동장: 울타리 친 잔디 구장 + 작은 클럽하우스 + 점수판 + 관중석
  pe(g) {
    const fld = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), texMat('mow', '#5fae3e', 3, 1)); fld.rotation.x = -Math.PI / 2; fld.position.y = 0.03; fld.receiveShadow = true; g.add(fld);
    const ln = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.55, 30), toon('#ffffff')); ln.rotation.x = -Math.PI / 2; ln.position.y = 0.05; g.add(ln);
    g.add(at(new THREE.Mesh(box(0.12, 0.02, 8), toon('#ffffff')), 0, 0.05, 0));
    for (const sx of [-1, 1]) { P(g, box(0.15, 1.6, 0.15), '#ffffff', sx * 5.6, 0.8, -1.4); P(g, box(0.15, 1.6, 0.15), '#ffffff', sx * 5.6, 0.8, 1.4); P(g, box(0.15, 0.15, 2.95), '#ffffff', sx * 5.6, 1.6, 0); }
    P(g, sph(0.35, 14, 10), '#ffffff', 1.6, 0.35, 0.8);
    // 클럽하우스
    const cb = new THREE.Group(); cb.position.set(0, 0, -6.2); g.add(cb);
    walls(cb, { w: 6, d: 3.4, h: 2.8, wall: '#e8f7dd', frame: '#5cbf3c' });
    gableRoof(cb, { w: 6, d: 3.4, rise: 1.6, y: 3.4, color: '#5cbf3c', wall: '#e8f7dd', over: 0.4 });
    windowAt(cb, -1.6, 2.0, 1.7, { w: 1.1, h: 1.0, shutter: '#ff9f43' }); doorAt(cb, 1.3, 1.7, { w: 1.1, h: 1.9, color: '#ff9f43' });
    // 점수판
    P(g, box(0.15, 3.0, 0.15), '#3b3b4f', 6.8, 1.5, -3.8); P(g, box(2.4, 1.4, 0.25), '#2b2b3a', 6.8, 3.2, -3.8, { t: 0.02 });
    emblem(g, 6.8, 3.2, -3.66, '⚽', 1.0);
    // 관중석
    for (let i = 0; i < 3; i++) P(g, box(5, 0.35, 0.8), ['#ff6b8b', '#ffd23f', '#48b4e8'][i], -7.4, 0.3 + i * 0.4, -1 - i * 0.8, { t: 0.02 }).rotation.y = Math.PI / 2;
    return { w: 14, d: 14, door: [0, 4.8] };
  },
};
