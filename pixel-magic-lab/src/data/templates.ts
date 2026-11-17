import { parseArt } from '../engine/dsl';
import { gridToProgram } from '../engine/autoProgram';
import type { Program } from '../engine/types';

export interface AnimTemplate {
  id: string;
  name: string;
  desc: string;
  fps: number;
  /** 각 프레임의 그림 (8×8) */
  frames: string[][];
}

const shift = (rows: string[], dy: number, h = 8): string[] => {
  const out = Array.from({ length: h }, () => '.'.repeat(rows[0].length));
  rows.forEach((r, i) => {
    const y = i + dy;
    if (y >= 0 && y < h) out[y] = r;
  });
  return out;
};

const BUNNY = ['..k.k...', '..k.k...', '.kkkkk..', '.kdkdk..', '.kkkkk..', '..k.k...'];

export const TEMPLATES: AnimTemplate[] = [
  {
    id: 'cat',
    name: '눈 깜빡이는 고양이',
    desc: '눈만 바뀌는 2장짜리 애니메이션',
    fps: 2,
    frames: [
      ['.o....o.', '.oo..oo.', '.oooooo.', '.odoodo.', '.odoodo.', '.ookkoo.', '..oooo..', '........'],
      ['.o....o.', '.oo..oo.', '.oooooo.', '.oooooo.', '.ddoodd.', '.ookkoo.', '..oooo..', '........'],
    ],
  },
  {
    id: 'bunny',
    name: '통통 뛰는 토끼',
    desc: '그림을 위아래로 옮겨 점프를 표현해요',
    fps: 4,
    frames: [shift(BUNNY, 2), shift(BUNNY, 1), shift(BUNNY, 0), shift(BUNNY, 1)],
  },
  {
    id: 'star',
    name: '반짝이는 별',
    desc: '작은 별 → 큰 별로 커졌다 작아져요',
    fps: 4,
    frames: [
      ['........', '........', '........', '...y....', '..yyy...', '...y....', '........', '........'],
      ['........', '........', '...y....', '...y....', '.yyyyy..', '...y....', '...y....', '........'],
      ['........', '.w.y.w..', '...y....', '..yyy...', 'yyyyyyy.', '..yyy...', '...y....', '.w.y.w..'],
      ['........', '........', '...y....', '...y....', '.yyyyy..', '...y....', '...y....', '........'],
    ],
  },
  {
    id: 'flower',
    name: '피어나는 꽃',
    desc: '새싹이 자라 꽃이 피어요',
    fps: 2,
    frames: [
      ['........', '........', '........', '........', '........', '..g.g...', '...g....', '...g....'],
      ['........', '........', '...k....', '...g....', '...g....', '..gg....', '...g....', '...g....'],
      ['........', '...k....', '..kyk...', '...g....', '...gg...', '..gg....', '...g....', '...g....'],
      ['..kkk...', '.kkykk..', '..kkk...', '...g....', '...gg...', '..gg....', '...g....', '...g....'],
    ],
  },
  {
    id: 'dino',
    name: '걷는 공룡',
    desc: '다리 모양을 번갈아 바꿔 걷는 것처럼 보여요',
    fps: 4,
    frames: [
      ['....ggg.', '....gdgg', '....ggg.', 'g..gggg.', 'gggggg..', '.ggggg..', '..g..g..', '.gg..gg.'],
      ['....ggg.', '....gdgg', '....ggg.', 'g..gggg.', 'gggggg..', '.ggggg..', '...gg...', '..gg.gg.'],
    ],
  },
];

/** 템플릿의 각 프레임 그림을 명령 블록 프로그램으로 바꾼다 */
export function templatePrograms(t: AnimTemplate, startColor: string): Program[] {
  return t.frames.map((rows) => {
    const { width, height, grid } = parseArt(rows);
    return gridToProgram(grid, width, height, startColor);
  });
}
