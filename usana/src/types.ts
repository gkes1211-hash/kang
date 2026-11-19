// 모든 데이터 묶음이 공통으로 가지는 항목 (나중에 클라우드로 옮길 때 그대로 사용)
export interface BaseRecord {
  id: string; // UUID
  createdAt: string; // ISO 시각
  updatedAt: string; // ISO 시각
}

export type Stage = 'prospect' | 'new' | 'regular' | 'dormant' | 'partner';

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'prospect', label: '잠재 고객' },
  { value: 'new', label: '신규 고객' },
  { value: 'regular', label: '단골 고객' },
  { value: 'dormant', label: '휴면 고객' },
  { value: 'partner', label: '사업 파트너' },
];

export const stageLabel = (s: Stage) => STAGES.find((x) => x.value === s)?.label ?? s;

export type ContactMethod = 'phone' | 'kakao' | 'meet' | 'sms';

export const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'phone', label: '전화' },
  { value: 'kakao', label: '카톡' },
  { value: 'sms', label: '문자' },
  { value: 'meet', label: '만남' },
];

/** 관심사 태그 초기값 (병명은 쓰지 않음) */
export const DEFAULT_INTEREST_TAGS = [
  '피로·활력', '면역', '눈 건강', '뼈·관절', '장 건강', '혈행',
  '혈당', '피부', '체중 관리', '수면', '기억력', '항산화',
];

/** 날짜만 필요한 항목은 'YYYY-MM-DD' 문자열로 저장 */
export type DateOnly = string;

export interface Customer extends BaseRecord {
  name: string;
  phone: string;
  birthday?: DateOnly;
  stage: Stage;
  interestTags: string[];
  referrer?: string; // 알게 된 경로(소개자)
  preferredMethod?: ContactMethod;
  preferredTime?: string;
  subscription: boolean; // 정기 주문 여부
  consent: boolean; // 건강 정보 수집 동의
  consentDate?: DateOnly;
  takingMedication: boolean;
  pregnantOrNursing: boolean;
  nextContactDate?: DateOnly;
  memo?: string;
}

export interface Product extends BaseRecord {
  name: string;
  category: string;
  functionalClaim: string; // 식약처 인정 기능성 문구 (라벨 그대로)
  dailyDose: string; // 1일 섭취량
  unitSize: string; // 1통 용량
  daysPerUnit: number; // 1통 섭취 기간(일)
  price: number;
  interestTags: string[];
  cautions?: string;
}

export interface Purchase extends BaseRecord {
  customerId: string;
  productId: string;
  quantity: number;
  people: number; // 섭취 인원
  purchaseDate: DateOnly;
  runOutDate: DateOnly; // 소진 예정일 (자동 계산)
  amount: number;
}

export interface ContactLog extends BaseRecord {
  customerId: string;
  date: DateOnly;
  method: ContactMethod;
  content: string;
  taskId?: string;
}

export interface Template extends BaseRecord {
  title: string;
  situation: string;
  body: string; // {이름}, {제품명} 치환
}

/** 새로 만들 때 입력하는 값 (id·시각은 저장소가 채움) */
export type NewRecord<T extends BaseRecord> = Omit<T, keyof BaseRecord>;
