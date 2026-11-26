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
  const txt = (s) => esc(s).replace(/\n/g, '<br>');
  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => [...app.querySelectorAll(sel)];

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
    { id: 3, name: '합동과 대칭', note: '2차 개발' },
    { id: 4, name: '소수의 곱셈', note: '곧 만들어요' },
    { id: 5, name: '직육면체와 정육면체', note: '2차 개발' },
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
  function bindCommon() {
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const go = b.dataset.go;
      if (go === 'home') home();
      else if (go === 'reports') reports();
      else if (go === 'retry') retryList();
    }));
  }
  function statsHtml() {
    const t = state.today;
    return `<div class="stats">
      <span>오늘 푼 문제 <b>${t.solved}</b></span>
      <span>맞힌 문제 <b>${t.correct}</b></span>
      <span>연속 정답 <b>🔥 ${t.streak}</b></span>
      <span>통과한 유형 <b>🏅 ${t.passed}</b></span>
    </div>`;
  }

  // ------------------------------------------------------------------ 홈
  function home() {
    S.ensureToday(state);
    onKey = null;
    const t = state.today;
    const rate = t.solved ? Math.round((t.correct / t.solved) * 100) : 0;
    const stampCount = Object.keys(state.stamps).length;
    app.innerHTML = `${header()}
      <main class="home">
        <section class="today">
          <div><span class="k">오늘 푼 문제</span><b>${t.solved}</b></div>
          <div><span class="k">처음에 맞힌 문제</span><b>${t.correct}</b></div>
          <div><span class="k">정답률</span><b>${rate}%</b></div>
          <div><span class="k">오늘 통과한 유형</span><b>🏅 ${t.passed}</b></div>
        </section>
        <section class="minis">
          <button class="mini" data-go="retry"><span class="k">다음에 다시 도전</span><b>${state.retry.length}개</b></button>
          <div class="mini"><span class="k">지금까지 받은 도장</span><b>🏅 ${stampCount}개 유형</b></div>
        </section>
        <h2>단원을 골라요</h2>
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
        <p class="foot"><button class="link" data-go="reports">🚩 '문제가 이상해요'로 저장한 문제 (${state.reports.length})</button></p>
      </main>`;
    bindCommon();
    $$('.unit:not([disabled])').forEach((b) => b.addEventListener('click', () => subs(Number(b.dataset.unit))));
  }

  // ------------------------------------------------------------------ 소단원 고르기
  function subs(unitId) {
    onKey = null;
    const u = M5.units.find((x) => x.id === unitId);
    const lvOf = (k) => state.levels[k] || 1;
    const card = (key, name, desc) => {
      const r = rateOf(key);
      return `<button class="sub" data-sub="${key}">
        <span class="nm">${esc(name)}</span>
        <span class="meta"><span class="stars" title="난이도">${stars(lvOf(key))}</span> ${r == null ? '' : `정답률 ${r}%`}</span>
        ${desc ? `<span class="desc">${esc(desc)}</span>` : ''}
      </button>`;
    };
    app.innerHTML = `${header()}
      <main class="subs">
        <button class="back" data-go="home">← 단원 목록</button>
        <h2>${u.id}단원 ${esc(u.name)}</h2>
        <p class="lead">소단원을 고르면 문제가 끝없이 나와요. 그만 풀고 싶을 때 '그만 풀기'를 눌러요.</p>
        <div class="sublist">
          ${card('u' + u.id, '🔀 전체 섞기', '모든 소단원 문제가 골고루 나와요')}
          ${u.subs.map((s, i) => card(s.id, `${i + 1}. ${s.name}`)).join('')}
        </div>
      </main>`;
    bindCommon();
    $$('.sub').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.sub;
      play(/^u\d+$/.test(k) ? { unit: unitId } : { unit: unitId, sub: k });
    }));
  }

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
    let sel = p.answer.type === 'multi' ? new Set() : null;
    const result = { firstOk: null, firstInput: null, firstRes: null, actual: null, self: null };
    let pendingRes = null;

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
        case 'ineq': return `<p class="lab">(가) ○ (나): 알맞은 것을 골라요 (키보드 &lt; = &gt;)</p><div class="ineq">${['>', '=', '<'].map((v) => `<button class="opt sym" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
        case 'ox': return `<p class="lab">맞으면 O, 틀리면 X (키보드 O, X)</p><div class="ox"><button class="opt big o" data-v="true">O</button><button class="opt big x" data-v="false">X</button></div>`;
        case 'choice':
        case 'multi':
          return `<p class="lab">${a.type === 'multi' ? '알맞은 것을 모두 골라요' : '하나를 골라요'} (키보드 숫자 1~${a.options.length})</p>
            <div class="opts ${figOpts ? 'figs' : ''}">${a.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="n">${NUMS[i]}</span>${o.figure ? F.render(o.figure) : `<span class="t">${txt(o.text)}</span>`}</button>`).join('')}</div>`;
        default: return '';
      }
    }

    function render() {
      const lvBox = opts.levelText ? `<div class="level">${opts.levelText}</div>` : '';
      app.innerHTML = `${header(statsHtml())}
        <main class="play">
          <button id="back" class="back playback">← 소단원 고르기</button>
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
            ${figOpts ? '<p class="lab">왼쪽에서 알맞은 수직선을 골라요.</p>' : `<div id="inputs">${inputHtml()}</div>`}
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
      $$('.opt').forEach((b) => b.addEventListener('click', () => choose(b)));
      onKey = keyHandler;
      if (opts.startWith) {
        // 도전에서 틀린 문제를 고치러 왔을 때: 처음 낸 답을 보여 주고 바로 "어디서 틀렸을까?"
        result.firstOk = false;
        result.firstInput = opts.startWith.input;
        result.firstRes = opts.startWith.res;
        $('#prev').innerHTML = `<p class="prev">처음 낸 답: <b>${esc(inputText(opts.startWith.input))}</b></p>`;
        markChosenWrong(opts.startWith.input);
        startDiagnose(opts.startWith.res);
      } else {
        const first = $('#in0');
        if (first) first.focus();
      }
    }

    // ----- 입력
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
        case 'multi': return [...sel];
        default: return sel;
      }
    }
    function inputText(input) {
      switch (a.type) {
        case 'num': return String(input).trim() + (a.unit ? ' ' + a.unit : '');
        case 'nums': return String(input).trim();
        case 'pair': return a.labels.map((l, i) => `${l}: ${String(input[i]).trim()}`).join(', ');
        case 'ineq': return input;
        case 'ox': return input ? 'O' : 'X';
        case 'choice': return a.options[input].text || `${NUMS[input]}번`;
        case 'multi': return input.map((i) => a.options[i].text).join(', ');
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
      } else if (a.type === 'multi') {
        sel = new Set(input);
        $$('.opt').forEach((b) => b.classList.toggle('sel', sel.has(Number(b.dataset.i))));
      }
    }
    function markAnswer() {
      $$('.opt.sel').forEach((b) => b.classList.remove('sel'));
      if (a.type === 'choice') { const b = $(`.opt[data-i="${a.value}"]`); if (b) b.classList.add('right'); }
      if (a.type === 'multi') a.values.forEach((i) => { const b = $(`.opt[data-i="${i}"]`); if (b) b.classList.add('right'); });
      if (a.type === 'ox' || a.type === 'ineq') { const b = $(`.opt[data-v="${String(a.value)}"]`); if (b) b.classList.add('right'); }
    }

    function keyHandler(ev) {
      if (phase === 'diagnose') {
        if (/^[1-4]$/.test(ev.key)) { ev.preventDefault(); pickSelf(SELF[Number(ev.key) - 1].id); }
        return;
      }
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
      if (phase === 'diagnose') return;
      const input = getInput();
      const res = G.grade(p, input);
      const fb = $('#fb');
      if (res.empty) { fb.innerHTML = '<p class="warn">답을 먼저 입력해 주세요.</p>'; return; }
      if (res.invalid) { fb.innerHTML = `<p class="warn">${esc(res.invalid)}</p>`; return; }

      if (phase === 'answer') {
        result.firstOk = !!res.ok;
        result.firstInput = Array.isArray(input) ? input.slice() : input;
        result.firstRes = res;
        opts.onFirst(!!res.ok);
        if (res.ok) return finish(`<p class="good">${rng.pick(PRAISE)}</p>${solutionHtml(false)}`);
        if (!opts.fix) {
          // 비슷한 문제 도전 중: 정답은 아직 보여 주지 않고, 도전이 끝난 뒤 같이 고친다
          return finish('<p class="no">아쉬워요. 이 문제는 도전이 끝난 뒤에 같이 고쳐 봐요.</p>', false);
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
          const ansT = G.answerText(p);
          parts.push(`<p class="reveal">정답은 <b>${esc(ansT)}</b>${T.j(ansT, '이에요/예요').slice(ansT.length)}. 풀이를 천천히 읽고, 정답을 직접 입력(선택)해 봐요.</p>${solutionHtml(true)}`);
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
    }

    function finish(html, showAnswer = true) {
      phase = 'done';
      setLocked(true);
      $('#fb').innerHTML = html;
      $('#diag').innerHTML = '';
      if (showAnswer) markAnswer();
      const btn = $('#submit');
      btn.innerHTML = `${opts.nextLabel || '다음 문제 →'} <kbd>Enter</kbd>`;
      btn.focus();
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
      const first = $('#in0');
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
      if (a.type === 'nums' || a.type === 'multi') {
        const what = a.type === 'nums' ? '수' : '것';
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
  function play(scope) {
    const sess = M5.createSession({ scope, state, rng });
    const run = { solved: 0, correct: 0, streak: 0, best: 0, lastBreak: 0, startLevel: sess.level, passed: [], retried: [] };
    const levelText = () => `난이도 <span class="stars">${stars(sess.level)}</span> <span class="lvname">${M5.LEVELS[sess.level - 1]}</span>`;

    // 처음 낸 답 기록 (sign = -1이면 "문제가 이상해요"로 되돌리기)
    function count(p, ok, sign = 1) {
      S.ensureToday(state);
      const t = state.today;
      t.solved += sign;
      run.solved += sign;
      if (ok) { t.correct += sign; run.correct += sign; }
      if (sign > 0) {
        if (ok) { t.streak++; t.best = Math.max(t.best, t.streak); run.streak++; run.best = Math.max(run.best, run.streak); }
        else { t.streak = 0; run.streak = 0; }
      }
      S.bump(state, p.sub, ok, sign);
      S.bump(state, 'u' + p.unit, ok, sign);
      save();
      const st = $('.stats');
      if (st) st.outerHTML = statsHtml();
    }
    function weirdSave(p, result) {
      state.reports.push({ at: new Date().toISOString(), tid: p.tid, level: p.level, text: p.text, answer: G.answerText(p), key: p.key });
      if (result.firstOk != null) count(p, result.firstOk, -1); // 채점에서 빼기
      save();
      toast('알려 줘서 고마워요! 이 문제는 채점에서 빼고 저장해 둘게요.');
    }

    // ---- 무한 모드 한 문제
    function nextNormal() {
      if (run.solved >= run.lastBreak + 20) { run.lastBreak = run.solved; rest(); return; }
      const p = sess.next();
      solve(p, {
        fix: true,
        levelText: levelText(),
        onFirst(ok) {
          count(p, ok);
          const change = sess.record(ok);
          if (!ok) { state.wrong[p.tid] = (state.wrong[p.tid] || 0) + 1; save(); }
          if (change > 0) toast('⭐ 잘하고 있어요! 다음 문제부터 한 단계 어려워져요.');
          if (change < 0) toast('다음 문제부터 한 단계 쉽게 해 볼게요. 천천히 해요!');
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

    function result() {
      onKey = null;
      const rate = run.solved ? Math.round((run.correct / run.solved) * 100) : 0;
      const lv = sess.level;
      const lvMsg = lv > run.startLevel ? '난이도가 올라갔어요! 🎉' : lv < run.startLevel ? '다음에는 조금 쉬운 문제부터 다시 올라가요.' : '';
      const list = (ids) => [...new Set(ids)].map((id) => `<li>${esc(typeName(id))}</li>`).join('');
      app.innerHTML = `${header()}
        <main class="center"><section class="panel">
          <div class="big-emoji">${rate >= 80 ? '🏆' : rate >= 50 ? '🌟' : '🌱'}</div>
          <h2>오늘의 결과</h2>
          <div class="result">
            <div><span class="k">푼 문제</span><b>${run.solved}</b></div>
            <div><span class="k">맞힌 문제</span><b>${run.correct}</b></div>
            <div><span class="k">정답률</span><b>${rate}%</b></div>
            <div><span class="k">통과한 유형</span><b>🏅 ${new Set(run.passed).size}</b></div>
          </div>
          <p class="muted small">맞힌 문제는 처음 낸 답으로 세어요. 최고 연속 정답 ${run.best}개.</p>
          ${run.passed.length ? `<div class="typelist"><b>🏅 통과한 유형</b><ul>${list(run.passed)}</ul></div>` : ''}
          ${run.retried.length ? `<div class="typelist"><b>🌱 다음에 다시 도전할 유형</b><ul>${list(run.retried)}</ul></div>` : ''}
          <p>지금 난이도 <span class="stars">${stars(lv)}</span> ${M5.LEVELS[lv - 1]} ${lvMsg}</p>
          <div class="btns"><button id="again" class="btn primary">계속 풀기</button><button id="toSubs" class="btn">소단원 고르기</button><button class="btn" data-go="home">홈으로</button></div>
        </section></main>`;
      bindCommon();
      $('#again').addEventListener('click', () => play(scope));
      $('#toSubs').addEventListener('click', back);
    }

    nextNormal();
  }

  // ------------------------------------------------------------------ "다음에 다시 도전" 목록
  function retryList() {
    onKey = null;
    app.innerHTML = `${header()}
      <main class="subs">
        <button class="back" data-go="home">← 홈</button>
        <h2>🌱 다음에 다시 도전</h2>
        <p class="lead">비슷한 문제 도전을 두 번 해도 어려웠던 유형이에요. 나중에 무한 모드에서 다시 도전해서 통과하면 목록에서 빠져요.</p>
        ${state.retry.length
          ? `<ol class="reports">${state.retry.map((r) => `<li><b>${esc(typeName(r.tid))}</b><div class="when">${esc(r.at)}에 넣음 · 난이도 ${r.level}</div></li>`).join('')}</ol>`
          : '<p class="muted">아직 없어요. 잘하고 있어요! 👍</p>'}
      </main>`;
    bindCommon();
  }

  // ------------------------------------------------------------------ "문제가 이상해요" 목록
  function reports() {
    onKey = null;
    const list = state.reports.slice().reverse();
    app.innerHTML = `${header()}
      <main class="subs">
        <button class="back" data-go="home">← 홈</button>
        <h2>🚩 '문제가 이상해요'로 저장한 문제</h2>
        <p class="lead">어른이 확인할 수 있게 저장해 둔 문제예요. 이 문제들은 채점에서 빠졌어요.</p>
        ${list.length ? `<ol class="reports">${list.map((r) => `<li><div class="when">${esc(new Date(r.at).toLocaleString('ko-KR'))} · ${esc(r.tid)} · 난이도 ${r.level}</div><p>${txt(r.text)}</p><p class="muted">앱이 생각한 정답: ${esc(r.answer)}</p></li>`).join('')}</ol>
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

  home();
})();
