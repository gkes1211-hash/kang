// 실제 브라우저(Chromium)로 빌드된 앱을 조작해 주요 기능을 검사합니다.
// 사용법: npm run build && npm run e2e
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 4179;
const APP_URL = `http://localhost:${PORT}/`;
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));

let failed = 0;
const ok = (cond, msg) => {
  console.log((cond ? '  ✔ ' : '  ✘ ') + msg);
  if (!cond) failed++;
};

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 657 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(APP_URL);

  const noScroll = async (label) => {
    const r = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(r.sh <= r.ih && r.sw <= r.iw, `${label}: 페이지 스크롤 없음 (${r.sw}×${r.sh} ≤ ${r.iw}×${r.ih})`);
    const btn = await page.locator('.mode-pane:not([hidden]) .run-btn').boundingBox();
    ok(btn && btn.y + btn.height <= r.ih, `${label}: 실행 버튼이 화면 안에 보임`);
  };
  const setFast = async () => {
    await page.locator('.mode-pane:not([hidden]) .speed input').evaluate((el) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(el, '4');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const pane = () => page.locator('.mode-pane:not([hidden])');

  console.log('■ 첫 화면');
  await page.getByText('마법 시작!').click();
  await page.getByText('시작해 볼까요?').click();
  await noScroll('미션 모드 1366×657');
  await page.screenshot({ path: SHOTS + 'mission.png' });

  console.log('■ 미션 12개를 모범 답안으로 실행해 성공 판정 확인');
  await setFast();
  for (let n = 1; n <= 12; n++) {
    await pane().getByRole('button', { name: /정답 코드/ }).click();
    await page.locator('.modal').getByRole('button', { exact: true, name: '정답 넣기' }).click();
    await pane().locator('.run-btn').click();
    const success = page.getByText('마법 성공!');
    await success.waitFor({ timeout: 15000 });
    const stars = await page.locator('.success .star.on').count();
    ok(stars === 3, `미션 ${n}: 성공 판정 + 별 ${stars}개`);
    if (n === 1) await page.screenshot({ path: SHOTS + 'success.png' });
    if (n < 12) {
      await page.locator('.modal').getByRole('button', { name: /다음 미션/ }).click();
      await page.getByText('시작해 볼까요?').click();
    } else {
      await page.locator('.modal').getByRole('button', { name: /미션 지도/ }).click();
      await page.screenshot({ path: SHOTS + 'map.png' });
      const stamps = await page.locator('.mini-stamp').count();
      ok(stamps === 12, `미션 지도에 완료 도장 ${stamps}개`);
      // 미션 2로 이동
      await page.locator('.map-card').nth(1).click();
      await page.waitForTimeout(300);
      if (await page.getByText('시작해 볼까요?').isVisible()) await page.getByText('시작해 볼까요?').click();
    }
  }
  ok((await page.locator('.title-badge b').innerText()) === '36', '별 36개 모두 모음');

  console.log('■ 직접 블록 조립: 미션 2 (드래그 없이 클릭만)');
  await pane().getByRole('button', { name: '주문서 모두 지우기' }).click();
  await page.locator('.modal').getByRole('button', { exact: true, name: '모두 지우기' }).click();
  const tool = (name) => pane().locator('.tool', { hasText: name }).first();
  for (let i = 0; i < 4; i++) {
    await tool('색칠하기').click();
    await tool('오른쪽').click();
  }
  await tool('색칠하기').click();
  ok((await pane().locator('.count-chip b').innerText()) === '9', '블록 9개 쌓임');

  console.log('■ 한 단계씩 실행 / 일시정지 / 이어서');
  await pane().getByRole('button', { name: /한 단계씩/ }).click();
  await pane().getByRole('button', { name: /한 단계씩/ }).click();
  await pane().getByRole('button', { name: /한 단계씩/ }).click();
  ok((await pane().locator('.run-status').innerText()).includes('3\n / 9') || (await pane().locator('.run-status').innerText()).replace(/\s+/g, ' ').includes('단계 3 / 9'), '한 단계씩 3번 → 단계 3/9');
  ok((await pane().locator('.blk.is-active').count()) === 1, '실행 중인 블록 1개 강조');
  ok((await pane().locator('.run-status').innerText()).includes('(1, 0)'), '펜 위치 (1, 0) 표시');
  await pane().locator('.speed input').evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, '1');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pane().locator('.run-btn').click(); // 이어서 실행
  await page.waitForTimeout(700);
  await pane().getByRole('button', { name: /일시정지/ }).click();
  const paused = (await pane().locator('.run-status').innerText()).replace(/\s+/g, ' ');
  ok(paused.includes('잠깐 멈춤'), '일시정지 상태 표시');
  await setFast();
  await pane().locator('.run-btn').click();
  await page.getByText('마법 성공!').waitFor({ timeout: 8000 });
  ok(true, '이어서 실행 → 직접 만든 코드로 성공');
  await page.locator('.modal').getByRole('button', { exact: true, name: '그림 다시 보기' }).click();

  console.log('■ 드래그로 순서 바꾸기');
  await pane().locator('.workspace-scroll').evaluate((e) => (e.scrollTop = 0));
  const first = pane().locator('.block-list.root > .block-item').first().locator('.blk');
  const last = pane().locator('.block-list.root > .block-item').nth(2).locator('.blk');
  const fb = await first.boundingBox();
  const lb = await last.boundingBox();
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  await page.mouse.down();
  await page.mouse.move(fb.x + fb.width / 2, fb.y + 40, { steps: 4 });
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height - 2, { steps: 8 });
  await page.mouse.up();
  const firstLabel = await pane().locator('.block-list.root > .block-item').first().locator('.blk-label').innerText();
  ok(firstLabel.includes('오른쪽'), `첫 블록을 끌어서 아래로 옮김 (이제 첫 블록: ${firstLabel})`);

  console.log('■ 도화지 밖 오류 / 틀린 칸 표시');
  await tool('오른쪽').click();
  await tool('오른쪽').click();
  await tool('오른쪽').click();
  await tool('오른쪽').click();
  await tool('오른쪽').click();
  await pane().locator('.run-btn').click();
  await pane().locator('.bubble.error').waitFor({ timeout: 8000 });
  ok((await pane().locator('.bubble.error').innerText()).includes('도화지 밖'), '"도화지 밖" 오류 안내');
  ok((await pane().locator('.blk.is-error').count()) === 1, '오류 블록 빨간 표시');
  await page.screenshot({ path: SHOTS + 'error.png' });
  await pane().getByRole('button', { name: '주문서 모두 지우기' }).click();
  await page.locator('.modal').getByRole('button', { exact: true, name: '모두 지우기' }).click();
  await tool('색칠하기').click();
  await pane().locator('.run-btn').click();
  await pane().locator('.bubble.warn').waitFor({ timeout: 8000 });
  ok((await pane().locator('.wrong-cell').count()) === 4, '목표와 다른 칸 4개에 ✕ 표시');
  await pane().getByRole('button', { name: /목표 겹쳐 보기/ }).click();
  ok((await pane().locator('.ghost-cell').count()) === 4, '목표 겹쳐 보기');
  await page.screenshot({ path: SHOTS + 'fail.png' });

  console.log('■ 자유 픽셀 공방');
  await page.getByRole('tab', { name: /자유 픽셀 공방/ }).click();
  await noScroll('공방 1366×657');
  const cells = pane().locator('.pixel-canvas rect[fill="transparent"]');
  await pane().locator('.brush-palette .pal-swatch').nth(0).click();
  await cells.nth(0).click();
  await cells.nth(9).click();
  await cells.nth(18).click();
  await pane().locator('.brush-palette .pal-swatch').nth(5).click();
  await cells.nth(7).click();
  await cells.nth(63).click();
  ok(Number(await pane().locator('.count-chip b').innerText()) > 5, '도화지를 눌러 블록 자동 생성');
  ok((await pane().locator('.pixel-canvas rect.px').count()) === 5, '미리보기에 픽셀 5개');
  await pane().getByRole('button', { name: '실행 취소' }).click();
  ok((await pane().locator('.pixel-canvas rect.px').count()) === 4, '실행 취소 → 픽셀 4개');
  await pane().getByRole('button', { name: '다시 실행', exact: true }).click();
  ok((await pane().locator('.pixel-canvas rect.px').count()) === 5, '다시 실행 → 픽셀 5개');
  await pane().getByLabel('작품 이름').fill('테스트 무지개');
  await page.screenshot({ path: SHOTS + 'workshop.png' });

  console.log('■ 저장하지 않고 모드 바꾸면 확인');
  await page.getByRole('tab', { name: /움직이는 픽셀 극장/ }).click();
  ok(await page.getByText('아직 저장하지 않았어요').isVisible(), '저장 확인 팝업');
  await page.locator('.modal').getByRole('button', { exact: true, name: '저장하고 이동' }).click();
  await page.waitForTimeout(200);
  ok(await page.locator('.mode-tab.t-theater.on').isVisible(), '저장 후 극장으로 이동');
  await page.getByRole('tab', { name: /자유 픽셀 공방/ }).click();
  ok((await pane().locator('.saved-chip').count()) === 1, '공방: 저장됨 표시');

  const dl1 = page.waitForEvent('download');
  await pane().getByRole('button', { name: /PNG 그림 받기/ }).click();
  const d1 = await dl1;
  const pngPath = SHOTS + 'download.png';
  await d1.saveAs(pngPath);
  const png = readFileSync(pngPath);
  ok(png.slice(1, 4).toString() === 'PNG' && png.length > 1000, `PNG 다운로드 (${d1.suggestedFilename()}, ${png.length} bytes)`);

  console.log('■ 새로고침 후 저장 유지');
  await page.reload();
  await page.getByText('시작해 볼까요?').click();
  await page.getByRole('tab', { name: /자유 픽셀 공방/ }).click();
  ok((await pane().getByLabel('작품 이름').inputValue()) === '테스트 무지개', '새로고침 후 작업 중 작품 유지');
  await pane().getByRole('button', { name: /내 작품 보관함/ }).click();
  ok((await page.locator('.gallery-card').count()) === 1 && (await page.locator('.gallery-card').innerText()).includes('테스트 무지개'), '보관함에 저장 작품');
  await page.screenshot({ path: SHOTS + 'gallery.png' });
  await page.locator('.gallery-card').getByRole('button', { name: /지우기/ }).click();
  ok(await page.getByText('작품을 지울까요?').isVisible(), '삭제 확인 팝업');
  await page.locator('.modal').getByRole('button', { exact: true, name: '취소' }).click();
  await page.locator('.modal-close').click();

  console.log('■ 16×16 도화지');
  await pane().getByRole('button', { name: /새 도화지/ }).click();
  await page.locator('.size-card', { hasText: '16×16' }).click();
  await page.waitForTimeout(300);
  ok((await pane().locator('.pixel-canvas rect.cell-bg').count()) === 256, '16×16 새 도화지');
  await noScroll('공방 16×16');

  console.log('■ 움직이는 픽셀 극장');
  await page.getByRole('tab', { name: /움직이는 픽셀 극장/ }).click();
  await noScroll('극장 1366×657');
  await pane().getByRole('button', { name: /새로·예시/ }).click();
  await page.locator('.template-card', { hasText: '눈 깜빡이는 고양이' }).click();
  ok((await pane().locator('.frame-thumb').count()) === 2, '고양이 예시: 프레임 2장');
  ok(Number(await pane().locator('.count-chip b').innerText()) > 5, '예시 프레임에도 명령 블록이 있음');
  await pane().getByRole('button', { name: '이 프레임 복사' }).click();
  ok((await pane().locator('.frame-thumb').count()) === 3, '프레임 복사 → 3장');
  await pane().getByRole('button', { name: '프레임 앞으로 옮기기' }).click();
  await pane().getByRole('button', { name: '프레임 지우기' }).click();
  await page.locator('.modal').getByRole('button', { exact: true, name: '지우기' }).click();
  ok((await pane().locator('.frame-thumb').count()) === 2, '프레임 지우기 → 2장');
  await pane().getByRole('button', { name: '빈 프레임 추가' }).click();
  ok((await pane().locator('.frame-thumb').count()) === 3, '빈 프레임 추가 → 3장');
  ok((await pane().locator('.pixel-canvas rect[opacity="0.3"]').count()) > 0, '어니언 스킨 표시');
  await pane().locator('.pixel-canvas rect[fill="transparent"]').nth(10).click();
  await page.waitForTimeout(400);
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    seen.add(await pane().locator('.pf-label').innerText());
    await page.waitForTimeout(170);
  }
  ok(seen.size >= 2, `애니메이션 재생 중 프레임이 바뀜 (${[...seen].join(', ')})`);
  await page.screenshot({ path: SHOTS + 'theater.png' });

  const dl2 = page.waitForEvent('download');
  await pane().getByRole('button', { name: /GIF/ }).click();
  const d2 = await dl2;
  await d2.saveAs(SHOTS + 'download.gif');
  const gif = readFileSync(SHOTS + 'download.gif');
  ok(gif.slice(0, 6).toString() === 'GIF89a', `GIF 내보내기 (${d2.suggestedFilename()}, ${gif.length} bytes)`);
  // 브라우저가 GIF를 실제로 읽을 수 있는지
  const gifOk = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/gif;base64,' + b64;
    await img.decode();
    return img.naturalWidth;
  }, gif.toString('base64'));
  ok(gifOk === 256, `브라우저가 GIF 해석 (너비 ${gifOk})`);
  const dl3 = page.waitForEvent('download');
  await pane().getByRole('button', { name: /프레임 모음 PNG/ }).click();
  const d3 = await dl3;
  await d3.saveAs(SHOTS + 'sprite.png');
  const sp = readFileSync(SHOTS + 'sprite.png');
  ok(sp.slice(1, 4).toString() === 'PNG' && sp.readUInt32BE(16) > sp.readUInt32BE(20) * 2, `스프라이트 시트 PNG (${sp.readUInt32BE(16)}×${sp.readUInt32BE(20)})`);

  await pane().getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await page.getByText('시작해 볼까요?').click();
  await page.getByRole('tab', { name: /움직이는 픽셀 극장/ }).click();
  ok((await pane().locator('.frame-thumb').count()) === 3, '새로고침 후 애니메이션 유지');
  await pane().getByRole('button', { name: /보관함/ }).click();
  ok((await page.locator('.gallery-card').count()) === 1, '애니메이션 보관함에 1개');
  await page.locator('.modal-close').click();

  console.log('■ 다른 화면 크기');
  for (const [w, h] of [
    [1366, 768],
    [1280, 720],
    [1280, 600],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    for (const tab of ['마법 따라 그리기', '자유 픽셀 공방', '움직이는 픽셀 극장']) {
      await page.getByRole('tab', { name: new RegExp(tab) }).click();
      const dlg = page.locator('.modal').getByRole('button', { exact: true, name: '나중에 저장' });
      if (await dlg.isVisible().catch(() => false)) await dlg.click();
      await page.waitForTimeout(100);
      await noScroll(`${tab} ${w}×${h}`);
    }
    await page.screenshot({ path: SHOTS + `theater-${w}x${h}.png` });
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByRole('tab', { name: /마법 따라 그리기/ }).click();
  await page.screenshot({ path: SHOTS + 'tablet-1024.png', fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: SHOTS + 'tablet-768.png', fullPage: true });
  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  ok(hScroll, '태블릿 세로(768): 가로 스크롤 없음');

  ok(errors.length === 0, '브라우저 오류 없음' + (errors.length ? ': ' + errors.join(' | ') : ''));
} catch (e) {
  console.error(e);
  failed++;
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `\n${failed}개 실패` : '\n모든 검사 통과!');
process.exit(failed ? 1 : 0);
