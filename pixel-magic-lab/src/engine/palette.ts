import type { ColorKey } from './types';

export interface PaletteColor {
  key: ColorKey;
  name: string;
  hex: string;
}

/** 아이들이 이름으로 부를 수 있는 12가지 마법 물감 */
export const PALETTE: PaletteColor[] = [
  { key: 'r', name: '빨강', hex: '#ec6f6f' },
  { key: 'o', name: '주황', hex: '#f5a25d' },
  { key: 'y', name: '노랑', hex: '#f6d55c' },
  { key: 'g', name: '초록', hex: '#7cc77a' },
  { key: 'm', name: '민트', hex: '#6fd3c1' },
  { key: 'b', name: '파랑', hex: '#6b9ee8' },
  { key: 'p', name: '보라', hex: '#a98bdc' },
  { key: 'k', name: '분홍', hex: '#f39cc3' },
  { key: 'n', name: '갈색', hex: '#b07f5c' },
  { key: 's', name: '살구', hex: '#f4cba4' },
  { key: 'w', name: '하양', hex: '#ffffff' },
  { key: 'd', name: '먹색', hex: '#4b3b36' },
];

const BY_KEY = new Map(PALETTE.map((c) => [c.key, c]));

export function colorHex(key: ColorKey | null | undefined): string {
  if (!key) return 'transparent';
  return BY_KEY.get(key)?.hex ?? '#cccccc';
}

export function colorName(key: ColorKey | null | undefined): string {
  if (!key) return '빈칸';
  return BY_KEY.get(key)?.name ?? key;
}

export function isColorKey(v: unknown): v is ColorKey {
  return typeof v === 'string' && BY_KEY.has(v);
}

/** 밝은 색 위에서는 진한 표시를, 어두운 색 위에서는 밝은 표시를 쓰기 위한 판단 */
export function isDarkColor(key: ColorKey | null): boolean {
  return key === 'd' || key === 'n' || key === 'b' || key === 'p';
}
