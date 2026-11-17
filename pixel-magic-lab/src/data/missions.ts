import type { BlockKind, ColorKey } from '../engine/types';

export type Level = 'easy' | 'normal' | 'challenge';

export const LEVEL_INFO: Record<Level, { name: string; grade: string; desc: string }> = {
  easy: { name: '쉬움', grade: '1~2학년', desc: '이동 · 색칠 · 순서' },
  normal: { name: '보통', grade: '3~4학년', desc: '반복 · 색 바꾸기 · 좌표 · 패턴' },
  challenge: { name: '도전', grade: '5~6학년', desc: '반복 속 반복 · 효율 · 디버깅' },
};

export interface Mission {
  id: string;
  no: number;
  title: string;
  /** 핵심 학습 (짧은 꼬리표) */
  concept: string;
  level: Level;
  /** 처음 들어갈 때 보여주는 개념 카드 */
  intro: string;
  /** 미션 설명 */
  goal: string;
  /** 목표 그림 ('.' = 빈칸, 글자 = 팔레트 색 키) */
  art: string[];
  startColor: ColorKey;
  allowed: BlockKind[];
  /** 단계별 힌트 (점점 자세해짐) */
  hints: string[];
  /** 모범 답안 (dsl.ts 표기법). 자동 테스트로 정답 여부를 검증한다. */
  solution: string;
  /** 디버깅 미션: 처음부터 들어 있는 (고장 난) 코드 */
  starter?: string;
}

const BASIC: BlockKind[] = ['move', 'paint'];
const WITH_COLOR: BlockKind[] = ['move', 'paint', 'color'];
const WITH_REPEAT: BlockKind[] = ['move', 'paint', 'color', 'repeat'];
const ALL: BlockKind[] = ['move', 'paint', 'erase', 'color', 'repeat'];

export const MISSIONS: Mission[] = [
  {
    id: 'm01',
    no: 1,
    title: '첫 번째 마법 점',
    concept: '색칠 명령',
    level: 'easy',
    intro: '마법 펜은 도화지 맨 왼쪽 위 칸에서 기다리고 있어요. "색칠하기" 블록을 넣고 실행하면 펜이 있는 칸이 색칠돼요.',
    goal: '마법 펜이 있는 첫 칸을 분홍색으로 칠해 보세요.',
    art: ['k...', '....', '....', '....'],
    startColor: 'k',
    allowed: ['paint'],
    hints: [
      '왼쪽 블록 상자에서 "색칠하기" 블록을 눌러 보세요.',
      '블록이 주문서에 들어가면 가운데 아래의 실행 버튼을 눌러요.',
      '정답: 색칠하기 블록 1개면 충분해요!',
    ],
    solution: 'P',
  },
  {
    id: 'm02',
    no: 2,
    title: '반짝이는 가로줄',
    concept: '이동과 순서',
    level: 'easy',
    intro: '이동 블록은 펜을 한 칸 옮기기만 하고 색칠은 하지 않아요. "색칠하기 → 오른쪽 이동"을 순서대로 놓아 보세요. 컴퓨터는 위에서부터 차례대로 실행해요!',
    goal: '맨 윗줄 다섯 칸을 모두 노랗게 칠해 보세요.',
    art: ['yyyyy', '.....', '.....'],
    startColor: 'y',
    allowed: BASIC,
    hints: [
      '먼저 첫 칸을 칠하고, 오른쪽으로 한 칸 옮겨요.',
      '"색칠하기, 오른쪽" 을 반복해서 놓아요. 마지막 칸에서는 더 이상 오른쪽으로 가지 않아도 돼요.',
      '색칠하기 5개와 오른쪽 이동 4개를 번갈아 놓아요.',
    ],
    solution: 'P R P R P R P R P',
  },
  {
    id: 'm03',
    no: 3,
    title: '알록달록 계단',
    concept: '방향 명령',
    level: 'easy',
    intro: '펜은 위, 아래, 왼쪽, 오른쪽 네 방향으로 움직일 수 있어요. "색 바꾸기" 블록을 쓰면 다음부터 칠하는 색이 바뀌어요.',
    goal: '한 칸씩 내려가는 무지개 계단을 그려 보세요.',
    art: ['rr...', '.oo..', '..yy.', '...gg'],
    startColor: 'r',
    allowed: WITH_COLOR,
    hints: [
      '계단 한 층은 "칠하기, 오른쪽, 칠하기" 예요.',
      '한 층을 그린 다음 아래로 한 칸 내려가고, 색을 바꿔요.',
      '칠하기 → 오른쪽 → 칠하기 → 아래 → 색 바꾸기 를 네 번 되풀이해요.',
    ],
    solution: 'P R P D c:o P R P D c:y P R P D c:g P R P',
  },
  {
    id: 'm04',
    no: 4,
    title: '네모난 마법 창문',
    concept: '이동과 패턴',
    level: 'easy',
    intro: '네모의 테두리는 오른쪽 → 아래 → 왼쪽 → 위, 네 방향으로 한 바퀴 돌면서 그릴 수 있어요.',
    goal: '보라색 창문 테두리를 그려 보세요. 가운데는 비워 둬요.',
    art: ['pppp', 'p..p', 'p..p', 'pppp'],
    startColor: 'p',
    allowed: BASIC,
    hints: [
      '윗변부터 오른쪽으로 칠해 나가요.',
      '모서리에 닿으면 방향을 바꿔요: 오른쪽 → 아래 → 왼쪽 → 위.',
      '처음 칸은 이미 칠했으니 마지막에 위로 갈 때는 두 칸만 칠하면 돼요.',
    ],
    solution: 'P R P R P R P D P D P D P L P L P L P U P U P',
  },
  {
    id: 'm05',
    no: 5,
    title: '하트 만들기',
    concept: '좌표와 색칠',
    level: 'easy',
    intro: '도화지 칸에는 주소가 있어요. 왼쪽 위가 (0,0)이고, 오른쪽으로 가면 앞 숫자가, 아래로 가면 뒤 숫자가 커져요.',
    goal: '빨간 하트를 그려 보세요.',
    art: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
    startColor: 'r',
    allowed: BASIC,
    hints: [
      '첫 줄은 (1,0)과 (3,0) 두 칸만 칠해요.',
      '한 줄을 다 칠하면 아래로 내려가서 반대 방향으로 칠하면 길이 짧아져요. (지그재그)',
      '맨 아랫줄은 가운데 (2,4) 한 칸이에요.',
    ],
    solution: 'R P R R P R D P L P L P L P L P D P R P R P R P R P D L P L P L P D R P',
  },
  {
    id: 'm06',
    no: 6,
    title: '반복되는 무지개',
    concept: '반복문',
    level: 'normal',
    intro: '"반복하기" 블록 안에 블록을 넣으면 그 블록들을 여러 번 실행해요. "색칠하기, 오른쪽"을 5번 반복하면 블록 2개로 10개의 일을 할 수 있어요!',
    goal: '다섯 가지 색의 무지개 줄무늬를 그려 보세요.',
    art: ['rrrrrr', 'oooooo', 'yyyyyy', 'gggggg', 'bbbbbb'],
    startColor: 'r',
    allowed: WITH_REPEAT,
    hints: [
      '한 줄은 "5번 반복 [색칠하기, 오른쪽]" 다음에 "색칠하기" 하나로 그릴 수 있어요.',
      '줄 끝에서 아래로 내려가 색을 바꾸고, 이번에는 왼쪽으로 칠하며 돌아와요.',
      '오른쪽 줄, 왼쪽 줄을 번갈아 그려요. 반복 횟수를 6으로 하면 도화지 밖으로 나가니 조심!',
    ],
    solution: '5[P R] P D c:o 5[P L] P D c:y 5[P R] P D c:g 5[P L] P D c:b 5[P R] P',
  },
  {
    id: 'm07',
    no: 7,
    title: '마법사의 꽃',
    concept: '반복과 패턴',
    level: 'normal',
    intro: '같은 모양이 다시 나오는 곳을 찾으면 반복 블록으로 짧게 쓸 수 있어요. 꽃잎 줄과 줄기가 어떻게 반복되는지 살펴보세요.',
    goal: '노란 꽃술이 있는 분홍 꽃과 초록 줄기를 그려 보세요.',
    art: ['.kkk.', 'kkykk', '.kkk.', '..g..', '..g..', '..g..'],
    startColor: 'k',
    allowed: WITH_REPEAT,
    hints: [
      '첫 줄 꽃잎은 (1,0)부터 (3,0)까지 세 칸이에요.',
      '가운데 꽃술 (2,1)만 노랑이에요. 색을 바꿨다가 다시 분홍으로 돌아오는 걸 잊지 마세요.',
      '줄기는 "2번 반복 [아래, 색칠하기]" 처럼 쓸 수 있어요.',
    ],
    solution: 'R 2[P R] P D R P L P L c:y P c:k L P L P D R 2[P R] P D L c:g P 2[D P]',
  },
  {
    id: 'm08',
    no: 8,
    title: '별빛 장식',
    concept: '효율적인 명령',
    level: 'normal',
    intro: '같은 그림이라도 더 짧은 주문으로 그릴 수 있어요. 이미 칠한 칸을 지나가거나 다시 칠해도 괜찮아요. 블록 수를 줄여서 별 3개에 도전해 보세요!',
    goal: '반짝이는 십자 별을 되도록 적은 블록으로 그려 보세요.',
    art: ['..y..', '..y..', 'yyyyy', '..y..', '..y..'],
    startColor: 'y',
    allowed: WITH_REPEAT,
    hints: [
      '세로줄 하나와 가로줄 하나로 나눠서 생각해 보세요.',
      '세로줄: (2,0)으로 간 다음 "4번 반복 [색칠하기, 아래]", 그리고 색칠하기.',
      '가운데 칸은 두 번 칠해도 괜찮아요. 가로줄은 (0,2)에서 시작해요.',
    ],
    solution: 'R R 4[P D] P U U L L 4[P R] P',
  },
  {
    id: 'm09',
    no: 9,
    title: '귀여운 버섯',
    concept: '색 변경과 반복',
    level: 'normal',
    intro: '색 바꾸기 블록은 그 뒤에 오는 모든 색칠에 영향을 줘요. 하얀 점을 찍은 다음에는 다시 빨강으로 바꿔야 해요.',
    goal: '하얀 점박이 빨간 버섯을 그려 보세요.',
    art: ['.rrrr.', 'rwrrwr', 'rrrrrr', '..ss..', '..ss..'],
    startColor: 'r',
    allowed: WITH_REPEAT,
    hints: [
      '버섯 갓 첫 줄은 (1,0)~(4,0) 네 칸이에요. 반복을 써 보세요.',
      '둘째 줄은 하얀 점이 (1,1)과 (4,1)에 있어요. 하양으로 바꿨다가 빨강으로 돌아와요.',
      '셋째 줄은 6칸 모두 빨강: "5번 반복 [색칠하기, 오른쪽]" + 색칠하기. 기둥은 살구색 2×2예요.',
    ],
    solution: 'R 3[P R] P D R P L c:w P c:r L P L P L c:w P c:r L P D 5[P R] P D L L L c:s P R P D P L P',
  },
  {
    id: 'm10',
    no: 10,
    title: '마법사의 시험',
    concept: '종합 미션',
    level: 'normal',
    intro: '지금까지 배운 이동, 색칠, 색 바꾸기, 반복을 모두 써서 마법사 모자를 완성해요. 줄마다 어디서 시작하고 끝나는지 먼저 생각해 보세요.',
    goal: '노란 별 장식이 있는 보라색 마법사 모자를 그려 보세요.',
    art: ['...p...', '..ppp..', '..pyp..', '.ppppp.', 'ppppppp', 'yyyyyyy'],
    startColor: 'p',
    allowed: WITH_REPEAT,
    hints: [
      '모자 꼭대기는 (3,0)이에요.',
      '줄이 넓어질수록 시작 칸이 왼쪽으로 한 칸씩 옮겨가요. 지그재그로 오가면 짧아져요.',
      '맨 아래 노란 띠는 "6번 반복 [색칠하기, 오른쪽]" + 색칠하기로 그릴 수 있어요.',
    ],
    solution: 'R R R P D L 2[P R] P D P L c:y P c:p L P D L 4[P R] P D R 6[P L] P D c:y 6[P R] P',
  },
  {
    id: 'm11',
    no: 11,
    title: '체크무늬 마법 바닥',
    concept: '반복 속 반복',
    level: 'challenge',
    intro: '반복 블록 안에 또 반복 블록을 넣을 수 있어요(중첩 반복). 두 줄짜리 무늬를 하나의 묶음으로 보고, 그 묶음을 반복해 보세요.',
    goal: '보라색 체크무늬 바닥을 반복 속 반복으로 그려 보세요.',
    art: ['p.p.p.', '.p.p.p', 'p.p.p.', '.p.p.p', 'p.p.p.', '.p.p.p'],
    startColor: 'p',
    allowed: ALL,
    hints: [
      '첫 줄: "2번 반복 [색칠하기, 오른쪽, 오른쪽]" + 색칠하기 → (4,0)까지 칠해요.',
      '오른쪽으로 한 칸 더 간 뒤 아래로 내려가면 둘째 줄은 왼쪽으로 같은 방법으로 칠할 수 있어요.',
      '두 줄 묶음을 반복하되, 마지막 묶음에서 아래로 내려가면 도화지 밖이에요. 마지막 묶음은 따로 써 보세요.',
    ],
    solution: '2[2[P R R] P R D 2[P L L] P L D] 2[P R R] P R D 2[P L L] P',
  },
  {
    id: 'm12',
    no: 12,
    title: '고장 난 웃음 주문',
    concept: '디버깅',
    level: 'challenge',
    intro: '누군가 웃는 얼굴 주문을 써 두었는데 어딘가 고장이 났어요! "한 단계씩" 버튼으로 천천히 실행하며 어느 블록에서 펜이 엉뚱한 곳으로 가는지 찾아 고쳐 보세요. 이렇게 오류(버그)를 찾아 고치는 일을 디버깅이라고 해요.',
    goal: '주문서의 버그를 찾아 고쳐서 웃는 얼굴을 완성하세요.',
    art: ['.....', '.d.d.', '.....', 'd...d', '.ddd.'],
    startColor: 'd',
    allowed: ALL,
    hints: [
      '먼저 그대로 실행해 보고, 틀린 칸(✕ 표시)이 어디인지 보세요.',
      '"한 단계씩" 버튼을 눌러 펜이 입꼬리 왼쪽 (0,3)에 도착하는지 확인하세요.',
      '반복 블록의 횟수를 살펴보세요. 왼쪽으로 몇 칸 가야 할까요?',
    ],
    solution: 'R D P R R P D D R P 4[L] P D R P R P R P',
    starter: 'R D P R R P D D R P 3[L] P D R P R P R P',
  },
];

export function missionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
