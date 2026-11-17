import type { Grid } from '../engine/types';
import { colorHex } from '../engine/palette';
import { parseArt } from '../engine/dsl';

/** 작은 픽셀 그림 (썸네일, 마스코트, 목표 그림 미리보기) */
export function MiniGrid({
  grid,
  width,
  height,
  size = 64,
  paper = true,
  className,
  label,
}: {
  grid: Grid;
  width: number;
  height: number;
  size?: number;
  paper?: boolean;
  className?: string;
  label?: string;
}) {
  const cell = 10;
  const W = width * cell;
  const H = height * cell;
  const scale = size / Math.max(W, H);
  return (
    <svg
      className={'mini-grid ' + (className ?? '')}
      width={W * scale}
      height={H * scale}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {paper && <rect width={W} height={H} fill="var(--paper-cell)" />}
      {paper &&
        Array.from({ length: width * height }, (_, i) =>
          (i % width) % 2 === Math.floor(i / width) % 2 ? null : (
            <rect key={'p' + i} x={(i % width) * cell} y={Math.floor(i / width) * cell} width={cell} height={cell} fill="var(--paper-cell-alt)" />
          ),
        )}
      {grid.map((k, i) =>
        k ? <rect key={i} x={(i % width) * cell} y={Math.floor(i / width) * cell} width={cell} height={cell} fill={colorHex(k)} /> : null,
      )}
    </svg>
  );
}

const WIZARD = [
  '.....pp.....',
  '....pppp....',
  '...ppyppp...',
  '..pppppppp..',
  '.yyyyyyyyyy.',
  '...ssssss...',
  '...sdssds...',
  '...skssks...',
  '..wwwwwwww..',
  '..pwwwwwwp..',
  '..pppwwppp..',
  '..pp....pp..',
];
const WIZARD_ART = parseArt(WIZARD);

/** 연구소의 안내 마법사 '도토' */
export function Mascot({ size = 72, className }: { size?: number; className?: string }) {
  return <MiniGrid grid={WIZARD_ART.grid} width={12} height={12} size={size} paper={false} className={'mascot ' + (className ?? '')} label="픽셀 마법사 도토" />;
}

/** 로고용 픽셀 모자 */
export function HatLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <rect width="16" height="16" rx="3.5" fill="#fff6e4" />
      <g fill="#a98bdc">
        <rect x="7" y="2" width="2" height="2" />
        <rect x="6" y="4" width="4" height="2" />
        <rect x="5" y="6" width="6" height="2" />
        <rect x="4" y="8" width="8" height="2" />
        <rect x="3" y="10" width="10" height="2" />
      </g>
      <rect x="2" y="12" width="12" height="2" fill="#f6d55c" />
      <rect x="7" y="7" width="2" height="1" fill="#f6d55c" />
      <rect x="11" y="2" width="1" height="1" fill="#f39cc3" />
      <rect x="3" y="4" width="1" height="1" fill="#6fd3c1" />
    </svg>
  );
}
