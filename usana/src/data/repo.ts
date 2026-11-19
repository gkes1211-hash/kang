// ─────────────────────────────────────────────────────────────
// 저장소 계층: 앱의 모든 데이터 읽기/쓰기는 이 파일을 거친다.
// 나중에 Supabase 같은 클라우드로 옮길 때는 이 파일의 내부만 바꾸면 된다.
// (화면 코드는 db.ts나 Dexie를 직접 쓰지 않는다)
// ─────────────────────────────────────────────────────────────
import { db } from './db';
import { newId } from '../lib/id';
import type {
  BaseRecord, NewRecord, Customer, Product, Purchase, ContactLog, Template,
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
  await db.transaction('rw', db.customers, db.purchases, db.contacts, async () => {
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

// ── 구매 ──
export async function listPurchasesByCustomer(customerId: string): Promise<Purchase[]> {
  const rows = await db.purchases.where('customerId').equals(customerId).toArray();
  return rows.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
}

// ── 연락 기록 ──
export async function listContactsByCustomer(customerId: string): Promise<ContactLog[]> {
  const rows = await db.contacts.where('customerId').equals(customerId).toArray();
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
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
  await db.transaction('rw', [db.customers, db.products, db.purchases, db.contacts, db.templates], async () => {
    await Promise.all([
      db.customers.clear(), db.products.clear(), db.purchases.clear(),
      db.contacts.clear(), db.templates.clear(),
    ]);
  });
  notify();
}
