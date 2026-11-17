import type { Block, ColorKey, Program, Trace } from '../engine/types';
import { newId } from '../engine/program';

/**
 * '그리기 도우미': 도화지 칸을 누르면 펜이 그 칸까지 가서 칠하는 블록을 주문서 끝에 붙인다.
 * 마우스로 그려도 결국 코드가 만들어지므로 코딩 학습이 이어진다.
 * 3칸 이상 같은 방향으로 가면 반복 블록으로 묶는다.
 */
export function appendGoTo(program: Program, trace: Trace, x: number, y: number, brush: ColorKey | 'erase'): { program: Program; added: number } {
  // 오류로 멈춘 경우에는 멈춘 위치에서 이어간다
  const last = trace.steps[trace.steps.length - 1];
  const from = trace.error && last ? { x: last.x, y: last.y, color: last.color } : trace.final;
  const blocks: Block[] = [];
  const moves = (dir: 'up' | 'down' | 'left' | 'right', n: number) => {
    if (n <= 0) return;
    if (n >= 3) blocks.push({ id: newId(), kind: 'repeat', times: n, body: [{ id: newId(), kind: 'move', dir }] });
    else for (let i = 0; i < n; i++) blocks.push({ id: newId(), kind: 'move', dir });
  };
  moves(y > from.y ? 'down' : 'up', Math.abs(y - from.y));
  moves(x > from.x ? 'right' : 'left', Math.abs(x - from.x));
  if (brush === 'erase') blocks.push({ id: newId(), kind: 'erase' });
  else {
    if (brush !== from.color) blocks.push({ id: newId(), kind: 'color', color: brush });
    blocks.push({ id: newId(), kind: 'paint' });
  }
  return { program: [...program, ...blocks], added: blocks.length };
}
