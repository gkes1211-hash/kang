// 🎮 역사 속으로 (모험 편)
// 아이는 "시간 여행 탐험대원"이 되어 역사 인물 곁에서 고민의 순간마다 직접 골라요.
// 틀린 선택은 혼내지 않고 "다시 생각해 볼까?" 하고 힌트를 준 뒤 다시 고르게 해요.
//
// 모험 하나의 모양
// { id, era, emoji, title, hook, person: 인물 id, year,
//   cast: { 배역: { name, e } },             // 말하는 사람 ('me' 는 탐험대원, 자동으로 있어요)
//   scenes: [장면, ...],
//   card: { title, when, who, vs, how, words: [핵심 단어] },   // 마지막에 받는 "진짜 역사 카드"
//   think: '너라면? 질문',
//   review: [{ q, choices, answer, why }] }  // 3일·7일 뒤 기억 퀴즈
//
// 장면 (말풍선은 1~2줄로 짧게! {name} 은 탐험대원 별명으로 바뀌어요)
//   { type: 'talk',   stage, who, say }
//   { type: 'choice', stage, who, say, options: [{ e, t, ok: true } | { e, t, fb: '왜 아닌지 + 힌트' }], after: '맞힌 뒤 한마디' }
//   { type: 'repeat', button, times, meter: { label, from, to }, movers: [{ e, x: [시작, 끝], y, s }], end, mid, done }
//        버튼을 times 번 누르는 놀이. 막대(meter, %)가 from → to 로 바뀌고 movers 가 움직여요. s 가 없으면 무리(army) 크기
//   { type: 'timing', button, hint, zone: { kind: 'river' | 'band', from, to, label }, mover: { e, y }, actors: [그림],
//     hit, hitE, boom, early, late, lap }   // 지나가는 mover 가 zone 안에 있을 때 누르면 성공
//   { type: 'match', left, right, pairs: [{ a, b }], miss, done }   // 왼쪽 카드와 오른쪽 카드 짝 맞추기
// stage: { bg: 'land' | 'camp' | 'river' | 'castle' | 'night', sprites: [{ e, x, y, s, a }] }
//   x, y 는 % 위치(가운데 기준), s 는 크기(px), a 는 움직임 'bob' | 'march' | 'shake' | 'flag' | 'pop'
window.H = window.H || {};
H.adventures = [
  {
    id: 'salsu', era: 'samguk', emoji: '🌊', person: 'euljimundeok', year: 612,
    title: '살수대첩: 백만 대군을 막아라!',
    hook: '612년 고구려. 수나라 군대가 몰려와요. 을지문덕 장군을 도와 나라를 지켜 줘!',
    cast: {
      clock: { name: '시간 여행 시계', e: '🕰️' },
      eulji: { name: '을지문덕 장군', e: '🧔' },
      soldier: { name: '수나라 병사', e: '💂' },
    },
    scenes: [
      { type: 'talk', who: 'clock',
        stage: { bg: 'land', sprites: [{ e: '🌀', x: 50, y: 45, s: 90, a: 'shake' }, { e: '⛰️', x: 15, y: 62, s: 60 }, { e: '⛰️', x: 85, y: 64, s: 50 }] },
        say: '띠리링! {name} 대원, 1400년 전 고구려에 도착했어! 지금은 612년이야.' },
      { type: 'talk', who: 'eulji',
        stage: { bg: 'land', sprites: [{ e: '🏯', x: 22, y: 55, s: 70 }, { e: '🧔', x: 55, y: 58, s: 74, a: 'bob' }, { e: '🚩', x: 70, y: 40, s: 40, a: 'flag' }] },
        say: '어서 오게, {name} 대원! 큰일이네. 수나라 군대가 백만 명 넘게 쳐들어왔어.' },
      { type: 'choice', who: 'eulji',
        stage: { bg: 'land', sprites: [{ e: '💂', x: 62, y: 52, s: 38, a: 'march' }, { e: '💂', x: 72, y: 60, s: 38, a: 'march' }, { e: '💂', x: 82, y: 50, s: 38, a: 'march' }, { e: '💂', x: 90, y: 62, s: 38, a: 'march' }, { e: '🧔', x: 18, y: 58, s: 64 }] },
        say: '적이 너무 많아. 어떻게 막으면 좋겠나?',
        options: [
          { e: '⚔️', t: '정면으로 맞서 싸워요!', fb: '우리 군사보다 훨씬 많아서 정면으로는 이기기 힘들어요. 힘 대신 머리를 써 볼까요?' },
          { e: '🏳️', t: '항복해요', fb: '그러면 나라를 빼앗겨요! 우리에겐 지혜가 있잖아요.' },
          { e: '🔍', t: '적의 약점부터 알아봐요', ok: true },
        ],
        after: '좋은 생각이야! 싸우기 전에 적을 먼저 알아야지.' },
      { type: 'choice', who: 'eulji',
        stage: { bg: 'camp', sprites: [{ e: '⛺', x: 55, y: 48, s: 56 }, { e: '⛺', x: 75, y: 55, s: 50 }, { e: '⛺', x: 88, y: 45, s: 44 }, { e: '🧔', x: 16, y: 60, s: 60 }] },
        say: '적의 사정을 어떻게 알아낼까?',
        options: [
          { e: '🕵️', t: '몰래 첩자를 보내요', fb: '좋은 생각! 그런데 장군은 더 대담했대요. 의심받지 않고 장군이 직접 들어가려면?' },
          { e: '🏳️', t: '항복하는 척 직접 가 봐요', ok: true },
          { e: '😴', t: '그냥 기다려요', fb: '기다리면 적이 더 가까이 와요. 적진을 직접 보려면 어떻게 해야 할까요?' },
        ],
        after: '바로 그거야! 항복하러 온 척하면 적이 문을 열어 주겠지.' },
      { type: 'talk', who: 'soldier',
        stage: { bg: 'camp', sprites: [{ e: '💂', x: 40, y: 55, s: 60, a: 'bob' }, { e: '🍚', x: 64, y: 72, s: 40, a: 'pop' }, { e: '🕳️', x: 64, y: 78, s: 50 }, { e: '😫', x: 80, y: 52, s: 44 }] },
        say: '(속닥속닥) 식량 자루가 너무 무거워서… 몰래 땅에 묻어 버렸어. 배고파…' },
      { type: 'talk', who: 'eulji',
        stage: { bg: 'land', sprites: [{ e: '🧔', x: 40, y: 56, s: 76, a: 'bob' }, { e: '💡', x: 56, y: 32, s: 44, a: 'pop' }] },
        say: '들었나, {name} 대원? 적은 배가 고프다! 이게 바로 약점이야.' },
      { type: 'choice', who: 'eulji',
        stage: { bg: 'land', sprites: [{ e: '😫', x: 70, y: 54, s: 44 }, { e: '😫', x: 82, y: 60, s: 40 }, { e: '🧔', x: 20, y: 58, s: 62 }] },
        say: '배고픈 적을 더 지치게 하려면 어떻게 할까?',
        options: [
          { e: '🍙', t: '먹을 것을 나눠 줘요', fb: '마음은 착하지만… 적이 힘을 되찾으면 우리가 위험해요!' },
          { e: '⚔️', t: '지금 바로 공격해요', fb: '아직 적에게 힘이 남아 있어요. 더 지치고 배고프게 만들려면?' },
          { e: '🏃', t: '지는 척 도망쳐서 멀리 끌어들여요', ok: true },
        ],
        after: '훌륭해! 따라올수록 적은 더 배고프고 지칠 거야.' },
      { type: 'repeat', who: 'eulji', times: 7, button: '🏃 지는 척 후퇴!',
        stage: { bg: 'land', sprites: [{ e: '🏯', x: 10, y: 52, s: 64 }] },
        meter: { label: '수나라 식량 🍚', from: 100, to: 0 },
        movers: [{ e: '💂💂💂', x: [82, 40], y: 58 }, { e: '🏃', x: [30, 18], y: 60, s: 44 }],
        end: '😫😫😫', mid: '적의 배에서 꼬르륵 소리가 나요! 🍚',
        say: '싸우는 척하다가 져 주고 후퇴! 적의 식량이 바닥날 때까지!',
        done: '하루에 7번 싸워서 7번 다 져 줬어요! 적은 이긴 줄 알고 신이 나서 따라왔지요.' },
      { type: 'talk', who: 'eulji',
        stage: { bg: 'castle', sprites: [{ e: '🏯', x: 22, y: 50, s: 90 }, { e: '😫', x: 70, y: 58, s: 40, a: 'march' }, { e: '😫', x: 80, y: 62, s: 40, a: 'march' }, { e: '😫', x: 90, y: 56, s: 40, a: 'march' }] },
        say: '적이 평양성 가까이 왔어. 하지만 모두 배고프고 지쳐서 비틀거리는군.' },
      { type: 'choice', who: 'eulji',
        stage: { bg: 'castle', sprites: [{ e: '📜', x: 50, y: 50, s: 80, a: 'bob' }, { e: '🧔', x: 18, y: 58, s: 58 }] },
        say: '적 장수 우중문에게 편지를 보내자. 어떤 편지가 좋을까?',
        options: [
          { e: '🏳️', t: '항복하겠다는 편지', fb: '진짜로 항복하면 안 돼요! 적이 스스로 돌아가고 싶게 만들려면?' },
          { e: '😡', t: '겁주는 편지', fb: '화가 난 적이 마지막 힘을 내서 덤빌 수도 있어요. 살짝 약 올리는 건 어때요?' },
          { e: '😏', t: '칭찬하는 척 놀리는 시', ok: true },
        ],
        after: '"그대의 공은 이미 높으니, 이제 만족하고 그만 돌아가시지요." 하하, 약 오르겠지?' },
      { type: 'talk', who: 'clock',
        stage: { bg: 'river', sprites: [{ e: '😱', x: 70, y: 40, s: 48, a: 'shake' }, { e: '💂', x: 82, y: 36, s: 38 }, { e: '💂', x: 90, y: 42, s: 38 }] },
        say: '시를 받은 적이 그제야 속은 걸 알았어! 허겁지겁 돌아가다가 살수라는 강에 다다랐어.' },
      { type: 'timing', who: 'eulji', button: '⚔️ 지금 공격!',
        stage: { bg: 'river', sprites: [] },
        zone: { kind: 'river', from: 36, to: 64 }, mover: { e: '💂💂💂', y: 50 },
        actors: [{ e: '🧔', x: 8, y: 30, s: 44 }, { e: '🏹', x: 8, y: 62, s: 40 }],
        say: '지금이 기회다! 적이 강을 반쯤 건넜을 때 공격하자!',
        hint: '적이 강 한가운데(파란 물 위)에 오면 공격 버튼을 눌러요.',
        hit: '적이 강 한가운데서 꼼짝 못 했어! 고구려군이 한꺼번에 공격해서 크게 이겼어요!',
        hitE: '😵😵😵', boom: '💦',
        early: '아직 강에 안 들어왔어요! 조금만 기다려요', late: '벌써 다 건넜어요! 다음에 올 때를 노려요' },
      { type: 'talk', who: 'eulji',
        stage: { bg: 'land', sprites: [{ e: '🎉', x: 30, y: 36, s: 54, a: 'pop' }, { e: '🧔', x: 50, y: 58, s: 76, a: 'bob' }, { e: '🚩', x: 70, y: 40, s: 44, a: 'flag' }, { e: '🎊', x: 78, y: 30, s: 48, a: 'pop' }] },
        say: '이겼다! 30만 명이 넘던 적 가운데 살아 돌아간 사람은 2,700명뿐이었대. 고맙네, {name} 대원!' },
    ],
    card: {
      title: '살수대첩', when: '612년', who: '고구려 을지문덕', vs: '수나라',
      how: '지는 척 후퇴해서 적을 배고프고 지치게 만든 뒤, 살수(지금의 청천강으로 짐작)를 건널 때 물리쳤어요.',
      words: ['을지문덕', '612년', '수나라', '살수', '지는 척 후퇴'],
    },
    think: '을지문덕은 힘이 아니라 꾀로 이겼어. 너도 힘으로는 안 될 때 꾀를 내서 해결한 적이 있어?',
    review: [
      { q: '을지문덕이 수나라 군대를 지치게 만든 작전은?', choices: ['정면으로 싸우기', '지는 척 후퇴하기', '성문 닫고 숨기'], answer: 1,
        why: '일부러 지는 척 후퇴해서 배고픈 적을 멀리 끌어들였어요.' },
      { q: '살수대첩에서 고구려가 물리친 나라는?', choices: ['당나라', '거란', '수나라', '왜'], answer: 2,
        why: '612년 고구려를 쳐들어온 나라는 수나라예요. 당나라는 수나라 다음 나라예요.' },
      { q: '을지문덕이 적 장수 우중문에게 보낸 것은?', choices: ['칭찬하는 척 놀리는 시', '항복 편지', '보물 상자'], answer: 0,
        why: '"그대의 공은 이미 높으니 만족하고 돌아가라"는 시를 보냈어요.' },
    ],
  },
];
