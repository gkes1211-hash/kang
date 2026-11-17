import type { Block, BlockKind, ColorKey, Dir, Program, RepeatBlock } from './types';
import { isColorKey } from './palette';
import { LIMITS } from './engine';

let counter = 0;
export function newId(): string {
  counter = (counter + 1) % 1e9;
  return 'b' + Date.now().toString(36) + counter.toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}

export function makeBlock(kind: BlockKind, opts: { dir?: Dir; color?: ColorKey; times?: number } = {}): Block {
  const id = newId();
  switch (kind) {
    case 'move':
      return { id, kind, dir: opts.dir ?? 'right' };
    case 'paint':
      return { id, kind };
    case 'erase':
      return { id, kind };
    case 'color':
      return { id, kind, color: opts.color ?? 'r' };
    case 'repeat':
      return { id, kind, times: opts.times ?? 3, body: [] };
  }
}

/** 블록 개수 (반복 블록 자신 + 안쪽 블록 모두) */
export function countBlocks(p: Program): number {
  let n = 0;
  for (const b of p) {
    n++;
    if (b.kind === 'repeat') n += countBlocks(b.body);
  }
  return n;
}

export function findBlock(p: Program, id: string): Block | null {
  for (const b of p) {
    if (b.id === id) return b;
    if (b.kind === 'repeat') {
      const f = findBlock(b.body, id);
      if (f) return f;
    }
  }
  return null;
}

/** 블록이 들어 있는 부모(null=맨 바깥)와 위치 */
export function locate(p: Program, id: string, parent: string | null = null): { parent: string | null; index: number } | null {
  for (let i = 0; i < p.length; i++) {
    const b = p[i];
    if (b.id === id) return { parent, index: i };
    if (b.kind === 'repeat') {
      const f = locate(b.body, id, b.id);
      if (f) return f;
    }
  }
  return null;
}

function mapList(p: Program, parent: string | null, fn: (list: Block[]) => Block[]): Program {
  if (parent === null) return fn(p);
  return p.map((b) => {
    if (b.kind !== 'repeat') return b;
    if (b.id === parent) return { ...b, body: fn(b.body) };
    return { ...b, body: mapList(b.body, parent, fn) };
  });
}

export function insertBlock(p: Program, parent: string | null, index: number, block: Block): Program {
  return mapList(p, parent, (list) => {
    const i = Math.max(0, Math.min(index, list.length));
    return [...list.slice(0, i), block, ...list.slice(i)];
  });
}

export function removeBlock(p: Program, id: string): Program {
  const out: Program = [];
  for (const b of p) {
    if (b.id === id) continue;
    out.push(b.kind === 'repeat' ? { ...b, body: removeBlock(b.body, id) } : b);
  }
  return out;
}

export function updateBlock(p: Program, id: string, patch: Partial<Block>): Program {
  return p.map((b) => {
    if (b.id === id) return { ...b, ...patch } as Block;
    if (b.kind === 'repeat') return { ...b, body: updateBlock(b.body, id, patch) };
    return b;
  });
}

/** target 이 ancestor 안(자기 자신 포함)에 있는가 */
export function isInside(p: Program, ancestorId: string, targetId: string | null): boolean {
  if (targetId === null) return false;
  const anc = findBlock(p, ancestorId);
  if (!anc) return false;
  if (anc.id === targetId) return true;
  return anc.kind === 'repeat' && findBlock(anc.body, targetId) !== null;
}

export function depthOf(p: Program, id: string, d = 0): number {
  for (const b of p) {
    if (b.id === id) return d;
    if (b.kind === 'repeat') {
      const r = depthOf(b.body, id, d + 1);
      if (r >= 0) return r;
    }
  }
  return -1;
}

/** 블록을 parent 의 index 위치로 옮긴다. 자기 자신 안으로는 옮길 수 없다. */
export function moveBlock(p: Program, id: string, parent: string | null, index: number): Program {
  const block = findBlock(p, id);
  const from = locate(p, id);
  if (!block || !from) return p;
  if (parent !== null && isInside(p, id, parent)) return p;
  let idx = index;
  if (from.parent === parent && from.index < index) idx -= 1;
  return insertBlock(removeBlock(p, id), parent, idx, block);
}

/** 같은 목록 안에서 한 칸 위/아래로 */
export function nudgeBlock(p: Program, id: string, delta: -1 | 1): Program {
  const loc = locate(p, id);
  if (!loc) return p;
  const target = loc.index + delta;
  return mapList(p, loc.parent, (list) => {
    if (target < 0 || target >= list.length) return list;
    const copy = list.slice();
    [copy[loc.index], copy[target]] = [copy[target], copy[loc.index]];
    return copy;
  });
}

export function cloneProgram(p: Program): Program {
  return p.map((b) => (b.kind === 'repeat' ? { ...b, id: newId(), body: cloneProgram(b.body) } : { ...b, id: newId() }));
}

/** localStorage 등에서 읽은 알 수 없는 데이터를 안전한 프로그램으로 정리 */
export function sanitizeProgram(raw: unknown, depth = 0): Program {
  if (!Array.isArray(raw) || depth > LIMITS.maxDepth + 2) return [];
  const out: Program = [];
  for (const r of raw.slice(0, 2000)) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : newId();
    switch (o.kind) {
      case 'move':
        if (o.dir === 'up' || o.dir === 'down' || o.dir === 'left' || o.dir === 'right') out.push({ id, kind: 'move', dir: o.dir });
        break;
      case 'paint':
        out.push({ id, kind: 'paint' });
        break;
      case 'erase':
        out.push({ id, kind: 'erase' });
        break;
      case 'color':
        if (isColorKey(o.color)) out.push({ id, kind: 'color', color: o.color });
        break;
      case 'repeat': {
        const t = Number(o.times);
        const rep: RepeatBlock = {
          id,
          kind: 'repeat',
          times: Number.isFinite(t) ? Math.max(1, Math.min(99, Math.floor(t))) : 2,
          body: sanitizeProgram(o.body, depth + 1),
        };
        out.push(rep);
        break;
      }
    }
  }
  return out;
}
