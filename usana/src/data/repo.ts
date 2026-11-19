// ─────────────────────────────────────────────────────────────
// 저장소 계층: 앱의 모든 데이터 읽기/쓰기는 이 파일을 거친다.
// 나중에 Supabase 같은 클라우드로 옮길 때는 이 파일의 내부만 바꾸면 된다.
// (화면 코드는 db.ts나 Dexie를 직접 쓰지 않는다)
// ─────────────────────────────────────────────────────────────
import { db } from './db';
import { newId } from '../lib/id';
import { calcRunOutDate } from '../lib/calc';
import { addDays, today } from '../lib/date';
import type {
  BaseRecord, NewRecord, Customer, Product, Purchase, ContactLog, Template, Task, TaskKind, ContactMethod,
} from '../types';

// ── 변경 알림: 데이터가 바뀌면 화면들이 다시 읽도록 알려 줌 ──
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => fn());
}

function stamp<T extends BaseRecord>(data: NewRecord<T>): T {
  const now = new Date().toISOString();
  return { ...(data as object), id: newId(), createdAt: now, updatedAt: now } as T;
}

// ── 고객 ──
export async function listCustomers(): Promise<Customer[]> {
  return db.customers.toArray();
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return db.customers.get(id);
}

export async function addCustomer(data: NewRecord<Customer>): Promise<Customer> {
  const rec = stamp<Customer>(data);
  await db.customers.add(rec);
  notify();
  return rec;
}

export async function updateCustomer(id: string, changes: Partial<NewRecord<Customer>>): Promise<void> {
  await db.customers.update(id, { ...changes, updatedAt: new Date().toISOString() });
  notify();
}

/** 고객 요청 시 완전 삭제: 고객 + 그 고객의 구매·연락 기록까지 모두 지움 */
export async function deleteCustomerCompletely(id: string): Promise<void> {
  await db.transaction('rw', [db.customers, db.purchases, db.contacts, db.tasks], async () => {
    await db.tasks.where('customerId').equals(id).delete();
    await db.purchases.where('customerId').equals(id).delete();
    await db.contacts.where('customerId').equals(id).delete();
    await db.customers.delete(id);
  });
  notify();
}

// ── 제품 ──
export async function listProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function addProduct(data: NewRecord<Product>): Promise<Product> {
  const rec = stamp<Product>(data);
  await db.products.add(rec);
  notify();
  return rec;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return db.products.get(id);
}

export async function updateProduct(id: string, changes: Partial<NewRecord<Product>>): Promise<void> {
  await db.products.update(id, { ...changes, updatedAt: new Date().toISOString() });
  notify();
}

/** 제품 삭제. 이미 이 제품을 산 구매 기록은 남겨 둠 (이력은 지우지 않음) */
export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
  notify();
}

export async function countPurchasesOfProduct(productId: string): Promise<number> {
  return db.purchases.where('productId').equals(productId).count();
}

// ── 구매 ──
export type NewPurchase = Omit<NewRecord<Purchase>, 'runOutDate'>;

/**
 * 구매 기록 저장. 소진 예정일은 제품의 1통 섭취 기간으로 자동 계산.
 * 연락 일정도 자동으로 만든다:
 *  - 그 고객의 첫 구매면: D+1 감사, D+7 섭취 확인, D+45 후기·정기 주문
 *  - 모든 구매: 소진 7일 전 재구매 안내
 * 잠재 고객이 처음 구매하면 신규 고객으로 바꿔 줌.
 */
export async function addPurchase(data: NewPurchase): Promise<Purchase> {
  const product = await db.products.get(data.productId);
  if (!product) throw new Error('제품을 찾을 수 없어요.');
  const rec = stamp<Purchase>({
    ...data,
    runOutDate: calcRunOutDate(data.purchaseDate, product.daysPerUnit, data.quantity, data.people),
  });
  await db.transaction('rw', [db.purchases, db.customers, db.tasks], async () => {
    const isFirst = (await db.purchases.where('customerId').equals(data.customerId).count()) === 0;
    await db.purchases.add(rec);

    const plan: { kind: TaskKind; due: string }[] = [];
    if (isFirst) {
      plan.push({ kind: 'd1', due: addDays(rec.purchaseDate, 1) });
      plan.push({ kind: 'd7', due: addDays(rec.purchaseDate, 7) });
      plan.push({ kind: 'd45', due: addDays(rec.purchaseDate, 45) });
    }
    const refill = addDays(rec.runOutDate, -7);
    plan.push({ kind: 'refill', due: refill > rec.purchaseDate ? refill : addDays(rec.purchaseDate, 1) });
    // 과거 날짜로 구매를 입력한 경우, 이미 지난 일정은 만들지 않음
    const t = today();
    await db.tasks.bulkAdd(
      plan.filter((x) => x.due >= t).map((x) => stamp<Task>({
        customerId: rec.customerId, kind: x.kind, dueDate: x.due,
        purchaseId: rec.id, note: product.name, done: false,
      })),
    );

    const c = await db.customers.get(data.customerId);
    if (c && c.stage === 'prospect') {
      await db.customers.update(c.id, { stage: 'new', updatedAt: new Date().toISOString() });
    }
  });
  notify();
  return rec;
}

/** 구매 삭제. 그 구매로 생긴 아직 안 한 연락 일정도 함께 지움 */
export async function deletePurchase(id: string): Promise<void> {
  await db.transaction('rw', db.purchases, db.tasks, async () => {
    await db.tasks.where('purchaseId').equals(id).filter((t) => !t.done).delete();
    await db.purchases.delete(id);
  });
  notify();
}

export async function listPurchasesByCustomer(customerId: string): Promise<Purchase[]> {
  const rows = await db.purchases.where('customerId').equals(customerId).toArray();
  return rows.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
}

// ── 연락 기록 ──
export async function listContactsByCustomer(customerId: string): Promise<ContactLog[]> {
  const rows = await db.contacts.where('customerId').equals(customerId).toArray();
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function listAllContacts(): Promise<ContactLog[]> {
  return db.contacts.toArray();
}

export async function deleteContact(id: string): Promise<void> {
  await db.contacts.delete(id);
  notify();
}

// ── 연락 할 일 ──
export async function listTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function listTasksByCustomer(customerId: string): Promise<Task[]> {
  const rows = await db.tasks.where('customerId').equals(customerId).toArray();
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** 연락하지 않고 할 일만 넘기기 */
export async function skipTask(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.tasks.update(id, { done: true, doneAt: now, updatedAt: now });
  notify();
}

export interface RecordContactInput {
  customerId: string;
  date: string;
  method: ContactMethod;
  content: string;
  /** undefined: 그대로 / null: 지우기 / 날짜: 새 다음 연락일 */
  nextContactDate?: string | null;
  /** 저장된 할 일을 완료 처리 */
  taskId?: string;
  /** 저장되지 않은 할 일(생일·미연락·직접 정한 날)을 완료로 남김 */
  virtualTask?: { kind: TaskKind; dueDate: string; note?: string };
}

/** 연락 기록 남기기 + 할 일 완료 + 다음 연락일 바꾸기를 한 번에 */
export async function recordContact(input: RecordContactInput): Promise<ContactLog> {
  const contact = stamp<ContactLog>({
    customerId: input.customerId, date: input.date, method: input.method,
    content: input.content, taskId: input.taskId,
  });
  const now = new Date().toISOString();
  await db.transaction('rw', [db.contacts, db.tasks, db.customers], async () => {
    if (input.virtualTask) {
      const t = stamp<Task>({
        customerId: input.customerId, ...input.virtualTask,
        done: true, doneAt: now, contactId: contact.id,
      });
      await db.tasks.add(t);
      contact.taskId = t.id;
    }
    await db.contacts.add(contact);
    if (input.taskId) {
      await db.tasks.update(input.taskId, { done: true, doneAt: now, contactId: contact.id, updatedAt: now });
    }
    if (input.nextContactDate !== undefined) {
      await db.customers.update(input.customerId, { nextContactDate: input.nextContactDate ?? undefined, updatedAt: now });
    }
  });
  notify();
  return contact;
}

// ── 템플릿 ──
export async function listTemplates(): Promise<Template[]> {
  return db.templates.toArray();
}

// ── 전체 ──
export async function countAll() {
  const [customers, products, purchases, contacts] = await Promise.all([
    db.customers.count(), db.products.count(), db.purchases.count(), db.contacts.count(),
  ]);
  return { customers, products, purchases, contacts };
}

/** 모든 데이터 지우기 (테스트용) */
export async function clearAll(): Promise<void> {
  await db.transaction('rw', [db.customers, db.products, db.purchases, db.contacts, db.templates, db.tasks], async () => {
    await Promise.all([
      db.customers.clear(), db.products.clear(), db.purchases.clear(),
      db.contacts.clear(), db.templates.clear(), db.tasks.clear(),
    ]);
  });
  notify();
}
