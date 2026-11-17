import { MISSIONS, type Mission } from '../data/missions';
import { parseDsl } from '../engine/dsl';
import { countBlocks } from '../engine/program';

/** 모범 답안의 블록 수 = 별 3개 기준 */
export function parOf(m: Mission): number {
  return countBlocks(parseDsl(m.solution));
}

/** 완성하면 별 1개, 블록을 아껴 쓰면 보너스 별 */
export function starsFor(m: Mission, used: number): number {
  const par = parOf(m);
  if (used <= par) return 3;
  if (used <= Math.ceil(par * 1.5)) return 2;
  return 1;
}

export const TITLES = [
  { min: 0, name: '꼬마 견습 마법사' },
  { min: 3, name: '픽셀 견습 마법사' },
  { min: 10, name: '반짝 픽셀 마법사' },
  { min: 18, name: '반복의 마법사' },
  { min: 26, name: '디버깅 마법사' },
  { min: 33, name: '픽셀 대마법사' },
];

export function titleFor(stars: number): string {
  let t = TITLES[0].name;
  for (const x of TITLES) if (stars >= x.min) t = x.name;
  return t;
}

export const MAX_STARS = MISSIONS.length * 3;
