import Dexie, { type Table } from 'dexie';
import type { Customer, Product, Purchase, ContactLog, Template } from '../types';

// 폰 안 저장소(IndexedDB). 이 파일은 저장소 계층(repo.ts)에서만 불러 씀.
class AppDB extends Dexie {
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  purchases!: Table<Purchase, string>;
  contacts!: Table<ContactLog, string>;
  templates!: Table<Template, string>;
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
  }
}

export const db = new AppDB();
