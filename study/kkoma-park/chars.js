// 꼬마 탐험대 공원: 2D 픽셀아트 캐릭터 고르기
// chars/presets.png 에 완성된 캐릭터 32명이 있다 (chars/presets.json: 칸 자리). 하나를 골라 쓴다.
// 마을에서는 걷는 방향에 따라 그림을 좌우로 뒤집는다.

export const CHARACTERS = [
  '하늘 후드 친구', '노란 카디건 친구', '분홍 양갈래 친구', '동글 안경 친구',
  '베레모 친구', '곱슬머리 친구', '보라 긴머리 친구', '주황머리 친구',
  '민트머리 친구', '야구모자 친구', '똥머리 친구', '웨이브 친구',
  '은발 친구', '빨간 리본 친구', '노랑머리 친구', '고양이 헤드폰 친구',
  '별핀 후드 친구', '파란 리본 친구', '헤드폰 친구', '꽃 똥머리 친구',
  '야구 점퍼 친구', '크로스백 친구', '민트 후드 친구', '조끼 안경 친구',
  '보라 고양이귀 친구', '줄무늬 곱슬 친구', '세일러 친구', '별핀 은발 친구',
  '새싹 친구', '꼬마 뿔 친구', '파란 모자 친구', '하얀 리본 친구',
];
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
export const SPECIALS = PETS.filter((x) => x[2] > 0).map(([id, label, need]) => ({ cat: 'pet', id, label, need }));
export const nextSpecial = (keys) => SPECIALS.find((s) => s.need > keys) || null;

export function randomLook(keys = 0) {
  const pets = PETS.filter((x) => x[2] <= keys).map((x) => x[0]);
  return { v: 3, char: Math.floor(Math.random() * CHARACTERS.length), pet: Math.random() < 0.5 ? 'none' : pets[Math.floor(Math.random() * pets.length)], job: 'none' };
}
// 받은 look 을 믿을 수 있는 값으로만. 예전 모습이면 캐릭터를 새로 고른다 (같이 다니는 친구는 남긴다)
// jobs: 체험한 직업 목록 (null 이면 친구 모습처럼 모두 믿는다)
export function cleanLook(l = {}, keys = 99, jobs = null) {
  l = l || {};
  const open = (need) => (typeof need === 'string' ? (jobs === null || jobs.includes(need.slice(4))) : need <= keys);
  const lock = (list, v) => (list.some((x) => x[0] === v && open(x[2])) ? v : 'none');
  const ch = Number.isInteger(l.char) && l.char >= 0 && l.char < CHARACTERS.length ? l.char : (l.v === 3 ? 0 : Math.floor(Math.random() * CHARACTERS.length));
  return { v: 3, char: ch, pet: lock(PETS, l.pet), job: lock(JOB_BADGES, l.job) };
}

// ---------- 그림 불러오기 ----------
let META = null; let ATLAS = null; let ready = null;
const base = new URL('./chars/', import.meta.url);
export function loadChars() {
  if (ready) return ready;
  ready = Promise.all([
    fetch(new URL('presets.json', base)).then((r) => r.json()),
    new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = new URL('presets.png', base).href; }),
  ]).then(([m, im]) => { META = m; ATLAS = im; });
  return ready;
}
export const charsReady = () => !!META;
export const CW = 147; export const CH = 151; // 캐릭터 한 칸 (presets.json 의 cw·ch, 발이 칸 바닥에 닿는다)

// look → 캔버스. view: 'front' 또는 'sideL' 이면 왼쪽을 보도록 뒤집는다 (그 밖에는 그대로)
const cache = new Map();
export function drawChar(look, view = 'front') {
  if (!META) return null;
  const L = cleanLook(look);
  const flip = view === 'sideL';
  const key = `${L.char}|${flip}`;
  if (cache.has(key)) return cache.get(key);
  const [x, y, w, h] = META.cells[L.char];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (flip) { g.translate(w, 0); g.scale(-1, 1); }
  g.drawImage(ATLAS, x, y, w, h, 0, 0, w, h);
  cache.set(key, c);
  return c;
}
