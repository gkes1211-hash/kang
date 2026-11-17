import type { Block, Program } from './types';
import { newId } from './program';

/**
 * 미션 정답·예시 코드를 짧게 적기 위한 작은 표기법
 *   U D L R : 위/아래/왼쪽/오른쪽 1칸 이동
 *   P       : 색칠하기
 *   E       : 지우기
 *   c:x     : 색을 x 로 바꾸기 (팔레트 키)
 *   3[ ... ]: 3번 반복
 */
export function parseDsl(src: string): Program {
  const tokens = src.replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').trim().split(/\s+/).filter(Boolean);
  let pos = 0;

  const parseList = (closing: boolean): Program => {
    const list: Block[] = [];
    while (pos < tokens.length) {
      const t = tokens[pos];
      if (t === ']') {
        if (!closing) throw new Error('짝이 맞지 않는 ]');
        pos++;
        return list;
      }
      pos++;
      if (t === 'U') list.push({ id: newId(), kind: 'move', dir: 'up' });
      else if (t === 'D') list.push({ id: newId(), kind: 'move', dir: 'down' });
      else if (t === 'L') list.push({ id: newId(), kind: 'move', dir: 'left' });
      else if (t === 'R') list.push({ id: newId(), kind: 'move', dir: 'right' });
      else if (t === 'P') list.push({ id: newId(), kind: 'paint' });
      else if (t === 'E') list.push({ id: newId(), kind: 'erase' });
      else if (t.startsWith('c:')) list.push({ id: newId(), kind: 'color', color: t.slice(2) });
      else if (/^\d+$/.test(t) && tokens[pos] === '[') {
        pos++;
        list.push({ id: newId(), kind: 'repeat', times: Number(t), body: parseList(true) });
      } else throw new Error('알 수 없는 표기: ' + t);
    }
    if (closing) throw new Error('닫히지 않은 [');
    return list;
  };

  return parseList(false);
}

export function toDsl(p: Program): string {
  return p
    .map((b) => {
      switch (b.kind) {
        case 'move':
          return { up: 'U', down: 'D', left: 'L', right: 'R' }[b.dir];
        case 'paint':
          return 'P';
        case 'erase':
          return 'E';
        case 'color':
          return 'c:' + b.color;
        case 'repeat':
          return `${b.times}[${toDsl(b.body)}]`;
      }
    })
    .join(' ');
}

/** 문자열 그림('.' = 빈칸) → 그리드 */
export function parseArt(rows: string[]): { width: number; height: number; grid: (string | null)[] } {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const grid: (string | null)[] = [];
  for (const r of rows) for (let x = 0; x < width; x++) grid.push(r[x] && r[x] !== '.' ? r[x] : null);
  return { width, height, grid };
}
