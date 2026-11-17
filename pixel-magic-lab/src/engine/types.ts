// ───────────────────────────────────────────────
//  명령 블록 데이터 구조 (UI와 독립된 순수 데이터)
// ───────────────────────────────────────────────

export type Dir = 'up' | 'down' | 'left' | 'right';

/** 팔레트 색 키 (palette.ts 참고) */
export type ColorKey = string;

export type MoveBlock = { id: string; kind: 'move'; dir: Dir };
export type PaintBlock = { id: string; kind: 'paint' };
export type EraseBlock = { id: string; kind: 'erase' };
export type ColorBlock = { id: string; kind: 'color'; color: ColorKey };
export type RepeatBlock = { id: string; kind: 'repeat'; times: number; body: Block[] };

export type Block = MoveBlock | PaintBlock | EraseBlock | ColorBlock | RepeatBlock;
export type BlockKind = Block['kind'];
export type Program = Block[];

/** 픽셀 그리드: 길이 width*height, 칸마다 색 키 또는 빈칸(null) */
export type Grid = (ColorKey | null)[];

export interface CanvasSpec {
  width: number;
  height: number;
  /** 실행 시작 시 펜이 가진 색 */
  startColor: ColorKey;
}

export type RunErrorCode = 'out-of-bounds' | 'too-many-steps' | 'repeat-too-big' | 'too-deep' | 'bad-repeat';

export interface RunError {
  code: RunErrorCode;
  message: string;
  blockId?: string;
}

export interface LoopFrame {
  blockId: string;
  /** 1부터 시작하는 현재 반복 차례 */
  iter: number;
  times: number;
}

/** 실행 엔진이 내보내는 한 단계 */
export interface Step {
  index: number;
  blockId: string;
  kind: BlockKind;
  /** 이 단계 실행 후 펜 위치 */
  x: number;
  y: number;
  /** 이 단계 실행 후 펜 색 */
  color: ColorKey;
  /** 픽셀 변경 결과 (색칠/지우기에서만) */
  change?: { i: number; from: ColorKey | null; to: ColorKey | null };
  /** 오류가 난 단계면 오류 정보 (이 단계에서 실행이 멈춤) */
  error?: RunError;
  /** 실행 중인 반복 블록들 (바깥 → 안쪽) */
  loops: LoopFrame[];
}

export interface Trace {
  width: number;
  height: number;
  startColor: ColorKey;
  steps: Step[];
  error?: RunError;
  /** 실행이 끝난 뒤의 상태 */
  final: { x: number; y: number; color: ColorKey; grid: Grid };
}
