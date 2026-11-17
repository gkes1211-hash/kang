import type { Block, CanvasSpec, ColorKey, Grid, LoopFrame, Program, RunError, Step, Trace } from './types';

export const LIMITS = {
  /** 반복 블록 한 개가 가질 수 있는 최대 반복 횟수 */
  maxRepeat: 20,
  /** 한 번 실행에서 처리하는 최대 단계 수 (무한/과도한 실행 방지) */
  maxSteps: 6000,
  /** 반복 블록 중첩 최대 깊이 */
  maxDepth: 5,
};

export const MESSAGES = {
  outOfBounds: (dirWord: string) => `앗! 마법 펜이 도화지 밖(${dirWord})으로 나가려고 해요!`,
  tooManySteps: '마법 주문이 너무 길어서 펜이 지쳤어요. 반복 횟수를 줄여볼까요?',
  repeatTooBig: `반복 횟수가 너무 커요. ${LIMITS.maxRepeat}번 이하로 줄여볼까요?`,
  tooDeep: `반복 안에 반복이 너무 많이 들어 있어요. ${LIMITS.maxDepth}겹까지만 쓸 수 있어요.`,
  badRepeat: '반복 횟수는 1 이상이어야 해요.',
};

const DIR_DELTA = {
  up: [0, -1, '위쪽'],
  down: [0, 1, '아래쪽'],
  left: [-1, 0, '왼쪽'],
  right: [1, 0, '오른쪽'],
} as const;

export function emptyGrid(width: number, height: number): Grid {
  return new Array(width * height).fill(null);
}

class Halt extends Error {
  constructor(public runError: RunError) {
    super(runError.message);
  }
}

/**
 * 프로그램을 해석해 단계별 실행 기록(Trace)을 만든다.
 * - 펜은 (0,0)에서 시작하고, 시작 칸은 자동으로 칠하지 않는다.
 * - 색칠/지우기 블록만 픽셀을 바꾼다.
 * - 오류가 생기면 그 단계까지 기록하고 멈춘다.
 */
export function runProgram(program: Program, spec: CanvasSpec, startGrid?: Grid): Trace {
  const { width, height } = spec;
  const grid: Grid = startGrid ? startGrid.slice() : emptyGrid(width, height);
  let x = 0;
  let y = 0;
  let color: ColorKey = spec.startColor;
  const steps: Step[] = [];
  const loops: LoopFrame[] = [];
  let error: RunError | undefined;

  const push = (b: Block, extra: Partial<Step> = {}) => {
    const step: Step = {
      index: steps.length,
      blockId: b.id,
      kind: b.kind,
      x,
      y,
      color,
      loops: loops.map((l) => ({ ...l })),
      ...extra,
    };
    steps.push(step);
    if (step.error) throw new Halt(step.error);
    if (steps.length >= LIMITS.maxSteps) {
      throw new Halt({ code: 'too-many-steps', message: MESSAGES.tooManySteps, blockId: b.id });
    }
  };

  const exec = (blocks: Block[], depth: number) => {
    for (const b of blocks) {
      switch (b.kind) {
        case 'move': {
          const [dx, dy, word] = DIR_DELTA[b.dir];
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            push(b, { error: { code: 'out-of-bounds', message: MESSAGES.outOfBounds(word), blockId: b.id } });
          }
          x = nx;
          y = ny;
          push(b);
          break;
        }
        case 'paint':
        case 'erase': {
          const i = y * width + x;
          const from = grid[i];
          const to = b.kind === 'paint' ? color : null;
          grid[i] = to;
          push(b, { change: { i, from, to } });
          break;
        }
        case 'color': {
          color = b.color;
          push(b);
          break;
        }
        case 'repeat': {
          if (depth + 1 > LIMITS.maxDepth) {
            push(b, { error: { code: 'too-deep', message: MESSAGES.tooDeep, blockId: b.id } });
          }
          if (!Number.isFinite(b.times) || b.times < 1) {
            push(b, { error: { code: 'bad-repeat', message: MESSAGES.badRepeat, blockId: b.id } });
          }
          if (b.times > LIMITS.maxRepeat) {
            push(b, { error: { code: 'repeat-too-big', message: MESSAGES.repeatTooBig, blockId: b.id } });
          }
          const times = Math.floor(b.times);
          const frame: LoopFrame = { blockId: b.id, iter: 0, times };
          loops.push(frame);
          try {
            for (let k = 1; k <= times; k++) {
              frame.iter = k;
              exec(b.body, depth + 1);
            }
          } finally {
            loops.pop();
          }
          break;
        }
      }
    }
  };

  try {
    exec(program, 0);
  } catch (e) {
    if (e instanceof Halt) error = e.runError;
    else throw e;
  }

  return { width, height, startColor: spec.startColor, steps, error, final: { x, y, color, grid } };
}

/** 실행 기록의 앞에서부터 count 단계를 적용한 그리드 */
export function gridAt(trace: Trace, count: number, startGrid?: Grid): Grid {
  const g = startGrid ? startGrid.slice() : emptyGrid(trace.width, trace.height);
  const n = Math.min(count, trace.steps.length);
  for (let k = 0; k < n; k++) {
    const c = trace.steps[k].change;
    if (c) g[c.i] = c.to;
  }
  return g;
}

/** count 단계까지 실행했을 때의 펜 상태 */
export function penAt(trace: Trace, count: number): { x: number; y: number; color: ColorKey } {
  if (count <= 0 || trace.steps.length === 0) return { x: 0, y: 0, color: trace.startColor };
  // 오류 단계(밖으로 나가려던 이동)는 이동 전 위치가 기록되어 있다
  const s = trace.steps[Math.min(count, trace.steps.length) - 1];
  return { x: s.x, y: s.y, color: s.color };
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if ((a[i] ?? null) !== (b[i] ?? null)) return false;
  return true;
}

export function diffCells(a: Grid, b: Grid): number[] {
  const out: number[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? null) !== (b[i] ?? null)) out.push(i);
  return out;
}
