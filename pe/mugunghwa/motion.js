// 카메라 화면에서 "얼마나 움직였는지"만 계산하는 모듈.
// 영상은 작은 캔버스(64x48)로 줄여 이 기기 메모리 안에서만 비교하고,
// 어디에도 저장하거나 보내지 않는다.

export const SAMPLE_W = 64;
export const SAMPLE_H = 48;
const PIXEL_THRESHOLD = 18; // 밝기 차이가 이보다 크면 "움직인 점"으로 본다

// 두 흑백 프레임을 비교해 화면 왼쪽/오른쪽/전체에서 움직인 점의 비율(0~1)을 돌려준다.
export function diffRatios(prev, cur, w = SAMPLE_W, h = SAMPLE_H, threshold = PIXEL_THRESHOLD) {
  const half = w >> 1;
  let left = 0;
  let right = 0;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const i = row + x;
      if (Math.abs(cur[i] - prev[i]) > threshold) {
        if (x < half) left++;
        else right++;
      }
    }
  }
  const halfCount = half * h;
  return {
    left: left / halfCount,
    right: right / (w * h - halfCount),
    all: (left + right) / (w * h),
  };
}

export class MotionSensor {
  constructor(video) {
    this.video = video;
    this.canvas = document.createElement('canvas');
    this.canvas.width = SAMPLE_W;
    this.canvas.height = SAMPLE_H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.prev = null;
  }

  reset() {
    this.prev = null;
  }

  // 화면에 보이는 대로(거울처럼 좌우 반전) 왼쪽 = 1P, 오른쪽 = 2P가 되도록 읽는다.
  sample() {
    const v = this.video;
    if (!v || v.readyState < 2 || !v.videoWidth) return null;
    const { ctx } = this;
    ctx.setTransform(-1, 0, 0, 1, SAMPLE_W, 0);
    ctx.drawImage(v, 0, 0, SAMPLE_W, SAMPLE_H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
    const gray = new Uint8Array(SAMPLE_W * SAMPLE_H);
    for (let i = 0, j = 0; j < gray.length; i += 4, j++) {
      gray[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
    }
    const prev = this.prev;
    this.prev = gray;
    if (!prev) return { left: 0, right: 0, all: 0 };
    return diffRatios(prev, gray);
  }
}
