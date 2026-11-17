import type { Program } from '../engine/types';
import { sanitizeProgram } from '../engine/program';

/** localStorage 를 안전하게 쓰기 위한 도우미 (사생활 모드 등에서 실패해도 앱이 멈추지 않도록) */
const PREFIX = 'pml.';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── 미션 진행 ──────────────────────────────
export interface MissionRecord {
  stars: number;
  best: number; // 가장 적은 블록 수
  doneAt: number;
}
export type Progress = Record<string, MissionRecord>;

export function loadProgress(): Progress {
  const raw = load<Record<string, unknown>>('progress', {});
  const out: Progress = {};
  if (raw && typeof raw === 'object')
    for (const [k, v] of Object.entries(raw)) {
      const o = v as Partial<MissionRecord>;
      if (o && typeof o.stars === 'number') out[k] = { stars: Math.max(0, Math.min(3, o.stars)), best: Number(o.best) || 0, doneAt: Number(o.doneAt) || 0 };
    }
  return out;
}

export function loadMissionDraft(id: string): Program | null {
  const all = load<Record<string, unknown>>('missionDrafts', {});
  return all && all[id] ? sanitizeProgram(all[id]) : null;
}
export function saveMissionDraft(id: string, p: Program) {
  const all = load<Record<string, unknown>>('missionDrafts', {});
  save('missionDrafts', { ...(all || {}), [id]: p });
}

// ── 자유 공방 작품 ──────────────────────────
export interface Work {
  id: string;
  name: string;
  width: number;
  height: number;
  program: Program;
  pixels: (string | null)[];
  updatedAt: number;
}

const SIZES = [8, 10, 16];
const okSize = (n: unknown) => (SIZES.includes(Number(n)) ? Number(n) : 8);

export function loadWorks(): Work[] {
  const raw = load<unknown[]>('works', []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((w) => w && typeof w === 'object')
    .map((w: any) => {
      const width = okSize(w.width);
      const height = okSize(w.height);
      return {
        id: String(w.id ?? Math.random()),
        name: String(w.name ?? '이름 없는 작품').slice(0, 40),
        width,
        height,
        program: sanitizeProgram(w.program),
        pixels: Array.isArray(w.pixels) ? w.pixels.slice(0, width * height) : [],
        updatedAt: Number(w.updatedAt) || 0,
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function saveWorks(list: Work[]): boolean {
  return save('works', list);
}

// ── 애니메이션 ───────────────────────────────
export interface AnimFrame {
  id: string;
  program: Program;
}
export interface Anim {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  loop: boolean;
  frames: AnimFrame[];
  updatedAt: number;
}

export function loadAnims(): Anim[] {
  const raw = load<unknown[]>('anims', []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === 'object')
    .map((a: any) => ({
      id: String(a.id ?? Math.random()),
      name: String(a.name ?? '이름 없는 애니메이션').slice(0, 40),
      width: okSize(a.width),
      height: okSize(a.height),
      fps: [2, 4, 8].includes(Number(a.fps)) ? Number(a.fps) : 4,
      loop: a.loop !== false,
      frames: (Array.isArray(a.frames) ? a.frames : [])
        .slice(0, 24)
        .map((f: any) => ({ id: String(f?.id ?? Math.random()), program: sanitizeProgram(f?.program) })),
      updatedAt: Number(a.updatedAt) || 0,
    }))
    .filter((a) => a.frames.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function saveAnims(list: Anim[]): boolean {
  return save('anims', list);
}

// ── 설정 ────────────────────────────────────
export interface Settings {
  muted: boolean;
  speed: number;
  unlockAll: boolean;
  seenHelp: boolean;
}
export function loadSettings(): Settings {
  const s = load<Partial<Settings>>('settings', {});
  return {
    muted: !!s?.muted,
    speed: typeof s?.speed === 'number' ? Math.max(0, Math.min(4, s.speed)) : 2,
    unlockAll: !!s?.unlockAll,
    seenHelp: !!s?.seenHelp,
  };
}
export function saveSettings(s: Settings) {
  save('settings', s);
}
