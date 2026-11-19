// 만화 같은 그림 도우미: 3단 그림자(툰) 재질과 굵은 갈색 테두리
import * as THREE from './vendor/three.module.min.js';

export { THREE };
export const OUTLINE = '#3b2414';

const grad = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = THREE.NearestFilter;
grad.magFilter = THREE.NearestFilter;
grad.generateMipmaps = false;
grad.needsUpdate = true;

const cache = new Map();
// 같은 색은 재질 하나를 같이 쓴다 (extra 가 있으면 새로 만든다)
export function toon(color, extra = null) {
  if (!extra && cache.has(color)) return cache.get(color);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, ...(extra || {}) });
  if (!extra) cache.set(color, m);
  return m;
}
export const outlineMat = new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide });

// 테두리 있는 도형: 같은 모양을 조금 크게, 안쪽 면만 갈색으로 그려 테두리처럼 보이게 한다
export function part(geo, color, { line = true, t = 0.028, mat = null } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat || toon(color));
  g.add(m);
  if (line) {
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    const o = new THREE.Mesh(geo, outlineMat);
    o.scale.setScalar(1 + t / Math.max(0.05, geo.boundingSphere.radius));
    o.userData.outline = true;
    g.add(o);
  }
  g.userData.main = m;
  return g;
}
export const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
export const sph = (r, ws = 24, hs = 16) => new THREE.SphereGeometry(r, ws, hs);
export const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 16);
export const cyl = (r1, r2, h, s = 18) => new THREE.CylinderGeometry(r1, r2, h, s);
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
