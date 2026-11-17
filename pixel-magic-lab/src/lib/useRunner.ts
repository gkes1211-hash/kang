import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Grid, Step, Trace } from '../engine/types';
import { gridAt, penAt } from '../engine/engine';

export type RunStatus = 'ready' | 'running' | 'paused' | 'done' | 'error';

export const SPEEDS = [
  { ms: 900, name: '아주 느리게' },
  { ms: 520, name: '느리게' },
  { ms: 280, name: '보통' },
  { ms: 130, name: '빠르게' },
  { ms: 45, name: '번개처럼' },
];

/**
 * 실행 엔진이 만든 단계 기록(Trace)을 시간에 맞춰 한 단계씩 재생한다.
 * UI는 이 훅이 알려주는 count(적용된 단계 수)로 그림·펜·강조 블록을 그린다.
 */
export function useRunner(
  trace: Trace,
  speedIndex: number,
  handlers: { onStep?: (s: Step) => void; onFinish?: (status: 'done' | 'error') => void; active?: boolean },
) {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<RunStatus>('ready');
  const h = useRef(handlers);
  h.current = handlers;
  const speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, speedIndex))].ms;

  // 프로그램이 바뀌면 실행 상태를 처음으로
  useEffect(() => {
    setCount(0);
    setStatus('ready');
  }, [trace]);

  const advance = useCallback(
    (from: number) => {
      const s = trace.steps[from];
      if (!s) {
        setStatus('done');
        h.current.onFinish?.('done');
        return;
      }
      setCount(from + 1);
      h.current.onStep?.(s);
      if (s.error) {
        setStatus('error');
        h.current.onFinish?.('error');
      } else if (from + 1 >= trace.steps.length) {
        setStatus('done');
        h.current.onFinish?.('done');
      }
    },
    [trace],
  );

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setTimeout(() => advance(count), count === 0 ? Math.min(220, speed) : speed);
    return () => window.clearTimeout(id);
  }, [status, count, speed, advance]);

  // 화면에서 사라지면 잠시 멈춤
  useEffect(() => {
    if (handlers.active === false && status === 'running') setStatus('paused');
  }, [handlers.active, status]);

  const play = useCallback(() => {
    if (status === 'running') return;
    if (trace.steps.length === 0) {
      setCount(0);
      setStatus('done');
      h.current.onFinish?.('done');
      return;
    }
    if (status === 'done' || status === 'error' || count >= trace.steps.length) setCount(0);
    setStatus('running');
  }, [status, count, trace]);

  const pause = useCallback(() => {
    if (status === 'running') setStatus('paused');
  }, [status]);

  const stepOnce = useCallback(() => {
    if (trace.steps.length === 0) {
      setStatus('done');
      h.current.onFinish?.('done');
      return;
    }
    const from = status === 'done' || status === 'error' ? 0 : count;
    setStatus('paused');
    advance(from);
  }, [status, count, trace, advance]);

  const restart = useCallback(() => {
    setCount(0);
    if (trace.steps.length === 0) {
      setStatus('done');
      h.current.onFinish?.('done');
      return;
    }
    setStatus('running');
  }, [trace]);

  const reset = useCallback(() => {
    setCount(0);
    setStatus('ready');
  }, []);

  const grid: Grid = useMemo(() => gridAt(trace, count), [trace, count]);
  const pen = useMemo(() => penAt(trace, count), [trace, count]);
  const current: Step | null = count > 0 ? trace.steps[count - 1] : null;

  return { count, status, play, pause, stepOnce, restart, reset, grid, pen, current, total: trace.steps.length, speedMs: speed };
}

export type Runner = ReturnType<typeof useRunner>;
