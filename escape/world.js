// 꼬마 탐험대 공원의 3D 세상
// - 만남의 분수 광장(가운데) → 문(아치)을 지나 놀이 구역 9곳으로 순간이동
// - 놀이 구역마다 랜드마크·동물 친구·보물 상자 3개·열쇠
// - 열기구 탈출장: 상자 4개에서 비밀번호 숫자를 찾아 열기구를 타고 날아간다
// 모든 장소를 한 장면 안에 멀리 떨어뜨려 두어서, 같은 구역에 있는 친구만 화면에 보인다.
import { THREE, toon, part, at, sph, cap, cyl, box, OUTLINE } from './toon.js';
import { buildAvatar, buildPet, animateBody } from './avatar.js';
import { SUBJECTS, SUBJECT, STAMPS_TO_FLY } from './content.js';

// ---------- 장소 ----------
export const AREAS = {
  plaza: { cx: 0, cz: 0, hw: 22, hd: 16, cam: [0, 20, 17], spec: [0, 30, 27], follow: 1, ahead: 6 },
  balloon: { cx: -320, cz: 0, hw: 13, hd: 9, cam: [0, 16, 15], spec: [0, 21, 19], follow: 0.45 },
};
SUBJECTS.forEach((s, i) => { AREAS[`zone:${s.id}`] = { cx: 320 + i * 80, cz: 0, hw: 12, hd: 8, cam: [0, 15, 14], spec: [0, 19, 17], follow: 0.35, subj: s.id }; });
export const PLAZA_SPAWN = { x: 0, z: 9 };

// 광장의 문: [과목, 벽, 자리]
const GATES = [
  ['kor', 'back', -15], ['eng', 'back', -8], ['math', 'back', 8], ['soc', 'back', 15],
  ['sci', 'left', -6], ['code', 'left', 4], ['music', 'right', -7], ['art', 'right', 1], ['pe', 'right', 9],
];

const FONT = '"Jua", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const BROWN = '#5b3a1e';
const CREAM = '#fff8ea';

// ---------- 글씨 그림 ----------
export function textCanvas(lines, { size = 64, fg = BROWN, bg = CREAM, border = BROWN, pad = 18, radius = 24, shadow = true } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = `${size}px ${FONT}`;
  ctx.font = font;
  const w = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width), size) + pad * 2 + 8);
  const lh = size * 1.18;
  const h = Math.ceil(lh * lines.length + pad * 1.3 + (bg && shadow ? 8 : 0) + 6);
  c.width = w; c.height = h;
  ctx.font = font;
  const bh = h - (bg && shadow ? 8 : 0) - 6;
  if (bg) {
    if (shadow) { ctx.fillStyle = border || BROWN; ctx.beginPath(); ctx.roundRect(4, 11, w - 8, bh, radius); ctx.fill(); }
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(4, 3, w - 8, bh, radius); ctx.fill();
    if (border) { ctx.lineWidth = 6; ctx.strokeStyle = border; ctx.stroke(); }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const y0 = 3 + (bh - lh * lines.length) / 2;
  if (!bg) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = BROWN; ctx.lineJoin = 'round'; lines.forEach((l, i) => ctx.strokeText(l, w / 2, y0 + lh * (i + 0.55))); }
  ctx.fillStyle = fg;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, y0 + lh * (i + 0.55)));
  return c;
}
function paint(sp) {
  const { lines, opts, height } = sp.userData;
  const c = textCanvas(lines, opts);
  const old = sp.material.map;
  sp.material.map = new THREE.CanvasTexture(c);
  sp.material.map.colorSpace = THREE.SRGBColorSpace;
  sp.material.map.anisotropy = 4;
  sp.material.needsUpdate = true;
  old?.dispose();
  sp.scale.set((height * c.width) / c.height, height, 1);
}
export function makeSprite(lines, height, opts = {}) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false, transparent: true }));
  sp.userData = { lines, opts, height };
  paint(sp);
  // 귀여운 글꼴이 늦게 내려오면 다시 그린다
  const text = lines.join('');
  const f = `${opts.size || 64}px "Jua"`;
  if (document.fonts && !document.fonts.check(f, text)) document.fonts.load(f, text).then(() => paint(sp)).catch(() => {});
  return sp;
}
export function setSprite(sp, lines, opts = sp.userData.opts) {
  sp.userData.lines = lines; sp.userData.opts = opts;
  paint(sp);
  const f = `${opts.size || 64}px "Jua"`;
  if (document.fonts && !document.fonts.check(f, lines.join(''))) document.fonts.load(f, lines.join('')).then(() => paint(sp)).catch(() => {});
}
function canvasTex(draw, w, h, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// ---------- 도형 합치기: 각 도형의 자리·크기를 꼭짓점에 굽고 이어 붙인다 ----------
function mergeBaked(meshes) {
  const pos = []; const nor = []; const uv = []; const idx = [];
  let base = 0;
  const nm = new THREE.Matrix3();
  const v = new THREE.Vector3();
  for (const m of meshes) {
    const g = m.geometry;
    const P = g.attributes.position; const Nn = g.attributes.normal; const U = g.attributes.uv;
    if (!P) continue;
    nm.getNormalMatrix(m.matrixWorld);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); pos.push(v.x, v.y, v.z);
      if (Nn) { v.fromBufferAttribute(Nn, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); } else nor.push(0, 1, 0);
      if (U) uv.push(U.getX(i), U.getY(i)); else uv.push(0, 0);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
    else for (let i = 0; i < P.count; i++) idx.push(i + base);
    base += P.count;
  }
  if (!base) return null;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(base > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

// ---------- 이름표 ----------
function label(name, me) {
  return makeSprite([name], 0.42, { size: 46, bg: me ? '#5b4bff' : CREAM, fg: me ? '#fff' : BROWN, pad: 12, radius: 18 });
}
function setBadge(av, keys) {
  const u = av.userData;
  if (u.badge) { av.remove(u.badge); u.badge.material.map?.dispose(); u.badge = null; }
  if (!keys) return;
  u.badge = makeSprite([`🗝️${keys}`], 0.34, { size: 40, bg: '#ffd36b', pad: 8, radius: 14 });
  u.badge.position.y = 2.72;
  av.add(u.badge);
}
export function emoteOn(av, emoji) {
  const u = av.userData;
  if (u.bubble) av.remove(u.bubble);
  u.bubble = makeSprite([emoji], 0.8, { size: 80, pad: 10, radius: 30 });
  u.bubble.position.y = 3.1;
  u.bubbleT = 2.6;
  av.add(u.bubble);
}
// 캐릭터 + 이름표 + 같이 다니는 친구
function makeCharacter(look, name, me) {
  const root = new THREE.Group();
  const body = buildAvatar(look);
  root.add(body);
  const lb = label(name, me);
  lb.position.y = 2.35;
  root.add(lb);
  root.userData = { body, label: lb, petId: body.userData.look.pet, bubble: null, bubbleT: 0 };
  return root;
}

// ============================================================
export class World {
  constructor(canvas, { onInteract = () => {}, onPrompt = () => {}, onArea = () => {} } = {}) {
    this.canvas = canvas;
    this.onInteract = onInteract;
    this.onPrompt = onPrompt;
    this.onArea = onArea;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = canvasTex((x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7cc8ff'); g.addColorStop(0.7, '#d4f0ff'); g.addColorStop(1, '#eafaff'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 4, 256);
    this.scene.fog = new THREE.Fog('#d9f2ff', 70, 150);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 200);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#a3d98a', 1.55));
    const sun = this.sun = new THREE.DirectionalLight('#fff3d6', 1.9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 90;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target);

    this.interactables = [];
    this.obstacles = {};
    this.stations = {};
    this.keys = {};
    this.gateSigns = {};
    this.boards = {};
    this.remotes = new Map();
    this.bobbers = [];
    this.spinners = [];
    this.pulsers = [];
    this.particles = [];
    this.clouds = [];
    this.floors = [];
    this.trees = []; // [x, z, scale, color]
    this.flowers = []; // [x, z, color]
    this.input = { x: 0, z: 0 };
    this.keysDown = new Set();
    this.target = null; this.pending = null; this.near = null;
    this.frozen = false; this.paused = false; this.spectating = null;
    this.player = null; this.area = 'plaza';
    this.pos = new THREE.Vector3(PLAZA_SPAWN.x, 0, PLAZA_SPAWN.z);
    this.rot = Math.PI;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.zoom = 1;
    this.onZoom = () => {};

    this.buildPlaza();
    SUBJECTS.forEach((s) => this.buildZone(s));
    this.buildBalloonField();
    this.finishNature();
    this.scene.traverse((o) => { if (o.isMesh && !o.userData.outline) { o.receiveShadow = true; if (!o.userData.flat) o.castShadow = true; } });
    this.mergeStatic();
    this.bindInput();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  // ---------- 짓기 도우미 ----------
  add(o) { this.scene.add(o); return o; }
  P(geo, color, x, y, z, opts) { return this.add(at(part(geo, color, opts), x, y, z)); }
  addObstacle(area, o) { (this.obstacles[area] ||= []).push(o); }
  addInteract(it) {
    this.interactables.push(it);
    const mark = (o) => o.traverse((m) => { if (m.isMesh) m.userData.interact = it; });
    if (it.mesh) mark(it.mesh);
    return it;
  }
  bob(obj, amp = 0.1, speed = 2) { obj.userData.keep = true; this.bobbers.push({ obj, base: obj.position.y, amp, speed, phase: Math.random() * 6 }); return obj; }

  ground(area, { pathColor = '#f3dfb4', pathR = null } = {}) {
    const a = AREAS[area];
    const grassTex = this.grassTex ||= canvasTex((x, w, h) => {
      x.fillStyle = '#8fd46f'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { x.fillStyle = Math.random() < 0.5 ? '#84cb63' : '#9ade7b'; const px = Math.random() * w; const py = Math.random() * h; x.fillRect(px, py, 3, 7); }
    }, 256, 256, [24, 18]);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(a.hw * 2 + 90, a.hd * 2 + 70), toon('#ffffff', { map: grassTex }));
    g.rotation.x = -Math.PI / 2; g.position.set(a.cx, -0.02, a.cz - 10);
    g.userData.flat = true; g.userData.floor = area; g.userData.keep = true;
    this.add(g); this.floors.push(g);
    // 걸어 다니는 흙길 (둥근 마당)
    const pr = pathR || Math.min(a.hw, a.hd) * 0.95;
    const yard = new THREE.Mesh(new THREE.CircleGeometry(1, 48), toon(pathColor));
    yard.scale.set(a.hw * 0.92, a.hd * 0.92, 1);
    yard.rotation.x = -Math.PI / 2; yard.position.set(a.cx, 0.005, a.cz);
    yard.userData.flat = true; yard.userData.floor = area; yard.userData.keep = true;
    this.add(yard); this.floors.push(yard);
    void pr;
    // 울타리: 뒤·옆은 나무 울타리와 덤불, 앞은 꽃밭
    const fence = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0); const n = Math.max(2, Math.round(len / 1.6));
      const ang = Math.atan2(x1 - x0, z1 - z0);
      for (let i = 0; i <= n; i++) { const t = i / n; this.P(cyl(0.09, 0.11, 1.1, 8), '#c98a52', x0 + (x1 - x0) * t, 0.55, z0 + (z1 - z0) * t, { t: 0.02 }); }
      for (const y of [0.45, 0.85]) { const rail = this.P(box(0.1, 0.12, len), '#e0a868', (x0 + x1) / 2, y, (z0 + z1) / 2, { t: 0.02 }); rail.rotation.y = ang; }
    };
    const L = a.cx - a.hw; const R = a.cx + a.hw; const B = a.cz - a.hd; const F = a.cz + a.hd;
    fence(L, B, R, B); fence(L, B, L, F); fence(R, B, R, F);
    for (let x = L; x <= R; x += 0.9) this.flowers.push([x + (Math.random() - 0.5) * 0.4, F + 0.6 + Math.random() * 0.8, null]);
    // 바깥 풍경: 나무·꽃·구름
    for (let i = 0; i < 26; i++) {
      const side = i % 3;
      let x; let z;
      if (side === 0) { x = L - 3 - Math.random() * 14; z = B - 6 + Math.random() * (a.hd * 2 + 6); }
      else if (side === 1) { x = R + 3 + Math.random() * 14; z = B - 6 + Math.random() * (a.hd * 2 + 6); }
      else { x = L - 6 + Math.random() * (a.hw * 2 + 12); z = B - 3 - Math.random() * 14; }
      this.trees.push([x, z, 0.8 + Math.random() * 0.8, ['#4caf50', '#66bb6a', '#43a047', '#81c784', '#f8bbd0'][Math.floor(Math.random() * 5)]]);
    }
    for (let i = 0; i < 70; i++) {
      const x = a.cx + (Math.random() - 0.5) * (a.hw * 2 + 40); const z = a.cz + (Math.random() - 0.5) * (a.hd * 2 + 30);
      if (Math.abs(x - a.cx) < a.hw + 1 && Math.abs(z - a.cz) < a.hd + 2) continue;
      this.flowers.push([x, z, null]);
    }
    for (let i = 0; i < 5; i++) {
      const cl = new THREE.Group();
      for (let k = 0; k < 4; k++) { const s = at(part(sph(1 + Math.random() * 0.7, 14, 10), '#ffffff', { t: 0.06 }), k * 1.3 - 2, Math.random() * 0.5, Math.random() * 0.6); s.scale.y = 0.7; cl.add(s); }
      cl.position.set(a.cx - 30 + i * 15, 11 + Math.random() * 4, a.cz - 22 - Math.random() * 8);
      cl.traverse((m) => { m.userData.flat = true; }); cl.userData.keep = true;
      this.add(cl); this.clouds.push({ g: cl, x0: cl.position.x, sp: 0.3 + Math.random() * 0.4, area });
    }
  }

  // 움직이지 않는 도형들은 재질(색)별로 하나로 합쳐서 그린다. 수천 개를 따로 그리면 태블릿이 느려진다.
  mergeStatic() {
    this.scene.updateMatrixWorld(true);
    // 누를 수 있는 것은 보이지 않는 상자로 대신 잡는다
    for (const it of this.interactables) {
      if (!it.mesh || it.mesh.userData.keep) continue;
      const bb = new THREE.Box3().setFromObject(it.mesh);
      const size = bb.getSize(new THREE.Vector3()); const c = bb.getCenter(new THREE.Vector3());
      const proxy = new THREE.Mesh(box(Math.max(size.x, 0.5), Math.max(size.y, 0.5), Math.max(size.z, 0.5)), new THREE.MeshBasicMaterial({ visible: false }));
      proxy.position.copy(c); proxy.userData.keep = true; proxy.userData.interact = it;
      this.add(proxy); it.mesh = proxy;
    }
    this.scene.updateMatrixWorld(true);
    const groups = new Map(); // material -> {cast, receive, list}
    const victims = [];
    const walk = (o) => {
      if (o.userData.keep) return;
      if (o.isMesh && !o.isInstancedMesh && o.visible) {
        // 장소마다 따로 합쳐야 안 보이는 장소는 그리지 않는다
        const x = o.getWorldPosition(new THREE.Vector3()).x;
        const near = Object.entries(AREAS).reduce((best, [k, a]) => (Math.abs(a.cx - x) < Math.abs(AREAS[best].cx - x) ? k : best), 'plaza');
        const key = `${near}|${o.material.uuid}`;
        if (!groups.has(key)) groups.set(key, { mat: o.material, list: [], cast: false, outline: !!o.userData.outline });
        const g = groups.get(key);
        g.list.push(o);
        g.cast ||= o.castShadow;
        victims.push(o);
      }
      for (const ch of o.children) walk(ch);
    };
    for (const ch of [...this.scene.children]) walk(ch);
    for (const g of groups.values()) {
      const { mat } = g;
      if (g.list.length < 2) { g.list.forEach((o) => victims.splice(victims.indexOf(o), 1)); continue; }
      const geo = mergeBaked(g.list);
      if (!geo) { g.list.forEach((o) => victims.splice(victims.indexOf(o), 1)); continue; }
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = g.cast && !g.outline; m.receiveShadow = !g.outline;
      m.userData.keep = true; m.userData.outline = g.outline;
      this.scene.add(m);
    }
    for (const o of victims) o.parent?.remove(o);
  }

  // 나무·꽃은 한꺼번에 그린다 (빠르게)
  finishNature() {
    const n = this.trees.length;
    const trunkG = cyl(0.18, 0.25, 1.4, 8); trunkG.translate(0, 0.7, 0);
    const topG = new THREE.IcosahedronGeometry(1.1, 1); topG.translate(0, 2.1, 0);
    const trunk = new THREE.InstancedMesh(trunkG, toon('#8d5a34'), n);
    const top = new THREE.InstancedMesh(topG, toon('#ffffff'), n);
    const topLine = new THREE.InstancedMesh(topG, new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide }), n);
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const c = new THREE.Color();
    this.trees.forEach(([x, z, s, col], i) => {
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s)); trunk.setMatrixAt(i, m); top.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, -0.06 * s, z), q, new THREE.Vector3(s * 1.05, s * 1.05, s * 1.05)); topLine.setMatrixAt(i, m);
      top.setColorAt(i, c.set(col));
    });
    trunk.castShadow = top.castShadow = true;
    topLine.userData.outline = true;
    this.add(trunk); this.add(top); this.add(topLine);
    const fl = this.flowers;
    const fg = sph(0.13, 8, 6);
    const flowers = new THREE.InstancedMesh(fg, toon('#ffffff'), fl.length);
    const cols = ['#ff6b8b', '#ffd23f', '#ffffff', '#c56cf0', '#ff9f43', '#48dbfb'];
    fl.forEach(([x, z, col], i) => { m.compose(new THREE.Vector3(x, 0.12, z), q, new THREE.Vector3(1, 1, 1)); flowers.setMatrixAt(i, m); flowers.setColorAt(i, c.set(col || cols[i % cols.length])); });
    flowers.userData.flat = true;
    this.add(flowers);
  }

  // 아치 문
  arch(x, z, facing, color, { w = 3, h = 3.4, area, title, emoji } = {}) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      g.add(at(part(cyl(0.22, 0.26, h, 12), color), s * w / 2, h / 2, 0));
      g.add(at(part(sph(0.3, 12, 10), '#ffd23f'), s * w / 2, h + 0.05, 0));
    }
    const top = at(part(new THREE.TorusGeometry(w / 2, 0.2, 10, 24, Math.PI), color), 0, h, 0);
    g.add(top);
    // 꽃 장식
    for (let i = 0; i < 7; i++) { const a = (i / 6) * Math.PI; g.add(at(part(sph(0.13, 8, 6), ['#ff6b8b', '#ffffff', '#ffd23f'][i % 3], { t: 0.015 }), Math.cos(a) * w / 2, h + Math.sin(a) * w / 2, 0.15)); }
    // 문 안쪽 반짝이는 문
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, h), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
    portal.position.y = h / 2; portal.userData.flat = true; g.add(portal);
    g.position.set(x, 0, z); g.rotation.y = facing;
    this.add(g);
    const sign = makeSprite([`${emoji} ${title}`], 0.8, { size: 56, bg: color, fg: '#fff' });
    const off = new THREE.Vector3(0, h + w / 2 + 0.75, 0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing);
    sign.position.set(x + off.x, off.y, z + off.z);
    this.add(sign); this.bob(sign, 0.08, 1.6);
    // 바닥의 반짝이 고리
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.15, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    const fwd = new THREE.Vector3(0, 0, 1.7).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing);
    ring.position.set(x + fwd.x, 0.03, z + fwd.z); ring.userData.flat = true; ring.userData.keep = true;
    this.add(ring); this.pulsers.push(ring);
    void area;
    return { group: g, sign, ix: x + fwd.x, iz: z + fwd.z, portal };
  }

  // 나무 표지판 (제목 + 한 줄 안내)
  signpost(area, x, z, title, sub) {
    this.P(cyl(0.12, 0.14, 2.6, 8), '#a8743e', x, 1.3, z);
    this.P(box(3.6, 1.5, 0.18), '#d9a066', x, 2.5, z);
    const t = makeSprite([title], 0.62, { size: 56, bg: null, fg: '#fff8c4' });
    t.position.set(x, 2.78, z + 0.2); this.add(t);
    const s = makeSprite([sub], 0.36, { size: 40, bg: null, fg: '#ffffff' });
    s.position.set(x, 2.22, z + 0.2); this.add(s);
    this.boards[area] = s;
    this.addObstacle(area, { x, z, r: 0.5 });
  }

  // 동물 친구 (구역을 지키는 캐릭터)
  host(area, x, z, emoji, name, color) {
    this.P(cyl(0.6, 0.7, 0.5, 16), '#a8743e', x, 0.25, z);
    const e = makeSprite([emoji], 1.4, { size: 120, bg: null, pad: 4 });
    e.position.set(x, 1.3, z); this.add(e); this.bob(e, 0.12, 2.4);
    const n = makeSprite([name], 0.42, { size: 40, bg: color, fg: '#fff', pad: 10, radius: 16 });
    n.position.set(x, 2.25, z); this.add(n);
    this.addObstacle(area, { x, z, r: 0.8 });
  }

  // 보물 상자 (나무 그루터기 위)
  buildStation(area, x, z, i, color) {
    const g = new THREE.Group();
    g.add(at(part(cyl(0.75, 0.85, 0.6, 18), '#a8743e'), 0, 0.3, 0));
    const ringTop = new THREE.Mesh(new THREE.CircleGeometry(0.72, 18), toon('#e3b67a')); ringTop.rotation.x = -Math.PI / 2; ringTop.position.y = 0.61; g.add(ringTop);
    const boxM = at(part(box(1.1, 0.6, 0.8), color), 0, 0.92, 0); g.add(boxM);
    g.add(at(part(box(1.14, 0.12, 0.84), '#ffd23f', { t: 0.015 }), 0, 0.98, 0));
    const lid = new THREE.Group(); lid.position.set(0, 1.22, -0.42);
    const lidM = at(part(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16, 1, false, 0, Math.PI), color), 0, 0, 0.42); lidM.rotation.z = Math.PI / 2; lidM.rotation.y = Math.PI / 2;
    lid.add(lidM); g.add(lid);
    const lock = at(part(box(0.22, 0.26, 0.1), '#ffd23f', { t: 0.012 }), 0, 1.02, 0.44); g.add(lock);
    // 열리면 안에서 반짝
    const glow = new THREE.Mesh(sph(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff27a', transparent: true, opacity: 0.8 })); glow.position.y = 1.2; glow.visible = false; glow.userData.flat = true; g.add(glow);
    g.position.set(x, 0, z); g.userData.keep = true;
    this.add(g);
    const sp = makeSprite([`${i + 1} ❓`], 0.6, { size: 52, pad: 12, border: BROWN });
    sp.position.set(x, 2.25, z); this.add(sp); this.bob(sp, 0.08, 2.4);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.25, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.03, z); ring.userData.flat = true; ring.userData.keep = true; this.add(ring); this.pulsers.push(ring);
    this.addObstacle(area, { x, z, r: 1.0 });
    const it = this.addInteract({ id: `station:${area}:${i}`, kind: 'station', area, x, z: z + 1.75, r: 1.5, label: `🎁 ${i + 1}번 보물 상자 열기`, data: { area, index: i }, mesh: g });
    return { group: g, lid, lock, glow, ring, sprite: sp, solved: false, color, i, it };
  }

  buildKey(area, x, z) {
    const g = new THREE.Group();
    const gold = '#ffcc1a';
    const k = new THREE.Group();
    k.add(at(part(new THREE.TorusGeometry(0.32, 0.1, 10, 24), gold), 0, 0.55, 0));
    k.add(at(part(cyl(0.08, 0.08, 0.9, 10), gold), 0, -0.2, 0));
    k.add(at(part(box(0.3, 0.1, 0.1), gold, { t: 0.012 }), 0.15, -0.5, 0));
    k.add(at(part(box(0.22, 0.1, 0.1), gold, { t: 0.012 }), 0.11, -0.3, 0));
    k.position.y = 1.7;
    g.add(at(part(cyl(0.55, 0.65, 0.5, 20), '#fff1b8'), 0, 0.25, 0), k);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), new THREE.MeshBasicMaterial({ color: '#fff27a', transparent: true, opacity: 0.6, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.03; glow.userData.flat = true; g.add(glow);
    g.position.set(x, 0, z); g.visible = false; g.userData.spin = k; g.userData.keep = true;
    this.add(g); this.keys[area] = g; this.pulsers.push(glow);
    this.addInteract({ id: `key:${area}`, kind: 'key', area, x, z: z + 1.3, r: 1.5, label: '🗝️ 열쇠 받기!', data: { area }, mesh: g, hidden: true });
  }

  bunting(x0, z0, x1, z1, y, colors) {
    const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.55);
    const geo = new THREE.ConeGeometry(0.2, 0.42, 3); geo.rotateX(Math.PI); geo.rotateY(Math.PI / 6);
    for (let i = 0; i <= n; i++) {
      const t = i / n; const sag = Math.sin(Math.PI * t) * 0.7;
      const f = new THREE.Mesh(geo, toon(colors[i % colors.length]));
      f.position.set(x0 + (x1 - x0) * t, y - sag - 0.2, z0 + (z1 - z0) * t);
      f.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
      f.scale.z = 0.3; f.userData.flat = true;
      this.add(f);
    }
  }
  lamp(area, x, z) {
    this.P(cyl(0.08, 0.1, 3, 8), '#3b4a6b', x, 1.5, z, { t: 0.015 });
    this.P(sph(0.28, 12, 10), '#fff6c2', x, 3.1, z);
    this.addObstacle(area, { x, z, r: 0.3 });
  }
  balloons(area, x, z) {
    const g = new THREE.Group();
    ['#ff6b8b', '#ffd23f', '#48dbfb'].forEach((c, i) => {
      const b = at(part(sph(0.32, 14, 12), c), (i - 1) * 0.35, 2.6 + (i % 2) * 0.3, 0); b.scale.y = 1.15; g.add(b);
      const s = new THREE.Mesh(cyl(0.008, 0.008, 2.2, 4), toon(OUTLINE)); s.position.set((i - 1) * 0.17, 1.4, 0); s.rotation.z = -(i - 1) * 0.15; g.add(s);
    });
    g.position.set(x, 0, z); this.add(g); this.bob(g, 0.12, 1.4);
    void area;
  }
  bench(area, x, z, ry = 0) {
    const g = new THREE.Group();
    g.add(at(part(box(2, 0.12, 0.6), '#d9a066'), 0, 0.55, 0));
    g.add(at(part(box(2, 0.5, 0.1), '#d9a066'), 0, 0.9, -0.28));
    for (const s of [-1, 1]) g.add(at(part(box(0.1, 0.55, 0.5), '#8d5a34'), s * 0.85, 0.27, 0));
    g.position.set(x, 0, z); g.rotation.y = ry; this.add(g);
    this.addObstacle(area, { x, z, r: 1.0 });
  }

  // ---------- 만남의 분수 광장 ----------
  buildPlaza() {
    const area = 'plaza';
    const a = AREAS.plaza;
    this.ground(area, { pathColor: '#f6e2b8' });
    // 분수
    const f = new THREE.Group();
    f.add(at(part(cyl(2.6, 2.8, 0.6, 32), '#d9d4ff'), 0, 0.3, 0));
    const water = new THREE.Mesh(new THREE.CircleGeometry(2.35, 32), toon('#7fd0ff')); water.rotation.x = -Math.PI / 2; water.position.y = 0.58; water.userData.flat = true; f.add(water);
    f.add(at(part(cyl(0.35, 0.45, 1.5, 16), '#d9d4ff'), 0, 1.1, 0));
    f.add(at(part(cyl(1.1, 0.7, 0.3, 24), '#d9d4ff'), 0, 1.9, 0));
    const w2 = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), toon('#7fd0ff')); w2.rotation.x = -Math.PI / 2; w2.position.y = 2.06; f.add(w2);
    f.position.set(0, 0, 2); this.add(f);
    this.addObstacle(area, { x: 0, z: 2, r: 2.9 });
    // 물줄기 알갱이
    const N = 90; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#bfe8ff', size: 0.16, transparent: true, opacity: 0.9 }));
    pts.position.set(0, 0, 2); pts.frustumCulled = false; this.add(pts);
    this.fountain = { pts, seeds: Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, t: Math.random(), v: 0.8 + Math.random() * 0.5 })) };

    // 공원 이름 간판
    const sign = makeSprite(['🗺️ 꼬마 탐험대 공원'], 1.4, { size: 84, bg: '#ffd36b' });
    sign.position.set(0, 7.4, a.cz - a.hd - 1); this.add(sign); this.bob(sign, 0.1, 1);

    for (const [subj, side, t] of GATES) {
      const s = SUBJECT[subj];
      let x; let z; let facing;
      if (side === 'back') { x = t; z = a.cz - a.hd + 0.3; facing = 0; }
      else if (side === 'left') { x = a.cx - a.hw + 0.3; z = t; facing = Math.PI / 2; }
      else { x = a.cx + a.hw - 0.3; z = t; facing = -Math.PI / 2; }
      const g = this.arch(x, z, facing, s.color, { area, title: s.name, emoji: s.emoji });
      this.gateSigns[subj] = g.sign;
      this.addInteract({ id: `door:${subj}`, kind: 'door', area, x: g.ix, z: g.iz, r: 1.7, label: `${s.emoji} ${s.name} 들어가기`, data: { subj }, mesh: g.group });
      // 문 뒤로 보이는 작은 랜드마크
      const back = new THREE.Vector3(0, 0, -4.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing);
      const lm = this.landmark(subj, 0.45);
      lm.position.set(x + back.x, 0, z + back.z); lm.rotation.y = facing; this.add(lm);
    }

    // 열기구 탈출장 문 (뒤쪽 가운데) + 뒤에 떠 있는 열기구
    const bg = this.arch(0, a.cz - a.hd + 0.3, 0, '#ff6b8b', { w: 3.6, h: 3.8, area, title: '열기구 탈출장', emoji: '🎈' });
    this.balloonSign = bg.sign;
    this.addInteract({ id: 'roofdoor', kind: 'roofdoor', area, x: bg.ix, z: bg.iz, r: 1.8, label: '🎈 열기구 탈출장 가기', data: {}, mesh: bg.group });
    const hb = this.hotAirBalloon(0.8); hb.position.set(0, 2, a.cz - a.hd - 7); this.add(hb); this.bob(hb, 0.4, 0.7);

    // 꾸미기
    for (const [x, z] of [[-17, 10], [17, 10], [-17, -10], [17, -10], [-8, 12], [8, 12]]) this.lamp(area, x, z);
    this.bunting(-17, 10, -8, 12, 3.1, ['#ff6b8b', '#ffd23f', '#48dbfb', '#1dd1a1']);
    this.bunting(8, 12, 17, 10, 3.1, ['#c56cf0', '#ff9f43', '#48dbfb', '#ff6b8b']);
    this.bunting(-17, -10, 17, -10, 3.1, ['#ff6b8b', '#ffd23f', '#48dbfb', '#1dd1a1', '#c56cf0']);
    this.balloons(area, -12, 7); this.balloons(area, 12, 7);
    this.bench(area, -6, 8.5, 0.3); this.bench(area, 6, 8.5, -0.3);
    for (const [x, z] of [[-19, 14], [19, 14], [-19, -2], [19, -14]]) this.flowerBed(area, x, z);
    this.butterflies(area, 6);
  }
  flowerBed(area, x, z) {
    this.P(cyl(1.0, 1.1, 0.35, 16), '#a8743e', x, 0.17, z);
    for (let i = 0; i < 9; i++) { const a = i * 2.4; this.P(sph(0.16, 8, 6), ['#ff6b8b', '#ffd23f', '#ffffff', '#c56cf0'][i % 4], x + Math.cos(a) * 0.6 * (i / 9), 0.45, z + Math.sin(a) * 0.6 * (i / 9), { t: 0.015 }); }
    this.addObstacle(area, { x, z, r: 1.1 });
  }
  butterflies(area, n) {
    const a = AREAS[area];
    for (let i = 0; i < n; i++) {
      const b = makeSprite([['🦋', '🐝', '🦋'][i % 3]], 0.55, { size: 60, bg: null, pad: 2 });
      b.position.set(a.cx + (Math.random() - 0.5) * a.hw * 1.6, 1.8 + Math.random(), a.cz + (Math.random() - 0.5) * a.hd * 1.4);
      b.userData.fly = { cx: b.position.x, cz: b.position.z, r: 1.5 + Math.random() * 2, sp: 0.4 + Math.random() * 0.5, ph: Math.random() * 6 };
      this.add(b); (this.flyers ||= []).push(b);
    }
  }

  hotAirBalloon(s = 1) {
    const g = new THREE.Group();
    const env = new THREE.Group();
    const stripes = ['#ff6b8b', '#ffd23f', '#48dbfb', '#1dd1a1', '#c56cf0', '#ff9f43'];
    for (let i = 0; i < 12; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(2.4, 6, 18, (i / 12) * Math.PI * 2, Math.PI * 2 / 12, 0, Math.PI * 0.8), toon(stripes[i % 6], { side: THREE.DoubleSide }));
      env.add(seg);
    }
    const line = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide })); line.scale.setScalar(1.025); line.userData.outline = true; env.add(line);
    env.scale.set(1, 1.15, 1); env.position.y = 5.2; g.add(env);
    for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) { const r = new THREE.Mesh(cyl(0.03, 0.03, 2.6, 4), toon('#8d5a34')); r.position.set(x * 1.4, 2.2, z * 1.4); r.rotation.z = -x * 0.35; r.rotation.x = z * 0.35; g.add(r); }
    g.add(at(part(box(1.6, 1.0, 1.6), '#c98a52'), 0, 0.5, 0));
    g.add(at(part(box(1.7, 0.15, 1.7), '#8d5a34', { t: 0.015 }), 0, 1.0, 0));
    g.scale.setScalar(s);
    return g;
  }

  // ---------- 구역 랜드마크 (구역 안 큰 것, 광장 문 뒤 작은 것에 같이 쓴다) ----------
  landmark(id, s = 1) {
    const g = new THREE.Group();
    const A = (geo, c, x, y, z, o) => { const p = at(part(geo, c, o), x, y, z); g.add(p); return p; };
    const letterCube = (ch, c, x, y, z, size = 1) => {
      const t = canvasTex((cx, w, h) => { cx.fillStyle = c; cx.fillRect(0, 0, w, h); cx.fillStyle = '#fff'; cx.font = `110px ${FONT}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(ch, w / 2, h / 2 + 6); }, 128, 128);
      return A(box(size, size, size), c, x, y, z, { mat: toon('#ffffff', { map: t }) });
    };
    switch (id) {
      case 'kor': {
        for (const [x, z, r] of [[-3, -0.5, 1.6], [3.2, -0.3, 1.4]]) { A(cyl(0.3, 0.4, 2.2, 10), '#8d5a34', x, 1.1, z); A(new THREE.IcosahedronGeometry(r, 1), '#4caf50', x, 3.1, z); }
        const lp = A(box(2.2, 0.14, 1.6), '#ffffff', -1.05, 1.2, 0.3); lp.rotation.z = 0.25; const rp = A(box(2.2, 0.14, 1.6), '#ffffff', 1.05, 1.2, 0.3); rp.rotation.z = -0.25;
        A(box(4.4, 0.18, 1.7), '#e8574d', 0, 0.95, 0.3);
        A(cyl(0.1, 0.12, 0.6, 8), '#fff3e0', 1.8, 0.3, 1.6); A(new THREE.SphereGeometry(0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#ff5c5c', 1.8, 0.55, 1.6);
        break;
      }
      case 'eng': {
        A(box(0.2, 2.6, 0.2), '#5aa9f0', -1.6, 1.3, -0.6); A(box(0.2, 2.6, 0.2), '#5aa9f0', -0.8, 1.3, -0.6);
        for (let i = 0; i < 4; i++) A(box(0.8, 0.08, 0.08), '#ffd23f', -1.2, 0.5 + i * 0.6, -0.6, { t: 0.01 });
        A(box(1.2, 0.15, 1.2), '#5aa9f0', -1.2, 2.6, -0.6);
        const sl = A(box(1.0, 0.12, 3.2), '#ffd23f', -1.2, 1.4, 1.1); sl.rotation.x = 0.75;
        letterCube('A', '#ff6b8b', 1.4, 0.5, 0.2); letterCube('B', '#48dbfb', 2.5, 0.5, 0.4); letterCube('C', '#1dd1a1', 1.95, 1.5, 0.3);
        break;
      }
      case 'math': {
        A(box(4, 2.2, 1.2), '#ffe08a', 0, 1.1, 0);
        for (const x of [-2.3, 2.3]) { A(cyl(0.7, 0.7, 3.4, 14), '#ffd060', x, 1.7, 0); A(new THREE.ConeGeometry(0.9, 1.3, 14), '#ff6b8b', x, 4.05, 0); }
        A(new THREE.CylinderGeometry(0.6, 0.6, 1.25, 16, 1, false, -Math.PI / 2, Math.PI), '#8a5a34', 0, 0.62, 0.62);
        for (let i = -1; i <= 1; i++) A(box(0.5, 0.5, 1.2), '#ffd060', i * 1.3, 2.45, 0);
        letterCube('1', '#48dbfb', -2.3, 2.2, 0.75, 0.6); letterCube('+', '#1dd1a1', 0, 1.7, 0.65, 0.5); letterCube('7', '#c56cf0', 2.3, 2.2, 0.75, 0.6);
        break;
      }
      case 'soc': {
        for (let i = -5; i <= 5; i++) A(box(0.3, 0.06, 1.2), '#8d5a34', i * 0.55, 0.03, 0.6, { t: 0.01 });
        A(box(6, 0.1, 0.12), '#9e9e9e', 0, 0.06, 0.25, { t: 0.01 }); A(box(6, 0.1, 0.12), '#9e9e9e', 0, 0.06, 0.95, { t: 0.01 });
        A(box(1.8, 1.1, 1.1), '#3fbf7f', -1.6, 0.85, 0.6); A(cyl(0.45, 0.45, 1.6, 14), '#ef5b5b', -0.3, 0.9, 0.6).rotation.z = Math.PI / 2; A(cyl(0.18, 0.22, 0.6, 10), '#3b4a6b', 0.2, 1.6, 0.6);
        A(box(1.6, 1.0, 1.0), '#ffd23f', 1.8, 0.8, 0.6);
        for (const x of [-2, -1.2, 1.3, 2.3]) { const w = A(cyl(0.28, 0.28, 0.15, 14), '#3b4a6b', x, 0.3, 1.15, { t: 0.01 }); w.rotation.x = Math.PI / 2; }
        A(cyl(0.1, 0.12, 1.4, 8), '#8d5a34', 3.4, 0.7, -0.8); A(sph(0.75, 20, 14), '#5aa9f0', 3.4, 2.0, -0.8);
        A(new THREE.SphereGeometry(0.77, 20, 14, 0.3, 1.6, 0.6, 1.2), '#5cbf3c', 3.4, 2.0, -0.8, { line: false });
        break;
      }
      case 'sci': {
        const tent = A(new THREE.ConeGeometry(2.4, 3.4, 8), '#2bb5c8', 0, 1.7, -0.3);
        void tent;
        A(new THREE.ConeGeometry(2.45, 3.45, 8, 1, true, 0, Math.PI / 4), '#ffffff', 0, 1.7, -0.3, { line: false });
        A(new THREE.ConeGeometry(2.45, 3.45, 8, 1, true, Math.PI, Math.PI / 4), '#ffffff', 0, 1.7, -0.3, { line: false });
        A(cyl(0.05, 0.05, 1, 6), '#8d5a34', 0, 3.8, -0.3); const fl = A(box(0.6, 0.35, 0.05), '#ff6b8b', 0.3, 4.1, -0.3, { t: 0.01 }); void fl;
        A(cyl(0.18, 0.4, 0.7, 12), '#7fe0c4', 2.6, 0.35, 1); A(cyl(0.12, 0.12, 0.8, 10), '#ff9ec7', 3.2, 0.4, 0.6); A(sph(0.3, 12, 10), '#ffe27a', -2.8, 0.3, 1.2);
        const pl = A(sph(0.7, 18, 14), '#ff9346', -3, 3, -1); const rg = A(new THREE.TorusGeometry(1.05, 0.08, 8, 30), '#ffd23f', -3, 3, -1, { t: 0.01 }); rg.rotation.x = 1.2; void pl;
        break;
      }
      case 'code': {
        A(box(4, 2.6, 2), '#b9b1ff', 0, 1.3, -0.5);
        A(cyl(0.35, 0.4, 1.6, 12), '#7b6cf0', 1.3, 3.2, -0.8);
        for (const [x, y, r] of [[-1.2, 1.6, 0.6], [-0.2, 2.0, 0.45]]) { const gr = A(new THREE.TorusGeometry(r, 0.15, 6, 10), '#ffd23f', x, y, 0.55, { t: 0.012 }); gr.userData.keep = true; this.spinners.push({ obj: gr, sp: r > 0.5 ? 0.8 : -1.1 }); }
        A(box(1.0, 1.0, 1.0), '#c9c9d6', 2.8, 1.8, 0.8); A(box(1.2, 1.2, 0.9), '#9e9ec8', 2.8, 0.75, 0.8);
        for (const sx of [-1, 1]) A(sph(0.12, 8, 6), '#5fd38d', 2.8 + sx * 0.25, 1.9, 1.32, { t: 0.01 });
        A(cyl(0.03, 0.03, 0.4, 6), '#3b2414', 2.8, 2.5, 0.8); A(sph(0.1, 8, 6), '#ff6b8b', 2.8, 2.72, 0.8);
        break;
      }
      case 'music': {
        A(box(6, 0.6, 3), '#a8743e', 0, 0.3, -0.2);
        for (const x of [-2.8, 2.8]) A(box(0.6, 3.6, 0.4), '#e53935', x, 2.1, -1.4);
        A(box(6.2, 0.6, 0.5), '#e53935', 0, 3.9, -1.4);
        A(box(1.8, 0.9, 0.8), '#1f1f1f', -1, 1.05, -0.6); A(box(1.7, 0.06, 0.3), '#ffffff', -1, 1.52, -0.25, { t: 0.01 });
        A(cyl(0.5, 0.5, 0.6, 16), '#f06aa8', 1.4, 0.9, -0.5);
        for (const [x, y] of [[-1.5, 4.8], [0.5, 5.2], [2.2, 4.7]]) { const n = makeSprite(['🎵'], 0.9, { size: 90, bg: null, pad: 2 }); n.position.set(x, y, 0); g.add(n); }
        break;
      }
      case 'art': {
        const hill = A(new THREE.SphereGeometry(3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#a5e07f', 0, 0, -1); hill.scale.y = 0.5;
        ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'].forEach((c, i) => A(new THREE.TorusGeometry(3.4 - i * 0.22, 0.12, 8, 30, Math.PI), c, 0, 0.6, -1.4, { t: 0.01 }));
        A(box(0.1, 1.8, 0.1), '#8d5a34', 3, 0.9, 1); const cv = A(box(1.2, 0.9, 0.06), '#ffffff', 3, 1.5, 1.05); cv.rotation.x = -0.15;
        for (const [x, z, c] of [[-2.6, 1.4, '#ff6b8b'], [-1.6, 2, '#48dbfb'], [1.8, 2.2, '#ffd23f']]) { const sp = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10), toon(c)); sp.rotation.x = -Math.PI / 2; sp.position.set(x, 0.03, z); sp.userData.flat = true; g.add(sp); }
        break;
      }
      case 'pe': {
        const track = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.2, 40), toon('#e9785a')); track.rotation.x = -Math.PI / 2; track.position.set(0, 0.02, 0); track.userData.flat = true; g.add(track);
        for (const x of [-1.2, 1.2]) A(cyl(0.08, 0.08, 1.8, 8), '#ffffff', x, 0.9, -2.6);
        A(cyl(0.08, 0.08, 2.5, 8), '#ffffff', 0, 1.8, -2.6).rotation.z = Math.PI / 2;
        A(cyl(0.08, 0.08, 3.2, 8), '#888888', 3.4, 1.6, -1.6); A(box(1.3, 0.9, 0.08), '#ffffff', 3.4, 3.1, -1.55); const hoop = A(new THREE.TorusGeometry(0.32, 0.04, 8, 20), '#ff5722', 3.4, 2.7, -1.15, { t: 0.01 }); hoop.rotation.x = Math.PI / 2;
        A(sph(0.3, 14, 10), '#ff7043', -2.8, 0.3, 1.2); A(sph(0.3, 14, 10), '#ffffff', -2.1, 0.3, 1.8);
        break;
      }
      default: break;
    }
    g.scale.setScalar(s);
    return g;
  }

  // ---------- 놀이 구역 ----------
  buildZone(s) {
    const area = `zone:${s.id}`;
    const a = AREAS[area];
    this.ground(area, { pathColor: '#f3dfb4' });
    // 구역 색 둥근 마당
    const mid = new THREE.Mesh(new THREE.CircleGeometry(1, 40), toon(s.color, { transparent: true, opacity: 0.22 }));
    mid.scale.set(9, 5, 1); mid.rotation.x = -Math.PI / 2; mid.position.set(a.cx, 0.012, a.cz - 1.5); mid.userData.flat = true; this.add(mid);
    const lm = this.landmark(s.id, 1); lm.position.set(a.cx, 0, a.cz - a.hd + 2.6); this.add(lm);
    this.addObstacle(area, { box: [a.cx - 4.6, a.cz - a.hd, a.cx + 4.6, a.cz - a.hd + 4.4] });
    this.signpost(area, a.cx - 8.5, a.cz - a.hd + 2.2, `${s.emoji} ${s.name}`, '보물 상자 3개를 열면 열쇠!');
    this.host(area, a.cx + 9, a.cz - 3.5, s.host, s.hostName, s.color);
    // 나가는 아치
    const ex = this.arch(a.cx - a.hw + 0.3, a.cz + 3.5, Math.PI / 2, '#9e9e9e', { w: 2.6, h: 3, area, title: '광장으로', emoji: '🏠' });
    this.addInteract({ id: `exit:${s.id}`, kind: 'exit', area, x: ex.ix, z: ex.iz, r: 1.6, label: '🏠 광장으로 돌아가기', data: {}, mesh: ex.group });
    // 보물 상자 3개
    this.stations[area] = [[-6, -1], [0, -2.5], [6, -1]].map(([dx, dz], i) => this.buildStation(area, a.cx + dx, a.cz + dz, i, s.color));
    this.buildKey(area, a.cx, a.cz + 2.2);
    this.bunting(a.cx - a.hw, a.cz - a.hd, a.cx - 4.8, a.cz - a.hd + 1, 3.4, [s.color, '#ffffff', '#ffd23f']);
    this.bunting(a.cx + 4.8, a.cz - a.hd + 1, a.cx + a.hw, a.cz - a.hd, 3.4, [s.color, '#ffffff', '#ffd23f']);
    this.lamp(area, a.cx - a.hw + 1.2, a.cz + a.hd - 1.5);
    this.lamp(area, a.cx + a.hw - 1.2, a.cz + a.hd - 1.5);
    this.butterflies(area, 3);
  }

  // ---------- 열기구 탈출장 ----------
  buildBalloonField() {
    const area = 'balloon';
    const a = AREAS.balloon;
    this.ground(area, { pathColor: '#f6e2b8' });
    const hb = this.hotAirBalloon(1.1); hb.position.set(a.cx, 0, a.cz - a.hd + 3.2); this.add(hb);
    this.bigBalloon = hb;
    this.addObstacle(area, { x: a.cx, z: a.cz - a.hd + 3.2, r: 1.6 });
    this.signpost(area, a.cx - 8, a.cz - a.hd + 2, '🎈 열기구 탈출장', '상자 4개에서 숫자를 찾아요!');
    this.addInteract({ id: 'gate', kind: 'gate', area, x: a.cx, z: a.cz - a.hd + 5.4, r: 1.6, label: '🔢 열기구 비밀번호 넣기', data: {}, mesh: hb });
    this.stations[area] = [[-8, -2], [-4, 3], [4, 3], [8, -2]].map(([dx, dz], i) => this.buildStation(area, a.cx + dx, a.cz + dz, i, ['#ff8a7a', '#5aa9f0', '#3fbf7f', '#f06aa8'][i]));
    const ex = this.arch(a.cx - a.hw + 0.3, a.cz + 5, Math.PI / 2, '#9e9e9e', { w: 2.6, h: 3, area, title: '광장으로', emoji: '🏠' });
    this.addInteract({ id: 'exit:balloon', kind: 'exit', area, x: ex.ix, z: ex.iz, r: 1.6, label: '🏠 광장으로 돌아가기', data: {}, mesh: ex.group });
    this.bunting(a.cx - a.hw, a.cz - a.hd, a.cx + a.hw, a.cz - a.hd, 3.6, ['#ff6b8b', '#ffd23f', '#48dbfb', '#1dd1a1', '#c56cf0']);
    this.balloons(area, a.cx + 10, a.cz + 6); this.balloons(area, a.cx - 4, a.cz + 7);
    this.butterflies(area, 4);
  }

  // ---------- 상태 바꾸기 ----------
  setStation(area, i, { solved, text }) {
    const st = this.stations[area]?.[i];
    if (!st) return;
    st.solved = solved;
    st.lid.rotation.x = solved ? -2.0 : 0;
    st.lock.visible = !solved;
    st.glow.visible = solved;
    st.ring.material.color.set(solved ? '#2bab6b' : st.color);
    setSprite(st.sprite, [text || (solved ? `${i + 1} ✅` : `${i + 1} ❓`)], { size: 52, pad: 12, bg: solved ? '#d9f9c4' : CREAM, border: BROWN });
    st.it.label = solved ? `✅ ${i + 1}번 상자 (열었어요)` : `🎁 ${i + 1}번 보물 상자 열기`;
  }
  setKeyVisible(area, on) {
    if (this.keys[area]) this.keys[area].visible = on;
    const it = this.interactables.find((x) => x.id === `key:${area}`);
    if (it) it.hidden = !on;
  }
  setBoardText(area, text) { if (this.boards[area]) setSprite(this.boards[area], [text]); }
  setGateStamp(subj, has, count = 0) {
    const s = SUBJECT[subj];
    setSprite(this.gateSigns[subj], [`${s.emoji} ${s.name}${has ? ' ✅' : ''}${count > 1 ? ` ×${count}` : ''}`], { size: 56, bg: s.color, fg: '#fff', border: has ? '#ffd23f' : BROWN });
  }
  setBalloonOpen(open, have) {
    setSprite(this.balloonSign, [open ? '🎈 열기구 탈출장 🔓' : `🎈 열기구 탈출장 🔒 도장 ${have}/${STAMPS_TO_FLY}`], { size: 56, bg: open ? '#ffd36b' : '#ff6b8b', fg: open ? BROWN : '#fff' });
  }

  // ---------- 내 캐릭터 ----------
  setPlayer(name, look, keys = 0) {
    if (this.player) { this.scene.remove(this.player); if (this.player.userData.pet) this.scene.remove(this.player.userData.pet); }
    this.player = makeCharacter(look, name, true);
    this.player.position.copy(this.pos);
    this.player.rotation.y = this.rot;
    this.add(this.player);
    this.attachPet(this.player);
    setBadge(this.player, keys);
  }
  setPlayerKeys(keys) { if (this.player) setBadge(this.player, keys); }
  emote(emoji) { if (this.player) emoteOn(this.player, emoji); }
  attachPet(av) {
    const pet = buildPet(av.userData.petId);
    if (!pet) return;
    pet.position.copy(av.position).add(new THREE.Vector3(0.8, 0, 0.8));
    pet.traverse((o) => { if (o.isMesh && !o.userData.outline) o.castShadow = true; });
    this.add(pet);
    av.userData.pet = pet;
  }

  goTo(area, spawn) {
    const a = AREAS[area];
    if (!a) return;
    this.area = area;
    const p = spawn || (area === 'plaza' ? PLAZA_SPAWN : { x: a.cx - a.hw + 4.5, z: a.cz + (area === 'balloon' ? 5 : 3.5) });
    this.pos.set(p.x + (Math.random() - 0.5) * 2.4, 0, p.z + (Math.random() - 0.5) * 2);
    this.collide(area, this.pos);
    this.rot = area === 'plaza' ? Math.PI : Math.PI / 2;
    this.target = null; this.pending = null;
    if (this.player) {
      this.player.position.copy(this.pos); this.player.rotation.y = this.rot;
      const pet = this.player.userData.pet; if (pet) pet.position.copy(this.pos).add(new THREE.Vector3(-0.9, 0, 0.6));
    }
    this.snapCamera = true;
    this.onArea(area);
  }
  plazaSpotFor(subj) {
    const it = this.interactables.find((x) => x.id === `door:${subj}`);
    if (!it) return PLAZA_SPAWN;
    return { x: it.x + (it.x < -18 ? 1.2 : it.x > 18 ? -1.2 : 0), z: it.z + (it.z < -12 ? 1.2 : 0) };
  }
  stationPos(area, i) { const st = this.stations[area]?.[i]; return st ? st.group.position : null; }

  // ---------- 친구들 ----------
  upsertRemote(id, name, look, keys = 0) {
    let r = this.remotes.get(id);
    const lk = JSON.stringify(look || {});
    if (r && (r.name !== name || r.lk !== lk)) { this.removeRemote(id); r = null; }
    if (!r) {
      const av = makeCharacter(look, name, false);
      this.add(av); this.attachPet(av);
      r = { av, name, lk, tx: 0, tz: 0, tr: 0, area: 'plaza', keys: -1, seen: false };
      this.remotes.set(id, r);
    }
    if (r.keys !== keys) { r.keys = keys; setBadge(r.av, keys); }
    return r;
  }
  moveRemote(id, x, z, rot, area) {
    const r = this.remotes.get(id);
    if (!r) return;
    const jump = !r.seen || r.area !== area || Math.hypot(r.tx - x, r.tz - z) > 6;
    r.tx = x; r.tz = z; r.tr = rot; r.area = area; r.seen = true;
    if (jump) { r.av.position.set(x, 0, z); r.av.rotation.y = rot; if (r.av.userData.pet) r.av.userData.pet.position.set(x - 0.8, 0, z + 0.6); }
  }
  removeRemote(id) {
    const r = this.remotes.get(id);
    if (r) { this.scene.remove(r.av); if (r.av.userData.pet) this.scene.remove(r.av.userData.pet); this.remotes.delete(id); }
  }
  emoteRemote(id, emoji) { const r = this.remotes.get(id); if (r) emoteOn(r.av, emoji); }
  celebrateRemote(id) { const r = this.remotes.get(id); if (r && r.area === (this.spectating || this.area)) this.celebrate(r.av.position.x, r.av.position.z); }

  spectate(area) {
    this.spectating = area;
    if (this.player) { this.player.visible = !area; if (this.player.userData.pet) this.player.userData.pet.visible = !area; }
    this.snapCamera = true;
  }

  // ---------- 색종이 ----------
  celebrate(x, z, big = false, y = 1.6) {
    const n = big ? 150 : 60;
    const geo = this.confGeo ||= new THREE.PlaneGeometry(0.14, 0.22);
    const mats = this.confMats ||= ['#ff6b8b', '#ffd23f', '#48dbfb', '#1dd1a1', '#c56cf0', '#ff9f43'].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mats[i % mats.length]);
      m.position.set(x, y, z);
      const a = Math.random() * Math.PI * 2; const sp = 1.5 + Math.random() * (big ? 4 : 2.5);
      m.userData = { v: new THREE.Vector3(Math.cos(a) * sp, 4 + Math.random() * (big ? 6 : 4), Math.sin(a) * sp), w: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0), life: 2 + Math.random() };
      this.add(m); this.particles.push(m);
    }
  }

  // ---------- 열기구 타고 날아가기 ----------
  flyAway(done) {
    if (!this.bigBalloon || !this.player) { done?.(); return; }
    const hb = this.bigBalloon;
    this.flying = { t: 0, done, y0: hb.position.y };
    this.player.position.set(hb.position.x, 1.0 * 1.1, hb.position.z);
    this.player.rotation.y = 0;
    if (this.player.userData.pet) this.player.userData.pet.position.set(hb.position.x + 0.4, 1.1, hb.position.z + 0.3);
    this.celebrate(hb.position.x, hb.position.z + 1, true, 1);
  }
  landBalloon() {
    if (!this.bigBalloon) return;
    this.flying = null;
    this.bigBalloon.position.y = 0;
  }

  // ---------- 입력 ----------
  bindInput() {
    const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '');
    window.addEventListener('keydown', (e) => {
      if (typing(e) || this.paused || this.spectating) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { this.keysDown.add(k); this.target = null; this.pending = null; e.preventDefault(); }
      if ((k === ' ' || k === 'enter' || k === 'e') && this.near && !this.frozen) { e.preventDefault(); this.onInteract(this.near); }
    });
    window.addEventListener('keyup', (e) => this.keysDown.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keysDown.clear());
    const ray = new THREE.Raycaster();
    let down = null;
    // 마우스 휠·두 손가락으로 화면 크게/작게
    this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.setZoom(this.zoom * (1 + Math.sign(e.deltaY) * 0.1)); }, { passive: false });
    const touches = new Map(); let pinch = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom }; down = null; }
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size === 2) { const [a, b] = [...touches.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > 10) this.setZoom(pinch.z * (pinch.d / d)); }
    });
    const lift = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
    this.canvas.addEventListener('pointercancel', lift);
    this.canvas.addEventListener('pointerdown', (e) => { if (touches.size === 1) down = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener('pointerup', (e) => {
      const wasPinch = touches.size >= 2 || pinch;
      lift(e);
      if (wasPinch) { down = null; return; }
      if (!down || this.spectating || this.frozen || this.paused || this.flying) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 14) return;
      const rect = this.canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.camera);
      const its = this.interactables.filter((it) => it.area === this.area && it.mesh && !it.hidden);
      const meshes = [];
      its.forEach((it) => it.mesh.traverse((m) => { if (m.isMesh && !m.userData.outline) meshes.push(m); }));
      const hit = ray.intersectObjects(meshes, false)[0];
      const it = hit?.object.userData.interact;
      if (it && !it.hidden && it.area === this.area) {
        if (this.near === it) { this.onInteract(it); return; }
        this.target = new THREE.Vector3(it.x, 0, it.z); this.pending = it; return;
      }
      const fh = ray.intersectObjects(this.floors.filter((f) => f.userData.floor === this.area), false)[0];
      if (fh) { this.target = fh.point.clone(); this.target.y = 0; this.pending = null; }
    });
  }
  setZoom(z) {
    this.zoom = Math.max(0.55, Math.min(1.8, z));
    this.onZoom(this.zoom);
  }

  // ---------- 안내하는 탐험대장 (광장을 천천히 돌아다닌다) ----------
  addGuide(look, name) {
    if (this.guide) return this.guide;
    const av = makeCharacter(look, name, false);
    setSprite(av.userData.label, [name], { size: 46, bg: '#ffd36b', pad: 12, radius: 18 });
    av.position.set(4, 0, 6.5);
    this.add(av);
    const it = this.addInteract({ id: 'guide', kind: 'guide', area: 'plaza', x: 4, z: 6.5, r: 2.0, label: `💬 ${name}에게 물어보기`, data: {}, mesh: av });
    this.guide = { av, it, pts: [[4, 6.5], [8, 4], [6, 10], [-5, 9.5], [-7, 5]], i: 0, wait: 2, talking: false };
    return this.guide;
  }
  guideTalk(on) {
    if (!this.guide) return;
    this.guide.talking = on;
    if (on) emoteOn(this.guide.av, '💬');
  }
  tickGuide(dt, T) {
    const g = this.guide;
    if (!g) return;
    const av = g.av;
    let moving = false;
    if (g.talking && this.player) {
      // 이야기할 때는 멈춰서 나를 본다
      const want = Math.atan2(this.pos.x - av.position.x, this.pos.z - av.position.z);
      let diff = want - av.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      av.rotation.y += diff * Math.min(1, dt * 6);
    } else if (g.wait > 0) g.wait -= dt;
    else {
      const [tx, tz] = g.pts[g.i];
      const dx = tx - av.position.x; const dz = tz - av.position.z; const d = Math.hypot(dx, dz);
      if (d < 0.15) { g.i = (g.i + 1) % g.pts.length; g.wait = 2 + Math.random() * 3; }
      else {
        const sp = Math.min(d, 1.6 * dt);
        av.position.x += (dx / d) * sp; av.position.z += (dz / d) * sp;
        let diff = Math.atan2(dx, dz) - av.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        av.rotation.y += diff * Math.min(1, dt * 8);
        moving = true;
      }
    }
    animateBody(av.userData.body, moving, dt, T);
    g.it.x = av.position.x; g.it.z = av.position.z;
    const u = av.userData;
    if (u.bubble) { u.bubbleT -= dt; if (u.bubbleT <= 0 && !g.talking) { av.remove(u.bubble); u.bubble = null; } }
  }

  setJoystick(x, z) { this.input.x = x; this.input.z = z; if (x || z) { this.target = null; this.pending = null; } }

  resize() {
    const w = this.canvas.clientWidth || 1; const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 48;
    this.camera.updateProjectionMatrix();
  }

  collide(area, p) {
    const a = AREAS[area];
    const m = 0.6;
    p.x = Math.max(a.cx - a.hw + m, Math.min(a.cx + a.hw - m, p.x));
    p.z = Math.max(a.cz - a.hd + m, Math.min(a.cz + a.hd - m, p.z));
    for (const o of this.obstacles[area] || []) {
      if (o.box) {
        const [x0, z0, x1, z1] = o.box;
        if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
          const d = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z]; const mn = Math.min(...d);
          if (mn === d[0]) p.x = x0; else if (mn === d[1]) p.x = x1; else if (mn === d[2]) p.z = z0; else p.z = z1;
        }
      } else {
        const dx = p.x - o.x; const dz = p.z - o.z; const d = Math.hypot(dx, dz); const r = o.r + 0.4;
        if (d < r) { const k = d > 1e-4 ? r / d : 1; p.x = o.x + dx * k; p.z = o.z + (d > 1e-4 ? dz * k : r); }
      }
    }
  }

  // 같이 다니는 친구: 캐릭터 뒤를 졸졸
  followPet(av, dt, moving) {
    const pet = av.userData.pet;
    if (!pet) return;
    const behind = new THREE.Vector3(-0.6, 0, -1.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), av.rotation.y).add(av.position);
    const d = pet.position.distanceTo(behind);
    if (d > 0.15) {
      pet.position.lerp(behind, Math.min(1, dt * 4));
      const want = Math.atan2(behind.x - pet.position.x, behind.z - pet.position.z);
      let diff = want - pet.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      pet.rotation.y += diff * Math.min(1, dt * 8);
    }
    pet.userData.hop = (pet.userData.hop || 0) + dt * (moving || d > 0.3 ? 12 : 3);
    pet.position.y = (this.flying && av === this.player ? pet.position.y : 0) + (moving || d > 0.3 ? Math.abs(Math.sin(pet.userData.hop)) * 0.15 : 0);
    pet.visible = av.visible;
  }

  // 느린 기기면 화질을 한 단계씩 낮춘다 (선명함 → 그림자 → 더 낮은 선명함)
  adapt(raw) {
    const q = this.quality ||= { t: 0, n: 0, sum: 0, level: 0, wait: 2 };
    q.wait -= raw;
    if (q.wait > 0) return;
    q.t += raw; q.n += 1; q.sum += raw;
    if (q.t < 3) return;
    const avg = q.sum / q.n;
    q.t = 0; q.n = 0; q.sum = 0;
    if (avg < 0.045 || q.level >= 3) return;
    q.level += 1; q.wait = 1.5;
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (q.level === 1) this.renderer.setPixelRatio(Math.min(pr, 1));
    if (q.level === 2) { this.renderer.shadowMap.enabled = false; this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
    if (q.level === 3) this.renderer.setPixelRatio(0.75);
    this.resize();
  }

  tick() {
    const raw = this.clock.getDelta();
    if (!document.hidden) this.adapt(raw);
    const dt = Math.min(0.05, raw);
    this.time += dt;
    const T = this.time;
    if (this.player && !this.spectating && !this.flying) {
      let ix = this.input.x; let iz = this.input.z;
      const K = this.keysDown;
      if (K.has('arrowleft') || K.has('a')) ix -= 1;
      if (K.has('arrowright') || K.has('d')) ix += 1;
      if (K.has('arrowup') || K.has('w')) iz -= 1;
      if (K.has('arrowdown') || K.has('s')) iz += 1;
      if (this.frozen || this.paused) { ix = 0; iz = 0; this.target = null; }
      if (!ix && !iz && this.target) {
        const dx = this.target.x - this.pos.x; const dz = this.target.z - this.pos.z; const d = Math.hypot(dx, dz);
        if (d < 0.25 || (this.pending && this.near === this.pending)) {
          this.target = null;
          if (this.pending && this.near === this.pending) { const it = this.pending; this.pending = null; this.onInteract(it); }
          this.pending = null;
        } else { ix = dx / d; iz = dz / d; }
      }
      const len = Math.hypot(ix, iz);
      let moving = false;
      if (len > 0.05) {
        const sp = 5.4 * Math.min(1, len);
        const before = this.pos.clone();
        this.pos.x += (ix / Math.max(1, len)) * sp * dt;
        this.pos.z += (iz / Math.max(1, len)) * sp * dt;
        this.collide(this.area, this.pos);
        if (this.target && before.distanceTo(this.pos) < sp * dt * 0.2) { this.stuck = (this.stuck || 0) + dt; if (this.stuck > 0.4) { this.target = null; this.pending = null; } } else this.stuck = 0;
        let diff = Math.atan2(ix, iz) - this.rot;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.rot += diff * Math.min(1, dt * 12);
        moving = true;
      }
      this.player.position.copy(this.pos);
      this.player.rotation.y = this.rot;
      animateBody(this.player.userData.body, moving, dt, T);
      this.followPet(this.player, dt, moving);
      this.moving = moving;
      let best = null; let bd = Infinity;
      for (const it of this.interactables) {
        if (it.area !== this.area || it.hidden) continue;
        const d = Math.hypot(it.x - this.pos.x, it.z - this.pos.z);
        if (d < it.r && d < bd) { best = it; bd = d; }
      }
      if (best !== this.near) { this.near = best; this.onPrompt(best); }
    }
    if (this.player) {
      const u = this.player.userData;
      if (u.bubble) { u.bubbleT -= dt; u.bubble.position.y = 3.1 + Math.sin(T * 5) * 0.05; if (u.bubbleT <= 0) { this.player.remove(u.bubble); u.bubble = null; } }
    }

    // 열기구 날아오르기
    if (this.flying) {
      const f = this.flying; f.t += dt;
      const up = Math.max(0, f.t - 0.6) ** 1.6 * 1.6;
      this.bigBalloon.position.y = up;
      this.player.position.y = 1.1 + up;
      animateBody(this.player.userData.body, false, dt, T);
      const pet = this.player.userData.pet; if (pet) pet.position.y = 1.1 + up;
      if (f.t > 1 && Math.random() < dt * 6) this.celebrate(this.bigBalloon.position.x + (Math.random() - 0.5) * 6, this.bigBalloon.position.z + 2, false, up + 3);
      if (f.t > 6 && f.done) { const d = f.done; f.done = null; d(); }
    }

    this.tickGuide(dt, T);

    // 친구들
    for (const r of this.remotes.values()) {
      const p = r.av.position;
      const dx = r.tx - p.x; const dz = r.tz - p.z; const k = Math.min(1, dt * 10);
      p.x += dx * k; p.z += dz * k;
      let diff = r.tr - r.av.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      r.av.rotation.y += diff * k;
      const mv = Math.hypot(dx, dz) > 0.05;
      animateBody(r.av.userData.body, mv, dt, T);
      r.av.visible = r.seen;
      this.followPet(r.av, dt, mv);
      const u = r.av.userData;
      if (u.bubble) { u.bubbleT -= dt; if (u.bubbleT <= 0) { r.av.remove(u.bubble); u.bubble = null; } }
    }

    // 움직이는 꾸밈
    for (const b of this.bobbers) b.obj.position.y = b.base + Math.sin(T * b.speed + b.phase) * b.amp;
    for (const s of this.spinners) s.obj.rotation.z += dt * s.sp;
    for (const p of this.pulsers) { const k = 1 + Math.sin(T * 3) * 0.08; p.scale.set(k, k, 1); }
    for (const g of Object.values(this.keys)) if (g.visible) g.userData.spin.rotation.y += dt * 2.2;
    for (const c of this.clouds) c.g.position.x = c.x0 + Math.sin(T * 0.05 * c.sp) * 8;
    if (this.flyers) for (const b of this.flyers) { const f = b.userData.fly; const a = T * f.sp + f.ph; b.position.x = f.cx + Math.cos(a) * f.r; b.position.z = f.cz + Math.sin(a * 1.3) * f.r * 0.6; b.position.y = 1.8 + Math.sin(a * 3) * 0.3; }
    if (this.fountain) {
      const arr = this.fountain.pts.geometry.attributes.position.array;
      this.fountain.seeds.forEach((s, i) => {
        s.t += dt * 0.8 * s.v; if (s.t > 1) { s.t = 0; s.a = Math.random() * Math.PI * 2; }
        const r = s.t * 1.0; arr[i * 3] = Math.cos(s.a) * r; arr[i * 3 + 2] = Math.sin(s.a) * r; arr[i * 3 + 1] = 2.1 + s.t * 2.4 - s.t * s.t * 3.2;
      });
      this.fountain.pts.geometry.attributes.position.needsUpdate = true;
    }
    // 색종이
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const m = this.particles[i]; const u = m.userData;
      u.life -= dt; u.v.y -= 9 * dt; u.v.multiplyScalar(1 - dt * 0.8);
      m.position.addScaledVector(u.v, dt);
      if (m.position.y < 0.03) { m.position.y = 0.03; u.v.set(0, 0, 0); } else { m.rotation.x += u.w.x * dt; m.rotation.y += u.w.y * dt; }
      if (u.life <= 0) { this.scene.remove(m); this.particles.splice(i, 1); }
    }

    // 카메라
    const area = this.spectating || this.area;
    const a = AREAS[area];
    let look; let off;
    if (this.spectating) { look = new THREE.Vector3(a.cx, 0, a.cz - 1); off = a.spec; }
    else if (this.flying) { look = this.player.position.clone(); off = [0, 4, 14]; }
    else {
      const f = a.follow ?? 1;
      look = new THREE.Vector3(a.cx + (this.pos.x - a.cx) * f, 0.8, a.cz + (this.pos.z - a.cz) * f - (a.ahead ?? (f === 1 ? 4 : 1)));
      off = a.cam;
    }
    const k = (this.camera.aspect < 1 ? 1.45 : 1) * (this.flying ? 1 : this.zoom);
    const want = new THREE.Vector3(look.x + off[0] * k, look.y + off[1] * k, look.z + off[2] * k);
    if (this.snapCamera) { this.camera.position.copy(want); this.snapCamera = false; }
    else this.camera.position.lerp(want, Math.min(1, dt * 6));
    this.camera.lookAt(look);
    // 해는 보고 있는 곳을 따라다니며 그림자를 만든다
    this.sun.position.set(look.x + 14, 32, look.z + 16);
    this.sun.target.position.set(look.x, 0, look.z);
    this.renderer.render(this.scene, this.camera);
  }

  getState() { return { x: Math.round(this.pos.x * 100) / 100, z: Math.round(this.pos.z * 100) / 100, r: Math.round(this.rot * 100) / 100, a: this.area }; }
}
