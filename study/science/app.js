// 과학 실험실: 화면과 한 판 흐름
// 데이터: data/<학기>/*.js (SCI.semesters)   실험 장치: lab.js (SCI.kits)
// 한 판 = 🤔 예상 → 🧪 해 보기 → 👀 관찰 → 💡 알게 된 것(용어 카드) → ⭐ 퀴즈 3개
(() => {
  'use strict';
  const KEY = 'science-v1';
  const $app = document.getElementById('app');

  // ---------------------------------------------------------------- 기록 (이 브라우저에만 저장)
  const blank = () => ({ stars: 0, done: {}, cards: {}, wrap: {}, auto: true, sem: SCI.order[0], last: '' });
  let S = blank();
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 새로 시작 */ }
  if (!SCI.semesters[S.sem]) S.sem = SCI.order[0];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 못 해도 할 수는 있어요 */ } };
  const addStars = (n) => { S.stars += n; save(); const el = document.querySelector('.bar .stars'); if (el) { el.textContent = `⭐ ${S.stars}`; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } };
  const SEM = () => SCI.semesters[S.sem];

  // ---------------------------------------------------------------- 도우미
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // [대괄호] 글은 굵은 버튼 이름처럼 보여 줘요
  const fmt = (s) => esc(s).replace(/\[(.+?)\]/g, '<b class="key">$1</b>');
  const plain = (s) => String(s).replace(/[[\]]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}️]/gu, '');
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const toast = (msg) => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1800); };

  // 소리 내어 읽기 (기기에 한국어 목소리가 있을 때)
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const speak = (text) => {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain(text));
    u.lang = 'ko-KR'; u.rate = 0.95;
    const ko = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('ko'));
    if (ko) u.voice = ko;
    speechSynthesis.speak(u);
  };
  const hush = () => { if (canSpeak) speechSynthesis.cancel(); };

  // 말풍선: 화면마다 하나. 글이 바뀌면 (자동 읽기가 켜져 있으면) 읽어 줘요
  const bubble = (text, who = '🧑‍🔬') => `<div class="talk"><span class="prof">${who}</span><div class="bubble"><span id="say">${fmt(text)}</span>${canSpeak ? '<button type="button" class="spk" id="spk" title="읽어 주기">🔊</button>' : ''}</div></div>`;
  let sayText = '';
  const say = (text, quiet) => {
    sayText = text;
    const el = document.getElementById('say');
    if (el) { el.innerHTML = fmt(text); el.parentNode.classList.remove('flash'); void el.offsetWidth; el.parentNode.classList.add('flash'); }
    if (S.auto && !quiet) speak(text);
  };
  document.addEventListener('click', (ev) => { if (ev.target.closest('#spk')) speak(sayText); });

  // 학습 앱 모음(전체 메뉴)으로 돌아가는 버튼: 이 앱만 따로 설치한 창에서는 감춰요
  const menuLink = (() => {
    let desk = false;
    try { desk = sessionStorage.getItem('kang-desktop-menu') === '1'; } catch (e) { /* 표시 없음 */ }
    const solo = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches || navigator.standalone;
    return solo && !desk ? '' : '<a class="pill" href="../../">← 🎒 학습 앱 모음</a>';
  })();
  const autoBtn = () => (canSpeak ? `<button type="button" class="pill auto" data-act="auto" title="말풍선을 자동으로 읽어 줘요">${S.auto ? '🔊 읽어 주기 켜짐' : '🔇 읽어 주기 꺼짐'}</button>` : '');
  const header = (title, back = '← 처음으로', backGo = 'home') => `<header class="bar"><button class="pill" data-go="${backGo}">${back}</button><b>${title}</b>${autoBtn()}<span class="stars">⭐ ${S.stars}</span></header>`;

  // ---------------------------------------------------------------- 학기 · 단원 · 판 찾기
  const units = () => SEM().units;
  const unitOf = (rid) => units().find((u) => u.plan.some((p) => p[0] === rid));
  const ready = (rid) => !!SEM().rounds[rid];
  const allPlan = () => units().flatMap((u) => u.plan.map((p) => p[0]));
  // 오늘의 실험: 마지막으로 한 단원에 남은 실험이 있으면 그 단원부터, 없으면 교과서 순서대로
  const nextRound = () => {
    const lu = S.last && unitOf(S.last);
    const inUnit = lu && lu.plan.map((p) => p[0]).find((rid) => ready(rid) && !S.done[rid]);
    return inUnit || allPlan().find((rid) => ready(rid) && !S.done[rid]);
  };
  const unitDone = (u) => u.plan.every((p) => ready(p[0]) && S.done[p[0]]);
  const cardsOf = (uid) => Object.entries(SEM().cards).filter(([, c]) => c.unit === uid);

  // ---------------------------------------------------------------- 화면 바꾸기
  const views = {};
  let alive = 0; // 화면이 바뀌면 숫자가 바뀌어, 돌던 실험 장치가 멈춰요
  const go = (name, arg) => { alive++; hush(); sayText = ''; document.getElementById('toast').classList.remove('on'); views[name](arg); window.scrollTo(0, 0); };
  $app.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-act]');
    if (a && a.dataset.act === 'auto') {
      S.auto = !S.auto; save(); hush();
      document.querySelectorAll('[data-act="auto"]').forEach((x) => { x.textContent = S.auto ? '🔊 읽어 주기 켜짐' : '🔇 읽어 주기 꺼짐'; });
      if (S.auto && sayText) speak(sayText);
      return;
    }
    const b = ev.target.closest('[data-go]');
    if (b) go(b.dataset.go, b.dataset.arg);
  });
  $app.addEventListener('change', (ev) => { if (ev.target.id === 'sem') { S.sem = ev.target.value; save(); go('home'); } });

  // ---------------------------------------------------------------- 처음 화면
  views.home = () => {
    const nid = nextRound();
    const u = nid && unitOf(nid);
    const r = nid && SEM().rounds[nid];
    const no = u ? u.plan.findIndex((p) => p[0] === nid) + 1 : 0;
    const allCards = Object.keys(SEM().cards).length;
    const got = Object.keys(SEM().cards).filter((id) => S.cards[id]).length;
    const wrapOpen = units().filter((x) => unitDone(x) && SEM().wrap[x.id]);
    $app.innerHTML = `<header class="bar">${menuLink}<b></b>${autoBtn()}
        <label class="pill semsel">📚 <select id="sem" aria-label="학기">${SCI.order.map((id) => `<option value="${id}"${id === S.sem ? ' selected' : ''}>${esc(SCI.semesters[id].name)}</option>`).join('')}</select></label>
        <span class="stars">⭐ ${S.stars}</span></header>
      <div class="hero"><h1>🔬 과학 실험실</h1><p>예상하고, 직접 해 보고, 알아내요!</p></div>
      ${r ? `<button class="today" data-go="round" data-arg="${nid}" style="--c:${u.color}"><span class="em">🧪</span><span class="tx"><small>오늘의 실험 · ${u.no}단원 ${esc(u.name)} · ${no}번째</small><b>${esc(r.q)}</b><i>10분쯤 · 🃏 용어 카드 ${r.learn.cards.length}장을 얻을 수 있어요</i></span><span class="main">시작 ▶</span></button>`
        : `<div class="today done"><span class="em">🎉</span><span class="tx"><b>준비된 실험을 모두 했어요!</b><i>다음 실험은 곧 생겨요. 단원 지도에서 좋아하는 실험을 다시 해 봐요.</i></span></div>`}
      <div class="grid3">
        <button class="tile" data-go="map"><span class="em">🗺️</span><b>단원 지도</b><span>${units().length}개 단원 · ${allPlan().length}개 실험<br>골라서 다시 해 볼 수도 있어요</span></button>
        <button class="tile" data-go="dex"><span class="em">🗂️</span><b>용어 도감</b><span>모은 카드 ${got} / ${allCards}장<br>카드를 누르면 다시 볼 수 있어요</span></button>
        <button class="tile" data-go="wrapList"><span class="em">🏅</span><b>단원 마무리</b><span>${wrapOpen.length ? `${wrapOpen.map((x) => `${x.no}단원`).join(', ')} 열렸어요!` : '단원을 다 하면 열려요'}<br>한눈에 정리 + 확인 문제</span></button>
      </div>
      <div class="ubars">${units().map((x) => { const d = x.plan.filter((p) => S.done[p[0]]).length; return `<div class="ub" style="--c:${x.color}"><span><b>${x.no} ${esc(x.name)}</b> ${d}/${x.plan.length}</span><div class="track"><i style="width:${(d / x.plan.length) * 100}%"></i></div></div>`; }).join('')}</div>
      <p class="note">기록은 이 기기에만 저장돼요. 🔊 읽어 주기는 기기에 한국어 목소리가 있어야 소리가 나요.</p>`;
  };

  // ---------------------------------------------------------------- 단원 지도
  views.map = () => {
    const nid = nextRound();
    $app.innerHTML = `${header('🗺️ 단원 지도')}
      <div class="map">${units().map((u) => `<section class="unit" style="--c:${u.color}">
        <small>${u.no}단원${u.plan.some((p) => ready(p[0])) ? '' : ' · <em class="soontag">🔒 준비 중</em>'}</small><h3>${esc(u.name)}</h3><div class="big">${u.em}</div>
        ${u.plan.map(([rid, title], i) => {
          const st = S.done[rid] ? 'done' : rid === nid ? 'now' : ready(rid) ? 'open' : 'soon';
          return st === 'soon'
            ? `<div class="step soon"><span class="d">${i + 1}</span>${esc(title)}</div>`
            : `<button class="step ${st}" data-go="round" data-arg="${rid}"><span class="d">${st === 'done' ? '✓' : i + 1}</span>${esc(title)}</button>`;
        }).join('')}
        ${SEM().wrap[u.id] ? (unitDone(u) ? `<button class="fin open" data-go="wrap" data-arg="${u.id}">🏅 단원 마무리${S.wrap[u.id] ? ' ✓' : ''}</button>` : `<div class="fin">🏅 단원 마무리 (${u.plan.filter((p) => !S.done[p[0]]).length}개 더!)</div>`) : ''}
      </section>`).join('')}</div>
      <p class="note">반짝이는 칸이 다음 차례예요. 끝낸 실험(✓)도 눌러서 다시 해 볼 수 있어요.</p>`;
  };

  // ---------------------------------------------------------------- 문제 하나 묻기 (틀리면: 힌트 → 보기 줄이기 → 정답 보여 주고 넘어가기)
  // 별: 한 번에 맞히면 2개, 아니면 1개 (0개는 없어요)
  const ask = (host, item, onDone, opts = {}) => {
    const right = item.choices[0];
    const order = shuffle(item.choices);
    let tries = 0; let over = false;
    say(item.q);
    host.innerHTML = `<div class="choices ${order.length > 3 ? 'four' : ''}">${order.map((c) => `<button type="button" class="ch" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="after"></div>`;
    const finish = (gain) => {
      over = true;
      host.querySelectorAll('.ch').forEach((b) => { b.disabled = true; if (b.dataset.c === right) b.classList.add('right'); });
      say(`${tries === 0 ? '딩동댕! ' : ''}${item.why}`);
      addStars(gain);
      host.querySelector('.after').innerHTML = `<button type="button" class="main">${opts.last || '다음 ▶'}</button>`;
      host.querySelector('.after .main').onclick = () => onDone(gain);
    };
    host.querySelector('.choices').addEventListener('click', (ev) => {
      const b = ev.target.closest('.ch');
      if (!b || over || b.disabled) return;
      if (b.dataset.c === right) { finish(tries === 0 ? 2 : 1); return; }
      tries++;
      b.disabled = true; b.classList.add('no');
      if (tries === 1) { say(`앗, 아니야. 힌트! ${item.hint}`); return; }
      const wrongs = [...host.querySelectorAll('.ch:not(:disabled)')].filter((x) => x.dataset.c !== right);
      if (wrongs.length) { wrongs[0].disabled = true; wrongs[0].classList.add('gone'); say('보기를 하나 줄여 줄게. 다시 골라 봐!'); return; }
      finish(1);
    });
  };

  // ---------------------------------------------------------------- 한 판
  const STEPS = ['🤔 예상', '🧪 해 보기', '👀 관찰', '💡 알게 된 것', '⭐ 퀴즈'];
  const prog = (k) => `<div class="prog">${STEPS.map((n, i) => `<span class="${i < k ? 'ok' : i === k ? 'on' : ''}">${n}${i < k ? ' ✓' : ''}</span>`).join('')}</div>`;
  let R = null; // 지금 하는 판 { id, r, u, guess, gain, newCards }
  const roundTop = (k) => `${header(`${R.u.no}단원 · ${esc(R.r.title)}`, '✕ 그만하기')}${prog(k)}`;

  views.round = (rid) => {
    const r = SEM().rounds[rid];
    if (!r) { go('map'); return; }
    R = { id: rid, r, u: unitOf(rid), guess: -1, gain: 0, newCards: [] };
    stagePredict();
  };

  function stagePredict() {
    const P = R.r.predict;
    $app.innerHTML = `${roundTop(0)}${bubble(P.say)}
      <div class="choices big">${P.choices.map((c, i) => `<button type="button" class="ch pch" data-i="${i}"><span class="em">${c[0]}</span>${esc(c[1])}</button>`).join('')}</div>
      <p class="hint">틀려도 괜찮아요! 직접 해 보면서 확인할 거예요.</p>`;
    say(P.say);
    $app.querySelector('.choices').addEventListener('click', (ev) => {
      const b = ev.target.closest('.ch');
      if (!b) return;
      R.guess = +b.dataset.i;
      addStars(1); R.gain += 1;
      stageLab();
    });
  }

  function stageLab() {
    const my = alive;
    $app.innerHTML = `${roundTop(1)}${bubble('')}
      <div class="lab"><div class="benchcol"><div class="bench"></div><div class="ctrls"></div></div><div class="side"></div></div>`;
    const ctrls = $app.querySelector('.ctrls');
    const api = {
      bench: $app.querySelector('.bench'),
      side: $app.querySelector('.side'),
      ctrls,
      say: (t) => { if (alive === my) say(t); },
      btn: (text, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'main'; b.textContent = text; b.onclick = fn; ctrls.appendChild(b); return b; },
      clearBtns: () => { ctrls.innerHTML = ''; },
      noSide: () => { const s = $app.querySelector('.side'); if (s) s.remove(); $app.querySelector('.lab').classList.add('wide'); },
      alive: () => alive === my,
      done: () => {
        if (alive !== my) return;
        addStars(2); R.gain += 2;
        ctrls.innerHTML = '';
        const b = api.btn('관찰한 것 정리하기 ▶', stageObserve);
        b.classList.add('glow');
      },
    };
    SCI.kits[R.r.lab.kit](R.r.lab, api);
  }

  function stageObserve() {
    const list = R.r.observe;
    let k = 0;
    $app.innerHTML = `${roundTop(2)}${bubble('')}<div class="qhost"></div>`;
    const host = $app.querySelector('.qhost');
    const next = () => {
      if (k >= list.length) { stageLearn(); return; }
      const item = list[k++];
      ask(host, item, (g) => { R.gain += g; next(); }, { last: k === list.length ? '알게 된 것 보기 ▶' : '다음 ▶' });
    };
    next();
  }

  const cardHtml = (id, c, extra = '') => `<div class="term ${extra}"><div class="pic">${c.em}</div><h2>${esc(c.name)}</h2><p>${esc(c.say)}</p></div>`;

  function stageLearn() {
    const L = R.r.learn;
    const ok = R.guess === R.r.predict.a;
    R.newCards = L.cards.filter((id) => !S.cards[id]);
    L.cards.forEach((id) => { S.cards[id] = true; });
    save();
    const C = SEM().cards;
    $app.innerHTML = `${roundTop(3)}
      <div class="learn">
        <div>
          ${bubble(ok ? L.right : L.wrong)}
          <div class="flow">${L.flow.map((f, i) => `${i ? '<span class="ar">→</span>' : ''}<div><span class="em">${f[0]}</span><b>${esc(f[1])}</b><small>${esc(f[2])}</small></div>`).join('')}</div>
          <div class="home">🏠 <b>집에서 진짜로 해 보기</b> · ${esc(L.home)}</div>
          <div class="row"><button type="button" class="main" id="toQuiz">퀴즈 3개 풀기 ▶</button><button type="button" class="pill" id="moreBtn">📖 더 알아보기</button></div>
          <div class="more" hidden><b>📖 더 알아보기</b><ul>${L.more.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>${canSpeak ? '<button type="button" class="pill" id="readMore">🔊 읽어 주기</button>' : ''}</div>
        </div>
        <div class="cardcol">${L.cards.map((id, i) => `<div class="cardwrap" style="--d:${i * 0.25}s"><span class="new ${R.newCards.includes(id) ? '' : 'again'}">${R.newCards.includes(id) ? '✨ 새 용어 카드!' : '다시 만난 카드'}</span>${cardHtml(id, C[id])}</div>`).join('')}</div>
      </div>`;
    say(ok ? L.right : L.wrong);
    if (!ok) toast('예상이 틀려도 괜찮아요. 확인하는 게 과학이에요!');
    document.getElementById('moreBtn').onclick = () => { const m = $app.querySelector('.more'); m.hidden = !m.hidden; };
    const rm = document.getElementById('readMore');
    if (rm) rm.onclick = () => speak(L.more.join(' '));
    document.getElementById('toQuiz').onclick = stageQuiz;
  }

  function stageQuiz() {
    const list = R.r.quiz;
    let k = 0;
    $app.innerHTML = `${roundTop(4)}<div class="qnum"></div>${bubble('')}<div class="qhost"></div>`;
    const host = $app.querySelector('.qhost');
    const next = () => {
      if (k >= list.length) { finishRound(); return; }
      $app.querySelector('.qnum').textContent = `퀴즈 ${k + 1} / ${list.length}`;
      const item = list[k++];
      ask(host, item, (g) => { R.gain += g; next(); }, { last: k === list.length ? '끝! 결과 보기 ▶' : '다음 퀴즈 ▶' });
    };
    next();
  }

  function finishRound() {
    const first = !S.done[R.id];
    S.done[R.id] = true;
    S.last = R.id;
    addStars(2); R.gain += 2;
    save();
    const nid = nextRound();
    const u = R.u;
    const openWrap = first && unitDone(u) && SEM().wrap[u.id];
    $app.innerHTML = `${header('🎉 실험 완료!')}
      <section class="finish">
        <div class="big">🏆</div>
        <h2>${esc(R.r.title)} 실험을 마쳤어요!</h2>
        <p class="gain">이번 판에서 ⭐ ${R.gain}개를 모았어요</p>
        ${R.newCards.length ? `<p>새 용어 카드: ${R.newCards.map((id) => `<b>${SEM().cards[id].em} ${esc(SEM().cards[id].name)}</b>`).join(', ')}</p>` : ''}
        ${openWrap ? `<p class="unlock">🏅 ${u.no}단원 마무리가 열렸어요! 한눈에 정리하고 확인 문제를 풀어 봐요.</p>` : ''}
        <div class="row center">
          ${openWrap ? `<button class="main" data-go="wrap" data-arg="${u.id}">🏅 단원 마무리 ▶</button>` : ''}
          ${!openWrap && nid ? `<button class="main" data-go="round" data-arg="${nid}">다음 실험 ▶</button>` : ''}
          <button class="pill" data-go="home">처음으로</button>
        </div>
        <p class="note">하루에 한 판이면 충분해요. 내일 또 만나요! 👋</p>
      </section>`;
    say(`${R.r.title} 실험 끝! 정말 잘했어.`, false);
  }

  // ---------------------------------------------------------------- 단원 마무리
  views.wrapList = () => {
    $app.innerHTML = `${header('🏅 단원 마무리')}
      <div class="wraplist">${units().map((u) => {
        const has = SEM().wrap[u.id];
        const open = has && unitDone(u);
        const left = u.plan.filter((p) => !S.done[p[0]]).length;
        return open ? `<button class="tile" data-go="wrap" data-arg="${u.id}" style="--c:${u.color}"><span class="em">${u.em}</span><b>${u.no}단원 ${esc(u.name)}${S.wrap[u.id] ? ' ✓' : ''}</b><span>한눈에 정리 + 확인 문제 ${has.quiz.length}개</span></button>`
          : `<div class="tile locked"><span class="em">🔒</span><b>${u.no}단원 ${esc(u.name)}</b><span>${has ? `실험 ${left}개를 더 하면 열려요` : '실험을 준비 중이에요'}</span></div>`;
      }).join('')}</div>`;
  };

  views.wrap = (uid) => {
    const u = units().find((x) => x.id === uid);
    const Wd = SEM().wrap[uid];
    if (!u || !Wd || !unitDone(u)) { go('wrapList'); return; }
    $app.innerHTML = `${header(`🏅 ${u.no}단원 마무리`, '← 처음으로')}
      ${bubble(`${u.name} 단원을 한눈에 정리해 볼까? 카드를 눌러 읽어 봐.`)}
      <div class="sum">${Wd.summary.map((s) => `<button type="button" class="sumcard" style="--c:${u.color}" data-say="${esc(`${s[1]}. ${s[2]}`)}"><span class="em">${s[0]}</span><b>${esc(s[1])}</b><span>${esc(s[2])}</span></button>`).join('')}</div>
      <div class="row center"><button class="main" id="wq">확인 문제 ${Wd.quiz.length}개 풀기 ▶</button></div>`;
    say(`${u.name} 단원을 한눈에 정리해 볼까? 카드를 눌러 읽어 봐.`);
    $app.querySelector('.sum').addEventListener('click', (ev) => { const c = ev.target.closest('.sumcard'); if (c) say(c.dataset.say); });
    document.getElementById('wq').onclick = () => {
      let k = 0; let gain = 0; let first = 0;
      $app.innerHTML = `${header(`🏅 ${u.no}단원 확인 문제`, '✕ 그만하기')}<div class="qnum"></div>${bubble('')}<div class="qhost"></div>`;
      const host = $app.querySelector('.qhost');
      const next = () => {
        if (k >= Wd.quiz.length) {
          S.wrap[uid] = true; save();
          $app.innerHTML = `${header('🏅 단원 마무리 완료!')}
            <section class="finish"><div class="big">🎖️</div><h2>${u.no}단원 ${esc(u.name)} 마무리!</h2>
            <p class="gain">${Wd.quiz.length}문제 중 ${first}문제를 한 번에 맞혔어요 · ⭐ ${gain}개</p>
            <p>${first >= Wd.quiz.length - 1 ? '이 단원은 이제 과학 박사네요! 🎉' : '틀린 문제는 실험을 다시 해 보면 금방 알게 돼요.'}</p>
            <div class="row center"><button class="main" data-go="home">처음으로</button><button class="pill" data-go="map">단원 지도</button></div></section>`;
          say(`${u.name} 단원 마무리 끝! 정말 멋져.`);
          return;
        }
        $app.querySelector('.qnum').textContent = `문제 ${k + 1} / ${Wd.quiz.length}`;
        const item = Wd.quiz[k++];
        ask(host, item, (g) => { gain += g; if (g === 2) first++; next(); }, { last: k === Wd.quiz.length ? '결과 보기 ▶' : '다음 문제 ▶' });
      };
      next();
    };
  };

  // ---------------------------------------------------------------- 용어 도감
  let dexTab = null;
  views.dex = (tab) => {
    if (tab) dexTab = tab;
    if (!dexTab || !units().some((u) => u.id === dexTab)) dexTab = units()[0].id;
    const all = Object.keys(SEM().cards);
    const got = all.filter((id) => S.cards[id]).length;
    const u = units().find((x) => x.id === dexTab);
    const list = cardsOf(u.id);
    const mine = all.filter((id) => S.cards[id]);
    $app.innerHTML = `${header(`🗂️ 용어 도감 · ${got} / ${all.length}장`)}
      <div class="tabs">${units().map((x) => { const cs = cardsOf(x.id); return `<button class="tab${x.id === dexTab ? ' on' : ''}" style="--c:${x.color}" data-go="dex" data-arg="${x.id}">${x.no} ${esc(x.name)} (${cs.filter(([id]) => S.cards[id]).length}/${cs.length})</button>`; }).join('')}</div>
      ${list.length ? `<div class="dex">${list.map(([id, c]) => {
        const no = u.plan.findIndex((p) => p[0] === c.round) + 1;
        return S.cards[id] ? `<button class="tc" style="--c:${u.color}" data-card="${id}"><div class="pic">${c.em}</div><b>${esc(c.name)}</b><span>${esc(c.say)}</span></button>`
          : `<div class="tc lock"><div class="pic">${c.em}</div><b>? ? ?</b><span>${no}번째 실험에서 만나요</span></div>`;
      }).join('')}</div>` : '<p class="empty">이 단원의 실험은 준비 중이에요. 곧 카드가 생겨요!</p>'}
      <div class="game"><div><b>🃏 카드 짝 맞추기</b><span>${mine.length >= 4 ? '뜻과 용어를 짝지어요 · 모은 카드로만 나와요' : `카드를 4장 모으면 열려요 (지금 ${mine.length}장)`}</span></div>${mine.length >= 4 ? '<button class="main" data-go="match">놀이 시작 ▶</button>' : ''}</div>
      <div id="cardpop" hidden></div>`;
    const pop = document.getElementById('cardpop');
    $app.querySelector('.dex') && $app.querySelector('.dex').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-card]');
      if (!b) return;
      const c = SEM().cards[b.dataset.card];
      pop.innerHTML = `<div class="popin">${cardHtml(b.dataset.card, c)}<div class="row center">${canSpeak ? '<button type="button" class="pill" id="cs">🔊 읽어 주기</button>' : ''}<button type="button" class="pill" data-go="round" data-arg="${c.round}">🧪 이 실험 다시 하기</button><button type="button" class="main" id="cx">닫기</button></div></div>`;
      pop.hidden = false;
      const cs = document.getElementById('cs'); if (cs) cs.onclick = () => speak(`${c.name}. ${c.say}`);
      if (S.auto) speak(`${c.name}. ${c.say}`);
      document.getElementById('cx').onclick = () => { pop.hidden = true; hush(); };
    });
    pop.addEventListener('click', (ev) => { if (ev.target === pop) { pop.hidden = true; hush(); } });
  };

  // 카드 짝 맞추기: 왼쪽 뜻, 오른쪽 용어
  views.match = () => {
    const mine = shuffle(Object.keys(SEM().cards).filter((id) => S.cards[id])).slice(0, 4);
    if (mine.length < 4) { go('dex'); return; }
    const C = SEM().cards;
    let selL = null; let left = 4; let miss = 0;
    $app.innerHTML = `${header('🃏 카드 짝 맞추기', '← 도감으로', 'dex')}${bubble('왼쪽 뜻을 하나 누르고, 알맞은 용어를 오른쪽에서 골라 봐.')}
      <div class="match"><div class="col">${shuffle(mine).map((id) => `<button type="button" class="mm l" data-id="${id}"><span class="em">${C[id].em}</span>${esc(C[id].say)}</button>`).join('')}</div>
      <div class="col">${shuffle(mine).map((id) => `<button type="button" class="mm r" data-id="${id}">${esc(C[id].name)}</button>`).join('')}</div></div>`;
    say('왼쪽 뜻을 하나 누르고, 알맞은 용어를 오른쪽에서 골라 봐.');
    $app.querySelector('.match').addEventListener('click', (ev) => {
      const b = ev.target.closest('.mm');
      if (!b || b.disabled) return;
      if (b.classList.contains('l')) { $app.querySelectorAll('.mm.l').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); selL = b; return; }
      if (!selL) { say('먼저 왼쪽 뜻을 하나 골라 줘.'); return; }
      if (b.dataset.id === selL.dataset.id) {
        b.disabled = true; selL.disabled = true; b.classList.add('right'); selL.classList.add('right'); selL.classList.remove('sel'); selL = null; left--;
        if (left) say(`딩동댕! ${C[b.dataset.id].name}!`);
        else {
          const g = miss === 0 ? 3 : 2; addStars(g);
          say(`4쌍 모두 찾았어! 별 ${g}개!`);
          $app.insertAdjacentHTML('beforeend', '<div class="row center"><button class="main" data-go="match">한 번 더 ▶</button><button class="pill" data-go="dex">도감으로</button></div>');
        }
      } else { miss++; b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); say('음, 다른 용어일 거야. 다시 골라 봐!'); }
    });
  };

  go('home');
  if (canSpeak) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); }
})();
