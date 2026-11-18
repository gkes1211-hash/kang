// 열쇠 학교 퍼즐 화면. 상자를 열면 이 화면이 3D 세상 위에 뜬다.
// 모양: choice(고르기) number(숫자 자물쇠) order(순서) listen(듣고 고르기) spell(철자)
//       melody(건반) color(물감 섞기) move(몸 움직이기) code(블록 코딩)
import { shuffle, PAINTS } from './content.js';
import { unlockAudio, beep, sfx, speak, hush } from '../common/sound.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl = (s) => esc(s).replace(/\n/g, '<br>');

// 영어 목소리
let enVoice = null;
function pickEn() { enVoice = speechSynthesis.getVoices().find((v) => /^en[-_](US|GB)/i.test(v.lang)) || speechSynthesis.getVoices().find((v) => /^en/i.test(v.lang)) || null; }
if ('speechSynthesis' in window) { pickEn(); speechSynthesis.addEventListener?.('voiceschanged', pickEn); }
export function sayEnglish(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (enVoice) u.voice = enVoice;
    u.lang = enVoice?.lang || 'en-US';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  } catch { /* 목소리가 없어도 글자로 풀 수 있다 */ }
}

const NOTE_HZ = { 도: 261.63, 레: 293.66, 미: 329.63, 파: 349.23, 솔: 392.0, 라: 440.0, 시: 493.88, 도2: 523.25 };
const NOTE_COLOR = { 도: '#ff5c5c', 레: '#ff9f40', 미: '#ffd23f', 파: '#5ccf6b', 솔: '#3fb5ff', 라: '#5b6cff', 시: '#b05cff', 도2: '#ff5c9e' };
const noteName = (n) => (n === '도2' ? '높은 도' : n);
function playNote(n, when = 0, dur = 0.38) { beep(NOTE_HZ[n], dur, 'triangle', 0.22, when); }

// ------------------------------------------------------------
// 퍼즐 열기. 결과: onSolved({wrong, hints}) / onClose()
// ------------------------------------------------------------
export function openPuzzle(host, pz, { title, color = '#5b4bff', grade = 3, onSolved, onWrong = () => {}, onClose, solvedBefore = false, voice = true }) {
  unlockAudio();
  hush();
  host.innerHTML = '';
  host.hidden = false;
  host.style.setProperty('--pz', color);
  const card = el('div', 'pz-card');
  const head = el('div', 'pz-head');
  head.append(el('div', 'pz-title', esc(title)));
  const readBtn = el('button', 'pz-icon', '🔊'); readBtn.type = 'button'; readBtn.title = '문제 읽어 주기'; readBtn.setAttribute('aria-label', '문제 읽어 주기');
  const hintBtn = el('button', 'pz-icon', '💡'); hintBtn.type = 'button'; hintBtn.title = '힌트'; hintBtn.setAttribute('aria-label', '힌트 보기');
  const closeBtn = el('button', 'pz-icon', '✕'); closeBtn.type = 'button'; closeBtn.title = '닫기'; closeBtn.setAttribute('aria-label', '닫기');
  head.append(readBtn, hintBtn, closeBtn);
  const q = el('div', 'pz-q', nl(pz.q || ''));
  const body = el('div', 'pz-body');
  const msg = el('div', 'pz-msg'); msg.setAttribute('aria-live', 'polite');
  card.append(head, q, body, msg);
  host.append(card);

  const stats = { wrong: 0, hints: 0 };
  let done = false;
  let cleanup = () => {};
  const close = () => { cleanup(); hush(); host.hidden = true; host.innerHTML = ''; };
  const say = (text, kind = '') => { msg.className = `pz-msg ${kind}`; msg.innerHTML = nl(text); };
  const shake = () => { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); };

  const api = {
    grade,
    body,
    say,
    win(extra = '') {
      if (done) return;
      done = true;
      sfx.win();
      const ex = pz.ex ? `\n${pz.ex}` : '';
      say(`🎉 정답이에요!${ex}${extra ? `\n${extra}` : ''}`, 'ok');
      card.classList.add('solved');
      const go = el('button', 'pz-go', solvedBefore ? '닫기' : '🔓 상자 열기!');
      go.type = 'button';
      go.addEventListener('click', () => { close(); onSolved(stats); });
      msg.append(go);
      go.focus();
    },
    wrong(text = '앗, 다시 해 봐요!') {
      if (done) return;
      stats.wrong += 1;
      sfx.fail();
      shake();
      onWrong();
      if (stats.wrong >= 2 && pz.hint && hintLevel === 0) showHint();
      else say(`🤔 ${text}`, 'bad');
    },
    hintLevel: () => hintLevel,
    onHint2: null, // 두 번째 힌트(퍼즐마다 다르게)
    setCleanup(f) { cleanup = f; },
  };

  let hintLevel = 0;
  function showHint() {
    if (done) return;
    hintLevel += 1;
    stats.hints += 1;
    if (hintLevel === 1) say(`💡 ${pz.hint || '천천히 다시 읽어 봐요. 2번 누르면 더 큰 힌트!'}`, 'hint');
    else if (api.onHint2) { api.onHint2(); }
    else say(`💡 ${pz.hint || '천천히 다시 읽어 봐요.'}`, 'hint');
  }
  hintBtn.addEventListener('click', showHint);
  closeBtn.addEventListener('click', () => { close(); onClose?.(); });
  readBtn.addEventListener('click', () => {
    if (pz.type === 'listen') sayEnglish(pz.say);
    else speak((pz.q || '').replace(/[^\p{L}\p{N}\s?.,!/×÷+\-=]/gu, ' '), true);
  });
  host.onkeydown = (e) => { if (e.key === 'Escape') { close(); onClose?.(); } };

  const R = RENDER[pz.type] || RENDER.choice;
  R(pz, api);
  if (voice && grade <= 2 && pz.type !== 'listen' && pz.type !== 'melody') setTimeout(() => readBtn.click(), 250);
  return { close };
}

// ------------------------------------------------------------
const RENDER = {
  // 고르기
  choice(pz, api) {
    const opts = shuffle(pz.opts.map((t, i) => ({ t, ok: i === pz.a })));
    const grid = el('div', `pz-opts n${opts.length}`);
    const btns = opts.map((o) => {
      const b = el('button', 'pz-opt', esc(o.t)); b.type = 'button';
      b.addEventListener('click', () => {
        if (o.ok) { b.classList.add('right'); api.win(); } else { b.classList.add('nope'); b.disabled = true; api.wrong(); }
      });
      grid.append(b);
      return { b, o };
    });
    api.body.append(grid);
    api.onHint2 = () => {
      const wrong = btns.filter((x) => !x.o.ok && !x.b.disabled);
      shuffle(wrong).slice(0, Math.max(0, wrong.length - 1)).forEach((x) => { x.b.disabled = true; x.b.classList.add('nope'); });
      api.say('💡 틀린 답을 지웠어요. 남은 것 중에서 골라요!', 'hint');
    };
  },

  // 듣고 고르기 (영어)
  listen(pz, api) {
    const play = el('button', 'pz-big', '🔊 다시 듣기'); play.type = 'button';
    play.addEventListener('click', () => sayEnglish(pz.say));
    api.body.append(play);
    const opts = shuffle(pz.opts.map(([w, pic], i) => ({ w, pic, ok: i === pz.a })));
    const grid = el('div', 'pz-opts n4');
    const btns = opts.map((o) => {
      const b = el('button', 'pz-opt pic', pz.showPic ? `<span class="pic">${o.pic}</span>${esc(o.w)}` : esc(o.w)); b.type = 'button';
      b.addEventListener('click', () => { if (o.ok) { b.classList.add('right'); api.win(); } else { b.classList.add('nope'); b.disabled = true; api.wrong('다시 잘 들어 봐요!'); sayEnglish(pz.say); } });
      grid.append(b);
      return { b, o };
    });
    api.body.append(grid);
    setTimeout(() => sayEnglish(pz.say), 300);
    api.onHint2 = () => {
      const wrong = btns.filter((x) => !x.o.ok && !x.b.disabled);
      shuffle(wrong).slice(0, Math.max(0, wrong.length - 1)).forEach((x) => { x.b.disabled = true; x.b.classList.add('nope'); });
      api.say(`💡 첫 글자는 "${pz.say[0]}"예요.`, 'hint');
    };
  },

  // 숫자 자물쇠
  number(pz, api) {
    let val = '';
    const screen = el('div', 'pz-lock', '<span>?</span>');
    const pad = el('div', 'pz-pad');
    const show = () => { screen.innerHTML = `<span>${val || '?'}</span>`; };
    const press = (k) => {
      beep(700 + (Number(k) || 0) * 40, 0.05, 'square', 0.06);
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === '확인') { if (!val) return; if (val === pz.a) { screen.classList.add('open'); api.win(); } else { val = ''; api.wrong(); } }
      else if (val.length < 7) val += k;
      show();
    };
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '확인'].forEach((k) => {
      const b = el('button', k === '확인' ? 'ok' : '', k); b.type = 'button';
      b.addEventListener('click', () => press(k));
      pad.append(b);
    });
    api.body.append(screen, pad);
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter') press('확인');
    };
    window.addEventListener('keydown', onKey);
    api.setCleanup(() => window.removeEventListener('keydown', onKey));
    api.onHint2 = () => api.say(`💡 답은 ${pz.a.length}자리 수이고, 첫 숫자는 ${pz.a[0]}이에요.`, 'hint');
  },

  // 순서 맞추기 (글자 카드 포함)
  order(pz, api) { tiles(api, pz.items, { slotsLabel: '차례대로 눌러요', join: ' → ' }); },
  spell(pz, api) {
    const big = el('div', 'pz-pic', pz.pic);
    api.body.append(big);
    tiles(api, pz.word.split(''), { letters: true });
  },

  // 건반
  melody(pz, api) {
    const notes = pz.notes;
    let at = 0;
    const row = el('div', 'pz-notes');
    const chips = notes.map((n) => { const c = el('span', 'note', noteName(n)); c.style.setProperty('--c', NOTE_COLOR[n]); row.append(c); return c; });
    const listen = el('button', 'pz-big', '🔊 들어 보기'); listen.type = 'button';
    const playAll = () => notes.forEach((n, i) => playNote(n, i * 0.45));
    listen.addEventListener('click', playAll);
    const piano = el('div', 'pz-piano');
    ['도', '레', '미', '파', '솔', '라', '시', '도2'].forEach((n) => {
      const k = el('button', 'key', `<i></i>${noteName(n)}`); k.type = 'button';
      k.style.setProperty('--c', NOTE_COLOR[n]);
      k.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        playNote(n);
        k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 150);
        if (n === notes[at]) {
          chips[at].classList.add('hit'); at += 1;
          if (at === notes.length) { setTimeout(playAll, 350); api.win('멋진 연주예요! 🎶'); }
        } else {
          at = 0; chips.forEach((c) => c.classList.remove('hit'));
          api.wrong(`"${noteName(notes[at])}"부터 다시 쳐 봐요.`);
        }
      });
      piano.append(k);
    });
    api.body.append(listen, row, piano);
    api.onHint2 = () => { chips.forEach((c) => c.classList.add('color')); api.say('💡 계이름 색과 건반 색이 같아요!', 'hint'); };
    if (api.grade <= 2) chips.forEach((c) => c.classList.add('color'));
  },

  // 물감 섞기
  color(pz, api) {
    const mix = pz.mix;
    const max = 3;
    let picked = [];
    const target = el('div', 'pz-swatches', `<div class="sw"><b style="background:${mix.color}"></b>만들 색: ${esc(mix.name)}</div>`);
    const result = el('div', 'sw');
    result.innerHTML = '<b class="empty"></b>내 팔레트';
    target.append(result);
    const drops = el('div', 'pz-drops');
    const pots = el('div', 'pz-pots');
    const draw = () => {
      drops.innerHTML = picked.length ? picked.map((p) => `<span style="background:${PAINTS[p]}" title="${p}"></span>`).join('') : '<em>물감을 골라 넣어요 (같은 색은 한 번만)</em>';
      const b = result.querySelector('b');
      if (!picked.length) { b.className = 'empty'; b.style.background = ''; return; }
      b.className = '';
      b.style.background = mixColor(picked);
    };
    Object.keys(PAINTS).forEach((p) => {
      const b = el('button', 'pot', `<i style="background:${PAINTS[p]}"></i>${p}`); b.type = 'button';
      b.addEventListener('click', () => {
        if (picked.includes(p) || picked.length >= max) { beep(200, 0.08, 'square', 0.05); return; }
        picked.push(p); beep(500 + picked.length * 120, 0.08, 'sine', 0.12); draw();
      });
      pots.append(b);
    });
    const actions = el('div', 'pz-actions');
    const clear = el('button', 'ghost', '🧽 비우기'); clear.type = 'button';
    clear.addEventListener('click', () => { picked = []; draw(); });
    const check = el('button', 'ok', '🖌️ 섞기!'); check.type = 'button';
    check.addEventListener('click', () => {
      if (!picked.length) return;
      const ok = picked.length === mix.parts.length && mix.parts.every((p) => picked.includes(p));
      if (ok) { result.querySelector('b').style.background = mix.color; api.win(); } else { api.wrong(picked.length < mix.parts.length ? '물감이 모자라요. 더 섞어 볼까요?' : '색이 조금 달라요. 비우고 다시 해 봐요!'); }
    });
    actions.append(clear, check);
    api.body.append(target, drops, pots, actions);
    draw();
    api.onHint2 = () => api.say(`💡 "${mix.parts[0]}"이(가) 꼭 들어가요. 모두 ${mix.parts.length}가지!`, 'hint');
  },

  move: (pz, api) => movePuzzle(pz, api),
  code: (pz, api) => codePuzzle(pz, api),
};

// 물감 섞은 색 (대략)
function mixColor(parts) {
  const rgb = parts.map((p) => { const h = PAINTS[p]; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); });
  const key = parts.slice().sort().join('+');
  const known = { '노랑+빨강': '#fb8c00', '노랑+파랑': '#43a047', '빨강+파랑': '#8e24aa', '빨강+하양': '#f48fb1', '파랑+하양': '#81d4fa', '검정+하양': '#9e9e9e', '노랑+빨강+파랑': '#795548', '노랑+파랑+하양': '#aed581', '빨강+파랑+하양': '#ce93d8', '노랑+빨강+하양': '#ffcc80', '검정+파랑': '#283593' };
  if (known[key]) return known[key];
  const avg = [0, 1, 2].map((i) => Math.round(rgb.reduce((s, c) => s + c[i], 0) / rgb.length));
  return `rgb(${avg.join(',')})`;
}

// 카드를 차례대로 눌러 칸에 놓기
function tiles(api, answer, { letters = false, join = '' } = {}) {
  const slots = el('div', `pz-slots${letters ? ' letters' : ''}`);
  const pool = el('div', `pz-pool${letters ? ' letters' : ''}`);
  const placed = [];
  const cards = shuffle(answer.map((t, i) => ({ t, i })));
  // 섞었는데 그대로면 한 번 더
  if (cards.length > 1 && cards.every((c, k) => c.i === k)) cards.push(cards.shift());
  const slotEls = answer.map(() => { const s = el('div', 'slot'); slots.append(s); return s; });
  const btns = cards.map((c) => {
    const b = el('button', 'tile', esc(c.t)); b.type = 'button';
    b.addEventListener('click', () => {
      if (b.classList.contains('used')) return;
      b.classList.add('used');
      placed.push({ c, b });
      sfx.pop();
      draw();
      if (placed.length === answer.length) check();
    });
    pool.append(b);
    return { b, c };
  });
  function draw() {
    slotEls.forEach((s, k) => {
      const p = placed[k];
      s.textContent = p ? p.c.t : '';
      s.classList.toggle('filled', !!p);
      s.onclick = p && !s.classList.contains('lock') ? () => { const idx = placed.indexOf(p); placed.splice(idx).forEach((x) => x.b.classList.remove('used')); draw(); } : null;
    });
  }
  function check() {
    const ok = placed.every((p, k) => p.c.t === answer[k]);
    if (ok) { slotEls.forEach((s) => s.classList.add('right')); api.win(); return; }
    // 맞은 앞부분은 남기고 나머지는 되돌린다
    let keep = 0;
    while (keep < placed.length && placed[keep].c.t === answer[keep]) keep += 1;
    setTimeout(() => { placed.splice(keep).forEach((x) => x.b.classList.remove('used')); draw(); }, 450);
    api.wrong(keep ? `앞의 ${keep}개는 맞았어요! 나머지를 다시 놓아 봐요.` : '순서를 다시 생각해 봐요!');
  }
  api.body.append(slots, pool);
  if (join && !letters) slots.dataset.join = join;
  api.onHint2 = () => {
    // 다음 하나를 대신 놓아 준다
    let keep = 0;
    while (keep < placed.length && placed[keep].c.t === answer[keep]) keep += 1;
    placed.splice(keep).forEach((x) => x.b.classList.remove('used'));
    const next = btns.find((x) => !x.b.classList.contains('used') && x.c.t === answer[keep]);
    if (next) { next.b.classList.add('used'); placed.push({ c: next.c, b: next.b }); }
    draw();
    api.say(`💡 ${keep + 1}번째 칸을 채워 줬어요!`, 'hint');
    if (placed.length === answer.length) check();
  };
}

// ------------------------------------------------------------
// 몸 움직이기 (체육): 카메라로 스쿼트·팔 벌려 뛰기를 센다. 카메라가 없으면 스스로 세기.
// ------------------------------------------------------------
const EX_INFO = {
  squat: { name: '스쿼트', emoji: '🏋️', how: '카메라에서 2~3걸음 뒤로 가서 온몸이 보이게 서요. 의자에 앉듯 깊이 앉았다 일어나요.' },
  jack: { name: '팔 벌려 뛰기', emoji: '🙆', how: '온몸이 보이게 서요. 팔을 머리 위로, 다리는 옆으로 벌렸다가 모아요.' },
};
function movePuzzle(pz, api) {
  const info = EX_INFO[pz.ex];
  let count = 0;
  const top = el('div', 'pz-move-top', `<span class="pz-count"><b>0</b> / ${pz.count}</span>`);
  const stage = el('div', 'pz-cam');
  const video = el('video'); video.playsInline = true; video.muted = true; video.autoplay = true;
  const canvas = el('canvas');
  stage.append(video, canvas);
  const tip = el('div', 'pz-tip', esc(info.how));
  const btnRow = el('div', 'pz-actions');
  const camBtn = el('button', 'ok', '📷 카메라로 하기'); camBtn.type = 'button';
  const selfBtn = el('button', 'ghost', '✋ 카메라 없이 하기'); selfBtn.type = 'button';
  btnRow.append(camBtn, selfBtn);
  api.body.append(top, tip, stage, btnRow);
  stage.hidden = true;
  const countEl = top.querySelector('b');
  let running = true;
  let stream = null;
  let raf = 0;
  const add = () => {
    count += 1; countEl.textContent = count;
    sfx.good(count);
    if (count >= pz.count) { stop(); api.win(`${info.emoji} ${info.name} ${pz.count}번 성공!`); }
  };
  function stop() { running = false; cancelAnimationFrame(raf); import('../common/camera.js').then((m) => m.stopCamera(video, stream)).catch(() => {}); }
  api.setCleanup(stop);

  selfBtn.addEventListener('click', () => {
    stop(); running = true; stage.hidden = true; btnRow.innerHTML = '';
    tip.textContent = `${info.emoji} ${info.name}을(를) 한 번 할 때마다 아래 단추를 눌러요. 정직하게!`;
    const b = el('button', 'pz-big tap', `${info.emoji} 한 번 했어요!`); b.type = 'button';
    let last = 0;
    b.addEventListener('click', () => { const t = performance.now(); if (t - last < 700) return; last = t; add(); });
    btnRow.append(b);
  });

  camBtn.addEventListener('click', async () => {
    camBtn.disabled = true; camBtn.textContent = '⏳ 카메라 켜는 중…';
    try {
      const cam = await import('../common/camera.js');
      stream = await cam.startCamera(video);
      stage.hidden = false;
      camBtn.textContent = '⏳ 몸 인식 준비 중… (처음엔 몇 초)';
      const sensor = await cam.getSensor(video, 1);
      btnRow.innerHTML = '';
      btnRow.append(selfBtn);
      tip.textContent = info.how;
      const counter = new RepCounter(pz.ex, cam);
      let lastT = performance.now();
      const loop = () => {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
        const { W, H } = cam.fitCanvas(canvas);
        const ctx = canvas.getContext('2d');
        const r = cam.videoRect(video, W, H);
        if (!r) return;
        cam.drawMirrored(ctx, video, r);
        const lm = sensor.detect(now)[0];
        const pts = lm ? cam.toPixels(lm, r) : null;
        if (pts) cam.drawSkeleton(ctx, pts, { width: Math.max(4, W / 160), color: 'rgba(255,255,255,0.9)' });
        const res = counter.update(pts, dt);
        if (res === 'rep') add();
        // 얼마나 했는지 막대
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(W - 34, 20, 18, H - 40);
        ctx.fillStyle = counter.depth >= 1 ? '#22c55e' : '#ffd23f';
        const h = (H - 40) * counter.depth; ctx.fillRect(W - 34, H - 20 - h, 18, h);
        if (counter.tip) { tip.textContent = counter.tip; }
      };
      loop();
    } catch (err) {
      camBtn.disabled = false; camBtn.textContent = '📷 카메라로 하기';
      stage.hidden = true;
      api.say(`📷 ${err.message || '카메라를 켤 수 없어요.'}\n"카메라 없이 하기"로 해도 돼요.`, 'bad');
    }
  });
}

class RepCounter {
  constructor(ex, cam) { this.ex = ex; this.cam = cam; this.S = 0; this.state = 'up'; this.depth = 0; this.sm = {}; this.peak = 0; this.tip = ''; }
  smooth(k, v, a = 0.5) { this.sm[k] = this.sm[k] == null ? v : this.sm[k] + (v - this.sm[k]) * a; return this.sm[k]; }
  update(pts, dt) {
    const { torso, vis } = this.cam;
    const s = pts && torso(pts);
    if (!s) { this.depth = 0; this.tip = '🙋 화면에 몸이 보이게 서요'; return null; }
    this.S = this.S ? Math.max(this.S * (1 - 0.05 * dt), s) : s;
    const S = this.S;
    const c01 = (v) => Math.max(0, Math.min(1, v));
    if (this.ex === 'squat') {
      const v = [[23, 25], [24, 26]].filter(([h, k]) => vis(pts, h) && vis(pts, k)).map(([h, k]) => (pts[k].y - pts[h].y) / S);
      if (!v.length) { this.depth = 0; this.tip = '무릎이 보이게 조금 뒤로 가요 🔙'; return null; }
      const t = this.smooth('thigh', v.reduce((a, b) => a + b, 0) / v.length);
      this.depth = c01((0.8 - t) / 0.38);
      this.tip = this.state === 'down' ? '⬆️ 일어나요!' : '⬇️ 깊이 앉아요!';
      if (this.state !== 'down') { if (this.depth >= 1) { this.state = 'down'; sfx.pop(); } }
      else if (this.depth < 0.3) { this.state = 'up'; return 'rep'; }
      return null;
    }
    if (![11, 12, 15, 16].every((i) => vis(pts, i))) { this.depth = 0; this.tip = '두 팔이 보이게 서요 🙆'; return null; }
    const shY = (pts[11].y + pts[12].y) / 2;
    const wristY = this.smooth('wrist', Math.max(pts[15].y, pts[16].y));
    const arms = c01((shY + 0.6 * S - wristY) / (1.1 * S));
    const legsSeen = vis(pts, 27) && vis(pts, 28);
    const spread = legsSeen ? this.smooth('spread', Math.abs(pts[27].x - pts[28].x) / S) : null;
    const legs = legsSeen ? c01((spread - 0.55) / 0.4) : 1;
    this.depth = Math.min(arms, legs);
    this.tip = this.state === 'open' ? '⬇️ 팔 내리고 다리 모아요!' : '🙆 팔은 위로, 다리는 옆으로!';
    if (this.state !== 'open') { if (arms >= 1 && legs >= 1) { this.state = 'open'; sfx.pop(); } }
    else if (arms < 0.2) { this.state = 'closed'; return 'rep'; }
    return null;
  }
}

// ------------------------------------------------------------
// 블록 코딩: 로봇을 열쇠까지
// ------------------------------------------------------------
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const ORDER = ['N', 'E', 'S', 'W'];
const ROT = { N: 0, E: 90, S: 180, W: 270 };
const BLOCKS = {
  abs: [['N', '⬆️', '위로'], ['S', '⬇️', '아래로'], ['W', '⬅️', '왼쪽으로'], ['E', '➡️', '오른쪽으로']],
  turn: [['F', '⬆️', '앞으로'], ['L', '↩️', '왼쪽 돌기'], ['R', '↪️', '오른쪽 돌기']],
};
BLOCKS.loop = BLOCKS.turn;
const ICON = { N: '⬆️', S: '⬇️', W: '⬅️', E: '➡️', F: '⬆️', L: '↩️', R: '↪️' };

export function countBlocks(prog) { return prog.reduce((n, b) => n + 1 + (b.op === 'loop' ? countBlocks(b.body) : 0), 0); }
export function runProgram(level, prog, maxSteps = 300) {
  // 로봇이 지나간 길을 돌려준다: [{x,y,d,crash?,win?}]
  const g = level.grid;
  let x = 0; let y = 0;
  g.forEach((row, yy) => { const xx = row.indexOf('S'); if (xx >= 0) { x = xx; y = yy; } });
  let d = level.dir || 'E';
  const path = [{ x, y, d }];
  let stop = false;
  const step = (op) => {
    if (stop || path.length > maxSteps) { stop = true; return; }
    let mv = null;
    if (op === 'L') d = ORDER[(ORDER.indexOf(d) + 3) % 4];
    else if (op === 'R') d = ORDER[(ORDER.indexOf(d) + 1) % 4];
    else if (op === 'F') mv = DIRS[d];
    else { d = op; mv = DIRS[op]; }
    if (mv) {
      const nx = x + mv[0]; const ny = y + mv[1];
      if (ny < 0 || ny >= g.length || nx < 0 || nx >= g[0].length || g[ny][nx] === '#') { path.push({ x, y, d, crash: true }); stop = true; return; }
      x = nx; y = ny;
    }
    const win = g[y][x] === 'K';
    path.push({ x, y, d, win });
    if (win) stop = true;
  };
  const exec = (list) => { for (const b of list) { if (stop) return; if (b.op === 'loop') { for (let i = 0; i < b.n && !stop; i++) exec(b.body); } else step(b.op); } };
  exec(prog);
  return path;
}

function codePuzzle(pz, api) {
  const level = pz;
  const mode = level.mode;
  const limit = level.limit || 30;
  const g = level.grid;
  const W = g[0].length; const H = g.length;
  let prog = [];
  let open = []; // 열린 반복 블록 (가장 안쪽이 끝)
  let running = false;

  const board = el('div', 'pz-board');
  board.style.setProperty('--cols', W);
  const cells = [];
  g.forEach((row, y) => row.split('').forEach((ch, x) => {
    const c = el('div', `cell${ch === '#' ? ' wall' : ''}`, ch === 'K' ? '🗝️' : '');
    board.append(c);
    cells.push(c);
    void x; void y;
  }));
  const robot = el('div', 'robot', '<span>🤖</span><i></i>');
  board.append(robot);
  const progEl = el('div', 'pz-prog');
  const info = el('div', 'pz-info');
  const palette = el('div', 'pz-palette');
  const actions = el('div', 'pz-actions');
  api.body.append(board, info, progEl, palette, actions);

  const start = runProgram(level, [])[0];
  function place(p, animate = true) {
    robot.style.transition = animate ? 'left .28s, top .28s, transform .28s' : 'none';
    robot.style.left = `calc(${p.x} * 100% / ${W})`;
    robot.style.top = `calc(${p.y} * 100% / ${H})`;
    robot.style.width = `calc(100% / ${W})`;
    robot.style.height = `calc(100% / ${H})`;
    robot.querySelector('i').style.transform = `rotate(${ROT[p.d]}deg)`;
    robot.querySelector('i').hidden = mode === 'abs';
  }
  place(start, false);

  const target = () => { let list = prog; for (const o of open) list = o.body; return list; };
  function draw() {
    const render = (list, depth) => list.map((b) => (b.op === 'loop'
      ? `<span class="loop${open.includes(b) ? ' open' : ''}">🔁${b.n} [ ${render(b.body, depth + 1)}${open.includes(b) ? '<b class="caret">▌</b>' : ''} ]</span>`
      : `<span class="blk">${ICON[b.op]}</span>`)).join(' ');
    progEl.innerHTML = prog.length ? render(prog, 0) + (open.length ? '' : ' <b class="caret">▌</b>') : '<em>아래 블록을 눌러 명령을 만들어요</em>';
    const n = countBlocks(prog);
    info.textContent = `블록 ${n}${level.limit ? ` / ${limit}개까지` : '개'}${open.length ? '  ·  반복 안에 넣는 중' : ''}`;
    info.classList.toggle('full', n >= limit);
  }
  function add(b) {
    if (running) return;
    if (countBlocks(prog) >= limit) { api.say(`블록은 ${limit}개까지만 쓸 수 있어요. ${mode === 'loop' ? '🔁 반복을 써 봐요!' : ''}`, 'bad'); return; }
    target().push(b);
    beep(600, 0.05, 'square', 0.05);
    draw();
  }
  for (const [op, icon, label] of BLOCKS[mode]) {
    const b = el('button', 'blockbtn', `${icon}<small>${label}</small>`); b.type = 'button';
    b.addEventListener('click', () => add({ op }));
    palette.append(b);
  }
  if (mode === 'loop') {
    const lp = el('div', 'loopbtns');
    lp.innerHTML = '<span>🔁 반복</span>';
    [2, 3, 4, 5, 6, 8].forEach((n) => {
      const b = el('button', 'blockbtn loopn', `${n}번`); b.type = 'button';
      b.addEventListener('click', () => { if (running) return; if (countBlocks(prog) >= limit) { add({ op: 'F' }); return; } const blk = { op: 'loop', n, body: [] }; add(blk); if (target().includes(blk)) open.push(blk); draw(); });
      lp.append(b);
    });
    const end = el('button', 'blockbtn end', '🔚<small>반복 끝</small>'); end.type = 'button';
    end.addEventListener('click', () => { if (open.length) { open.pop(); draw(); } });
    lp.append(end);
    palette.append(lp);
  }
  const back = el('button', 'ghost', '⌫ 하나 지우기'); back.type = 'button';
  back.addEventListener('click', () => {
    if (running) return;
    const list = target();
    if (list.length) { const last = list.pop(); if (last.op === 'loop') open = open.filter((o) => o !== last); }
    else if (open.length) { const lp = open.pop(); const parent = target(); parent.splice(parent.indexOf(lp), 1); }
    draw();
  });
  const reset = el('button', 'ghost', '🗑️ 모두 지우기'); reset.type = 'button';
  reset.addEventListener('click', () => { if (running) return; prog = []; open = []; place(start, false); draw(); });
  const run = el('button', 'ok', '▶ 실행!'); run.type = 'button';
  run.addEventListener('click', async () => {
    if (running || !prog.length) return;
    running = true; open = []; draw();
    cells.forEach((c) => c.classList.remove('trail'));
    const path = runProgram(level, prog);
    place(path[0], false);
    for (let i = 1; i < path.length; i++) {
      await new Promise((r) => setTimeout(r, 330));
      const p = path[i];
      place(p);
      if (!p.crash) cells[p.y * W + p.x].classList.add('trail');
      beep(p.crash ? 140 : 520, 0.07, p.crash ? 'sawtooth' : 'square', 0.06);
    }
    await new Promise((r) => setTimeout(r, 300));
    const last = path[path.length - 1];
    if (last.win) { robot.classList.add('happy'); api.win('로봇이 열쇠를 찾았어요! 🤖🗝️'); return; }
    running = false;
    robot.classList.add('bump'); setTimeout(() => robot.classList.remove('bump'), 500);
    api.wrong(last.crash ? '💥 벽에 부딪혔어요! 명령을 고쳐 봐요. (디버깅!)' : '열쇠까지 못 갔어요. 블록을 더 놓아 봐요!');
    setTimeout(() => { if (!running) place(start, false); }, 900);
  });
  actions.append(back, reset, run);
  draw();
  api.onHint2 = () => {
    const sol = solve(level);
    api.say(sol ? `💡 처음 몇 개: ${sol.slice(0, 3).map((o) => ICON[o]).join(' ')} …` : '💡 한 칸씩 손가락으로 따라가 봐요.', 'hint');
  };
}

// 가장 짧은 길(반복 없이) 찾기 — 힌트용
export function solve(level) {
  const g = level.grid;
  const start = runProgram(level, [])[0];
  const ops = level.mode === 'abs' ? ['N', 'E', 'S', 'W'] : ['F', 'L', 'R'];
  const key = (p) => `${p.x},${p.y},${level.mode === 'abs' ? '' : p.d}`;
  const seen = new Set([key(start)]);
  const q = [[start, []]];
  while (q.length) {
    const [p, path] = q.shift();
    for (const op of ops) {
      const r = runProgram({ ...level, grid: g.map((row) => row.replace('S', '.')).map((row, y) => (y === p.y ? row.slice(0, p.x) + 'S' + row.slice(p.x + 1) : row)), dir: p.d }, [{ op }]);
      const last = r[r.length - 1];
      if (last.crash) continue;
      const np = [...path, op];
      if (last.win) return np;
      const k = key(last);
      if (!seen.has(k)) { seen.add(k); q.push([last, np]); }
    }
  }
  return null;
}
