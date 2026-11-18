// 내 캐릭터: 머리가 큰 "동글 친구" 모양. 꾸미기 고르기 목록과 3D 모양 만들기.
// look = { skin, hair, hairColor, shirt, hat, face, back, pattern, pet }
import { THREE, toon, part, at, sph, cap, cyl, box, OUTLINE } from './toon.js';

export const SKINS = ['#ffdcc0', '#f6c9a0', '#dca27a', '#b0754d', '#7d4e30'];
export const HAIR_COLORS = ['#3a2a1e', '#7a4a24', '#cf8a3c', '#f2d060', '#ef6b5b', '#f29ac0', '#5b8def', '#9e9e9e'];
export const SHIRTS = ['#ef5b5b', '#ff9f43', '#f5d33f', '#6cc96c', '#48b4e8', '#7f6cf0', '#f07cc0', '#ffffff'];

export const HAIRS = [
  ['short', '짧은 머리'], ['spiky', '삐죽 머리'], ['bowl', '바가지 머리'], ['messy', '더벅머리'], ['twoblock', '투블럭'], ['tuft', '까치 머리'],
  ['bob', '단발'], ['bangs', '앞머리 단발'], ['ponytail', '포니테일'], ['pigtails', '양갈래'], ['bun', '똥머리'], ['buns', '양쪽 똥머리'],
  ['braid', '땋은 머리'], ['long', '긴 머리'], ['halfup', '반묶음'], ['curly', '뽀글 파마'],
];
// [아이디, 이름, 열리는 데 필요한 열쇠 수(0이면 처음부터)]
export const HATS = [
  ['none', '없음', 0], ['cap', '🧢 야구모자', 0], ['straw', '👒 밀짚모자', 0], ['ribbon', '🎀 리본', 0], ['bunny', '🐰 토끼 머리띠', 0],
  ['catears', '🐱 고양이 귀', 0], ['headphones', '🎧 헤드폰', 0], ['explorer', '⛑️ 탐험대 모자', 0], ['flower', '🌸 꽃 머리핀', 0],
  ['magic', '🎩 마술사 모자', 6], ['dino', '🦖 공룡 모자', 9], ['crown', '👑 왕관', 14],
];
export const FACES = [['none', '없음', 0], ['glasses', '👓 동글 안경', 0], ['sunglasses', '🕶️ 선글라스', 0], ['goggles', '🥽 수경', 0], ['whiskers', '😺 고양이 수염', 0], ['mask', '🦸 영웅 가면', 11]];
export const BACKS = [['none', '없음', 0], ['bag', '🎒 가방', 0], ['balloon', '🎈 풍선', 0], ['magnifier', '🔍 돋보기', 0], ['lollipop', '🍭 막대사탕', 0], ['wings', '🦋 나비 날개', 3], ['cape', '🦸 망토', 5], ['wand', '🪄 요술봉', 8]];
export const PATTERNS = [['plain', '민무늬', 0], ['stripes', '줄무늬', 0], ['dots', '물방울', 0], ['heart', '❤️ 하트', 0], ['star', '⭐ 별', 2], ['flash', '⚡ 번개', 10]];
export const PETS = [['none', '없음', 0], ['chick', '🐥 병아리', 1], ['puppy', '🐶 강아지', 4], ['kitty', '🐱 고양이', 7], ['turtle', '🐢 거북이', 12], ['dragon', '🐉 아기 용', 18]];

export const CATS = { hat: HATS, face: FACES, back: BACKS, pattern: PATTERNS, pet: PETS };
// 열쇠로 열리는 특별한 꾸미기 (열쇠 수 순서)
export const SPECIALS = Object.entries(CATS).flatMap(([cat, list]) => list.filter((x) => x[2] > 0).map(([id, label, need]) => ({ cat, id, label, need }))).sort((a, b) => a.need - b.need);
export const isOpen = (cat, id, keys) => { const it = CATS[cat]?.find((x) => x[0] === id); return !!it && keys >= it[2]; };
export const nextSpecial = (keys) => SPECIALS.find((s) => s.need > keys) || null;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function randomLook(keys = 0) {
  const open = (list) => list.filter((x) => x[2] <= keys).map((x) => x[0]);
  return {
    skin: pick(SKINS), hair: pick(HAIRS)[0], hairColor: pick(HAIR_COLORS), shirt: pick(SHIRTS),
    hat: Math.random() < 0.5 ? 'none' : pick(open(HATS)), face: Math.random() < 0.6 ? 'none' : pick(open(FACES)),
    back: Math.random() < 0.6 ? 'none' : pick(open(BACKS)), pattern: pick(open(PATTERNS)), pet: Math.random() < 0.5 ? 'none' : pick(open(PETS)),
  };
}
// 받은 look 을 믿을 수 있는 값으로만 (모르는 값은 기본값)
export function cleanLook(l = {}, keys = 99) {
  const ok = (list, v, d) => (list.some((x) => (Array.isArray(x) ? x[0] : x) === v) ? v : d);
  const okLock = (cat, v) => (CATS[cat].some((x) => x[0] === v && x[2] <= keys) ? v : CATS[cat][0][0]);
  return {
    skin: ok(SKINS, l.skin, SKINS[1]), hair: ok(HAIRS, l.hair, 'short'), hairColor: ok(HAIR_COLORS, l.hairColor, HAIR_COLORS[0]), shirt: ok(SHIRTS, l.shirt, SHIRTS[4]),
    hat: okLock('hat', l.hat), face: okLock('face', l.face), back: okLock('back', l.back), pattern: okLock('pattern', l.pattern), pet: okLock('pet', l.pet),
  };
}

// ---------- 옷 무늬 그림 ----------
const patCache = new Map();
function shirtMat(color, pattern) {
  if (pattern === 'plain') return toon(color);
  const key = `${color}|${pattern}`;
  if (patCache.has(key)) return patCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 256, 128);
  const dark = color === '#ffffff' ? '#7f6cf0' : 'rgba(255,255,255,0.85)';
  if (pattern === 'stripes') { x.fillStyle = dark; for (let y = 8; y < 128; y += 24) x.fillRect(0, y, 256, 10); }
  if (pattern === 'dots') { x.fillStyle = dark; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(16 + i * 32 + (j % 2) * 16, 16 + j * 32, 6, 0, Math.PI * 2); x.fill(); } }
  if (pattern === 'heart' || pattern === 'star' || pattern === 'flash') {
    const ch = { heart: '❤️', star: '⭐', flash: '⚡' }[pattern];
    x.font = '20px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) x.fillText(ch, 16 + i * 32 + (r % 2) * 16, 34 + r * 30);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = toon('#ffffff', { map: t });
  patCache.set(key, m);
  return m;
}

// ---------- 머리 겉면 위의 점 ----------
const R = 0.56;
const onHead = (a, b, lift = 0) => new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)).multiplyScalar(R + lift);
const faceOut = (m) => { m.lookAt(m.position.clone().multiplyScalar(2)); return m; };
const basic = (c) => new THREE.MeshBasicMaterial({ color: c });

function buildFace(head) {
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(sph(0.085, 16, 12), toon('#2b1a10'));
    e.position.copy(onHead(s * 0.33, 0.02, -0.01)); e.scale.set(1, 1.3, 0.45); faceOut(e);
    head.add(e); eyes.push(e);
    const hl = new THREE.Mesh(sph(0.03, 8, 6), basic('#ffffff')); hl.position.copy(onHead(s * 0.33 + 0.04, 0.09, 0.012)); head.add(hl); eyes.push(hl);
    const b = new THREE.Mesh(sph(0.075, 12, 8), basic('#ff9e9e')); b.position.copy(onHead(s * 0.53, -0.2, -0.02)); b.scale.set(1.3, 0.7, 0.3); faceOut(b); head.add(b);
  }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 16, Math.PI), basic(OUTLINE));
  m.position.copy(onHead(0, -0.23)); faceOut(m); m.rotateZ(Math.PI); head.add(m);
  return eyes;
}

function buildHair(head, style, color) {
  const H = (geo, x, y, z, o = {}) => { const p = at(part(geo, color, o), x, y, z); head.add(p); return p; };
  const shell = (theta, r = 0.6) => new THREE.SphereGeometry(r, 28, 16, 0, Math.PI * 2, 0, Math.PI * theta);
  const capTop = () => { const c = H(shell(0.42), 0, 0, -0.03); c.rotation.x = -0.32; return c; };
  const bobShell = () => { const c = H(shell(0.62, 0.63), 0, 0, -0.05); c.rotation.x = -0.55; return c; };
  const bangs = () => H(new THREE.SphereGeometry(0.605, 20, 10, Math.PI / 2 - 0.75, 1.5, 0.3, 0.85), 0, 0, 0, { t: 0.015 });
  switch (style) {
    case 'spiky':
      capTop();
      for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; const k = H(new THREE.ConeGeometry(0.13, 0.32, 10), Math.sin(a) * 0.36, 0.52 + Math.cos(a) * 0.04, Math.cos(a) * 0.1 - 0.12); k.rotation.z = -a * 0.6; k.rotation.x = -0.3; }
      break;
    case 'bowl': { const c = H(shell(0.47, 0.61), 0, 0, 0); c.rotation.x = -0.22; break; }
    case 'messy':
      capTop();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; H(sph(0.17, 12, 10), Math.cos(a) * 0.34, 0.42 + (i % 2) * 0.08, Math.sin(a) * 0.3 - 0.08, { t: 0.02 }); }
      break;
    case 'twoblock': { const c = H(shell(0.34, 0.6), 0, 0.04, -0.04); c.rotation.x = -0.25; c.scale.set(1, 1.18, 1); break; }
    case 'tuft': {
      capTop();
      const k = H(new THREE.ConeGeometry(0.08, 0.34, 10), 0.05, 0.72, 0.05); k.rotation.z = -0.5;
      break;
    }
    case 'bob': bobShell(); bangs(); break;
    case 'bangs': bobShell(); { const b = bangs(); b.scale.set(1.01, 1.04, 1.02); } break;
    case 'ponytail': {
      capTop();
      const t = H(sph(0.22, 16, 12), 0, -0.02, -0.66); t.scale.set(0.8, 1.5, 0.8); t.rotation.x = 0.4;
      head.add(at(part(sph(0.07, 10, 8), '#ff6b8b', { t: 0.01 }), 0, 0.2, -0.6));
      break;
    }
    case 'pigtails':
      capTop();
      for (const s of [-1, 1]) { const t = H(cap(0.13, 0.3), s * 0.62, -0.12, -0.12); t.rotation.z = s * 0.35; head.add(at(part(sph(0.07, 10, 8), '#ff6b8b', { t: 0.01 }), s * 0.55, 0.08, -0.1)); }
      break;
    case 'bun': capTop(); H(sph(0.25, 16, 12), 0, 0.62, -0.12); break;
    case 'buns': capTop(); for (const s of [-1, 1]) H(sph(0.2, 16, 12), s * 0.38, 0.5, -0.05); break;
    case 'braid': {
      capTop();
      const pts = [[0.5, -0.06, -0.25], [0.55, -0.24, -0.18], [0.58, -0.42, -0.12], [0.6, -0.6, -0.06]];
      pts.forEach(([x, y, z]) => H(sph(0.11, 12, 10), x, y, z, { t: 0.018 }));
      head.add(at(part(sph(0.06, 10, 8), '#ff6b8b', { t: 0.01 }), 0.61, -0.73, -0.04));
      break;
    }
    case 'long': case 'halfup': {
      bobShell();
      const back = H(sph(0.5, 20, 14), 0, -0.4, -0.28); back.scale.set(1.08, 1.45, 0.55);
      if (style === 'halfup') { H(sph(0.15, 12, 10), 0, 0.12, -0.62); head.add(at(part(sph(0.06, 10, 8), '#ff6b8b', { t: 0.01 }), 0, 0.12, -0.5)); } else bangs();
      break;
    }
    case 'curly':
      for (let i = 0; i < 46; i++) {
        const u = i / 46; const pol = Math.acos(1 - u * 1.15); const az = i * 2.399;
        const v = new THREE.Vector3(Math.sin(pol) * Math.cos(az), Math.cos(pol), Math.sin(pol) * Math.sin(az));
        if (v.z > 0.55 && v.y < 0.45) continue; // 얼굴은 비운다
        H(sph(0.14, 10, 8), v.x * 0.58, v.y * 0.58, v.z * 0.58, { t: 0.016 });
      }
      break;
    default: capTop();
  }
}

function buildHat(head, id, hairColor) {
  const P = (geo, c, x, y, z, o) => { const p = at(part(geo, c, o), x, y, z); head.add(p); return p; };
  switch (id) {
    case 'cap': { const d = P(new THREE.SphereGeometry(0.63, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.38), '#ff5c5c', 0, 0.04, -0.02); d.rotation.x = -0.15; const b = P(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 20, 1, false, -Math.PI / 2, Math.PI), '#ff5c5c', 0, 0.3, 0.42); b.rotation.x = 0.2; P(sph(0.06, 8, 6), '#ffffff', 0, 0.66, 0); break; }
    case 'straw': P(cyl(0.38, 0.44, 0.3), '#f2cf7a', 0, 0.6, -0.03); P(cyl(0.88, 0.88, 0.04, 28), '#f2cf7a', 0, 0.46, -0.03); P(cyl(0.445, 0.445, 0.09), '#ef5b5b', 0, 0.5, -0.03, { line: false }); break;
    case 'ribbon': for (const s of [-1, 1]) { const c = P(new THREE.ConeGeometry(0.12, 0.24, 12), '#ff6b8b', 0.33 + s * 0.13, 0.48, 0.1); c.rotation.z = s * Math.PI / 2; } P(sph(0.07, 10, 8), '#ff3b7a', 0.33, 0.48, 0.1); break;
    case 'bunny': { const b = P(new THREE.TorusGeometry(0.56, 0.035, 8, 32, Math.PI), '#ffffff', 0, 0.02, -0.05); b.rotation.y = Math.PI / 2; b.rotation.z = 0; for (const s of [-1, 1]) { const e = P(cap(0.11, 0.42), '#ffffff', s * 0.22, 0.85, -0.05); e.rotation.z = -s * 0.15; const inr = at(new THREE.Mesh(cap(0.06, 0.32), toon('#ffb3c7')), s * 0.22, 0.85, 0.04); inr.rotation.z = -s * 0.15; head.add(inr); } break; }
    case 'catears': for (const s of [-1, 1]) { const e = P(new THREE.ConeGeometry(0.17, 0.3, 4), hairColor, s * 0.33, 0.55, -0.04); e.rotation.z = -s * 0.35; const inr = at(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 4), toon('#ffb3c7')), s * 0.33, 0.53, 0.03); inr.rotation.z = -s * 0.35; head.add(inr); } break;
    case 'headphones': { const b = P(new THREE.TorusGeometry(0.62, 0.05, 8, 24, Math.PI), '#5b6cff', 0, 0, -0.02); void b; for (const s of [-1, 1]) { const c = P(cyl(0.16, 0.16, 0.12), '#5b6cff', s * 0.6, 0, -0.02); c.rotation.z = Math.PI / 2; } break; }
    case 'explorer': { const d = P(new THREE.SphereGeometry(0.64, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), '#d8b77a', 0, 0.02, -0.02); d.rotation.x = -0.12; P(cyl(0.82, 0.82, 0.04, 28), '#d8b77a', 0, 0.24, -0.02); P(cyl(0.6, 0.6, 0.08, 24), '#8a5a34', 0, 0.3, -0.02, { line: false }); break; }
    case 'flower': { const c = new THREE.Vector3(0.34, 0.42, 0.3); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; P(sph(0.06, 8, 6), '#ffb3d1', c.x + Math.cos(a) * 0.08, c.y + Math.sin(a) * 0.08, c.z, { t: 0.01 }); } P(sph(0.05, 8, 6), '#ffd23f', c.x, c.y, c.z + 0.02, { t: 0.01 }); break; }
    case 'magic': P(cyl(0.32, 0.32, 0.6), '#2b2b3a', 0, 0.82, -0.04); P(cyl(0.56, 0.56, 0.04, 28), '#2b2b3a', 0, 0.52, -0.04); P(cyl(0.325, 0.325, 0.1), '#9c5bff', 0, 0.6, -0.04, { line: false }); break;
    case 'dino': { const d = P(new THREE.SphereGeometry(0.64, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.46), '#6cc96c', 0, 0, -0.03); d.rotation.x = -0.25; for (let i = 0; i < 5; i++) { const z = 0.3 - i * 0.18; const y = 0.58 - Math.abs(z + 0.05) * 0.5; const s = P(new THREE.ConeGeometry(0.09, 0.2, 8), '#ffd23f', 0, y + 0.08, z); s.rotation.x = -z * 0.8; } for (const s of [-1, 1]) P(sph(0.06, 8, 6), '#ffffff', s * 0.16, 0.42, 0.42, { t: 0.01 }); break; }
    case 'crown': {
      P(cyl(0.24, 0.22, 0.16, 16), '#ffcc1a', 0, 0.62, -0.05);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; P(new THREE.ConeGeometry(0.06, 0.16, 8), '#ffcc1a', Math.sin(a) * 0.2, 0.77, Math.cos(a) * 0.2 - 0.05, { t: 0.015 }); }
      P(sph(0.05, 8, 6), '#ff5c8a', 0, 0.64, 0.19, { t: 0.01 });
      break;
    }
    default: break;
  }
}

function buildFaceItem(head, id) {
  const P = (geo, c, pos, o) => { const p = part(geo, c, o); p.position.copy(pos); head.add(p); return p; };
  switch (id) {
    case 'glasses': for (const s of [-1, 1]) { const r = P(new THREE.TorusGeometry(0.13, 0.022, 8, 20), OUTLINE, onHead(s * 0.33, 0.02, 0.05), { line: false }); faceOut(r); } P(cyl(0.015, 0.015, 0.14, 6), OUTLINE, onHead(0, 0.03, 0.06), { line: false }).rotation.z = Math.PI / 2; break;
    case 'sunglasses': for (const s of [-1, 1]) { const g = P(sph(0.14, 16, 10), '#222233', onHead(s * 0.32, 0.03, 0.03), { t: 0.015 }); g.scale.set(1.15, 0.85, 0.35); faceOut(g); } P(cyl(0.02, 0.02, 0.16, 6), '#222233', onHead(0, 0.05, 0.05), { line: false }).rotation.z = Math.PI / 2; break;
    case 'goggles': { for (const s of [-1, 1]) { const r = P(new THREE.TorusGeometry(0.14, 0.045, 8, 20), '#2bb5c8', onHead(s * 0.32, 0.03, 0.05), { t: 0.012 }); faceOut(r); } const st = P(new THREE.TorusGeometry(0.585, 0.03, 6, 32), '#2bb5c8', new THREE.Vector3(0, 0.03, 0), { line: false }); st.rotation.x = Math.PI / 2; break; }
    case 'whiskers': for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { const w = P(cyl(0.008, 0.008, 0.26, 4), OUTLINE, onHead(s * 0.62, -0.16 + k * 0.05, 0.02), { line: false }); w.rotation.z = Math.PI / 2 + k * 0.15 * s; } P(sph(0.045, 8, 6), '#ff8fa8', onHead(0, -0.12, 0.01), { t: 0.01 }); break;
    case 'mask': {
      // 눈 둘레만 가리는 가면 (눈은 그대로 보인다)
      for (const s of [-1, 1]) { const m = P(sph(0.16, 16, 12), '#ef3b3b', onHead(s * 0.31, 0.03, -0.062), { t: 0.012 }); m.scale.set(1.35, 0.95, 0.5); faceOut(m); }
      const back = P(new THREE.TorusGeometry(0.565, 0.035, 6, 32, Math.PI), '#ef3b3b', new THREE.Vector3(0, 0.03, 0), { line: false }); back.rotation.x = Math.PI / 2; back.rotation.z = Math.PI;
      break;
    }
    default: break;
  }
}

function buildBack(g, id, parts) {
  const P = (geo, c, x, y, z, o) => { const p = at(part(geo, c, o), x, y, z); g.add(p); return p; };
  switch (id) {
    case 'bag': P(box(0.44, 0.46, 0.22), '#ef8f3c', 0, 0.72, -0.36); P(box(0.46, 0.16, 0.24), '#d9772a', 0, 0.9, -0.37); break;
    case 'balloon': {
      const line = new THREE.Mesh(cyl(0.008, 0.008, 1.55, 4), toon(OUTLINE)); line.position.set(0.62, 1.2, 0.03); line.rotation.z = -0.08; g.add(line);
      const b = P(sph(0.3, 20, 16), '#ff5c8a', 0.68, 2.1, 0.03); b.scale.set(1, 1.15, 1); parts.balloon = b;
      break;
    }
    case 'magnifier': { const h = P(cyl(0.035, 0.035, 0.32, 8), '#8a5a34', 0.6, 0.55, 0.12); h.rotation.x = 0.6; const r = P(new THREE.TorusGeometry(0.12, 0.03, 8, 20), '#c9c9d6', 0.6, 0.76, 0.24); r.rotation.x = 0.6; const gl = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), new THREE.MeshBasicMaterial({ color: '#cdeeff', transparent: true, opacity: 0.6, side: THREE.DoubleSide })); gl.position.set(0.6, 0.76, 0.24); gl.rotation.x = 0.6 - Math.PI / 2; g.add(gl); break; }
    case 'lollipop': { P(cyl(0.02, 0.02, 0.45, 6), '#ffffff', 0.6, 0.66, 0.05, { t: 0.01 }); const d = P(cyl(0.17, 0.17, 0.06, 20), '#ff6bb5', 0.6, 0.98, 0.05); d.rotation.x = Math.PI / 2; const s = P(new THREE.TorusGeometry(0.09, 0.025, 6, 16), '#ffffff', 0.6, 0.98, 0.09, { line: false }); void s; break; }
    case 'wings': {
      const w = new THREE.Group(); w.position.set(0, 0.85, -0.34); g.add(w); parts.wings = w;
      for (const s of [-1, 1]) {
        const up = at(part(sph(0.3, 16, 12), '#9c7bff'), s * 0.3, 0.12, 0); up.scale.set(1, 1.2, 0.18); up.rotation.z = -s * 0.5; w.add(up);
        const lo = at(part(sph(0.2, 16, 12), '#ff8fd1'), s * 0.24, -0.22, 0); lo.scale.set(1, 1.1, 0.18); lo.rotation.z = s * 0.4; w.add(lo);
      }
      break;
    }
    case 'cape': { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.6, 0.95, 18, 1, true, Math.PI * 0.55, Math.PI * 0.9), toon('#e53935', { side: THREE.DoubleSide })); c.position.set(0, 0.55, -0.04); g.add(c); parts.cape = c; P(sph(0.06, 8, 6), '#ffd23f', 0, 0.98, 0.26, { t: 0.01 }); break; }
    case 'wand': { const st = P(cyl(0.025, 0.025, 0.5, 6), '#3b2414', 0.62, 0.68, 0.12, { line: false }); st.rotation.x = 0.5; const star = P(new THREE.OctahedronGeometry(0.11, 0), '#ffd23f', 0.62, 0.92, 0.25, { t: 0.012 }); parts.star = star; break; }
    default: break;
  }
}

// ---------- 같이 다니는 친구 ----------
export function buildPet(id) {
  if (!id || id === 'none') return null;
  const g = new THREE.Group();
  const P = (geo, c, x, y, z, o) => { const p = at(part(geo, c, o), x, y, z); g.add(p); return p; };
  const eyes = (y, z, sp = 0.08) => { for (const s of [-1, 1]) g.add(at(new THREE.Mesh(sph(0.035, 8, 6), toon('#2b1a10')), s * sp, y, z)); };
  switch (id) {
    case 'chick': P(sph(0.24, 18, 14), '#ffd84a', 0, 0.26, 0); P(sph(0.16, 16, 12), '#ffd84a', 0, 0.52, 0.05); const bk = P(new THREE.ConeGeometry(0.05, 0.1, 8), '#ff9f43', 0, 0.5, 0.22, { t: 0.01 }); bk.rotation.x = Math.PI / 2; eyes(0.56, 0.18, 0.06); for (const s of [-1, 1]) { const w = P(sph(0.1, 10, 8), '#ffc61a', s * 0.23, 0.28, 0); w.scale.set(0.5, 0.9, 1); } break;
    case 'puppy': { const b = P(cap(0.15, 0.25), '#c98a52', 0, 0.25, 0); b.rotation.x = Math.PI / 2; P(sph(0.2, 16, 12), '#c98a52', 0, 0.45, 0.2); P(sph(0.09, 10, 8), '#fff3e0', 0, 0.4, 0.37, { t: 0.01 }); g.add(at(new THREE.Mesh(sph(0.04, 8, 6), toon('#2b1a10')), 0, 0.44, 0.45)); eyes(0.5, 0.36); for (const s of [-1, 1]) { const e = P(sph(0.09, 10, 8), '#7a4a24', s * 0.18, 0.47, 0.17); e.scale.set(0.5, 1.2, 0.8); } const t = P(cap(0.04, 0.15), '#c98a52', 0, 0.38, -0.3); t.rotation.x = -0.7; for (const [x, z] of [[-0.1, 0.12], [0.1, 0.12], [-0.1, -0.12], [0.1, -0.12]]) P(cyl(0.05, 0.05, 0.14, 8), '#c98a52', x, 0.07, z, { t: 0.012 }); break; }
    case 'kitty': { const b = P(cap(0.14, 0.22), '#ffb35c', 0, 0.24, 0); b.rotation.x = Math.PI / 2; P(sph(0.19, 16, 12), '#ffb35c', 0, 0.44, 0.18); eyes(0.47, 0.34); for (const s of [-1, 1]) { const e = P(new THREE.ConeGeometry(0.07, 0.14, 4), '#ffb35c', s * 0.11, 0.62, 0.16); e.rotation.z = -s * 0.3; } const t = P(cap(0.035, 0.3), '#ffb35c', 0, 0.42, -0.32); t.rotation.x = -0.4; for (const [x, z] of [[-0.09, 0.11], [0.09, 0.11], [-0.09, -0.11], [0.09, -0.11]]) P(cyl(0.045, 0.045, 0.14, 8), '#ffb35c', x, 0.07, z, { t: 0.012 }); break; }
    case 'turtle': { const s = P(new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#4caf50', 0, 0.1, 0); void s; P(cyl(0.3, 0.3, 0.06, 18), '#8bc34a', 0, 0.1, 0); P(sph(0.12, 12, 10), '#9ccc65', 0, 0.2, 0.34); eyes(0.25, 0.44, 0.05); for (const [x, z] of [[-0.22, 0.18], [0.22, 0.18], [-0.22, -0.18], [0.22, -0.18]]) P(sph(0.07, 8, 6), '#9ccc65', x, 0.07, z); break; }
    case 'dragon': { const b = P(cap(0.17, 0.2), '#5ccf8a', 0, 0.3, 0); b.rotation.x = 0.3; P(sph(0.21, 16, 12), '#5ccf8a', 0, 0.62, 0.12); P(sph(0.1, 10, 8), '#b8f0c8', 0, 0.56, 0.3, { t: 0.01 }); eyes(0.68, 0.29); for (const s of [-1, 1]) { const h = P(new THREE.ConeGeometry(0.04, 0.12, 8), '#ffd23f', s * 0.09, 0.84, 0.1, { t: 0.01 }); h.rotation.z = -s * 0.3; const w = P(new THREE.ConeGeometry(0.16, 0.3, 3), '#ff8fd1', s * 0.24, 0.48, -0.1); w.rotation.z = s * 1.2; w.scale.z = 0.3; } const t = P(new THREE.ConeGeometry(0.08, 0.35, 8), '#5ccf8a', 0, 0.18, -0.3); t.rotation.x = -1.2; break; }
    default: return null;
  }
  g.userData.hop = 0;
  return g;
}

// ---------- 캐릭터 만들기 ----------
export function buildAvatar(look) {
  const L = cleanLook(look);
  const g = new THREE.Group();
  const parts = {};
  // 다리 (엉덩이에서 흔들리게)
  parts.legs = [-1, 1].map((s) => {
    const hip = new THREE.Group(); hip.position.set(s * 0.15, 0.34, 0);
    hip.add(at(part(cap(0.11, 0.12), '#3b4a6b'), 0, -0.13, 0));
    const sh = at(part(sph(0.15, 16, 12), '#ffffff'), 0.01 * s, -0.27, 0.05); sh.scale.set(1, 0.6, 1.35); hip.add(sh);
    g.add(hip); return hip;
  });
  // 몸통
  const body = part(cap(0.31, 0.28), L.shirt, { mat: shirtMat(L.shirt, L.pattern) });
  body.position.y = 0.66;
  body.rotation.y = Math.PI / 2;
  g.add(body);
  // 팔 (어깨에서 흔들리게)
  parts.arms = [-1, 1].map((s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.33, 0.86, 0); sh.rotation.z = s * 0.45;
    sh.add(at(part(cap(0.1, 0.24), L.shirt), 0, -0.2, 0));
    sh.add(at(part(sph(0.1, 12, 10), L.skin), 0, -0.42, 0.02));
    g.add(sh); return sh;
  });
  // 머리
  const head = new THREE.Group(); head.position.y = 1.42; g.add(head);
  head.add(part(sph(R, 28, 20), L.skin));
  parts.eyes = buildFace(head);
  // 머리를 덮는 모자를 쓰면 위로 솟는 머리는 짧은 머리로 바꿔 모자를 뚫고 나오지 않게 한다
  const covering = ['cap', 'straw', 'magic', 'dino', 'explorer'].includes(L.hat);
  const tall = ['spiky', 'messy', 'tuft', 'bun', 'buns', 'curly', 'twoblock'];
  buildHair(head, covering && tall.includes(L.hair) ? 'short' : L.hair, L.hairColor);
  buildHat(head, L.hat, L.hairColor);
  buildFaceItem(head, L.face);
  buildBack(g, L.back, parts);
  parts.head = head;
  g.userData.parts = parts;
  g.userData.look = L;
  g.traverse((o) => { if (o.isMesh && !o.userData.outline) o.castShadow = true; });
  return g;
}

// 걷기·숨쉬기·눈 깜빡이기
export function animateBody(g, moving, dt, t) {
  const p = g.userData.parts;
  if (!p) return;
  const u = g.userData;
  u.walk = moving ? (u.walk || 0) + dt * 11 : (u.walk || 0) * Math.max(0, 1 - dt * 10);
  const s = Math.sin(u.walk);
  p.legs[0].rotation.x = s * 0.6; p.legs[1].rotation.x = -s * 0.6;
  p.arms[0].rotation.x = -s * 0.7; p.arms[1].rotation.x = s * 0.7;
  const bob = moving ? Math.abs(s) * 0.06 : Math.sin(t * 2.2) * 0.015;
  p.head.position.y = 1.42 + bob;
  p.head.rotation.z = moving ? s * 0.04 : Math.sin(t * 1.3) * 0.03;
  // 눈 깜빡
  u.blink = (u.blink ?? Math.random() * 3) - dt;
  const closed = u.blink < 0.12;
  if (u.blink < 0) u.blink = 2 + Math.random() * 3;
  p.eyes.forEach((e, i) => { if (i % 2 === 0) e.scale.y = closed ? 0.15 : 1.3; else e.visible = !closed; });
  if (p.wings) p.wings.children.forEach((w, i) => { w.rotation.y = Math.sin(t * (moving ? 14 : 4) + i) * 0.25 * (w.position.x > 0 ? 1 : -1); });
  if (p.balloon) p.balloon.position.y = 2.1 + Math.sin(t * 2) * 0.06;
  if (p.cape) p.cape.rotation.x = moving ? -0.25 - Math.abs(s) * 0.1 : -0.05;
  if (p.star) p.star.rotation.y += dt * 3;
}
