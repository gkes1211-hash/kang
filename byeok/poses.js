// 벽 구멍 자세 모음.
// arms: [왼쪽 위팔, 왼쪽 아래팔, 오른쪽 위팔, 오른쪽 아래팔]
// legs: [왼쪽 허벅지, 왼쪽 종아리, 오른쪽 허벅지, 오른쪽 종아리] (없으면 그냥 서 있기, 다리는 안 봄)
// lean: 몸통 기울기 (+ = 윗몸이 화면 오른쪽으로, - = 왼쪽으로. 없으면 안 봄)
// 각도: 0 = 아래, 90 = 바깥으로 수평, 180 = 위, 음수 = 몸 안쪽. 왼쪽/오른쪽은 화면에 보이는 쪽.
// level: 1 = 쉬움부터, 2 = 보통부터, 3 = 어려움에서만 나온다.
import { mirrorPose, samePose } from './body.js';

const HIP = [40, -60]; // 허리에 손
const UP = [165, 172]; // 번쩍
const DOWN = [8, 4]; // 내림
const OUT = [90, 90]; // 옆으로 쭉
const HEART = [135, -150]; // 머리 위로 둥글게

export const POSES = [
  // ---- 1단계: 팔만 (쉬움부터) ----
  { id: 'banzai', name: '만세', emoji: '🙌', level: 1, arms: [160, 165, 160, 165] },
  { id: 'plane', name: '비행기', emoji: '✈️', level: 1, arms: [...OUT, ...OUT] },
  { id: 'leftUp', name: '왼팔 번쩍', emoji: '🙋', level: 1, arms: [...UP, ...DOWN] },
  { id: 'rightUp', name: '오른팔 번쩍', emoji: '🙋', level: 1, arms: [...DOWN, ...UP] },
  { id: 'muscle', name: '튼튼 근육', emoji: '💪', level: 1, arms: [90, 178, 90, 178] },
  { id: 'bolt', name: '번개', emoji: '⚡', level: 1, arms: [135, 135, 45, 45] },
  { id: 'bolt2', name: '반대 번개', emoji: '⚡', level: 1, arms: [45, 45, 135, 135] },
  { id: 'v', name: '브이', emoji: '✌️', level: 1, arms: [135, 135, 135, 135] },
  { id: 'heart', name: '머리 위 하트', emoji: '💗', level: 1, arms: [...HEART, ...HEART] },
  { id: 'hero', name: '슈퍼 히어로', emoji: '🦸', level: 1, arms: [...HIP, ...HIP] },
  { id: 'bow', name: '활쏘기', emoji: '🏹', level: 1, arms: [...OUT, 90, -90] },
  { id: 'bow2', name: '반대 활쏘기', emoji: '🏹', level: 1, arms: [90, -90, ...OUT] },
  { id: 'chicken', name: '닭 날개', emoji: '🐔', level: 1, arms: [50, -110, 50, -110] },
  { id: 'flag', name: '깃발 들기', emoji: '🚩', level: 1, arms: [...OUT, ...UP] },
  { id: 'flag2', name: '반대 깃발', emoji: '🚩', level: 1, arms: [...UP, ...OUT] },
  { id: 'robot', name: '로봇', emoji: '🤖', level: 1, arms: [90, 178, 90, 4] },
  { id: 'surprise', name: '깜짝!', emoji: '😱', level: 1, arms: [60, 170, 60, 170] },
  { id: 'torch', name: '횃불 들기', emoji: '🔥', level: 1, arms: [...HIP, ...UP] },
  { id: 'scarecrow', name: '허수아비', emoji: '🌾', level: 1, arms: [90, 10, 90, 10] },
  { id: 'octopus', name: '문어 춤', emoji: '🐙', level: 1, arms: [60, 140, 60, 140] },
  { id: 'penguin', name: '펭귄', emoji: '🐧', level: 1, arms: [35, 30, 35, 30] },

  // ---- 2단계: 다리·몸통까지 (보통부터) ----
  { id: 'star', name: '별', emoji: '⭐', level: 2, arms: [125, 125, 125, 125], legs: [30, 30, 30, 30] },
  { id: 'big', name: '큰 대(大)자', emoji: '🙆', level: 2, arms: [...OUT, ...OUT], legs: [28, 28, 28, 28] },
  { id: 'flamingoR', name: '홍학 (오른다리)', emoji: '🦩', level: 2, arms: [100, 100, 100, 100], legs: [6, 0, 70, 70] },
  { id: 'flamingoL', name: '홍학 (왼다리)', emoji: '🦩', level: 2, arms: [100, 100, 100, 100], legs: [70, 70, 6, 0] },
  { id: 'sumo', name: '씨름 선수', emoji: '🐻', level: 2, arms: [90, 178, 90, 178], legs: [50, 5, 50, 5] },
  { id: 'frog', name: '개구리', emoji: '🐸', level: 2, arms: [60, 170, 60, 170], legs: [60, -10, 60, -10] },
  { id: 'tree', name: '나무', emoji: '🌳', level: 2, arms: [...HEART, ...HEART], legs: [6, 0, 60, -60] },
  { id: 'lunge', name: '옆으로 쭉', emoji: '🦵', level: 2, arms: [...OUT, ...OUT], legs: [6, 0, 55, 55] },
  { id: 'teapot', name: '주전자', emoji: '🫖', level: 2, arms: [110, 110, ...HIP], lean: -20 },
  { id: 'pisa', name: '피사의 사탑', emoji: '🗼', level: 2, arms: [...DOWN, ...DOWN], lean: 18 },
  { id: 'moon', name: '초승달', emoji: '🌙', level: 2, arms: [-170, -140, ...HIP], lean: 22 },
  { id: 'moon2', name: '반대 초승달', emoji: '🌙', level: 2, arms: [...HIP, -170, -140], lean: -22 },

  // ---- 3단계: 팔·다리·몸통 섞기 (어려움) ----
  { id: 'disco', name: '디스코', emoji: '🕺', level: 3, arms: [145, 145, ...HIP], legs: [6, 0, 35, 35] },
  { id: 'ballet', name: '발레리나', emoji: '🩰', level: 3, arms: [...HEART, ...HEART], legs: [6, 0, 45, 45] },
  { id: 'skate', name: '스케이트', emoji: '⛸️', level: 3, arms: [...OUT, 40, 40], legs: [6, 0, 60, 40] },
  { id: 'karate', name: '태권도', emoji: '🥋', level: 3, arms: [...OUT, ...HIP], legs: [40, 40, 6, 0] },
  { id: 'clock3', name: '시계 세 시', emoji: '🕒', level: 3, arms: [...UP, ...OUT], legs: [25, 25, 25, 25] },
  { id: 'surf', name: '서핑', emoji: '🏄', level: 3, arms: [80, 80, 100, 100], legs: [35, 35, 35, 35], lean: -15 },
  { id: 'kick', name: '축구 슛', emoji: '⚽', level: 3, arms: [100, 100, 60, 60], legs: [6, 0, 80, 95], lean: -15 },
  { id: 'rocket', name: '날아라 로켓', emoji: '🚀', level: 3, arms: [...UP, 30, 30], legs: [6, 0, 45, 45], lean: 15 },
  { id: 'ninja', name: '닌자', emoji: '🥷', level: 3, arms: [90, -90, 40, 40], legs: [50, 5, 50, 5] },
  { id: 'crab', name: '꽃게', emoji: '🦀', level: 3, arms: [60, 170, 60, 170], legs: [55, 5, 55, 5], lean: 12 },
];

// 둘이서 하는 짝 자세: p1 = 왼쪽(1P), p2 = 오른쪽(2P). 두 사람이 같이 모양을 만든다.
export const PAIR_POSES = [
  { id: 'bigHeart', name: '커다란 하트', emoji: '💞', level: 1,
    p1: { arms: [...HIP, 150, 110] }, p2: { arms: [150, 110, ...HIP] } },
  { id: 'handsUp', name: '손잡고 만세', emoji: '🤝', level: 1,
    p1: { arms: [160, 165, 50, 50] }, p2: { arms: [50, 50, 160, 165] } },
  { id: 'bridge', name: '다리 만들기', emoji: '🌉', level: 1,
    p1: { arms: [...OUT, 135, 100] }, p2: { arms: [135, 100, ...OUT] } },
  { id: 'wings', name: '한 마리 새', emoji: '🕊️', level: 1,
    p1: { arms: [135, 135, ...DOWN] }, p2: { arms: [...DOWN, 135, 135] } },
  { id: 'wave', name: '파도 타기', emoji: '🌊', level: 1,
    p1: { arms: [45, 45, 135, 135] }, p2: { arms: [45, 45, 135, 135] } },
  { id: 'bigStar', name: '쌍둥이 별', emoji: '🌟', level: 2,
    p1: { arms: [125, 125, 125, 125], legs: [30, 30, 30, 30] }, p2: { arms: [125, 125, 125, 125], legs: [30, 30, 30, 30] } },
  { id: 'gate', name: '대문', emoji: '⛩️', level: 2,
    p1: { arms: [...DOWN, 150, 110], lean: 15 }, p2: { arms: [150, 110, ...DOWN], lean: -15 } },
  { id: 'heartLegs', name: '하트 다리', emoji: '💘', level: 3,
    p1: { arms: [...HIP, 150, 110], legs: [6, 0, 60, 60] }, p2: { arms: [150, 110, ...HIP], legs: [60, 60, 6, 0] } },
  { id: 'dance', name: '커플 댄스', emoji: '💃', level: 3,
    p1: { arms: [145, 145, 60, 60], legs: [35, 35, 6, 0], lean: -12 }, p2: { arms: [60, 60, 145, 145], legs: [6, 0, 35, 35], lean: 12 } },
];

// 난이도
// approach: 벽이 처음 다가오는 시간(초), 통과할 때마다 speedUp 만큼 빨라지고 minApproach 아래로는 안 내려감
// tol: 각도를 얼마나 봐주나(도), legs: 다리·몸통 자세도 보나, morph: 다가오는 도중 구멍 모양이 바뀌나
// guide: 벽이 멀리 있을 때 내 자리에 구멍 모양을 흐릿하게 보여 주나
export const DIFFICULTY = {
  easy: { label: '쉬움', emoji: '🐣', approach: 7, minApproach: 4.5, speedUp: 0.95, tol: 42, maxLevel: 1, legs: false, morph: 0, guide: true, lives: 3 },
  normal: { label: '보통', emoji: '🐰', approach: 5.5, minApproach: 3.2, speedUp: 0.94, tol: 33, maxLevel: 2, legs: true, morph: 0, guide: true, lives: 3 },
  hard: { label: '어려움', emoji: '🦅', approach: 4.5, minApproach: 2.5, speedUp: 0.93, tol: 27, maxLevel: 3, legs: true, morph: 0.6, guide: false, lives: 3 },
};

const needsBody = (p) => !!p.legs || p.lean != null;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 지금 나올 수 있는 단계: 3개 통과마다 한 단계씩 어려운 자세가 섞인다
const levelNow = (diff, passed) => Math.min(diff.maxLevel, 1 + Math.floor(passed / 3));

// 혼자: 자세 하나
export function pickPose(diff, passed, lastId, fullBody) {
  const level = levelNow(diff, passed);
  let pool = POSES.filter((p) => p.level <= level && p.id !== lastId);
  // 다리·엉덩이가 화면에 안 보이면 다리·몸통 자세는 내지 않는다
  if (!diff.legs || !fullBody) pool = pool.filter((p) => !needsBody(p));
  // 새로 열린 단계의 자세가 더 자주 나오게
  const weighted = pool.flatMap((p) => (p.level === level && level > 1 ? [p, p, p] : [p]));
  return pick(weighted);
}

// 둘이서: 두 사람 자세 + 화면에 보일 이름
//  - 짝 자세 (둘이 같이 하트 만들기 같은 것)
//  - 똑같이 (둘이 같은 자세)
//  - 거울처럼 (2P는 1P의 거울 자세)
export function pickPair(diff, passed, lastId, fullBody) {
  const level = levelNow(diff, passed);
  const kind = Math.random();
  if (kind < 0.4) {
    let pool = PAIR_POSES.filter((p) => p.level <= level && p.id !== lastId);
    if (!diff.legs || !fullBody) pool = pool.filter((p) => !needsBody(p.p1) && !needsBody(p.p2));
    if (pool.length) {
      const p = pick(pool);
      return { id: p.id, emoji: p.emoji, name: p.name, poses: [p.p1, p.p2], kind: '둘이 같이' };
    }
  }
  const base = pickPose(diff, passed, lastId, fullBody);
  const mirrored = mirrorPose(base);
  if (kind < 0.7 && !samePose(base, mirrored)) {
    return { id: base.id, emoji: '🪞', name: `거울처럼 ${base.name}`, poses: [base, mirrored], kind: '거울처럼' };
  }
  return { id: base.id, emoji: '👯', name: `똑같이 ${base.name}`, poses: [base, base], kind: '똑같이' };
}

// 혼자일 때도 같은 모양으로 쓰려고: { id, emoji, name, poses: [pose] }
export function pickSolo(diff, passed, lastId, fullBody) {
  const p = pickPose(diff, passed, lastId, fullBody);
  return { id: p.id, emoji: p.emoji, name: p.name, poses: [p] };
}
