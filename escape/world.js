// 열쇠 학교의 3D 세상: 로비(복도), 과목 교실 9개, 옥상. 아바타·움직이기·문/상자 앞에서 "열기" 단추.
// 모든 장소를 한 장면 안에 멀리 떨어뜨려 두고, 들어가면 그 자리로 순간이동한다.
// 그래서 같은 교실에 있는 친구만 화면에 보인다.
import * as THREE from './vendor/three.module.min.js';
import { SUBJECTS, SUBJECT, ROOF_KEYS } from './content.js';

// ---------- 장소 배치 ----------
export const AREAS = {
  lobby: { cx: 0, cz: 0, hw: 20, hd: 14, cam: [0, 17, 14], spec: [0, 30, 26], follow: 1 },
  roof: { cx: -300, cz: 0, hw: 12, hd: 9, cam: [0, 17, 15], spec: [0, 20, 18], follow: 0.45 },
};
SUBJECTS.forEach((s, i) => { AREAS[`room:${s.id}`] = { cx: 300 + i * 60, cz: 0, hw: 10, hd: 7, cam: [0, 15, 13.5], spec: [0, 17, 15], follow: 0.35, subj: s.id }; });
export const LOBBY_SPAWN = { x: 0, z: 8 };

// 로비 문: 뒷벽 4개, 왼벽 2개, 오른벽 3개
const DOORS = [
  ['kor', 'back', -15], ['eng', 'back', -5], ['math', 'back', 5], ['soc', 'back', 15],
  ['sci', 'left', -5], ['code', 'left', 5],
  ['music', 'right', -6], ['art', 'right', 1], ['pe', 'right', 8],
];

const SKIN = '#ffd9b5';
const FONT = '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif';
const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

// ---------- 글씨 그림(스프라이트) ----------
export function textCanvas(lines, { size = 64, fg = '#222', bg = 'rgba(255,255,255,0.92)', border = null, pad = 18, radius = 22, bold = true } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = `${bold ? '800 ' : ''}${size}px ${FONT}`;
  ctx.font = font;
  const widths = lines.map((l) => ctx.measureText(l).width);
  const w = Math.ceil(Math.max(...widths, size) + pad * 2);
  const lh = size * 1.22;
  const h = Math.ceil(lh * lines.length + pad * 1.4);
  c.width = w; c.height = h;
  ctx.font = font;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, radius); ctx.fill();
    if (border) { ctx.lineWidth = 5; ctx.strokeStyle = border; ctx.stroke(); }
  }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!bg) { ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; lines.forEach((l, i) => ctx.strokeText(l, w / 2, pad * 0.7 + lh * (i + 0.5))); }
  lines.forEach((l, i) => ctx.fillText(l, w / 2, pad * 0.7 + lh * (i + 0.5)));
  return c;
}
function makeSprite(lines, height, opts) {
  const c = textCanvas(lines, opts);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sp.scale.set((height * c.width) / c.height, height, 1);
  sp.userData.h = height;
  return sp;
}
function setSprite(sp, lines, opts) {
  const c = textCanvas(lines, opts);
  sp.material.map.dispose();
  sp.material.map = new THREE.CanvasTexture(c);
  sp.material.map.colorSpace = THREE.SRGBColorSpace;
  sp.material.needsUpdate = true;
  sp.scale.set((sp.userData.h * c.width) / c.height, sp.userData.h, 1);
}
function planeTexture(draw, w = 512, h = 512, repeat = null) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 4;
  return t;
}

// ---------- 아바타 ----------
export function makeAvatar(color, name, { me = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 0.85, 18), lambert(color));
  body.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), lambert(SKIN));
  head.position.y = 1.42;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), lambert('#3b2a20'));
  hair.position.y = 1.47;
  const eyeM = lambert('#1d1d1d');
  const eyes = [-0.12, 0.12].map((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), eyeM); e.position.set(x, 1.45, 0.3); return e; });
  const cheekM = lambert('#ff9a9a');
  const cheeks = [-0.2, 0.2].map((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheekM); e.position.set(x, 1.34, 0.28); e.scale.set(1, 0.6, 0.5); return e; });
  const legM = lambert('#33415c');
  const legs = [-0.15, 0.15].map((x) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 10), legM); l.position.set(x, 0.18, 0); return l; });
  const armM = lambert(color);
  const arms = [-0.46, 0.46].map((x) => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 4, 8), armM); a.position.set(x, 0.85, 0); return a; });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02;
  const inner = new THREE.Group();
  inner.add(body, head, hair, ...eyes, ...cheeks, ...legs, ...arms);
  g.add(inner, shadow);
  const label = makeSprite([name], 0.42, { size: 48, fg: me ? '#fff' : '#222', bg: me ? 'rgba(91,75,255,0.95)' : 'rgba(255,255,255,0.9)', pad: 14, radius: 18 });
  label.position.y = 2.15;
  g.add(label);
  g.userData = { inner, legs, arms, label, walk: 0, bubble: null, bubbleT: 0, crown: null };
  return g;
}
function setCrown(av, keys) {
  const u = av.userData;
  if (u.crown) { av.remove(u.crown); u.crown = null; }
  if (!keys) return;
  u.crown = makeSprite([`🗝️${keys}`], 0.34, { size: 44, bg: 'rgba(255,214,64,0.95)', fg: '#5a3d00', pad: 10, radius: 16 });
  u.crown.position.y = 2.55;
  av.add(u.crown);
}
function animateAvatar(av, moving, dt) {
  const u = av.userData;
  u.walk = moving ? u.walk + dt * 11 : u.walk * Math.max(0, 1 - dt * 10);
  const s = Math.sin(u.walk);
  u.inner.position.y = moving ? Math.abs(s) * 0.07 : 0;
  u.legs[0].position.z = s * 0.12; u.legs[1].position.z = -s * 0.12;
  u.arms[0].rotation.x = s * 0.6; u.arms[1].rotation.x = -s * 0.6;
  if (u.bubble) {
    u.bubbleT -= dt;
    u.bubble.position.y = 2.9 + Math.sin(performance.now() / 200) * 0.05;
    if (u.bubbleT <= 0) { av.remove(u.bubble); u.bubble.material.map.dispose(); u.bubble = null; }
  }
}
export function emoteOn(av, emoji) {
  const u = av.userData;
  if (u.bubble) av.remove(u.bubble);
  u.bubble = makeSprite([emoji], 0.8, { size: 80, bg: 'rgba(255,255,255,0.95)', pad: 10, radius: 30 });
  u.bubble.position.y = 2.9;
  u.bubbleT = 2.6;
  av.add(u.bubble);
}

// ---------- 세상 ----------
export class World {
  constructor(canvas, { onInteract = () => {}, onPrompt = () => {}, onArea = () => {} } = {}) {
    this.canvas = canvas;
    this.onInteract = onInteract;
    this.onPrompt = onPrompt;
    this.onArea = onArea;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#bfe3ff');
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 120);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#b9a98c', 1.9));
    const sun = new THREE.DirectionalLight('#ffffff', 1.4);
    sun.position.set(30, 60, 40);
    this.scene.add(sun);

    this.interactables = []; // {id, kind, area, x, z, r, label, data, mesh}
    this.obstacles = {}; // area -> [{x,z,r}] 또는 {box}
    this.stations = {}; // area -> [{group, lid, sprite, solved}]
    this.keys = {}; // area -> key group
    this.doorSigns = {}; // subj -> sprite
    this.remotes = new Map();
    this.input = { x: 0, z: 0 };
    this.keysDown = new Set();
    this.target = null; // 눌러서 걸어가기
    this.pending = null; // 걸어간 뒤 열 것
    this.near = null;
    this.frozen = false;
    this.spectating = null;
    this.player = null;
    this.area = 'lobby';
    this.pos = new THREE.Vector3(LOBBY_SPAWN.x, 0, LOBBY_SPAWN.z);
    this.rot = Math.PI;
    this.clock = new THREE.Clock();
    this.time = 0;

    this.buildLobby();
    SUBJECTS.forEach((s) => this.buildRoom(s));
    this.buildRoof();
    this.bindInput();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  // ---------- 짓기 ----------
  addObstacle(area, o) { (this.obstacles[area] ||= []).push(o); }
  addInteract(it) { this.interactables.push(it); if (it.mesh) it.mesh.userData.interact = it; return it; }

  floorAndWalls(area, { floor, wall, trim = '#ffffff', walls = ['back', 'left', 'right'] }) {
    const a = AREAS[area];
    const w = a.hw * 2; const d = a.hd * 2;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: floor }));
    f.rotation.x = -Math.PI / 2; f.position.set(a.cx, 0, a.cz);
    f.userData.floor = area;
    this.scene.add(f);
    this.floors = this.floors || [];
    this.floors.push(f);
    const H = 4.2; const T = 0.4;
    const wm = lambert(wall);
    const tm = lambert(trim);
    const mk = (sx, sz, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, H, sz), wm); m.position.set(x, H / 2, z); this.scene.add(m);
      const b = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.02, 0.35, sz + 0.02), tm); b.position.set(x, 0.17, z); this.scene.add(b);
    };
    if (walls.includes('back')) mk(w + T * 2, T, a.cx, a.cz - a.hd - T / 2);
    if (walls.includes('left')) mk(T, d, a.cx - a.hw - T / 2, a.cz);
    if (walls.includes('right')) mk(T, d, a.cx + a.hw + T / 2, a.cz);
    // 앞쪽은 벽 대신 낮은 난간 (카메라가 앞에서 보므로)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.25), tm);
    rail.position.set(a.cx, 0.25, a.cz + a.hd + 0.12);
    this.scene.add(rail);
  }

  buildDoor(x, z, facing, color, area) {
    // facing: 문이 바라보는 방향 (복도 쪽) 각도
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.1, 0.3), lambert(color));
    frame.position.y = 1.55;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.75, 0.34), lambert('#8a5a34'));
    panel.position.y = 1.4;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.36), lambert('#cdeeff'));
    win.position.y = 2.1;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lambert('#ffd23f'));
    knob.position.set(0.6, 1.3, 0.22);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), lambert(color, { transparent: true, opacity: 0.45 }));
    mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.03, 1.1);
    g.add(frame, panel, win, knob, mat);
    g.position.set(x, 0, z);
    g.rotation.y = facing;
    this.scene.add(g);
    void area;
    return { group: g, panel };
  }

  buildLobby() {
    const floor = planeTexture((ctx, w, h) => {
      ctx.fillStyle = '#e9d3a8'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d4b98a'; ctx.lineWidth = 4;
      for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(0, (i * h) / 8); ctx.lineTo(w, (i * h) / 8); ctx.stroke(); }
      for (let r = 0; r < 8; r++) for (let i = 0; i < 3; i++) { const x = ((i + (r % 2) * 0.5) * w) / 3; ctx.beginPath(); ctx.moveTo(x, (r * h) / 8); ctx.lineTo(x, ((r + 1) * h) / 8); ctx.stroke(); }
    }, 256, 256, [10, 7]);
    this.floorAndWalls('lobby', { floor, wall: '#fff4dc', trim: '#7db7ff' });
    const a = AREAS.lobby;
    // 가운데 화단·분수
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.5, 28), lambert('#7fc8ff'));
    pond.position.set(0, 0.25, 3);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.2, 8, 28), lambert('#c9c9c9'));
    rim.rotation.x = Math.PI / 2; rim.position.set(0, 0.5, 3);
    this.scene.add(pond, rim);
    this.addObstacle('lobby', { x: 0, z: 3, r: 2.6 });
    // 학교 이름 간판
    const sign = makeSprite(['🗝️ 열쇠 학교'], 1.5, { size: 90, bg: 'rgba(91,75,255,0.95)', fg: '#fff', pad: 26, radius: 34 });
    sign.position.set(0, 5.6, a.cz - a.hd + 0.2);
    this.scene.add(sign);

    for (const [subj, side, t] of DOORS) {
      const s = SUBJECT[subj];
      let x; let z; let facing; let ix; let iz;
      if (side === 'back') { x = t; z = a.cz - a.hd + 0.05; facing = 0; ix = x; iz = z + 1.7; }
      else if (side === 'left') { x = a.cx - a.hw + 0.05; z = t; facing = Math.PI / 2; ix = x + 1.7; iz = z; }
      else { x = a.cx + a.hw - 0.05; z = t; facing = -Math.PI / 2; ix = x - 1.7; iz = z; }
      const d = this.buildDoor(x, z, facing, s.color, 'lobby');
      const sp = makeSprite([`${s.emoji} ${s.name}`], 0.85, { size: 60, bg: s.color, fg: '#fff', pad: 16 });
      sp.position.set(x + (side === 'left' ? 0.9 : side === 'right' ? -0.9 : 0), 3.75, z + (side === 'back' ? 0.6 : 0));
      this.scene.add(sp);
      this.doorSigns[subj] = sp;
      this.addInteract({ id: `door:${subj}`, kind: 'door', area: 'lobby', x: ix, z: iz, r: 1.7, label: `${s.emoji} ${s.name} 들어가기`, data: { subj }, mesh: d.panel });
    }

    // 옥상 계단 (가운데 뒤쪽)
    const stairs = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(4, 0.35, 0.8), lambert(i % 2 ? '#c8c2ff' : '#b3aaff'));
      st.position.set(0, 0.175 + i * 0.35, -i * 0.8);
      stairs.add(st);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(4, 1.75, 2), lambert('#9e94ff'));
    top.position.set(0, 0.875, -4.6);
    stairs.add(top);
    const roofDoor = this.buildDoor(0, -6.6, 0, '#5b4bff', 'lobby');
    roofDoor.group.position.y = 1.75;
    stairs.position.set(0, 0, -3);
    roofDoor.group.position.z = -3 - 5.55;
    this.scene.add(stairs);
    this.addObstacle('lobby', { box: [-2.1, -9.6, 2.1, -2.6] });
    this.roofSign = makeSprite(['🔒 옥상 탈출구', `열쇠 ${ROOF_KEYS}개가 필요해요`], 0.95, { size: 54, bg: 'rgba(40,30,120,0.92)', fg: '#fff' });
    this.roofSign.position.set(0, 6.3, -8.4);
    this.scene.add(this.roofSign);
    this.addInteract({ id: 'roofdoor', kind: 'roofdoor', area: 'lobby', x: 0, z: -1.6, r: 1.6, label: '🪜 옥상으로 올라가기', data: {}, mesh: stairs.children[0] });

    // 화분 몇 개
    for (const [x, z] of [[-18, 12], [18, 12], [-18, -12], [18, -12], [-9, 12], [9, 12]]) this.plant(x, z, 'lobby');
  }

  plant(x, z, area) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.7, 14), lambert('#d9773b'));
    pot.position.set(x, 0.35, z);
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), lambert('#4caf50', { flatShading: true }));
    leaf.position.set(x, 1.25, z);
    this.scene.add(pot, leaf);
    this.addObstacle(area, { x, z, r: 0.7 });
  }

  // 교실 하나
  buildRoom(s) {
    const area = `room:${s.id}`;
    const a = AREAS[area];
    const floor = planeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f6f1e7'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = s.color; ctx.globalAlpha = 0.16;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) ctx.fillRect((x * w) / 4, (y * h) / 4, w / 4, h / 4);
    }, 256, 256, [5, 3.5]);
    this.floorAndWalls(area, { floor, wall: '#fffaf0', trim: s.color });
    // 칠판
    const board = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, 0.15), lambert('#2f5d46'));
    board.position.set(a.cx, 2.4, a.cz - a.hd + 0.12);
    const bframe = new THREE.Mesh(new THREE.BoxGeometry(7.4, 3, 0.1), lambert('#a5784f'));
    bframe.position.set(a.cx, 2.4, a.cz - a.hd + 0.05);
    this.scene.add(bframe, board);
    const title = makeSprite([`${s.emoji} ${s.name}`], 1.0, { size: 70, bg: null, fg: '#fff' });
    title.position.set(a.cx, 2.9, a.cz - a.hd + 0.4);
    this.scene.add(title);
    this.boardSub = this.boardSub || {};
    const sub = makeSprite(['상자 3개를 열면 열쇠!'], 0.5, { size: 46, bg: null, fg: '#fff8c4' });
    sub.position.set(a.cx, 1.9, a.cz - a.hd + 0.4);
    this.scene.add(sub);
    this.boardSub[area] = sub;

    // 나가는 문 (왼쪽 벽)
    const d = this.buildDoor(a.cx - a.hw + 0.05, a.cz + 3, Math.PI / 2, '#888', area);
    const ex = makeSprite(['🚪 복도로'], 0.6, { size: 52, bg: '#555', fg: '#fff' });
    ex.position.set(a.cx - a.hw + 0.9, 3.7, a.cz + 3);
    this.scene.add(ex);
    this.addInteract({ id: `exit:${s.id}`, kind: 'exit', area, x: a.cx - a.hw + 1.7, z: a.cz + 3, r: 1.6, label: '🚪 복도로 나가기', data: {}, mesh: d.panel });

    // 퍼즐 상자 3개
    const spots = [[-6, -3], [0, -4], [6, -3]];
    this.stations[area] = spots.map(([dx, dz], i) => this.buildStation(area, a.cx + dx, a.cz + dz, i, s.color));
    // 열쇠 받침
    this.buildKey(area, a.cx, a.cz + 1);
    this.decorate(s.id, a);
  }

  buildStation(area, x, z, i, color) {
    const g = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.7, 20), lambert('#e6e1f2'));
    ped.position.y = 0.35;
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.8), lambert(color));
    box.position.y = 1.0;
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.12, 0.84), lambert('#ffd23f'));
    band.position.y = 1.05;
    const lid = new THREE.Group();
    const lidM = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.25, 0.84), lambert(color));
    lidM.position.set(0, 0.12, 0.42);
    lid.add(lidM);
    lid.position.set(0, 1.3, -0.42);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.1), lambert('#ffd23f'));
    lock.position.set(0, 1.12, 0.44);
    g.add(ped, box, band, lid, lock);
    g.position.set(x, 0, z);
    this.scene.add(g);
    const sp = makeSprite([`${i + 1} ❓`], 0.6, { size: 54, bg: 'rgba(255,255,255,0.95)', border: color, pad: 12 });
    sp.position.set(x, 2.2, z);
    this.scene.add(sp);
    this.addObstacle(area, { x, z, r: 1.0 });
    const it = this.addInteract({ id: `station:${area}:${i}`, kind: 'station', area, x, z: z + 1.75, r: 1.5, label: `🔒 ${i + 1}번 상자 풀기`, data: { area, index: i }, mesh: box });
    lidM.userData.interact = it; lock.userData.interact = it;
    return { group: g, lid, lock, sprite: sp, solved: false, color, i, it };
  }

  buildKey(area, x, z) {
    const g = new THREE.Group();
    const gold = new THREE.MeshLambertMaterial({ color: '#ffcc1a', emissive: '#7a5200' });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 10, 24), gold);
    ring.position.y = 0.55;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 10), gold);
    shaft.position.y = -0.2;
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.1), gold); t1.position.set(0.15, -0.5, 0);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.1), gold); t2.position.set(0.11, -0.3, 0);
    const k = new THREE.Group(); k.add(ring, shaft, t1, t2);
    k.position.y = 1.6;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.5, 20), lambert('#fff1b8'));
    ped.position.y = 0.25;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: '#fff27a', transparent: true, opacity: 0.5, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.03;
    g.add(ped, k, glow);
    g.position.set(x, 0, z);
    g.visible = false;
    g.userData.spin = k;
    this.scene.add(g);
    this.keys[area] = g;
    this.addInteract({ id: `key:${area}`, kind: 'key', area, x, z: z + 1.3, r: 1.5, label: '🗝️ 열쇠 받기', data: { area }, mesh: ped, hidden: true });
  }

  // 과목마다 교실 꾸미기 (단순한 도형으로)
  decorate(id, a) {
    const L = a.cx - a.hw; const R = a.cx + a.hw; const B = a.cz - a.hd;
    const area = `room:${id}`;
    const box = (sx, sy, sz, color, x, y, z, ob = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), lambert(color));
      m.position.set(x, y, z); this.scene.add(m);
      if (ob) this.addObstacle(area, { box: [x - sx / 2 - 0.4, z - sz / 2 - 0.4, x + sx / 2 + 0.4, z + sz / 2 + 0.4] });
      return m;
    };
    const cyl = (r1, r2, h, color, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 18), lambert(color)); m.position.set(x, y, z); this.scene.add(m); return m; };
    const ball = (r, color, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), lambert(color)); m.position.set(x, y, z); this.scene.add(m); return m; };
    const picture = (lines, x, z, h = 0.9, bg = 'rgba(255,255,255,0.95)') => { const sp = makeSprite(lines, h, { size: 64, bg }); sp.position.set(x, 1.8, z); this.scene.add(sp); };

    switch (id) {
      case 'kor':
        for (const x of [R - 1.2, R - 3.3]) {
          box(1.8, 2.6, 0.7, '#a8744a', x, 1.3, B + 0.6);
          ['#e8574d', '#3c8dde', '#f2a516', '#2bab6b', '#6c55e0'].forEach((c, i) => box(0.25, 0.6, 0.5, c, x - 0.6 + i * 0.3, 2.1, B + 0.8, false));
        }
        picture(['가 나 다'], L + 2.5, B + 1.2);
        break;
      case 'eng':
        ['A', 'B', 'C'].forEach((ch, i) => { box(0.9, 0.9, 0.9, ['#e8574d', '#3c8dde', '#f2a516'][i], R - 1.5 - i * 1.2, 0.45, B + 1.3); });
        picture(['A B C'], R - 2.7, B + 1.3, 0.8);
        picture(['🇰🇷 🇺🇸 🇬🇧'], L + 2.5, B + 1.2);
        break;
      case 'math': {
        const cube = box(1, 1, 1, '#f2a516', R - 1.5, 0.5, B + 1.4);
        cube.rotation.y = 0.5;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.3, 4), lambert('#e8574d'));
        cone.position.set(R - 3.2, 0.65, B + 1.3); this.scene.add(cone);
        ball(0.55, '#3c8dde', R - 4.7, 0.55, B + 1.3);
        picture(['1 + 2 = 3'], L + 2.6, B + 1.2);
        break;
      }
      case 'soc': {
        cyl(0.1, 0.4, 1.2, '#8d6e63', R - 2, 0.6, B + 1.5);
        ball(0.75, '#3c8dde', R - 2, 1.8, B + 1.5);
        this.addObstacle(area, { x: R - 2, z: B + 1.5, r: 1.1 });
        picture(['🗺️ 지도'], L + 2.5, B + 1.2);
        break;
      }
      case 'sci':
        box(3.2, 0.9, 1, '#e0e0e0', R - 2.4, 0.45, B + 1.2);
        cyl(0.18, 0.35, 0.6, '#7fe0c4', R - 3.4, 1.2, B + 1.2);
        cyl(0.12, 0.12, 0.7, '#ff9ec7', R - 2.5, 1.25, B + 1.2);
        cyl(0.2, 0.2, 0.5, '#ffe27a', R - 1.6, 1.15, B + 1.2);
        picture(['🪐 ☀️ 🌍'], L + 2.5, B + 1.2);
        break;
      case 'code':
        for (const x of [R - 1.6, R - 4]) {
          box(2, 0.8, 1, '#c9c9d6', x, 0.4, B + 1.2);
          box(1.3, 0.85, 0.12, '#222', x, 1.3, B + 1.0, false);
          box(1.15, 0.7, 0.13, '#5fd38d', x, 1.3, B + 1.02, false);
        }
        picture(['⬆️ ↩️ 🔁'], L + 2.5, B + 1.2);
        break;
      case 'music': {
        box(3, 1, 1.2, '#1f1f1f', R - 2.3, 0.5, B + 1.2);
        box(2.8, 0.08, 0.4, '#ffffff', R - 2.3, 1.04, B + 1.65, false);
        cyl(0.6, 0.6, 0.6, '#e05aa8', L + 2.2, 0.3, B + 1.6);
        this.addObstacle(area, { x: L + 2.2, z: B + 1.6, r: 1 });
        picture(['🎼 도 레 미'], L + 2.3, B + 0.8, 0.7);
        break;
      }
      case 'art':
        for (const [x, c] of [[R - 1.5, '#fdd835'], [R - 3.5, '#81d4fa']]) {
          box(0.1, 1.8, 0.1, '#8d6e63', x, 0.9, B + 1.4);
          const cv = box(1.3, 1, 0.08, c, x, 1.4, B + 1.5, false); cv.rotation.x = -0.15;
        }
        picture(['🎨 🖌️'], L + 2.5, B + 1.2);
        break;
      case 'pe': {
        cyl(0.08, 0.08, 3.2, '#888', R - 2, 1.6, B + 1);
        box(1.4, 1, 0.08, '#ffffff', R - 2, 3, B + 1.05, false);
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 20), lambert('#ff5722'));
        hoop.rotation.x = Math.PI / 2; hoop.position.set(R - 2, 2.6, B + 1.45); this.scene.add(hoop);
        this.addObstacle(area, { x: R - 2, z: B + 1, r: 0.7 });
        ball(0.3, '#ff7043', L + 2, 0.3, B + 1.5);
        ball(0.3, '#ffffff', L + 3, 0.3, B + 1.2);
        box(3, 0.15, 1.6, '#3c8dde', a.cx, 0.08, a.cz + 4.5, false);
        break;
      }
      default: break;
    }
  }

  buildRoof() {
    const area = 'roof';
    const a = AREAS.roof;
    const floor = planeTexture((ctx, w, h) => {
      ctx.fillStyle = '#9ccc65'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8bc34a';
      for (let i = 0; i < 120; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 3, 8);
    }, 256, 256, [6, 4.5]);
    this.floorAndWalls(area, { floor, wall: '#d7ccc8', trim: '#5b4bff' });
    // 탈출 문 (뒷벽 가운데, 큰 금빛 문)
    const gate = this.buildDoor(a.cx, a.cz - a.hd + 0.05, 0, '#ffc107', area);
    gate.group.scale.set(1.4, 1.3, 1);
    const gs = makeSprite(['🚪 탈출구', '비밀번호 4자리'], 0.9, { size: 56, bg: 'rgba(255,193,7,0.95)', fg: '#3b2a00' });
    gs.position.set(a.cx, 4.9, a.cz - a.hd + 0.6);
    this.scene.add(gs);
    this.addInteract({ id: 'gate', kind: 'gate', area, x: a.cx, z: a.cz - a.hd + 1.9, r: 1.6, label: '🔢 비밀번호 넣기', data: {}, mesh: gate.panel });
    // 퍼즐 상자 4개 (풀면 숫자가 나온다)
    const spots = [[-8, -4], [-4, 1], [4, 1], [8, -4]];
    this.stations[area] = spots.map(([dx, dz], i) => this.buildStation(area, a.cx + dx, a.cz + dz, i, ['#e8574d', '#3c8dde', '#2bab6b', '#e05aa8'][i]));
    // 내려가는 계단
    const d = this.buildDoor(a.cx - a.hw + 0.05, a.cz + 5, Math.PI / 2, '#888', area);
    const ex = makeSprite(['🪜 복도로'], 0.6, { size: 52, bg: '#555', fg: '#fff' });
    ex.position.set(a.cx - a.hw + 0.9, 3.7, a.cz + 5);
    this.scene.add(ex);
    this.addInteract({ id: 'exit:roof', kind: 'exit', area, x: a.cx - a.hw + 1.7, z: a.cz + 5, r: 1.6, label: '🪜 복도로 내려가기', data: {}, mesh: d.panel });
    for (const [x, z] of [[a.cx + 10, a.cz + 7], [a.cx - 10, a.cz - 7], [a.cx + 10, a.cz - 7]]) this.plant(x, z, area);
    // 하늘에 구름 몇 개
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random(), 12, 10), lambert('#ffffff'));
      c.position.set(a.cx - 14 + i * 7, 9 + Math.random() * 2, a.cz - 16);
      c.scale.y = 0.5;
      this.scene.add(c);
    }
  }

  // ---------- 상태 바꾸기 (게임에서 부른다) ----------
  setStation(area, i, { solved, text }) {
    const st = this.stations[area]?.[i];
    if (!st) return;
    st.solved = solved;
    st.lid.rotation.x = solved ? -1.9 : 0;
    st.lock.visible = !solved;
    setSprite(st.sprite, [text || (solved ? `${i + 1} ✅` : `${i + 1} ❓`)], { size: 54, bg: solved ? 'rgba(220,255,220,0.95)' : 'rgba(255,255,255,0.95)', border: solved ? '#2bab6b' : st.color, pad: 12 });
    st.it.label = solved ? `✅ ${i + 1}번 상자 (다시 보기)` : `🔒 ${i + 1}번 상자 풀기`;
  }
  setKeyVisible(area, on) {
    if (this.keys[area]) this.keys[area].visible = on;
    const it = this.interactables.find((x) => x.id === `key:${area}`);
    if (it) it.hidden = !on;
  }
  setBoardText(area, text) { if (this.boardSub?.[area]) setSprite(this.boardSub[area], [text], { size: 46, bg: null, fg: '#fff8c4' }); }
  setDoorKey(subj, has) {
    const s = SUBJECT[subj];
    setSprite(this.doorSigns[subj], [`${s.emoji} ${s.name}${has ? ' 🗝️' : ''}`], { size: 60, bg: s.color, fg: '#fff', pad: 16, border: has ? '#ffd23f' : null });
  }
  setRoofOpen(open, have) {
    setSprite(this.roofSign, open ? ['🔓 옥상 탈출구', '올라가 보세요!'] : ['🔒 옥상 탈출구', `열쇠 ${have}/${ROOF_KEYS}개`], { size: 54, bg: open ? 'rgba(255,193,7,0.95)' : 'rgba(40,30,120,0.92)', fg: open ? '#3b2a00' : '#fff' });
  }

  setPlayer(name, color, keys = 0) {
    if (this.player) this.scene.remove(this.player);
    this.player = makeAvatar(color, name, { me: true });
    this.player.position.copy(this.pos);
    this.player.rotation.y = this.rot;
    this.scene.add(this.player);
    setCrown(this.player, keys);
  }
  setPlayerKeys(keys) { if (this.player) setCrown(this.player, keys); }
  emote(emoji) { if (this.player) emoteOn(this.player, emoji); }

  goTo(area, spawn) {
    const a = AREAS[area];
    if (!a) return;
    this.area = area;
    const p = spawn || (area === 'lobby' ? LOBBY_SPAWN : area === 'roof' ? { x: a.cx - a.hw + 4.5, z: a.cz + 5 } : { x: a.cx - a.hw + 4.5, z: a.cz + 3 });
    // 친구들과 같은 자리에 겹치지 않게 조금씩 흩어 선다
    this.pos.set(p.x + (Math.random() - 0.5) * 2.4, 0, p.z + (Math.random() - 0.5) * 2);
    this.collide(area, this.pos);
    this.rot = area === 'lobby' ? Math.PI : Math.PI / 2;
    this.target = null; this.pending = null;
    if (this.player) { this.player.position.copy(this.pos); this.player.rotation.y = this.rot; }
    this.snapCamera = true;
    this.onArea(area);
  }
  // 로비로 돌아갈 때 그 교실 문 앞에 선다
  lobbySpotFor(subj) {
    const it = this.interactables.find((x) => x.id === `door:${subj}`);
    return it ? { x: it.x + (it.x < -15 ? 1 : it.x > 15 ? -1 : 0), z: it.z + (it.z < -10 ? 1 : 0) } : LOBBY_SPAWN;
  }

  // ---------- 다른 친구들 ----------
  upsertRemote(id, name, color, keys = 0) {
    let r = this.remotes.get(id);
    if (r && (r.name !== name || r.color !== color)) { this.scene.remove(r.av); r = null; }
    if (!r) {
      const av = makeAvatar(color, name);
      this.scene.add(av);
      r = { av, name, color, x: 0, z: 0, r: 0, area: 'lobby', tx: 0, tz: 0, tr: 0, keys: -1, seen: false };
      this.remotes.set(id, r);
    }
    if (r.keys !== keys) { r.keys = keys; setCrown(r.av, keys); }
    return r;
  }
  moveRemote(id, x, z, rot, area) {
    const r = this.remotes.get(id);
    if (!r) return;
    const jump = !r.seen || r.area !== area || Math.hypot(r.tx - x, r.tz - z) > 6;
    r.tx = x; r.tz = z; r.tr = rot; r.area = area; r.seen = true;
    if (jump) { r.av.position.set(x, 0, z); r.av.rotation.y = rot; }
  }
  removeRemote(id) {
    const r = this.remotes.get(id);
    if (r) { this.scene.remove(r.av); this.remotes.delete(id); }
  }
  emoteRemote(id, emoji) { const r = this.remotes.get(id); if (r) emoteOn(r.av, emoji); }

  // 선생님 화면: 한 장소를 위에서 내려다본다
  spectate(area) {
    this.spectating = area;
    if (this.player) this.player.visible = !area;
    this.snapCamera = true;
  }

  // ---------- 입력 ----------
  bindInput() {
    const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '');
    window.addEventListener('keydown', (e) => {
      if (typing(e) || this.paused) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { this.keysDown.add(k); this.target = null; this.pending = null; e.preventDefault(); }
      if ((k === ' ' || k === 'enter' || k === 'e') && this.near && !this.frozen) { e.preventDefault(); this.onInteract(this.near); }
    });
    window.addEventListener('keyup', (e) => this.keysDown.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keysDown.clear());

    // 화면을 누르면 그곳으로 걸어간다. 문이나 상자를 누르면 걸어가서 연다.
    const ray = new THREE.Raycaster();
    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down || this.spectating || this.frozen || this.paused) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 14) return;
      const rect = this.canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      const meshes = this.interactables.filter((it) => it.area === this.area && it.mesh && !it.hidden).flatMap((it) => {
        const list = [it.mesh];
        it.mesh.parent?.children.forEach((c) => { if (c.userData.interact === it) list.push(c); });
        return list;
      });
      const hit = ray.intersectObjects(meshes, false)[0];
      if (hit) {
        const it = hit.object.userData.interact;
        if (it) {
          if (this.near === it) { this.onInteract(it); return; }
          this.target = new THREE.Vector3(it.x, 0, it.z); this.pending = it; return;
        }
      }
      const fh = ray.intersectObjects(this.floors.filter((f) => f.userData.floor === this.area), false)[0];
      if (fh) { this.target = fh.point.clone(); this.target.y = 0; this.pending = null; }
    });
  }
  setJoystick(x, z) { this.input.x = x; this.input.z = z; if (x || z) { this.target = null; this.pending = null; } }

  resize() {
    const w = this.canvas.clientWidth || 1; const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // 세로 화면(태블릿 세로)이면 조금 더 넓게 본다
    this.camera.fov = w < h ? 62 : 48;
    this.camera.updateProjectionMatrix();
  }

  // ---------- 매 장면 ----------
  collide(area, p) {
    const a = AREAS[area];
    const m = 0.55;
    p.x = Math.max(a.cx - a.hw + m, Math.min(a.cx + a.hw - m, p.x));
    p.z = Math.max(a.cz - a.hd + m, Math.min(a.cz + a.hd - m, p.z));
    for (const o of this.obstacles[area] || []) {
      if (o.box) {
        const [x0, z0, x1, z1] = o.box;
        if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
          const dl = p.x - x0; const dr = x1 - p.x; const dt = p.z - z0; const db = z1 - p.z;
          const mn = Math.min(dl, dr, dt, db);
          if (mn === dl) p.x = x0; else if (mn === dr) p.x = x1; else if (mn === dt) p.z = z0; else p.z = z1;
        }
      } else {
        const dx = p.x - o.x; const dz = p.z - o.z; const d = Math.hypot(dx, dz); const r = o.r + 0.4;
        if (d < r) { const k = d > 1e-4 ? r / d : 1; p.x = o.x + dx * k; p.z = o.z + (d > 1e-4 ? dz * k : r); }
      }
    }
  }

  tick() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    let moving = false;
    if (this.player && !this.spectating) {
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
      if (len > 0.05) {
        const sp = 5.2 * Math.min(1, len);
        const before = this.pos.clone();
        this.pos.x += (ix / Math.max(1, len)) * sp * dt;
        this.pos.z += (iz / Math.max(1, len)) * sp * dt;
        this.collide(this.area, this.pos);
        // 막혀서 못 가면 걸어가기를 그만둔다
        if (this.target && before.distanceTo(this.pos) < sp * dt * 0.2) { this.stuck = (this.stuck || 0) + dt; if (this.stuck > 0.4) { this.target = null; this.pending = null; } } else this.stuck = 0;
        const want = Math.atan2(ix, iz);
        let diff = want - this.rot;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.rot += diff * Math.min(1, dt * 12);
        moving = true;
      }
      this.player.position.copy(this.pos);
      this.player.rotation.y = this.rot;
      animateAvatar(this.player, moving, dt);
      this.moving = moving;

      // 가까운 문·상자
      let best = null; let bd = Infinity;
      for (const it of this.interactables) {
        if (it.area !== this.area || it.hidden) continue;
        const d = Math.hypot(it.x - this.pos.x, it.z - this.pos.z);
        if (d < it.r && d < bd) { best = it; bd = d; }
      }
      if (best !== this.near) { this.near = best; this.onPrompt(best); }
    }

    // 친구들: 받은 자리로 부드럽게
    for (const r of this.remotes.values()) {
      const p = r.av.position;
      const dx = r.tx - p.x; const dz = r.tz - p.z;
      const k = Math.min(1, dt * 10);
      p.x += dx * k; p.z += dz * k;
      let diff = r.tr - r.av.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      r.av.rotation.y += diff * k;
      animateAvatar(r.av, Math.hypot(dx, dz) > 0.05, dt);
      r.av.visible = r.seen;
    }

    // 열쇠 빙글빙글, 상자 위 표시 둥실
    for (const g of Object.values(this.keys)) if (g.visible) { g.userData.spin.rotation.y += dt * 2; g.userData.spin.position.y = 1.6 + Math.sin(this.time * 3) * 0.12; }
    for (const list of Object.values(this.stations)) for (const st of list) st.sprite.position.y = 2.2 + Math.sin(this.time * 2.4 + st.i) * 0.08;

    // 카메라
    const area = this.spectating || this.area;
    const a = AREAS[area];
    let look; let off;
    if (this.spectating) { look = new THREE.Vector3(a.cx, 0, a.cz - 1); off = a.spec; }
    else {
      // 교실·옥상은 방 전체가 보이게 가운데 쪽을 보고, 넓은 복도는 나를 따라간다
      const f = a.follow ?? 1;
      look = new THREE.Vector3(a.cx + (this.pos.x - a.cx) * f, 0.8, a.cz + (this.pos.z - a.cz) * f - (f === 1 ? 4 : 1));
      off = a.cam;
    }
    // 세로 화면(폰·세운 태블릿)은 옆이 좁아서 조금 더 멀리서 본다
    const k = this.camera.aspect < 1 ? 1.45 : 1;
    const want = new THREE.Vector3(look.x + off[0] * k, look.y + off[1] * k, look.z + off[2] * k);
    if (this.snapCamera) { this.camera.position.copy(want); this.snapCamera = false; }
    else this.camera.position.lerp(want, Math.min(1, dt * 6));
    this.camera.lookAt(look);
    this.renderer.render(this.scene, this.camera);
  }

  getState() { return { x: Math.round(this.pos.x * 100) / 100, z: Math.round(this.pos.z * 100) / 100, r: Math.round(this.rot * 100) / 100, a: this.area }; }
}
