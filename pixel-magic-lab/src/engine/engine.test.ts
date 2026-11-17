import { describe, expect, it } from 'vitest';
import { runProgram, gridAt, penAt, gridsEqual, LIMITS } from './engine';
import { parseDsl, toDsl, parseArt } from './dsl';
import { gridToProgram } from './autoProgram';
import { countBlocks, insertBlock, makeBlock, moveBlock, nudgeBlock, removeBlock, sanitizeProgram, updateBlock, findBlock } from './program';
import { MISSIONS } from '../data/missions';
import { TEMPLATES, templatePrograms } from '../data/templates';
import { parOf, starsFor } from '../lib/scoring';
import { PALETTE } from './palette';

const spec = (w = 5, h = 5, c = 'r') => ({ width: w, height: h, startColor: c });

describe('실행 엔진 — 기본 블록', () => {
  it('시작 칸은 자동으로 칠하지 않는다', () => {
    const t = runProgram([], spec());
    expect(t.steps.length).toBe(0);
    expect(t.final.grid.every((c) => c === null)).toBe(true);
    expect(penAt(t, 0)).toEqual({ x: 0, y: 0, color: 'r' });
  });

  it('이동 블록은 위치만 바꾸고 색칠 블록만 픽셀을 바꾼다', () => {
    const t = runProgram(parseDsl('R D P'), spec());
    expect(t.steps.map((s) => [s.x, s.y])).toEqual([[1, 0], [1, 1], [1, 1]]);
    expect(t.steps[0].change).toBeUndefined();
    expect(t.steps[2].change).toEqual({ i: 6, from: null, to: 'r' });
    expect(t.final.grid.filter(Boolean).length).toBe(1);
  });

  it('네 방향 이동이 정확하다', () => {
    const t = runProgram(parseDsl('R R D D L U'), spec());
    expect([t.final.x, t.final.y]).toEqual([1, 1]);
  });

  it('색 바꾸기와 지우기', () => {
    const t = runProgram(parseDsl('P c:b R P L E'), spec());
    expect(t.final.grid[0]).toBe(null);
    expect(t.final.grid[1]).toBe('b');
    expect(t.final.color).toBe('b');
  });

  it('도화지 밖으로 나가면 오류 단계에서 멈추고 펜은 제자리', () => {
    const p = parseDsl('P L P');
    const t = runProgram(p, spec());
    expect(t.error?.code).toBe('out-of-bounds');
    expect(t.error?.blockId).toBe(p[1].id);
    expect(t.steps.length).toBe(2);
    expect(t.steps[1].error).toBeTruthy();
    expect(penAt(t, 2)).toMatchObject({ x: 0, y: 0 });
    expect(t.final.grid[0]).toBe('r');
  });

  it('아래/오른쪽 경계도 검사한다', () => {
    expect(runProgram(parseDsl('5[R]'), spec()).error?.code).toBe('out-of-bounds');
    expect(runProgram(parseDsl('4[R]'), spec()).error).toBeUndefined();
    expect(runProgram(parseDsl('5[D]'), spec()).error?.code).toBe('out-of-bounds');
  });
});

describe('실행 엔진 — 반복', () => {
  it('반복 블록은 안쪽 명령을 지정 횟수만큼 실행', () => {
    const t = runProgram(parseDsl('4[P R] P'), spec());
    expect(t.final.grid.slice(0, 5)).toEqual(['r', 'r', 'r', 'r', 'r']);
    expect(t.steps.length).toBe(9);
  });

  it('중첩 반복과 반복 차례 기록', () => {
    const p = parseDsl('3[2[P R] D]');
    const t = runProgram(p, spec(7, 5));
    expect(t.steps.length).toBe(3 * (2 * 2 + 1));
    const s = t.steps[t.steps.length - 1];
    expect(s.loops.length).toBe(1);
    expect(s.loops[0]).toMatchObject({ iter: 3, times: 3 });
    const inner = t.steps[2];
    expect(inner.loops.map((l) => l.iter)).toEqual([1, 2]);
    expect(t.final.grid.filter(Boolean).length).toBe(6);
  });

  it('빈 반복은 아무 일도 하지 않는다', () => {
    expect(runProgram(parseDsl('5[]'), spec()).steps.length).toBe(0);
  });

  it('반복 횟수가 너무 크면 안내', () => {
    const p = parseDsl(`${LIMITS.maxRepeat + 1}[P]`);
    const t = runProgram(p, spec());
    expect(t.error?.code).toBe('repeat-too-big');
    expect(t.error?.message).toContain('반복 횟수가 너무 커요');
  });

  it('지나치게 긴 실행은 안전 제한으로 멈춘다', () => {
    const t = runProgram(parseDsl('20[20[20[P]]]'), spec());
    expect(t.error?.code).toBe('too-many-steps');
    expect(t.steps.length).toBe(LIMITS.maxSteps);
  });

  it('반복 중첩 깊이 제한', () => {
    const t = runProgram(parseDsl('2[2[2[2[2[2[P]]]]]]'), spec());
    expect(t.error?.code).toBe('too-deep');
  });

  it('gridAt 은 단계별 결과를 재현한다', () => {
    const t = runProgram(parseDsl('P R P R P'), spec());
    expect(gridAt(t, 0).filter(Boolean).length).toBe(0);
    expect(gridAt(t, 3).filter(Boolean).length).toBe(2);
    expect(gridsEqual(gridAt(t, t.steps.length), t.final.grid)).toBe(true);
  });
});

describe('블록 편집 함수', () => {
  it('추가·이동·삭제·수정', () => {
    let p = parseDsl('P 2[R] D');
    const rep = p[1];
    const up = makeBlock('move', { dir: 'up' });
    p = insertBlock(p, rep.id, 0, up);
    expect(toDsl(p)).toBe('P 2[U R] D');
    p = moveBlock(p, p[0].id, rep.id, 2);
    expect(toDsl(p)).toBe('2[U R P] D');
    p = moveBlock(p, up.id, null, 2);
    expect(toDsl(p)).toBe('2[R P] D U');
    p = nudgeBlock(p, up.id, -1);
    expect(toDsl(p)).toBe('2[R P] U D');
    p = updateBlock(p, rep.id, { times: 5 } as any);
    expect(toDsl(p)).toBe('5[R P] U D');
    p = removeBlock(p, rep.id);
    expect(toDsl(p)).toBe('U D');
  });

  it('반복 블록을 자기 안으로 옮길 수 없다', () => {
    const p = parseDsl('2[3[P]]');
    const inner = (p[0] as any).body[0];
    expect(toDsl(moveBlock(p, p[0].id, inner.id, 0))).toBe('2[3[P]]');
  });

  it('잘못된 저장 데이터를 안전하게 정리', () => {
    const p = sanitizeProgram([{ kind: 'move', dir: 'nowhere' }, { kind: 'paint' }, { kind: 'repeat', times: 'x', body: [{ kind: 'color', color: 'zz' }] }, null, 5]);
    expect(toDsl(p)).toBe('P 2[]');
    expect(sanitizeProgram('garbage')).toEqual([]);
    expect(findBlock(p, p[0].id)).toBeTruthy();
  });

  it('블록 수 세기', () => {
    expect(countBlocks(parseDsl('P 2[R 3[D P]]'))).toBe(6);
  });
});

describe('미션 12개 — 모범 답안으로 실제 실행해 성공 판정', () => {
  for (const m of MISSIONS) {
    it(`${m.no}. ${m.title}`, () => {
      const { width, height, grid } = parseArt(m.art);
      for (const c of grid) if (c) expect(PALETTE.some((p) => p.key === c)).toBe(true);
      const prog = parseDsl(m.solution);
      const t = runProgram(prog, { width, height, startColor: m.startColor });
      expect(t.error).toBeUndefined();
      expect(gridsEqual(t.final.grid, grid)).toBe(true);
      // 정답 코드는 허용된 블록만 사용
      const kinds = new Set<string>();
      const walk = (p: typeof prog) => p.forEach((b) => (kinds.add(b.kind), b.kind === 'repeat' && walk(b.body)));
      walk(prog);
      for (const k of kinds) expect(m.allowed).toContain(k);
      expect(starsFor(m, countBlocks(prog))).toBe(3);
      expect(m.hints.length).toBeGreaterThanOrEqual(3);
    });
  }

  it('디버깅 미션의 시작 코드는 실제로 틀린 그림을 만든다', () => {
    for (const m of MISSIONS.filter((x) => x.starter)) {
      const { width, height, grid } = parseArt(m.art);
      const t = runProgram(parseDsl(m.starter!), { width, height, startColor: m.startColor });
      expect(gridsEqual(t.final.grid, grid)).toBe(false);
    }
  });

  it('순서가 달라도 결과가 같으면 성공 (판정은 그림 비교)', () => {
    const m = MISSIONS[1];
    const { width, height, grid } = parseArt(m.art);
    // 오른쪽 끝까지 간 뒤 왼쪽으로 돌아오며 칠하기
    const t = runProgram(parseDsl('4[R] 4[P L] P'), { width, height, startColor: m.startColor });
    expect(gridsEqual(t.final.grid, grid)).toBe(true);
  });

  it('별 계산', () => {
    const m = MISSIONS[5];
    const par = parOf(m);
    expect(starsFor(m, par)).toBe(3);
    expect(starsFor(m, par + 1)).toBe(2);
    expect(starsFor(m, par * 3)).toBe(1);
  });

  it('난이도는 쉬움 → 보통 → 도전 순서', () => {
    const order = { easy: 0, normal: 1, challenge: 2 };
    for (let i = 1; i < MISSIONS.length; i++) expect(order[MISSIONS[i].level]).toBeGreaterThanOrEqual(order[MISSIONS[i - 1].level]);
  });
});

describe('그림 → 코드 자동 변환', () => {
  it('애니메이션 템플릿 프레임을 정확히 재현', () => {
    for (const t of TEMPLATES) {
      const progs = templatePrograms(t, 'r');
      t.frames.forEach((rows, i) => {
        const { width, height, grid } = parseArt(rows);
        expect(width).toBe(8);
        expect(height).toBe(8);
        const tr = runProgram(progs[i], { width, height, startColor: 'r' });
        expect(tr.error).toBeUndefined();
        expect(gridsEqual(tr.final.grid, grid)).toBe(true);
      });
    }
  });

  it('무작위 그림 200개도 정확히 재현', () => {
    const keys = PALETTE.map((p) => p.key);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 200; n++) {
      const w = [8, 10, 16][n % 3];
      const grid = Array.from({ length: w * w }, () => (rnd() < 0.45 ? keys[Math.floor(rnd() * 3)] : null));
      const prog = gridToProgram(grid, w, w, 'r');
      const tr = runProgram(prog, { width: w, height: w, startColor: 'r' });
      expect(tr.error).toBeUndefined();
      expect(gridsEqual(tr.final.grid, grid)).toBe(true);
    }
  });
});
