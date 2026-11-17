import { it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { makeGif } from './exporter';
import { TEMPLATES } from '../data/templates';
import { parseArt } from '../engine/dsl';

it('GIF 바이트 생성 (헤더/트레일러)', () => {
  const t = TEMPLATES[2];
  const frames = t.frames.map((r) => parseArt(r).grid);
  const bytes = makeGif(frames, 8, 8, 4, true);
  expect(String.fromCharCode(...bytes.slice(0, 6))).toBe('GIF89a');
  expect(bytes[bytes.length - 1]).toBe(0x3b);
  if (process.env.GIF_OUT) writeFileSync(process.env.GIF_OUT, bytes);
  // 16x16 무작위 + 큰 그림 (LZW 코드 크기 증가/초기화 경로)
  const big = Array.from({ length: 256 }, (_, i) => ['r', 'g', 'b', null, 'y', 'd'][(i * 7 + (i >> 3)) % 6]);
  const b2 = makeGif([big, big.slice().reverse()], 16, 16, 2, false);
  if (process.env.GIF_OUT) writeFileSync(process.env.GIF_OUT + '2.gif', b2);
});
