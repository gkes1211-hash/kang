/** 파일 내려받기가 가능한 환경인지 (claude.ai 웹페이지 버전에서는 보안상 막혀 있어 버튼을 숨긴다) */
export const CAN_DOWNLOAD = import.meta.env.VITE_ARTIFACT !== '1';

import type { Grid } from '../engine/types';
import { PALETTE, colorHex } from '../engine/palette';
import { encodeGif } from './gif';

export function exportScale(width: number): number {
  return Math.max(8, Math.floor(512 / width));
}

/** 그리드를 캔버스로 그린다. bg 가 없으면 빈칸은 투명 */
export function gridToCanvas(grid: Grid, width: number, height: number, scale: number, bg?: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width * scale;
  c.height = height * scale;
  const ctx = c.getContext('2d')!;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const k = grid[y * width + x];
      if (!k) continue;
      ctx.fillStyle = colorHex(k);
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  return c;
}

export function safeFileName(name: string, fallback: string): string {
  const s = (name || '').trim().replace(/[\\/:*?"<>|\n\r\t]+/g, '_').slice(0, 40);
  return s || fallback;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 변환 실패'))), 'image/png'));
}

export async function downloadPng(grid: Grid, width: number, height: number, name: string) {
  const c = gridToCanvas(grid, width, height, exportScale(width));
  downloadBlob(await canvasToBlob(c), safeFileName(name, '픽셀작품') + '.png');
}

/** 프레임들을 가로로 이어 붙인 스프라이트 시트 PNG */
export async function downloadSpriteSheet(frames: Grid[], width: number, height: number, name: string) {
  const scale = exportScale(width) / 2;
  const gap = Math.max(2, Math.floor(scale / 2));
  const sheet = document.createElement('canvas');
  sheet.width = frames.length * width * scale + (frames.length - 1) * gap;
  sheet.height = height * scale;
  const ctx = sheet.getContext('2d')!;
  frames.forEach((g, i) => ctx.drawImage(gridToCanvas(g, width, height, scale), i * (width * scale + gap), 0));
  downloadBlob(await canvasToBlob(sheet), safeFileName(name, '애니메이션') + '_스프라이트.png');
}

const GIF_BG = '#fbf6ec';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 애니메이션 GIF 바이트 생성 (빈칸은 크림색 배경) */
export function makeGif(frames: Grid[], width: number, height: number, fps: number, loop: boolean): Uint8Array {
  const scale = Math.max(4, Math.floor(256 / width));
  const W = width * scale;
  const H = height * scale;
  const palette: [number, number, number][] = [hexToRgb(GIF_BG), ...PALETTE.map((p) => hexToRgb(p.hex))];
  const indexOf = new Map(PALETTE.map((p, i) => [p.key, i + 1]));
  const gifFrames = frames.map((g) => {
    const idx = new Uint8Array(W * H);
    for (let py = 0; py < H; py++) {
      const y = Math.floor(py / scale);
      for (let px = 0; px < W; px++) {
        const k = g[y * width + Math.floor(px / scale)];
        idx[py * W + px] = k ? indexOf.get(k) ?? 0 : 0;
      }
    }
    return { indices: idx, delayCs: Math.round(100 / fps) };
  });
  return encodeGif(W, H, palette, gifFrames, loop);
}

export function downloadGif(frames: Grid[], width: number, height: number, fps: number, loop: boolean, name: string) {
  const bytes = makeGif(frames, width, height, fps, loop);
  downloadBlob(new Blob([bytes], { type: 'image/gif' }), safeFileName(name, '애니메이션') + '.gif');
}

/** 저장 목록 썸네일용 data URL */
export function gridThumb(grid: Grid, width: number, height: number): string {
  try {
    return gridToCanvas(grid, width, height, Math.max(2, Math.floor(64 / width)), GIF_BG).toDataURL('image/png');
  } catch {
    return '';
  }
}
