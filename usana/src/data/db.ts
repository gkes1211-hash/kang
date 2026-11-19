import Dexie, { type Table } from 'dexie';
import type { Customer, Product, Purchase, ContactLog, Template, Task } from '../types';

// 폰 안 저장소(IndexedDB). 이 파일은 저장소 계층(repo.ts)에서만 불러 씀.
class AppDB extends Dexie {
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  purchases!: Table<Purchase, string>;
  contacts!: Table<ContactLog, string>;
  templates!: Table<Template, string>;
  tasks!: Table<Task, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('usana-crm');
    this.version(1).stores({
      customers: 'id, name, phone, stage, nextContactDate, updatedAt',
      products: 'id, name, category, updatedAt',
      purchases: 'id, customerId, productId, purchaseDate, runOutDate, updatedAt',
      contacts: 'id, customerId, date, updatedAt',
      templates: 'id, situation, updatedAt',
      settings: 'key',
    });
    // 2판: 연락 할 일 묶음 추가 (기존 데이터는 그대로 유지됨)
    this.version(2).stores({
      tasks: 'id, customerId, purchaseId, dueDate, kind, done, updatedAt',
    });
    // 3판: 템플릿을 만든 순서대로 보여 주려고 createdAt 색인 추가
    this.version(3).stores({
      templates: 'id, situation, createdAt, updatedAt',
    });
  }
}

export const db = new AppDB();
