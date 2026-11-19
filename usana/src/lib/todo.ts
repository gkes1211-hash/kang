// 오늘 할 일 목록 만들기 (화면과 저장 방식에 상관없는 순수 계산)
import type { ContactLog, Customer, Task, TaskKind } from '../types';
import { addDays, daysBetween, today as todayFn } from './date';

export const NO_CONTACT_DAYS = 30;

export interface TodoItem {
  key: string;
  kind: TaskKind;
  customer: Customer;
  dueDate: string;
  overdue: boolean;
  title: string;
  taskId?: string; // 저장된 할 일이면 있음
  note?: string;
}

export const GROUPS: { title: string; kinds: TaskKind[] }[] = [
  { title: '소진 임박', kinds: ['refill'] },
  { title: '첫 구매 후 일정', kinds: ['d1', 'd7', 'd45'] },
  { title: '생일', kinds: ['birthday'] },
  { title: `${NO_CONTACT_DAYS}일 이상 연락 없음`, kinds: ['noContact'] },
  { title: '직접 정한 연락일', kinds: ['manual'] },
];

export function taskTitle(kind: TaskKind, note?: string, extra?: number): string {
  switch (kind) {
    case 'd1': return '첫 구매 감사 인사 · 섭취 방법 안내 (D+1)';
    case 'd7': return '잘 챙겨 드시는지 확인 (D+7)';
    case 'd45': return '후기 듣기 · 정기 주문 안내 (D+45)';
    case 'refill': return `재구매 안내${note ? ` · ${note}` : ''} (소진 7일 전)`;
    case 'birthday': return '생일 축하';
    case 'noContact': return `${extra ?? NO_CONTACT_DAYS}일째 연락 없음 · 안부 연락`;
    case 'manual': return '정해 둔 다음 연락일';
  }
}

/** 올해 생일 날짜 (2월 29일생은 평년엔 2월 28일) */
export function birthdayThisYear(birthday: string, year: number): string {
  const [, m, d] = birthday.split('-');
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return m === '02' && d === '29' && !leap ? `${year}-02-28` : `${year}-${m}-${d}`;
}

/** 고객마다 마지막 연락일 (기록이 없으면 등록일) */
export function lastContactMap(customers: Customer[], contacts: ContactLog[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of customers) m.set(c.id, c.createdAt.slice(0, 10));
  for (const x of contacts) {
    const cur = m.get(x.customerId);
    if (cur !== undefined && x.date > cur) m.set(x.customerId, x.date);
  }
  return m;
}

export function buildTodos(customers: Customer[], tasks: Task[], contacts: ContactLog[], t = todayFn()) {
  const byId = new Map(customers.map((c) => [c.id, c]));
  const items: TodoItem[] = [];

  // 1) 저장된 할 일 (구매 후 자동 일정)
  for (const task of tasks) {
    if (task.done || task.dueDate > t) continue;
    if (task.kind === 'birthday' || task.kind === 'noContact' || task.kind === 'manual') continue;
    const c = byId.get(task.customerId);
    if (!c) continue;
    items.push({
      key: task.id, kind: task.kind, customer: c, dueDate: task.dueDate,
      overdue: task.dueDate < t, title: taskTitle(task.kind, task.note), taskId: task.id, note: task.note,
    });
  }

  const year = Number(t.slice(0, 4));
  for (const c of customers) {
    // 2) 생일 (그날만)
    if (c.birthday) {
      const b = birthdayThisYear(c.birthday, year);
      const done = tasks.some((x) => x.customerId === c.id && x.kind === 'birthday' && x.dueDate === b && x.done);
      if (b === t && !done) {
        items.push({ key: `bday-${c.id}`, kind: 'birthday', customer: c, dueDate: b, overdue: false, title: taskTitle('birthday') });
      }
    }
    // 3) 직접 정한 다음 연락일
    if (c.nextContactDate && c.nextContactDate <= t) {
      items.push({
        key: `manual-${c.id}`, kind: 'manual', customer: c, dueDate: c.nextContactDate,
        overdue: c.nextContactDate < t, title: taskTitle('manual'),
      });
    }
  }

  // 4) 오래 연락 없는 고객 (다른 할 일이 이미 있으면 겹치지 않게 뺌)
  const has = new Set(items.map((i) => i.customer.id));
  const last = lastContactMap(customers, contacts);
  for (const c of customers) {
    if (has.has(c.id)) continue;
    const l = last.get(c.id)!;
    const days = daysBetween(l, t);
    if (days >= NO_CONTACT_DAYS) {
      items.push({
        key: `nocontact-${c.id}`, kind: 'noContact', customer: c, dueDate: addDays(l, NO_CONTACT_DAYS),
        overdue: false, title: taskTitle('noContact', undefined, days),
      });
    }
  }

  const sortFn = (a: TodoItem, b: TodoItem) => a.dueDate.localeCompare(b.dueDate) || a.customer.name.localeCompare(b.customer.name, 'ko');
  const overdue = items.filter((i) => i.overdue).sort(sortFn);
  const todayItems = items.filter((i) => !i.overdue);
  const groups = GROUPS.map((g) => ({
    title: g.title,
    items: todayItems.filter((i) => g.kinds.includes(i.kind)).sort(sortFn),
  })).filter((g) => g.items.length > 0);

  return { overdue, groups, total: items.length };
}

/** 앞으로 7일 안의 예정 (오늘 제외) */
export function buildUpcoming(customers: Customer[], tasks: Task[], t = todayFn(), days = 7) {
  const byId = new Map(customers.map((c) => [c.id, c]));
  const end = addDays(t, days);
  const list: { key: string; customer: Customer; dueDate: string; title: string }[] = [];
  for (const task of tasks) {
    const c = byId.get(task.customerId);
    if (!c || task.done || task.dueDate <= t || task.dueDate > end) continue;
    list.push({ key: task.id, customer: c, dueDate: task.dueDate, title: taskTitle(task.kind, task.note) });
  }
  for (const c of customers) {
    if (c.nextContactDate && c.nextContactDate > t && c.nextContactDate <= end) {
      list.push({ key: `manual-${c.id}`, customer: c, dueDate: c.nextContactDate, title: taskTitle('manual') });
    }
  }
  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
