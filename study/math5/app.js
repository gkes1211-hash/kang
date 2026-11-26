// 화면: 홈 → 소단원 고르기 → 문제 풀기(무한 모드) → 오늘의 결과
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const G = M5.grade, F = M5.figure, S = M5.store;
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const rng = M5.rand.system();
  const state = S.load();

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const txt = (s) => esc(s).replace(/\n/g, '<br>');
  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => [...app.querySelectorAll(sel)];

  const PRAISE = ['정답이에요! 👏', '잘했어요! 🌟', '맞았어요, 멋져요! 😊', '훌륭해요! 💯', '정확해요! 👍', '척척 풀었네요! ✨'];
  const PRAISE_AGAIN = ['다시 풀어서 맞혔어요! 👏', '끝까지 해냈어요! 🌟', '스스로 고쳐서 맞혔어요! 💪'];
  const AGAIN = ['거의 다 왔어요.', '여기만 다시 볼까요?', '괜찮아요, 한 번 더 해 봐요!', '조금만 더 생각해 봐요.'];
  const CAUSE = { concept: '개념', calc: '계산 실수', condition: '조건 놓침', form: '표현 미완성' };
  const NUMS = '①②③④⑤⑥⑦⑧⑨';
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
      if (b.dataset.go === 'home') home();
      else if (b.dataset.go === 'reports') reports();
    }));
  }

  // ------------------------------------------------------------------ 홈
  function home() {
    S.ensureToday(state);
    onKey = null;
    const t = state.today;
    const rate = t.solved ? Math.round((t.correct / t.solved) * 100) : 0;
    app.innerHTML = `${header()}
      <main class="home">
        <section class="today">
          <div><span class="k">오늘 푼 문제</span><b>${t.solved}</b></div>
          <div><span class="k">처음에 맞힌 문제</span><b>${t.correct}</b></div>
          <div><span class="k">정답률</span><b>${rate}%</b></div>
          <div><span class="k">오늘 최고 연속 정답</span><b>${t.best}</b></div>
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
      play(k.startsWith('u') && !k.includes('s') ? { unit: unitId } : { unit: unitId, sub: k });
    }));
  }

  // ------------------------------------------------------------------ 문제 풀기
  function play(scope) {
    const sess = M5.createSession({ scope, state, rng });
    const unit = M5.units.find((x) => x.id === scope.unit);
    const run = { solved: 0, correct: 0, streak: 0, best: 0, lastBreak: 0, startLevel: sess.level };
    let p, tries, hintLv, sel, done, recorded, firstOk, firstHadPattern;

    function next() {
      if (run.solved > 0 && run.solved % 20 === 0 && run.lastBreak !== run.solved) {
        run.lastBreak = run.solved;
        rest();
        return;
      }
      p = sess.next();
      tries = 0; hintLv = 0; done = false; recorded = false; firstOk = null; firstHadPattern = false;
      sel = p.answer.type === 'multi' ? new Set() : null;
      render();
    }

    function statsHtml() {
      const t = state.today;
      return `<div class="stats">
        <span>오늘 푼 문제 <b>${t.solved}</b></span>
        <span>맞힌 문제 <b>${t.correct}</b></span>
        <span>연속 정답 <b>🔥 ${t.streak}</b></span>
      </div>`;
    }

    function inputHtml() {
      const a = p.answer;
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
            <div class="opts ${a.options.some((o) => o.figure) ? 'figs' : ''}">${a.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="n">${NUMS[i]}</span>${o.figure ? F.render(o.figure) : `<span class="t">${txt(o.text)}</span>`}</button>`).join('')}</div>`;
        default: return '';
      }
    }

    function render() {
      const info = M5.findSub(p.sub);
      const lv = sess.level;
      // 보기가 그림이면 넓은 문제 칸에 크게 보여 준다
      const figOpts = (p.answer.options || []).some((o) => o.figure);
      app.innerHTML = `${header(statsHtml())}
        <main class="play">
          <section class="qcard">
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
            <div class="level">난이도 <span class="stars">${stars(lv)}</span> <span class="lvname">${M5.LEVELS[lv - 1]}</span></div>
            ${figOpts ? '<p class="lab">왼쪽에서 알맞은 수직선을 골라요.</p>' : `<div id="inputs">${inputHtml()}</div>`}
            <button id="submit" class="btn primary">채점하기 <kbd>Enter</kbd></button>
            <div id="fb" class="fb" aria-live="polite"></div>
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
      $('#weird').addEventListener('click', weird);
      $('#stop').addEventListener('click', () => result());
      $$('.opt').forEach((b) => b.addEventListener('click', () => choose(b)));
      const first = $('#in0');
      if (first) first.focus();
      onKey = keyHandler;
    }

    function choose(b) {
      if (done || b.disabled) return;
      const a = p.answer;
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

    function keyHandler(ev) {
      if (ev.key === 'Enter') {
        if (ev.target && ev.target.tagName === 'SUMMARY') return;
        ev.preventDefault();
        submit();
        return;
      }
      if (ev.target && ev.target.tagName === 'INPUT') return;
      const type = p.answer.type;
      let btn = null;
      if ((type === 'choice' || type === 'multi') && /^[1-9]$/.test(ev.key)) btn = $(`.opt[data-i="${Number(ev.key) - 1}"]`);
      else if (type === 'ox' && /^[oOㅐ]$/.test(ev.key)) btn = $('.opt[data-v="true"]');
      else if (type === 'ox' && /^[xXㅌ]$/.test(ev.key)) btn = $('.opt[data-v="false"]');
      else if (type === 'ineq' && ['<', '>', '='].includes(ev.key)) btn = $(`.opt[data-v="${ev.key}"]`);
      if (btn) { ev.preventDefault(); choose(btn); }
    }

    function getInput() {
      const a = p.answer;
      switch (a.type) {
        case 'num': case 'nums': return $('#in0').value;
        case 'pair': return [$('#in0').value, $('#in1').value];
        case 'multi': return [...sel];
        default: return sel;
      }
    }

    function recordFirst(ok) {
      recorded = true;
      firstOk = ok;
      const change = sess.record(ok);
      S.ensureToday(state);
      const t = state.today;
      t.solved++;
      if (ok) { t.correct++; t.streak++; t.best = Math.max(t.best, t.streak); } else t.streak = 0;
      run.solved++;
      if (ok) { run.correct++; run.streak++; run.best = Math.max(run.best, run.streak); } else run.streak = 0;
      S.bump(state, p.sub, ok);
      S.bump(state, 'u' + p.unit, ok);
      save();
      const st = $('.stats');
      if (st) st.outerHTML = statsHtml();
      if (change > 0) toast('⭐ 잘하고 있어요! 다음 문제부터 한 단계 어려워져요.');
      if (change < 0) toast('다음 문제부터 한 단계 쉽게 해 볼게요. 천천히 해요!');
    }

    function lockInputs() {
      $$('#inputs input').forEach((x) => { x.disabled = true; });
      $$('.opt').forEach((x) => { x.disabled = true; });
    }

    function showHints() {
      const box = $('#hints');
      if (!hintLv) { box.innerHTML = ''; return; }
      box.innerHTML = p.hints.slice(0, hintLv).map((h, i) => `<div class="hint"><span class="hn">힌트 ${i + 1}</span>${txt(h)}</div>`).join('');
    }

    function solutionHtml(open) {
      return `<details class="sol" ${open ? 'open' : ''}><summary>풀이 보기</summary><ol>${p.solution.map((s) => `<li>${txt(s)}</li>`).join('')}</ol></details>`;
    }

    function finish(html) {
      done = true;
      lockInputs();
      $('#fb').innerHTML = html;
      const btn = $('#submit');
      btn.innerHTML = '다음 문제 → <kbd>Enter</kbd>';
      btn.focus();
    }

    function submit() {
      if (done) { next(); return; }
      const res = G.grade(p, getInput());
      const fb = $('#fb');
      if (res.empty) { fb.innerHTML = '<p class="warn">답을 먼저 입력해 주세요.</p>'; return; }
      if (res.invalid) { fb.innerHTML = `<p class="warn">${esc(res.invalid)}</p>`; return; }
      tries++;
      if (!recorded) recordFirst(!!res.ok);

      if (res.ok) {
        const msg = tries === 1 ? rng.pick(PRAISE) : rng.pick(PRAISE_AGAIN);
        finish(`<p class="good">${msg}</p>${solutionHtml(false)}`);
        $$('.opt.sel').forEach((b) => b.classList.remove('sel'));
        markAnswer();
        return;
      }

      // 틀렸을 때: 정답은 바로 보여 주지 않는다 (기획서 3번)
      const parts = [`<p class="no">${rng.pick(AGAIN)}</p>`];
      if (res.pattern) {
        parts.push(`<p class="cause"><span class="badge">틀린 원인: ${CAUSE[res.pattern.cause]}</span> ${txt(res.pattern.msg)}</p>`);
      }
      const d = detailText(res);
      if (d) parts.push(`<p class="detail">${esc(d)}</p>`);

      if (p.answer.type === 'ox') {
        // O/X는 남은 답이 하나뿐이라 바로 설명하고 넘어간다
        finish(`${parts.join('')}<p class="reveal">정답은 <b>${esc(G.answerText(p))}</b>예요.</p>${solutionHtml(true)}`);
        markAnswer();
        return;
      }
      if (tries === 1) {
        firstHadPattern = !!res.pattern;
        if (!res.pattern) { parts.push('<p>어디서 다른지 같이 찾아볼까요? 힌트를 보고 다시 풀어 봐요.</p>'); hintLv = 1; }
        else parts.push('<p>개념 설명을 보고 다시 풀어 봐요.</p>');
        $('#concept').open = true;
      } else if (hintLv >= 3) {
        finish(`${parts.join('')}<p class="reveal">정답은 <b>${esc(G.answerText(p))}</b>예요. 풀이를 천천히 읽어 보고 다음 문제로 가요.</p>${solutionHtml(true)}`);
        markAnswer();
        return;
      } else {
        hintLv++;
        parts.push(`<p>${M5.text.j('힌트 ' + hintLv, '을/를')} 보고 다시 풀어 봐요.</p>`);
      }
      fb.innerHTML = parts.join('');
      showHints();
      markWrong();
    }

    function detailText(res) {
      const a = p.answer;
      const bits = [];
      if (a.type === 'nums' || a.type === 'multi') {
        const what = a.type === 'nums' ? '수' : '것';
        if (res.missing) bits.push(`${M5.text.j('빠진 ' + what, '이/가')} ${res.missing}개 있어요.`);
        if (res.extra) bits.push(`${M5.text.j('넣지 않아야 할 ' + what, '이/가')} ${res.extra}개 있어요.`);
      }
      if (a.type === 'pair') {
        if (res.swapped) bits.push('두 수의 자리가 바뀌었어요.');
        else bits.push(`${res.wrong.map((i) => `'${a.labels[i]}'`).join(', ')} 칸을 다시 확인해요.`);
      }
      return bits.join(' ');
    }

    function markWrong() {
      const a = p.answer;
      if (a.type === 'choice' && sel != null) {
        const b = $(`.opt[data-i="${sel}"]`);
        if (b) { b.classList.remove('sel'); b.classList.add('wrong'); b.disabled = true; }
        sel = null;
      } else if (a.type === 'ineq' && sel != null) {
        const b = $(`.opt[data-v="${sel}"]`);
        if (b) { b.classList.remove('sel'); b.classList.add('wrong'); b.disabled = true; }
        sel = null;
      } else if (a.type === 'num' || a.type === 'nums') {
        const i = $('#in0'); i.focus(); i.select();
      } else if (a.type === 'pair') {
        const i = $('#in0'); i.focus(); i.select();
      }
    }

    function markAnswer() {
      const a = p.answer;
      if (a.type === 'choice') { const b = $(`.opt[data-i="${a.value}"]`); if (b) b.classList.add('right'); }
      if (a.type === 'multi') a.values.forEach((i) => { const b = $(`.opt[data-i="${i}"]`); if (b) b.classList.add('right'); });
      if (a.type === 'ox') { const b = $(`.opt[data-v="${a.value}"]`); if (b) b.classList.add('right'); }
      if (a.type === 'ineq') { const b = $(`.opt[data-v="${a.value}"]`); if (b) b.classList.add('right'); }
    }

    function weird() {
      state.reports.push({
        at: new Date().toISOString(), tid: p.tid, level: p.level,
        text: p.text, answer: G.answerText(p), key: p.key,
      });
      if (recorded) {
        // 채점에서 빼기
        const t = state.today;
        t.solved--; if (firstOk) t.correct--;
        run.solved--; if (firstOk) run.correct--;
        S.bump(state, p.sub, firstOk, -1);
        S.bump(state, 'u' + p.unit, firstOk, -1);
      }
      save();
      toast('알려 줘서 고마워요! 이 문제는 채점에서 빼고 저장해 둘게요.');
      next();
    }

    function rest() {
      onKey = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); next(); } };
      app.innerHTML = `${header(statsHtml())}
        <main class="center"><section class="panel">
          <div class="big-emoji">🍵</div>
          <h2>잠깐 쉬어 갈까요?</h2>
          <p>벌써 ${run.solved}문제를 풀었어요! 눈을 감고 기지개를 쭉 켜 봐요.</p>
          <div class="btns"><button id="go" class="btn primary">계속 풀기 <kbd>Enter</kbd></button><button id="stop" class="btn">그만 풀기</button></div>
        </section></main>`;
      bindCommon();
      $('#go').addEventListener('click', next);
      $('#stop').addEventListener('click', () => result());
    }

    function result() {
      onKey = null;
      const rate = run.solved ? Math.round((run.correct / run.solved) * 100) : 0;
      const lv = sess.level;
      const lvMsg = lv > run.startLevel ? '난이도가 올라갔어요! 🎉' : lv < run.startLevel ? '다음에는 조금 쉬운 문제부터 다시 올라가요.' : '';
      app.innerHTML = `${header()}
        <main class="center"><section class="panel">
          <div class="big-emoji">${rate >= 80 ? '🏆' : rate >= 50 ? '🌟' : '🌱'}</div>
          <h2>오늘의 결과</h2>
          <div class="result">
            <div><span class="k">푼 문제</span><b>${run.solved}</b></div>
            <div><span class="k">맞힌 문제</span><b>${run.correct}</b></div>
            <div><span class="k">정답률</span><b>${rate}%</b></div>
            <div><span class="k">최고 연속</span><b>${run.best}</b></div>
          </div>
          <p class="muted small">맞힌 문제는 처음 낸 답으로 세어요.</p>
          <p>지금 난이도 <span class="stars">${stars(lv)}</span> ${M5.LEVELS[lv - 1]} ${lvMsg}</p>
          <p class="muted">오늘 모두 ${state.today.solved}문제를 풀었어요.</p>
          <div class="btns"><button id="again" class="btn primary">계속 풀기</button><button class="btn" data-go="home">홈으로</button></div>
        </section></main>`;
      bindCommon();
      $('#again').addEventListener('click', () => play(scope));
    }

    next();
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
    if (c) c.addEventListener('click', () => {
      if (confirm('저장한 문제를 모두 지울까요?')) { state.reports = []; save(); reports(); }
    });
  }

  home();
})();
