// 벽 구멍 자세 모음.
// arms: [왼쪽 위팔, 왼쪽 아래팔, 오른쪽 위팔, 오른쪽 아래팔]
// legs: [왼쪽 허벅지, 왼쪽 종아리, 오른쪽 허벅지, 오른쪽 종아리] (없으면 그냥 서 있기, 다리는 안 봄)
// 각도: 0 = 아래, 90 = 바깥으로 수평, 180 = 위, 음수 = 몸 안쪽. 왼쪽/오른쪽은 화면에 보이는 쪽.
// level: 1 = 쉬움부터, 2 = 보통부터, 3 = 어려움에서만 나온다.

export const POSES = [
  // ---- 1단계: 팔만 ----
  { id: 'banzai', name: '만세', emoji: '🙌', level: 1, arms: [160, 165, 160, 165] },
  { id: 'attention', name: '차렷', emoji: '🧍', level: 1, arms: [8, 4, 8, 4] },
  { id: 'plane', name: '비행기', emoji: '✈️', level: 1, arms: [90, 90, 90, 90] },
  { id: 'leftUp', name: '왼팔 번쩍', emoji: '🙋', level: 1, arms: [165, 172, 8, 4] },
  { id: 'rightUp', name: '오른팔 번쩍', emoji: '🙋', level: 1, arms: [8, 4, 165, 172] },
  { id: 'muscle', name: '튼튼 근육', emoji: '💪', level: 1, arms: [90, 178, 90, 178] },
  { id: 'bolt', name: '번개', emoji: '⚡', level: 1, arms: [135, 135, 45, 45] },
  { id: 'bolt2', name: '반대 번개', emoji: '⚡', level: 1, arms: [45, 45, 135, 135] },
  { id: 'v', name: '브이', emoji: '✌️', level: 1, arms: [135, 135, 135, 135] },

  // ---- 2단계: 팔 모양이 꺾이고, 다리도 쓴다 ----
  { id: 'hips', name: '허리 짚기', emoji: '🫖', level: 2, arms: [40, -60, 40, -60] },
  { id: 'heart', name: '머리 위 하트', emoji: '💗', level: 2, arms: [135, -150, 135, -150] },
  { id: 'robot', name: '로봇', emoji: '🤖', level: 2, arms: [90, 178, 90, 4] },
  { id: 'clock9', name: '시계 아홉 시', emoji: '🕘', level: 2, arms: [90, 90, 165, 172] },
  { id: 'surprise', name: '깜짝!', emoji: '😱', level: 2, arms: [60, 170, 60, 170] },
  { id: 'star', name: '별', emoji: '⭐', level: 2, arms: [125, 125, 125, 125], legs: [30, 30, 30, 30] },
  { id: 'big', name: '큰 대(大)자', emoji: '🙆', level: 2, arms: [90, 90, 90, 90], legs: [28, 28, 28, 28] },
  { id: 'flamingoR', name: '홍학 (오른다리)', emoji: '🦩', level: 2, arms: [100, 100, 100, 100], legs: [6, 0, 70, 70] },

  // ---- 3단계: 팔·다리 섞기 ----
  { id: 'flamingoL', name: '홍학 (왼다리)', emoji: '🦩', level: 3, arms: [100, 100, 100, 100], legs: [70, 70, 6, 0] },
  { id: 'sumo', name: '씨름 선수', emoji: '🐻', level: 3, arms: [90, 178, 90, 178], legs: [50, 5, 50, 5] },
  { id: 'disco', name: '디스코', emoji: '🕺', level: 3, arms: [145, 145, 40, -60], legs: [6, 0, 35, 35] },
  { id: 'ballet', name: '발레리나', emoji: '🩰', level: 3, arms: [135, -150, 135, -150], legs: [6, 0, 45, 45] },
  { id: 'skate', name: '스케이트', emoji: '⛸️', level: 3, arms: [90, 90, 40, 40], legs: [6, 0, 60, 40] },
  { id: 'karate', name: '태권도', emoji: '🥋', level: 3, arms: [90, 90, 40, -60], legs: [40, 40, 6, 0] },
  { id: 'clock3', name: '시계 세 시', emoji: '🕒', level: 3, arms: [165, 172, 90, 90], legs: [25, 25, 25, 25] },
];

// 난이도
// approach: 벽이 처음 다가오는 시간(초), 통과할 때마다 speedUp 만큼 빨라지고 minApproach 아래로는 안 내려감
// tol: 각도를 얼마나 봐주나(도), legs: 다리 자세도 보나, morph: 다가오는 도중 구멍 모양이 바뀌나
// guide: 벽이 멀리 있을 때 내 자리에 구멍 모양을 흐릿하게 보여 주나
export const DIFFICULTY = {
  easy: { label: '쉬움', emoji: '🐣', approach: 7, minApproach: 4.5, speedUp: 0.95, tol: 42, maxLevel: 1, legs: false, morph: 0, guide: true, lives: 3 },
  normal: { label: '보통', emoji: '🐰', approach: 5.5, minApproach: 3.2, speedUp: 0.94, tol: 33, maxLevel: 2, legs: true, morph: 0, guide: true, lives: 3 },
  hard: { label: '어려움', emoji: '🦅', approach: 4.5, minApproach: 2.5, speedUp: 0.93, tol: 27, maxLevel: 3, legs: true, morph: 0.6, guide: false, lives: 3 },
};

// 통과할수록 어려운 자세가 하나씩 섞여 나온다 (4개 통과마다 한 단계)
export function pickPose(diff, passed, lastId, legsOk) {
  const level = Math.min(diff.maxLevel, 1 + Math.floor(passed / 4));
  let pool = POSES.filter((p) => p.level <= level && p.id !== lastId);
  // 다리가 화면에 안 보이면 다리 자세는 내지 않는다
  if (!diff.legs || !legsOk) pool = pool.filter((p) => !p.legs);
  // 새로 열린 단계의 자세가 더 자주 나오게
  const weighted = pool.flatMap((p) => (p.level === level && level > 1 ? [p, p] : [p]));
  return weighted[Math.floor(Math.random() * weighted.length)];
}
