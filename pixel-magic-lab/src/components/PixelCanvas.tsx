import { useState } from 'react';
import type { ColorKey, Grid } from '../engine/types';
import { colorHex, colorName } from '../engine/palette';

export interface PixelCanvasProps {
  width: number;
  height: number;
  grid: Grid;
  pen?: { x: number; y: number; color: ColorKey } | null;
  penError?: boolean;
  /** 목표 그림 겹쳐 보기 */
  ghost?: Grid | null;
  /** 이전 프레임 반투명 (어니언 스킨) */
  onion?: Grid | null;
  /** 목표와 다른 칸 */
  wrong?: number[] | null;
  /** 방금 바뀐 칸 (반짝 효과) */
  flash?: { i: number; key: number } | null;
  onCellClick?: (x: number, y: number) => void;
  /** 펜 이동 애니메이션 시간(ms) */
  moveMs?: number;
  label?: string;
}

const CELL = 10;
const PAD = 6; // 좌표 숫자 자리

/** SVG 픽셀 도화지: 좌표 눈금, 마법 펜, 오류/틀린 칸 표시까지 한 곳에서 그린다 */
export function PixelCanvas(p: PixelCanvasProps) {
  const { width, height, grid } = p;
  const [hover, setHover] = useState<number | null>(null);
  const W = width * CELL;
  const H = height * CELL;
  const fs = width > 12 ? 3.4 : 3.6;
  const wrong = new Set(p.wrong ?? []);
  const clickable = !!p.onCellClick;

  return (
    <svg
      className={'pixel-canvas' + (clickable ? ' is-clickable' : '')}
      viewBox={`${-PAD} ${-PAD} ${W + PAD + 2} ${H + PAD + 2}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={p.label ?? `${width}×${height} 픽셀 도화지`}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <pattern id="wrongHatch" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1" height="2.4" fill="rgba(214,88,88,.38)" />
        </pattern>
      </defs>

      {/* 좌표 눈금 */}
      {Array.from({ length: width }, (_, x) => (
        <text key={'cx' + x} x={x * CELL + CELL / 2} y={-2.2} className="axis" fontSize={fs} textAnchor="middle">
          {x}
        </text>
      ))}
      {Array.from({ length: height }, (_, y) => (
        <text key={'cy' + y} x={-2.4} y={y * CELL + CELL / 2 + fs * 0.36} className="axis" fontSize={fs} textAnchor="end">
          {y}
        </text>
      ))}

      {/* 종이 */}
      <rect x={-0.3} y={-0.3} width={W + 0.6} height={H + 0.6} rx={0.8} className="canvas-paper-edge" />
      {Array.from({ length: width * height }, (_, i) => {
        const x = i % width;
        const y = Math.floor(i / width);
        return <rect key={'bg' + i} x={x * CELL} y={y * CELL} width={CELL} height={CELL} className={(x + y) % 2 ? 'cell-bg alt' : 'cell-bg'} />;
      })}

      {/* 어니언 스킨 */}
      {p.onion?.map((k, i) =>
        k && !grid[i] ? (
          <rect key={'on' + i} x={(i % width) * CELL + 0.5} y={Math.floor(i / width) * CELL + 0.5} width={CELL - 1} height={CELL - 1} fill={colorHex(k)} opacity={0.3} />
        ) : null,
      )}

      {/* 목표 겹쳐 보기 */}
      {p.ghost?.map((k, i) =>
        k && grid[i] !== k ? (
          <rect
            key={'gh' + i}
            x={(i % width) * CELL + 1}
            y={Math.floor(i / width) * CELL + 1}
            width={CELL - 2}
            height={CELL - 2}
            rx={1}
            fill={colorHex(k)}
            opacity={0.42}
            className="ghost-cell"
          />
        ) : null,
      )}

      {/* 칠해진 픽셀 */}
      {grid.map((k, i) =>
        k ? (
          <rect key={'px' + i} x={(i % width) * CELL} y={Math.floor(i / width) * CELL} width={CELL} height={CELL} fill={colorHex(k)} className={'px' + (k === 'w' ? ' px-white' : '')} />
        ) : null,
      )}

      {/* 격자선 */}
      <g className="grid-lines">
        {Array.from({ length: width + 1 }, (_, x) => (
          <line key={'lx' + x} x1={x * CELL} y1={0} x2={x * CELL} y2={H} />
        ))}
        {Array.from({ length: height + 1 }, (_, y) => (
          <line key={'ly' + y} x1={0} y1={y * CELL} x2={W} y2={y * CELL} />
        ))}
      </g>

      {/* 틀린 칸: 빗금 + 점선 테두리 + ✕ (색 말고도 모양으로 구분) */}
      {[...wrong].map((i) => {
        const x = (i % width) * CELL;
        const y = Math.floor(i / width) * CELL;
        return (
          <g key={'w' + i} className="wrong-cell">
            <rect x={x + 0.8} y={y + 0.8} width={CELL - 1.6} height={CELL - 1.6} fill="url(#wrongHatch)" />
            <rect x={x + 0.8} y={y + 0.8} width={CELL - 1.6} height={CELL - 1.6} className="wrong-border" />
            <path d={`M${x + 3} ${y + 3}L${x + 7} ${y + 7}M${x + 7} ${y + 3}L${x + 3} ${y + 7}`} className="wrong-x" />
          </g>
        );
      })}

      {/* 반짝 */}
      {p.flash && grid[p.flash.i] !== undefined && (
        <g key={'f' + p.flash.key} className="flash" transform={`translate(${(p.flash.i % width) * CELL + 5} ${Math.floor(p.flash.i / width) * CELL + 5})`}>
          <path d="M0 -7.5 1.4 -1.4 7.5 0 1.4 1.4 0 7.5 -1.4 1.4 -7.5 0 -1.4 -1.4Z" />
        </g>
      )}

      {/* 마우스 올린 칸 */}
      {clickable && hover !== null && (
        <rect x={(hover % width) * CELL + 0.6} y={Math.floor(hover / width) * CELL + 0.6} width={CELL - 1.2} height={CELL - 1.2} className="hover-cell" />
      )}

      {/* 마법 펜 */}
      {p.pen && (
        <g
          className={'pen' + (p.penError ? ' pen-error' : '')}
          style={{ transform: `translate(${p.pen.x * CELL + 5}px, ${p.pen.y * CELL + 5}px)`, transitionDuration: `${p.moveMs ?? 160}ms` }}
          aria-label={`마법 펜 위치 (${p.pen.x}, ${p.pen.y}), ${colorName(p.pen.color)}`}
        >
          <rect x={-5.2} y={-5.2} width={10.4} height={10.4} rx={2.2} className="pen-ring-outer" />
          <rect x={-5.2} y={-5.2} width={10.4} height={10.4} rx={2.2} className="pen-ring-inner" />
          <g className="pen-wand">
            <path d="M-1.5 1.5 4 -4" className="pen-stick" />
            <path d="M4.6 -7.6 5.5 -5.5 7.6 -4.6 5.5 -3.7 4.6 -1.6 3.7 -3.7 1.6 -4.6 3.7 -5.5Z" fill={colorHex(p.pen.color)} className="pen-star" />
          </g>
          {p.penError && (
            <text x={0} y={2.4} textAnchor="middle" className="pen-bang">
              !
            </text>
          )}
        </g>
      )}

      {/* 클릭 영역 */}
      {clickable &&
        Array.from({ length: width * height }, (_, i) => (
          <rect
            key={'hit' + i}
            x={(i % width) * CELL}
            y={Math.floor(i / width) * CELL}
            width={CELL}
            height={CELL}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onClick={() => p.onCellClick!(i % width, Math.floor(i / width))}
          >
            <title>{`(${i % width}, ${Math.floor(i / width)})`}</title>
          </rect>
        ))}
    </svg>
  );
}
