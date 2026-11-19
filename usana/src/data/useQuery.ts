import { useEffect, useState, type DependencyList } from 'react';
import { subscribe } from './repo';

/** 저장소에서 값을 읽고, 데이터가 바뀌면 자동으로 다시 읽는 훅 */
export function useQuery<T>(fn: () => Promise<T>, deps: DependencyList): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const run = () => {
      fn().then((v) => alive && setValue(v));
    };
    run();
    const unsub = subscribe(run);
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
