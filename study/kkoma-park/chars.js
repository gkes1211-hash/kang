// 꼬마 탐험대 공원: 2D 픽셀아트 캐릭터 (부품을 겹쳐 그리기)
// chars/parts.png 한 장에 앞모습·옆모습 부품이 모두 있고, chars/parts.json 에 자리와 몸 치수가 있다.
// 앞모습(front)·옆모습(side, 오른쪽을 본다)·뒷모습(back)을 그려 캔버스로 돌려준다.

// ---------- 고를 수 있는 것 ----------
export const SKINS = 8;
export const FACES = [['0', '😄 활짝'], ['1', '😆 방긋'], ['2', '😝 찡긋'], ['3', '😮 놀람'], ['4', '🤩 반짝'], ['5', '🤓 안경'], ['6', '😌 생글'], ['7', '😜 메롱'],
  ['8', '😊 미소'], ['9', '😢 눈물'], ['10', '🙂 빙긋'], ['11', '😠 뿌우'], ['12', '😍 하트 눈'], ['13', '😋 냠냠'], ['14', '😘 쪽'], ['15', '😳 깜짝']].map(([id, l]) => [Number(id), l]);
export const FRONTS = [[0, '덥수룩 앞머리'], [1, '단발 앞머리'], [2, '둥근 단발'], [3, '양갈래'], [4, '삐죽 앞머리'], [5, '짧은 단발'], [6, '별핀 단발'], [7, '똥머리']];
export const BACKS = [[-1, '없음'], [0, '짧게'], [1, '덥수룩'], [2, '단발'], [3, '양갈래'], [4, '긴 웨이브'], [5, '긴 생머리'], [6, '땋은 머리'], [7, '긴 머리']];
export const TOPS = [[0, '별 티셔츠'], [1, '후드티'], [2, '셔츠'], [3, '카디건'], [4, '세일러복'], [5, '조끼'], [6, '집업'], [7, '토끼 후드'],
  [8, '멜빵 옷'], [9, '운동복'], [10, '재킷'], [11, '반팔 셔츠'], [12, '하트 니트'], [13, '줄무늬 니트'], [14, '코트'], [15, '리본 블라우스']];
export const BOTTOMS = [[0, '반바지'], [1, '청바지'], [2, '하얀 치마'], [3, '체크 치마'], [4, '주름 치마'], [5, '롤업 바지'], [6, '벨트 반바지'], [7, '플리츠 치마']];
export const SHOES = [[0, '운동화'], [1, '하이탑'], [2, '캔버스화'], [3, '구두'], [4, '부츠'], [5, '털 부츠'], [6, '실내화'], [7, '리본 운동화']];
export const HAIR_COLORS = ['#7a4a35', '#3a2a24', '#c98a4a', '#f2cf63', '#ef7aa8', '#8a6ad8', '#5cc0b0', '#e8743c', '#c9c9d6', '#5a7ae0'];
export const CLOTH_COLORS = ['#ffffff', '#ffd36b', '#ff9aa8', '#9fd6ff', '#a8e08a', '#c9a8ff', '#ff9f6b', '#5b6bbf', '#3b3b4f', '#f2ead8'];
// [아이디, 이름, 열쇠 수(0 = 처음부터)]
export const HATS = [['none', '없음', 0], ['cap', '🧢 야구모자', 0], ['beret', '🎨 베레모', 0], ['catphones', '🐱 고양이 헤드폰', 0], ['witch', '🧙 마녀 모자', 6], ['crown', '👑 왕관', 14]];
export const DECOS = [['none', '없음', 0], ['bow', '🎀 리본', 0], ['flower', '🌸 꽃핀', 0], ['ribbon', '💜 보라 리본', 0], ['butterfly', '🦋 나비 핀', 2]];
export const GLASSES = [['none', '없음', 0], ['glasses', '👓 동글 안경', 0], ['heart', '💗 하트 안경', 9]];
export const GEARS = [['none', '없음', 0], ['backpack', '🎒 가방', 0], ['bag', '👜 크로스백', 0], ['wings', '🦋 날개', 3], ['cape', '🦸 망토', 5], ['wand', '🪄 요술봉', 8]];
export const PETS = [['none', '없음', 0], ['chick', '🐥 병아리', 1], ['puppy', '🐶 강아지', 4], ['kitty', '🐱 고양이', 7], ['turtle', '🐢 거북이', 12], ['dragon', '🐉 아기 용', 18]];
export const CATS = { hat: HATS, deco: DECOS, glasses: GLASSES, gear: GEARS, pet: PETS };
export const SPECIALS = Object.entries(CATS).flatMap(([cat, list]) => list.filter((x) => typeof x[2] === 'number' && x[2] > 0).map(([id, label, need]) => ({ cat, id, label, need }))).sort((a, b) => a.need - b.need);
export const nextSpecial = (keys) => SPECIALS.find((s) => s.need > keys) || null;

// 직업 옷: 직업 체험관에서 체험하면 열린다. 그 직업다운 옷·소품 묶음으로 갈아입힌다
export const JOB_OUTFITS = [
  ['none', '없음', 0], ['doctor', '👩‍⚕️ 의사 가운', 'job:doctor'], ['chef', '🧑‍🍳 요리사 옷', 'job:chef'], ['vet', '🐶 수의사 옷', 'job:vet'],
  ['police', '👮 경찰 제복', 'job:police'], ['reporter', '📰 기자 옷', 'job:reporter'], ['architect', '🏗️ 건축가 옷', 'job:architect'],
  ['weather', '🌦️ 기상캐스터 옷', 'job:weather'], ['crew', '✈️ 승무원 제복', 'job:crew'], ['designer', '🎨 디자이너 옷', 'job:designer'],
  ['composer', '🎼 작곡가 옷', 'job:composer'], ['ai', '🤖 AI 개발자 옷', 'job:ai'], ['drone', '🚁 드론 조종사 옷', 'job:drone'],
];
CATS.job = JOB_OUTFITS;
const JOB_LOOK = {
  doctor: { top: 14, topColor: '#ffffff', glasses: 'glasses' }, chef: { top: 15, topColor: '#ffffff', hat: 'none', deco: 'none' },
  vet: { top: 9, topColor: '#a8e08a' }, police: { top: 10, topColor: '#5b6bbf', hat: 'cap', bottom: 1 },
  reporter: { top: 3, topColor: '#f2ead8', gear: 'bag' }, architect: { top: 8, topColor: '#ffd36b', hat: 'cap' },
  weather: { top: 10, topColor: '#9fd6ff' }, crew: { top: 10, topColor: '#3b3b4f', deco: 'ribbon' },
  designer: { top: 13, topColor: '#ff9aa8', hat: 'beret' }, composer: { top: 10, topColor: '#3b3b4f', hat: 'catphones' },
  ai: { top: 6, topColor: '#c9a8ff', glasses: 'glasses' }, drone: { top: 9, topColor: '#a8e08a', gear: 'backpack' },
};

const pickN = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[pickN(a.length)];
export function randomLook(keys = 0) {
  const open = (list) => list.filter((x) => typeof x[2] === 'number' && x[2] <= keys).map((x) => x[0]);
  return {
    v: 2, skin: pickN(8), face: pick([0, 1, 4, 6, 8, 10, 12]), front: pickN(8), back: pick([-1, 0, 2, 3, 4, 5, 7]), hairColor: pick(HAIR_COLORS),
    top: pickN(16), topColor: pick(CLOTH_COLORS), bottom: pickN(8), bottomColor: pick(CLOTH_COLORS), shoe: pickN(8), shoeColor: pick(CLOTH_COLORS),
    hat: Math.random() < 0.6 ? 'none' : pick(open(HATS)), deco: Math.random() < 0.6 ? 'none' : pick(open(DECOS)), glasses: Math.random() < 0.8 ? 'none' : pick(open(GLASSES)),
    gear: Math.random() < 0.6 ? 'none' : pick(open(GEARS)), pet: Math.random() < 0.5 ? 'none' : pick(open(PETS)), job: 'none',
  };
}
// 받은 look 을 믿을 수 있는 값으로만. 예전(3D) 모습이면 새로 만든다.
// jobs: 체험한 직업 목록 (null 이면 친구 모습처럼 모두 믿는다)
export function cleanLook(l = {}, keys = 99, jobs = null) {
  if (!l || l.v !== 2) { const r = randomLook(0); if (l && typeof l.pet === 'string') r.pet = l.pet; l = { ...r, pet: r.pet }; }
  const int = (v, n, d) => (Number.isInteger(v) && v >= 0 && v < n ? v : d);
  const col = (v, d) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d);
  const open = (need) => (typeof need === 'string' ? (jobs === null || jobs.includes(need.slice(4))) : need <= keys);
  const lock = (cat, v) => (CATS[cat].some((x) => x[0] === v && open(x[2])) ? v : 'none');
  return {
    v: 2, skin: int(l.skin, 8, 0), face: int(l.face, 16, 0), front: int(l.front, 8, 0), back: Number.isInteger(l.back) && l.back >= -1 && l.back < 8 ? l.back : 0,
    hairColor: col(l.hairColor, HAIR_COLORS[0]), top: int(l.top, 16, 0), topColor: col(l.topColor, '#ffffff'), bottom: int(l.bottom, 8, 0), bottomColor: col(l.bottomColor, '#9fd6ff'),
    shoe: int(l.shoe, 8, 0), shoeColor: col(l.shoeColor, '#ffffff'),
    hat: lock('hat', l.hat), deco: lock('deco', l.deco), glasses: lock('glasses', l.glasses), gear: lock('gear', l.gear), pet: lock('pet', l.pet), job: lock('job', l.job),
  };
}
// 직업 옷을 입었으면 그 직업 묶음으로 바꾼 모습
function wearing(L) { return L.job && L.job !== 'none' && JOB_LOOK[L.job] ? { ...L, ...JOB_LOOK[L.job] } : L; }

// ---------- 그림 불러오기 ----------
let META = null; let ATLAS = null; let ready = null;
const base = new URL('./chars/', import.meta.url);
export function loadChars() {
  if (ready) return ready;
  ready = Promise.all([
    fetch(new URL('parts.json', base)).then((r) => r.json()),
    new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = new URL('parts.png', base).href; }),
  ]).then(([m, im]) => { META = m; ATLAS = im; });
  return ready;
}
export const charsReady = () => !!META;

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
// 부품 하나를 (색을 바꿔서) 작은 캔버스로. 같은 부품·같은 색은 다시 쓰기
const partCache = new Map();
function partCanvas(name, recolor = null, color = null, flip = false, flat = false) {
  const key = `${name}|${recolor}|${color}|${flip}|${flat}`;
  if (partCache.has(key)) return partCache.get(key);
  const [x, y, w, h] = META.rects[name];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (flip) { g.translate(w, 0); g.scale(-1, 1); }
  g.drawImage(ATLAS, x, y, w, h, 0, 0, w, h);
  if (recolor || flat) {
    const id = g.getImageData(0, 0, w, h); const d = id.data;
    const [tr, tg, tb] = color ? hex(color) : [0, 0, 0];
    let br = 0; let bg = 0; let bb = 0;
    if (flat) { // 옷의 바탕색(가장 많은 밝은 색)
      const cnt = new Map(); for (let i = 0; i < d.length; i += 4) { if (d[i + 3] && Math.max(d[i], d[i + 1], d[i + 2]) > 90) { const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); cnt.set(k, (cnt.get(k) || 0) + 1); } }
      let best = 0; let bk = 0; for (const [k, n] of cnt) if (n > best) { best = n; bk = k; }
      br = ((bk >> 8) & 15) * 16 + 8; bg = ((bk >> 4) & 15) * 16 + 8; bb = (bk & 15) * 16 + 8;
    }
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i]; const gg = d[i + 1]; const b = d[i + 2];
      const mx = Math.max(r, gg, b); const mn = Math.min(r, gg, b);
      if (recolor === 'cloth' && mx - mn < 40 && mx > 150) { const v = mx / 255; d[i] = tr * v; d[i + 1] = tg * v; d[i + 2] = tb * v; }
      if (recolor === 'hair' && (r - b > 25 || (r > 60 && r - b > 10))) {
        const f = ((0.3 * r + 0.59 * gg + 0.11 * b) / 112) ** 1.1;
        const m = (cc) => Math.max(0, Math.min(255, f < 1 ? cc * f : cc + (255 - cc) * (f - 1) * 0.8));
        d[i] = m(tr); d[i + 1] = m(tg); d[i + 2] = m(tb);
      }
    }
    if (flat) { // 바깥 테두리 3칸 안쪽은 바탕색으로 (앞쪽 무늬 지우기)
      const a = (xx, yy) => (xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : d[(yy * w + xx) * 4 + 3]);
      const fl = recolor === 'cloth' && color ? (() => { const mx = Math.max(br, bg, bb) / 255; return [tr * mx, tg * mx, tb * mx]; })() : [br, bg, bb];
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const i = (yy * w + xx) * 4; if (!d[i + 3] || Math.max(d[i], d[i + 1], d[i + 2]) < 90) continue;
        if (!a(xx - 2, yy) || !a(xx + 2, yy) || !a(xx, yy - 2) || !a(xx, yy + 2)) continue;
        d[i] = fl[0] * 0.97; d[i + 1] = fl[1] * 0.97; d[i + 2] = fl[2] * 0.97;
      }
    }
    g.putImageData(id, 0, 0);
  }
  partCache.set(key, c);
  return c;
}
// 부품의 원래(시트) 크기
const fullW = (n) => META.full[n][0]; const fullH = (n) => META.full[n][1];

// ---------- 그리기 ----------
// 단위: 시트 픽셀. 캐릭터 캔버스는 CW×CH 단위, 실제 캔버스는 반 크기
export const CW = 240; export const CH = 320; const K = 2;
function put(g, cnv, name, x, y, w, h) { g.drawImage(cnv, Math.round(x / K), Math.round(y / K), Math.max(1, Math.round(w / K)), Math.max(1, Math.round(h / K))); }
const ACC_FRONT = { // [그림 번호, 너비(머리 110 대비), x(머리 가운데 기준, 머리 너비 비), y(머리 위 기준, 머리 높이 비)]
  cap: [0, 1.02, 0, -0.1], beret: [1, 0.9, 0.05, -0.08], bow: [2, 0.42, 0.28, 0.02], flower: [3, 0.26, 0.32, 0.08], catphones: [4, 1.12, 0, 0], crown: [5, 0.5, 0, -0.18],
  glasses: [6, 0.72, 0, 0.52], heart: [7, 0.72, 0, 0.52], backpack: [8, 0.55, 0.42, 1.05], wings: [9, 1.4, 0, 1.0], cape: [10, 1.0, 0, 1.0], witch: [11, 1.05, 0, -0.42],
  ribbon: [12, 0.42, -0.28, 0], bag: [13, 0.38, 0.45, 1.35], wand: [14, 0.3, 0.55, 1.15], butterfly: [15, 0.36, 0.3, 0.04],
};
const BEHIND = new Set(['backpack', 'wings', 'cape']);

function frontBody(L) {
  const bm = META.body[L.skin]; const k = 109 / bm.head_w;
  const bw = fullW(`body${L.skin}`) * k; const bh = fullH(`body${L.skin}`) * k;
  const bx = (CW - bw) / 2; const by = CH - 14 - bh;
  return { k, bw, bh, bx, by, cx: CW / 2, fy: by - 2, neck: by + bm.neck * k, hip: by + bm.hip * k, bottom: by + bm.bottom * k, legW: bm.leg_w * k, armW: bm.arm_w * k, hipW: bm.hip_w * k };
}
function drawFrontClothes(g, L, B, flat = false, flip = false) {
  const sh = `shoe${L.shoe}`; let w = B.legW * 1.1; let h = fullH(sh) * w / fullW(sh);
  put(g, partCanvas(sh, 'cloth', L.shoeColor, flip, flat), sh, B.cx - w / 2, B.bottom - h + 2, w, h);
  const bo = `bot${L.bottom}`; w = B.hipW * 1.18; h = fullH(bo) * w / fullW(bo);
  put(g, partCanvas(bo, 'cloth', L.bottomColor, flip, flat), bo, B.cx - w / 2, B.hip - 10 - h / 3, w, h);
  const tp = `top${L.top}`; const kk = Math.min((B.hip - B.neck + 14) / fullH(tp), B.armW * 1.02 / fullW(tp));
  w = fullW(tp) * kk; h = fullH(tp) * kk;
  put(g, partCanvas(tp, 'cloth', L.topColor, flip, flat), tp, B.cx - w / 2, B.neck - 6, w, h);
}
function drawAccFront(g, id, B, flip = false) {
  const a = ACC_FRONT[id]; if (!a) return;
  const n = `acc${a[0]}`; const w = 110 * a[1]; const h = fullH(n) * w / fullW(n);
  const x = B.cx + (flip ? -a[2] : a[2]) * 110 - w / 2;
  put(g, partCanvas(n, null, null, flip), n, x, B.fy + a[3] * 105, w, h);
}

function drawFront(g, L) {
  const B = frontBody(L);
  const SM = Object.values(META.hf).reduce((s, v) => s + v.s, 0) / 8;
  if (L.back >= 0) { const n = `hb${L.back}`; const w = fullW(n) / SM; const h = fullH(n) / SM; put(g, partCanvas(n, 'hair', L.hairColor), n, B.cx - w / 2, B.fy - 8 - 4 / SM, w, h); }
  for (const id of [L.gear]) if (BEHIND.has(id)) drawAccFront(g, id, B);
  put(g, partCanvas(`body${L.skin}`), `body${L.skin}`, B.bx, B.by, B.bw, B.bh);
  drawFrontClothes(g, L, B);
  const fn = `face${L.face}`; const fw = fullW(fn); const fh = fullH(fn);
  const fx = B.cx - fw / 2; put(g, partCanvas(fn), fn, fx, B.fy, fw, fh);
  const d = META.hf[String(L.front)]; const hn = `hf${L.front}`;
  put(g, partCanvas(hn, 'hair', L.hairColor), hn, fx - d.ox / d.s, B.fy - d.oy / d.s, d.w / d.s, d.h / d.s);
  for (const id of [L.glasses === 'heart' ? 'heart' : L.glasses, L.deco, L.hat]) if (id && id !== 'none') drawAccFront(g, id, B);
  if (L.gear && !BEHIND.has(L.gear)) drawAccFront(g, L.gear, B);
}

// 뒷모습 머리: 옆모습 시트의 "뒷머리" 줄 (진짜 뒤에서 본 머리)
function backHairIndex(L) {
  if ([4, 6].includes(L.back)) return 6; if ([5, 7].includes(L.back)) return 7;
  if (L.front === 7) return 5; if (L.back === 3 || L.front === 3) return 3;
  if (L.back === 2 || [1, 2, 5, 6].includes(L.front)) return 2; if (L.front === 4 || L.back === 1) return 1; return 0;
}
function drawBack(g, L) {
  const B = frontBody(L);
  put(g, partCanvas(`body${L.skin}`), `body${L.skin}`, B.bx, B.by, B.bw, B.bh);
  drawFrontClothes(g, L, B, true, true);
  // 뒤통수: 기준 머리 모양을 머리색으로 채운 뒤 뒷머리
  const fn = 'face0'; const fw = fullW(fn); const fh = fullH(fn);
  const sk = partCanvas('face0', 'skull', L.hairColor);
  if (!sk.done) {
    const sg = sk.getContext('2d'); const id = sg.getImageData(0, 0, sk.width, sk.height); const d = id.data; const [r, gg, b] = hex(L.hairColor);
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const dark = Math.max(d[i], d[i + 1], d[i + 2]) < 100; d[i] = dark ? 70 : r * 0.85; d[i + 1] = dark ? 40 : gg * 0.85; d[i + 2] = dark ? 35 : b * 0.85; }
    sg.putImageData(id, 0, 0); sk.done = true;
  }
  put(g, sk, fn, B.cx - fw / 2, B.fy, fw, fh);
  const n = `sback${backHairIndex(L)}`; const s = 1.62; const w = fullW(n) * s; const h = fullH(n) * s;
  put(g, partCanvas(n, 'hair', L.hairColor), n, B.cx - w / 2, B.fy - 12, w, h);
  for (const id of [L.gear]) if (id && id !== 'none') drawAccFront(g, id, B, true);
  for (const id of [L.deco, L.hat]) if (id && id !== 'none') drawAccFront(g, id, B, true);
}

// ---------- 옆모습 (오른쪽을 본다) ----------
const SIDE_SKIN = [0, 1, 2, 4, 0, 2, 3, 4];
const SIDE_FACE = [0, 6, 2, 3, 0, 5, 6, 7, 0, 3, 4, 1, 0, 7, 6, 3];
const SIDE_TOP = [0, 1, 2, 3, 4, 2, 6, 7, 5, 6, 6, 2, 0, 0, 3, 2];
const SIDE_BOT = [0, 1, 2, 3, 2, 1, 0, 3];
const SIDE_SHOE = [0, 1, 2, 1, 1, 2, 0, 3];
function sideHairIndex(L) {
  if ([4, 5, 6, 7].includes(L.back)) return 7; if (L.back === 3 || L.front === 3) return 3;
  if (L.front === 7) return 6; if (L.front === 0) return 0; if (L.front === 4) return 1; return 2;
}
const ACC_SIDE = { // [옆 그림 번호, 너비(머리 90 대비), x(머리 왼쪽 기준, 머리 너비 비), y(머리 위 기준, 머리 높이 비)]
  cap: [0, 1.05, 0.52, -0.12], beret: [1, 0.95, 0.48, -0.1], bow: [2, 0.48, 0.12, 0.12], ribbon: [2, 0.48, 0.12, 0.12], flower: [3, 0.34, 0.22, 0.06], butterfly: [3, 0.34, 0.22, 0.06],
  catphones: [4, 1.0, 0.45, 0.0], crown: [5, 0.55, 0.45, -0.2], witch: [6, 1.15, 0.45, -0.5], glasses: [7, 0.62, 0.86, 0.5], heart: [7, 0.62, 0.86, 0.5],
  backpack: [8, 0.7, -0.08, 1.12], wings: [9, 0.9, -0.12, 0.98], cape: [10, 0.75, 0.12, 1.0], wand: [11, 0.5, 0.82, 1.12],
};
function drawAccSide(g, id, S) {
  const a = ACC_SIDE[id]; if (!a) return;
  const n = `sacc${a[0]}`; const w = 90 * a[1]; const h = fullH(n) * w / fullW(n);
  put(g, partCanvas(n), n, S.hx + a[2] * 90 - w / 2, S.hy + a[3] * 112, w, h);
}
function drawSide(g, L) {
  const si = SIDE_SKIN[L.skin]; const bm = META.sbody[si]; const bn = `sbody${si}`;
  const bw = fullW(bn); const bh = fullH(bn); const bx = (CW - bw) / 2; const by = CH - 14 - bh;
  const S = { hx: bx, hy: by - 2, neck: by + bm.neck, bottom: by + bm.bottom, chestC: bx + (bm.chest_l + bm.chest_r) / 2, legC: bx + (bm.leg_l + bm.leg_r) / 2 };
  for (const id of [L.gear]) if (BEHIND.has(id)) drawAccSide(g, id, S);
  if (L.gear === 'bag') drawAccSide(g, 'backpack', S);
  // 긴 머리는 몸 뒤로
  put(g, partCanvas(bn), bn, bx, by, bw, bh);
  const sh = `sshoe${SIDE_SHOE[L.shoe]}`; let w = fullW(sh) * 0.86; let h = fullH(sh) * 0.86;
  put(g, partCanvas(sh, 'cloth', L.shoeColor), sh, S.legC - w / 2 + 4, S.bottom - h + 3, w, h);
  const bo = `sbot${SIDE_BOT[L.bottom]}`; w = fullW(bo) * 0.86; h = fullH(bo) * 0.86;
  put(g, partCanvas(bo, 'cloth', L.bottomColor), bo, S.legC - w / 2 + 2, S.neck + 50, w, h);
  const tp = `stop${SIDE_TOP[L.top]}`; w = fullW(tp) * 0.9; h = fullH(tp) * 0.9;
  put(g, partCanvas(tp, 'cloth', L.topColor), tp, S.chestC - w / 2 + 2, S.neck - 4, w, h);
  const fn = `sface${SIDE_FACE[L.face]}`; put(g, partCanvas(fn), fn, S.hx, S.hy, fullW(fn), fullH(fn));
  const hi = sideHairIndex(L); const d = META.shf[String(hi)]; const hn = `shf${hi}`;
  put(g, partCanvas(hn, 'hair', L.hairColor), hn, S.hx + d.ox, S.hy + d.oy, d.w * d.S, d.h * d.S);
  for (const id of [L.glasses === 'heart' ? 'heart' : L.glasses, L.deco, L.hat]) if (id && id !== 'none') drawAccSide(g, id, S);
  if (L.gear === 'wand') drawAccSide(g, 'wand', S);
}

// look → 캔버스 (보는 방향: 'front' | 'back' | 'side' | 'sideL')
const cache = new Map();
export function drawChar(look, view = 'front') {
  if (!META) return null;
  const L = wearing(cleanLook(look));
  const key = `${view}|${JSON.stringify(L)}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = CW / K; c.height = CH / K;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (view === 'back') drawBack(g, L);
  else if (view === 'side' || view === 'sideL') drawSide(g, L);
  else drawFront(g, L);
  let out = c;
  if (view === 'sideL') { out = document.createElement('canvas'); out.width = c.width; out.height = c.height; const og = out.getContext('2d'); og.translate(c.width, 0); og.scale(-1, 1); og.drawImage(c, 0, 0); }
  if (cache.size > 400) cache.clear();
  cache.set(key, out);
  return out;
}

// 꾸미기 화면용 작은 부품 그림 (kind: 'skin' | 'face' | 'front' | 'back' | 'top' | 'bottom' | 'shoe')
export function partThumb(kind, i, color = null) {
  if (!META) return null;
  const name = { skin: `body${i}`, face: `face${i}`, front: `hf${i}`, back: `hb${i}`, top: `top${i}`, bottom: `bot${i}`, shoe: `shoe${i}` }[kind];
  if (!name || !META.rects[name]) return null;
  const rec = kind === 'front' || kind === 'back' ? 'hair' : ['top', 'bottom', 'shoe'].includes(kind) ? 'cloth' : null;
  return partCanvas(name, rec, color);
}
