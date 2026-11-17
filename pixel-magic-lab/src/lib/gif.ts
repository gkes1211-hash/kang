/**
 * 아주 작은 GIF89a 인코더 (외부 라이브러리 없이)
 * - 최대 256색 팔레트, 프레임마다 지연 시간, 무한 반복 지원
 */
export interface GifFrame {
  /** 팔레트 인덱스 (width*height) */
  indices: Uint8Array;
  /** 1/100초 단위 */
  delayCs: number;
}

export function encodeGif(width: number, height: number, palette: [number, number, number][], frames: GifFrame[], loop: boolean): Uint8Array {
  const out: number[] = [];
  const w16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  const str = (s: string) => {
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  };

  // 팔레트 크기는 2의 거듭제곱 (최소 4)
  let bits = 2;
  while (1 << bits < palette.length) bits++;
  const tableSize = 1 << bits;

  str('GIF89a');
  w16(width);
  w16(height);
  out.push(0x80 | ((bits - 1) << 4) | (bits - 1), 0, 0);
  for (let i = 0; i < tableSize; i++) {
    const c = palette[i] ?? [0, 0, 0];
    out.push(c[0], c[1], c[2]);
  }

  if (loop) {
    out.push(0x21, 0xff, 0x0b);
    str('NETSCAPE2.0');
    out.push(0x03, 0x01, 0x00, 0x00, 0x00);
  }

  for (const f of frames) {
    // Graphic Control Extension
    out.push(0x21, 0xf9, 0x04, 0x04);
    w16(Math.max(2, Math.round(f.delayCs)));
    out.push(0x00, 0x00);
    // Image Descriptor
    out.push(0x2c);
    w16(0);
    w16(0);
    w16(width);
    w16(height);
    out.push(0x00);
    const minCode = Math.max(2, bits);
    out.push(minCode);
    const data = lzw(f.indices, minCode);
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.subarray(i, i + 255);
      out.push(chunk.length);
      for (let j = 0; j < chunk.length; j++) out.push(chunk[j]);
    }
    out.push(0x00);
  }
  out.push(0x3b);
  return new Uint8Array(out);
}

function lzw(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const table = new Map<number, number>();
  const bytes: number[] = [];
  let cur = 0;
  let curBits = 0;

  const emit = (code: number) => {
    cur |= code << curBits;
    curBits += codeSize;
    while (curBits >= 8) {
      bytes.push(cur & 0xff);
      cur >>>= 8;
      curBits -= 8;
    }
  };

  emit(clearCode);
  if (indices.length === 0) {
    emit(eoiCode);
    if (curBits > 0) bytes.push(cur & 0xff);
    return new Uint8Array(bytes);
  }

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const found = table.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    emit(prefix);
    if (nextCode === 4096) {
      emit(clearCode);
      table.clear();
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
    } else {
      if (nextCode >= 1 << codeSize) codeSize++;
      table.set(key, nextCode++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoiCode);
  if (curBits > 0) bytes.push(cur & 0xff);
  return new Uint8Array(bytes);
}
