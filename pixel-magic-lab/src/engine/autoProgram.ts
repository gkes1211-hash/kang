import type { ColorKey, Grid, Program } from './types';
import { parseDsl } from './dsl';

/**
 * 완성된 픽셀 그림을 보고 그 그림을 그리는 명령 블록을 자동으로 만든다.
 * (애니메이션 예시 템플릿, 그림 → 코드 변환에 사용)
 * 반복되는 부분은 반복 블록으로 묶어 짧게 만든다.
 */
export function gridToProgram(grid: Grid, width: number, height: number, startColor: ColorKey): Program {
  const tokens: string[] = [];
  let cx = 0;
  let cy = 0;
  let color = startColor;

  for (let y = 0; y < height; y++) {
    const xs: number[] = [];
    for (let x = 0; x < width; x++) if (grid[y * width + x]) xs.push(x);
    if (!xs.length) continue;
    const min = xs[0];
    const max = xs[xs.length - 1];
    const leftToRight = Math.abs(cx - min) <= Math.abs(cx - max);
    const order = leftToRight ? xs : xs.slice().reverse();
    for (const tx of order) {
      while (cy < y) {
        tokens.push('D');
        cy++;
      }
      while (cx < tx) {
        tokens.push('R');
        cx++;
      }
      while (cx > tx) {
        tokens.push('L');
        cx--;
      }
      const c = grid[y * width + tx]!;
      if (c !== color) {
        tokens.push('c:' + c);
        color = c;
      }
      tokens.push('P');
    }
  }
  return parseDsl(compress(tokens));
}

/** 같은 묶음이 연속으로 반복되면 "n[ ... ]" 로 줄인다 (한 겹) */
function compress(tokens: string[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let best = { len: 0, k: 0, gain: 0 };
    for (let len = 1; len <= 4; len++) {
      if (i + len > tokens.length) break;
      let k = 1;
      while (k < 20 && i + (k + 1) * len <= tokens.length && same(tokens, i, i + k * len, len)) k++;
      if (k < 2) continue;
      const gain = k * len - (1 + len);
      if (gain > best.gain) best = { len, k, gain };
    }
    if (best.gain > 0) {
      out.push(`${best.k}[${tokens.slice(i, i + best.len).join(' ')}]`);
      i += best.k * best.len;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out.join(' ');
}

function same(t: string[], a: number, b: number, len: number): boolean {
  for (let j = 0; j < len; j++) if (t[a + j] !== t[b + j]) return false;
  return true;
}
