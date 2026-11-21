// 꼬마 탐험대 공원: 2D 픽셀아트 캐릭터를 부품으로 직접 꾸민다
// chars/parts.png 한 장에 몸(피부 5)·표정 10·머리(앞·뒤) 10·윗옷 10·아래옷 5·신발 5·소품 12 가 들어 있다.
// chars/parts.json: rects[이름] = [그림 x, y, 너비, 높이, 틀 안 x, 틀 안 y], fw·fh = 캐릭터 틀 크기
// 표정은 "몸 색에 더할 값(+128)"으로 저장돼 있어 어떤 피부에도 맞는다.
// 옷·머리 색은 그림의 밝기를 살려 고른 색으로 바꾼다. 마을에서는 걷는 방향에 따라 앞·뒤·옆(뒤집기) 모습이 된다.

export const SKINS = ['아주 밝은 피부', '밝은 피부', '살구빛 피부', '갈색 피부', '진한 갈색 피부'];
export const FACES = ['활짝 웃음', '방긋 미소', '윙크', '반짝 눈', '하트 눈', '깜짝', '심드렁', '메롱', '동글 안경', '부끄부끄'];
export const HAIRS = ['부스스 머리', '덮은 머리', '삐죽 머리', '바가지 머리', '단발', '양 갈래', '옆 포니테일', '똥 머리', '곱슬 머리', '긴 생머리'];
export const TOPS = ['별 티셔츠', '후드티', '셔츠', '세일러 옷', '블라우스', '줄무늬 티', '야구 점퍼', '청재킷', '카디건', '멜빵 원피스'];
export const BOTTOMS = ['반바지', '긴바지', '주름치마', '미니 스커트', '멜빵 반바지'];
export const SHOES = ['운동화', '하이탑', '구두', '장화', '리본 운동화'];
// 소품: [이름, 자리]. 같은 자리에는 하나만 달 수 있다
export const ACCS = [
  ['야구 모자', 'hat'], ['베레모', 'hat'], ['왕관', 'hat'], ['헤드폰', 'hat'], ['고양이 머리띠', 'hat'], ['분홍 리본', 'pin'],
  ['동그란 안경', 'eye'], ['책가방', 'back'], ['나비 날개', 'back'], ['망토', 'back'], ['요술봉', 'hand'], ['꽃 핀', 'pin'],
];
export const SLOTS = ['hat', 'pin', 'eye', 'back', 'hand'];
// 부품마다 정해진 색 (null = 그림 원래 색). 색을 따로 고르지 않고, 색이 입혀진 완성 그림을 고른다
const HAIR_COLORS = [null, '#2b211e', '#c0703a', '#3a2620', '#f0c85f', '#f2a7c0', null, '#2b211e', '#8a6fe0', '#c0703a'];
const TOP_COLORS = [null, '#ff9ccf', '#8cc8ff', null, '#ffc9dc', '#6fb6ff', '#5f7fe0', '#7fa8e0', '#ffe07a', '#b79cff'];
const BOT_COLORS = ['#5f7fe0', '#4a5a8a', '#ff9ccf', '#b79cff', '#7fa8e0'];
const SHOE_COLORS = [null, '#e0565b', '#7a4a36', '#ffd24a', '#ff9ccf'];
const COLORS = { hair: HAIR_COLORS, top: TOP_COLORS, bot: BOT_COLORS, shoe: SHOE_COLORS };
const colorOf = (kind, i) => COLORS[kind][i] ?? null;

// [아이디, 이름, 열쇠 수(0 = 처음부터)]
export const PETS = [['none', '없음', 0], ['chick', '🐥 병아리', 1], ['puppy', '🐶 강아지', 4], ['kitty', '🐱 고양이', 7], ['turtle', '🐢 거북이', 12], ['dragon', '🐉 아기 용', 18]];
// 직업 배지: 직업 체험관에서 체험하면 열리고, 이름표 옆에 달린다
export const JOB_BADGES = [
  ['none', '없음', 0], ['doctor', '👩‍⚕️ 의사', 'job:doctor'], ['chef', '🧑‍🍳 요리사', 'job:chef'], ['vet', '🐶 수의사', 'job:vet'],
  ['police', '👮 경찰관', 'job:police'], ['reporter', '📰 기자', 'job:reporter'], ['architect', '🏗️ 건축가', 'job:architect'],
  ['weather', '🌦️ 기상캐스터', 'job:weather'], ['crew', '✈️ 승무원', 'job:crew'], ['designer', '🎨 디자이너', 'job:designer'],
  ['composer', '🎼 작곡가', 'job:composer'], ['ai', '🤖 AI 개발자', 'job:ai'], ['drone', '🚁 드론 조종사', 'job:drone'],
];
export const jobEmoji = (id) => { const j = JOB_BADGES.find((x) => x[0] === id); return j && id !== 'none' ? j[1].split(' ')[0] : ''; };
export const CATS = { pet: PETS, job: JOB_BADGES };

// ---------- 열쇠로 여는 부품 ----------
// 처음에 열린 것 말고는, 열쇠를 하나 모을 때마다 아래 차례대로 하나씩 열린다
export const PART_KINDS = { face: FACES, hair: HAIRS, top: TOPS, bot: BOTTOMS, shoe: SHOES, acc: ACCS };
const KIND_ICON = { face: '😊', hair: '💇', top: '👕', bot: '👖', shoe: '👟', acc: '🎀' };
const UNLOCK_ORDER = [
  ['hair', 6], ['top', 6], ['acc', 4], ['face', 6], ['shoe', 3], ['acc', 3], ['hair', 7], ['top', 7], ['bot', 3], ['acc', 11],
  ['face', 7], ['acc', 7], ['hair', 8], ['top', 8], ['shoe', 4], ['face', 8], ['acc', 10], ['bot', 4], ['hair', 9], ['top', 9],
  ['face', 9], ['acc', 9], ['acc', 8], ['acc', 2],
];
export const partNeed = (kind, i) => { const k = UNLOCK_ORDER.findIndex(([a, b]) => a === kind && b === i); return k < 0 ? 0 : k + 1; };
export const partOpen = (kind, i, keys) => partNeed(kind, i) <= keys;
const partName = (kind, i) => { const n = PART_KINDS[kind][i]; return Array.isArray(n) ? n[0] : n; };
export const SPECIALS = [
  ...UNLOCK_ORDER.map(([kind, id], k) => ({ cat: 'part', kind, id, label: `${KIND_ICON[kind]} ${partName(kind, id)}`, need: k + 1 })),
  ...PETS.filter((x) => x[2] > 0).map(([id, label, need]) => ({ cat: 'pet', id, label, need })),
].sort((a, b) => a.need - b.need);
export const nextSpecial = (keys) => SPECIALS.find((s) => s.need > keys) || null;

const openIdx = (kind, keys) => PART_KINDS[kind].map((_, i) => i).filter((i) => partOpen(kind, i, keys));
export function randomLook(keys = 0, rnd = Math.random) {
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const pets = PETS.filter((x) => x[2] <= keys).map((x) => x[0]);
  const L = {
    v: 4, skin: Math.floor(rnd() * SKINS.length), face: pick(openIdx('face', keys)), hair: pick(openIdx('hair', keys)),
    top: pick(openIdx('top', keys)), bot: pick(openIdx('bot', keys)), shoe: pick(openIdx('shoe', keys)),
    hat: -1, pin: -1, eye: -1, back: -1, hand: -1,
    pet: rnd() < 0.5 ? 'none' : pick(pets), job: 'none',
  };
  if (rnd() < 0.5) { const a = pick(openIdx('acc', keys)); L[ACCS[a][1]] = a; }
  return L;
}
// 받은 look 을 믿을 수 있는 값으로만. 예전(완성 캐릭터) 모습이면 새로 만든다 (같이 다니는 친구·배지는 남긴다)
// jobs: 체험한 직업 목록 (null 이면 친구 모습처럼 모두 믿는다)
export function cleanLook(l = {}, keys = 99, jobs = null) {
  l = l || {};
  const open = (need) => (typeof need === 'string' ? (jobs === null || jobs.includes(need.slice(4))) : need <= keys);
  const lock = (list, v) => (list.some((x) => x[0] === v && open(x[2])) ? v : 'none');
  // 예전 모습이면 그 번호로 늘 같은 새 모습을 만든다 (그릴 때마다 바뀌지 않게)
  let seed = (Number(l.char) || 0) * 9301 + 49297;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const base = l.v === 4 ? l : randomLook(0, rnd);
  const int = (v, n, d) => (Number.isInteger(v) && v >= -1 && v < n ? v : d);
  const part = (kind, v) => { const i = int(v, PART_KINDS[kind].length, 0); return i >= 0 && partOpen(kind, i, keys) ? i : 0; };
  const L = {
    v: 4, skin: Math.max(0, int(base.skin, SKINS.length, 0)), face: part('face', base.face), hair: part('hair', base.hair),
    top: part('top', base.top), bot: part('bot', base.bot), shoe: part('shoe', base.shoe),
    pet: lock(PETS, l.pet), job: lock(JOB_BADGES, l.job),
  };
  for (const s of SLOTS) { const a = int(base[s], ACCS.length, -1); L[s] = a >= 0 && ACCS[a][1] === s && partOpen('acc', a, keys) ? a : -1; }
  return L;
}
export const lookColor = (L) => (L && colorOf('top', L.top)) || '#8cc8ff';

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
export const CW = 221; export const CH = 347; // 캐릭터 틀 (parts.json 의 fw·fh, 발이 틀 바닥에 닿는다)

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// 부품 하나를 (색을 바꿔) 캔버스로. 반환: { c, x, y } (틀 안 위치)
const partCache = new Map();
function part(name, mode = '', color = null) {
  const key = `${name}|${mode}|${color}`;
  if (partCache.has(key)) return partCache.get(key);
  const r = META.rects[name]; if (!r) return null;
  const [ax, ay, w, h, x, y] = r;
  const c = mk(w, h); const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(ATLAS, ax, ay, w, h, 0, 0, w, h);
  if (color) {
    const im = g.getImageData(0, 0, w, h); const d = im.data; const t = hex(color);
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const R = d[i]; const G = d[i + 1]; const B = d[i + 2];
      if (mode === 'hair') {
        if (R - B <= 15) continue; // 머리카락 색(따뜻한 갈색)만
        const f = (0.3 * R + 0.59 * G + 0.11 * B) / 112;
        for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, f < 1 ? t[k] * f : t[k] + (255 - t[k]) * (f - 1) * 0.8);
      } else {
        const mx = Math.max(R, G, B); const mn = Math.min(R, G, B);
        if (mx - mn >= 30 || mx <= 140) continue; // 흰 천만 물들인다 (무늬·테두리는 그대로)
        for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, t[k] * (mx / 255) * 1.02);
      }
    }
    g.putImageData(im, 0, 0);
  }
  const p = { c, x, y }; partCache.set(key, p); return p;
}
// 몸 + 표정 (표정은 몸 색에 값을 더한다)
function bodyWithFace(skin, face) {
  const key = `bf|${skin}|${face}`;
  if (partCache.has(key)) return partCache.get(key);
  const b = part(`body${skin}`); const f = META.rects[`face${face}`];
  const c = mk(b.c.width, b.c.height); const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(b.c, 0, 0);
  if (f && face >= 0) {
    const [ax, ay, w, h, x, y] = f; const fx = x - b.x; const fy = y - b.y;
    const fc = mk(w, h); const fg = fc.getContext('2d', { willReadFrequently: true }); fg.drawImage(ATLAS, ax, ay, w, h, 0, 0, w, h);
    const fd = fg.getImageData(0, 0, w, h).data; const im = g.getImageData(fx, fy, w, h); const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!fd[i + 3] || !d[i + 3]) continue;
      for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, d[i + k] + fd[i + k] - 128));
    }
    g.putImageData(im, fx, fy);
  }
  const p = { c, x: b.x, y: b.y }; partCache.set(key, p); return p;
}
// 뒷모습 머리: 머리 모양(목 위)을 머리카락 색으로 칠한다 (뒷머리 그림이 덮지 못한 틈 메우기)
function backHead(skin, hairColor) {
  const key = `bh|${skin}|${hairColor}`;
  if (partCache.has(key)) return partCache.get(key);
  const b = part(`body${skin}`); const w = b.c.width; const h = b.c.height;
  const src = b.c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  // 목: 위쪽 절반에서 가장 넓은 줄의 절반보다 좁아지는 첫 줄
  const rowW = []; for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < w; x++) if (src[(y * w + x) * 4 + 3] > 0) n++; rowW.push(n); }
  const hw = Math.max(...rowW.slice(0, h >> 1)); let neck = h >> 2; while (neck < h && rowW[neck] >= hw * 0.5) neck++;
  const c = mk(w, neck); const g = c.getContext('2d'); const im = g.createImageData(w, neck); const d = im.data; const t = hex(hairColor);
  for (let i = 0; i < w * neck * 4; i += 4) {
    if (!src[i + 3]) continue;
    const l = (0.3 * src[i] + 0.59 * src[i + 1] + 0.11 * src[i + 2]) / 255;
    const f = l < 0.45 ? 0.45 : 0.78 + (l - 0.8) * 0.6; // 테두리는 어둡게, 안쪽은 머리색
    for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, t[k] * f));
    d[i + 3] = src[i + 3];
  }
  g.putImageData(im, 0, 0);
  const p = { c, x: b.x, y: b.y }; partCache.set(key, p); return p;
}

// look → 캔버스(CW×CH). view: 'front' | 'sideL'(왼쪽 보기 = 뒤집기) | 'back' | 'backL'
const cache = new Map();
export function drawChar(look, view = 'front') {
  if (!META) return null;
  const L = cleanLook(look);
  const flip = view === 'sideL' || view === 'backL'; const back = view === 'back' || view === 'backL';
  const key = `${JSON.stringify([L.skin, L.face, L.hair, L.top, L.bot, L.shoe, L.hat, L.pin, L.eye, L.back, L.hand])}|${flip}|${back}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(META.fw, META.fh); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (flip) { g.translate(META.fw, 0); g.scale(-1, 1); }
  const put = (p) => { if (p) g.drawImage(p.c, p.x, p.y); };
  const hc = colorOf('hair', L.hair);
  const hair = (n) => part(n, 'hair', hc);
  const cloth = () => {
    put(part(`shoe${L.shoe}`, 'cloth', colorOf('shoe', L.shoe)));
    put(part(`bot${L.bot}`, 'cloth', colorOf('bot', L.bot)));
    put(part(`top${L.top}`, 'cloth', colorOf('top', L.top)));
  };
  const acc = (s) => { if (L[s] >= 0) put(part(`acc${L[s]}`)); };
  if (!back) {
    if (L.back === 8) acc('back'); // 날개는 몸 뒤
    put(hair(`hb${L.hair}`));
    put(bodyWithFace(L.skin, L.face));
    cloth();
    if (L.back >= 0 && L.back !== 8) acc('back');
    put(hair(`hf${L.hair}`));
    acc('eye'); acc('hat'); acc('pin'); acc('hand');
  } else {
    put(part(`body${L.skin}`));
    cloth();
    acc('back');
    put(backHead(L.skin, hc || '#7a4a36'));
    put(hair(`hb${L.hair}`)); // 아랫줄 머리 그림 = 뒷모습
    acc('hat'); acc('pin'); acc('hand');
  }
  if (cache.size > 300) cache.clear();
  cache.set(key, c);
  return c;
}

// 캐릭터 그림에서 실제로 그려진 부분(투명하지 않은 곳)의 네모 [x, y, w, h]
const boxCache = new WeakMap();
export function charBox(look, view = 'front') {
  const c = drawChar(look, view); if (!c) return null;
  if (boxCache.has(c)) return boxCache.get(c);
  const b = alphaBox(c); boxCache.set(c, b); return b;
}
function alphaBox(c) {
  const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width; let y0 = c.height; let x1 = 0; let y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 >= x0 ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : [0, 0, c.width, c.height];
}

// 꾸미기 화면의 작은 그림. kind: skin | face | hair | top | bot | shoe | acc
export function drawThumb(kind, i, look) {
  if (!META) return null;
  const L = cleanLook(look);
  let src;
  if (kind === 'face' || kind === 'hair' || kind === 'skin') {
    // 머리 부분만: 몸+표정(+머리)을 그려 목 위를 자른다
    const b = bodyWithFace(kind === 'skin' ? i : L.skin, kind === 'face' ? i : kind === 'skin' ? L.face : 0);
    const c = mk(META.fw, META.fh); const g = c.getContext('2d');
    if (kind === 'hair') { const hb = part(`hb${i}`, 'hair', colorOf('hair', i)); g.drawImage(hb.c, hb.x, hb.y); }
    g.drawImage(b.c, b.x, b.y);
    if (kind === 'hair') { const hf = part(`hf${i}`, 'hair', colorOf('hair', i)); g.drawImage(hf.c, hf.x, hf.y); }
    const headH = Math.round(b.c.height * 0.44);
    const top = kind === 'hair' ? Math.max(0, b.y - 30) : b.y;
    const out = mk(b.c.width + 30, b.y + headH - top); out.getContext('2d').drawImage(c, b.x - 15, top, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  } else {
    const col = kind === 'acc' ? null : colorOf(kind, i);
    src = part(`${kind}${i}`, kind === 'acc' ? '' : 'cloth', col);
  }
  if (!src) return null;
  const [x, y, w, h] = alphaBox(src.c);
  const out = mk(w, h); out.getContext('2d').drawImage(src.c, x, y, w, h, 0, 0, w, h);
  return out;
}
