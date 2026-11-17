import { useCallback, useRef, useState } from 'react';

/** 실행 취소 / 다시 실행이 되는 상태 */
export function useHistory<T>(initial: T, limit = 80) {
  const [state, setState] = useState<{ past: T[]; present: T; future: T[] }>({ past: [], present: initial, future: [] });
  const lastMerge = useRef<{ key: string; at: number } | null>(null);

  /** mergeKey 가 같고 짧은 시간 안이면 하나의 기록으로 합친다 (예: 반복 횟수 + 버튼 연타) */
  const set = useCallback(
    (next: T | ((p: T) => T), mergeKey?: string) => {
      setState((s) => {
        const value = typeof next === 'function' ? (next as (p: T) => T)(s.present) : next;
        if (Object.is(value, s.present)) return s;
        const now = Date.now();
        const merge = mergeKey && lastMerge.current?.key === mergeKey && now - lastMerge.current.at < 1200;
        lastMerge.current = mergeKey ? { key: mergeKey, at: now } : null;
        if (merge) return { past: s.past, present: value, future: [] };
        return { past: [...s.past, s.present].slice(-limit), present: value, future: [] };
      });
    },
    [limit],
  );

  /** 기록 없이 통째로 바꾸기 (작품 불러오기 등) */
  const reset = useCallback((value: T) => {
    lastMerge.current = null;
    setState({ past: [], present: value, future: [] });
  }, []);

  const undo = useCallback(() => {
    lastMerge.current = null;
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    lastMerge.current = null;
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);

  return { value: state.present, set, reset, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
