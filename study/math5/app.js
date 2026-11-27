// 화면: 홈 → 소단원 고르기 → 문제 풀기(무한 모드) → 오늘의 결과
//
// 틀렸을 때의 흐름 (기획서 3번 4~6):
//   어디서 틀렸을까 고르기 → 앱이 오답 패턴으로 진짜 원인 찾기 → 개념 설명
//   → 같은 문제 다시 풀기 (틀릴 때마다 힌트 1·2·3단계) → 비슷한 문제 5개 도전
//   → 4개 이상 맞히면 "이 유형 통과" 도장 / 3개 이하면 틀린 문제를 고치고 한 번 더 (최대 2회)
//   → 그래도 어려우면 "다음에 다시 도전" 목록
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const G = M5.grade, F = M5.figure, S = M5.store, T = M5.text;
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const rng = M5.rand.system();
  const state = S.load();

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const txt = (s) => M5.text.html(s); // 줄바꿈과 분수 표시 ⟪2 3/4⟫까지 화면용으로
  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => [...app.querySelectorAll(sel)];

  // ------------------------------------------------------------------ 바탕화면 앱 (설치 · 인터넷 없이 열기)
  // 인터넷 주소(https)로 열었을 때만: 앱 파일을 노트북에 담아 두어 인터넷이 없어도 열리게 한다 (sw.js)
  if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  const SITE = 'https://gkes1211-hash.github.io/kang/study/math5/';
  const KIT = 'desktop-shortcut/math5-desktop-shortcut.zip';
  const isWin = /Windows/.test(navigator.userAgent);
  let installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let installEvt = null; // 크롬·엣지가 "설치할 수 있어요" 하고 알려 줄 때 받아 둔다
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; paintInstall(); });
  window.addEventListener('appinstalled', () => { installed = true; installEvt = null; paintInstall(); toast('바탕화면에 앱을 설치했어요! 이제 아이콘을 두 번 눌러 열면 돼요.'); });
  // 홈·설정에 있는 설치 자리(.install-slot)를 지금 상태에 맞게 다시 그린다
  function installHtml(where) {
    if (installed) return where === 'settings' ? '<p class="ok-box">✅ 지금 앱 창으로 열려 있어요. 바탕화면(또는 시작 메뉴)의 아이콘으로 열면 돼요.</p>' : '';
    if (where === 'home') return installEvt ? '<div class="install-bar"><span>💻 바탕화면 아이콘을 두 번 눌러 바로 열 수 있게 할까요?</span><button class="btn primary small-btn" data-install>바탕화면에 앱 설치</button></div>' : '';
    const fileNote = location.protocol === 'file:' ? `<p class="warn-box small">지금은 노트북 안의 파일로 열려 있어서 설치할 수 없어요. 인터넷 주소 <b>${esc(SITE)}</b> 로 열어서 설치해 주세요.</p>` : '';
    return `${fileNote}
      ${installEvt ? '<div class="btns left"><button class="btn primary" data-install>💻 바탕화면에 앱 설치</button></div>' : `<p class="small">설치 버튼이 안 보이면: 크롬은 오른쪽 위 <b>⋮</b> → <b>전송, 저장, 공유</b> → <b>앱 설치</b>(또는 <b>바로가기 만들기</b> → "창으로 열기" 체크), 엣지는 <b>…</b> → <b>앱</b> → <b>이 사이트를 앱으로 설치</b>.</p>`}
      ${isWin ? `<p class="small">설치가 잘 안 되면 윈도우용 아이콘 만들기 파일을 써도 돼요: <a href="${KIT}" download>⬇️ 바탕화면 아이콘 만들기 파일 받기</a> → 압축을 풀고 <b>make-shortcut.bat</b> 을 두 번 누르기.</p>` : ''}`;
  }
  function paintInstall() {
    document.querySelectorAll('.install-slot').forEach((el) => {
      el.innerHTML = installHtml(el.dataset.where);
      el.querySelectorAll('[data-install]').forEach((b) => b.addEventListener('click', async () => {
        if (!installEvt) return;
        const e = installEvt;
        e.prompt();
        try { await e.userChoice; } catch (_) { /* 무시 */ }
        installEvt = null;
        paintInstall();
      }));
    });
  }
  // 백업한 지 오래됐는지 (기록이 어느 정도 쌓였는데 백업이 없거나 30일이 지났으면 알려 준다)
  function backupDue() {
    const sm = S.summary(state);
    if (sm.solved < 20) return false;
    const last = state.settings.lastBackup;
    return !last || Date.now() - new Date(last).getTime() > 30 * 86400000;
  }

  const PRAISE = ['정답이에요! 👏', '잘했어요! 🌟', '맞았어요, 멋져요! 😊', '훌륭해요! 💯', '정확해요! 👍', '척척 풀었네요! ✨'];
  const PRAISE_FIXED = ['다시 풀어서 맞혔어요! 👏', '끝까지 해냈어요! 🌟', '스스로 고쳐서 맞혔어요! 💪'];
  const AGAIN = ['거의 다 왔어요.', '여기만 다시 볼까요?', '괜찮아요, 한 번 더 해 봐요!', '조금만 더 생각해 봐요.'];
  const CAUSE = { concept: '개념 부족', calc: '계산 실수', condition: '조건 놓침', form: '약분·표현 미완성' };
  // "어디서 틀렸을까?" 아이가 고르는 보기. form(약분·표현)은 '계산하다 실수했다'와 비교한다.
  const SELF = [
    { id: 'concept', icon: '🤔', label: '개념을 몰랐어요' },
    { id: 'calc', icon: '✏️', label: '계산하다 실수했어요' },
    { id: 'condition', icon: '👀', label: '문제를 잘못 읽었어요' },
    { id: 'unknown', icon: '❓', label: '잘 모르겠어요' },
  ];
  const SELF_OF = { concept: 'concept', calc: 'calc', condition: 'condition', form: 'calc' };
  const TIP = {
    concept: '개념 설명을 천천히 읽고, 예시와 같은 방법으로 풀어 봐요.',
    calc: '답을 쓰기 전에 계산을 한 번 더 확인하는 습관을 들여 봐요.',
    condition: '답을 쓰기 전에 문제에서 꼭 지켜야 할 조건에 밑줄을 긋듯이 다시 읽어 봐요.',
    form: '값을 구한 뒤 약분이나 표현을 끝까지 했는지 확인해 봐요.',
  };
  const NUMS = '①②③④⑤⑥⑦⑧⑨';
  const CHALLENGE_N = 5;
  const PASS = 4;
  const UNITS = [
    { id: 1, name: '수의 범위와 어림하기' },
    { id: 2, name: '분수의 곱셈', note: '곧 만들어요' },
    { id: 3, name: '합동과 대칭' },
    { id: 4, name: '소수의 곱셈', note: '곧 만들어요' },
    { id: 5, name: '직육면체와 정육면체' },
    { id: 6, name: '평균과 가능성', note: '곧 만들어요' },
  ];

  let onKey = null;
  document.addEventListener('keydown', (ev) => { if (onKey) onKey(ev); });

  const save = () => S.save(state);
  const stars = (lv) => '★'.repeat(lv) + '☆'.repeat(4 - lv);
  const rateOf = (key) => { const s = state.stats[key]; return s && s.s ? Math.round((s.c / s.s) * 100) : null; };
  const typeName = (tid) => {
    const t = M5.templates.find((x) => x.id === tid);
    if (!t) return tid;
    return `${M5.findSub(t.sub).sub.name} · ${t.styleName}`;
  };
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  function header(extra = '') {
    return `<header class="top"><button class="brand" data-go="home">🧮 5학년 2학기 수학</button>${extra}</header>`;
  }
  const NAV = '<nav class="nav"><button class="navb" data-go="records">📊 내 기록</button><button class="navb" data-go="settings">⚙️ 설정</button></nav>';
  function bindCommon() {
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const go = b.dataset.go;
      if (go === 'home') home();
      else if (go === 'reports') reports();
      else if (go === 'retry') retryList();
      else if (go === 'records') records();
      else if (go === 'settings') settings();
      else if (go === 'review') reviewSession();
      else if (go === 'hw') hwList();
      else if (go === 'drill') drillHome();
    }));
  }

  // 처음 낸 답을 기록한다 (sign = -1이면 "문제가 이상해요"로 되돌리기)
  //   오늘 기록, 날짜별 기록, 소단원·단원 정답률, 틀린 유형 횟수, 복습 일정
  function recordFirst(p, ok, sign = 1) {
    S.ensureToday(state);
    const t = state.today;
    t.solved += sign;
    if (ok) t.correct += sign;
    if (sign > 0) {
      if (ok) { t.streak++; t.best = Math.max(t.best, t.streak); } else t.streak = 0;
    }
    S.bumpDay(state, 's', sign);
    if (ok) S.bumpDay(state, 'c', sign);
    S.bump(state, p.sub, ok, sign);
    S.bump(state, 'u' + p.unit, ok, sign);
    if (!ok && !String(p.tid).startsWith('hw:')) {
      state.wrong[p.tid] = Math.max(0, (state.wrong[p.tid] || 0) + sign);
      // 틀린 유형은 1일·7일·30일 뒤에 다시 (기획서 7번)
      if (sign > 0) M5.review.markWrong(state, p, S.todayStr());
    }
    save();
    const st = $('.stats');
    if (st) st.outerHTML = statsHtml();
  }
  function reportProblem(p) {
    state.reports.push({ at: new Date().toISOString(), tid: p.tid, level: p.level, text: p.text, answer: G.answerText(p), key: p.key });
    save();
    toast('알려 줘서 고마워요! 이 문제는 채점에서 빼고 저장해 둘게요.');
  }
  const fmtDate = (d) => { const [, m, dd] = d.split('-'); return `${Number(m)}월 ${Number(dd)}일`; };
  function statsHtml() {
    const t = state.today;
    return `<div class="stats">
      <span>오늘 푼 문제 <b>${t.solved}</b></span>
      <span>맞힌 문제 <b>${t.correct}</b></span>
      <span>연속 정답 <b>🔥 ${t.streak}</b></span>
      <span>통과한 유형 <b>🏅 ${t.passed}</b></span>
    </div>`;
  }

  // 학습 앱 모음(전체 메뉴)으로 돌아가는 버튼: 보통 브라우저나 "학습 앱 모음" 아이콘 창에서만 (이 앱만 따로 설치한 창에서는 감춤)
  const menuLink = (() => {
    let desk = false;
    try { desk = sessionStorage.getItem('kang-desktop-menu') === '1'; } catch (e) { /* 표시 없음 */ }
    const solo = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches || navigator.standalone;
    return solo && !desk ? '' : '<a class="menu-link" href="../../">← 🎒 학습 앱 모음</a>';
  })();

  // ------------------------------------------------------------------ 홈
  function home() {
    S.ensureToday(state);
    onKey = null;
    const t = state.today;
    const today = S.todayStr();
    const rate = t.solved ? Math.round((t.correct / t.solved) * 100) : 0;
    const due = M5.review.dueList(state, today);
    const upcoming = Object.values(state.review).map((x) => x.due).filter((d) => d > today).sort()[0];
    const mode = state.settings.mode;
    app.innerHTML = `${header(NAV)}
      <main class="home">
        ${menuLink}
        <section class="review-card ${due.length ? 'has' : ''}">
          <div>
            <h2>📅 오늘의 복습 <b>${due.length}개</b></h2>
            <p>${due.length ? '예전에 틀렸던 유형을 다시 풀어 봐요. 3번 연속 맞히면 완전히 익힌 거예요!' : upcoming ? `오늘은 복습할 유형이 없어요. 다음 복습은 ${fmtDate(upcoming)}이에요.` : '틀린 유형이 생기면 1일, 7일, 30일 뒤에 여기서 다시 풀어요.'}</p>
          </div>
          <button class="btn primary" data-go="review" ${due.length ? '' : 'disabled'}>복습 시작</button>
        </section>
        ${hwCard()}
        ${drillCard()}
        <section class="today">
          <div><span class="k">오늘 푼 문제</span><b>${t.solved}</b></div>
          <div><span class="k">처음에 맞힌 문제</span><b>${t.correct}</b></div>
          <div><span class="k">정답률</span><b>${rate}%</b></div>
          <div><span class="k">오늘 통과한 유형</span><b>🏅 ${t.passed}</b></div>
        </section>
        <section class="minis three">
          <button class="mini" data-go="retry"><span class="k">다음에 다시 도전</span><b>${state.retry.length}개</b></button>
          <button class="mini" data-go="records"><span class="k">받은 도장</span><b>🏅 ${Object.keys(state.stamps).length}개 유형</b></button>
          <button class="mini" data-go="records"><span class="k">완전히 익힌 유형</span><b>⭐ ${Object.keys(state.mastered).length}개</b></button>
        </section>
        <div class="mode-row">
          <h2>단원을 골라요</h2>
          <div class="mode" role="group" aria-label="모드 선택">
            <button class="modeb ${mode === 'endless' ? 'on' : ''}" data-mode="endless">♾️ 무한 모드</button>
            <button class="modeb ${mode === 'set10' ? 'on' : ''}" data-mode="set10">🔟 10문제 모드</button>
          </div>
        </div>
        <div class="units">
          ${UNITS.map((u) => {
            const ready = M5.units.some((x) => x.id === u.id);
            const r = rateOf('u' + u.id);
            return `<button class="unit" data-unit="${u.id}" ${ready ? '' : 'disabled'}>
              <span class="no">${u.id}</span>
              <span class="nm">${esc(u.name)}</span>
              <span class="meta">${ready ? (r == null ? '시작해 볼까요?' : `정답률 ${r}%`) : esc(u.note)}</span>
            </button>`;
          }).join('')}
        </div>
        ${S.saveOk() ? '' : '<p class="warn-box">⚠️ 기록을 저장하지 못하고 있어요. 설정에서 백업 파일을 내보내 두세요.</p>'}
        ${backupDue() ? `<div class="backup-nudge"><span>💾 ${state.settings.lastBackup ? '백업한 지 30일이 지났어요.' : '아직 백업 파일이 없어요.'} 기록을 지키려면 백업 파일을 내보내 두세요.</span><button class="btn small-btn" data-go="settings">백업하러 가기</button></div>` : ''}
        <div class="install-slot" data-where="home"></div>
      </main>`;
    bindCommon();
    paintInstall();
    $$('.unit:not([disabled])').forEach((b) => b.addEventListener('click', () => subs(Number(b.dataset.unit))));
    $$('.modeb').forEach((b) => b.addEventListener('click', () => {
      state.settings.mode = b.dataset.mode;
      save();
      $$('.modeb').forEach((x) => x.classList.toggle('on', x === b));
      toast(b.dataset.mode === 'set10' ? '10문제를 풀면 결과를 보여 줘요.' : '그만 풀 때까지 문제가 계속 나와요.');
    }));
  }

  // ------------------------------------------------------------------ 소단원 고르기
  function subs(unitId, summary = '') {
    onKey = null;
    const u = M5.units.find((x) => x.id === unitId);
    const tierOf = (k) => Math.min(3, state.levels[k] || 1);
    const card = (key, name, desc) => {
      const r = rateOf(key);
      const scope = /^u\d+$/.test(key) ? { unit: unitId } : { unit: unitId, sub: key };
      const has = (m) => M5.modePool(scope, m).length > 0;
      return `<div class="subitem">
        <div class="subhead"><span class="nm">${esc(name)}</span><span class="meta">${r == null ? '' : `정답률 ${r}%`}</span>${desc ? `<span class="desc">${esc(desc)}</span>` : ''}</div>
        <div class="mbtns">
          <button class="sub mb basic" data-sub="${key}" data-mode="basic"><b>📘 기본 → 응용 → 심화</b><span>지금: ${M5.TIERS[tierOf(key) - 1]}</span></button>
          <button class="mb think" data-sub="${key}" data-mode="think" ${has('think') ? '' : 'disabled'}><b>🧩 사고력</b></button>
          <button class="mb top" data-sub="${key}" data-mode="top" ${has('top') ? '' : 'disabled'}><b>🏔️ 최상위</b>${has('top') ? `<span>${topDone(scope)}</span>` : '<span>준비 중</span>'}</button>
        </div>
      </div>`;
    };
    app.innerHTML = `${header()}
      <main class="subs">
        <button class="back" data-go="home">← 단원 목록</button>
        ${summary}
        <h2>${u.id}단원 ${esc(u.name)}</h2>
        <p class="lead">📘 <b>기본 → 응용 → 심화</b>: 기본부터 시작해서 3번 연속 맞히면 한 단계씩 올라가요.<br>🧩 <b>사고력</b>, 🏔️ <b>최상위</b>는 그 소단원 내용으로 만든 문제예요. 풀고 싶을 때 눌러요.</p>
        <div class="sublist">
          ${card('u' + u.id, '🔀 전체 섞기', '모든 소단원 문제가 골고루 나와요')}
          ${u.subs.map((s, i) => card(s.id, `${i + 1}. ${s.name}`)).join('')}
        </div>
      </main>`;
    bindCommon();
    $$('.mb').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.sub;
      const scope = /^u\d+$/.test(k) ? { unit: unitId } : { unit: unitId, sub: k };
      if (b.dataset.mode === 'top') topList(scope); else play(scope, { mode: b.dataset.mode });
    }));
  }

  // 기본·응용·심화 고르기 (문제 화면의 '바꾸기')
  function tierPick(lv) {
    return `<div class="lvpick" role="group" aria-label="단계 고르기"><span class="k">단계</span>${M5.TIERS.map((name, i) => `<button type="button" class="lvb ${i + 1 === lv ? 'on' : ''}" data-lv="${i + 1}" aria-pressed="${i + 1 === lv}"><span class="nm">${name}</span></button>`).join('')}</div>`;
  }
  const tierChips = (lv) => `<span class="tiers">${M5.TIERS.map((t, i) => `<span class="tchip ${i + 1 < lv ? 'ok' : i + 1 === lv ? 'now' : ''}">${i + 1 < lv ? '✓ ' : ''}${t}</span>`).join('<span class="tarr">→</span>')}</span>`;


  // ------------------------------------------------------------------ 문제 하나 풀기
  // 무한 모드·비슷한 문제 도전·틀린 문제 고치기에서 같이 쓴다.
  //   opts.fix       틀리면 고치는 흐름(어디서 틀렸을까 → 원인 → 개념 → 힌트 받으며 다시 풀기)을 할지
  //   opts.startWith 이미 한 번 틀린 답 { input, res } 이 있으면 고치는 흐름부터 시작
  //   opts.banner    문제 위에 보여 줄 안내 (도전 진행 상황 등)
  //   opts.onFirst(ok)   처음 낸 답의 결과 (기록용)
  //   opts.onDone(result) 끝났을 때 { firstOk, firstInput, firstRes, actual, self }
  //   opts.onWeird()  "문제가 이상해요"
  //   opts.onStop()   "그만 풀기"
  //   opts.onBack()   "← 소단원 고르기"
  function solve(p, opts) {
    // phase: answer(처음 풀기) → diagnose(어디서 틀렸을까) → explained(원인 보기) → retry(다시 풀기) → copy(정답 보고 따라 풀기) → done
    let phase = 'answer';
    let hintLv = 0;
    let sel = p.answer.type === 'multi' || p.answer.type === 'points' ? new Set() : null;
    const result = { firstOk: null, firstInput: null, firstRes: null, actual: null, self: null };
    let pendingRes = null;
    let formNoted = false; // 약분·대분수 안내를 기록했는지
    let essayWarned = false; // 서술형: 풀이를 안 쓰고 냈을 때 한 번 안내했는지

    const a = p.answer;
    M5.current = p; // 지금 화면의 문제 (브라우저 자동 테스트에서 쓴다)
    const figOpts = (a.options || []).some((o) => o.figure);
    const info = M5.findSub(p.sub);

    function inputHtml() {
      const unitTxt = a.unit ? `<span class="unit-txt">${esc(a.unit)}</span>` : '';
      const field = (i, cls = '') => `<input id="in${i}" class="in ${cls}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">`;
      switch (a.type) {
        case 'num': return `<label class="lab" for="in0">답</label><div class="row">${field(0)}${unitTxt}</div>`;
        case 'nums': return `<label class="lab" for="in0">답 (여러 개는 쉼표로 나누어 써요. 예: 12, 15, 18)</label><div class="row">${field(0, 'wide')}</div>`;
        case 'pair': return a.labels.map((l, i) => `<div class="row pair"><label for="in${i}">${esc(l)}</label>${field(i)}</div>`).join('');
        case 'frac': {
          const f = (id, cls, label) => `<input id="${id}" class="in ${cls}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}">`;
          return `<p class="lab">답 (진분수는 분자·분모 칸만, 대분수는 자연수 칸까지, 자연수 답은 자연수 칸만 써요)</p>
            <div class="row frin">${f('fw', 'fw', '자연수')}<span class="frbox">${f('fn', 'fn', '분자')}<span class="bar" aria-hidden="true"></span>${f('fd', 'fd', '분모')}</span>${unitTxt}</div>
            <p class="help">칸 이동: Tab (분자 칸에서 / 를 누르면 분모 칸으로)</p>`;
        }
        case 'ineq': return `<p class="lab">(가) ○ (나): 알맞은 것을 골라요 (키보드 &lt; = &gt;)</p><div class="ineq">${['>', '=', '<'].map((v) => `<button class="opt sym" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
        case 'points': return `<p class="lab">그림의 모눈 점을 눌러서 찍어요. 다시 누르면 지워져요.</p>
            <div class="row"><span class="pcount">찍은 점 <b id="pcount">0</b>개</span><button type="button" id="pclear" class="btn ghost small-btn">모두 지우기</button></div>`;
        case 'ox': return `<p class="lab">맞으면 O, 틀리면 X (키보드 O, X)</p><div class="ox"><button class="opt big o" data-v="true">O</button><button class="opt big x" data-v="false">X</button></div>`;
        case 'choice':
        case 'multi':
          return `<p class="lab">${a.type === 'multi' ? '알맞은 것을 모두 골라요' : '하나를 골라요'} (키보드 숫자 1~${a.options.length})</p>
            <div class="opts ${figOpts ? 'figs' : ''}">${a.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="n">${NUMS[i]}</span>${o.figure ? F.render(o.figure) : `<span class="t">${txt(o.text)}</span>`}</button>`).join('')}</div>`;
        default: return '';
      }
    }

    function render() {
      const lvBox = opts.levelText ? `<div class="level">${opts.levelText}${opts.onLevel ? ' <button type="button" class="link lvchange">바꾸기</button><div class="lvpop" hidden></div>' : ''}</div>` : '';
      app.innerHTML = `${header(statsHtml())}
        <main class="play">
          <button id="back" class="back playback">${esc(opts.backLabel || '← 소단원 고르기')}</button>
          <section class="qcard">
            ${opts.banner || ''}
            <div class="tags">
              <span class="tag ${p.style === 'A' ? 'ta' : 'tb'}">${p.style === 'A' ? '문제집 형식' : '새로운 유형'}</span>
              <span class="tag">${esc(p.styleName)}</span>
              <span class="tag sub">${esc(info.sub.name)}</span>
            </div>
            <p class="qtext">${txt(p.text)}</p>
            ${p.figure ? `<div class="figure">${F.render(p.figure)}</div>` : ''}
            ${figOpts ? `<div id="inputs">${inputHtml()}</div>` : ''}
          </section>
          <section class="acard">
            ${lvBox}
            ${p.essay ? '<label class="lab" for="essay">✏️ 풀이 과정을 써요</label><textarea id="essay" class="essay-in" rows="4" placeholder="예) 대분수를 가분수로 바꾸면 …"></textarea>' : ''}
            ${figOpts ? '<p class="lab">왼쪽에서 알맞은 그림을 골라요.</p>' : `<div id="inputs">${inputHtml()}</div>`}
            <div id="prev"></div>
            <button id="submit" class="btn primary">채점하기 <kbd>Enter</kbd></button>
            <div id="fb" class="fb" aria-live="polite"></div>
            <div id="diag"></div>
            <div id="hints"></div>
            <details id="concept" class="concept"><summary>📘 개념 다시 보기</summary><p>${txt(info.sub.concept)}</p></details>
            <div class="bottom">
              <button id="weird" class="btn ghost">🚩 문제가 이상해요</button>
              <button id="stop" class="btn ghost">그만 풀기</button>
            </div>
          </section>
        </main>`;
      bindCommon();
      $('#submit').addEventListener('click', submit);
      $('#weird').addEventListener('click', () => opts.onWeird(result));
      $('#stop').addEventListener('click', () => opts.onStop());
      $('#back').addEventListener('click', () => opts.onBack());
      // 단계 바꾸기: 바꾼 다음에도 '바꾸기' 단추가 남아 있어서 몇 번이든 다시 바꿀 수 있어요
      const bindLevel = () => {
        if (!opts.onLevel || !$('.lvchange')) return;
        $('.lvchange').addEventListener('click', () => {
          const pop = $('.lvpop');
          pop.hidden = !pop.hidden;
          if (pop.hidden) return;
          pop.innerHTML = tierPick(opts.levelNow()) + '<p class="small muted">다음 문제부터 바뀌어요.</p>';
          pop.querySelectorAll('.lvb').forEach((b) => b.addEventListener('click', () => {
            opts.onLevel(Number(b.dataset.lv));
            $('.level').innerHTML = `${opts.levelText2()} <span class="small muted">· 다음 문제부터</span> <button type="button" class="link lvchange">바꾸기</button><div class="lvpop" hidden></div>`;
            bindLevel();
          }));
        });
      };
      bindLevel();
      $$('.opt').forEach((b) => b.addEventListener('click', () => choose(b)));
      $$('.figure .gp').forEach((c) => c.addEventListener('click', () => pickPoint(c.dataset.p)));
      if ($('#pclear')) $('#pclear').addEventListener('click', () => { if (canInput()) { sel.clear(); paintPoints(); } });
      $$('.rot-btn').forEach((b) => b.addEventListener('click', () => b.parentElement.classList.toggle('turned')));
      onKey = keyHandler;
      if (opts.startWith) {
        // 도전에서 틀린 문제를 고치러 왔을 때: 처음 낸 답을 보여 주고 바로 "어디서 틀렸을까?"
        result.firstOk = false;
        result.firstInput = opts.startWith.input;
        result.firstRes = opts.startWith.res;
        $('#prev').innerHTML = `<p class="prev">처음 낸 답: <b>${txt(inputText(opts.startWith.input))}</b></p>`;
        markChosenWrong(opts.startWith.input);
        startDiagnose(opts.startWith.res);
      } else {
        const first = firstField();
        if (first) first.focus();
      }
      if (a.type === 'frac') {
        // 분자 칸에서 / 를 누르면 분모 칸으로, 자연수 칸에서 띄어쓰기를 누르면 분자 칸으로
        $('#fn').addEventListener('keydown', (ev) => { if (ev.key === '/') { ev.preventDefault(); $('#fd').focus(); } });
        $('#fw').addEventListener('keydown', (ev) => { if (ev.key === ' ') { ev.preventDefault(); $('#fn').focus(); } });
      }
    }
    function firstField() { return p.essay ? $('#essay') : ($('#in0') || $('#fw')); }

    // ----- 입력
    const canInput = () => phase === 'answer' || phase === 'retry' || phase === 'copy';
    // 모눈 점 찍기 (3단원 도형 완성하기)
    function pickPoint(key) {
      if (!canInput()) return;
      if (sel.has(key)) sel.delete(key); else sel.add(key);
      paintPoints();
    }
    function paintPoints() {
      $$('.figure .gp').forEach((c) => c.classList.toggle('on', sel.has(c.dataset.p)));
      if ($('#pcount')) $('#pcount').textContent = sel.size;
    }
    function choose(b) {
      if (b.disabled || !(phase === 'answer' || phase === 'retry' || phase === 'copy')) return;
      if (a.type === 'multi') {
        const i = Number(b.dataset.i);
        if (sel.has(i)) sel.delete(i); else sel.add(i);
        b.classList.toggle('sel', sel.has(i));
        return;
      }
      $$('.opt').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      if (a.type === 'choice') sel = Number(b.dataset.i);
      else if (a.type === 'ox') sel = b.dataset.v === 'true';
      else sel = b.dataset.v;
    }
    function getInput() {
      switch (a.type) {
        case 'num': case 'nums': return $('#in0').value;
        case 'pair': return [$('#in0').value, $('#in1').value];
        case 'frac': return { w: $('#fw').value, n: $('#fn').value, d: $('#fd').value };
        case 'multi': case 'points': return [...sel];
        default: return sel;
      }
    }
    function inputText(input) {
      switch (a.type) {
        case 'num': return String(input).trim() + (a.unit ? ' ' + a.unit : '');
        case 'nums': return String(input).trim();
        case 'pair': return a.labels.map((l, i) => `${l}: ${String(input[i]).trim()}`).join(', ');
        case 'frac': {
          const w = String(input.w || '').trim(), n = String(input.n || '').trim(), d = String(input.d || '').trim();
          const isN = (x) => /^\d+$/.test(x);
          const body = isN(n) && isN(d) ? M5.frac.mkRaw(n, d, isN(w) ? +w : 0) : [w, n && d ? `${n}/${d}` : n || d].filter(Boolean).join(' ');
          return body + (a.unit ? ' ' + a.unit : '');
        }
        case 'ineq': return input;
        case 'ox': return input ? 'O' : 'X';
        case 'choice': return a.options[input].text || `${NUMS[input]}번`;
        case 'multi': return input.map((i) => a.options[i].text).join(', ');
        case 'points': return `점 ${input.length}개`;
        default: return '';
      }
    }
    function setLocked(locked) {
      $$('#inputs input').forEach((x) => { x.disabled = locked; });
      $$('.opt').forEach((x) => { if (!x.classList.contains('wrong')) x.disabled = locked; });
    }
    function markChosenWrong(input) {
      if (a.type === 'choice' || a.type === 'ineq' || a.type === 'ox') {
        const b = a.type === 'choice' ? $(`.opt[data-i="${input}"]`) : $(`.opt[data-v="${String(input)}"]`);
        if (b) { b.classList.remove('sel'); b.classList.add('wrong'); b.disabled = true; }
        sel = null;
      } else if (a.type === 'num' || a.type === 'nums') {
        $('#in0').value = input;
      } else if (a.type === 'pair') {
        $('#in0').value = input[0]; $('#in1').value = input[1];
      } else if (a.type === 'frac') {
        $('#fw').value = input.w || ''; $('#fn').value = input.n || ''; $('#fd').value = input.d || '';
      } else if (a.type === 'multi') {
        sel = new Set(input);
        $$('.opt').forEach((b) => b.classList.toggle('sel', sel.has(Number(b.dataset.i))));
      } else if (a.type === 'points') {
        sel = new Set(input);
        paintPoints();
      }
    }
    function markAnswer() {
      $$('.opt.sel').forEach((b) => b.classList.remove('sel'));
      if (a.type === 'choice') { const b = $(`.opt[data-i="${a.value}"]`); if (b) b.classList.add('right'); }
      if (a.type === 'multi') a.values.forEach((i) => { const b = $(`.opt[data-i="${i}"]`); if (b) b.classList.add('right'); });
      if (a.type === 'ox' || a.type === 'ineq') { const b = $(`.opt[data-v="${String(a.value)}"]`); if (b) b.classList.add('right'); }
      if (a.type === 'points') revealPoints();
      revealFigure();
    }
    // 정답을 보여 줄 때 그림을 바꾼다 (예: 전개도에 맞닿는 선분 짝 번호)
    function revealFigure() {
      if (!p.figureAfter) return;
      const fig = $('.qcard .figure');
      if (fig) fig.innerHTML = F.render(p.figureAfter) + '<p class="fig-note">같은 번호끼리 접으면 맞닿아요. 빨간 점은 한 곳에서 만나는 점이에요.</p>';
    }
    // 점 찍기 문제의 정답: 완성된 도형과 찍어야 할 점을 보여 준다
    function revealPoints() {
      const fig = $('.figure');
      if (fig) fig.classList.add('reveal');
      $$('.figure .gp').forEach((c) => c.classList.toggle('right', a.values.includes(c.dataset.p)));
    }

    function keyHandler(ev) {
      if (phase === 'diagnose') {
        if (/^[1-4]$/.test(ev.key)) { ev.preventDefault(); pickSelf(SELF[Number(ev.key) - 1].id); }
        return;
      }
      if (ev.target && ev.target.tagName === 'TEXTAREA' && !(ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey))) return;
      if (ev.key === 'Enter') {
        if (ev.target && ev.target.tagName === 'SUMMARY') return;
        ev.preventDefault();
        submit();
        return;
      }
      if (ev.target && ev.target.tagName === 'INPUT') return;
      let btn = null;
      if ((a.type === 'choice' || a.type === 'multi') && /^[1-9]$/.test(ev.key)) btn = $(`.opt[data-i="${Number(ev.key) - 1}"]`);
      else if (a.type === 'ox' && /^[oOㅐ]$/.test(ev.key)) btn = $('.opt[data-v="true"]');
      else if (a.type === 'ox' && /^[xXㅌ]$/.test(ev.key)) btn = $('.opt[data-v="false"]');
      else if (a.type === 'ineq' && ['<', '>', '='].includes(ev.key)) btn = $(`.opt[data-v="${ev.key}"]`);
      if (btn) { ev.preventDefault(); choose(btn); }
    }

    // ----- 채점
    function submit() {
      if (phase === 'done') { opts.onDone(result); return; }
      if (phase === 'explained') { startRetry(); return; }
      if (phase === 'essay') { checkEssay(); return; }
      if (phase === 'diagnose') return;
      const input = getInput();
      const res = G.grade(p, input);
      const fb = $('#fb');
      if (res.empty) { fb.innerHTML = '<p class="warn">답을 먼저 입력해 주세요.</p>'; return; }
      if (res.invalid) { fb.innerHTML = `<p class="warn">${esc(res.invalid)}</p>`; return; }
      if (res.form) {
        // 값은 맞았지만 약분이나 대분수 표현이 덜 됨: 틀림으로 세지 않고 고치게 한다 (기획서 8번)
        fb.innerHTML = res.form === 'reduce'
          ? '<p class="warn">✨ 값은 맞았어요. 약분을 끝까지 했나요? 분자와 분모를 같은 수로 더 나눌 수 있어요.</p>'
          : '<p class="warn">✨ 값은 맞았어요. 가분수를 대분수로 나타내 볼까요? 자연수 부분은 자연수 칸에 써요.</p>';
        if (!formNoted) { formNoted = true; logForm(); }
        const f = res.form === 'reduce' ? $('#fn') : $('#fw');
        if (f) { f.focus(); f.select(); }
        return;
      }
      if (phase === 'answer' && p.essay && !essayWarned && !$('#essay').value.trim()) {
        essayWarned = true;
        fb.innerHTML = '<p class="warn">풀이 과정도 써 볼까요? 쓰지 않고 채점하려면 한 번 더 누르세요.</p>';
        $('#essay').focus();
        return;
      }

      if (phase === 'answer') {
        result.firstOk = !!res.ok;
        result.firstInput = Array.isArray(input) ? input.slice() : input;
        result.firstRes = res;
        opts.onFirst(!!res.ok);
        if (res.ok) return finish(`<p class="good">${rng.pick(PRAISE)}</p>${solutionHtml(false)}`);
        if (!opts.fix) {
          // 비슷한 문제 도전 중: 정답은 아직 보여 주지 않고, 도전이 끝난 뒤 같이 고친다
          return finish(opts.wrongMsg || '<p class="no">아쉬워요. 이 문제는 도전이 끝난 뒤에 같이 고쳐 봐요.</p>', false);
        }
        startDiagnose(res);
        return;
      }

      if (phase === 'retry' || phase === 'copy') {
        if (res.ok) {
          const msg = phase === 'copy' ? '정답을 직접 따라 풀어 봤어요. 비슷한 문제로 확실히 익혀요! 💪' : rng.pick(PRAISE_FIXED);
          return finish(`<p class="good">${msg}</p>${solutionHtml(false)}`);
        }
        if (phase === 'copy') {
          fb.innerHTML = '<p class="warn">위에 있는 정답을 보고 똑같이 입력해 봐요.</p>';
          return;
        }
        const parts = [`<p class="no">${rng.pick(AGAIN)}</p>`];
        if (res.pattern) parts.push(causeLine(res.pattern));
        const d = detailText(res);
        if (d) parts.push(`<p class="detail">${esc(d)}</p>`);
        if (hintLv >= 3) {
          // 힌트를 다 썼는데도 틀리면: 정답과 풀이를 보여 주고 따라 풀게 한다
          phase = 'copy';
          if (a.type === 'points') revealPoints();
          revealFigure();
          const ansT = G.answerText(p);
          parts.push(`<p class="reveal">정답은 <b>${txt(ansT)}</b>${T.j(ansT, '이에요/예요').slice(ansT.length)}. 풀이를 천천히 읽고, 정답을 직접 입력(선택)해 봐요.</p>${solutionHtml(true)}`);
          fb.innerHTML = parts.join('');
          markWrongInput(input);
          return;
        }
        hintLv++;
        parts.push(`<p>${T.j('힌트 ' + hintLv, '을/를')} 보고 다시 풀어 봐요.</p>`);
        fb.innerHTML = parts.join('');
        showHints();
        markWrongInput(input);
      }
    }

    function markWrongInput(input) {
      if (a.type === 'choice' || a.type === 'ineq' || a.type === 'ox') markChosenWrong(input);
      else if (a.type === 'num' || a.type === 'nums' || a.type === 'pair') { const i = $('#in0'); i.focus(); i.select(); }
      else if (a.type === 'frac') { const i = $('#fn').value ? $('#fn') : $('#fw'); i.focus(); i.select(); }
    }

    function finish(html, showAnswer = true) {
      phase = 'done';
      setLocked(true);
      $('#fb').innerHTML = html;
      $('#diag').innerHTML = '';
      if (showAnswer) markAnswer();
      const btn = $('#submit');
      btn.innerHTML = `${opts.nextLabel || '다음 문제 →'} <kbd>Enter</kbd>`;
      if (p.essay) $('#essay').disabled = true;
      if (p.essay && showAnswer) startEssayCheck();
      btn.focus();
    }

    // ----- 서술형 (기획서 12번): 모범 풀이를 보고 체크리스트로 내 풀이를 확인
    function startEssayCheck() {
      phase = 'essay';
      const mine = $('#essay').value.trim();
      $('#diag').innerHTML = `<div class="diag essay">
          <p class="q">📝 모범 풀이와 내 풀이를 비교해 봐요</p>
          ${mine ? `<div class="mine-sol"><b>내가 쓴 풀이</b><p>${esc(mine).replace(/\n/g, '<br>')}</p></div>` : '<p class="muted small">풀이를 쓰지 않았어요. 다음에는 꼭 써 봐요.</p>'}
          <div class="model"><b>모범 풀이</b><ol>${p.solution.map((x) => `<li>${txt(x)}</li>`).join('')}</ol></div>
          <p class="q2">내 풀이에서 한 것에 체크해요.</p>
          ${p.essay.checklist.map((c, i) => `<label class="chk"><input type="checkbox" id="chk${i}"> ${txt(c.q)}</label>`).join('')}
        </div>`;
      $('#submit').innerHTML = '체크 다 했어요 <kbd>Enter</kbd>';
      $('#diag').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function checkEssay() {
      const missed = p.essay.checklist.filter((c, i) => !$('#chk' + i).checked);
      $$('.chk input').forEach((x) => { x.disabled = true; });
      $('#hints').innerHTML = missed.length
        ? `<p class="warn">체크하지 못한 단계의 개념을 읽어 봐요.</p>${missed.map((c) => `<div class="hint"><span class="hn">${txt(c.q)}</span>${txt(c.concept)}</div>`).join('')}`
        : '<p class="good small">👍 풀이를 꼼꼼하게 확인했어요!</p>';
      phase = 'done';
      $('#submit').innerHTML = `${opts.nextLabel || '다음 문제 →'} <kbd>Enter</kbd>`;
      $('#submit').focus();
    }

    // ----- 1) 어디서 틀렸을까?
    function startDiagnose(res) {
      phase = 'diagnose';
      pendingRes = res;
      setLocked(true);
      $('#submit').hidden = true;
      $('#fb').innerHTML = `<p class="no">${rng.pick(AGAIN)} 정답은 아직 비밀이에요.</p>`;
      $('#diag').innerHTML = `<div class="diag">
          <p class="q">🔍 어디서 틀렸을까요? 스스로 골라 봐요.</p>
          <div class="selfs">${SELF.map((s, i) => `<button class="self" data-self="${s.id}"><span class="n">${i + 1}</span>${s.icon} ${esc(s.label)}</button>`).join('')}</div>
        </div>`;
      $$('.self').forEach((b) => b.addEventListener('click', () => pickSelf(b.dataset.self)));
    }

    // ----- 2) 앱이 찾은 진짜 원인 + 3) 개념 설명
    function pickSelf(self) {
      if (phase !== 'diagnose') return;
      const res = pendingRes;
      const pt = res.pattern;
      result.self = self;
      result.actual = pt ? pt.cause : null;
      logCause(self, result.actual);
      const parts = [];
      const selfLabel = SELF.find((s) => s.id === self).label;
      parts.push(`<p class="mine">내가 고른 원인: <b>${esc(selfLabel)}</b></p>`);
      if (pt) {
        parts.push(causeLine(pt, '앱이 찾은 원인'));
        const actualSelf = SELF_OF[pt.cause];
        if (self === 'unknown') parts.push('<p>괜찮아요. 앱이 찾은 원인을 같이 봐요.</p>');
        else if (self === actualSelf) parts.push('<p class="match">👍 스스로 원인을 정확히 찾았어요!</p>');
        else parts.push(`<p class="mismatch">고른 원인과 실제 원인이 달라요. 실제 원인은 <b>${esc(CAUSE[pt.cause])}</b>${T.j(CAUSE[pt.cause], '이에요/예요').slice(CAUSE[pt.cause].length)}. ${esc(TIP[pt.cause])}</p>`);
      } else {
        parts.push('<p>앱도 딱 맞는 원인을 찾지 못했어요. 어디서 다른지 같이 찾아볼까요? 힌트 1부터 볼게요.</p>');
        hintLv = 1;
      }
      const d = detailText(res);
      if (d) parts.push(`<p class="detail">${esc(d)}</p>`);
      $('#diag').innerHTML = `<div class="diag done">${parts.join('')}</div>`;
      $('#fb').innerHTML = '';
      $('#concept').open = true;
      showHints();
      phase = 'explained';
      const btn = $('#submit');
      btn.hidden = false;
      btn.innerHTML = '개념을 읽었어요. 다시 풀기 <kbd>Enter</kbd>';
      btn.focus();
    }

    // ----- 4) 같은 문제 다시 풀기
    function startRetry() {
      phase = 'retry';
      setLocked(false);
      const prevInput = result.firstInput;
      if (a.type === 'choice' || a.type === 'ineq' || a.type === 'ox') markChosenWrong(prevInput);
      $('#submit').innerHTML = '다시 채점하기 <kbd>Enter</kbd>';
      $('#fb').innerHTML = '<p>같은 문제를 다시 풀어 봐요. 틀릴 때마다 힌트를 하나씩 더 줄게요.</p>';
      const first = a.type === 'frac' ? $('#fw') : $('#in0');
      if (first) { first.focus(); first.select(); }
    }

    function causeLine(pt, label = '틀린 원인') {
      return `<p class="cause"><span class="badge">${esc(label)}: ${esc(CAUSE[pt.cause])}</span> ${txt(pt.msg)}</p>`;
    }
    function showHints() {
      $('#hints').innerHTML = p.hints.slice(0, hintLv).map((h, i) => `<div class="hint"><span class="hn">힌트 ${i + 1}</span>${txt(h)}</div>`).join('');
    }
    function solutionHtml(open) {
      return `<details class="sol" ${open ? 'open' : ''}><summary>풀이 보기</summary><ol>${p.solution.map((s) => `<li>${txt(s)}</li>`).join('')}</ol></details>`;
    }
    function detailText(res) {
      const bits = [];
      if (a.type === 'nums' || a.type === 'multi' || a.type === 'points') {
        const what = a.type === 'nums' ? '수' : a.type === 'points' ? '점' : '것';
        if (res.missing) bits.push(`${T.j('빠진 ' + what, '이/가')} ${res.missing}개 있어요.`);
        if (res.extra) bits.push(`${T.j('넣지 않아야 할 ' + what, '이/가')} ${res.extra}개 있어요.`);
      }
      if (a.type === 'pair' && res.wrong) {
        if (res.swapped) bits.push('두 수의 자리가 바뀌었어요.');
        else bits.push(`${res.wrong.map((i) => `'${a.labels[i]}'`).join(', ')} 칸을 다시 확인해요.`);
      }
      return bits.join(' ');
    }

    render();
  }

  // 값은 맞았는데 약분·대분수 표현이 덜 됐을 때 기록 (약점 2: 약분을 끝까지 하지 않는다)
  function logForm() {
    const c = state.causes;
    c.actual.form = (c.actual.form || 0) + 1;
    save();
  }

  function logCause(self, actual) {
    const c = state.causes;
    c.self[self] = (c.self[self] || 0) + 1;
    if (actual) {
      c.actual[actual] = (c.actual[actual] || 0) + 1;
      if (self !== 'unknown') {
        c.compared++;
        if (SELF_OF[actual] === self) c.matched++;
      }
    }
    save();
  }

  // ------------------------------------------------------------------ 무한 모드
  // opts.retryTid: "다음에 다시 도전"에서 그 유형의 비슷한 문제 도전부터 시작
  function play(scope, opts = {}) {
    const mode = opts.mode || 'basic';
    const sess = M5.createSession({ scope, state, rng, mode });
    const set10 = state.settings.mode === 'set10';
    const run = { solved: 0, correct: 0, streak: 0, best: 0, lastBreak: 0, startLevel: sess.level, passed: [], retried: [], normal: 0 };
    const levelText = () => (mode === 'basic' ? tierChips(sess.level) : mode === 'think' ? `🧩 <b>사고력</b> <span class="stars">${stars(sess.level)}</span>` : '🏔️ <b>최상위</b>') + (set10 ? ` <span class="set10">🔟 ${run.normal + 1} / 10번째</span>` : '');

    // 처음 낸 답 기록 (sign = -1이면 "문제가 이상해요"로 되돌리기)
    function count(p, ok, sign = 1) {
      run.solved += sign;
      if (ok) run.correct += sign;
      if (sign > 0) {
        if (ok) { run.streak++; run.best = Math.max(run.best, run.streak); } else run.streak = 0;
      }
      recordFirst(p, ok, sign);
    }
    function weirdSave(p, result) {
      reportProblem(p);
      if (result.firstOk != null) count(p, result.firstOk, -1); // 채점에서 빼기
    }

    // ---- 무한 모드 한 문제
    function nextNormal() {
      if (set10 && run.normal >= 10) { result(true); return; }
      if (!set10 && run.solved >= run.lastBreak + 20) { run.lastBreak = run.solved; rest(); return; }
      const p = sess.next();
      solve(p, {
        fix: true,
        levelText: levelText(),
        levelText2: levelText,
        levelNow: () => sess.level,
        onLevel: mode === 'basic' ? (n) => {
          sess.setLevel(n);
          save();
          toast(`다음 문제부터 ${M5.TIERS[n - 1]} 문제가 나와요.`);
        } : null,
        onFirst(ok) {
          count(p, ok);
          run.normal++;
          const change = sess.record(ok);
          if (mode === 'basic') {
            if (change > 0) toast(`🎉 3번 연속 맞혔어요! ${M5.TIERS[sess.level - 1]} 단계로 올라가요.`);
            if (change < 0) toast(`${M5.TIERS[sess.level - 1]} 문제로 다시 다져 볼게요. 천천히 해요!`);
          } else {
            if (change > 0) toast('⭐ 잘하고 있어요! 다음 문제부터 조금 더 어려워져요.');
            if (change < 0) toast('다음 문제부터 조금 쉽게 해 볼게요. 천천히 해요!');
          }
        },
        onDone(r) {
          if (r.firstOk) nextNormal();
          else challengeIntro(p, r.actual);
        },
        onWeird(r) { weirdSave(p, r); nextNormal(); },
        onStop: result,
          onBack: back,
      });
    }

    // ---- 비슷한 문제 도전 안내
    function challengeIntro(orig, cause) {
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); challenge(orig, cause, 1); } };
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">🎯</div>
          <h2>비슷한 문제 도전!</h2>
          <p>방금 고친 문제와 비슷한 문제 ${CHALLENGE_N}개를 풀어요.<br><b>${PASS}개 이상</b> 맞히면 <b>"이 유형 통과" 도장</b>을 받아요.</p>
          <p class="muted">${esc(typeName(orig.tid))}</p>
          <div class="btns"><button id="go" class="btn primary">도전 시작 <kbd>Enter</kbd></button></div>
        </section></main>`;
      bindCommon();
      $('#go').addEventListener('click', () => challenge(orig, cause, 1));
    }

    // ---- 비슷한 문제 5개
    function challenge(orig, cause, round) {
      const set = sess.similar(orig, cause);
      const results = [];
      let idx = 0;
      step();

      function banner() {
        const dots = set.map((_, i) => {
          if (i < results.length) return `<span class="dot ${results[i].firstOk ? 'ok' : 'bad'}">${results[i].firstOk ? '○' : '✕'}</span>`;
          return `<span class="dot ${i === idx ? 'now' : ''}">${i + 1}</span>`;
        }).join('');
        return `<div class="banner chal">
          <span>🎯 비슷한 문제 도전${round === 2 ? ' (두 번째)' : ''} <b>${idx + 1} / ${CHALLENGE_N}</b></span>
          <span class="dots">${dots}</span>
          <span class="goal">${PASS}개 이상 맞히면 통과</span>
        </div>`;
      }
      function step() {
        if (idx >= set.length) { challengeResult(); return; }
        const q = set[idx];
        solve(q, {
          fix: false,
          banner: banner(),
          nextLabel: idx === set.length - 1 ? '결과 보기 →' : '다음 문제 →',
          onFirst(ok) { count(q, ok); },
          onDone(r) { r.q = q; results.push(r); idx++; step(); },
          onWeird(r) {
            weirdSave(q, r);
            set[idx] = sess.another(orig); // 같은 틀의 새 문제로 바꿔서 계속
            step();
          },
          onStop: result,
          onBack: back,
        });
      }
      function challengeResult() {
        const score = results.filter((r) => r.firstOk).length;
        const wrongs = results.filter((r) => !r.firstOk);
        const dots = results.map((r) => `<span class="dot ${r.firstOk ? 'ok' : 'bad'}">${r.firstOk ? '○' : '✕'}</span>`).join('');
        let body, btn, go;
        if (score >= PASS) {
          giveStamp(orig);
          body = `<div class="stamp" aria-label="이 유형 통과 도장"><span>이 유형</span><b>통과</b><span>🏅</span></div>
            <h2>${score}개 맞혔어요! 이 유형 통과!</h2>
            <p class="muted">${esc(typeName(orig.tid))}</p>`;
          btn = '무한 모드로 돌아가기';
          go = nextNormal;
        } else if (round === 1) {
          body = `<div class="big-emoji">💪</div><h2>${score}개 맞혔어요. 괜찮아요!</h2>
            <p>틀린 ${wrongs.length}문제를 하나씩 같이 고쳐 보고,<br>비슷한 문제에 <b>한 번 더</b> 도전해요.</p>`;
          btn = '틀린 문제 고치러 가기';
          go = () => fixAll(wrongs, () => challengeIntro2(orig, cause));
        } else {
          addRetry(orig);
          body = `<div class="big-emoji">🌱</div><h2>${score}개 맞혔어요.</h2>
            <p>이 유형은 조금 더 연습이 필요해요.<br><b>"다음에 다시 도전"</b> 목록에 넣어 둘게요. 다음에 꼭 다시 해 봐요!</p>
            <p class="muted">${esc(typeName(orig.tid))}</p>`;
          btn = '무한 모드로 돌아가기';
          go = nextNormal;
        }
        onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } };
        app.innerHTML = `${header(statsHtml())}
          <main class="center"><section class="panel">
            <p class="dots big">${dots}</p>
            ${body}
            <div class="btns"><button id="go" class="btn primary">${btn} <kbd>Enter</kbd></button><button id="stop" class="btn">그만 풀기</button></div>
          </section></main>`;
        bindCommon();
        $('#go').addEventListener('click', go);
        $('#stop').addEventListener('click', result);
      }
    }

    function challengeIntro2(orig, cause) {
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); challenge(orig, cause, 2); } };
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">🎯</div>
          <h2>다 고쳤어요! 한 번 더 도전해요</h2>
          <p>새로운 비슷한 문제 ${CHALLENGE_N}개예요. 이번에는 <b>${PASS}개 이상</b> 맞혀 봐요!</p>
          <div class="btns"><button id="go" class="btn primary">두 번째 도전 시작 <kbd>Enter</kbd></button></div>
        </section></main>`;
      bindCommon();
      $('#go').addEventListener('click', () => challenge(orig, cause, 2));
    }

    // ---- 도전에서 틀린 문제를 하나씩 고치기 (어디서 틀렸을까 → 원인 → 개념 → 힌트 받으며 다시 풀기)
    function fixAll(list, then) {
      let i = 0;
      const stepFix = () => {
        if (i >= list.length) { then(); return; }
        const r = list[i];
        solve(r.q, {
          fix: true,
          startWith: { input: r.firstInput, res: r.firstRes },
          banner: `<div class="banner fix">🔧 틀린 문제 고치기 <b>${i + 1} / ${list.length}</b></div>`,
          nextLabel: i === list.length - 1 ? '다 고쳤어요 →' : '다음 틀린 문제 →',
          onFirst() {},
          onDone() { i++; stepFix(); },
          onWeird(res) { weirdSave(r.q, res); i++; stepFix(); },
          onStop: result,
          onBack: back,
        });
      };
      stepFix();
    }

    function giveStamp(orig) {
      const s = state.stamps[orig.tid] || (state.stamps[orig.tid] = { n: 0, last: '' });
      s.n++;
      s.last = S.todayStr();
      state.today.passed++;
      S.bumpDay(state, 'p', 1);
      state.retry = state.retry.filter((x) => x.tid !== orig.tid);
      run.passed.push(orig.tid);
      save();
    }
    function addRetry(orig) {
      if (!state.retry.some((x) => x.tid === orig.tid)) {
        state.retry.push({ tid: orig.tid, sub: orig.sub, styleName: orig.styleName, level: orig.level, at: S.todayStr() });
      }
      run.retried.push(orig.tid);
      save();
    }

    function rest() {
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); nextNormal(); } };
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">🍵</div>
          <h2>잠깐 쉬어 갈까요?</h2>
          <p>벌써 ${run.solved}문제를 풀었어요! 눈을 감고 기지개를 쭉 켜 봐요.</p>
          <div class="btns"><button id="go" class="btn primary">계속 풀기 <kbd>Enter</kbd></button><button id="stop" class="btn">그만 풀기</button></div>
        </section></main>`;
      bindCommon();
      $('#go').addEventListener('click', nextNormal);
      $('#stop').addEventListener('click', result);
    }

    // 소단원 고르기 화면으로 돌아가기
    function back() { subs(scope.unit); }

    // "그만 풀기": 오늘의 결과를 요약해서 소단원 고르기 페이지 맨 위에 보여 준다
    function result(finished10) {
      if (!run.solved) { subs(scope.unit); return; }
      const rate = Math.round((run.correct / run.solved) * 100);
      const lv = sess.level;
      const lvMsg = lv > run.startLevel ? ' 단계가 올라갔어요! 🎉' : lv < run.startLevel ? ' 다음에는 조금 쉬운 문제부터 다시 올라가요.' : '';
      const list = (ids) => [...new Set(ids)].map((id) => esc(typeName(id))).join(', ');
      const where = (scope.sub ? M5.findSub(scope.sub).sub.name : '전체 섞기') + (mode === 'think' ? ' · 사고력' : mode === 'top' ? ' · 최상위' : '');
      const summary = `<section class="summary" aria-label="오늘의 결과">
          <div class="sum-head"><span class="big-emoji">${rate >= 80 ? '🏆' : rate >= 50 ? '🌟' : '🌱'}</span><div><h3>${finished10 ? '10문제 완료! 오늘의 결과' : '오늘의 결과'}</h3><p class="muted small">방금 푼 소단원: ${esc(where)}</p></div></div>
          <div class="result">
            <div><span class="k">푼 문제</span><b>${run.solved}</b></div>
            <div><span class="k">맞힌 문제</span><b>${run.correct}</b></div>
            <div><span class="k">정답률</span><b>${rate}%</b></div>
            <div><span class="k">통과한 유형</span><b>🏅 ${new Set(run.passed).size}</b></div>
          </div>
          ${run.passed.length ? `<p class="small">🏅 통과한 유형: ${list(run.passed)}</p>` : ''}
          ${run.retried.length ? `<p class="small">🌱 다음에 다시 도전할 유형: ${list(run.retried)}</p>` : ''}
          <p class="small">${mode === 'basic' ? `지금 단계: <b>${M5.TIERS[lv - 1]}</b>.${lvMsg}` : mode === 'think' ? '🧩 사고력 문제를 풀었어요.' : '🏔️ 최상위 문제를 풀었어요.'} 맞힌 문제는 처음 낸 답으로 세어요.</p>
        </section>`;
      subs(scope.unit, summary);
    }

    if (opts.retryTid) {
      // "다음에 다시 도전"에서 왔으면 그 유형의 비슷한 문제 도전부터
      const tpl = M5.templates.find((t) => t.id === opts.retryTid);
      const item = state.retry.find((x) => x.tid === opts.retryTid);
      if (tpl) { challengeIntro(M5.makeProblem(tpl, (item && item.level) || tpl.levels[0], rng, null), null); return; }
    }
    nextNormal();
  }

  // ------------------------------------------------------------------ 🏔️ 최상위: 대표 문제 → 변형 3문제
  // 문제집처럼 유형마다 대표 문제를 풀이와 함께 익히고, 같은 유형을 비튼 변형 문제 3개에 도전한다.
  const TOP_N = 3;
  const topName = (t) => t.styleName.replace(/^최상위( 이야기)?: /, '');
  function topDone(scope) {
    const pool = M5.modePool(scope, 'top');
    const n = pool.filter((t) => state.top[t.id] && state.top[t.id].best === TOP_N).length;
    return `정복 ${n} / ${pool.length}`;
  }
  function topList(scope) {
    onKey = null;
    const pool = M5.modePool(scope, 'top');
    const where = scope.sub ? M5.findSub(scope.sub).sub.name : `${scope.unit}단원 전체`;
    const card = (t, i) => {
      const r = state.top[t.id];
      const badge = !r ? '<span class="tp new">새 유형</span>' : r.best === TOP_N ? '<span class="tp ok">🏅 정복</span>' : `<span class="tp mid">변형 ${r.best} / ${TOP_N}</span>`;
      return `<button class="topic" data-tid="${t.id}"><span class="no">${t.story ? '🌟 이야기' : `유형 ${i + 1}`}</span><b>${esc(topName(t))}</b>${scope.sub ? '' : `<span class="small muted">${esc(M5.findSub(t.sub).sub.name)}</span>`}${badge}</button>`;
    };
    const main = pool.filter((t) => !t.story), story = pool.filter((t) => t.story);
    app.innerHTML = `${header(statsHtml())}
      <main class="subs">
        <button class="back" id="tback">← 소단원 고르기</button>
        <h2>🏔️ 최상위 · ${esc(where)}</h2>
        <p class="lead">유형마다 <b>① 대표 문제</b>를 풀이와 함께 익히고, <b>② 변형 문제 ${TOP_N}개</b>에 도전해요.<br>변형 문제를 ${TOP_N}개 모두 맞히면 그 유형을 <b>정복</b>해요. 어려우면 힌트를 봐도 괜찮아요!</p>
        <h3 class="tops-h">📌 대표 유형</h3>
        <div class="topics">${main.map(card).join('')}</div>
        ${story.length ? `<h3 class="tops-h">🌟 이야기 문제 <span class="small muted">여러 가지를 이어서 푸는 긴 문제</span></h3><div class="topics">${story.map(card).join('')}</div>` : ''}
      </main>`;
    bindCommon();
    $('#tback').addEventListener('click', () => subs(scope.unit));
    $$('.topic').forEach((b) => b.addEventListener('click', () => topTopic(M5.templates.find((t) => t.id === b.dataset.tid), scope)));
  }

  function topTopic(tpl, scope) {
    const avoid = new Set(state.recent.map((x) => x.key));
    const mk = (v) => { const p = M5.makeProblem(tpl, 4, rng, avoid, v); avoid.add(p.key); return p; };
    const rep = mk(0);
    const back = () => topList(scope);
    const results = [];
    const banner = (i) => {
      const dots = Array.from({ length: TOP_N }, (_, k) => (k < results.length ? `<span class="dot ${results[k] ? 'ok' : 'bad'}">${results[k] ? '○' : '✕'}</span>` : `<span class="dot ${k === i ? 'now' : ''}">${k + 1}</span>`)).join('');
      return `<div class="banner chal"><span>🏔️ ${esc(topName(tpl))} · 변형 문제 <b>${i + 1} / ${TOP_N}</b></span><span class="dots">${dots}</span></div>`;
    };
    const solveOpts = (extra) => Object.assign({ fix: true, backLabel: '← 최상위 유형 목록', onStop: back, onBack: back }, extra);

    // 1) 대표 문제 🧭 같이 풀기
    //   ① 어떻게 풀지 먼저 생각하기 (막히면 방법 힌트) → ② 풀이를 한 단계씩, 계산 결과를 직접 채우기 → ③ 변형 문제는 혼자서
    function intro() {
      const steps = M5.guide.steps(rep);
      const plan = rep.hints.slice(0, 2); // 방법을 떠올리게 하는 힌트 (마지막 힌트는 답에 가까워서 빼요)
      let stage = 'think', hintN = 0, idx = 0, tries = 0;
      const done = []; // 지난 조각 [{ st, mark }]
      M5.currentGuide = { steps, get idx() { return idx; } }; // 브라우저 자동 테스트에서 쓴다
      app.innerHTML = `${header(statsHtml())}
        <main class="hw-explain">
          <button class="back" id="tback">← 최상위 유형 목록</button>
          <section class="qcard">
            <div class="banner top-rep">📌 대표 문제 · ${esc(topName(tpl))}</div>
            <p class="qtext">${txt(rep.text)}</p>
            ${rep.figure ? `<div class="figure">${F.render(rep.figure)}</div>` : ''}
            ${rep.answer.options ? `<ol class="rep-opts">${rep.answer.options.map((o) => `<li>${txt(o.text || '')}</li>`).join('')}</ol>` : ''}
          </section>
          <section class="acard" id="guide"></section>
        </main>`;
      bindCommon();
      $('#tback').addEventListener('click', back);
      const box = $('#guide');
      const stageBar = () => `<ol class="gsteps"><li class="${stage === 'think' ? 'now' : 'ok'}">🤔 방법 생각하기</li><li class="${stage === 'steps' ? 'now' : stage === 'end' ? 'ok' : ''}">🧭 한 단계씩 풀기</li><li>✏️ 혼자 풀기</li></ol>`;
      const planHtml = () => (hintN ? `<ul class="gplan">${plan.slice(0, hintN).map((h) => `<li>💡 ${txt(h)}</li>`).join('')}</ul>` : '');
      const doneHtml = () => {
        let h = '';
        done.forEach((d, i) => {
          const s = `<span class="${d.mark === 'ok' ? 'g-ok' : d.mark === 'shown' ? 'g-shown' : ''}">${txt(M5.guide.filled(d.st))}</span>${d.mark === 'ok' ? ' ✓' : ''}`;
          h += i && d.st.cont ? ` <span class="g-arr">→</span> ${s}` : `${i ? '</p>' : ''}<p class="gline">${s}`;
        });
        return h ? h + '</p>' : '';
      };

      function render() {
        if (stage === 'think') {
          box.innerHTML = `${stageBar()}
            <div class="hw-why"><p class="q">🤔 먼저 생각해 봐요</p><p>무엇을 먼저 구해야 할까요? 어떤 순서로 풀면 될지 떠올려 봐요. 종이에 써 봐도 좋아요.</p></div>
            ${planHtml()}
            <div class="btns left">
              <button id="gready" class="btn primary">방법이 떠올랐어요 → 한 단계씩 풀기 <kbd>Enter</kbd></button>
              ${hintN < plan.length ? `<button id="ghint" class="btn">💡 ${hintN ? '힌트 하나 더' : '방법이 안 떠올라요 (힌트)'}</button>` : ''}
              <button id="try" class="btn ghost">✏️ 혼자 끝까지 풀어 볼래요</button>
            </div>`;
          $('#gready').addEventListener('click', () => { stage = 'steps'; render(); });
          if ($('#ghint')) $('#ghint').addEventListener('click', () => { hintN++; render(); });
          $('#try').addEventListener('click', tryRep);
          onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); stage = 'steps'; render(); } };
          return;
        }
        if (stage === 'steps' && idx >= steps.length) stage = 'end';
        if (stage === 'end') {
          box.innerHTML = `${stageBar()}${planHtml()}<div class="gdone">${doneHtml()}</div>
            <div class="good-box">🎉 대표 문제를 끝까지 풀었어요! 답: <b>${txt(G.answerText(rep))}</b></div>
            <p>이제 같은 유형의 문제를 <b>혼자서</b> 풀어 봐요. 막히면 지금 푼 순서를 떠올려요.</p>
            <div class="btns left"><button id="go" class="btn primary">✏️ 혼자 풀기: 변형 문제 ${TOP_N}개 ▶ <kbd>Enter</kbd></button></div>`;
          $('#go').addEventListener('click', () => variant(0));
          onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); variant(0); } };
          $('#go').focus();
          return;
        }
        const st = steps[idx];
        const n = steps.slice(0, idx + 1).filter((x) => x.kind === 'ask').length, total = steps.filter((x) => x.kind === 'ask').length;
        let cur;
        if (st.kind === 'read') {
          cur = `<p class="gline gcur">${st.cont && idx ? '<span class="g-arr">→</span> ' : ''}${txt(st.text)}</p>
            <div class="btns left"><button id="gnext" class="btn primary">읽었어요, 다음 ▶ <kbd>Enter</kbd></button></div>`;
        } else {
          cur = `<p class="gq">✍️ 단계 ${n} / ${total}: □에 알맞은 수를 써요${st.type === 'frac' ? ' <span class="small muted">(분수는 2 3/4, 7/4처럼)</span>' : ''}</p>
            <p class="gline gcur">${st.cont && idx ? '<span class="g-arr">→</span> ' : ''}${txt(st.before)}<input id="gin" class="in gin" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="□에 들어갈 수">${txt(st.after)}</p>
            <div id="gfb" class="fb" aria-live="polite"></div>
            <div class="btns left"><button id="gok" class="btn primary">확인 <kbd>Enter</kbd></button></div>`;
        }
        box.innerHTML = `${stageBar()}${planHtml()}<div class="gdone">${doneHtml()}</div>${cur}`;
        const next = (mark) => { done.push({ st, mark }); idx++; tries = 0; render(); };
        if (st.kind === 'read') {
          $('#gnext').addEventListener('click', () => next('read'));
          onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); next('read'); } };
          $('#gnext').focus();
          return;
        }
        const submit = () => {
          if (tries >= 2) { next('shown'); return; }
          const v = $('#gin').value;
          if (!v.trim()) { $('#gfb').innerHTML = '<p class="small">□에 들어갈 수를 써 봐요.</p>'; return; }
          if (M5.guide.check(st, v)) { next('ok'); return; }
          tries++;
          if (tries === 1) {
            const more = hintN < plan.length ? `<br>💡 ${txt(plan[hintN])}` : '';
            if (hintN < plan.length) hintN++;
            $('#gfb').innerHTML = `<p class="bad-box">아쉬워요! 천천히 다시 생각해 봐요.${more}</p>`;
            $('#gin').select();
          } else {
            $('#gfb').innerHTML = `<p class="bad-box">괜찮아요. □에 들어갈 수는 <b>${txt(st.shown)}</b>예요. 확인하고 다음 단계로 가요.</p>`;
            $('#gin').value = T.plain(st.shown);
            $('#gin').disabled = true;
            $('#gok').innerHTML = '다음 ▶ <kbd>Enter</kbd>';
            $('#gok').focus();
          }
        };
        $('#gok').addEventListener('click', submit);
        onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } };
        $('#gin').focus();
      }
      render();
    }
    function tryRep() {
      solve(rep, solveOpts({
        banner: `<div class="banner top-rep">📌 대표 문제 · ${esc(topName(tpl))}</div>`,
        nextLabel: `변형 문제 ${TOP_N}개 도전 →`,
        onFirst(ok) { recordFirst(rep, ok); },
        onDone() { variant(0); },
        onWeird() { reportProblem(rep); back(); },
      }));
    }
    // 2) 변형 문제 3개 (같은 유형을 숫자·물음을 바꾸어)
    function variant(i) {
      if (i >= TOP_N) { finish(); return; }
      const p = mk(i + 1);
      state.recent.push({ key: p.key, tid: p.tid, sub: p.sub, styleName: p.styleName, style: p.style });
      if (state.recent.length > 50) state.recent.splice(0, state.recent.length - 50);
      let first = null;
      solve(p, solveOpts({
        banner: banner(i),
        nextLabel: i === TOP_N - 1 ? '결과 보기 →' : '다음 변형 문제 →',
        onFirst(ok) { first = ok; recordFirst(p, ok); },
        onDone() { results.push(!!first); variant(i + 1); },
        onWeird(r) {
          reportProblem(p);
          if (r.firstOk != null) recordFirst(p, r.firstOk, -1);
          variant(i); // 같은 자리에 새 문제
        },
      }));
    }
    // 3) 결과: 3개 모두 맞히면 정복
    function finish() {
      const score = results.filter(Boolean).length;
      const rec = state.top[tpl.id] || (state.top[tpl.id] = { best: 0, last: 0, tries: 0, at: '' });
      const firstWin = rec.best < TOP_N && score === TOP_N;
      rec.best = Math.max(rec.best, score); rec.last = score; rec.tries++; rec.at = S.todayStr();
      if (firstWin) { S.ensureToday(state); state.today.passed++; S.bumpDay(state, 'p'); }
      save();
      const dots = results.map((ok) => `<span class="dot ${ok ? 'ok' : 'bad'}">${ok ? '○' : '✕'}</span>`).join('');
      const body = score === TOP_N
        ? '<div class="stamp" aria-label="유형 정복 도장"><span>최상위</span><b>정복</b><span>🏅</span></div><h2>변형 문제를 모두 맞혔어요!</h2>'
        : score === TOP_N - 1 ? `<div class="big-emoji">🌟</div><h2>${score}개 맞혔어요. 정복까지 한 걸음!</h2><p>틀린 문제의 풀이를 떠올리며 한 번 더 도전해 봐요.</p>`
          : `<div class="big-emoji">🌱</div><h2>${score}개 맞혔어요. 괜찮아요!</h2><p>최상위 문제는 원래 어려워요. 대표 문제 풀이를 다시 보고 도전하면 훨씬 쉬워져요.</p>`;
      const again = () => topTopic(tpl, scope);
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); if (score === TOP_N) back(); else again(); } };
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <p class="dots big">${dots}</p>
          ${body}
          <p class="muted">${esc(topName(tpl))}</p>
          <div class="btns">${score === TOP_N
            ? '<button id="list" class="btn primary">다른 유형 고르기 <kbd>Enter</kbd></button><button id="again" class="btn">새 숫자로 한 번 더</button>'
            : '<button id="again" class="btn primary">대표 문제부터 다시 도전 <kbd>Enter</kbd></button><button id="list" class="btn">다른 유형 고르기</button>'}</div>
        </section></main>`;
      bindCommon();
      $('#again').addEventListener('click', again);
      $('#list').addEventListener('click', back);
    }
    intro();
  }
  // ------------------------------------------------------------------ ⚡ 연산 연습 (속도 + 정확도)
  // 한 판 10문제. 정확도 100%이면서 문제당 평균 시간이 목표 안이면 통과하고 다음 단계가 열린다.
  const DR = M5.drill;
  const UNIT_NAME = { 1: '1단원 어림하기', 2: '2단원 분수의 곱셈', 4: '4단원 소수의 곱셈', 6: '6단원 평균' };
  const drOf = (id) => state.drill[id] || (state.drill[id] = { open: 1, best: {}, hist: [] });
  const sec = (ms) => (ms / 1000).toFixed(1);
  function drillCard() {
    const passed = DR.CATS.reduce((s, c) => s + Object.values((state.drill[c.id] || {}).best || {}).filter((b) => b.pass).length, 0);
    return `<section class="hw-card drill-card">
      <div><h2>⚡ 연산 연습</h2><p>분수·소수의 곱셈, 어림, 평균을 <b>빠르고 정확하게</b>! 통과한 단계 <b>${passed} / ${DR.CATS.length * 3}</b></p></div>
      <button class="btn primary" data-go="drill">연산하러 가기</button>
    </section>`;
  }
  function drillHome() {
    onKey = null;
    const units = [...new Set(DR.CATS.map((c) => c.unit))].sort();
    const card = (c) => {
      const r = drOf(c.id);
      const lvs = [1, 2, 3].map((lv) => {
        const b = r.best[lv];
        const st = lv > r.open ? 'lock' : b && b.pass ? 'pass' : b ? 'try' : 'new';
        const label = st === 'lock' ? '🔒' : st === 'pass' ? `🏆 ${b.avg}초` : b ? `${b.acc}% · ${b.avg}초` : '도전!';
        return `<button class="dlv ${st}" data-cat="${c.id}" data-lv="${lv}" ${st === 'lock' ? 'disabled' : ''}><span>${lv}단계</span><b>${label}</b><em>목표 ${c.target[lv - 1]}초</em></button>`;
      }).join('');
      return `<div class="dcat"><div class="dhead"><b>${esc(c.name)}</b><span class="dex">${txt(c.ex)}</span></div><div class="dlvs">${lvs}</div></div>`;
    };
    app.innerHTML = `${header(statsHtml())}
      <main class="subs">
        <button class="back" data-go="home">← 처음으로</button>
        <h2>⚡ 연산 연습</h2>
        <p class="lead">한 판에 <b>${DR.ROUND}문제</b>를 풀고 걸린 시간을 재요. <b>정확도 100%</b>이면서 문제당 평균 시간이 <b>목표 시간 안</b>이면 통과! 다음 단계가 열려요.<br>속도보다 <b>정확도가 먼저</b>예요. 틀리지 않게 풀다 보면 빨라져요.</p>
        ${units.map((u) => `<h3 class="tops-h">${esc(UNIT_NAME[u])}</h3><div class="dcats">${DR.CATS.filter((c) => c.unit === u).map(card).join('')}</div>`).join('')}
      </main>`;
    bindCommon();
    $$('.dlv:not([disabled])').forEach((b) => b.addEventListener('click', () => drillIntro(DR.CATS.find((c) => c.id === b.dataset.cat), Number(b.dataset.lv))));
  }
  function drillIntro(cat, lv) {
    const go = () => drillRun(cat, lv);
    onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } };
    const isF = cat.unit === 2;
    app.innerHTML = `${header(statsHtml())}
      <main class="center"><section class="panel">
        <div class="big-emoji">⚡</div>
        <h2>${esc(cat.name)} · ${lv}단계</h2>
        <p>${DR.ROUND}문제를 풀어요. 목표: <b>정확도 100%</b>, 문제당 평균 <b>${cat.target[lv - 1]}초</b> 안에!</p>
        ${isF ? '<p class="small muted">답은 기약분수로, 가분수는 대분수로 써요. 대분수는 <b>2 3/4</b>처럼 띄어 써요.</p>' : ''}
        <p class="small muted">답을 쓰고 Enter를 누르면 바로 다음 문제가 나와요. 틀리면 정답을 보여 줄 때는 시계가 멈춰요.</p>
        <div class="btns"><button id="go" class="btn primary">시작! <kbd>Enter</kbd></button><button class="btn" data-go="drill">연산 목록</button></div>
      </section></main>`;
    bindCommon();
    $('#go').addEventListener('click', go);
  }
  function drillRun(cat, lv, list) {
    const probs = list || DR.makeRound(cat, lv, rng);
    const res = [];
    let i = 0, used = 0, t0 = 0, timer = null, tries = 0, waiting = false;
    const now = () => used + (t0 ? performance.now() - t0 : 0);
    const start = () => { if (!t0) t0 = performance.now(); };
    const pause = () => { if (t0) { used += performance.now() - t0; t0 = 0; } };
    app.innerHTML = `${header(statsHtml())}
      <main class="drill">
        <div class="dtop"><button class="back" id="dstop">← 그만하기</button><span class="dname">⚡ ${esc(cat.name)} · ${lv}단계</span><span class="dclock">⏱ <b id="clock">0.0</b>초</span></div>
        <div class="dbar"><span id="bar"></span></div>
        <section class="dcard">
          <p class="dno" id="dno"></p>
          <p class="dq" id="dq"></p>
          <div class="drow"><span class="deq">=</span><input id="din" class="in din" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="답"><button id="dok" class="btn primary">확인 <kbd>Enter</kbd></button></div>
          <div id="dfb" class="dfb" aria-live="polite"></div>
        </section>
      </main>`;
    bindCommon();
    timer = setInterval(() => { const c = $('#clock'); if (!c) { clearInterval(timer); return; } c.textContent = sec(now()); }, 100);
    $('#dstop').addEventListener('click', () => { clearInterval(timer); drillHome(); });
    function show() {
      const p = probs[i];
      M5.currentDrill = p; // 브라우저 자동 테스트에서 쓴다
      tries = 0; waiting = false;
      $('#dno').textContent = `${i + 1} / ${probs.length}`;
      $('#dq').innerHTML = txt(p.text);
      $('#bar').style.width = `${(i / probs.length) * 100}%`;
      $('#din').value = ''; $('#din').disabled = false; $('#din').focus();
      $('#dok').innerHTML = '확인 <kbd>Enter</kbd>';
      $('#dfb').innerHTML = '';
      $('#dfb').className = 'dfb';
      start();
    }
    function next() { i++; if (i >= probs.length) finish(); else show(); }
    function submit() {
      if (waiting === 'auto') return;
      if (waiting) { next(); return; }
      const p = probs[i];
      const g = DR.judge(p, $('#din').value);
      if (g.empty) return;
      if (g.invalid) { $('#dfb').textContent = g.invalid; $('#dfb').className = 'dfb warn'; return; }
      if (g.form) {
        tries++;
        $('#dfb').textContent = g.form === 'reduce' ? '값은 맞아요! 약분해서 기약분수로 써요.' : '값은 맞아요! 가분수를 대분수로 바꿔 써요.';
        $('#dfb').className = 'dfb warn';
        $('#din').select();
        return;
      }
      if (g.ok) {
        res.push({ p, ok: tries === 0, form: tries > 0 });
        $('#dfb').textContent = tries ? '○ 맞았어요 (다음엔 처음부터 기약분수로!)' : '○';
        $('#dfb').className = 'dfb good';
        $('#din').disabled = true;
        waiting = 'auto';
        setTimeout(next, tries ? 700 : 250);
        return;
      }
      pause();
      res.push({ p, ok: false, input: $('#din').value });
      $('#dfb').innerHTML = `✕ 정답: <b>${txt(DR.answerText(p))}</b> · 확인했으면 Enter`;
      $('#dfb').className = 'dfb bad';
      $('#din').disabled = true;
      $('#dok').innerHTML = '다음 <kbd>Enter</kbd>';
      $('#dok').focus();
      waiting = true; // Enter를 누르면 다음 문제 (그때 시계가 다시 가요)
    }
    $('#dok').addEventListener('click', submit);
    onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } };
    function finish() {
      pause();
      clearInterval(timer);
      drillResult(cat, lv, res, used, !!list);
    }
    show();
  }
  function drillResult(cat, lv, res, ms, retryRun) {
    const n = res.length, good = res.filter((x) => x.ok).length;
    const acc = Math.round((good / n) * 100), avg = Number(sec(ms / n)), target = cat.target[lv - 1];
    const pass = acc === 100 && avg <= target;
    const r = drOf(cat.id);
    let msg = '', unlocked = false;
    if (!retryRun) {
      const prevHist = r.hist.filter((h) => h.lv === lv).slice(-4);
      r.hist.push({ at: S.todayStr(), lv, acc, avg });
      if (r.hist.length > 30) r.hist.splice(0, r.hist.length - 30);
      const b = r.best[lv];
      const better = !b || (pass && !b.pass) || (acc > b.acc) || (acc === b.acc && avg < b.avg);
      if (better) r.best[lv] = { acc, avg, pass: pass || (b && b.pass) || false, at: S.todayStr() };
      if (pass && lv === r.open && lv < 3) { r.open = lv + 1; unlocked = true; }
      if (pass) { S.ensureToday(state); state.today.passed++; S.bumpDay(state, 'p'); }
      save();
      const trend = [...prevHist, { avg, acc }].map((h) => `${h.acc === 100 ? '' : `${h.acc}% `}${h.avg}초`).join(' → ');
      msg = prevHist.length ? `<p class="small muted">이 단계 지난 기록: ${trend}</p>` : '';
    }
    const head = retryRun ? `<div class="big-emoji">🔁</div><h2>틀린 문제 다시 풀기: ${good} / ${n}</h2>`
      : pass ? `<div class="stamp"><span>${lv}단계</span><b>통과</b><span>🏆</span></div><h2>정확도 100%, 목표 시간 안! ${unlocked ? `${lv + 1}단계가 열렸어요!` : ''}</h2>`
        : acc < 100 ? `<div class="big-emoji">🎯</div><h2>정확도 ${acc}%. 속도보다 정확하게!</h2><p>틀린 문제를 다시 보고, 천천히 정확하게 풀어 봐요. 정확해지면 속도는 따라와요.</p>`
          : `<div class="big-emoji">💪</div><h2>정확도 100%! 이제 조금만 더 빠르게</h2><p>문제당 평균 ${avg}초 → 목표 ${target}초. ${(avg - target).toFixed(1)}초만 줄이면 통과예요!</p>`;
    const wrong = res.filter((x) => !x.ok);
    const goAgain = () => drillRun(cat, lv);
    const goWrong = () => drillRun(cat, lv, wrong.map((x) => x.p));
    onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); if (wrong.length && !retryRun) goWrong(); else goAgain(); } };
    app.innerHTML = `${header(statsHtml())}
      <main class="center"><section class="panel">
        ${head}
        <div class="result">
          <div><span class="k">정확도</span><b class="${acc === 100 ? 'good' : 'bad'}">${acc}%</b></div>
          <div><span class="k">걸린 시간</span><b>${sec(ms)}초</b></div>
          <div><span class="k">문제당 평균</span><b class="${avg <= target ? 'good' : ''}">${avg}초</b></div>
          <div><span class="k">목표</span><b>${target}초</b></div>
        </div>
        ${msg}
        ${wrong.length ? `<div class="dwrong"><p class="q">✕ 틀린 문제</p><ul>${wrong.map((x) => `<li>${txt(x.p.text)} = <b>${txt(DR.answerText(x.p))}</b>${x.form ? ' <span class="small muted">(기약분수·대분수로 쓰지 않았어요)</span>' : x.input ? ` <span class="small muted">(내 답: ${esc(x.input)})</span>` : ''}</li>`).join('')}</ul></div>` : ''}
        <div class="btns">
          ${wrong.length && !retryRun ? '<button id="wr" class="btn primary">틀린 문제만 다시 <kbd>Enter</kbd></button>' : ''}
          <button id="again" class="btn ${wrong.length && !retryRun ? '' : 'primary'}">새 문제로 다시 ${wrong.length && !retryRun ? '' : '<kbd>Enter</kbd>'}</button>
          <button class="btn" data-go="drill">연산 목록</button>
        </div>
      </section></main>`;
    bindCommon();
    $('#again').addEventListener('click', goAgain);
    if ($('#wr')) $('#wr').addEventListener('click', goWrong);
  }
  // ------------------------------------------------------------------ 오늘의 복습 (기획서 7번)
  function reviewSession() {
    const today = S.todayStr();
    const list = M5.review.dueList(state, today);
    if (!list.length) { home(); return; }
    const results = [];
    const avoid = new Set(state.recent.map((x) => x.key));
    let i = 0;
    step();

    function step() {
      if (i >= list.length) { done(); return; }
      const it = list[i];
      const tpl = M5.templates.find((t) => t.id === it.tid);
      if (!tpl) { delete state.review[it.tid]; save(); i++; step(); return; }
      const p = M5.makeProblem(tpl, Math.max(tpl.levels[0], Math.min(it.level || 1, tpl.levels[1])), rng, avoid);
      avoid.add(p.key);
      state.recent.push({ key: p.key, tid: p.tid, sub: p.sub, styleName: p.styleName, style: p.style });
      if (state.recent.length > 50) state.recent.splice(0, state.recent.length - 50);
      let before = null;
      solve(p, {
        fix: true,
        banner: `<div class="banner rev"><span>📅 오늘의 복습 <b>${i + 1} / ${list.length}</b></span><span class="tag">${M5.review.stageName(it.stage)}</span><span class="goal">${esc(typeName(it.tid))}</span></div>`,
        nextLabel: i === list.length - 1 ? '복습 결과 보기 →' : '다음 복습 →',
        onFirst(ok) {
          before = { review: state.review[p.tid] ? Object.assign({}, state.review[p.tid]) : null, mastered: state.mastered[p.tid] };
          recordFirst(p, ok);
          const res = M5.review.answered(state, p.tid, ok, today);
          results.push({ tid: p.tid, ok, res });
          save();
          if (res.mastered) toast('⭐ 3번 연속 맞혔어요! 이 유형은 완전히 익혔어요.');
        },
        onDone() { i++; step(); },
        onWeird(r) {
          reportProblem(p);
          if (r.firstOk != null) {
            // 채점에서 빼고, 복습 일정도 풀기 전으로 되돌린다 (다음에 다시 나온다)
            recordFirst(p, r.firstOk, -1);
            results.pop();
            if (before) { if (before.review) state.review[p.tid] = before.review; else delete state.review[p.tid]; if (before.mastered) state.mastered[p.tid] = before.mastered; else delete state.mastered[p.tid]; }
            save();
          }
          i++; step();
        },
        onStop: done,
        onBack: home,
        backLabel: '← 홈',
      });
    }

    function done() {
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); home(); } };
      const ok = results.filter((r) => r.ok);
      const mastered = results.filter((r) => r.res.mastered);
      const again = results.filter((r) => !r.ok);
      const li = (arr, f) => arr.map((r) => `<li>${esc(typeName(r.tid))}${f ? ` <span class="muted small">${f(r)}</span>` : ''}</li>`).join('');
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">${again.length ? '📅' : '🎉'}</div>
          <h2>오늘의 복습 끝!</h2>
          <p>${results.length}개 중 <b>${ok.length}개</b>를 처음에 맞혔어요.</p>
          ${mastered.length ? `<div class="typelist"><b>⭐ 완전히 익힌 유형</b><ul>${li(mastered)}</ul></div>` : ''}
          ${ok.length - mastered.length > 0 ? `<div class="typelist"><b>👍 맞힌 유형 (다음 복습)</b><ul>${li(ok.filter((r) => !r.res.mastered), (r) => fmtDate(r.res.next))}</ul></div>` : ''}
          ${again.length ? `<div class="typelist"><b>🌱 내일 다시 복습할 유형</b><ul>${li(again)}</ul></div>` : ''}
          <div class="btns"><button class="btn primary" data-go="home">홈으로 <kbd>Enter</kbd></button></div>
        </section></main>`;
      bindCommon();
    }
  }

  // ------------------------------------------------------------------ "다음에 다시 도전" 목록
  function retryList() {
    onKey = null;
    app.innerHTML = `${header()}
      <main class="subs">
        <button class="back" data-go="home">← 홈</button>
        <h2>🌱 다음에 다시 도전</h2>
        <p class="lead">비슷한 문제 도전을 두 번 해도 어려웠던 유형이에요. '도전하기'를 눌러 비슷한 문제 5개에 다시 도전해 봐요. 통과하면 목록에서 빠져요.</p>
        ${state.retry.length
          ? `<ol class="reports">${state.retry.map((r) => `<li class="retry-item"><div><b>${esc(typeName(r.tid))}</b><div class="when">${esc(fmtDate(r.at))}에 넣음 · 난이도 ${r.level}</div></div><button class="btn primary small-btn" data-retry="${esc(r.tid)}">도전하기</button></li>`).join('')}</ol>`
          : '<p class="muted">아직 없어요. 잘하고 있어요! 👍</p>'}
      </main>`;
    bindCommon();
    $$('[data-retry]').forEach((b) => b.addEventListener('click', () => {
      const r = state.retry.find((x) => x.tid === b.dataset.retry);
      const t = M5.templates.find((x) => x.id === b.dataset.retry);
      if (r && t) play({ unit: t.unit, sub: t.sub }, { retryTid: t.id });
    }));
  }

  // ------------------------------------------------------------------ "문제가 이상해요" 목록
  function reports() {
    onKey = null;
    const list = state.reports.slice().reverse();
    app.innerHTML = `${header()}
      <main class="subs">
        <button class="back" data-go="settings">← 설정</button>
        <h2>🚩 '문제가 이상해요'로 저장한 문제</h2>
        <p class="lead">어른이 확인할 수 있게 저장해 둔 문제예요. 이 문제들은 채점에서 빠졌어요.</p>
        ${list.length ? `<ol class="reports">${list.map((r) => `<li><div class="when">${esc(new Date(r.at).toLocaleString('ko-KR'))} · ${esc(r.tid)} · 난이도 ${r.level}</div><p>${txt(r.text)}</p><p class="muted">앱이 생각한 정답: ${txt(r.answer)}</p></li>`).join('')}</ol>
          <button id="clear" class="btn">목록 모두 지우기</button>` : '<p class="muted">저장한 문제가 없어요.</p>'}
      </main>`;
    bindCommon();
    const c = $('#clear');
    // 확인 창(confirm) 대신 두 번 누르게 한다 (링크로 연 페이지에서는 확인 창이 뜨지 않는다)
    if (c) c.addEventListener('click', () => {
      if (c.dataset.sure) { state.reports = []; save(); reports(); return; }
      c.dataset.sure = '1';
      c.textContent = '정말 지울까요? 한 번 더 누르면 지워져요';
      c.classList.add('danger');
    });
  }

  // ------------------------------------------------------------------ 내 기록 (기획서 13번 7)
  function records() {
    onKey = null;
    const unitStats = UNITS.filter((u) => M5.units.some((x) => x.id === u.id)).map((u) => ({ u, s: state.stats['u' + u.id] || { s: 0, c: 0 } }));
    const total = unitStats.reduce((a, x) => a + x.s.s, 0), totalC = unitStats.reduce((a, x) => a + x.s.c, 0);
    const pct = (c, n2) => (n2 ? Math.round((c / n2) * 100) : 0);
    // 최근 14일
    const today = S.todayStr();
    const days = Array.from({ length: 14 }, (_, k) => M5.review.addDays(today, k - 13));
    const vals = days.map((d) => (state.days[d] ? state.days[d].s : 0));
    const peak = Math.max(...vals, 1);
    const step = [1, 2, 5, 10, 20, 50, 100].find((x) => peak / x <= 8) || 100;
    const chart = vals.some((v) => v > 0)
      ? F.render({ type: 'bars', title: `최근 14일 동안 푼 문제 (${fmtDate(days[0])} ~ ${fmtDate(days[13])})`, unit: '문제', labels: days.map((d) => String(Number(d.slice(8)))), values: vals, step, max: Math.ceil(peak / step) * step, labelEvery: 1 })
      : '<p class="muted">아직 기록이 없어요. 문제를 풀면 여기에 날마다 쌓여요.</p>';
    // 자주 틀리는 유형 TOP 3
    const top = Object.entries(state.wrong).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    // 틀린 원인 비율
    const causeKeys = ['condition', 'concept', 'calc', 'form'];
    const causeTotal = causeKeys.reduce((a, k) => a + (state.causes.actual[k] || 0), 0);
    const c = state.causes;
    const meter = (v) => `<span class="meter"><span style="width:${v}%"></span></span>`;
    const stamps = Object.entries(state.stamps).sort((a, b) => (a[1].last < b[1].last ? 1 : -1));
    const mastered = Object.entries(state.mastered).sort((a, b) => (a[1] < b[1] ? 1 : -1));
    const reviewList = Object.values(state.review).sort((a, b) => (a.due < b.due ? -1 : 1));
    app.innerHTML = `${header(NAV)}
      <main class="records">
        <button class="back" data-go="home">← 홈</button>
        <h2>📊 내 기록</h2>
        <section class="today">
          <div><span class="k">지금까지 푼 문제</span><b>${total}</b></div>
          <div><span class="k">처음에 맞힌 비율</span><b>${pct(totalC, total)}%</b></div>
          <div><span class="k">받은 도장</span><b>🏅 ${stamps.length}</b></div>
          <div><span class="k">완전히 익힌 유형</span><b>⭐ ${mastered.length}</b></div>
        </section>
        <section class="rcard"><h3>날마다 푼 문제</h3><div class="figure">${chart}</div></section>
        <div class="rgrid">
          <section class="rcard">
            <h3>단원별 정답률</h3>
            ${unitStats.map(({ u, s: st }) => {
              const sub = M5.units.find((x) => x.id === u.id).subs;
              return `<details class="unit-rate"><summary><span class="ur-name">${u.id}. ${esc(u.name)}</span>${meter(pct(st.c, st.s))}<b>${st.s ? pct(st.c, st.s) + '%' : '-'}</b><span class="muted small">${st.s}문제</span></summary>
                <ul>${sub.map((x) => { const v = state.stats[x.id] || { s: 0, c: 0 }; return `<li><span class="ur-name">${esc(x.name)}</span>${meter(pct(v.c, v.s))}<b>${v.s ? pct(v.c, v.s) + '%' : '-'}</b><span class="muted small">${v.s}문제</span></li>`; }).join('')}</ul></details>`;
            }).join('')}
            <p class="muted small">단원 이름을 누르면 소단원별 정답률이 나와요. 정답률은 처음 낸 답으로 세어요.</p>
          </section>
          <section class="rcard">
            <h3>자주 틀리는 유형 TOP 3</h3>
            ${top.length ? `<ol class="top3">${top.map(([tid, n2]) => `<li><b>${esc(typeName(tid))}</b> <span class="muted">${n2}번 틀림</span>${state.review[tid] ? ` <span class="pill">복습 ${fmtDate(state.review[tid].due)}</span>` : state.mastered[tid] ? ' <span class="pill ok">완전히 익힘</span>' : ''}</li>`).join('')}</ol>` : '<p class="muted">아직 틀린 유형이 없어요.</p>'}
            <h3>틀린 원인</h3>
            ${causeTotal ? `<ul class="causes">${causeKeys.map((k) => `<li><span class="ur-name">${CAUSE[k]}</span>${meter(pct(c.actual[k] || 0, causeTotal))}<b>${pct(c.actual[k] || 0, causeTotal)}%</b><span class="muted small">${c.actual[k] || 0}번</span></li>`).join('')}</ul>` : '<p class="muted">아직 기록이 없어요.</p>'}
            ${c.compared ? `<p class="small">🔍 "어디서 틀렸을까?"에서 원인을 스스로 맞힌 비율: <b>${pct(c.matched, c.compared)}%</b> (${c.compared}번 중 ${c.matched}번)</p>` : ''}
            <p class="muted small">'약분·표현 미완성'은 값은 맞았는데 약분이나 대분수 표현을 덜 한 횟수예요.</p>
          </section>
        </div>
        <div class="rgrid">
          <section class="rcard">
            <h3>📅 복습 예정 (${reviewList.length})</h3>
            ${reviewList.length ? `<ul class="plain">${reviewList.slice(0, 8).map((x) => `<li>${esc(fmtDate(x.due))} · ${esc(typeName(x.tid))} <span class="muted small">(${M5.review.stageName(x.stage)})</span></li>`).join('')}</ul>${reviewList.length > 8 ? `<p class="muted small">외 ${reviewList.length - 8}개</p>` : ''}` : '<p class="muted">복습할 유형이 없어요.</p>'}
            <h3>⭐ 완전히 익힌 유형 (${mastered.length})</h3>
            ${mastered.length ? `<ul class="plain">${mastered.map(([tid, d]) => `<li>${esc(typeName(tid))} <span class="muted small">${esc(fmtDate(d))}</span></li>`).join('')}</ul>` : '<p class="muted">복습에서 3번 연속 맞히면 여기에 들어와요.</p>'}
          </section>
          <section class="rcard">
            <h3>🏅 받은 도장 (${stamps.length})</h3>
            ${stamps.length ? `<div class="stamps">${stamps.map(([tid, v]) => `<span class="mini-stamp" title="${esc(fmtDate(v.last))}">🏅 ${esc(typeName(tid))}${v.n > 1 ? ` ×${v.n}` : ''}</span>`).join('')}</div>` : '<p class="muted">비슷한 문제 5개 중 4개 이상 맞히면 도장을 받아요.</p>'}
          </section>
        </div>
      </main>`;
    bindCommon();
  }

  // ------------------------------------------------------------------ 설정 (기획서 13번 8)
  let persisted = null;
  function settings() {
    onKey = null;
    const last = state.settings.lastBackup;
    app.innerHTML = `${header(NAV)}
      <main class="records">
        <button class="back" data-go="home">← 홈</button>
        <h2>⚙️ 설정</h2>
        <section class="rcard">
          <h3>💾 백업</h3>
          <p>기록은 이 노트북의 이 브라우저 안에만 저장돼요. 브라우저 기록을 지우거나 다른 노트북으로 옮길 때를 대비해 가끔 백업 파일을 내보내 두세요.</p>
          <p class="muted small">마지막 백업: ${last ? esc(new Date(last).toLocaleString('ko-KR')) : '아직 없어요'}${persisted === true ? ' · 브라우저에 계속 보관하도록 요청했어요' : ''}</p>
          <div class="btns left"><button id="export" class="btn primary">백업 파일 내보내기</button></div>
          <h3>📂 백업 불러오기</h3>
          <p class="small">내보낸 백업 파일(.json)을 골라요. 불러오면 지금 기록이 그 파일의 기록으로 바뀌어요.</p>
          <input id="importFile" type="file" accept=".json,application/json">
          <div id="importBox"></div>
        </section>
        <section class="rcard">
          <h3>💻 바탕화면 아이콘</h3>
          <p class="small">한 번 설치하면 바탕화면 아이콘을 두 번 눌러 주소창 없는 앱 창으로 바로 열려요. 인터넷이 없어도 열려요.</p>
          <div class="install-slot" data-where="settings"></div>
        </section>
        <section class="rcard">
          <h3>🛡️ 기록이 사라지지 않게</h3>
          <ul class="tips small">
            <li>항상 <b>같은 노트북, 같은 브라우저, 같은 아이콘(주소)</b>으로 열어요. 크롬에서 푼 기록은 엣지에서 보이지 않아요.</li>
            <li><b>시크릿 창(InPrivate)</b>에서는 창을 닫으면 기록이 지워져요.</li>
            <li>브라우저의 "인터넷 사용 기록 삭제"를 할 때 <b>"쿠키 및 기타 사이트 데이터"</b>의 체크를 꼭 빼요.</li>
            <li>한 달에 한 번 위의 <b>백업 파일 내보내기</b>를 눌러 파일을 USB나 클라우드(구글 드라이브 등)에 옮겨 두면 가장 안전해요.</li>
          </ul>
        </section>
        <section class="rcard">
          <h3>🚩 '문제가 이상해요'로 저장한 문제</h3>
          <p class="small">저장한 문제 ${state.reports.length}개. 어른이 확인할 수 있게 모아 두었어요.</p>
          <div class="btns left"><button class="btn" data-go="reports">목록 보기</button></div>
        </section>
        <section class="rcard danger-zone">
          <h3>🗑️ 기록 모두 지우기</h3>
          <p class="small">푼 문제, 정답률, 도장, 복습 일정이 모두 지워져요. 지우기 전에 백업 파일을 내보내 두세요.</p>
          <div class="btns left"><button id="wipe" class="btn">기록 모두 지우기</button></div>
        </section>
      </main>`;
    bindCommon();
    paintInstall();
    $('#export').addEventListener('click', () => {
      state.settings.lastBackup = new Date().toISOString();
      save();
      const blob = new Blob([S.exportText(state)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `math5-backup-${S.todayStr()}.json`; // 한글 이름은 브라우저에 따라 "download"로 바뀌어서 영어로
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast(`백업 파일(math5-backup-${S.todayStr()}.json)을 내보냈어요. 다운로드 폴더를 확인해 보세요.`);
      settings();
    });
    $('#importFile').addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      const box = $('#importBox');
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        let got;
        try { got = S.importText(String(rd.result)); } catch (e) { box.innerHTML = `<p class="warn-box">${esc(e.message)}</p>`; return; }
        const sm = S.summary(got.state);
        box.innerHTML = `<div class="import-sum"><p><b>${esc(f.name)}</b>${got.exportedAt ? ` (${esc(new Date(got.exportedAt).toLocaleString('ko-KR'))}에 내보냄)` : ''}</p>
          <p class="small">푼 문제 ${sm.solved}개 · 공부한 날 ${sm.days}일 · 도장 ${sm.stamps}개 · 완전히 익힌 유형 ${sm.mastered}개 · 복습 예정 ${sm.review}개</p>
          <button id="doImport" class="btn primary">이 기록으로 바꾸기</button></div>`;
        const b = $('#doImport');
        b.addEventListener('click', () => {
          if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '지금 기록이 바뀌어요. 한 번 더 누르면 불러와요'; b.classList.add('danger'); return; }
          for (const k of Object.keys(state)) delete state[k];
          Object.assign(state, got.state);
          save();
          toast('백업을 불러왔어요.');
          home();
        });
      };
      rd.readAsText(f);
    });
    const w = $('#wipe');
    w.addEventListener('click', () => {
      if (!w.dataset.sure) { w.dataset.sure = '1'; w.textContent = '정말 지울까요? 한 번 더 누르면 모두 지워져요'; w.classList.add('danger'); return; }
      const keepMode = state.settings.mode;
      for (const k of Object.keys(state)) delete state[k];
      Object.assign(state, S.fresh());
      state.settings.mode = keepMode;
      S.ensureToday(state);
      save();
      toast('기록을 모두 지웠어요.');
      home();
    });
  }

  // ------------------------------------------------------------------ 문제집 오답 연습 (사진으로 받은 문제)
  const HW = M5.hw;
  function hwCount() {
    const today = S.todayStr();
    const due = HW.dueSets(state, today).length;
    let fresh = 0, prog = 0;
    for (const h of M5.homework) {
      const s = state.hw && state.hw[h.id];
      if (!s || s.status === 'new') fresh++;
      else if (s.status === 'practice') prog++;
    }
    return { fresh, prog, due, all: M5.homework.length };
  }
  function hwCard() {
    if (!M5.homework.length) return '';
    const c = hwCount();
    const bits = [c.fresh ? `새 문제 <b>${c.fresh}개</b>` : '', c.prog ? `연습 중 <b>${c.prog}개</b>` : '', c.due ? `오늘 다시 확인 <b>${c.due}개</b>` : ''].filter(Boolean);
    const busy = c.fresh || c.prog || c.due;
    return `<section class="hw-card ${busy ? 'has' : ''}">
      <div><h2>📸 문제집 오답 연습</h2><p>${busy ? bits.join(' · ') : '보낸 문제를 모두 알고 넘어갔어요! 👏'}</p></div>
      <button class="btn ${busy ? 'primary' : ''}" data-go="hw">${busy ? '연습하러 가기' : '목록 보기'}</button>
    </section>`;
  }
  const hwBack = () => hwList();
  function hwStatus(h, dueIds) {
    const s = state.hw && state.hw[h.id];
    if (dueIds.has(h.id)) return { cls: 'due', text: '📅 오늘 다시 확인해요', btn: '다시 확인하기' };
    if (!s || s.status === 'new') return { cls: 'new', text: '새 문제', btn: '시작하기' };
    if (s.status === 'practice') return { cls: 'prog', text: `연습 중 · 연속 정답 ${s.streak} / ${HW.GOAL}`, btn: '이어서 연습' };
    if (s.mastered) return { cls: 'mast', text: '⭐ 완전히 알아요', btn: '다시 보기' };
    return { cls: 'done', text: `✅ 알고 넘어감${s.due ? ` · ${fmtDate(s.due)}에 다시 확인` : ''}`, btn: '다시 보기' };
  }
  function hwList() {
    onKey = null;
    const today = S.todayStr();
    const dueIds = new Set(HW.dueSets(state, today).map((h) => h.id));
    const rank = { due: 0, prog: 1, new: 2, done: 3, mast: 4 };
    const list = M5.homework.map((h) => ({ h, st: hwStatus(h, dueIds) }))
      .sort((a, b) => rank[a.st.cls] - rank[b.st.cls] || (a.h.date < b.h.date ? 1 : a.h.date > b.h.date ? -1 : 0));
    app.innerHTML = `${header(NAV)}
      <main class="subs">
        <button class="back" data-go="home">← 홈</button>
        <h2>📸 문제집 오답 연습</h2>
        <p class="lead">문제집에서 틀렸거나 모르는 문제를 사진으로 보내면 여기에 생겨요.<br>왜 틀렸는지 알아보고, 같은 유형 문제를 <b>${HW.GOAL}번 연속</b> 맞힐 때까지 연습해요. 그 뒤에도 1일·7일·30일 뒤에 다시 확인해요.</p>
        ${list.length ? `<ol class="hwlist">${list.map(({ h, st }) => `<li class="hw-item">
            <div class="hw-main">
              <div class="hw-tags"><span class="tag k-${h.kind}">${HW.KINDS[h.kind]}</span><span class="tag">${esc(M5.findSub(h.sub).sub.name)}</span><span class="hw-st ${st.cls}">${st.text}</span></div>
              <b>${esc(h.source)}</b>
              ${h.title ? `<p class="small muted">${esc(h.title)}</p>` : ''}
            </div>
            <button class="btn ${st.cls === 'done' || st.cls === 'mast' ? '' : 'primary'} small-btn" data-hw="${esc(h.id)}">${st.btn}</button>
          </li>`).join('')}</ol>` : '<p class="muted">아직 없어요. 문제집 사진을 보내면 여기에 생겨요.</p>'}
        <details class="concept parent"><summary>👪 부모님께: 사진 보내는 방법</summary><p>1. 아이가 틀렸거나 모르는 문제를 사진으로 찍어요. 문제 번호, 그림, 아이가 쓴 답(또는 풀이 흔적)이 보이게 찍어 주세요.<br>2. 이 앱을 만든 Claude Code 대화에 사진을 올리고 "오답 세트 만들어 줘"라고 써 주세요. 틀린 문제인지 모르는 문제인지, 아이가 쓴 답이 무엇인지 적어 주면 더 정확해요.<br>3. Claude가 문제를 읽고, 왜 틀렸는지·풀이·같은 유형 연습 문제를 앱에 넣어요. 몇 분 뒤 인터넷이 연결된 상태로 앱을 다시 열면 여기에 생겨요.<br>사진 자체는 앱에 올라가지 않아요. 문제를 글과 그림으로 옮겨 적어요.</p></details>
      </main>`;
    bindCommon();
    $$('[data-hw]').forEach((b) => b.addEventListener('click', () => hwOpen(M5.homework.find((h) => h.id === b.dataset.hw))));
  }
  function hwOpen(h) {
    const today = S.todayStr();
    const s = HW.stateOf(state, h.id);
    if (HW.dueSets(state, today).some((x) => x.id === h.id)) { hwCheck(h); return; }
    if (s.status === 'practice') { hwExplain(h, null, true); return; }
    hwIntro(h);
  }
  const hwBanner = (h, right) => `<div class="banner hw"><span>📸 ${esc(h.source)}</span>${right ? `<span class="goal">${right}</span>` : ''}</div>`;
  function hwProblemHtml(h) {
    return `<div class="hw-prob"><p class="qtext">${txt(h.problem.text)}</p>${h.problem.figure ? `<div class="figure">${F.render(h.problem.figure)}</div>` : ''}</div>`;
  }
  // 1) 틀린 문제: 먼저 한 번 더 풀어 보기 / 모르는 문제: 바로 풀이
  function hwIntro(h) {
    if (h.kind === 'unknown') { hwExplain(h, null); return; }
    onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } };
    app.innerHTML = `${header(statsHtml())}
      <main class="center"><section class="panel hw-panel">
        <div class="big-emoji">📸</div>
        <h2>${esc(h.source)}</h2>
        <p>문제집에서 틀렸던 문제예요. ${h.childAnswer ? `그때 쓴 답은 <b>${txt(h.childAnswer)}</b>였어요.<br>먼저 <b>한 번 더 풀어 볼까요?</b> 그다음에 왜 틀렸는지 같이 봐요.` : '<br>그때 쓴 답이 문제집에 남아 있지 않아요. <b>여기서 다시 풀어 보면</b> 낸 답을 보고 왜 틀렸는지 찾아 줄게요.'}</p>
        <div class="btns"><button class="btn" data-go="hw">← 오답 목록</button><button id="go" class="btn primary">다시 풀어 보기 <kbd>Enter</kbd></button></div>
      </section></main>`;
    bindCommon();
    $('#go').addEventListener('click', go);
    function go() {
      const p = HW.original(h);
      solve(p, {
        fix: false,
        banner: hwBanner(h, '다시 풀어 보기'),
        backLabel: '← 오답 목록',
        nextLabel: '왜 틀렸는지 보기 →',
        wrongMsg: '<p class="no">이번에도 정답과 달라요. 괜찮아요! 왜 틀렸는지 같이 봐요.</p>',
        onFirst() {},
        onDone(r) { hwExplain(h, r.firstOk, false, r); },
        onWeird() { reportProblem(p); hwExplain(h, null); },
        onStop: hwBack,
        onBack: hwBack,
      });
    }
  }
  // 2) 왜 틀렸는지 + 풀이 (한 단계씩)
  function hwExplain(h, retryOk, resume, retry) {
    const info = M5.findSub(h.sub);
    const steps = h.solution;
    let shown = resume ? steps.length : 1;
    const d = h.diagnosis;
    const ansText = G.answerText(HW.original(h));
    app.innerHTML = `${header(statsHtml())}
      <main class="hw-explain">
        <button class="back" data-go="hw">← 오답 목록</button>
        <section class="qcard">
          ${hwBanner(h, HW.KINDS[h.kind])}
          ${hwProblemHtml(h)}
          <p class="hw-ans">${h.kind === 'wrong' && h.childAnswer ? `<span>그때 쓴 답 <b class="bad">${txt(h.childAnswer)}</b></span>` : ''}<span>정답 <b class="good">${txt(ansText)}</b></span></p>
        </section>
        <section class="acard">
          ${retryOk === true ? '<p class="good-box">다시 풀 때는 맞혔어요! 👍 같은 유형을 연습해서 확실히 알고 넘어가요.</p>' : ''}
          ${hwWhy(h, d, retryOk, retry)}
          <ol class="hw-steps">${steps.map((x, i) => `<li class="${i < shown ? '' : 'hid'}">${txt(x)}</li>`).join('')}</ol>
          <div class="btns left"><button id="more" class="btn" ${shown >= steps.length ? 'hidden' : ''}>다음 단계 보기 ▶</button><button id="go" class="btn primary" ${shown >= steps.length ? '' : 'hidden'}>${resume ? '이어서 연습하기' : '같은 유형 문제 연습하기'} <kbd>Enter</kbd></button></div>
          <details class="concept"><summary>📘 개념 다시 보기</summary><p>${txt(info.sub.concept)}</p></details>
        </section>
      </main>`;
    bindCommon();
    const more = () => {
      shown++;
      $$('.hw-steps li').forEach((li, i) => li.classList.toggle('hid', i >= shown));
      if (shown >= steps.length) { $('#more').hidden = true; $('#go').hidden = false; $('#go').focus(); }
    };
    $('#more').addEventListener('click', more);
    $('#go').addEventListener('click', () => hwPractice(h));
    onKey = (ev) => {
      if (ev.key !== 'Enter' || (ev.target && ev.target.tagName === 'SUMMARY')) return;
      ev.preventDefault();
      if (shown < steps.length) more(); else hwPractice(h);
    };
  }
  // 왜 틀렸을까: 사진 속 답으로 찾은 원인 / 다시 풀 때 낸 답으로 찾은 원인 / 자주 하는 실수
  function hwWhy(h, d, retryOk, retry) {
    if (h.kind !== 'wrong') return '<div class="hw-why"><p class="q">📘 같이 풀어 봐요</p><p>한 단계씩 읽어 보고, 이해가 되면 다음 단계를 열어요.</p></div>';
    const one = (x, lead = '') => `<div class="hw-why"><p class="q">🔍 왜 틀렸을까?</p>${lead}<p class="cause"><span class="badge">${esc(CAUSE[x.cause])}</span> <b>${txt(x.title || '')}</b></p><p>${txt(x.msg)}</p></div>`;
    if (d) return one(d);
    const pt = retry && retry.firstRes && retry.firstRes.pattern;
    const raw = retry && retry.firstInput != null && !retryOk ? String(retry.firstInput).trim() : '';
    const mine = raw ? `<b class="bad">${esc(raw)}</b>` : '';
    const josa = (pair) => T.j(raw, pair).slice(raw.length);
    if (pt) return one(pt, `<p>방금 낸 답 ${mine}${josa('을/를')} 보니 이런 실수를 한 것 같아요.</p>`);
    const list = (h.mistakes || []).map((m) => `<li><span class="badge">${esc(CAUSE[m.cause])}</span> <b>${txt(m.title)}</b><br><span class="small">${txt(m.msg)}</span></li>`).join('');
    const lead = retryOk === true ? '이번에는 맞혔어요. 그때는 아래 실수 중 하나였을 수 있어요.' : mine ? `방금 낸 답 ${mine}${josa('은/는')} 흔한 실수와 달라요. 아래 실수 중 비슷한 게 있는지 풀이와 비교해 봐요.` : '이 문제에서 자주 하는 실수예요. 내가 어디서 틀렸는지 생각해 봐요.';
    return `<div class="hw-why"><p class="q">🔍 왜 틀렸을까?</p><p>${lead}</p><ul class="hw-mist">${list}</ul></div>`;
  }

  // 3) 같은 유형 연습: 처음에 맞힌 문제가 GOAL번 연속이면 완료
  function hwPractice(h) {
    const s = HW.stateOf(state, h.id);
    if (s.status !== 'practice') { s.status = 'practice'; s.streak = 0; }
    save();
    const maker = HW.practiceMaker(h, rng, state.recent.map((x) => x.key));
    next();
    function next() {
      const p = maker.next();
      if (!String(p.tid).startsWith('hw:')) {
        state.recent.push({ key: p.key, tid: p.tid, sub: p.sub, styleName: p.styleName, style: p.style });
        if (state.recent.length > 50) state.recent.splice(0, state.recent.length - 50);
      }
      let first = null;
      solve(p, {
        fix: true,
        banner: hwBanner(h, `연속 정답 <b>${s.streak} / ${HW.GOAL}</b>`),
        backLabel: '← 오답 목록',
        onFirst(ok) {
          first = ok;
          s.solved++;
          if (ok) { s.correct++; s.streak++; s.best = Math.max(s.best || 0, s.streak); } else s.streak = 0;
          recordFirst(p, ok);
          save();
          if (ok && s.streak < HW.GOAL) toast(`연속 정답 ${s.streak} / ${HW.GOAL}! ${s.streak === HW.GOAL - 1 ? '하나만 더!' : ''}`);
        },
        onDone() { if (s.streak >= HW.GOAL) done(); else next(); },
        onWeird(r) {
          reportProblem(p);
          if (r.firstOk != null && first != null) {
            recordFirst(p, r.firstOk, -1);
            s.solved--; if (r.firstOk) { s.correct--; s.streak = Math.max(0, s.streak - 1); }
            save();
          }
          next();
        },
        onStop: hwBack,
        onBack: hwBack,
      });
    }
    function done() {
      const today = S.todayStr();
      Object.assign(s, { status: 'done', doneAt: today, stage: 0, due: M5.review.addDays(today, M5.review.DAYS[0]), streak: 0 });
      S.ensureToday(state);
      state.today.passed++;
      S.bumpDay(state, 'p');
      save();
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); hwList(); } };
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">🎉</div>
          <h2>알고 넘어갔어요!</h2>
          <p><b>${esc(h.source)}</b>와 같은 유형을 ${HW.GOAL}번 연속 맞혔어요.</p>
          <p class="muted">잊지 않게 내일, 7일 뒤, 30일 뒤에 문제 2개씩 다시 확인해요.</p>
          <p>더 단단하게 하고 싶으면 같은 소단원을 <b>📘 기본 → 응용 → 심화</b>로 연습해 봐요.</p>
          <div class="btns"><button class="btn" data-go="hw">오답 목록</button><button id="lad" class="btn primary">📘 이 소단원 연습하기 <kbd>Enter</kbd></button></div>
        </section></main>`;
      bindCommon();
      const goPractice = () => play({ unit: M5.findSub(h.sub).unit.id, sub: h.sub }, { mode: 'basic' });
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); goPractice(); } };
      $('#lad').addEventListener('click', goPractice);
    }
  }
  // 4) 다시 확인 (1일·7일·30일): 2문제 모두 처음에 맞히면 다음 단계, 하나라도 틀리면 다시 연습
  function hwCheck(h) {
    const s = HW.stateOf(state, h.id);
    const maker = HW.practiceMaker(h, rng, state.recent.map((x) => x.key));
    const N = 2;
    const res = [];
    step();
    function step() {
      if (res.length >= N) { finish(); return; }
      const p = maker.next();
      solve(p, {
        fix: true,
        banner: hwBanner(h, `📅 다시 확인 <b>${res.length + 1} / ${N}</b>`),
        backLabel: '← 오답 목록',
        nextLabel: res.length === N - 1 ? '결과 보기 →' : '다음 문제 →',
        onFirst(ok) { res.push(ok); recordFirst(p, ok); },
        onDone() { step(); },
        onWeird(r) { reportProblem(p); if (r.firstOk != null) { res.pop(); recordFirst(p, r.firstOk, -1); } step(); },
        onStop: hwBack,
        onBack: hwBack,
      });
    }
    function finish() {
      const today = S.todayStr();
      const ok = res.every(Boolean);
      let msg;
      if (ok) {
        s.stage++;
        if (s.stage >= M5.review.DAYS.length) { s.mastered = today; s.due = ''; msg = '⭐ 30일 뒤까지 잊지 않았어요. 이제 완전히 알아요!'; }
        else {
          const want = M5.review.addDays(s.doneAt || today, M5.review.DAYS[s.stage]);
          const tomorrow = M5.review.addDays(today, 1);
          s.due = want > tomorrow ? want : tomorrow;
          msg = `잘 기억하고 있어요! 다음 확인은 ${fmtDate(s.due)}이에요.`;
        }
      } else {
        Object.assign(s, { status: 'practice', streak: 0, due: '', stage: 0 });
        msg = '조금 헷갈렸네요. 같은 유형을 다시 연습해서 확실히 알아 봐요.';
      }
      save();
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">${ok ? '👏' : '🌱'}</div>
          <h2>${esc(h.source)} 다시 확인</h2>
          <p>${res.filter(Boolean).length} / ${N} 맞혔어요. ${msg}</p>
          <div class="btns"><button class="btn" data-go="hw">오답 목록</button>${ok ? '' : '<button id="go" class="btn primary">다시 연습하기</button>'}</div>
        </section></main>`;
      bindCommon();
      if (!ok) $('#go').addEventListener('click', () => hwExplain(h, null, true));
    }
  }

  S.askPersist().then((v) => { persisted = v === true; });
  home();
})();
