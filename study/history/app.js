// 역사 탐험대: 화면과 놀이
// 데이터는 data/*.js (H.eras, H.people, H.facts, H.events, H.stories, H.words, H.adventures, H.rulers)
(() => {
  'use strict';
  const KEY = 'history5-v1';
  const $app = document.getElementById('app');
  const eraById = Object.fromEntries(H.eras.map((e) => [e.id, e]));
  const eraIndex = Object.fromEntries(H.eras.map((e, i) => [e.id, i]));
  const personById = Object.fromEntries(H.people.map((p) => [p.id, p]));

  // ---------------------------------------------------------------- 기록 (이 브라우저에만 저장)
  const blank = () => ({ stars: 0, people: {}, stories: {}, trains: 0, best: {}, last: '', adv: {}, explorer: null, line: [], kings: {} });
  let S = blank();
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 새로 시작 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 못 해도 놀 수는 있어요 */ } };
  const addStars = (n) => { S.stars += n; save(); };

  // ---------------------------------------------------------------- 도우미
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 낱말 사전 (data/words.js): 글 속의 어려운 낱말을 누르면 뜻이 나와요. 긴 낱말부터 찾아요.
  const WORDS = H.words || {};
  const wordRe = Object.keys(WORDS).length
    ? new RegExp(Object.keys(WORDS).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
    : null;
  const gloss = (text) => {
    text = String(text);
    if (!wordRe) return esc(text);
    let out = ''; let last = 0;
    text.replace(wordRe, (m, off) => { out += `${esc(text.slice(last, off))}<button type="button" class="w" data-w="${esc(m)}">${esc(m)}</button>`; last = off + m.length; return m; });
    return out + esc(text.slice(last));
  };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const eraTag = (id) => { const e = eraById[id]; return `<span class="tag" style="--c:${e.color}">${e.emoji} ${esc(e.name)}</span>`; };
  const toast = (msg) => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1800); };
  const header = (title) => `<header class="bar"><button class="back" data-go="home">← 처음으로</button><b>${title}</b><span class="stars">⭐ ${S.stars}</span></header>`;

  // 소리 내어 읽기 (브라우저에 한국어 목소리가 있을 때만)
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speakId = 0;
  const speak = (text, onEnd) => {
    if (!canSpeak) return;
    const my = ++speakId;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 0.95;
    const ko = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('ko'));
    if (ko) u.voice = ko;
    if (onEnd) u.onend = () => { if (my === speakId) onEnd(); };
    speechSynthesis.speak(u);
  };
  const hush = () => { speakId++; if (canSpeak) speechSynthesis.cancel(); };

  // 낱말 뜻 카드 (아래에서 올라와요. 바깥을 누르거나 '알았어요'를 누르면 닫혀요)
  const pop = document.createElement('div');
  pop.id = 'wordpop'; pop.hidden = true;
  pop.innerHTML = '<div class="wp-card" role="dialog" aria-labelledby="wp-t"><div class="wp-top">📖 낱말 뜻</div><b id="wp-t"></b><p id="wp-m"></p><div class="wp-btns"><button type="button" class="ghost" id="wp-say">🔊 읽어 줘</button><button type="button" class="main" id="wp-x">알았어요 👍</button></div></div>';
  document.body.appendChild(pop);
  const closeWord = () => { pop.hidden = true; hush(); };
  const showWord = (w) => {
    document.getElementById('wp-t').textContent = w;
    document.getElementById('wp-m').textContent = WORDS[w] || '';
    document.getElementById('wp-say').hidden = !canSpeak;
    pop.hidden = false;
    document.getElementById('wp-x').focus();
  };
  pop.addEventListener('click', (ev) => { if (ev.target === pop || ev.target.id === 'wp-x') closeWord(); });
  document.getElementById('wp-say').onclick = () => speak(`${document.getElementById('wp-t').textContent}. ${document.getElementById('wp-m').textContent}`);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !pop.hidden) closeWord(); });
  document.addEventListener('click', (ev) => {
    const w = ev.target.closest && ev.target.closest('button.w');
    if (w) { ev.preventDefault(); ev.stopPropagation(); showWord(w.dataset.w); }
  }, true);

  // ---------------------------------------------------------------- 화면 바꾸기
  const views = {};
  let current = 'home';
  const go = (name, arg) => { hush(); document.getElementById('toast').classList.remove('on'); current = name; views[name](arg); window.scrollTo(0, 0); };
  $app.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-go]');
    if (b) go(b.dataset.go, b.dataset.arg);
  });

  // 학습 앱 모음(전체 메뉴)으로 돌아가는 버튼: 보통 브라우저나 "학습 앱 모음" 아이콘 창에서만 (이 앱만 따로 설치한 창에서는 감춤)
  const menuLink = (() => {
    let desk = false;
    try { desk = sessionStorage.getItem('kang-desktop-menu') === '1'; } catch (e) { /* 표시 없음 */ }
    const solo = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches || navigator.standalone;
    return solo && !desk ? '' : '<a class="menu-link" href="../../">← 🎒 학습 앱 모음</a>';
  })();

  // ---------------------------------------------------------------- 처음 화면 (오늘 할 탐험 하나 + 문 두 개)
  const LEVELS = [[0, '새내기 탐험가'], [20, '꼬마 탐험가'], [50, '씩씩한 탐험가'], [100, '노련한 탐험가'], [180, '역사 박사'], [300, '시간 여행 대장']];
  const level = () => {
    let i = 0;
    LEVELS.forEach((l, k) => { if (S.stars >= l[0]) i = k; });
    const next = LEVELS[i + 1];
    const pct = next ? Math.round(((S.stars - LEVELS[i][0]) / (next[0] - LEVELS[i][0])) * 100) : 100;
    return { n: i + 1, name: LEVELS[i][1], next, pct };
  };
  const metCount = () => H.people.filter((p) => S.people[p.id]).length;
  const advDone = () => H.adventures.filter((a) => S.adv && S.adv[a.id]).length;

  views.home = () => {
    const lv = level();
    const m = S.explorer;
    const met = metCount();
    $app.innerHTML = `${menuLink}
      <div class="home-top"><h1>🧭 역사 탐험대</h1><span class="stars big">⭐ ${S.stars}</span></div>
      ${m ? `<div class="badge-card"><span class="av">${esc(m.av)}</span><div><small>시간 여행 탐험대 · ${lv.n}단계 ${esc(lv.name)}</small><b>${esc(m.name)} 대원</b>
        <div class="lvl"><i style="width:${lv.pct}%"></i></div><small class="lvl-next">${lv.next ? `다음 단계까지 ⭐ ${lv.next[0] - S.stars}개` : '최고 단계예요!'}</small></div></div>` : ''}
      ${ADV.homeCard()}
      <div class="doors">
        <button class="door" data-go="eraMap"><span class="em">🗺️</span><b>시대 지도</b><i>고조선부터 지금까지, 시대마다 왕과 사건을 살펴봐요</i></button>
        <button class="door" data-go="book"><span class="em">🗂️</span><b>인물 도감</b><i>내가 만난 인물 ${met} / ${H.people.length}</i><span class="mini-bar"><i style="width:${Math.round((met / H.people.length) * 100)}%"></i></span></button>
      </div>
      <button class="ghost wide" data-go="advList">🎮 다른 모험 고르기 (${advDone()} / ${H.adventures.length} 완료)</button>
      <p class="note">기록은 이 기기에만 저장돼요. 🔊 버튼은 기기에 한국어 목소리가 있어야 소리가 나요.</p>`;
  };

  // ---------------------------------------------------------------- 한 판 흐름: 🎮 모험 → 🧑 인물 카드 → 📅 연표에 놓기
  let flow = null; // { A, stars, gain, wrongs, newPerson, placed }
  const afterAdventure = (A, info) => { flow = Object.assign({ A }, info); go('flowPerson'); };
  const progress = (step) => {
    const names = ['① 모험', '② 인물 카드', '③ 연표'];
    return `<div class="prog">${names.map((n, i) => `<span class="${i < step ? 'done' : i === step ? 'now' : ''}">${n}${i < step ? ' ✔' : ''}</span>`).join('')}</div>`;
  };
  const storyOf = (A) => H.stories.find((s) => s.id === (A.story || A.id)) || H.stories.find((s) => s.person === A.person);

  // 인물 카드: 업적 4줄, 같은 시대 사람들, 이야기 더 듣기
  function personPage(p, inFlow) {
    const f = (H.facts || {})[p.id] || { when: '', items: [] };
    const e = eraById[p.era];
    const friends = H.people.filter((q) => q.era === p.era && q.id !== p.id);
    const story = inFlow ? storyOf(flow.A) : H.stories.find((s) => s.person === p.id);
    const isNew = inFlow && flow.newPerson;
    $app.innerHTML = `${header(inFlow ? '🧑 인물 카드' : `🗂️ ${esc(p.name)}`)}
      ${inFlow ? progress(1) : ''}
      <section class="pcard-big" style="--c:${e.color}">
        ${isNew ? '<span class="new">NEW 인물 카드!</span>' : ''}
        <div class="em">${p.emoji}</div><b>${esc(p.name)}</b>
        <span class="ptag">${e.emoji} ${esc(e.name)}${f.when ? ` · ${esc(f.when)}` : ''}</span>
        <ul class="facts">${f.items.map((t) => `<li>${gloss(t)}</li>`).join('')}</ul>
        ${canSpeak ? `<button class="ghost" data-say="${esc(`${p.name}. ${f.items.map((t) => t.replace(/^\S+\s/, '')).join('. ')}`)}">🔊 읽어 줘</button>` : ''}
      </section>
      ${friends.length ? `<section class="card friends-box"><b>👥 같은 시대 사람들</b>
        <div class="friends">${friends.slice(0, 6).map((q) => (S.people[q.id]
          ? `<button data-go="person" data-arg="${q.id}"><span class="em">${q.emoji}</span>${esc(q.name)}</button>`
          : `<button class="lock" data-go="whoOne" data-arg="${q.id}"><span class="em">❓</span>잠김</button>`)).join('')}</div>
        <p class="muted small">❓를 누르면 "나는 누구일까요?"로 카드를 열 수 있어요</p></section>` : ''}
      ${story ? `<button class="ghost wide" data-go="storyFrom" data-arg="${story.id}|${inFlow ? 'flowPerson' : 'person'}|${inFlow ? '' : p.id}">📖 이야기 더 듣기 · 읽기 — ${esc(story.title)}</button>` : ''}
      ${inFlow ? '<button class="main wide" data-go="flowPlace">다음: 📅 연표에 놓기 ▶</button>'
        : `<div class="nav2"><button class="ghost" data-go="book">🗂️ 인물 도감</button><button class="ghost" data-go="era" data-arg="${p.era}:people">${e.emoji} ${esc(e.name)} 보기</button></div>`}`;
    bindSay();
  }
  views.flowPerson = () => { if (!flow) { go('home'); return; } personPage(personById[flow.A.person], true); };
  views.person = (id) => {
    const p = personById[id];
    if (!S.people[id]) { go('whoOne', id); return; }
    personPage(p, false);
  };

  // 나만의 연표: 배운 사건만 쌓여요. 처음엔 길잡이 사건 3개(고려·조선 건국, 광복)가 함께 있어요
  const ANCHORS = ['goryeo', 'joseon', 'liberation'];
  views.flowPlace = () => {
    if (!flow) { go('home'); return; }
    const ev = H.events.find((v) => v.id === flow.A.event);
    if (!ev) { go('flowDone'); return; }
    S.line = S.line || [];
    const items = H.events.filter((v) => v.id !== ev.id && (S.line.includes(v.id) || ANCHORS.includes(v.id))).sort((a, b) => a.year - b.year);
    const correct = items.filter((v) => v.year < ev.year).length;
    let tries = 0; let done = false; let near = false;
    const draw = (msg) => {
      const slot = (i) => {
        if (done) return i === correct ? `<div class="slot placed"><small>${esc(ev.when)}</small>${ev.emoji} ${gloss(ev.title)}</div>` : '';
        const dim = near && Math.abs(i - correct) > 1;
        return `<button class="slot ${dim ? 'dim' : ''}" data-i="${i}" ${dim ? 'disabled' : ''}>여기? 👆</button>`;
      };
      $app.innerHTML = `${header('📅 연표에 놓기')}
        ${progress(2)}
        <section class="card center">
          <b class="q">📅 오늘 사건을 내 연표 어디에 놓을까?</b>
          <div class="drag ${done ? 'ok' : ''}">${ev.emoji} ${esc(ev.title)} <small>(${esc(ev.when)})</small></div>
          ${msg ? `<div class="hintbox">${msg}</div>` : ''}
        </section>
        <div class="tl">
          ${items.map((v, i) => `${slot(i)}<div class="ev ${S.line.includes(v.id) ? '' : 'anchor'}"><small>${esc(v.when)}</small>${v.emoji} ${esc(v.title)}${S.line.includes(v.id) ? '' : ' <i>길잡이</i>'}</div>`).join('')}
          ${slot(items.length)}
        </div>
        <p class="muted small center">내가 배운 사건이 하나씩 쌓여서 "나만의 연표"가 길어져요</p>
        ${done ? '<button class="main wide" data-go="flowDone">🎉 오늘 탐험 끝!</button>' : ''}`;
      $app.querySelectorAll('button.slot').forEach((b) => {
        b.onclick = () => {
          const i = Number(b.dataset.i);
          if (i === correct || tries >= 2) {
            const got = tries === 0 ? 2 : 1;
            done = true;
            if (!S.line.includes(ev.id)) S.line.push(ev.id);
            addStars(got); flow.placed = got; save();
            draw(`${i === correct ? (tries === 0 ? '🎉 딱 맞았어요! ⭐ 2개' : '👍 맞았어요! ⭐ 1개') : '정답은 여기예요! ⭐ 1개'}<br>${gloss(ev.why)}`);
            const placed = $app.querySelector('.slot.placed'); if (placed) placed.scrollIntoView({ block: 'center' });
          } else {
            tries++;
            b.classList.add('wiggle');
            if (tries === 1) draw(`🤔 다시 생각해 볼까? 이 사건은 <b>${esc(ev.when)}</b>의 일이에요. 연표 속 해와 비교해 봐요!`);
            else { near = true; draw('💡 힌트! 밝게 남은 자리 중 하나예요. 앞뒤 사건의 해를 살펴봐요.'); }
          }
        };
      });
    };
    draw('');
  };

  views.flowDone = () => {
    if (!flow) { go('home'); return; }
    const A = flow.A; const p = personById[A.person];
    $app.innerHTML = `${header('🎉 오늘 탐험 끝')}
      <section class="result"><div class="big-em">🎉</div><h1>${esc((S.explorer || { name: '탐험' }).name)} 대원, 오늘 탐험 완료!</h1>
        <div class="sum">
          <div><span class="em">${A.emoji}</span><b>${esc(A.title.split(':')[0])}</b><small>모험 ${'⭐'.repeat(flow.stars)}</small></div>
          <div><span class="em">${p.emoji}</span><b>${esc(p.name)}</b><small>인물 카드</small></div>
          <div><span class="em">📅</span><b>${(S.line || []).length}개</b><small>내 연표 사건</small></div>
        </div></section>
      <div class="think"><b>💬 너라면?</b><p>${gloss(A.think)}</p><small>정답은 없어요. 가족이랑 이야기해 봐요!</small></div>
      <p class="muted center">🧠 3일 뒤에 기억 퀴즈가 찾아와요. 그때 다시 만나요!</p>
      <div class="nav2"><button class="ghost" data-go="book">🗂️ 인물 도감</button><button class="ghost" data-go="eraMap">🗺️ 시대 지도</button><button class="main" data-go="home">처음으로</button></div>`;
  };

  // ---------------------------------------------------------------- 🗺️ 시대 지도 (세로 노선) · 시대 상세 (탭)
  const eraStats = (id) => {
    const adv = H.adventures.filter((a) => a.era === id);
    const ppl = H.people.filter((p) => p.era === id);
    return { adv, advDone: adv.filter((a) => S.adv && S.adv[a.id]).length, ppl, met: ppl.filter((p) => S.people[p.id]).length, events: H.events.filter((v) => v.era === id) };
  };
  views.eraMap = () => {
    $app.innerHTML = `${header('🗺️ 시대 지도')}
      <p class="lead">고조선부터 지금까지! 정거장을 누르면 그 시대를 자세히 볼 수 있어요.</p>
      <div class="line">${H.eras.map((e, i) => {
        const st = eraStats(e.id);
        const rulers = H.rulers && H.rulers[e.id];
        const chips = [
          st.adv.length ? `<span class="${st.advDone === st.adv.length ? 'ok' : ''}">🎮 모험 ${st.advDone}/${st.adv.length}</span>` : '',
          st.ppl.length ? `<span class="${st.met === st.ppl.length ? 'ok' : ''}">🧑 ${st.met}/${st.ppl.length}</span>` : '',
          rulers ? `<span>${rulers.kind === 'presidents' ? '🏛️ 대통령' : '👑 왕'} ${rulers.list.length}명</span>` : '',
          `<span>📅 사건 ${st.events.length}</span>`,
        ].join('');
        return `<button class="station" data-go="era" data-arg="${e.id}" style="--c:${e.color}">
          <span class="dot"><span>${e.emoji}</span>${i < H.eras.length - 1 ? '<i></i>' : ''}</span>
          <span class="info"><b>${esc(e.name)}</b><small>${esc(e.span)}</small><span class="p">${esc(e.one.split('.')[0])}.</span><span class="chips">${chips}</span></span>
        </button>`;
      }).join('')}</div>
      <button class="ghost wide" data-go="trainPick">🚂 순서 맞히기 도전</button>`;
  };

  views.era = (arg) => {
    const [id, tabArg] = String(arg).split(':');
    const e = eraById[id];
    const i = eraIndex[id];
    const st = eraStats(id);
    const rulers = H.rulers && H.rulers[id];
    const tabs = [['traits', '✨ 특징'], ...(rulers ? [['rulers', rulers.kind === 'presidents' ? '🏛️ 대통령' : '👑 왕']] : []), ['events', '📅 사건'], ['people', '🧑 인물']];
    const tab = tabs.some((t) => t[0] === tabArg) ? tabArg : 'traits';
    let body = '';
    if (tab === 'traits') {
      const stories = H.stories.filter((s) => s.era === id);
      body = `<ul class="traits">${(e.traits || [e.one]).map((t) => `<li>${gloss(t)}</li>`).join('')}</ul>
        ${st.adv.length ? `<h3>🎮 이 시대 모험</h3><div class="list">${st.adv.map((a) => `<button class="row" data-go="adv" data-arg="${a.id}"><span class="em">${a.emoji}</span><span class="txt"><b>${esc(a.title)} ${S.adv && S.adv[a.id] ? `<span class="done">${'⭐'.repeat(S.adv[a.id].stars)}</span>` : '<span class="new">NEW</span>'}</b></span></button>`).join('')}</div>` : ''}
        ${stories.length ? `<h3>📖 이 시대 이야기</h3><div class="list">${stories.map((s) => `<button class="row" data-go="storyFrom" data-arg="${s.id}|era|${id}"><span class="em">${s.emoji}</span><span class="txt"><b>${esc(s.title)} ${S.stories[s.id] ? '<span class="done">✔ 읽음</span>' : ''}</b><i>${esc(s.hook)}</i></span></button>`).join('')}</div>` : ''}`;
    } else if (tab === 'rulers') {
      body = H.rulerTab ? H.rulerTab(id, rulerApi) : '';
    } else if (tab === 'events') {
      const line = S.line || [];
      body = `<ol class="mini-line">${st.events.slice().sort((a, b) => a.year - b.year).map((v) => `<li><b>${esc(v.when)}</b> ${v.emoji} ${gloss(v.title)} ${line.includes(v.id) ? '<span class="done">📅 내 연표</span>' : ''}<br><small>${gloss(v.why)}</small></li>`).join('')}</ol>`;
    } else {
      body = `<div class="cards">${st.ppl.map(personCard).join('')}</div>
        ${st.met < st.ppl.length ? `<button class="ghost wide" data-go="whoRound" data-arg="${id}">❓ 이 시대 인물 카드 열기 도전</button>` : ''}`;
    }
    $app.innerHTML = `${header(`${e.emoji} ${esc(e.name)}`)}
      <section class="era-card" style="--c:${e.color}">
        <div class="span">${esc(e.span)}</div>
        <p class="one">${gloss(e.one)}</p>
        ${canSpeak ? `<button class="ghost" data-say="${esc(e.name + '. ' + (e.traits || [e.one]).map((t) => t.replace(/^\S+\s/, '')).join(' '))}">🔊 읽어 줘</button>` : ''}
      </section>
      <div class="etabs" style="--c:${e.color}">${tabs.map(([k, n]) => `<button class="${k === tab ? 'on' : ''}" data-go="era" data-arg="${id}:${k}">${n}</button>`).join('')}</div>
      <div class="etab-body">${body}</div>
      <div class="nav2">
        ${i > 0 ? `<button class="ghost" data-go="era" data-arg="${H.eras[i - 1].id}">← ${esc(H.eras[i - 1].name)}</button>` : '<span></span>'}
        <button class="ghost" data-go="eraMap">🗺️ 시대 지도</button>
        ${i < H.eras.length - 1 ? `<button class="ghost" data-go="era" data-arg="${H.eras[i + 1].id}">${esc(H.eras[i + 1].name)} →</button>` : '<span></span>'}
      </div>`;
    bindSay();
    if (H.rulerBind && tab === 'rulers') H.rulerBind(id, rulerApi);
  };
  function bindSay() {
    $app.querySelectorAll('[data-say]').forEach((b) => { b.hidden = !canSpeak; b.onclick = () => speak(b.dataset.say); });
  }

  // ---------------------------------------------------------------- 이야기
  const storyRow = (s) => `
    <button class="row" data-go="story" data-arg="${s.id}">
      <span class="em">${s.emoji}</span>
      <span class="txt"><b>${esc(s.title)} ${S.stories[s.id] ? '<span class="done">✔ 읽음</span>' : ''}</b><i>${esc(s.hook)}</i></span>
      ${eraTag(s.era)}
    </button>`;

  views.stories = () => {
    const sorted = H.stories.slice().sort((a, b) => eraIndex[a.era] - eraIndex[b.era]);
    $app.innerHTML = `${header('📖 이야기 듣기')}
      <p class="lead">옛날 순서대로 놓여 있어요. 끌리는 제목부터 골라도 돼요!</p>
      <div class="list">${sorted.map(storyRow).join('')}</div>`;
  };

  // 다른 화면에서 이야기를 열 때: "id|돌아갈 화면|그 화면 arg"
  let storyBack = null;
  views.storyFrom = (arg) => {
    const [id, back, backArg] = String(arg).split('|');
    storyBack = back ? { go: back, arg: backArg || '' } : null;
    current = 'story';
    views.story(id);
  };
  views.story = (id) => {
    const s = H.stories.find((x) => x.id === id);
    let shown = 1;
    let reading = false;
    const draw = () => {
      const done = shown >= s.paras.length;
      $app.innerHTML = `${header('📖 이야기')}
        <article class="story">
          <div class="story-head">${eraTag(s.era)}<h1>${s.emoji} ${esc(s.title)}</h1></div>
          ${s.paras.slice(0, shown).map((p, i) => `<p class="para ${i === shown - 1 ? 'new' : ''}">${gloss(p)}</p>`).join('')}
          <div class="story-ctrl">
            <button class="ghost" id="say" ${canSpeak ? '' : 'hidden'}>${reading ? '⏹ 그만 읽기' : '🔊 읽어 줘'}</button>
            ${done ? '' : `<button class="main" id="more">다음 이야기 ▼ <small>${shown}/${s.paras.length}</small></button>`}
          </div>
          ${done ? afterStory(s) : ''}
        </article>`;
      const more = document.getElementById('more');
      if (more) more.onclick = () => { shown++; if (reading) readFrom(shown - 1); draw(); scrollToNew(); };
      document.getElementById('say').onclick = () => {
        if (reading) { reading = false; hush(); draw(); return; }
        reading = true; readFrom(shown - 1); draw();
      };
      if (done) bindQuiz(s);
    };
    // 지금 보이는 마지막 문단부터 소리 내어 읽고, 끝나면 다음 문단을 열어 계속 읽어요
    const readFrom = (i) => {
      speak(s.paras[i], () => {
        if (!reading || current !== 'story') return;
        if (shown < s.paras.length) { shown++; draw(); scrollToNew(); readFrom(shown - 1); } else { reading = false; draw(); }
      });
    };
    draw();
  };
  const scrollToNew = () => { const n = $app.querySelector('.para.new'); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  function afterStory(s) {
    const p = s.person && personById[s.person];
    return `
      <div class="think"><b>💬 너라면?</b><p>${gloss(s.think)}</p><small>정답은 없어요. 가족이랑 이야기해 봐요!</small></div>
      <div class="quiz" id="quiz">
        <b>🧩 한 문제만!</b><p>${esc(s.quiz.q)}</p>
        <div class="choices">${s.quiz.choices.map((c, i) => `<button class="choice" data-i="${i}">${esc(c)}</button>`).join('')}</div>
        <div class="why" hidden></div>
      </div>
      ${storyBack ? `<button class="main wide" data-go="${storyBack.go}" data-arg="${esc(storyBack.arg)}">${storyBack.go === 'flowPerson' ? '▶ 탐험 이어 가기' : '↩ 돌아가기'}</button>`
        : (p ? `<button class="ghost wide" data-go="person" data-arg="${p.id}">🗂️ ${esc(p.name)} 인물 카드 보기</button>` : '')}`;
  }
  function bindQuiz(s) {
    const box = document.getElementById('quiz');
    let tries = 0;
    box.querySelectorAll('.choice').forEach((b) => {
      b.onclick = () => {
        if (box.classList.contains('solved')) return;
        tries++;
        const i = Number(b.dataset.i);
        if (i === s.quiz.answer) {
          b.classList.add('ok'); box.classList.add('solved');
          const first = !S.stories[s.id];
          const got = first ? (tries === 1 ? 3 : 2) : 0;
          S.stories[s.id] = true; save();
          if (got) { addStars(got); toast(`⭐ ${got}개! 이야기 완료`); } else toast('정답! 👏');
          const w = box.querySelector('.why'); w.hidden = false; w.innerHTML = '💡 ' + gloss(s.quiz.why);
          document.querySelector('.stars').textContent = `⭐ ${S.stars}`;
        } else {
          b.classList.add('no'); b.disabled = true;
          toast('앗, 이야기를 다시 떠올려 봐요!');
        }
      };
    });
  }

  // ---------------------------------------------------------------- 나는 누구일까요?
  views.whoPick = () => {
    $app.innerHTML = `${header('🕵️ 나는 누구일까요?')}
      <p class="lead">힌트를 하나씩 열면서 누구인지 맞혀요. 첫 힌트에 맞히면 ⭐4, 마지막 힌트면 ⭐1!</p>
      <div class="grid">
        <button class="tile" data-go="whoRound" data-arg="all" style="--c:#c0392b"><span class="em">🎲</span><b>아무 시대나</b><i>전체 인물 중에서 5명</i></button>
        ${H.eras.map((e) => `<button class="tile small" data-go="whoRound" data-arg="${e.id}" style="--c:${e.color}"><span class="em">${e.emoji}</span><b>${esc(e.name)}</b><i>${H.people.filter((p) => p.era === e.id).length}명</i></button>`).join('')}
      </div>`;
  };
  views.whoOne = (id) => whoGame([personById[id]], 'one');
  views.whoRound = (era) => {
    let pool = era === 'all' ? H.people : H.people.filter((p) => p.era === era);
    // 아직 못 만난 인물을 먼저
    pool = shuffle(pool).sort((a, b) => (S.people[a.id] ? 1 : 0) - (S.people[b.id] ? 1 : 0));
    whoGame(shuffle(pool.slice(0, Math.min(5, pool.length))), era);
  };

  // 보기 4개: 정답 + 같은 시대·가까운 시대에서 3명
  function choicesFor(p) {
    const near = H.people.filter((q) => q.id !== p.id).sort((a, b) =>
      Math.abs(eraIndex[a.era] - eraIndex[p.era]) - Math.abs(eraIndex[b.era] - eraIndex[p.era]) || Math.random() - 0.5);
    return shuffle([p, ...shuffle(near.slice(0, 6)).slice(0, 3)]);
  }

  function whoGame(list, era) {
    let n = 0; let score = 0;
    const round = () => {
      const p = list[n];
      const opts = choicesFor(p);
      let open = 1; let wrong = 0; let solved = false;
      const draw = () => {
        $app.innerHTML = `${header('🕵️ 나는 누구일까요?')}
          <div class="who">
            <div class="who-top"><span>${n + 1} / ${list.length}</span>${eraTag(p.era)}</div>
            <div class="silhouette ${solved ? 'show' : ''}">${solved ? p.emoji : '❓'}</div>
            ${solved && open < p.hints.length ? '<p class="more-hints">✨ 맞혔으니 남은 힌트도 열어 줄게요. 이 인물을 더 알아봐요!</p>' : ''}
            <ol class="hints">${p.hints.map((h, i) => {
              if (i < open) return `<li class="on">${gloss(h)}</li>`;
              if (solved) return `<li class="on bonus"><span class="tag-new">더 알아보기</span>${gloss(h)}</li>`;
              return `<li>힌트 ${i + 1} 🔒</li>`;
            }).join('')}</ol>
            ${!solved && open < p.hints.length ? `<button class="ghost" id="more">🔓 힌트 하나 더 (⭐ ${4 - open}개로 줄어요)</button>` : ''}
            <div class="choices four">${opts.map((o) => `<button class="choice" data-id="${o.id}" ${solved ? 'disabled' : ''}>${esc(o.name)}</button>`).join('')}</div>
            ${solved ? `<div class="about"><b>${p.emoji} ${esc(p.name)}</b><p>${gloss(p.about)}</p>
              <button class="ghost" data-say="${esc(p.name + '. ' + p.hints.join(' ') + ' ' + p.about)}">🔊 힌트까지 읽어 줘</button></div>
              <button class="main wide" id="next">${n + 1 < list.length ? '다음 인물 →' : '결과 보기'}</button>` : ''}
          </div>`;
        bindSay();
        const more = document.getElementById('more');
        if (more) more.onclick = () => { open++; draw(); };
        const next = document.getElementById('next');
        if (next) next.onclick = () => { n++; if (n < list.length) round(); else finish(); };
        $app.querySelectorAll('.choice').forEach((b) => {
          b.onclick = () => {
            if (solved) return;
            if (b.dataset.id === p.id) {
              solved = true;
              const got = Math.max(1, 5 - open - wrong);
              score += got; addStars(got);
              const isNew = !S.people[p.id];
              S.people[p.id] = true; save();
              toast(isNew ? `⭐ ${got}개! 새 인물 카드를 얻었어요 🗂️` : `⭐ ${got}개!`);
              draw();
              $app.querySelector(`.choice[data-id="${p.id}"]`).classList.add('ok');
            } else {
              wrong++; b.classList.add('no'); b.disabled = true;
              if (open < p.hints.length) { open++; toast('아니에요! 힌트가 하나 더 열렸어요'); setTimeout(draw, 500); } else toast('아니에요! 다시 골라 봐요');
            }
          };
        });
      };
      draw();
    };
    const finish = () => {
      $app.innerHTML = `${header('🕵️ 나는 누구일까요?')}
        <section class="result"><div class="big-em">🎉</div><h1>⭐ ${score}개를 모았어요!</h1>
          <p>${list.map((p) => `${p.emoji} ${esc(p.name)}`).join(' · ')}</p>
          <div class="nav2"><button class="main" data-go="${list.length === 1 ? 'person' : 'whoRound'}" data-arg="${list.length === 1 ? list[0].id : era}">${list.length === 1 ? '🗂️ 인물 카드 보기' : '🔁 한 판 더'}</button>
          <button class="ghost" data-go="home">처음으로</button></div></section>`;
    };
    round();
  }

  // ---------------------------------------------------------------- 연표 기차
  const TRAIN_LEVELS = [
    { id: 1, name: '1단계 · 시대 순서', desc: '시대 이름 5개를 순서대로', n: 5 },
    { id: 2, name: '2단계 · 서로 먼 사건', desc: '시대가 다른 사건 4개', n: 4 },
    { id: 3, name: '3단계 · 사건 5개', desc: '아무 사건이나 5개', n: 5 },
    { id: 4, name: '4단계 · 같은 시대 안에서', desc: '한 시대 또는 이웃 시대 사건 4개', n: 4 },
  ];
  views.trainPick = () => {
    $app.innerHTML = `${header('🚂 연표 기차')}
      <p class="lead">가장 옛날 일부터 차례로 눌러 기차에 태워요. 잘못 태웠으면 기차 칸을 눌러 내리면 돼요.</p>
      <div class="list">${TRAIN_LEVELS.map((l) => `
        <button class="row" data-go="train" data-arg="${l.id}">
          <span class="em">🚃</span><span class="txt"><b>${esc(l.name)} ${S.best[l.id] ? `<span class="done">최고 ${'⭐'.repeat(S.best[l.id])}</span>` : ''}</b><i>${esc(l.desc)}</i></span>
        </button>`).join('')}</div>`;
  };

  function trainItems(level) {
    if (level === 1) {
      const start = Math.floor(Math.random() * (H.eras.length - 4));
      const picked = shuffle(H.eras).slice(0, 5);
      // 1단계는 연속된 시대 5칸이면 너무 쉬워서, 전체에서 5개를 고르되 가끔은 이어진 5칸
      const set = Math.random() < 0.5 ? picked : H.eras.slice(start, start + 5);
      return set.map((e) => ({ key: e.id, order: eraIndex[e.id], emoji: e.emoji, title: e.name, when: e.span, why: e.one }));
    }
    let evs;
    if (level === 2) {
      const eras = shuffle(H.eras.map((e) => e.id)).slice(0, 4);
      evs = eras.map((id) => pick(H.events.filter((v) => v.era === id))).filter(Boolean);
    } else if (level === 3) {
      evs = shuffle(H.events).slice(0, 5);
    } else {
      const i = Math.floor(Math.random() * (H.eras.length - 1));
      const near = H.events.filter((v) => eraIndex[v.era] === i || eraIndex[v.era] === i + 1);
      evs = shuffle(near).slice(0, 4);
    }
    return evs.map((v) => ({ key: v.id, order: v.year, emoji: v.emoji, title: v.title, when: v.when, why: v.why, era: v.era }));
  }

  views.train = (arg) => {
    const level = Number(arg) || 1;
    const items = shuffle(trainItems(level));
    let seat = [];
    let checked = false;
    let tries = 0;
    const answer = items.slice().sort((a, b) => a.order - b.order).map((x) => x.key);
    const byKey = Object.fromEntries(items.map((x) => [x.key, x]));
    const draw = () => {
      const left = items.filter((x) => !seat.includes(x.key));
      const full = seat.length === items.length;
      $app.innerHTML = `${header('🚂 연표 기차')}
        <p class="lead">${esc(TRAIN_LEVELS[level - 1].name)} · <b>옛날</b> 일부터 차례로 태워요</p>
        <div class="rail">
          <span class="loco" aria-hidden="true">🚂</span>
          ${items.map((_, i) => {
            const k = seat[i]; const x = k && byKey[k];
            const st = checked && x ? (answer[i] === k ? 'ok' : 'no') : '';
            return `<button class="seat ${x ? 'full' : ''} ${st}" data-i="${i}" ${x && !checked ? '' : 'disabled'}>
              <small>${i + 1}번 칸</small>${x ? `<span class="em">${x.emoji}</span><b>${esc(x.title)}</b>${checked ? `<small class="when">${esc(x.when)}</small>` : ''}` : '<span class="empty">?</span>'}</button>`;
          }).join('')}
        </div>
        <div class="arrow-line"><span>옛날</span><span>요즘 →</span></div>
        ${checked ? '' : `<div class="platform">${left.map((x) => `<button class="ticket" data-k="${x.key}"><span class="em">${x.emoji}</span>${esc(x.title)}</button>`).join('') || '<p class="muted">모두 탔어요! 출발해 볼까요?</p>'}</div>`}
        <div class="nav2">
          ${checked ? '' : `<button class="ghost" id="reset" ${seat.length ? '' : 'disabled'}>↺ 다 내리기</button><button class="main" id="go" ${full ? '' : 'disabled'}>🚂 출발!</button>`}
        </div>
        <div id="res"></div>`;
      $app.querySelectorAll('.ticket').forEach((b) => { b.onclick = () => { seat.push(b.dataset.k); draw(); }; });
      $app.querySelectorAll('.seat.full').forEach((b) => { b.onclick = () => { if (checked) return; seat.splice(Number(b.dataset.i), 1); draw(); }; });
      const reset = document.getElementById('reset'); if (reset) reset.onclick = () => { seat = []; draw(); };
      const goBtn = document.getElementById('go'); if (goBtn) goBtn.onclick = check;
    };
    const check = () => {
      tries++;
      const right = seat.filter((k, i) => answer[i] === k).length;
      if (right === items.length) {
        checked = true;
        const got = tries === 1 ? 3 : tries === 2 ? 2 : 1;
        addStars(got); S.trains++; S.best[level] = Math.max(S.best[level] || 0, got); save();
        toast(`🎉 ⭐ ${got}개!`);
        draw();
        document.getElementById('res').innerHTML = `
          <section class="result"><div class="big-em">🎉</div><h1>칙칙폭폭, 출발! ⭐ ${got}개</h1>
          <ol class="mini-line">${answer.map((k) => { const x = byKey[k]; return `<li><b>${esc(x.when)}</b> ${x.emoji} ${gloss(x.title)}<br><small>${gloss(x.why)}</small></li>`; }).join('')}</ol>
          <div class="nav2"><button class="main" data-go="train" data-arg="${level}">🔁 한 번 더</button>${level < 4 ? `<button class="ghost" data-go="train" data-arg="${level + 1}">다음 단계 →</button>` : ''}</div></section>`;
      } else {
        // 맞게 탄 칸은 남기고, 틀린 칸만 내려요 (잠깐 맞음/틀림을 보여 준 뒤)
        const keep = seat.map((k, i) => (answer[i] === k ? k : null));
        toast(right ? `${right}칸은 맞았어요! 틀린 칸만 내릴게요` : '아쉬워요! 다시 차례대로 태워 봐요');
        checked = true; draw();
        setTimeout(() => { if (current === 'train') { checked = false; drawFixed(keep); } }, 1400);
      }
    };
    // 맞은 칸은 고정, 빈 칸에만 다시 태우기
    const drawFixed = (fixed) => {
      const slots = fixed.slice();
      const left = () => items.filter((x) => !slots.includes(x.key));
      const redraw = () => {
        $app.innerHTML = `${header('🚂 연표 기차')}
          <p class="lead">맞은 칸은 그대로 두었어요. 빈 칸을 눌러 고른 뒤, 아래에서 태울 사건을 눌러요.</p>
          <div class="rail">
            <span class="loco" aria-hidden="true">🚂</span>
            ${slots.map((k, i) => { const x = k && byKey[k]; const locked = fixed[i];
              return `<button class="seat ${x ? 'full' : ''} ${locked ? 'ok' : ''}" data-i="${i}" ${locked ? 'disabled' : ''}>
                <small>${i + 1}번 칸</small>${x ? `<span class="em">${x.emoji}</span><b>${esc(x.title)}</b>` : '<span class="empty">?</span>'}</button>`; }).join('')}
          </div>
          <div class="arrow-line"><span>옛날</span><span>요즘 →</span></div>
          <div class="platform">${left().map((x) => `<button class="ticket" data-k="${x.key}"><span class="em">${x.emoji}</span>${esc(x.title)}</button>`).join('') || '<p class="muted">모두 탔어요!</p>'}</div>
          <div class="nav2"><button class="main" id="go" ${slots.every(Boolean) ? '' : 'disabled'}>🚂 다시 출발!</button></div>
          <div id="res"></div>`;
        $app.querySelectorAll('.ticket').forEach((b) => { b.onclick = () => { const i = slots.indexOf(null); if (i >= 0) { slots[i] = b.dataset.k; redraw(); } }; });
        $app.querySelectorAll('.seat.full:not(:disabled)').forEach((b) => { b.onclick = () => { slots[Number(b.dataset.i)] = null; redraw(); }; });
        document.getElementById('go').onclick = () => { seat = slots.slice(); check(); };
      };
      redraw();
    };
    draw();
  };

  // ---------------------------------------------------------------- 🗂️ 인물 도감
  const personCard = (p) => {
    const got = S.people[p.id];
    return got
      ? `<button class="pcard got" data-go="person" data-arg="${p.id}" style="--c:${eraById[p.era].color}"><span class="em">${p.emoji}</span><b>${esc(p.name)}</b><small>${esc(eraById[p.era].name)}</small></button>`
      : `<button class="pcard" data-go="whoOne" data-arg="${p.id}"><span class="em">❓</span><b>???</b><small>${esc(eraById[p.era].name)}</small></button>`;
  };
  const BADGES = [[3, '🥉', '첫걸음'], [6, '🥈', '모으기 시작'], [10, '🥇', '인물 탐정'], [15, '🏅', '역사 친구'], [20, '🎖️', '인물 박사'], [24, '🏆', '도감 완성']];
  views.book = () => {
    const met = metCount();
    const nextB = BADGES.find((b) => met < b[0]);
    $app.innerHTML = `${header('🗂️ 인물 도감')}
      <section class="card">
        <div class="book-head"><b>${met} / ${H.people.length}명</b><span>${nextB ? `${nextB[1]} 다음 배지까지 ${nextB[0] - met}명` : '🏆 도감 완성!'}</span></div>
        <div class="bigbar"><i style="width:${Math.round((met / H.people.length) * 100)}%"></i></div>
        <div class="badges">${BADGES.map((b) => `<span class="${met >= b[0] ? 'on' : ''}" title="${b[0]}명">${b[1]}<small>${esc(b[2])}</small></span>`).join('')}</div>
        <p class="muted small">모험을 하면 카드가 생기고, ❓는 "나는 누구일까요?"로 열어요. 카드를 누르면 업적을 다시 볼 수 있어요.</p>
      </section>
      ${met < H.people.length ? '<button class="ghost wide" data-go="whoRound" data-arg="all">❓ 카드 열기 도전 (나는 누구일까요?)</button>' : ''}
      ${H.eras.map((e) => { const ps = H.people.filter((p) => p.era === e.id); if (!ps.length) return ''; const m = ps.filter((p) => S.people[p.id]).length;
        return `<h2 style="color:${e.color}">${e.emoji} ${esc(e.name)} <small class="muted">${m}/${ps.length}</small></h2><div class="cards">${ps.map(personCard).join('')}</div>`; }).join('')}`;
  };

  // 왕 카드 판 (rulers.js) 이 쓰는 도구
  const rulerApi = { S, save, addStars, toast, esc, gloss, speak, hush, canSpeak, header, go, $app, shuffle, eraById };

  // 🎮 역사 속으로 (adventure.js)
  const ADV = H.makeAdventure({ S, save, addStars, toast, esc, gloss, speak, hush, canSpeak, header, go, $app, personById, eraTag, afterAdventure });
  Object.assign(views, ADV.views);
  go('home');
  if (canSpeak) speechSynthesis.getVoices();
})();
