// 꼬마 탐험대 공원의 3D 세상
// - 꼬불길이 난 마을: 가운데 분수 광장, 건물 9채, 숲·연못·밭, 북쪽 언덕의 열기구
// - 건물 문으로 들어가면 그 건물 안 놀이방(동물 친구·보물 상자 3개·열쇠)으로 순간이동
// - 열기구 탈출장: 상자 4개에서 비밀번호 숫자를 찾아 열기구를 타고 날아간다
// 모든 장소를 한 장면 안에 멀리 떨어뜨려 두어서, 같은 구역에 있는 친구만 화면에 보인다.
import { THREE, toon, part, at, sph, cap, cyl, box, OUTLINE } from './toon.js';
import { drawChar, loadChars, charsReady, cleanLook, jobEmoji, drawPet, CW, CH } from './chars.js';
import { buildBuilding, texMat, windowAt, doorAt, emblem } from './buildings.js';
import { SUBJECTS, SUBJECT, STAMPS_TO_FLY } from './content.js';
import { ISLANDS, ISLAND, BRIDGES, SLOTS, LOTS, ROADS, walkable, islandAt, shoreR, shorePoints } from './islands.js';

// ---------- 장소 ----------
export const AREAS = {
  plaza: { cx: 0, cz: 0, hw: 132, hd: 100, cam: [0, 21, 21], spec: [0, 64, 56], follow: 1, ahead: 3 },
  balloon: { cx: -900, cz: 0, hw: 13, hd: 9, cam: [0, 16, 15], spec: [0, 21, 19], follow: 0.45 },
};
SUBJECTS.forEach((s, i) => { AREAS[`zone:${s.id}`] = { cx: 900 + i * 80, cz: 0, hw: 12, hd: 8, cam: [0, 15, 15], spec: [0, 19, 18], follow: 0.35, subj: s.id }; });
export const PLAZA_SPAWN = { x: 1.5, z: 9.5 };

// ---------- 섬 마을 배치 (islands.js) ----------
// 새 건물을 더할 때: content.js 의 SUBJECTS 에 한 줄(island 포함), islands.js 의 SLOTS 에 자리(빈 땅 하나를 옮겨 쓰기),
// INTERIOR 에 안 꾸밈, buildings.js 에 생김새.
const BLD = Object.fromEntries(Object.entries(SLOTS).map(([k, [x, z]]) => [k, [x, z]]));
const BALLOON_HILL = { x: -11, z: -8.5 };
const onBridgeNear = (x, z) => BRIDGES.some(({ box: [x0, z0, x1, z1] }) => x > x0 - 4 && x < x1 + 4 && z > z0 - 4 && z < z1 + 4);
function smoothPath(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 0.1) { const t2 = t * t; const t3 = t2 * t; out.push([0, 1].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// 늘 같은 마을이 나오도록 정해진 순서의 "랜덤"
function seeded(seed) { let x = seed; return () => ((x = (x * 16807) % 2147483647) / 2147483647); }

// 건물 이름표 높이 (마을에서 / 마을 전체 보기에서)
const SIGN_H = 1.5; const SIGN_FAR_H = 3.4;
const FONT = '"Jua", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const BROWN = '#5b3a1e';
const CREAM = '#fff8ea';

// ---------- 건물 안 꾸밈 (과목마다) ----------
// w: 벽지, wood: 판자, trim: 몰딩, floor: 마루, rug: 깔개, board: 안내판, curtain: 커튼, props: 가구
const shelf = (W, area, x, z, w = 3, colors = ['#e8574d', '#3c8dde', '#f2a516', '#2bab6b', '#c56cf0']) => {
  W.P(box(w, 3.2, 0.9), '#8a5a34', x, 1.6, z);
  for (let r = 0; r < 3; r++) { W.P(box(w - 0.2, 0.1, 0.8), '#6b4226', x, 0.6 + r * 1.0, z + 0.05, { line: false }); for (let i = 0; i < Math.floor(w / 0.36); i++) W.P(box(0.28, 0.7, 0.6), colors[(i + r) % colors.length], x - w / 2 + 0.3 + i * 0.36, 1.0 + r * 1.0, z + 0.1, { line: false }); }
  W.addObstacle(area, { box: [x - w / 2 - 0.2, z - 0.6, x + w / 2 + 0.2, z + 0.6] });
};
const table = (W, area, x, z, w = 2.4, d = 1.4, c = '#c98a52') => { W.P(box(w, 0.15, d), c, x, 1.0, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) W.P(box(0.15, 1.0, 0.15), '#7a4a24', x + sx * (w / 2 - 0.2), 0.5, z + sz * (d / 2 - 0.2), { t: 0.02 }); W.addObstacle(area, { box: [x - w / 2 - 0.2, z - d / 2 - 0.2, x + w / 2 + 0.2, z + d / 2 + 0.2] }); };
const plant = (W, area, x, z) => { W.P(cyl(0.45, 0.35, 0.8, 12), '#c0603d', x, 0.4, z); W.P(sph(0.7, 10, 8), '#4caf50', x, 1.3, z); W.P(sph(0.45, 10, 8), '#66bb6a', x + 0.3, 1.8, z); W.addObstacle(area, { x, z, r: 0.6 }); };
const poster = (W, x, y, z, emoji, bg) => { W.P(box(1.6, 1.6, 0.08), bg, x, y, z, { t: 0.02 }); const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 64, 72); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: t, transparent: true })); pl.position.set(x, y, z + 0.06); W.add(pl); };
const INTERIOR = {
  kor: { wall: '#f6ead2', wood: '#a8743e', trim: '#6b4226', floor: '#c98a52', rug: '#e8a598', board: '#2f5d46', curtain: '#e8574d', props: (W, area, a, L, R, B) => {
    shelf(W, area, L + 2.2, B + 0.7, 3); shelf(W, area, L + 5.4, B + 0.7, 2.4); shelf(W, area, R - 2.2, B + 0.7, 3);
    table(W, area, R - 3.2, a.cz + 3.6, 2.6, 1.6); W.P(box(0.9, 0.12, 1.1), '#ffffff', R - 3.4, 1.15, a.cz + 3.6, { t: 0.01 });
    plant(W, area, L + 1.2, a.cz + 6.5); poster(W, R - 0.25, 3.2, a.cz - 2, '📖', '#fff8ea');
  } },
  eng: { wall: '#fff0f5', wood: '#ffb3c7', trim: '#5aa9f0', floor: '#e6c38f', rug: '#cfe8ff', board: '#2f5d46', curtain: '#ffd23f', props: (W, area, a, L, R) => {
    ['A', 'B', 'C', 'D'].forEach((ch, i) => { W.P(box(0.9, 0.9, 0.9), ['#ff6b8b', '#ffd23f', '#1dd1a1', '#48b4e8'][i], L + 1.8 + (i % 2) * 1.0, 0.45 + Math.floor(i / 2) * 0.9, a.cz + 5.2); emblem(W, L + 1.8 + (i % 2) * 1.0, 0.45 + Math.floor(i / 2) * 0.9, a.cz + 5.66, ch, 0.7); });
    W.addObstacle(area, { box: [L + 1, a.cz + 4.5, L + 3.4, a.cz + 6] });
    for (const [x, c] of [[R - 2, '#ff9f43'], [R - 3.6, '#c56cf0']]) { W.P(sph(0.8, 14, 10), c, x, 0.55, a.cz + 4.6); W.addObstacle(area, { x, z: a.cz + 4.6, r: 0.8 }); }
    poster(W, L + 0.25 + 0.05, 3.2, a.cz - 2, '🔤', '#fff8ea'); poster(W, R - 0.3, 3.2, a.cz - 2, '🌍', '#fff8ea');
    plant(W, area, R - 1.2, a.cz + 6.5);
  } },
  math: { wall: '#fff2c4', wood: '#d9a066', trim: '#c0603d', floor: '#c9a16b', rug: '#ff8a7a', board: '#2f5d46', curtain: '#3c8dde', props: (W, area, a, L, R, B) => {
    // 왕좌
    W.P(box(1.8, 0.6, 1.4), '#c0603d', R - 2.4, 0.3, B + 1.4); W.P(box(1.8, 2.6, 0.3), '#e53935', R - 2.4, 1.9, B + 0.8); W.P(sph(0.25, 8, 6), '#ffd23f', R - 3.2, 3.3, B + 0.8); W.P(sph(0.25, 8, 6), '#ffd23f', R - 1.6, 3.3, B + 0.8);
    W.addObstacle(area, { box: [R - 3.4, B, R - 1.4, B + 2.2] });
    // 주판
    W.P(box(2.6, 0.15, 0.15), '#7a4a24', L + 2.6, 2.4, a.cz + 5); W.P(box(2.6, 0.15, 0.15), '#7a4a24', L + 2.6, 0.6, a.cz + 5); for (const sx of [-1, 1]) W.P(box(0.15, 1.95, 0.15), '#7a4a24', L + 2.6 + sx * 1.25, 1.5, a.cz + 5);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) W.P(sph(0.16, 8, 6), ['#ff6b8b', '#ffd23f', '#48b4e8', '#1dd1a1'][r], L + 1.7 + i * 0.4 + (r % 2) * 0.2, 0.95 + r * 0.42, a.cz + 5, { t: 0.01 });
    W.addObstacle(area, { box: [L + 1.2, a.cz + 4.5, L + 4, a.cz + 5.5] });
    for (const [x, g2, c] of [[L + 2.2, new THREE.ConeGeometry(0.7, 1.4, 4), '#e8574d'], [L + 4, sph(0.6, 14, 10), '#3c8dde'], [L + 5.6, box(1, 1, 1), '#f2a516']]) { W.P(g2, c, x, 0.65, B + 1.2); W.addObstacle(area, { x, z: B + 1.2, r: 0.7 }); }
    poster(W, R - 0.3, 3.2, a.cz + 2, '🔢', '#fff8ea');
  } },
  soc: { wall: '#e6f4e6', wood: '#8d6e4a', trim: '#2f7d55', floor: '#b8946a', rug: '#9fdcb4', board: '#2f5d46', curtain: '#ffd23f', props: (W, area, a, L, R, B) => {
    // 표 사는 곳
    W.P(box(4, 1.3, 1.2), '#2f7d55', R - 3, 0.65, B + 1.2); W.P(box(4.2, 0.15, 1.4), '#d9a066', R - 3, 1.35, B + 1.2); W.addObstacle(area, { box: [R - 5.2, B, R - 0.8, B + 2] });
    W.P(cyl(0.12, 0.2, 1.4, 8), '#8d5a34', L + 2.2, 0.7, B + 1.6); W.P(sph(0.8, 18, 14), '#48b4e8', L + 2.2, 2.1, B + 1.6); W.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.82, 18, 14, 0.4, 1.6, 0.5, 1.3), toon('#5cbf3c')), L + 2.2, 2.1, B + 1.6)); W.addObstacle(area, { x: L + 2.2, z: B + 1.6, r: 0.9 });
    for (const x of [R - 2.4, R - 4.8]) { W.P(box(2.2, 0.15, 0.8), '#c98a52', x, 0.75, a.cz + 5.4); W.P(box(2.2, 0.8, 0.12), '#c98a52', x, 1.2, a.cz + 5.8); W.addObstacle(area, { box: [x - 1.2, a.cz + 4.9, x + 1.2, a.cz + 6] }); }
    W.P(box(0.9, 0.7, 0.4), '#a8743e', L + 2.4, 0.35, a.cz + 5.6); W.P(box(0.7, 0.55, 0.35), '#ff6b8b', L + 3.3, 0.3, a.cz + 5.8);
    poster(W, R - 0.3, 3.2, a.cz + 2, '🗺️', '#fff8ea');
  } },
  sci: { wall: '#e6ecff', wood: '#7f6cf0', trim: '#3b3b8f', floor: '#9a8cc0', rug: '#b9b1ff', board: '#22264a', curtain: '#5b6cff', props: (W, area, a, L, R, B) => {
    table(W, area, L + 3.2, B + 1.4, 3.6, 1.4, '#e0e0e0'); W.P(cyl(0.18, 0.4, 0.7, 12), '#7fe0c4', L + 2.2, 1.45, B + 1.4); W.P(cyl(0.14, 0.14, 0.8, 10), '#ff9ec7', L + 3.2, 1.5, B + 1.4); W.P(cyl(0.22, 0.22, 0.55, 10), '#ffe27a', L + 4.2, 1.38, B + 1.4);
    const tel = W.P(cyl(0.35, 0.5, 2.6, 14), '#d6d6e6', R - 2.4, 2.0, a.cz + 4.6); tel.rotation.x = -0.7; W.P(cyl(0.08, 0.08, 1.6, 6), '#3b3b4f', R - 2.4, 0.8, a.cz + 4.9); W.addObstacle(area, { x: R - 2.4, z: a.cz + 4.7, r: 0.9 });
    // 천장에 매단 행성
    [['#ff9346', 0.6, -4], ['#48b4e8', 0.5, -1], ['#ffd23f', 0.9, 2.5], ['#e8574d', 0.4, 5]].forEach(([c, r, dx]) => { W.P(sph(r, 14, 10), c, a.cx + dx, 4.4, B + 2.6); W.add(at(new THREE.Mesh(cyl(0.01, 0.01, 0.8, 4), toon(OUTLINE)), a.cx + dx, 5.0, B + 2.6)); });
    poster(W, R - 0.3, 3.2, a.cz - 1, '🔬', '#fff8ea');
  } },
  code: { wall: '#e9e6ff', wood: '#6c63b0', trim: '#3c5bd6', floor: '#9fa3b8', rug: '#b9b1ff', board: '#1f2a44', curtain: '#5fd38d', props: (W, area, a, L, R, B) => {
    for (const x of [L + 2.2, L + 5]) { table(W, area, x, B + 1.4, 2.4, 1.3, '#c9c9d6'); W.P(box(1.4, 0.95, 0.12), '#222233', x, 1.65, B + 1.2); W.P(box(1.25, 0.8, 0.13), '#5fd38d', x, 1.65, B + 1.21, { line: false }); }
    // 컨베이어
    W.P(box(5, 0.8, 1.2), '#3b3b4f', R - 3.4, 0.4, a.cz + 5.2); for (let i = 0; i < 4; i++) W.P(box(0.8, 0.8, 0.8), ['#ff6b8b', '#ffd23f', '#48b4e8', '#1dd1a1'][i], R - 5.2 + i * 1.2, 1.2, a.cz + 5.2, { t: 0.02 }); W.addObstacle(area, { box: [R - 6, a.cz + 4.5, R - 0.8, a.cz + 6] });
    const rb = new THREE.Group(); rb.position.set(R - 1.8, 0, B + 1.6); W.add(rb); rb.add(at(part(box(1.0, 1.1, 0.7), '#c9c9d6'), 0, 0.6, 0)); rb.add(at(part(box(0.9, 0.75, 0.75), '#e6e6ee'), 0, 1.55, 0)); for (const sx of [-1, 1]) rb.add(at(new THREE.Mesh(sph(0.11, 8, 6), toon('#5fd38d')), sx * 0.2, 1.6, 0.38)); rb.add(at(part(sph(0.12, 8, 6), '#ff6b8b'), 0, 2.1, 0)); W.addObstacle(area, { x: R - 1.8, z: B + 1.6, r: 0.8 });
    poster(W, R - 0.3, 3.2, a.cz + 2, '⚙️', '#fff8ea');
  } },
  music: { wall: '#ffe4f1', wood: '#c98a52', trim: '#d63a6e', floor: '#c98a52', rug: '#ffb3d1', board: '#3b1f2a', curtain: '#d63a6e', props: (W, area, a, L, R, B) => {
    W.P(box(6, 0.5, 2.6), '#a8743e', L + 4, 0.25, B + 1.5); W.addObstacle(area, { box: [L + 0.8, B, L + 7.2, B + 2.9] });
    W.P(box(2, 1, 1), '#1f1f1f', L + 3, 1.0, B + 1.2); W.add(at(new THREE.Mesh(box(1.9, 0.05, 0.3), toon('#ffffff')), L + 3, 1.52, B + 1.6));
    W.P(cyl(0.55, 0.55, 0.6, 16), '#ff9f43', L + 5.4, 0.8, B + 1.2); W.P(cyl(0.4, 0.4, 0.5, 16), '#48b4e8', L + 6.3, 0.75, B + 1.8);
    for (const x of [R - 1.6, R - 3]) { W.P(box(1, 1.8, 0.9), '#2b2b3a', x, 0.9, B + 1.2); W.P(cyl(0.3, 0.3, 0.1, 14), '#888', x, 1.2, B + 1.68).rotation.x = Math.PI / 2; W.addObstacle(area, { x, z: B + 1.2, r: 0.7 }); }
    poster(W, R - 0.3, 3.2, a.cz + 2, '🎵', '#fff8ea'); poster(W, L + 0.3, 3.2, a.cz - 1.5, '🎶', '#fff8ea');
  } },
  art: { wall: '#fff3e0', wood: '#d9a066', trim: '#ff9346', floor: '#d9b48a', rug: '#ffd0a8', board: '#2f5d46', curtain: '#48b4e8', props: (W, area, a, L, R, B) => {
    [[L + 2.2, B + 1.6, '#fdd835'], [L + 4.4, B + 1.4, '#81d4fa'], [R - 2.4, a.cz + 4.6, '#f48fb1']].forEach(([x, z, c]) => {
      for (const sx of [-1, 1]) { const l = W.P(box(0.1, 2.2, 0.1), '#8d5a34', x + sx * 0.45, 1.1, z); l.rotation.z = sx * 0.12; }
      W.P(box(1.3, 1.0, 0.08), c, x, 1.6, z + 0.08); W.add(at(new THREE.Mesh(sph(0.22, 8, 6), toon('#ff6b8b')), x - 0.2, 1.7, z + 0.15)); W.addObstacle(area, { x, z, r: 0.7 });
    });
    table(W, area, R - 2.6, B + 1.4, 2.6, 1.3); ['#e53935', '#1e88e5', '#fdd835', '#43a047'].forEach((c, i) => W.P(cyl(0.22, 0.22, 0.4, 10), c, R - 3.6 + i * 0.6, 1.28, B + 1.4, { t: 0.01 }));
    ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'].forEach((c, i) => W.P(box(0.9, 0.9, 0.06), c, L + 0.25, 2.2 + Math.floor(i / 3) * 1.1, a.cz - 1 + (i % 3) * 1.1, { t: 0.01 }));
  } },
  pe: { wall: '#e8f7dd', wood: '#7a9a5a', trim: '#5cbf3c', floor: '#d9b48a', rug: '#ffcf8a', board: '#2f5d46', curtain: '#ff9f43', props: (W, area, a, L, R, B) => {
    W.P(cyl(0.1, 0.1, 3.6, 8), '#888', R - 2, 1.8, B + 0.9); W.P(box(1.5, 1.1, 0.1), '#ffffff', R - 2, 3.5, B + 0.95); const hp = W.P(new THREE.TorusGeometry(0.35, 0.05, 8, 20), '#ff5722', R - 2, 3.0, B + 1.4, { t: 0.01 }); hp.rotation.x = Math.PI / 2; W.addObstacle(area, { x: R - 2, z: B + 0.9, r: 0.5 });
    for (let i = 0; i < 3; i++) W.P(box(2.2, 0.2, 1.4), ['#3c8dde', '#ff6b8b', '#ffd23f'][i], L + 2.6, 0.1 + i * 0.2, a.cz + 5.0 - i * 0.05);
    W.addObstacle(area, { box: [L + 1.3, a.cz + 4.2, L + 3.9, a.cz + 5.8] });
    for (const [x, z, c] of [[R - 3.6, a.cz + 5, '#ff7043'], [R - 2.6, a.cz + 5.6, '#ffffff'], [R - 1.8, a.cz + 4.8, '#ffd23f']]) W.P(sph(0.32, 14, 10), c, x, 0.32, z);
    // 벽 암벽 손잡이
    for (let i = 0; i < 12; i++) W.P(sph(0.16, 6, 5), ['#ff6b8b', '#ffd23f', '#48b4e8', '#1dd1a1'][i % 4], L + 1.5 + (i % 4) * 0.9, 1.6 + Math.floor(i / 4) * 0.9, B + 0.15, { t: 0.01 });
  } },
  turtle: { wall: '#e9fbef', wood: '#7cc59a', trim: '#2f8f5a', floor: '#d9b48a', rug: '#c8f0d4', board: '#1f3b2d', curtain: '#ffd23f', props: (W, area, a, L, R, B) => {
    // 벽에 걸린 거북이 그림들
    const pics = [['#ffffff', 0], ['#fff3c4', 1], ['#e6f4ff', 2]];
    pics.forEach(([bg, i]) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 128, 128); x.strokeStyle = ['#2f8f5a', '#e8574d', '#3c8dde'][i]; x.lineWidth = 6; x.beginPath(); const n = [4, 6, 5][i]; const turn = [Math.PI / 2, Math.PI / 3, Math.PI * 0.8][i]; let px = 40; let py = 96; let ang = 0; x.moveTo(px, py); for (let k = 0; k < n; k++) { px += Math.cos(ang) * (i === 2 ? 70 : 48); py += Math.sin(ang) * (i === 2 ? 70 : 48); x.lineTo(px, py); ang -= turn; } x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; W.P(box(1.5, 1.5, 0.08), '#8d5a34', L + 2 + i * 2.2, 2.8, B + 0.12); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: t })); pl.position.set(L + 2 + i * 2.2, 2.8, B + 0.18); W.add(pl); });
    // 큰 종이와 크레파스 탁자
    table(W, area, R - 3, a.cz + 4.6, 2.8, 1.6); W.P(box(2.2, 0.04, 1.2), '#ffffff', R - 3, 1.1, a.cz + 4.6, { line: false });
    ['#e53935', '#1e88e5', '#fdd835', '#43a047'].forEach((c, i) => { const cr = W.P(cyl(0.07, 0.07, 0.5, 8), c, R - 3.8 + i * 0.4, 1.15, a.cz + 4.2, { t: 0.01 }); cr.rotation.z = Math.PI / 2; });
    // 거북이 인형
    W.P(new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#3f9b5a', L + 2.2, 0.15, a.cz + 6, { t: 0.02 }); W.P(sph(0.3, 12, 10), '#9be3a9', L + 2.2, 0.45, a.cz + 6.8); W.addObstacle(area, { x: L + 2.2, z: a.cz + 6, r: 0.9 });
    poster(W, R - 0.3, 3.2, a.cz + 1.5, '🐢', '#fff8ea'); poster(W, L + 0.3, 3.2, a.cz - 0.4, '📐', '#fff8ea');
  } },
  bug: { wall: '#f4ead8', wood: '#8d6e63', trim: '#4f5d75', floor: '#b08968', rug: '#d7c4a3', board: '#22303c', curtain: '#2f6e4f', props: (W, area, a, L, R, B) => {
    // 단서 게시판 (빨간 실로 이은 쪽지들)
    W.P(box(4.2, 2.4, 0.12), '#c98a52', L + 3.4, 2.6, B + 0.12);
    const notes = [[-1.4, 0.6], [0.2, 0.8], [1.5, 0.3], [-0.8, -0.6], [0.9, -0.7]];
    notes.forEach(([dx, dy], i) => W.P(box(0.7, 0.5, 0.04), ['#fff3b0', '#ffffff', '#d6ecff', '#ffd6e0', '#e2ffd6'][i], L + 3.4 + dx, 2.6 + dy, B + 0.2, { line: false }));
    for (let i = 0; i < notes.length - 1; i++) { const [x1, y1] = notes[i]; const [x2, y2] = notes[i + 1]; const len = Math.hypot(x2 - x1, y2 - y1); const r = W.P(box(len, 0.03, 0.02), '#e53935', L + 3.4 + (x1 + x2) / 2, 2.6 + (y1 + y2) / 2, B + 0.24, { line: false }); r.rotation.z = Math.atan2(y2 - y1, x2 - x1); }
    // 탐정 책상: 돋보기와 노트북
    table(W, area, R - 3, a.cz + 4.6, 2.8, 1.6, '#8d6e63'); W.P(box(1.0, 0.06, 0.7), '#3b3b4f', R - 3.4, 1.12, a.cz + 4.6); W.P(box(1.0, 0.65, 0.06), '#3b3b4f', R - 3.4, 1.45, a.cz + 4.27); W.P(box(0.9, 0.55, 0.02), '#5fd38d', R - 3.4, 1.45, a.cz + 4.31, { line: false });
    const lens = W.P(new THREE.TorusGeometry(0.28, 0.06, 8, 18), '#ffd23f', R - 2.2, 1.15, a.cz + 4.7, { t: 0.01 }); lens.rotation.x = Math.PI / 2;
    // 옷걸이: 탐정 모자와 망토
    W.P(cyl(0.08, 0.1, 2.4, 8), '#5b4636', L + 1.4, 1.2, a.cz + 6); W.P(cyl(0.45, 0.45, 0.12, 14), '#8d6e63', L + 1.4, 2.4, a.cz + 6); W.P(cyl(0.28, 0.32, 0.35, 14), '#8d6e63', L + 1.4, 2.6, a.cz + 6); W.P(box(0.8, 1.2, 0.2), '#a1887f', L + 1.4, 1.6, a.cz + 6.15);
    W.addObstacle(area, { x: L + 1.4, z: a.cz + 6, r: 0.6 });
    poster(W, R - 0.3, 3.2, a.cz + 1.5, '🔍', '#fff8ea'); poster(W, L + 0.3, 3.2, a.cz - 0.4, '🐞', '#fff8ea');
  } },
  job: { wall: '#fff1f6', wood: '#c98a52', trim: '#6a5ae0', floor: '#e6c38f', rug: '#ffe08a', board: '#2f2a5a', curtain: '#c56cf0', props: (W, area, a, L, R, B) => {
    // 직업 카드 벽 (12장)
    const jobs = [['👩‍⚕️', '#ff8a7a'], ['🧑‍🍳', '#f2a516'], ['🐶', '#5cbf3c'], ['👮', '#3c8dde'], ['📰', '#8e7cc3'], ['🏗️', '#c98a52'], ['🌦️', '#2bb5c8'], ['✈️', '#48b4e8'], ['🎨', '#ff6b8b'], ['🎼', '#f06aa8'], ['🤖', '#7b6cf0'], ['🚁', '#1ea7a0']];
    jobs.forEach(([e, c], i) => { const x = L + 1.4 + (i % 6) * 1.05; const y = 3.3 - Math.floor(i / 6) * 1.15; W.P(box(0.9, 1.0, 0.08), c, x, y, B + 0.1, { t: 0.015 }); W.P(box(0.74, 0.84, 0.02), '#ffffff', x, y, B + 0.15, { line: false }); const cv = document.createElement('canvas'); cv.width = cv.height = 96; const g2 = cv.getContext('2d'); g2.font = '70px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(e, 48, 54); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshBasicMaterial({ map: t, transparent: true })); pl.position.set(x, y, B + 0.17); W.add(pl); });
    // 변신 탈의실 (줄무늬 커튼)
    const cx = L + 2.8; const cz = a.cz + 4.6;
    for (const s of [-1, 1]) W.P(box(0.15, 3.2, 0.15), '#7a4a24', cx + s * 1.3, 1.6, cz + 0.9);
    W.P(box(2.8, 0.15, 0.15), '#7a4a24', cx, 3.2, cz + 0.9);
    for (let i = 0; i < 6; i++) W.P(box(0.42, 2.8, 0.1), i % 2 ? '#d98ff5' : '#c56cf0', cx - 1.05 + i * 0.42, 1.75, cz + 0.9, { t: 0.01 });
    W.addObstacle(area, { box: [cx - 1.5, cz + 0.6, cx + 1.5, cz + 1.2] });
    // 옷걸이에 걸린 직업 옷
    W.P(cyl(0.05, 0.05, 2.6, 8), '#8d6e63', R - 1.2, 1.6, a.cz + 5.2).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) W.P(box(0.1, 2.0, 0.1), '#8d6e63', R - 1.2 + s * 1.3, 1.0, a.cz + 5.2);
    ['#ffffff', '#2b4f8f', '#ffd23f', '#e8322d'].forEach((c, i) => W.P(box(0.5, 0.8, 0.12), c, R - 2.1 + i * 0.6, 1.1, a.cz + 5.2, { t: 0.01 }));
    W.addObstacle(area, { box: [R - 2.7, a.cz + 4.8, R + 0.2, a.cz + 5.6] });
    poster(W, L + 0.3, 3.2, a.cz + 1.5, '🌟', '#fff8ea'); poster(W, R - 0.3, 3.2, a.cz - 0.4, '🏢', '#fff8ea');
  } },
  fire: { wall: '#fff0ec', wood: '#b5523b', trim: '#e8322d', floor: '#c98a52', rug: '#ffd0c8', board: '#3b1f1f', curtain: '#ffd23f', props: (W, area, a, L, R, B) => {
    // 소방관 옷걸이: 헬멧과 외투
    W.P(box(4.2, 0.2, 0.3), '#7a4a24', L + 3.2, 3.0, B + 0.3);
    for (let i = 0; i < 3; i++) { const x = L + 1.8 + i * 1.4; W.P(box(0.9, 1.5, 0.3), i === 1 ? '#ffd23f' : '#e8322d', x, 2.1, B + 0.4, { t: 0.02 }); const hm = W.P(new THREE.SphereGeometry(0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#e8322d', x, 3.3, B + 0.45, { t: 0.02 }); void hm; W.P(cyl(0.55, 0.55, 0.06, 16), '#e8322d', x, 3.3, B + 0.45, { t: 0.01 }); }
    W.addObstacle(area, { box: [L + 1, B, L + 5.4, B + 0.9] });
    // 소화기 줄
    for (let i = 0; i < 3; i++) { const x = R - 4.6 + i * 0.9; W.P(cyl(0.28, 0.28, 1.1, 14), '#e8322d', x, 0.55, B + 0.6); W.P(cyl(0.12, 0.12, 0.25, 8), '#2b2b3a', x, 1.2, B + 0.6); const hz = W.P(cyl(0.05, 0.05, 0.6, 6), '#2b2b3a', x + 0.2, 0.95, B + 0.75, { line: false }); hz.rotation.z = 0.5; }
    W.addObstacle(area, { box: [R - 5.1, B, R - 2.5, B + 1.0] });
    // 미끄럼 기둥
    W.P(cyl(0.12, 0.12, 6, 10), '#d8d8e0', R - 1.8, 3, a.cz + 4.6); W.P(cyl(0.8, 0.8, 0.12, 20), '#ffd23f', R - 1.8, 0.06, a.cz + 4.6, { t: 0.01 }); W.addObstacle(area, { x: R - 1.8, z: a.cz + 4.6, r: 0.5 });
    // 감은 호스
    const hs = W.P(new THREE.TorusGeometry(0.6, 0.2, 10, 24), '#ffd23f', R - 3.6, 0.7, a.cz + 5.4, { t: 0.02 }); hs.rotation.y = 0.3; W.addObstacle(area, { x: R - 3.6, z: a.cz + 5.4, r: 0.8 });
    // 비상구 표시 (초록)
    W.P(box(1.4, 0.6, 0.1), '#2bab6b', L + 0.25, 3.6, a.cz - 2.6, { t: 0.02 }).rotation.y = Math.PI / 2;
    poster(W, R - 0.3, 3.2, a.cz + 1.5, '🧯', '#fff8ea'); poster(W, L + 0.3, 3.2, a.cz - 0.4, '🚒', '#fff8ea');
  } },
  market: { wall: '#fff8dc', wood: '#d9a066', trim: '#f2a516', floor: '#d9b48a', rug: '#ffe6a8', board: '#2f5d46', curtain: '#ff6b8b', props: (W, area, a, L, R, B) => {
    // 물건 진열대
    shelf(W, area, L + 2.4, B + 0.7, 3.2, ['#ff6b6b', '#ffd23f', '#48b4e8', '#5cbf3c', '#ff9f43']); shelf(W, area, L + 6.0, B + 0.7, 3.2, ['#ffffff', '#c56cf0', '#ff9f43', '#48b4e8']);
    // 과일 상자
    for (let c = 0; c < 3; c++) { W.P(box(1.0, 0.5, 0.8), '#d9a066', R - 4.6 + c * 1.15, 0.25, B + 0.9); for (let k = 0; k < 4; k++) W.P(sph(0.2, 8, 6), ['#ff5c5c', '#ffa63f', '#ffe14a'][c], R - 4.85 + c * 1.15 + (k % 2) * 0.45, 0.65, B + 0.7 + Math.floor(k / 2) * 0.4, { line: false }); }
    W.addObstacle(area, { box: [R - 5.3, B, R - 1.6, B + 1.5] });
    // 계산대와 금전 등록기
    W.P(box(3.0, 1.2, 1.2), '#c0603d', R - 2.4, 0.6, a.cz + 4.6); W.P(box(0.9, 0.5, 0.6), '#3b3b4f', R - 1.8, 1.45, a.cz + 4.6); W.P(box(0.7, 0.3, 0.05), '#5fd38d', R - 1.8, 1.6, a.cz + 4.29, { line: false });
    W.addObstacle(area, { box: [R - 4.1, a.cz + 3.8, R - 0.8, a.cz + 5.4] });
    // 장바구니 수레
    W.P(box(1.0, 0.7, 1.4), '#48b4e8', L + 2.0, 0.75, a.cz + 6.0); for (const sx of [-0.4, 0.4]) for (const sz of [-0.55, 0.55]) W.P(sph(0.12, 8, 6), '#2b2b3a', L + 2.0 + sx, 0.15, a.cz + 6.0 + sz, { line: false }); W.addObstacle(area, { x: L + 2.0, z: a.cz + 6.0, r: 0.9 });
    poster(W, R - 0.3, 3.2, a.cz + 1.5, '💰', '#fff8ea'); poster(W, L + 0.3, 3.2, a.cz - 0.4, '🛒', '#fff8ea');
  } },
  post: { wall: '#ffeef3', wood: '#e8a0b4', trim: '#5aa9f0', floor: '#e6c38f', rug: '#ffd6e0', board: '#2f5d46', curtain: '#5aa9f0', props: (W, area, a, L, R, B) => {
    // 편지 칸칸이 벽
    W.P(box(4.6, 3.0, 0.7), '#c98a52', L + 3.4, 1.5, B + 0.45);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { W.P(box(0.62, 0.58, 0.1), '#7a4a24', L + 1.6 + c * 0.72, 0.5 + r * 0.7, B + 0.82, { line: false }); if ((r + c) % 3 !== 1) W.P(box(0.46, 0.3, 0.05), ['#ffffff', '#ffd6e0', '#d6ecff', '#fff3b0'][(r * 6 + c) % 4], L + 1.6 + c * 0.72, 0.5 + r * 0.7, B + 0.88, { line: false }); }
    W.addObstacle(area, { box: [L + 1, B, L + 5.8, B + 1.0] });
    // 창구와 저울
    W.P(box(3.0, 1.2, 1.2), '#5aa9f0', R - 2.4, 0.6, a.cz + 4.6); W.P(box(0.8, 0.12, 0.7), '#d8d8e0', R - 3.2, 1.3, a.cz + 4.6); W.P(box(0.5, 0.4, 0.5), '#c98a52', R - 3.2, 1.55, a.cz + 4.6);
    W.addObstacle(area, { box: [R - 4.1, a.cz + 3.8, R - 0.8, a.cz + 5.4] });
    // 빨간 우체통
    W.P(cyl(0.5, 0.5, 1.4, 18), '#e8322d', R - 2.0, 0.7, B + 1.0); W.P(new THREE.SphereGeometry(0.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#e8322d', R - 2.0, 1.4, B + 1.0); W.addObstacle(area, { x: R - 2.0, z: B + 1.0, r: 0.7 });
    // 소포 더미
    [[0, 0, 0.9, '#c98a52'], [0.1, 0.72, 0.6, '#e0a868']].forEach(([dx, y, s2, c]) => W.P(box(s2, s2 * 0.8, s2), c, L + 2.0 + dx, 0.4 * s2 + y, a.cz + 6.0)); W.addObstacle(area, { x: L + 2.0, z: a.cz + 6.0, r: 0.7 });
    poster(W, R - 0.3, 3.2, a.cz + 1.5, '💌', '#fff8ea'); poster(W, L + 0.3, 3.2, a.cz - 0.4, '😊', '#fff8ea');
  } },
};

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
  u.badge.position.y = CHAR_H + 0.72;
  av.add(u.badge);
}
export function emoteOn(av, emoji) {
  const u = av.userData;
  if (u.bubble) av.remove(u.bubble);
  u.bubble = makeSprite([emoji], 0.8, { size: 80, pad: 10, radius: 30 });
  u.bubble.position.y = CHAR_H + 1.2;
  u.bubbleT = 2.6;
  av.add(u.bubble);
}
// 2D 픽셀아트 캐릭터: 늘 카메라를 보는 그림(Sprite). 왼쪽으로 걸으면 좌우로 뒤집고, 멀어지면 뒷모습
const CHAR_H = 3.0; // 세상 속 키
function buildPaper(look) {
  const L = cleanLook(look);
  const mat = new THREE.SpriteMaterial({ transparent: true, alphaTest: 0.5, depthWrite: true });
  const sp = new THREE.Sprite(mat);
  sp.center.set(0.5, 1 / CH); sp.scale.set(CHAR_H * CW / CH, CHAR_H, 1);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#2b3a1e', transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; shadow.scale.set(1, 0.6, 1); shadow.userData.flat = true;
  const g = new THREE.Group(); g.add(sp, shadow);
  g.userData = { look: L, sprite: sp, view: '', tex: {}, walk: 0 };
  setPaperView(g, 'front');
  if (!charsReady()) loadChars().then(() => { g.userData.view = ''; setPaperView(g, 'front'); }).catch(() => {});
  return g;
}
function setPaperView(g, view) {
  const u = g.userData; if (u.view === view && u.tex[view]) return;
  if (!charsReady()) return;
  if (!u.tex[view]) { const c = drawChar(u.look, view); if (!c) return; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; u.tex[view] = t; }
  u.view = view; u.sprite.material.map = u.tex[view]; u.sprite.material.needsUpdate = true;
}
// 걷기: 통통 튀고, 카메라에서 본 방향으로 그림을 바꾼다
function animatePaper(g, root, moving, dt, t, camYaw) {
  const u = g.userData;
  u.walk = moving ? u.walk + dt * 11 : u.walk * Math.max(0, 1 - dt * 10);
  const s = Math.abs(Math.sin(u.walk));
  u.sprite.position.y = moving ? s * 0.12 : Math.sin(t * 2.2) * 0.02;
  u.sprite.scale.y = CHAR_H * (moving ? 1 - s * 0.03 : 1 + Math.sin(t * 2.2) * 0.008);
  u.sprite.scale.x = CHAR_H * CW / CH * (moving ? 1 + s * 0.02 : 1);
  // 바라보는 방향(root.rotation.y: 0 = 화면 앞쪽)을 카메라 기준으로
  let a = root.rotation.y - camYaw; a = Math.atan2(Math.sin(a), Math.cos(a));
  // 화면 안쪽으로 가면 뒷모습, 왼쪽으로 가면 그림을 뒤집고, 오른쪽으로 가면 되돌린다
  const sx = Math.sin(a); const cz = Math.cos(a);
  const view = cz < -0.55 ? (sx < -0.2 ? 'backL' : 'back') : sx < -0.35 ? 'sideL' : sx > 0.35 || cz > 0.55 ? 'front' : (u.view || 'front');
  setPaperView(g, view);
}
// 같이 다니는 친구: 픽셀아트 그림(Sprite), 발이 땅에 닿게
const PET_H = 1.15;
function buildPet(id) {
  const c = drawPet(id); if (!c) return null;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, alphaTest: 0.5 }));
  sp.center.set(0.5, 4 / c.height); sp.scale.set(PET_H * c.width / c.height, PET_H, 1);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), new THREE.MeshBasicMaterial({ color: '#2b3a1e', transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; shadow.scale.set(1, 0.6, 1); shadow.userData.flat = true;
  const g = new THREE.Group(); g.add(sp, shadow); g.userData.hop = 0;
  return g;
}
// 캐릭터 + 이름표 + 같이 다니는 친구
function makeCharacter(look, name, me) {
  const root = new THREE.Group();
  const body = buildPaper(look);
  root.add(body);
  const je = jobEmoji(body.userData.look.job);
  const lb = label(je ? `${je} ${name}` : name, me);
  lb.position.y = CHAR_H + 0.3;
  root.add(lb);
  root.userData = { body, label: lb, petId: body.userData.look.pet, bubble: null, bubbleT: 0 };
  return root;
}
// 그림은 바라보는 방향과 상관없이 늘 똑바로 (Sprite 는 부모의 돌기를 따르지 않는다)

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
    this.scene.fog = new THREE.Fog('#d9f2ff', 110, 260);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 400);
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
    this.view = 'normal'; this.onOverview = () => {};
    this.onZoom = () => {};

    this.buildVillage();
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
  // ---------- 섬 마을의 땅: 섬(잔디·모래톱)과 길만 그리고, 바다는 비워 둔다 ----------
  villageGround() {
    const S = 276; const TEX = 2048; const k = TEX / S; const rand = seeded(11);
    const c = document.createElement('canvas'); c.width = c.height = TEX; const g = c.getContext('2d');
    const P2 = (x, z) => [(x + S / 2) * k, (z + S / 2) * k];
    const poly = (pts) => { g.beginPath(); pts.forEach(([x, z], i) => { const [px, pz] = P2(x, z); if (i) g.lineTo(px, pz); else g.moveTo(px, pz); }); g.closePath(); };
    // 모래톱 → 잔디
    for (const isl of ISLANDS) { poly(shorePoints(isl, 140, 1.0)); g.fillStyle = '#f2dca6'; g.fill(); }
    for (const isl of ISLANDS) { poly(shorePoints(isl, 140, 0.965)); g.fillStyle = '#8fce5a'; g.fill(); }
    // 잔디 무늬 (섬 안에만)
    g.save(); g.beginPath(); for (const isl of ISLANDS) shorePoints(isl, 140, 0.965).forEach(([x, z], i) => { const [px, pz] = P2(x, z); if (i) g.lineTo(px, pz); else g.moveTo(px, pz); }); g.clip('nonzero');
    for (let i = 0; i < 30000; i++) { g.fillStyle = ['#84c452', '#9ad866', '#7dbd4b', '#a3df70'][i % 4]; g.fillRect(rand() * TEX, rand() * TEX, 3 + rand() * 4, 3 + rand() * 4); }
    g.restore();
    // 길: 큰길 + 건물·빈 땅 문 앞에서 큰길까지
    const roads = ROADS.map(([pts, w]) => [smoothPath(pts), w]);
    for (const [id, [bx, bz, rz]] of Object.entries(SLOTS)) { const d = this.doorOffset[id]; if (d) roads.push([[[bx + d[0], bz + d[1] - 1.2], [bx + d[0], rz]], 2.4]); }
    for (const lot of LOTS) roads.push([[[lot.x, lot.z + 4], [lot.x, lot.road]], 2.4]);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [col, dw, mul] of [['#c99a5c', 0.9, 1], ['#e3b778', 0, 1], ['#ebc58b', 0, 0.5]]) {
      for (const [pts, w] of roads) { g.strokeStyle = col; g.lineWidth = (w * mul + dw) * k; g.beginPath(); pts.forEach(([x, z], i) => { const [px, pz] = P2(x, z); if (i) g.lineTo(px, pz); else g.moveTo(px, pz); }); g.stroke(); }
    }
    // 가운데 광장
    const [cx, cz] = P2(0, 0);
    g.fillStyle = '#c99a5c'; g.beginPath(); g.ellipse(cx, cz, 8.4 * k, 7.4 * k, 0.3, 0, 7); g.fill();
    g.fillStyle = '#e3b778'; g.beginPath(); g.ellipse(cx, cz, 7.8 * k, 6.8 * k, 0.3, 0, 7); g.fill();
    g.strokeStyle = '#d6aa6e'; g.lineWidth = 4; for (let rr = 2.4; rr < 7; rr += 2) { g.beginPath(); g.arc(cx, cz, rr * k, 0, 7); g.stroke(); }
    for (let i = 0; i < 120; i++) { const a = rand() * 7; const rr = 8.3 + rand() * 0.6; const [px, pz] = P2(Math.cos(a) * rr * 1.05, Math.sin(a) * rr * 0.92); g.fillStyle = rand() < 0.5 ? '#b8b1a4' : '#d2ccc0'; g.beginPath(); g.ellipse(px, pz, 7, 5, 0, 0, 7); g.fill(); }
    // 꽃 (잔디 위에만)
    { const img = g.getImageData(0, 0, TEX, TEX).data; for (let i = 0; i < 2600; i++) { const x = (rand() - 0.5) * S; const z = (rand() - 0.5) * S; const [px, pz] = P2(x, z); const o = (Math.floor(pz) * TEX + Math.floor(px)) * 4; if (!(img[o + 3] > 200 && img[o + 1] > img[o] + 30 && img[o + 1] > img[o + 2] + 30)) continue; g.fillStyle = ['#ff6b8b', '#ffd23f', '#ffffff', '#c56cf0', '#ff9f43', '#7fd0ff'][i % 6]; g.beginPath(); g.arc(px, pz, 2.4, 0, 7); g.fill(); } }
    this.groundCanvas = c; this.groundSize = S;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(S, S), toon('#ffffff', { map: t, alphaTest: 0.5 }));
    ground.rotation.x = -Math.PI / 2; ground.userData = { flat: true, floor: 'plaza', keep: true };
    this.add(ground); this.floors.push(ground);
    // 섬 둘레 모래 절벽 (물 위로 살짝 솟은 땅)
    for (const isl of ISLANDS) {
      const sh = new THREE.Shape(); shorePoints(isl, 120, 1.0).forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z)));
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false, curveSegments: 4 });
      const m = new THREE.Mesh(geo, toon('#e6c27e')); m.rotation.x = Math.PI / 2; m.position.y = -0.03; m.userData.flat = true; this.add(m);
    }
    // 바다
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon('#5fb4e6')); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.75; sea.userData = { flat: true, keep: true }; this.add(sea);
    for (const isl of ISLANDS) { // 섬 둘레 얕은 물
      const sh = new THREE.Shape(); shorePoints(isl, 90, 1.12).forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z)));
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#9fdcf5', transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = Math.PI / 2; m.position.y = -0.7; m.userData = { flat: true, keep: true }; this.add(m);
    }
    this.roadPts = roads.flatMap(([pts]) => pts);
  }


  // ---------- 길 찾기: 누른 곳까지 울타리·나무를 돌아서 걸어간다 ----------
  blocked(area, x, z) { if (area === 'plaza' && !walkable(x, z)) return true; const p = { x, z }; this.collide(area, p); return Math.abs(p.x - x) + Math.abs(p.z - z) > 0.01; }
  navGrid(area) {
    this.navCache ||= {};
    const n = (this.obstacles[area] || []).length;
    const c = this.navCache[area];
    if (c && c.n === n) return c;
    const a = AREAS[area]; const cell = 1;
    const x0 = a.cx - a.hw; const z0 = a.cz - a.hd; const W = Math.ceil((a.hw * 2) / cell) + 1; const H = Math.ceil((a.hd * 2) / cell) + 1;
    const free = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) free[j * W + i] = this.blocked(area, x0 + i * cell, z0 + j * cell) ? 0 : 1;
    return (this.navCache[area] = { n, x0, z0, W, H, cell, free });
  }
  clearLine(area, ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az); const steps = Math.ceil(d / 0.4);
    for (let s = 1; s < steps; s++) { const t = s / steps; if (this.blocked(area, ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
    return true;
  }
  findPath(area, sx, sz, tx, tz) {
    const G = this.navGrid(area); const { x0, z0, W, H, cell, free } = G;
    const idx = (x, z) => { const i = Math.max(0, Math.min(W - 1, Math.round((x - x0) / cell))); const j = Math.max(0, Math.min(H - 1, Math.round((z - z0) / cell))); return j * W + i; };
    const nearestFree = (k) => { if (free[k]) return k; const ci = k % W; const cj = (k / W) | 0; for (let r = 1; r < 6; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const i = ci + di; const j = cj + dj; if (i >= 0 && j >= 0 && i < W && j < H && free[j * W + i]) return j * W + i; } return -1; };
    const s = nearestFree(idx(sx, sz)); const t = nearestFree(idx(tx, tz));
    if (s < 0 || t < 0) return null;
    const ti = t % W; const tj = (t / W) | 0;
    const g = new Float32Array(W * H).fill(Infinity); const from = new Int32Array(W * H).fill(-1);
    const heap = [[0, s]]; g[s] = 0;
    const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1; const r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const N = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let found = false; let guard = 0;
    while (heap.length && guard++ < 60000) {
      const [, k] = pop();
      if (k === t) { found = true; break; }
      const ci = k % W; const cj = (k / W) | 0;
      for (const [di, dj, c] of N) {
        const i = ci + di; const j = cj + dj;
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        const nk = j * W + i;
        if (!free[nk] || (di && dj && (!free[cj * W + i] || !free[j * W + ci]))) continue;
        const ng = g[k] + c;
        if (ng < g[nk]) { g[nk] = ng; from[nk] = k; push(ng + Math.hypot(ti - i, tj - j), nk); }
      }
    }
    if (!found) return null;
    const pts = [];
    for (let k = t; k !== -1 && k !== s; k = from[k]) pts.push([x0 + (k % W) * cell, z0 + ((k / W) | 0) * cell]);
    pts.reverse();
    // 곧게 갈 수 있는 점은 건너뛴다
    const out = []; let cx = sx; let cz = sz; let i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !this.clearLine(area, cx, cz, pts[j][0], pts[j][1])) j--;
      out.push(pts[j]); [cx, cz] = pts[j]; i = j + 1;
    }
    return out;
  }
  walkTo(x, z, pending = null) {
    const area = this.area;
    this.target = new THREE.Vector3(x, 0, z); this.pending = pending; this.stuck = 0;
    this.path = this.clearLine(area, this.pos.x, this.pos.z, x, z) ? [] : (this.findPath(area, this.pos.x, this.pos.z, x, z) || []);
    if (this.path.length) this.path.pop(); // 마지막 칸 대신 정확한 목표로
  }

  // ---------- 작은 지도 (마을에서만) ----------
  // 지도 한 칸 = 마을 108m 네모. 바탕은 땅 그림을 줄여 쓰고, 건물은 그림 글자로.
  static MAP_R = 136;
  mapXY(x, z, W) { const R = World.MAP_R; return [((x + R) / (2 * R)) * W, ((z + R) / (2 * R)) * W]; }
  mapBase(W) {
    if (this._mapBase?.width === W) return this._mapBase;
    const c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
    const S = this.groundSize; const src = this.groundCanvas; const R = World.MAP_R; const k = src.width / S;
    g.fillStyle = '#7cc8ef'; g.fillRect(0, 0, W, W);
    g.drawImage(src, (S / 2 - R) * k, (S / 2 - R) * k, 2 * R * k, 2 * R * k, 0, 0, W, W);
    g.fillStyle = '#b97a44'; for (const { box: [x0, z0, x1, z1] } of BRIDGES) { const [a1, b1] = this.mapXY(x0, z0, W); const [a2, b2] = this.mapXY(x1, z1, W); g.fillRect(a1, b1, a2 - a1, b2 - b1); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const [fx, fz] = this.mapXY(0, 0, W);
    g.fillStyle = '#7fd0ff'; g.strokeStyle = '#5b3a1e'; g.lineWidth = 1.5; g.beginPath(); g.arc(fx, fz, W * 0.018, 0, 7); g.fill(); g.stroke();
    for (const s of SUBJECTS) {
      if (!BLD[s.id]) continue;
      const [bx, bz] = BLD[s.id]; const [px, pz] = this.mapXY(bx, bz, W); const r = W * 0.04;
      g.fillStyle = '#fff8ea'; g.strokeStyle = s.color; g.lineWidth = 2; g.beginPath(); g.roundRect(px - r, pz - r, r * 2, r * 2, r * 0.45); g.fill(); g.stroke();
      g.font = `${Math.round(r * 1.25)}px sans-serif`; g.fillText(s.emoji, px, pz + 1);
    }
    const [hx, hz] = this.mapXY(BALLOON_HILL.x, BALLOON_HILL.z + 2, W);
    g.font = `${Math.round(W * 0.06)}px sans-serif`; g.fillText('🎈', hx, hz);
    this._mapBase = c; return c;
  }
  drawMinimap(cv) {
    const W = cv.width; const g = cv.getContext('2d');
    g.clearRect(0, 0, W, W);
    g.save(); g.beginPath(); g.roundRect(0, 0, W, W, W * 0.16); g.clip();
    g.drawImage(this.mapBase(W), 0, 0);
    for (const r of this.remotes.values()) {
      if (r.area !== 'plaza' || !r.seen) continue;
      const [px, pz] = this.mapXY(r.av.position.x, r.av.position.z, W);
      g.fillStyle = '#ffffff'; g.strokeStyle = '#5b3a1e'; g.lineWidth = 1.5; g.beginPath(); g.arc(px, pz, W * 0.02, 0, 7); g.fill(); g.stroke();
    }
    if (this.player) {
      const [px, pz] = this.mapXY(this.pos.x, this.pos.z, W); const a = this.rot; const L = W * 0.05;
      g.save(); g.translate(px, pz); g.rotate(-a);
      g.fillStyle = '#ff5c5c'; g.strokeStyle = '#ffffff'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(0, L); g.lineTo(L * 0.7, -L * 0.6); g.lineTo(0, -L * 0.25); g.lineTo(-L * 0.7, -L * 0.6); g.closePath(); g.stroke(); g.fill();
      g.restore();
    }
    g.restore();
  }
  // 지도를 누르면: 건물 그림 가까이면 그 건물 문 앞으로 바로, 아니면 그 자리로 걸어간다
  mapTap(fx, fz) {
    if (this.area !== 'plaza' || !this.player || this.frozen || this.paused) return;
    const R = World.MAP_R; const x = fx * 2 * R - R; const z = fz * 2 * R - R;
    let best = null; let bd = 9.5;
    for (const it of this.interactables) {
      if (it.area !== 'plaza' || it.hidden || !(it.id.startsWith('door:') || it.id === 'roofdoor')) continue;
      const [ix, iz] = it.id === 'roofdoor' ? [BALLOON_HILL.x, BALLOON_HILL.z + 2] : BLD[it.id.slice(5)];
      const d = Math.hypot(ix - x, iz - z); if (d < bd) { bd = d; best = it; }
    }
    if (best) this.quickTravel(best.id === 'roofdoor' ? 'balloon' : best.data.subj);
    else this.walkTo(x, z, null);
  }

  vTree(x, z, s = 1, kind = 0) {
    const area = 'plaza';
    if (kind === 2) { this.P(cyl(0.2 * s, 0.25 * s, 1 * s, 6), '#7a4a24', x, 0.5 * s, z); for (let i = 0; i < 3; i++) this.P(new THREE.ConeGeometry((1.5 - i * 0.35) * s, 1.6 * s, 8), '#2f8f4e', x, (1.4 + i * 0.9) * s, z, { t: 0.05 }); }
    else {
      this.P(cyl(0.22 * s, 0.3 * s, 1.4 * s, 8), '#7a4a24', x, 0.7 * s, z);
      const cs = kind === 1 ? ['#f7b6c8', '#f39bb5'] : ['#4caf50', '#5fbf55', '#3e9e45'];
      [[0, 2.3, 0, 1.3], [-0.8, 1.9, 0.3, 0.9], [0.8, 2.0, 0.2, 0.95], [0.1, 2.9, -0.2, 0.9]].forEach(([dx, dy, dz, rr], i) => this.P(sph(rr * s, 10, 7), cs[i % cs.length], x + dx * s, dy * s, z + dz * s, { t: 0.05 }));
    }
    this.addObstacle(area, { x, z, r: 0.45 * s });
  }
  vBush(x, z, s = 1, rand = Math.random) {
    [[0, 0, 0.8], [0.7, 0.1, 0.6], [-0.6, 0.15, 0.6]].forEach(([dx, dz, rr]) => this.P(sph(rr * s, 8, 6), '#58b04a', x + dx * s, rr * s * 0.7, z + dz * s, { t: 0.04 }));
    for (let i = 0; i < 3; i++) this.P(sph(0.13, 5, 3), ['#ff6b8b', '#ffd23f', '#ffffff'][i % 3], x + (rand() - 0.5) * 1.4 * s, 0.9 * s, z + (rand() - 0.5) * s, { line: false });
  }
  vFence(x0, z0, x1, z1, block = true) {
    const len = Math.hypot(x1 - x0, z1 - z0); const n = Math.max(1, Math.round(len / 1.3)); const ang = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) { const t = i / n; this.P(box(0.22, 1.1, 0.22), '#c98a52', x0 + (x1 - x0) * t, 0.55, z0 + (z1 - z0) * t, { t: 0.03 }); if (block) this.addObstacle('plaza', { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, r: 0.35 }); }
    for (const y of [0.45, 0.85]) { const rl = this.P(box(0.1, 0.14, len), '#e0a868', (x0 + x1) / 2, y, (z0 + z1) / 2, { t: 0.02 }); rl.rotation.y = ang; }
    if (block) for (let t = 0.5 / n; t < 1; t += 1 / n) this.addObstacle('plaza', { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, r: 0.35 });
  }
  vLamp(x, z) { this.P(cyl(0.09, 0.12, 2.8, 8), '#3b3b4f', x, 1.4, z, { t: 0.03 }); this.P(box(0.5, 0.6, 0.5), '#ffe98a', x, 3.0, z, { t: 0.03 }); this.addObstacle('plaza', { x, z, r: 0.25 }); }
  vBench(x, z, ry) {
    const b = new THREE.Group(); b.add(at(part(box(2.2, 0.15, 0.7), '#c98a52', { t: 0.03 }), 0, 0.55, 0)); b.add(at(part(box(2.2, 0.5, 0.12), '#c98a52', { t: 0.03 }), 0, 0.95, -0.3));
    for (const sx of [-1, 1]) b.add(at(part(box(0.15, 0.55, 0.6), '#7a4a24', { t: 0.02 }), sx * 0.9, 0.27, 0));
    b.position.set(x, 0, z); b.rotation.y = ry; this.add(b); this.addObstacle('plaza', { x, z, r: 0.9 });
  }

  buildVillage() {
    const area = 'plaza';
    const rand = seeded(5);
    // 건물 먼저 만들어 문 자리를 알아 둔다
    this.doorOffset = {};
    const blds = {};
    for (const s of SUBJECTS) { if (!SLOTS[s.id]) continue; const b = buildBuilding(s.id); blds[s.id] = b; this.doorOffset[s.id] = b.userData.door; }
    this.villageGround();
    for (const s of SUBJECTS) {
      const b = blds[s.id]; if (!b) continue;
      const [x, z] = SLOTS[s.id];
      b.position.set(x, 0, z); this.add(b);
      b.userData.spinners.forEach((sp) => { sp.obj.userData.keep = true; this.spinners.push({ obj: sp.obj, sp: sp.sp, axis: 'z' }); });
      // 부딪히는 자리: 운동장은 클럽하우스·관중석만, 나머지는 건물 전체
      if (s.id === 'pe') { this.addObstacle(area, { box: [x - 3.4, z - 8.4, x + 3.4, z - 4.2] }); this.addObstacle(area, { box: [x - 8.4, z - 3.6, x - 6.2, z + 0.6] }); this.addObstacle(area, { box: [x + 6.4, z - 4.2, x + 7.2, z - 3.4] }); }
      else {
        b.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(b);
        this.addObstacle(area, { box: [bb.min.x + 0.3, bb.min.z + 0.3, bb.max.x - 0.3, Math.min(bb.max.z - 0.2, z + b.userData.door[1] - 1.3)] });
      }
      for (const [x0, z0, x1, z1] of b.userData.obs) this.addObstacle(area, { box: [x + x0, z + z0, x + x1, z + z1] });
      const [dx, dz] = b.userData.door;
      const sign = makeSprite([`${s.emoji} ${s.name}`], SIGN_H, { size: 56 });
      const so = b.userData.sign || [dx + 1.7 + sign.scale.x / 2, dz + 0.4];
      sign.position.set(x + so[0], 1.0 + SIGN_H / 2, z + so[1]); this.add(sign);
      // 멀리서 볼 때는 건물 위로 크게 띄운다
      const top = new THREE.Box3().setFromObject(b).max.y;
      sign.userData.near = sign.position.clone(); sign.userData.far = new THREE.Vector3(x, top + 2.6, z); sign.userData.subj = s.id;
      this.gateSigns[s.id] = sign;
      this.addInteract({ id: `door:${s.id}`, kind: 'door', area, x: x + dx, z: z + dz, r: 2.0, label: `${s.emoji} ${s.name} 들어가기`, data: { subj: s.id }, mesh: b });
      // 문 앞 반짝 고리
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32), new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.6, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x + dx, 0.04, z + dz); ring.userData = { flat: true, keep: true }; this.add(ring); this.pulsers.push(ring);
      if (!['pe', 'soc', 'fire'].includes(s.id)) { this.vBush(x - b.userData.w / 2 - 0.9, z + 2.2, 0.85, rand); this.vLamp(x + dx - 2.2, z + dz + 0.6); }
    }

    // 빈 땅과 공사장
    this.lotSigns = [];
    for (const lot of LOTS) {
      const { x, z } = lot;
      for (const [x0, z0, x1, z1] of [[x - 5, z - 4, x + 5, z - 4], [x - 5, z - 4, x - 5, z + 3], [x + 5, z - 4, x + 5, z + 3]]) this.vFence(x0, z0, x1, z1, false);
      if (lot.soon) {
        const [emo, name] = lot.soon;
        for (const [cx2, cz2] of [[-3, 1], [3, 1], [-1.2, 3.2], [1.6, 3.4]]) { this.P(new THREE.ConeGeometry(0.32, 0.85, 12), '#ff9f43', x + cx2, 0.43, z + cz2, { t: 0.015 }); this.add(at(new THREE.Mesh(cyl(0.22, 0.25, 0.12, 12), toon('#ffffff')), x + cx2, 0.45, z + cz2)); }
        // 쌓아 둔 벽돌과 비계
        for (let i = 0; i < 6; i++) this.P(box(1.0, 0.5, 0.6), '#c96b45', x - 2.4 + (i % 3) * 1.05, 0.25 + Math.floor(i / 3) * 0.5, z - 1.6, { t: 0.015 });
        for (const sx of [-1, 1]) this.P(box(0.18, 4.2, 0.18), '#ffd23f', x + 2.6 + sx * 0.9, 2.1, z - 2.2, { t: 0.015 });
        for (const y of [1.4, 2.8, 4.1]) this.P(box(2.2, 0.14, 0.4), '#a8743e', x + 2.6, y, z - 2.2, { t: 0.015 });
        this.addObstacle(area, { box: [x - 3.2, z - 2.4, x + 3.8, z - 1.0] });
        const sg = makeSprite([`${emo} ${name}`, '🚧 곧 열려요!'], SIGN_H * 1.15, { size: 52, bg: '#fff3c4' }); sg.position.set(x, 1.0 + SIGN_H * 0.6, z + 2.0); this.add(sg);
        sg.userData.h0 = SIGN_H * 1.15; sg.userData.near = sg.position.clone(); sg.userData.far = new THREE.Vector3(x, 5, z); this.lotSigns.push(sg);
      } else {
        for (let i = 0; i < 7; i++) { const sx2 = x + (rand() - 0.5) * 6; const sz2 = z + (rand() - 0.5) * 4; this.P(sph(0.22, 6, 5), '#5cbf3c', sx2, 0.15, sz2, { line: false }); this.P(sph(0.16, 6, 5), '#7ccf5f', sx2 + 0.2, 0.3, sz2, { line: false }); }
        const sg = makeSprite(['🌱 빈 땅', '새 건물이 들어올 자리'], SIGN_H * 0.95, { size: 46, bg: '#ffffff' }); sg.position.set(x, 1.0 + SIGN_H * 0.5, z + 1.5); this.add(sg);
        sg.userData.h0 = SIGN_H * 0.95; sg.userData.near = sg.position.clone(); sg.userData.far = new THREE.Vector3(x, 4, z); this.lotSigns.push(sg);
      }
    }

    // 나무다리 (가운데 섬 ↔ 바깥 섬)
    for (const { box: [x0, z0, x1, z1] } of BRIDGES) {
      const alongZ = (z1 - z0) > (x1 - x0); const len = alongZ ? z1 - z0 : x1 - x0; const wid = alongZ ? x1 - x0 : z1 - z0;
      const mx = (x0 + x1) / 2; const mz = (z0 + z1) / 2;
      const grp = new THREE.Group(); grp.position.set(mx, 0, mz); if (!alongZ) grp.rotation.y = Math.PI / 2; this.add(grp);
      for (let i = 0; i < Math.floor(len / 0.7); i++) grp.add(at(part(box(wid + 0.6, 0.22, 0.6), i % 2 ? '#c98a52' : '#b97a44', { t: 0.015 }), 0, -0.09, -len / 2 + 0.35 + i * 0.7));
      for (const s of [-1, 1]) {
        for (let zz = -len / 2; zz <= len / 2 + 0.01; zz += len / Math.round(len / 3)) { grp.add(at(part(box(0.3, 1.2, 0.3), '#7a4a24', { t: 0.02 }), s * (wid / 2 + 0.25), 0.5, zz)); grp.add(at(part(cyl(0.22, 0.22, 1.6, 8), '#6b4226', { t: 0.02 }), s * (wid / 2 + 0.25), -0.9, zz)); }
        grp.add(at(part(box(0.18, 0.18, len), '#a8743e', { t: 0.015 }), s * (wid / 2 + 0.25), 1.05, 0));
      }
    }
    // 섬 입구 문과 섬 이름 (다리가 닿는 곳)
    this.islandLabels = {};
    for (const isl of ISLANDS) {
      if (isl.id === 'hub') continue;
      const br = BRIDGES.find((b) => b.to === isl.id); const [x0, z0, x1, z1] = br.box;
      const gx = isl.cx === 0 ? 0 : (isl.cx < 0 ? x0 + 1.5 : x1 - 1.5); const gz = isl.cx !== 0 ? 0 : (isl.cz < 0 ? z0 + 1.5 : z1 - 1.5);
      const across = isl.cx === 0; // 다리가 남북이면 문 기둥은 동서로
      for (const s of [-1, 1]) { const px = across ? gx + s * 3.6 : gx; const pz = across ? gz : gz + s * 3.6; this.P(box(0.5, 4.2, 0.5), '#8d5a34', px, 2.1, pz, { t: 0.03 }); this.P(sph(0.42, 10, 8), isl.color, px, 4.4, pz); this.addObstacle(area, { x: px, z: pz, r: 0.5 }); }
      const beam = this.P(box(across ? 8 : 0.4, 0.45, across ? 0.4 : 8), '#a8743e', gx, 3.9, gz, { t: 0.03 }); void beam;
      const gs = makeSprite([`${isl.emoji} ${isl.name}`], 1.5, { size: 64, bg: isl.color, fg: '#fff' }); gs.position.set(gx, 5.2, gz); this.add(gs);
      // 전체 보기용 큰 섬 이름 (누르면 그 섬으로)
      const lb = makeSprite([`${isl.emoji} ${isl.name}`], 9, { size: 80, bg: isl.color, fg: '#fff' });
      const sub = makeSprite([isl.sub], 3, { size: 48 });
      lb.position.set(isl.cx, 24, isl.cz); sub.position.set(isl.cx, 13, isl.cz + 4);
      lb.visible = sub.visible = false; lb.userData.island = isl.id; sub.userData.island = isl.id; lb.renderOrder = sub.renderOrder = 5;
      lb.material.depthTest = sub.material.depthTest = false;
      this.add(lb); this.add(sub); this.islandLabels[isl.id] = lb; this.islandLabels[`${isl.id}:sub`] = sub;
    }

    // 가운데 섬: 분수 광장
    const f = new THREE.Group();
    f.add(at(part(cyl(2.7, 2.9, 0.7, 28), '#d8d2c4', { t: 0.05 }), 0, 0.35, 0));
    const water = new THREE.Mesh(new THREE.CircleGeometry(2.4, 28), toon('#6fc7f2')); water.rotation.x = -Math.PI / 2; water.position.y = 0.68; f.add(water);
    f.add(at(part(cyl(0.4, 0.5, 1.6, 14), '#d8d2c4'), 0, 1.2, 0)); f.add(at(part(cyl(1.2, 0.8, 0.35, 20), '#d8d2c4'), 0, 2.05, 0));
    const w2 = new THREE.Mesh(new THREE.CircleGeometry(1.0, 20), toon('#6fc7f2')); w2.rotation.x = -Math.PI / 2; w2.position.y = 2.24; f.add(w2);
    this.add(f); this.addObstacle(area, { x: 0, z: 0, r: 3.0 });
    const N = 90; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#d6f3ff', size: 0.17, transparent: true, opacity: 0.95 })); pts.frustumCulled = false; this.add(pts);
    this.fountain = { pts, seeds: Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, t: Math.random(), v: 0.8 + Math.random() * 0.5 })), y0: 0.2 };
    const poles = [[-5.8, -5.8], [5.8, -5.8], [5.8, 5.8], [-5.8, 5.8]];
    poles.forEach(([x, z]) => { this.P(box(0.3, 4, 0.3), '#a8743e', x, 2, z, { t: 0.03 }); this.addObstacle(area, { x, z, r: 0.3 }); });
    poles.forEach(([x0, z0], i) => { const [x1, z1] = poles[(i + 1) % 4]; this.bunting(x0, z0, x1, z1, 3.9, ['#ff6b8b', '#ffd23f', '#48dbfb', '#1dd1a1', '#c56cf0', '#ff9f43']); });
    const board = new THREE.Group(); board.add(at(part(box(0.2, 2.2, 0.2), '#7a4a24'), -1.1, 1.1, 0)); board.add(at(part(box(0.2, 2.2, 0.2), '#7a4a24'), 1.1, 1.1, 0)); board.add(at(part(box(2.6, 1.6, 0.2), '#c98a52'), 0, 1.9, 0));
    ['#fff8ea', '#ffe08a', '#cfe8ff'].forEach((c, i) => board.add(at(new THREE.Mesh(box(0.6, 0.7, 0.05), toon(c)), -0.8 + i * 0.8, 1.95, 0.12)));
    board.position.set(9.5, 0, 6.5); board.rotation.y = -0.7; this.add(board); this.addObstacle(area, { x: 9.5, z: 6.5, r: 1.1 });
    this.vBench(-4.6, 4.6, 0.6); this.vBench(4.4, -4.6, Math.PI + 0.7);
    const title = makeSprite(['🗺️ 꼬마 탐험대 공원'], 1.1, { size: 70, bg: '#ffd36b' }); title.position.set(0, 5.6, 0); this.add(title); this.bob(title, 0.12, 1);
    // 갈림길 안내판
    const signpost = (x, z, txt) => { this.P(box(0.18, 2.4, 0.18), '#7a4a24', x, 1.2, z); this.P(box(2.6, 0.6, 0.12), '#c98a52', x, 2.1, z); const t2 = makeSprite([txt], 0.55, { size: 44, bg: null, fg: '#fff8c4' }); t2.position.set(x, 2.15, z + 0.25); this.add(t2); this.addObstacle(area, { x, z, r: 0.25 }); };
    signpost(2.6, -10, '↑ 📚 공부 섬'); signpost(-2.6, 10.5, '↓ 💻 코딩 섬'); signpost(-11, 2.6, '← 🎨 놀이 섬'); signpost(11, -2.6, '→ 🏘️ 생활 섬');
    for (const [x, z] of [[-2.4, -14], [2.4, 14], [-16, -2.4], [16, 2.4]]) this.vLamp(x, z);
    // 열기구 언덕
    const hill = new THREE.Mesh(new THREE.SphereGeometry(6.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon('#9ad866')); hill.scale.y = 0.2; hill.position.set(BALLOON_HILL.x, 0, BALLOON_HILL.z); hill.userData = { flat: true }; this.add(hill);
    const hb = this.hotAirBalloon(0.85); hb.position.set(BALLOON_HILL.x, 1.0, BALLOON_HILL.z); this.add(hb); this.bob(hb, 0.35, 0.7);
    this.addObstacle(area, { x: BALLOON_HILL.x, z: BALLOON_HILL.z, r: 2.2 });
    this.balloonSign = makeSprite(['🎈 열기구 탈출장'], 1.2, { size: 56, bg: '#ff6b8b', fg: '#fff' }); this.balloonSign.position.set(BALLOON_HILL.x - 2.4, 1.3, BALLOON_HILL.z + 5.2); this.add(this.balloonSign);
    this.addInteract({ id: 'roofdoor', kind: 'roofdoor', area, x: BALLOON_HILL.x, z: BALLOON_HILL.z + 6.0, r: 2.2, label: '🎈 열기구 탈출장 가기', data: {}, mesh: hb });
    const hring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32), new THREE.MeshBasicMaterial({ color: '#ff6b8b', transparent: true, opacity: 0.6, depthWrite: false })); hring.rotation.x = -Math.PI / 2; hring.position.set(BALLOON_HILL.x, 0.04, BALLOON_HILL.z + 6.0); hring.userData = { flat: true, keep: true }; this.add(hring); this.pulsers.push(hring);

    // 섬마다 꽃밭·벤치·바위
    const flowerBed = (x, z, w, d) => { this.vFence(x - w / 2, z - d / 2, x + w / 2, z - d / 2); this.vFence(x - w / 2, z - d / 2, x - w / 2, z + d / 2); this.vFence(x + w / 2, z - d / 2, x + w / 2, z + d / 2); for (let i = 0; i < w * d * 1.6; i++) this.P(sph(0.16, 6, 4), ['#ff6b8b', '#ffd23f', '#ffffff', '#c56cf0', '#ff9f43'][i % 5], x + (rand() - 0.5) * (w - 0.6), 0.25, z + (rand() - 0.5) * (d - 0.6), { line: false }); };
    flowerBed(-20, -46, 6, 4); flowerBed(22, -46, 6, 4); flowerBed(-20, 81, 6, 4); flowerBed(24, 81, 6, 4);
    this.vBench(-75, 31, 0); this.vBench(75, 31, 0); this.vBench(-8, -48, Math.PI); this.vBench(8, 80, 0);
    for (const [x, z, s2] of [[-100, 10, 1.2], [100, -18, 1.1], [-60, -84, 1], [62, 86, 1.1], [-14, 88, 0.9], [96, 22, 0.8]]) { if (!walkable(x, z)) continue; this.P(new THREE.DodecahedronGeometry(0.9 * s2, 0), '#b8b1a4', x, 0.5 * s2, z, { t: 0.04 }); this.addObstacle(area, { x, z, r: 0.8 * s2 }); }

    // 나무: 섬 안쪽, 길·건물·광장·빈 땅을 피해서
    const free = (x, z, pad = 2.6) => {
      const isl = islandAt(x, z, 0.1); if (!isl) return false;
      if (Math.hypot(x / 10, z / 9) < 1) return false;
      if (Math.hypot(x - BALLOON_HILL.x, z - BALLOON_HILL.z) < 8.5) return false;
      for (const [id, b] of Object.entries(blds)) { const [bx, bz] = SLOTS[id]; const w2 = b.userData.w / 2 + 1.8; if (Math.abs(x - bx) < w2 && z - bz > -b.userData.d / 2 - 2 && z - bz < Math.max(b.userData.door[1] + 2.5, b.userData.front + 1.5)) return false; }
      for (const lot of LOTS) if (Math.abs(x - lot.x) < 7 && Math.abs(z - lot.z) < 6.5) return false;
      for (const [rx, rz] of this.roadPts) if (Math.hypot(x - rx, z - rz) < pad) return false;
      return true;
    };
    for (const isl of ISLANDS) {
      const n = Math.round(isl.rx * isl.rz * 0.09);
      for (let i = 0; i < n; i++) { const a = rand() * Math.PI * 2; const r = Math.sqrt(rand()) * 0.93; const x = isl.cx + Math.cos(a) * isl.rx * r; const z = isl.cz + Math.sin(a) * isl.rz * r; if (!free(x, z, 3)) continue; if (rand() < 0.55) this.vTree(x, z, 0.7 + rand() * 0.6, rand() < 0.25 ? 2 : rand() < 0.15 ? 1 : 0); else this.vBush(x, z, 0.5 + rand() * 0.5, rand); }
      // 해안을 따라 한 줄
      const m = Math.round((isl.rx + isl.rz) * 0.55);
      for (let i = 0; i < m; i++) { const a = (i / m) * Math.PI * 2 + rand() * 0.1; const r = shoreR(isl, a) * (0.84 + rand() * 0.06); const x = isl.cx + Math.cos(a) * isl.rx * r; const z = isl.cz + Math.sin(a) * isl.rz * r; if (free(x, z, 2.2) && !onBridgeNear(x, z)) this.vTree(x, z, 0.8 + rand() * 0.5, rand() < 0.35 ? 2 : rand() < 0.15 ? 1 : 0); }
    }
    this.butterflies(area, 12);
    // 하늘의 구름과 바다의 작은 배
    for (let i = 0; i < 9; i++) { const cl = new THREE.Group(); for (let k = 0; k < 4; k++) { const s2 = at(part(sph(1.4 + rand() * 0.8, 12, 9), '#ffffff', { t: 0.06 }), k * 1.6 - 2.4, rand() * 0.5, 0); s2.scale.y = 0.7; cl.add(s2); } cl.position.set(-110 + i * 27, 18 + rand() * 5, -100 + rand() * 40); cl.userData.keep = true; cl.traverse((m) => { m.userData.flat = true; }); this.add(cl); this.clouds.push({ g: cl, x0: cl.position.x, sp: 0.3 + rand() * 0.4, area }); }
    for (const [x, z, ry, c] of [[-40, -30, 0.6, '#ff6b8b'], [44, 34, -0.4, '#48b4e8'], [-44, 38, 2.2, '#ffd23f'], [112, -40, 1.1, '#ff9f43']]) { const bt = new THREE.Group(); bt.add(at(part(box(1.6, 0.6, 3.4), '#ffffff', { t: 0.03 }), 0, 0, 0)); bt.add(at(part(cyl(0.06, 0.06, 2.6, 6), '#7a4a24'), 0, 1.4, 0)); const sail = at(part(new THREE.ConeGeometry(1.0, 2.2, 3), c, { t: 0.02 }), 0.1, 1.6, 0.3); sail.scale.z = 0.25; bt.add(sail); bt.position.set(x, -0.5, z); bt.rotation.y = ry; this.add(bt); this.bob(bt, 0.12, 1.3); }
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

  // ---------- 건물 안 (놀이 구역) ----------
  // 마루 바닥·세 벽(앞은 트여 있음)·창문·과목마다 다른 가구
  buildZone(s) {
    const area = `zone:${s.id}`;
    const a = AREAS[area];
    const L = a.cx - a.hw; const R = a.cx + a.hw; const B = a.cz - a.hd; const F = a.cz + a.hd;
    const theme = INTERIOR[s.id];
    // 바닥
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(a.hw * 2, a.hd * 2 + 1), texMat('plank', theme.floor, a.hw / 1.5, 1));
    floor.material = texMat('plank', theme.floor, 1, 1).clone(); floor.material.map = floor.material.map.clone(); floor.material.map.repeat.set(1, a.hw / 1.2); floor.material.map.rotation = Math.PI / 2; floor.material.map.needsUpdate = true;
    floor.rotation.x = -Math.PI / 2; floor.position.set(a.cx, 0, a.cz + 0.5); floor.userData = { flat: true, floor: area, keep: true }; this.add(floor); this.floors.push(floor);
    const under = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon('#3b2a1e')); under.rotation.x = -Math.PI / 2; under.position.set(a.cx, -0.05, a.cz); under.userData = { flat: true, keep: true }; this.add(under);
    // 벽: 아래 판자 + 위 벽지
    const H = 5.2;
    const wall = (sx, sz, x, z) => {
      this.P(box(sx, H - 1.4, sz), theme.wall, x, 1.4 + (H - 1.4) / 2, z, { t: 0.04 });
      this.add(at(part(box(sx + 0.02, 1.4, sz + 0.02), '#fff', { mat: texMat('plank', theme.wood, Math.max(sx, sz) / 2, 0.6), t: 0.04 }), x, 0.7, z));
      this.P(box(sx + 0.06, 0.2, sz + 0.06), theme.trim, x, 1.45, z, { t: 0.02 });
      this.P(box(sx + 0.06, 0.3, sz + 0.06), theme.trim, x, H, z, { t: 0.02 });
    };
    wall(a.hw * 2 + 0.8, 0.4, a.cx, B - 0.2); wall(0.4, a.hd * 2 + 1, L - 0.2, a.cz + 0.5); wall(0.4, a.hd * 2 + 1, R + 0.2, a.cz + 0.5);
    // 앞쪽 문턱
    this.P(box(a.hw * 2 + 0.8, 0.3, 0.3), theme.trim, a.cx, 0.15, F + 1.05, { t: 0.02 });
    // 뒷벽 창문 둘 (햇빛 비치는 창)
    const wg = new THREE.Group(); wg.position.set(0, 0, B); this.add(wg);
    for (const x of [a.cx - 7.5, a.cx + 7.5]) { windowAt(wg, x, 3.2, 0, { w: 2.2, h: 1.8, shutter: null, flowers: false }); for (const sx of [-1, 1]) this.P(box(0.6, 2.4, 0.15), theme.curtain, x + sx * 1.45, 3.3, B + 0.2, { t: 0.02 }); }
    // 칠판(문제 안내판)
    this.P(box(7.2, 2.4, 0.2), '#a8743e', a.cx, 3.1, B + 0.15, { t: 0.03 });
    this.P(box(6.8, 2.0, 0.22), theme.board, a.cx, 3.1, B + 0.17, { t: 0.01 });
    const title = makeSprite([`${s.emoji} ${s.name}`], 0.85, { size: 64, bg: null, fg: '#fff' }); title.position.set(a.cx, 3.55, B + 0.6); this.add(title);
    const sub = makeSprite(['보물 상자 3개를 열면 열쇠!'], 0.42, { size: 42, bg: null, fg: '#fff8c4' }); sub.position.set(a.cx, 2.75, B + 0.6); this.add(sub);
    this.boards[area] = sub;
    // 가운데 둥근 깔개
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 48), toon(theme.rug)); rug.scale.set(9, 4.2, 1); rug.rotation.x = -Math.PI / 2; rug.position.set(a.cx, 0.02, a.cz - 0.5); rug.userData.flat = true; this.add(rug);
    const rug2 = new THREE.Mesh(new THREE.RingGeometry(0.88, 0.96, 48), toon('#ffffff')); rug2.scale.set(9, 4.2, 1); rug2.rotation.x = -Math.PI / 2; rug2.position.set(a.cx, 0.025, a.cz - 0.5); rug2.userData.flat = true; this.add(rug2);
    // 나가는 문 (왼쪽 벽)
    const dg = new THREE.Group(); dg.position.set(L, 0, a.cz + 4); dg.rotation.y = Math.PI / 2; this.add(dg);
    doorAt(dg, 0, 0, { color: theme.wood, steps: false });
    const exs = makeSprite(['🚪 마을로'], 0.55, { size: 50, bg: '#5b3a1e', fg: '#fff' }); exs.position.set(L + 0.6, 3.1, a.cz + 4); this.add(exs);
    this.addInteract({ id: `exit:${s.id}`, kind: 'exit', area, x: L + 1.7, z: a.cz + 4, r: 1.7, label: '🏡 마을로 나가기', data: {}, mesh: dg });
    // 구역 친구, 보물 상자, 열쇠
    this.host(area, a.cx + 9.2, a.cz - 4.2, s.host, s.hostName, s.color);
    this.stations[area] = [[-6, -1.5], [0, -2.8], [6, -1.5]].map(([dx, dz], i) => this.buildStation(area, a.cx + dx, a.cz + dz, i, s.color));
    this.buildKey(area, a.cx, a.cz + 2.2);
    this.bunting(L, B + 0.3, a.cx - 3.8, B + 0.3, 5.0, [s.color, '#ffffff', '#ffd23f']);
    this.bunting(a.cx + 3.8, B + 0.3, R, B + 0.3, 5.0, [s.color, '#ffffff', '#ffd23f']);
    // 과목마다 다른 가구
    theme.props(this, area, a, L, R, B);
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
    const ex = this.arch(a.cx - a.hw + 0.3, a.cz + 5, Math.PI / 2, '#9e9e9e', { w: 2.6, h: 3, area, title: '마을로', emoji: '🏡' });
    this.addInteract({ id: 'exit:balloon', kind: 'exit', area, x: ex.ix, z: ex.iz, r: 1.6, label: '🏡 마을로 돌아가기', data: {}, mesh: ex.group });
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
    if (this.overview) this.setOverview(false);
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
  // 땅 위 한 점이 화면(캔버스)의 어디에 보이는지
  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height, w: r.width, h: r.height, ok: v.z < 1 };
  }
  // 멀리서 고른 건물 앞으로 바로 가기
  quickTravel(subj) {
    this.setView('normal');
    const spot = subj === 'balloon' ? { x: BALLOON_HILL.x, z: BALLOON_HILL.z + 7.4 } : this.plazaSpotFor(subj);
    this.goTo('plaza', spot);
    this.celebrate(this.pos.x, this.pos.z);
    this.onQuick?.(subj);
  }
  plazaSpotFor(subj) {
    const it = this.interactables.find((x) => x.id === `door:${subj}`);
    if (!it) return PLAZA_SPAWN;
    return { x: it.x, z: it.z + 1.4 };
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
    // 선생님이 섬마을 전체를 볼 때는 멀리까지 보이게
    const fog = this.scene.fog; this.fogBase ||= fog ? [fog.near, fog.far] : null;
    const D = this.viewDist('all');
    if (fog) [fog.near, fog.far] = area === 'plaza' ? [D + 60, D + 240] : this.fogBase;
    this.camera.far = area === 'plaza' ? D + 190 : 400; this.camera.updateProjectionMatrix();
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
      const floorHit = () => ray.intersectObjects(this.floors.filter((f) => f.userData.floor === this.area), false)[0];
      // 섬 전체 보기: 섬 이름표나 섬을 누르면 그 섬만 크게
      if (this.view === 'all') {
        const hl = ray.intersectObjects(Object.values(this.islandLabels || {}).filter((l) => l.visible), false)[0];
        if (hl) { this.setView(hl.object.userData.island); return; }
        const f0 = floorHit(); const isl = f0 && islandAt(f0.point.x, f0.point.z);
        if (isl && isl.id !== 'hub') { this.setView(isl.id); return; }
      }
      const its = this.interactables.filter((it) => it.area === this.area && it.mesh && !it.hidden);
      const meshes = [];
      its.forEach((it) => it.mesh.traverse((m) => { if (m.isMesh && !m.userData.outline) meshes.push(m); }));
      const hit = ray.intersectObjects(meshes, false)[0];
      const it = hit?.object.userData.interact;
      // 멀리서 보는 중에 건물(또는 이름표)을 누르면 그 건물 문 앞으로 바로 간다
      if (this.view !== 'normal') {
        const hs = ray.intersectObjects(Object.values(this.gateSigns).filter((sp) => sp.visible), false)[0];
        const subj = hs?.object.userData.subj || (it?.kind === 'door' ? it.data.subj : null);
        if (subj || it?.kind === 'roofdoor') { this.quickTravel(subj || 'balloon'); return; }
      }
      if (it && !it.hidden && it.area === this.area) {
        if (this.near === it) { this.onInteract(it); return; }
        this.walkTo(it.x, it.z, it); return;
      }
      const fh = floorHit();
      if (fh) this.walkTo(fh.point.x, fh.point.z, null);
    });
  }
  // 보기: 'normal'(내 캐릭터 따라가기) · 'all'(섬 전체) · 섬 id(그 섬만)
  get overview() { return this.view !== 'normal'; }
  setOverview(on) { this.setView(on ? 'all' : 'normal'); }
  setView(v) {
    if (v !== 'normal' && (this.area !== 'plaza' || this.spectating)) v = 'normal';
    if (v === this.view) return;
    this.view = v;
    const on = v !== 'normal';
    const D = this.viewDist(v);
    // 섬 하나를 볼 때는 건물 이름표를 건물 위로 크게, 섬 전체를 볼 때는 섬 이름표만
    const big = SIGN_FAR_H * (D / 90) ** 0.6;
    for (const sp of Object.values(this.gateSigns)) {
      const isl = islandAt(sp.userData.far.x, sp.userData.far.z)?.id;
      const far = on && v !== 'all';
      sp.visible = v !== 'all' || isl === 'hub';
      sp.userData.height = far ? big : SIGN_H; paint(sp);
      sp.position.copy(far ? sp.userData.far : sp.userData.near);
      if (far) sp.position.y += big / 2;
    }
    for (const sp of this.lotSigns || []) {
      const far = on && v !== 'all';
      sp.visible = v !== 'all';
      sp.userData.height = far ? big * 0.75 : sp.userData.h0; paint(sp);
      sp.position.copy(far ? sp.userData.far : sp.userData.near); if (far) sp.position.y += big * 0.4;
    }
    for (const [id, lb] of Object.entries(this.islandLabels || {})) {
      lb.visible = false; // 섬 전체 보기에서는 화면 위 섬 카드(app.js)가 대신 보인다
      const s2 = (D / 200) ** 0.8; lb.scale.set(lb.userData.w0 ||= lb.scale.x, lb.userData.h0 ||= lb.scale.y, 1);
      lb.scale.set(lb.userData.w0 * s2, lb.userData.h0 * s2, 1); void id;
    }
    const fog = this.scene.fog;
    if (fog) { this.fogBase ||= [fog.near, fog.far]; [fog.near, fog.far] = on ? [D + 60, D + 240] : this.fogBase; }
    // 멀리 떨어진 건물 안 놀이방들이 비치지 않게
    this.camera.far = on ? D + 190 : 400; this.camera.updateProjectionMatrix();
    this.onOverview(on, v);
  }
  // 화면 비율에 맞춰 보이는 거리: 섬 전체(가로 약 220m) 또는 섬 하나
  viewDist(v = this.view) {
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)); const asp = this.camera.aspect;
    if (v === 'all' || !ISLAND[v]) return Math.min(520, Math.max(205, 200 / (t * asp)));
    const isl = ISLAND[v];
    return Math.min(300, Math.max((isl.rz + 6) * 2.3, (isl.rx + 4) * 1.18 / (t * asp)));
  }
  overviewDist() { return this.viewDist(); }
  setZoom(z) {
    if (this.overview) this.setOverview(false);
    this.zoom = Math.max(0.55, Math.min(1.8, z));
    this.onZoom(this.zoom);
  }

  // ---------- 안내하는 탐험대장 (광장을 천천히 돌아다닌다) ----------
  addGuide(look, name) {
    if (this.guide) return this.guide;
    const av = makeCharacter(look, name, false);
    setSprite(av.userData.label, [name], { size: 46, bg: '#ffd36b', pad: 12, radius: 18 });
    av.position.set(3.6, 0, 4.4);
    this.add(av);
    const it = this.addInteract({ id: 'guide', kind: 'guide', area: 'plaza', x: 4, z: 6.5, r: 2.0, label: `💬 ${name}에게 물어보기`, data: {}, mesh: av });
    this.guide = { av, it, pts: [[3.6, 4.4], [5.3, 0.4], [3, -4.6], [-3.4, -4.2], [-5.4, 1.6], [-2.4, 5.4]], i: 0, wait: 2, talking: false };
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
    animatePaper(av.userData.body, av, moving, dt, T, this.camYaw || 0);
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
      if ((ix || iz) && this.view !== 'normal') this.setView('normal');
      if (this.frozen || this.paused) { ix = 0; iz = 0; this.target = null; }
      if (!ix && !iz && this.target) {
        while (this.path?.length && Math.hypot(this.path[0][0] - this.pos.x, this.path[0][1] - this.pos.z) < 0.7) this.path.shift();
        const wp = this.path?.length ? { x: this.path[0][0], z: this.path[0][1] } : this.target;
        const dx = wp.x - this.pos.x; const dz = wp.z - this.pos.z; const d = Math.hypot(dx, dz);
        if ((wp === this.target && d < 0.25) || (this.pending && this.near === this.pending)) {
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
        if (this.area === 'plaza' && !walkable(this.pos.x, this.pos.z)) {
          // 물가에서는 미끄러지듯 해안을 따라 간다
          if (walkable(before.x, this.pos.z)) this.pos.x = before.x; else if (walkable(this.pos.x, before.z)) this.pos.z = before.z; else this.pos.copy(before);
        }
        if (this.target && before.distanceTo(this.pos) < sp * dt * 0.2) { this.stuck = (this.stuck || 0) + dt; if (this.stuck > 0.4) { this.target = null; this.pending = null; } } else this.stuck = 0;
        let diff = Math.atan2(ix, iz) - this.rot;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.rot += diff * Math.min(1, dt * 12);
        moving = true;
      }
      this.player.position.copy(this.pos);
      this.player.rotation.y = this.rot;
      animatePaper(this.player.userData.body, this.player, moving, dt, T, this.camYaw || 0);
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
      animatePaper(this.player.userData.body, this.player, false, dt, T, this.camYaw || 0);
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
      animatePaper(r.av.userData.body, r.av, mv, dt, T, this.camYaw || 0);
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
        const r = s.t * 1.1; arr[i * 3] = Math.cos(s.a) * r; arr[i * 3 + 2] = Math.sin(s.a) * r; arr[i * 3 + 1] = 2.3 + s.t * 2.2 - s.t * s.t * 3.0;
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
    if (this.spectating === 'plaza') { look = new THREE.Vector3(0, 0, -6); const D = this.viewDist('all'); const n = Math.hypot(...a.spec); off = a.spec.map((v) => (v * D) / n); }
    else if (this.spectating) { look = new THREE.Vector3(a.cx, 0, a.cz - 1); off = a.spec; }
    else if (this.view !== 'normal' && !this.flying) { const isl = ISLAND[this.view]; look = isl ? new THREE.Vector3(isl.cx, 0, isl.cz - 2) : new THREE.Vector3(0, 0, -6); const D = this.viewDist(); const n = Math.hypot(...a.spec); off = a.spec.map((v) => (v * D) / n); }
    else if (this.flying) { look = this.player.position.clone(); off = [0, 4, 14]; }
    else {
      const f = a.follow ?? 1;
      look = new THREE.Vector3(a.cx + (this.pos.x - a.cx) * f, 0.8, a.cz + (this.pos.z - a.cz) * f - (a.ahead ?? (f === 1 ? 4 : 1)));
      off = a.cam;
    }
    const k = (this.view !== 'normal' || this.spectating === 'plaza') && !this.flying ? 1 : (this.camera.aspect < 1 ? 1.45 : 1) * (this.flying ? 1 : this.zoom);
    const want = new THREE.Vector3(look.x + off[0] * k, look.y + off[1] * k, look.z + off[2] * k);
    if (this.snapCamera) { this.camera.position.copy(want); this.snapCamera = false; }
    else this.camera.position.lerp(want, Math.min(1, dt * 6));
    this.camera.lookAt(look);
    this.camYaw = Math.atan2(this.camera.position.x - look.x, this.camera.position.z - look.z);
    // 해는 보고 있는 곳을 따라다니며 그림자를 만든다
    this.sun.position.set(look.x + 14, 32, look.z + 16);
    this.sun.target.position.set(look.x, 0, look.z);
    if (this.minimap && this.area === 'plaza' && !this.spectating && T - (this.mapT || 0) > 0.12) { this.mapT = T; this.drawMinimap(this.minimap); }
    this.renderer.render(this.scene, this.camera);
  }

  getState() { return { x: Math.round(this.pos.x * 100) / 100, z: Math.round(this.pos.z * 100) / 100, r: Math.round(this.rot * 100) / 100, a: this.area }; }
}
