// 꼬마 탐험대 공원의 섬 지도
// 가운데 분수 광장 섬에서 나무다리 네 개가 공부 섬 · 놀이 섬 · 생활 섬 · 코딩 섬으로 이어진다.
// 새 건물은 그 건물이 속한 섬의 빈 땅(LOTS) 하나를 SLOTS 로 옮겨 쓰면 된다.

// 섬: 가운데(cx, cz)와 가로·세로 반지름(rx, rz). 해안선은 wob 로 살짝 구불구불.
export const ISLANDS = [
  { id: 'hub', name: '분수 광장', emoji: '⛲', cx: 0, cz: 0, rx: 23, rz: 19, wob: 1 },
  { id: 'study', name: '공부 섬', emoji: '📚', color: '#4f9a3e', sub: '국어 · 영어 · 수학 · 사회 · 과학', cx: 0, cz: -66, rx: 79, rz: 25, wob: 2 },
  { id: 'play', name: '놀이 섬', emoji: '🎨', color: '#e2558f', sub: '음악 · 미술 · 체육', cx: -87, cz: 0, rx: 42, rz: 34, wob: 3 },
  { id: 'life', name: '생활 섬', emoji: '🏘️', color: '#e08a1e', sub: '안전 · 경제 · 마음 · 직업', cx: 87, cz: 0, rx: 42, rz: 34, wob: 4 },
  { id: 'coding', name: '코딩 섬', emoji: '💻', color: '#6a5ae0', sub: '순서 · 반복 · 조건 · 신호 · 변수 · 리스트', cx: 0, cz: 68, rx: 79, rz: 26, wob: 5 },
];
export const ISLAND = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));

// 다리: 가운데 섬과 바깥 섬을 잇는 길쭉한 네모 [x0, z0, x1, z1]
export const BRIDGES = [
  { to: 'study', box: [-2.6, -45, 2.6, -16] },
  { to: 'coding', box: [-2.6, 16, 2.6, 46] },
  { to: 'play', box: [-49, -2.6, -19, 2.6] },
  { to: 'life', box: [19, -2.6, 49, 2.6] },
];

// 건물 자리: [x, z, 문 앞 큰길의 z] — 모든 건물은 문이 남쪽(+z, 화면 쪽)을 본다
export const SLOTS = {
  kor: [-55, -68, -52], eng: [-33, -63, -52], math: [-11, -70, -52], soc: [11, -63, -52], sci: [33, -68, -52],
  music: [-86, -14, -2], art: [-64, -14, -2], pe: [-86, 13, 25],
  fire: [64, -14, -2], market: [87, -14, -2], post: [64, 14, 25], job: [87, 14, 25],
  code: [-55, 58, 73], turtle: [-33, 61, 73], bug: [-11, 58, 73],
};
// 빈 땅 (나중에 건물이 들어올 자리). soon 이 있으면 "곧 열려요" 공사장
export const LOTS = [
  { island: 'study', x: 55, z: -63, road: -52 },
  { island: 'play', x: -64, z: 14, road: 25 },
  { island: 'play', x: -108, z: -14, road: -2 },
  { island: 'life', x: 110, z: -14, road: -2 },
  { island: 'coding', x: 11, z: 61, road: 73, soon: ['🔀', '조건 미로 탑'] },
  { island: 'coding', x: 33, z: 58, road: 73, soon: ['🧠', 'AI 학교'] },
  { island: 'coding', x: 55, z: 61, road: 73, soon: ['🎮', '나만의 게임 공방'] },
];

// 섬마다 큰길 (부드러운 선으로 그린다): [점들, 너비]
export const ROADS = [
  // 가운데 섬: 광장에서 다리 네 곳으로
  [[[0, -7], [0, -17]], 3.2], [[[0, 7], [0, 17]], 3.2], [[[-7, 0], [-20, 0]], 3.2], [[[7, 0], [20, 0]], 3.2],
  // 공부 섬: 다리에서 올라와 건물 앞을 동서로
  [[[0, -44], [0, -52]], 3.2], [[[-60, -52], [-30, -53], [0, -52], [30, -53], [60, -52]], 3],
  // 놀이 섬: 다리에서 들어와 뒷줄 앞길(z -2), 가운데 샛길, 앞줄 앞길(z 25)
  [[[-47, 0], [-54, -2], [-118, -2]], 3], [[[-75, -2], [-75, 25]], 2.6], [[[-96, 25], [-54, 25]], 3],
  // 생활 섬
  [[[47, 0], [54, -2], [118, -2]], 3], [[[75, -2], [75, 25]], 2.6], [[[54, 25], [96, 25]], 3],
  // 코딩 섬: 다리에서 건물 사이로 내려와 건물 앞을 동서로
  [[[0, 45], [0, 73]], 3.2], [[[-60, 74], [-30, 73], [0, 73], [30, 73], [60, 74]], 3],
];

// 해안선: 각도에 따라 반지름을 살짝 바꾼다
export function shoreR(isl, ang) { const s = isl.wob; return 1 + 0.05 * Math.sin(3 * ang + s) + 0.035 * Math.sin(5 * ang + 2 * s) + 0.02 * Math.sin(9 * ang + s * 3); }
// (x, z)가 섬 안쪽 어디쯤인지: 0 = 가운데, 1 = 해안선
export function islandT(isl, x, z) {
  const dx = (x - isl.cx) / isl.rx; const dz = (z - isl.cz) / isl.rz;
  return Math.hypot(dx, dz) / shoreR(isl, Math.atan2(dz, dx));
}
export function islandAt(x, z, margin = 0) { return ISLANDS.find((i) => islandT(i, x, z) < 1 - margin) || null; }
export function onBridge(x, z) { return BRIDGES.some(({ box: [x0, z0, x1, z1] }) => x > x0 && x < x1 && z > z0 && z < z1); }
// 걸어 다닐 수 있는 땅: 섬 안쪽(해안선에서 조금 떨어진 곳) 또는 다리 위
export function walkable(x, z) { return onBridge(x, z) || ISLANDS.some((i) => islandT(i, x, z) < 0.955); }
// 해안선 점들 (그리기용)
export function shorePoints(isl, n = 96, scale = 1) {
  const pts = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const r = shoreR(isl, a) * scale; pts.push([isl.cx + Math.cos(a) * isl.rx * r, isl.cz + Math.sin(a) * isl.rz * r]); }
  return pts;
}
