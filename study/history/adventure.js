// 🎮 역사 속으로: 모험 편 엔진 (장면 넘기기, 선택, 미니 놀이, 진짜 역사 카드, 기억 퀴즈)
// 내용은 data/adventures.js. app.js 가 H.makeAdventure(api) 를 불러 화면들을 받아 가요.
window.H = window.H || {};
H.makeAdventure = (api) => {
  'use strict';
  const { S, save, addStars, toast, esc, gloss, speak, hush, canSpeak, header, go, $app, personById } = api;
  const AVATARS = ['🧒', '👧', '👦', '🧑‍🚀', '🦊', '🐯', '🐰', '🐼'];
  const REVIEW_DAYS = [3, 7, 30];
  H.adventures.sort((a, b) => a.year - b.year); // 옛날 → 요즘
  const byId = Object.fromEntries(H.adventures.map((a) => [a.id, a]));
  S.adv = S.adv || {};

  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dayStr(d); };
  const me = () => S.explorer || { name: '탐험', av: '🧒' };
  const fill = (s) => s.replace(/\{name\}/g, me().name);
  const say = (text) => { if (S.autoRead && canSpeak) speak(text.replace(/[^\p{L}\p{N}\s.,!?…'"~·()-]/gu, ' ')); };

  // ---------------------------------------------------------------- 무대 그림
  const sprite = (p) => `<span class="sp ${p.a || ''}" style="left:${p.x}%;top:${p.y}%;font-size:${p.s || 48}px">${p.e}</span>`;
  const stageHTML = (st, extra = '') => `<div class="stage bg-${st.bg}">${(st.sprites || []).map(sprite).join('')}${extra}</div>`;

  // ---------------------------------------------------------------- 탐험대원 만들기
  function setup(then) {
    const cur = S.explorer || { name: '', av: AVATARS[0] };
    let av = cur.av;
    let read = S.autoRead !== undefined ? S.autoRead : canSpeak;
    const draw = () => {
      $app.innerHTML = `${header('🧭 탐험대원 등록')}
        <section class="setup">
          <div class="badge-card"><span class="av">${av}</span><div><small>시간 여행 탐험대</small><b id="nm-show">${esc(cur.name || '???')} 대원</b></div></div>
          <label class="lbl" for="nm">✏️ 내 대원 이름 (별명)</label>
          <input id="nm" maxlength="8" autocomplete="off" placeholder="예: 번개" value="${esc(cur.name)}">
          <div class="lbl">😀 내 모습</div>
          <div class="avs">${AVATARS.map((a) => `<button class="avb ${a === av ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
          ${canSpeak ? `<div class="lbl">🔊 말풍선을 소리 내어 읽어 줄까요?</div>
          <div class="two"><button class="opt ${read ? 'on' : ''}" data-read="1">🔊 들으면서 할래요</button><button class="opt ${read ? '' : 'on'}" data-read="0">📖 내가 읽을래요</button></div>` : ''}
          <button class="main wide" id="ok">🕰️ 탐험대원 등록!</button>
        </section>`;
      const nm = document.getElementById('nm');
      nm.oninput = () => { cur.name = nm.value.trim(); document.getElementById('nm-show').textContent = `${cur.name || '???'} 대원`; };
      $app.querySelectorAll('.avb').forEach((b) => { b.onclick = () => { av = b.dataset.av; draw(); }; });
      $app.querySelectorAll('[data-read]').forEach((b) => { b.onclick = () => { read = b.dataset.read === '1'; draw(); }; });
      document.getElementById('ok').onclick = () => {
        if (!cur.name) { toast('이름을 지어 줘요!'); nm.focus(); return; }
        S.explorer = { name: cur.name, av }; S.autoRead = read; save();
        then();
      };
    };
    draw();
  }

  // ---------------------------------------------------------------- 모험 목록
  const views = {};
  views.advList = () => {
    if (!S.explorer) { setup(() => go('advList')); return; }
    const m = me();
    $app.innerHTML = `${header('🎮 역사 속으로')}
      <div class="badge-card"><span class="av">${m.av}</span><div><small>시간 여행 탐험대</small><b>${esc(m.name)} 대원</b></div>
        <button class="ghost" data-go="advSetup">바꾸기</button></div>
      <p class="lead">하고 싶은 모험을 골라! 옛날 → 요즘 순서로 놓여 있어요. (${H.adventures.filter((a) => S.adv[a.id]).length} / ${H.adventures.length} 완료)</p>
      <div class="list">${H.adventures.map((a) => {
        const r = S.adv[a.id];
        return `<button class="row adv-row" data-go="adv" data-arg="${a.id}">
          <span class="em">${a.emoji}</span>
          <span class="txt"><b>${esc(a.title)} ${r ? `<span class="done">${'⭐'.repeat(r.stars)}</span>` : '<span class="new">NEW</span>'}</b><i>${esc(a.hook)}</i></span>
          ${api.eraTag(a.era)}</button>`;
      }).join('')}
        <div class="row soon"><span class="em">🐢</span><span class="txt"><b>다음 모험도 준비 중이에요</b><i>새 모험이 하나씩 더 열려요!</i></span></div>
      </div>`;
  };
  views.advSetup = () => setup(() => go('advList'));

  // ---------------------------------------------------------------- 모험 하기
  views.adv = (id) => {
    const A = byId[id];
    if (!S.explorer) { setup(() => go('adv', id)); return; }
    const cast = Object.assign({ me: { name: `${me().name} 대원`, e: me().av } }, A.cast);
    let i = 0;
    let wrongs = 0;
    let timer = null;
    const stop = () => { if (timer) { cancelAnimationFrame(timer); timer = null; } };

    const frame = (sc, inner) => {
      const who = cast[sc.who] || cast.me;
      const dots = A.scenes.map((_, k) => `<span class="${k < i ? 'past' : k === i ? 'now' : ''}"></span>`).join('');
      return `${header(`${A.emoji} ${esc(A.title.split(':')[0])}`)}
        <div class="adv">
          <div class="dots" aria-label="${i + 1} / ${A.scenes.length} 장면">${dots}</div>
          ${inner.stage}
          <div class="bubble" id="bubble"><span class="who">${who.e} ${esc(who.name)}</span><p id="say">${gloss(fill(sc.say))}</p>
            ${canSpeak ? '<button class="say-btn" id="sayb" aria-label="읽어 줘">🔊</button>' : ''}</div>
          <div id="fb" class="fb" hidden></div>
          <div class="act" id="act">${inner.act}</div>
        </div>`;
    };
    const bindCommon = (sc) => {
      const b = document.getElementById('sayb');
      if (b) b.onclick = () => speak(document.getElementById('say').textContent);
      say(fill(sc.say));
    };
    const next = () => { stop(); hush(); i++; if (i < A.scenes.length) scene(); else finish(); };
    const nextBtn = (label = '다음 ▶') => `<button class="main wide" id="next">${label}</button>`;
    const bindNext = () => { const n = document.getElementById('next'); if (n) n.onclick = next; };
    const showAfter = (text) => {
      document.getElementById('say').innerHTML = gloss(fill(text));
      document.getElementById('bubble').classList.add('happy');
      say(fill(text));
    };

    function scene() {
      const sc = A.scenes[i];
      if (sc.type === 'talk') {
        $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage), act: nextBtn(i === A.scenes.length - 1 ? '🎁 진짜 역사 카드 받기' : '다음 ▶') });
        bindCommon(sc); bindNext();
      } else if (sc.type === 'choice') choice(sc);
      else if (sc.type === 'repeat') repeat(sc);
      else if (sc.type === 'timing') timing(sc);
      else if (sc.type === 'match') match(sc);
      window.scrollTo(0, 0);
    }

    // 고르기: 틀리면 "다시 생각해 볼까?" + 힌트, 그 보기는 지우고 다시 골라요
    function choice(sc) {
      const opts = sc.options.map((o, k) => `<button class="pick" data-k="${k}"><span class="em">${o.e}</span>${esc(o.t)}</button>`).join('');
      $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage), act: `<div class="picks">${opts}</div>` });
      bindCommon(sc);
      const fb = document.getElementById('fb');
      $app.querySelectorAll('.pick').forEach((b) => {
        b.onclick = () => {
          const o = sc.options[Number(b.dataset.k)];
          if (o.ok) {
            b.classList.add('ok');
            $app.querySelectorAll('.pick').forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('gone'); });
            fb.hidden = true;
            showAfter(sc.after || '좋아!');
            document.getElementById('act').insertAdjacentHTML('beforeend', nextBtn());
            bindNext();
          } else {
            wrongs++;
            b.classList.add('no'); b.disabled = true;
            fb.hidden = false;
            fb.innerHTML = `<span class="av">${me().av}</span><div><b>🤔 다시 생각해 볼까?</b><p>${gloss(fill(o.fb))}</p></div>`;
            fb.classList.remove('wiggle'); void fb.offsetWidth; fb.classList.add('wiggle');
            say('다시 생각해 볼까? ' + fill(o.fb));
          }
        };
      });
    }

    // 연타 놀이: 버튼을 times 번 누르면 막대가 차거나 줄고, 움직이는 그림(movers)이 x[0] → x[1] 로 가요
    //   { type: 'repeat', button, times, meter: { label, from, to }, movers: [{ e, x: [시작, 끝], y, s }], end, mid, done }
    function repeat(sc) {
      const N = sc.times;
      const m = sc.meter || { label: '', from: 0, to: 100 };
      const movers = sc.movers || [];
      let n = 0;
      const extra = movers.map((v, k) => `<span class="sp ${v.s ? '' : 'army'}" id="mv${k}" style="left:${v.x[0]}%;top:${v.y}%;${v.s ? `font-size:${v.s}px;transition:left .35s ease-out` : ''}">${v.e}</span>`).join('')
        + (m.label ? `<div class="food"><span>${esc(m.label)}</span><div class="meter"><i id="meter" style="width:${m.from}%"></i></div></div>` : '');
      $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage, extra), act: `<button class="main wide big" id="run">${esc(sc.button)} <small id="cnt">0 / ${N}</small></button>` });
      bindCommon(sc);
      document.getElementById('run').onclick = () => {
        if (n >= N) return;
        n++;
        const t = n / N;
        const bar = document.getElementById('meter');
        if (bar) bar.style.width = `${Math.round(m.from + (m.to - m.from) * t)}%`;
        movers.forEach((v, k) => {
          const el = document.getElementById(`mv${k}`);
          el.style.left = `${v.x[0] + (v.x[1] - v.x[0]) * t}%`;
          el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
        });
        document.getElementById('cnt').textContent = `${n} / ${N}`;
        if (n === N) {
          if (sc.end && movers.length) document.getElementById('mv0').textContent = sc.end;
          showAfter(sc.done);
          document.getElementById('act').innerHTML = nextBtn();
          bindNext();
        } else if (sc.mid && n === Math.ceil(N / 2)) toast(sc.mid);
      };
    }

    // 타이밍 놀이: mover 가 오른쪽 → 왼쪽으로 지나가요. 과녁(zone) 안에 있을 때 누르면 성공
    //   { type: 'timing', button, hint, zone: { kind: 'river' | 'band', from, to, label }, mover: { e, y }, hit, hitE, boom, early, late, actor: [{ e, x, y, s }] }
    function timing(sc) {
      const z = sc.zone || { kind: 'river', from: 36, to: 64 };
      const zoneEl = z.kind === 'river'
        ? `<div class="river" style="left:${z.from}%;width:${z.to - z.from}%"></div>`
        : `<div class="band" style="left:${z.from}%;width:${z.to - z.from}%">${z.label ? `<span>${esc(z.label)}</span>` : ''}</div>`;
      const extra = `${zoneEl}${(sc.actors || []).map(sprite).join('')}
        <span class="sp army" id="them" style="left:104%;top:${(sc.mover && sc.mover.y) || 50}%">${sc.mover ? sc.mover.e : '💂💂💂'}</span>
        <span class="sp" id="boom" style="left:50%;top:48%;font-size:72px" hidden>${sc.boom || '💥'}</span>`;
      $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage, extra), act: `<button class="main wide big" id="hit">${esc(sc.button || '⚔️ 지금!')}</button><p class="tip">${esc(sc.hint)}</p>` });
      bindCommon(sc);
      const them = document.getElementById('them');
      const LAP = sc.lap || 4200;
      const lo = z.from + 1; const hi = z.to - 1;
      let t0 = performance.now();
      const pos = (now) => 104 - (((now - t0) % LAP) / LAP) * 116; // 104% → -12%
      const loop = (now) => { if (!them.isConnected) { timer = null; return; } them.style.left = `${pos(now)}%`; timer = requestAnimationFrame(loop); };
      timer = requestAnimationFrame(loop);
      document.getElementById('hit').onclick = () => {
        const x = pos(performance.now());
        if (x >= lo && x <= hi) {
          stop();
          them.style.left = `${x}%`;
          if (sc.hitE) them.textContent = sc.hitE;
          them.classList.add('shake');
          const boom = document.getElementById('boom'); boom.style.left = `${x}%`; boom.hidden = false;
          showAfter(sc.hit);
          document.getElementById('act').innerHTML = nextBtn();
          bindNext();
        } else if (x > hi) {
          toast(sc.early || '아직이에요! 조금만 기다려요');
          say(sc.early || '아직이야');
        } else {
          toast(sc.late || '놓쳤어요! 다음에 올 때를 노려요');
          say(sc.late || '놓쳤다');
          t0 = performance.now() - LAP * 0.05;
        }
      };
    }

    // 짝 맞추기: 왼쪽 카드를 누르고, 짝이 되는 오른쪽 카드를 눌러요
    //   { type: 'match', pairs: [{ a, b }], left: '왼쪽 제목', right: '오른쪽 제목', miss, done }
    function match(sc) {
      const P = sc.pairs;
      const order = P.map((_, k) => k).sort(() => Math.random() - 0.5);
      let picked = null; let got = 0;
      const short = P.every((p) => p.a.length <= 3);
      const act = `<div class="match ${short ? 'short' : ''}">
          <div class="mcol"><div class="mhead">${esc(sc.left || '')}</div>${P.map((p, k) => `<button class="mcard a" data-k="${k}">${esc(p.a)}</button>`).join('')}</div>
          <div class="mcol"><div class="mhead">${esc(sc.right || '')}</div>${order.map((k) => `<button class="mcard b" data-k="${k}">${esc(P[k].b)}</button>`).join('')}</div>
        </div>`;
      $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage), act });
      bindCommon(sc);
      $app.querySelectorAll('.mcard.a').forEach((b) => {
        b.onclick = () => {
          $app.querySelectorAll('.mcard.a').forEach((x) => x.classList.remove('sel'));
          picked = b.dataset.k; b.classList.add('sel');
        };
      });
      $app.querySelectorAll('.mcard.b').forEach((b) => {
        b.onclick = () => {
          if (picked === null) { toast('왼쪽 카드를 먼저 골라요 👈'); return; }
          const a = $app.querySelector(`.mcard.a[data-k="${picked}"]`);
          if (b.dataset.k === picked) {
            a.classList.remove('sel'); a.classList.add('ok'); b.classList.add('ok'); a.disabled = true; b.disabled = true;
            picked = null; got++;
            if (got === P.length) {
              showAfter(sc.done);
              document.getElementById('act').insertAdjacentHTML('beforeend', nextBtn());
              bindNext();
            }
          } else {
            b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
            toast(sc.miss || '짝이 아니에요. 다시 생각해 볼까?');
          }
        };
      });
    }

    // 끝: 별, 진짜 역사 카드, 인물 카드, 기억 퀴즈 예약
    function finish() {
      const stars = wrongs <= 2 ? 3 : wrongs <= 5 ? 2 : 1;
      const prev = S.adv[A.id];
      const gain = Math.max(0, stars - (prev ? prev.stars : 0));
      if (gain) addStars(gain);
      const p = personById[A.person];
      const newPerson = p && !S.people[p.id];
      if (p) S.people[p.id] = true;
      S.adv[A.id] = { stars: Math.max(stars, prev ? prev.stars : 0), done: dayStr(), step: prev ? prev.step : 0, next: prev ? prev.next : addDays(REVIEW_DAYS[0]) };
      save();
      const c = A.card;
      $app.innerHTML = `${header(`${A.emoji} 모험 완료`)}
        <div class="prog"><span class="now">① 모험 ✔</span><span>② 인물 카드</span><span>③ 연표</span></div>
        <section class="result">
          <div class="big-em">🎉</div>
          <h1>${esc(me().name)} 대원, 임무 성공! ${'⭐'.repeat(stars)}</h1>
          <p class="muted">${wrongs ? `다시 생각한 횟수 ${wrongs}번` : '한 번도 안 틀렸어요!'}${gain ? ` · ⭐ ${gain}개 받았어요` : ''}</p>
        </section>
        <section class="hcard">
          <div class="hcard-top">📜 진짜 역사 카드</div>
          <h2>${A.emoji} ${esc(c.title)}</h2>
          <dl><dt>언제</dt><dd>${esc(c.when)}</dd><dt>누가</dt><dd>${esc(c.who)}</dd>${c.vs ? `<dt>누구와</dt><dd>${esc(c.vs)}</dd>` : ''}</dl>
          <p>${gloss(c.how)}</p>
          <div class="words">🔑 ${c.words.map((w) => `<span>${esc(w)}</span>`).join('')}</div>
          ${canSpeak ? '<button class="ghost" id="cardsay">🔊 카드 읽어 줘</button>' : ''}
        </section>
        <button class="main wide" id="tonext">다음: 🧑 인물 카드 ▶</button>`;
      const cs = document.getElementById('cardsay');
      if (cs) cs.onclick = () => speak(`${c.title}. ${c.when}. ${c.who}${c.vs ? `, ${c.vs}` : ''}. ${c.how}`);
      document.getElementById('tonext').onclick = () => api.afterAdventure(A, { stars, gain, wrongs, newPerson });
      window.scrollTo(0, 0);
    }

    scene();
  };

  // ---------------------------------------------------------------- 기억 퀴즈 (3일, 7일, 30일 뒤)
  const dueList = () => H.adventures.filter((a) => S.adv[a.id] && S.adv[a.id].next && S.adv[a.id].next <= dayStr());
  views.advReview = () => {
    const due = dueList();
    if (!due.length) { go('home'); return; }
    const A = due[0];
    const r = S.adv[A.id];
    const qs = A.review.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    let k = 0; let right = 0;
    const draw = () => {
      const q = qs[k];
      $app.innerHTML = `${header('🧠 기억 퀴즈')}
        <section class="quiz big">
          <div class="muted">${A.emoji} ${esc(A.title.split(':')[0])} · ${k + 1} / ${qs.length}</div>
          <p>${esc(q.q)}</p>
          <div class="choices">${q.choices.map((c, i) => `<button class="choice" data-i="${i}">${esc(c)}</button>`).join('')}</div>
          <div class="why" hidden></div>
        </section>`;
      let first = true;
      $app.querySelectorAll('.choice').forEach((b) => {
        b.onclick = () => {
          const i = Number(b.dataset.i);
          if (i === q.answer) {
            if (first) right++;
            b.classList.add('ok');
            $app.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
            const w = $app.querySelector('.why'); w.hidden = false; w.innerHTML = '💡 ' + gloss(q.why);
            $app.querySelector('.quiz').insertAdjacentHTML('beforeend', `<button class="main wide" id="nx">${k + 1 < qs.length ? '다음 ▶' : '끝!'}</button>`);
            document.getElementById('nx').onclick = () => { k++; if (k < qs.length) draw(); else end(); };
          } else { first = false; b.classList.add('no'); b.disabled = true; }
        };
      });
    };
    const end = () => {
      const all = right === qs.length;
      r.step = all ? r.step + 1 : r.step;
      r.next = r.step < REVIEW_DAYS.length ? addDays(REVIEW_DAYS[r.step]) : null;
      if (all) addStars(1);
      save();
      $app.innerHTML = `${header('🧠 기억 퀴즈')}
        <section class="result"><div class="big-em">${all ? '🧠✨' : '💪'}</div>
          <h1>${all ? '기억력 최고! ⭐ 1개' : '조금 헷갈렸지? 괜찮아!'}</h1>
          <p>${all ? (r.next ? `다음 기억 퀴즈는 ${REVIEW_DAYS[r.step]}일 뒤에 와요.` : '이제 이 모험은 머릿속에 꼭 저장됐어요!') : `${REVIEW_DAYS[r.step]}일 뒤에 한 번 더 물어볼게요. 모험을 다시 해 봐도 좋아요!`}</p>
          <div class="nav2">${dueList().length ? '<button class="main" data-go="advReview">다음 기억 퀴즈 ▶</button>' : ''}<button class="ghost" data-go="adv" data-arg="${A.id}">🔁 모험 다시 하기</button><button class="ghost" data-go="home">처음으로</button></div>
        </section>`;
    };
    draw();
  };

  // 처음 화면의 "오늘의 탐험" 카드: 안 한 모험 중 가장 옛날 것 → 다 했으면 별이 적은 모험
  const homeCard = () => {
    const due = dueList().length;
    const fresh = H.adventures.find((a) => !S.adv[a.id]);
    const low = H.adventures.filter((a) => S.adv[a.id]).sort((a, b) => S.adv[a.id].stars - S.adv[b.id].stars)[0];
    const pick = fresh || low || H.adventures[0];
    const nth = H.adventures.indexOf(pick) + 1;
    return `${due ? `<button class="review-banner" data-go="advReview">🧠 기억 퀴즈 ${due}개가 찾아왔어요! <b>풀러 가기 ▶</b></button>` : ''}
      <button class="adv-hero" data-go="${S.explorer ? 'adv' : 'advList'}" data-arg="${pick.id}">
        <small>${S.explorer ? (fresh ? `오늘의 탐험 · ${nth} / ${H.adventures.length}번째` : '모든 모험 완료! 별을 더 모아 볼까?') : '탐험대원이 되어 출동!'}</small>
        <b>${pick.emoji} ${esc(pick.title)}</b>
        <i>${fresh ? esc(pick.hook) : `지금 ${'⭐'.repeat(S.adv[pick.id].stars)} · ⭐3에 다시 도전!`}</i>
        <span class="steps3"><span class="on">① 🎮 모험</span><span>② 🧑 인물 카드</span><span>③ 📅 연표에 놓기</span></span>
        <span class="go">▶ 출발!</span>
      </button>`;
  };

  return { views, homeCard };
};
