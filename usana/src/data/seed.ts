// 테스트용 가짜 데이터. 실제 제품 정보가 아님.
import { addCustomer, addProduct } from './repo';
import { addDays, today } from '../lib/date';

export async function addSampleData(): Promise<void> {
  const t = today();

  const people = [
    { name: '김하늘', phone: '010-1111-2222', birthday: '1978-03-14', stage: 'prospect', interestTags: ['피로·활력'], consent: true, next: 0, memo: '테스트용 가짜 고객' },
    { name: '이바다', phone: '010-2222-3333', birthday: '1985-11-21', stage: 'new', interestTags: ['눈 건강', '항산화'], consent: true, next: 2, memo: '테스트용 가짜 고객' },
    { name: '박산들', phone: '010-3333-4444', birthday: '1969-07-02', stage: 'regular', interestTags: ['뼈·관절'], consent: true, next: 7, subscription: true, memo: '테스트용 가짜 고객' },
    { name: '최구름', phone: '010-4444-5555', birthday: '1990-01-30', stage: 'dormant', interestTags: [], consent: false, next: -3, memo: '테스트용 가짜 고객 (건강정보 미동의)' },
    { name: '정나무', phone: '010-5555-6666', birthday: '1982-09-09', stage: 'partner', interestTags: ['면역', '수면'], consent: true, next: 14, medication: true, memo: '테스트용 가짜 고객' },
  ] as const;

  for (const p of people) {
    await addCustomer({
      name: p.name,
      phone: p.phone,
      birthday: p.birthday,
      stage: p.stage,
      interestTags: [...p.interestTags],
      referrer: '',
      preferredMethod: 'kakao',
      preferredTime: '저녁',
      subscription: 'subscription' in p ? p.subscription : false,
      consent: p.consent,
      consentDate: p.consent ? t : undefined,
      takingMedication: 'medication' in p ? p.medication : false,
      pregnantOrNursing: false,
      nextContactDate: addDays(t, p.next),
      memo: p.memo,
    });
  }

  const products = [
    { name: '[테스트] 비타민 A', category: '종합 영양', claim: '(테스트 문구) 라벨의 기능성 문구를 여기에 적어요', days: 28, price: 50000, tags: ['피로·활력', '항산화'] },
    { name: '[테스트] 미네랄 B', category: '뼈·관절', claim: '(테스트 문구) 라벨의 기능성 문구를 여기에 적어요', days: 30, price: 40000, tags: ['뼈·관절'] },
    { name: '[테스트] 오메가 C', category: '혈행', claim: '(테스트 문구) 라벨의 기능성 문구를 여기에 적어요', days: 60, price: 45000, tags: ['혈행', '눈 건강'] },
  ];
  for (const p of products) {
    await addProduct({
      name: p.name,
      category: p.category,
      functionalClaim: p.claim,
      dailyDose: '1일 2정',
      unitSize: '56정',
      daysPerUnit: p.days,
      price: p.price,
      interestTags: p.tags,
      cautions: '테스트용 가짜 제품입니다.',
    });
  }
}
