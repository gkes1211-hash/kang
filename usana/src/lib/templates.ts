import type { TaskKind } from '../types';

/** 템플릿 상황 */
export const SITUATIONS: { value: string; label: string }[] = [
  { value: 'd1', label: '첫 구매 감사' },
  { value: 'd7', label: '섭취 확인' },
  { value: 'refill', label: '재구매 안내' },
  { value: 'd45', label: '후기·정기 주문' },
  { value: 'birthday', label: '생일' },
  { value: 'dormant', label: '휴면 고객 안부' },
  { value: 'season', label: '계절·명절 안부' },
  { value: 'other', label: '기타' },
];

export const situationLabel = (v: string) => SITUATIONS.find((s) => s.value === v)?.label ?? v;

/** 할 일 종류 → 추천 템플릿 상황 */
export function situationForTask(kind?: TaskKind | null): string | undefined {
  if (!kind) return undefined;
  if (kind === 'noContact') return 'dormant';
  if (kind === 'manual') return undefined;
  return kind;
}

/** {이름}, {제품명} 바꾸기 */
export function fillTemplate(body: string, name: string, productName?: string): string {
  return body.split('{이름}').join(name).split('{제품명}').join(productName || '제품');
}

/** 처음 넣어 두는 기본 템플릿 (치료·질병 효과 표현 없음) */
export const DEFAULT_TEMPLATES: { title: string; situation: string; body: string }[] = [
  {
    title: '첫 구매 감사 (D+1)',
    situation: 'd1',
    body: '{이름}님, 안녕하세요! {제품명} 구매해 주셔서 정말 감사드려요 😊\n드시는 방법이나 시간이 헷갈리시면 언제든 편하게 물어봐 주세요. 꾸준히 챙겨 드시는 게 가장 중요해요!',
  },
  {
    title: '섭취 확인 (D+7)',
    situation: 'd7',
    body: '{이름}님, 잘 지내시죠? {제품명} 드신 지 일주일 정도 되었네요.\n챙겨 드시기에 불편한 점은 없으신가요? 궁금한 점 있으면 편하게 말씀해 주세요 🙂',
  },
  {
    title: '재구매 안내 (소진 전)',
    situation: 'refill',
    body: '{이름}님, 안녕하세요! 드시고 계신 {제품명}이(가) 곧 다 떨어질 때가 된 것 같아 연락드려요.\n끊기지 않게 미리 준비해 드릴까요? 편하실 때 말씀만 주세요.',
  },
  {
    title: '후기 요청·정기 주문 안내',
    situation: 'd45',
    body: '{이름}님, {제품명} 드신 지 한 달 반 정도 되었어요. 그동안 드셔 보시니 어떠셨는지 이야기 들려주시면 큰 도움이 돼요 🙏\n매번 주문하기 번거로우시면 정기 주문으로 편하게 받아 보시는 방법도 안내해 드릴게요.',
  },
  {
    title: '생일 축하',
    situation: 'birthday',
    body: '{이름}님, 생일 진심으로 축하드려요! 🎂\n오늘 하루 좋아하는 사람들과 즐겁고 행복한 시간 보내세요.',
  },
  {
    title: '휴면 고객 안부',
    situation: 'dormant',
    body: '{이름}님, 오랜만에 안부 전해요. 잘 지내고 계시죠?\n문득 생각나서 연락드렸어요. 요즘 어떻게 지내시는지 편하실 때 소식 들려주세요 😊',
  },
  {
    title: '환절기 안부',
    situation: 'season',
    body: '{이름}님, 요즘 아침저녁으로 기온 차가 크네요.\n환절기에 몸 잘 챙기시고, 따뜻하게 지내세요! 늘 응원합니다 🍂',
  },
  {
    title: '명절 안부',
    situation: 'season',
    body: '{이름}님, 즐거운 명절 보내고 계신가요?\n가족분들과 함께 넉넉하고 행복한 시간 보내세요 🌕',
  },
];
