// 🎮 역사 속으로: 모험 편 엔진 (장면 넘기기, 선택, 미니 놀이, 진짜 역사 카드, 기억 퀴즈)
// 내용은 data/adventures.js. app.js 가 H.makeAdventure(api) 를 불러 화면들을 받아 가요.
window.H = window.H || {};
H.makeAdventure = (api) => {
  'use strict';
  const { S, save, addStars, toast, esc, gloss, speak, hush, canSpeak, header, go, $app, personById } = api;
  const AVATARS = ['🧒', '👧', '👦', '🧑‍🚀', '🦊', '🐯', '🐰', '🐼'];
  const REVIEW_DAYS = [3, 7, 30];
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
      <p class="lead">역사 속 인물 곁에서, 중요한 순간마다 네가 골라! 틀려도 괜찮아, 다시 생각해 보면 돼.</p>
      <div class="list">${H.adventures.map((a) => {
        const r = S.adv[a.id];
        return `<button class="row adv-row" data-go="adv" data-arg="${a.id}">
          <span class="em">${a.emoji}</span>
          <span class="txt"><b>${esc(a.title)} ${r ? `<span class="done">${'⭐'.repeat(r.stars)}</span>` : '<span class="new">NEW</span>'}</b><i>${esc(a.hook)}</i></span>
          ${api.eraTag(a.era)}</button>`;
      }).join('')}
        <div class="row soon"><span class="em">🐢</span><span class="txt"><b>다음 모험은 준비 중이에요</b><i>명량 해전, 한글 만들기, 수원 화성 … 하나씩 열려요!</i></span></div>
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
      else if (sc.type === 'retreat') retreat(sc);
      else if (sc.type === 'timing') timing(sc);
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

    // 지는 척 후퇴 놀이: 누를 때마다 적은 더 깊이 따라오고, 식량은 줄어요
    function retreat(sc) {
      const N = sc.times;
      let n = 0;
      const extra = `<span class="sp" style="left:10%;top:52%;font-size:64px">🏯</span>
        <span class="sp" id="us" style="left:30%;top:60%;font-size:44px">🏃</span>
        <span class="sp army" id="them" style="left:82%;top:58%">💂💂💂</span>
        <div class="food"><span>수나라 식량 🍚</span><div class="meter"><i id="food" style="width:100%"></i></div></div>`;
      $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage, extra), act: `<button class="main wide big" id="run">🏃 지는 척 후퇴! <small id="cnt">0 / ${N}</small></button>` });
      bindCommon(sc);
      document.getElementById('run').onclick = () => {
        if (n >= N) return;
        n++;
        const t = n / N;
        document.getElementById('food').style.width = `${Math.round((1 - t) * 100)}%`;
        document.getElementById('them').style.left = `${82 - t * 42}%`;
        document.getElementById('us').style.left = `${30 - t * 12}%`;
        document.getElementById('cnt').textContent = `${n} / ${N}`;
        const them = document.getElementById('them');
        them.classList.remove('hop'); void them.offsetWidth; them.classList.add('hop');
        if (n === N) {
          document.getElementById('them').textContent = '😫😫😫';
          showAfter(sc.done);
          document.getElementById('act').innerHTML = nextBtn();
          bindNext();
        } else if (n === Math.ceil(N / 2)) toast('적의 배에서 꼬르륵 소리가 나요! 🍚');
      };
    }

    // 반쯤 건넜을 때 공격 놀이: 적이 오른쪽에서 왼쪽으로 강을 건너요. 강 한가운데서 누르면 성공
    function timing(sc) {
      const extra = `<div class="river"></div>
        <span class="sp" style="left:8%;top:30%;font-size:44px">🧔</span><span class="sp" style="left:8%;top:62%;font-size:40px">🏹</span>
        <span class="sp army" id="them" style="left:100%;top:50%">💂💂💂</span>
        <span class="sp" id="boom" style="left:50%;top:48%;font-size:72px" hidden>💦</span>`;
      $app.innerHTML = frame(sc, { stage: stageHTML(sc.stage, extra), act: `<button class="main wide big" id="hit">⚔️ 지금 공격!</button><p class="tip">${esc(sc.hint)}</p>` });
      bindCommon(sc);
      const them = document.getElementById('them');
      const LAP = 4200;
      let t0 = performance.now();
      const pos = (now) => 104 - (((now - t0) % LAP) / LAP) * 116; // 104% → -12%
      const loop = (now) => { if (!them.isConnected) { timer = null; return; } them.style.left = `${pos(now)}%`; timer = requestAnimationFrame(loop); };
      timer = requestAnimationFrame(loop);
      document.getElementById('hit').onclick = () => {
        const x = pos(performance.now());
        if (x >= 36 && x <= 64) {
          stop();
          them.style.left = `${x}%`;
          them.textContent = '😵😵😵';
          them.classList.add('shake');
          document.getElementById('boom').hidden = false;
          showAfter('적이 강 한가운데서 꼼짝 못 했어! 고구려군이 한꺼번에 공격해서 크게 이겼어요!');
          document.getElementById('act').innerHTML = nextBtn();
          bindNext();
        } else if (x > 64) {
          toast('아직 강에 안 들어왔어요! 조금만 기다려요');
          say('아직이야! 조금만 기다려');
        } else {
          toast('벌써 다 건넜어요! 다음에 올 때를 노려요');
          say('놓쳤다! 다음에 올 때를 노리자');
          t0 = performance.now() - LAP * 0.05;
        }
      };
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
        <section class="result">
          <div class="big-em">🎉</div>
          <h1>${esc(me().name)} 대원, 임무 성공! ${'⭐'.repeat(stars)}</h1>
          <p class="muted">${wrongs ? `다시 생각한 횟수 ${wrongs}번` : '한 번도 안 틀렸어요!'}${gain ? ` · ⭐ ${gain}개 받았어요` : ''}</p>
        </section>
        <section class="hcard">
          <div class="hcard-top">📜 진짜 역사 카드</div>
          <h2>${A.emoji} ${esc(c.title)}</h2>
          <dl><dt>언제</dt><dd>${esc(c.when)}</dd><dt>누가</dt><dd>${esc(c.who)}</dd><dt>누구와</dt><dd>${esc(c.vs)}</dd></dl>
          <p>${gloss(c.how)}</p>
          <div class="words">🔑 ${c.words.map((w) => `<span>${esc(w)}</span>`).join('')}</div>
          ${canSpeak ? '<button class="ghost" id="cardsay">🔊 카드 읽어 줘</button>' : ''}
        </section>
        ${newPerson ? `<div class="newcard">🗂️ 인물 카드 <b>${p.emoji} ${esc(p.name)}</b> 를 얻었어요!</div>` : ''}
        <div class="think"><b>💬 너라면?</b><p>${esc(A.think)}</p><small>정답은 없어요. 가족이랑 이야기해 봐요!</small></div>
        <p class="muted center">🧠 ${REVIEW_DAYS[0]}일 뒤에 기억 퀴즈가 찾아와요. 그때 다시 만나요!</p>
        <div class="nav2"><button class="ghost" data-go="adv" data-arg="${A.id}">🔁 다시 하기</button><button class="main" data-go="home">처음으로</button></div>`;
      const cs = document.getElementById('cardsay');
      if (cs) cs.onclick = () => speak(`${c.title}. ${c.when}. ${c.who}, ${c.vs}. ${c.how}`);
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

  // 처음 화면에 넣을 카드
  const homeCard = () => {
    const due = dueList().length;
    const fresh = H.adventures.find((a) => !S.adv[a.id]);
    const pick = fresh || H.adventures[0];
    return `${due ? `<button class="review-banner" data-go="advReview">🧠 기억 퀴즈가 ${due}개 찾아왔어요! <b>풀러 가기 ▶</b></button>` : ''}
      <button class="adv-hero" data-go="${S.explorer ? 'adv' : 'advList'}" data-arg="${pick.id}">
        <span class="em">🎮</span>
        <span><small>역사 속으로 · ${S.explorer ? `${esc(me().av)} ${esc(me().name)} 대원 출동!` : '탐험대원이 되어 출동!'}</small>
          <b>${pick.emoji} ${esc(pick.title)}</b><i>${fresh ? esc(pick.hook) : '모든 모험을 끝냈어요! 다시 해서 ⭐을 모아 봐요.'}</i></span>
      </button>`;
  };

  return { views, homeCard };
};
