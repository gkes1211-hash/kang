// 👑 왕 카드 판과 카드 놀이 (시대 상세의 "왕" 탭)
// 데이터: data/rulers.js (H.rulers). app.js 가 H.rulerTab / H.rulerBind / H.rulerViews 를 불러 써요.
// 색칠: 놀이에서 (답을 보지 않고) 맞힌 왕은 S.kings['시대:묶음:번째'] = true 가 되어 카드에 색이 칠해져요.
window.H = window.H || {};
(() => {
  'use strict';
  const keyOf = (era, gi, ki) => `${era}:${gi}:${ki}`;
  // 데이터의 key(꼭 알아 둘 왕 표시)는 keyKing 으로, 카드 이름표는 key('시대:묶음:번째')로 바꿔 담아요
  const all = (era) => H.rulers[era].groups.flatMap((g, gi) => g.list.map((k, ki) => Object.assign({}, k, { key: keyOf(era, gi, ki), keyKing: !!k.key, group: g, gi, ki })));
  const colored = (api, era) => all(era).filter((k) => api.S.kings && api.S.kings[k.key]).length;
  const paint = (api, k) => { api.S.kings = api.S.kings || {}; if (!api.S.kings[k.key]) { api.S.kings[k.key] = true; api.save(); return true; } return false; };
  const sayLine = (k) => `${k.no} ${k.name}. ${k.line}`;

  // ---------------------------------------------------------------- 탭 화면
  const cardHTML = (api, k, opts = {}) => {
    const { esc } = api;
    const on = opts.all || (api.S.kings && api.S.kings[k.key]);
    return `<div class="kc ${k.keyKing ? 'key' : ''} ${on ? '' : 'gray'}" data-rk="${k.key}" role="button" tabindex="0" style="--kc:${k.group.color}">
      <span class="no">${esc(k.no)}</span><b>${esc(k.name)}</b><span class="em">${k.em}</span><p>${esc(k.line)}</p></div>`;
  };
  const withKey = (list) => list;

  H.rulerTab = (era, api) => {
    const R = H.rulers[era];
    const { esc } = api;
    if (R.kind === 'presidents') {
      const g = R.groups[0];
      return `<p class="muted">${esc(g.note)}. 업적 평가는 넣지 않았어요.</p>
        <div class="pres">${g.list.map((p) => `<div><span>${esc(p.no)}</span>${esc(p.name)}</div>`).join('')}</div>`;
    }
    const list = withKey(all(era));
    return `<div class="ksum"><span>🎨 색칠한 왕 <b>${colored(api, era)} / ${list.length}</b></span><button class="ghost" data-go="kingPrint" data-arg="${era}">🖨️ 인쇄용 한 장</button></div>
      <p class="muted small">카드를 누르면 뒤집혀요. 놀이에서 맞힌 왕은 색이 칠해져요. 🟧 테두리는 꼭 알아 둘 왕!</p>
      <div class="kgames">
        <button data-go="kingListen" data-arg="${era}">🔊 1대부터 듣기</button>
        ${R.rhyme ? `<button data-go="kingRhyme" data-arg="${era}">🎵 ${esc(R.rhyme[0].slice(0, 4))}…</button>` : ''}
        <button data-go="kingQuiz" data-arg="${era}">❓ 그림 보고 맞히기</button>
        <button data-go="kingOrder" data-arg="${era}">🃏 순서대로 놓기</button>
      </div>
      ${R.groups.map((g, gi) => `${R.groups.length > 1 ? `<h3 style="color:${g.color}">${g.emoji} ${esc(g.name)} <small class="muted">${esc(g.note)}</small></h3>` : ''}
        <div class="kgrid">${list.filter((k) => k.gi === gi).map((k) => cardHTML(api, k)).join('')}</div>`).join('')}`;
  };

  // 카드 뒤집기
  H.rulerBind = (era, api) => {
    const { esc, $app } = api;
    const list = withKey(all(era));
    const byKey = Object.fromEntries(list.map((k) => [k.key, k]));
    $app.querySelectorAll('.kc[data-rk]').forEach((el) => {
      const flip = (ev) => {
        if (ev.target.closest('[data-go]')) return;
        const k = byKey[el.dataset.rk];
        if (el.classList.contains('flip')) { el.outerHTML = cardHTML(api, k); H.rulerBind(era, api); return; }
        el.classList.add('flip');
        el.innerHTML = `<span class="no">${esc(k.no)}</span><b>${esc(k.name)}</b><small>${esc(k.years)}</small>
          <p>${k.em} ${esc(k.line)}</p>${(k.more || []).map((m) => `<p>· ${api.gloss(m)}</p>`).join('')}
          ${k.person ? `<button class="klink" data-go="person" data-arg="${k.person}">🧑 인물 카드</button>` : ''}
          ${k.adv ? `<button class="klink" data-go="adv" data-arg="${k.adv}">🎮 모험</button>` : ''}`;
      };
      el.onclick = flip;
      el.onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(ev); } };
    });
  };

  // ---------------------------------------------------------------- 놀이 화면들
  H.rulerViews = (api) => {
    const { esc, $app, header, go, toast, speak, hush, canSpeak, addStars, shuffle } = api;
    const back = (era) => `<button class="ghost" data-go="era" data-arg="${era}:rulers">👑 왕 카드 판으로</button>`;
    const title = (era) => `${api.eraById[era].emoji} ${esc(api.eraById[era].name)}`;
    const views = {};

    // 🔊 1대부터 듣기: 차례로 읽으며 그 카드에 불이 켜져요
    views.kingListen = (era) => {
      const list = all(era);
      let i = -1; let playing = false;
      const draw = () => {
        $app.innerHTML = `${header(`🔊 ${title(era)} 왕 듣기`)}
          <div class="listen">${list.map((k, n) => `<div class="lrow ${n === i ? 'on' : ''}" id="lr${n}" style="--kc:${k.group.color}"><span class="no">${esc(k.no)}</span><b>${esc(k.name)}</b><span class="em">${k.em}</span><span class="t">${esc(k.line)}</span></div>`).join('')}</div>
          <div class="sticky-act">${canSpeak ? `<button class="main" id="play">${playing ? '⏸ 멈추기' : (i < 0 ? '▶ 듣기 시작' : '▶ 이어 듣기')}</button>` : ''}<button class="ghost" id="step">다음 ▶</button>${back(era)}</div>`;
        const cur = document.getElementById(`lr${i}`); if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const play = document.getElementById('play');
        if (play) play.onclick = () => { if (playing) { playing = false; hush(); draw(); } else { playing = true; next(); } };
        document.getElementById('step').onclick = () => { playing = false; hush(); i = (i + 1) % list.length; draw(); if (canSpeak) speak(sayLine(list[i])); };
      };
      const next = () => {
        if (!playing) return;
        i++;
        if (i >= list.length) { playing = false; i = -1; draw(); toast('🎉 끝까지 들었어요!'); return; }
        draw();
        speak(sayLine(list[i]), () => setTimeout(next, 250));
      };
      draw();
    };

    // 🎵 앞 글자 외우기 + 🎲 빈칸 맞히기
    views.kingRhyme = (era) => {
      const R = H.rulers[era]; const list = all(era);
      let shown = -1; let quiz = null; let tries = 0;
      const chunks = []; let n = 0;
      R.rhyme.forEach((c) => { chunks.push([...c].map((ch) => ({ ch, k: list[n++] }))); });
      const newQuiz = () => {
        const idx = Math.floor(Math.random() * list.length);
        const right = [...R.rhyme.join('')][idx];
        const pool = [...new Set([...R.rhyme.join('')])].filter((c) => c !== right);
        quiz = { idx, right, opts: shuffle([right, ...shuffle(pool).slice(0, 2)]) };
        tries = 0;
      };
      const draw = (msg = '') => {
        let flat = 0;
        $app.innerHTML = `${header(`🎵 ${title(era)} 앞 글자`)}
          <p class="lead">왕 이름의 앞 글자를 리듬처럼 외워요. 글자를 누르면 그 왕이 나와요.</p>
          <div class="rhyme">${chunks.map((c) => `<div class="rline">${c.map((x) => { const at = flat++; const blank = quiz && at === quiz.idx;
            return `<button class="rch ${at === shown ? 'on' : ''} ${blank ? 'blank' : ''}" data-at="${at}">${blank ? '?' : esc(x.ch)}</button>`; }).join('')}</div>`).join('')}</div>
          ${shown >= 0 ? `<div class="rinfo"><b>${esc(list[shown].no)} ${esc(list[shown].name)}</b> ${list[shown].em} ${esc(list[shown].line)}</div>` : ''}
          ${quiz ? `<div class="card center"><b>🎲 빈칸에 들어갈 글자는?</b><div class="choices">${quiz.opts.map((o) => `<button class="choice" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>${msg ? `<div class="hintbox">${msg}</div>` : ''}</div>` : ''}
          <div class="nav2">${canSpeak ? '<button class="ghost" id="sing">🔊 리듬으로 읽기</button>' : ''}<button class="main" id="qz">🎲 ${quiz ? '다른 빈칸' : '빈칸 맞히기'}</button>${back(era)}</div>`;
        $app.querySelectorAll('.rch').forEach((b) => { b.onclick = () => { if (b.classList.contains('blank')) return; shown = Number(b.dataset.at); draw(); if (canSpeak) speak(sayLine(list[shown])); }; });
        const sing = document.getElementById('sing'); if (sing) sing.onclick = () => speak(R.rhyme.map((c) => [...c].join(' ')).join(', '));
        document.getElementById('qz').onclick = () => { newQuiz(); shown = -1; draw(); };
        $app.querySelectorAll('[data-o]').forEach((b) => {
          b.onclick = () => {
            const k = list[quiz.idx];
            if (b.dataset.o === quiz.right) {
              toast(tries ? '👍 맞았어요!' : '🎉 딱 맞았어요! ⭐ 1개'); if (!tries) addStars(1);
              shown = quiz.idx; quiz = null; draw();
            } else {
              tries++;
              if (tries === 1) draw(`🤔 다시 생각해 볼까? 이 자리는 <b>${esc(k.no)}</b> 왕이에요: ${k.em} ${esc(k.line)}`);
              else { toast(`정답은 "${quiz.right}" (${k.name})`); shown = quiz.idx; quiz = null; draw(); }
            }
          };
        });
      };
      draw();
    };

    // ❓ 그림 보고 맞히기: 힌트 → 보기 줄이기 → 답 보여 주기. 답을 안 보고 맞히면 색칠
    views.kingQuiz = (era) => {
      const list = withKey(all(era));
      const order = shuffle(list).sort((a, b) => (api.S.kings && api.S.kings[a.key] ? 1 : 0) - (api.S.kings && api.S.kings[b.key] ? 1 : 0));
      const qs = order.slice(0, Math.min(8, list.length));
      let q = 0; let got = 0; let painted = 0;
      const round = () => {
        const k = qs[q];
        const near = list.filter((x) => x.key !== k.key).sort((a, b) => (a.gi === k.gi ? 0 : 1) - (b.gi === k.gi ? 0 : 1) || Math.abs(a.ki - k.ki) - Math.abs(b.ki - k.ki));
        const opts = shuffle([k, ...shuffle(near.slice(0, 6)).slice(0, 3)]);
        let wrong = 0; let done = false; const out = new Set();
        const draw = (msg = '') => {
          $app.innerHTML = `${header(`❓ ${title(era)} 누구일까요?`)}
            <div class="prog"><span class="now">${q + 1} / ${qs.length}</span></div>
            <section class="kq" style="--kc:${k.group.color}">
              <span class="em">${k.em}</span>
              <p class="t">${esc(k.line)}</p>
              <small>${esc(k.group.name)} · ${esc(k.years)}</small>
            </section>
            ${msg ? `<div class="hintbox">${msg}</div>` : ''}
            <div class="choices four">${opts.map((o) => `<button class="choice ${out.has(o.key) ? 'no' : ''} ${done && o.key === k.key ? 'ok' : ''}" data-k="${o.key}" ${done || out.has(o.key) ? 'disabled' : ''}>${esc(o.no)} ${esc(o.name)}</button>`).join('')}</div>
            ${done ? `<div class="about"><b>${esc(k.no)} ${esc(k.name)}</b>${(k.more || []).map((m) => `<p>· ${api.gloss(m)}</p>`).join('')}</div><button class="main wide" id="nx">${q + 1 < qs.length ? '다음 ▶' : '결과 보기'}</button>` : ''}`;
          $app.querySelectorAll('.choice').forEach((b) => {
            b.onclick = () => {
              if (done) return;
              const o = b.dataset.k;
              if (o === k.key) {
                done = true; got++;
                if (wrong === 0) addStars(1);
                if (paint(api, k)) painted++;
                draw(wrong === 0 ? '🎉 딱 맞았어요! ⭐ 1개 · 카드에 색이 칠해졌어요' : '👍 맞았어요! 카드에 색이 칠해졌어요');
              } else {
                wrong++; out.add(o);
                if (wrong === 1) {
                  const prev = list.find((x) => x.gi === k.gi && x.ki === k.ki - 1);
                  const hint = H.rulers[era].groups.length > 1 ? `${k.group.name}의 ${k.no} 왕이에요` : (prev ? `${prev.no} ${prev.name} 다음 왕이에요` : '맨 처음 왕이에요');
                  draw(`🤔 다시 생각해 볼까? 힌트: ${esc(hint)}`);
                } else if (wrong === 2) {
                  // 보기 4개 중 틀린 2개가 지워져서 이제 둘 중 하나
                  draw('💡 남은 둘 중 하나예요!');
                } else {
                  done = true;
                  draw(`정답은 <b>${esc(k.no)} ${esc(k.name)}</b>! 다음에 다시 나올 거예요 (카드는 아직 회색)`);
                }
              }
            };
          });
          const nx = document.getElementById('nx');
          if (nx) nx.onclick = () => { q++; if (q < qs.length) round(); else end(); };
        };
        draw();
      };
      const end = () => {
        $app.innerHTML = `${header(`❓ ${title(era)} 누구일까요?`)}
          <section class="result"><div class="big-em">🎨</div><h1>${got} / ${qs.length} 맞혔어요!</h1>
          <p>새로 색칠한 왕 ${painted}명 · 지금 ${colored(api, era)} / ${list.length}명</p>
          <div class="nav2"><button class="main" data-go="kingQuiz" data-arg="${era}">🔁 한 번 더</button>${back(era)}</div></section>`;
      };
      round();
    };

    // 🃏 순서대로 놓기: 맞은 카드는 남고 틀린 카드만 내려와요 → 2번째엔 앞 글자 힌트 → 3번째엔 답 보여 주기
    views.kingOrder = (era) => {
      const R = H.rulers[era]; const list = all(era);
      let seq;
      if (R.groups.length > 1) {
        const gs = R.groups.map((g, gi) => gi).filter((gi) => R.groups[gi].list.length >= 3);
        const gi = gs[Math.floor(Math.random() * gs.length)];
        seq = list.filter((k) => k.gi === gi);
      } else {
        const n = Math.min(5, list.length);
        const s = Math.floor(Math.random() * (list.length - n + 1));
        seq = list.slice(s, s + n);
      }
      const N = seq.length;
      const items = shuffle(seq);
      let slots = Array(N).fill(null); let locked = Array(N).fill(false);
      let tries = 0; let finished = false; const firstOk = new Set();
      const draw = (msg = '') => {
        const left = items.filter((k) => !slots.includes(k.key));
        $app.innerHTML = `${header(`🃏 ${title(era)} 순서대로`)}
          <p class="lead">${R.groups.length > 1 ? `${esc(seq[0].group.name)}의 왕을` : `${esc(seq[0].no)}부터 ${esc(seq[N - 1].no)}까지`} 차례대로 놓아요.</p>
          ${msg ? `<div class="hintbox">${msg}</div>` : ''}
          <div class="oslots">${slots.map((key, i) => { const k = key && seq.find((x) => x.key === key);
            const st = finished ? (seq[i].key === key ? 'ok' : 'no') : (locked[i] ? 'ok' : '');
            return `<button class="oslot ${k ? 'full' : ''} ${st}" data-i="${i}" ${locked[i] || finished ? 'disabled' : ''}>
              <small>${tries >= 2 || finished ? esc(seq[i].no) + ' ' + esc(seq[i].name[0]) : `${i + 1}번째`}</small>${k ? `<span class="em">${k.em}</span><b>${esc(k.name)}</b>` : '<span class="empty">?</span>'}</button>`; }).join('')}</div>
          ${finished ? '' : `<div class="platform">${left.map((k) => `<button class="ticket" data-k="${k.key}"><span class="em">${k.em}</span>${esc(k.name)}</button>`).join('') || '<p class="muted">다 놓았어요! 확인해 볼까요?</p>'}</div>`}
          <div class="nav2">${finished ? `<button class="main" data-go="kingOrder" data-arg="${era}">🔁 다른 왕들로</button>${back(era)}`
            : `<button class="ghost" id="clr">↺ 다 내리기</button><button class="main" id="chk" ${slots.every(Boolean) ? '' : 'disabled'}>✅ 확인</button>`}</div>`;
        $app.querySelectorAll('.ticket').forEach((b) => { b.onclick = () => { const i = slots.indexOf(null); if (i >= 0) { slots[i] = b.dataset.k; draw(msg); } }; });
        $app.querySelectorAll('.oslot.full:not(:disabled)').forEach((b) => { b.onclick = () => { slots[Number(b.dataset.i)] = null; draw(msg); }; });
        const clr = document.getElementById('clr'); if (clr) clr.onclick = () => { slots = slots.map((s, i) => (locked[i] ? s : null)); draw(msg); };
        const chk = document.getElementById('chk'); if (chk) chk.onclick = check;
      };
      const check = () => {
        tries++;
        slots.forEach((key, i) => { if (key === seq[i].key) { if (tries === 1) firstOk.add(key); locked[i] = true; } });
        if (locked.every(Boolean)) {
          finished = true;
          const got = tries === 1 ? 3 : tries === 2 ? 2 : 1;
          addStars(got);
          let painted = 0; seq.forEach((k) => { if (firstOk.has(k.key) && paint(api, k)) painted++; });
          draw(`🎉 모두 맞았어요! ⭐ ${got}개${painted ? ` · 새로 색칠한 왕 ${painted}명` : ''}`);
          return;
        }
        if (tries >= 3) {
          finished = true; addStars(1);
          draw('정답 순서를 보여 줄게요! 빨간 칸이 헷갈렸던 자리예요. ⭐ 1개');
          return;
        }
        slots = slots.map((s, i) => (locked[i] ? s : null));
        const right = locked.filter(Boolean).length;
        draw(tries === 1 ? `🤔 ${right}개는 맞았어요! 맞은 카드는 남기고 틀린 카드만 내렸어요.` : '💡 힌트! 칸 위에 몇 대 왕인지와 이름 첫 글자를 보여 줄게요.');
      };
      draw();
    };

    // 🖨️ 인쇄용 한 장
    views.kingPrint = (era) => {
      const R = H.rulers[era]; const e = api.eraById[era];
      const list = withKey(all(era));
      $app.innerHTML = `${header('🖨️ 인쇄용 한 장')}
        <div class="no-print nav2"><button class="main" id="pr">🖨️ 인쇄하기</button>${back(era)}</div>
        <section class="poster" style="--kc:${e.color}">
          <h1>${e.emoji} ${esc(e.name)} 왕 ${R.groups.length > 1 ? '꼭 알아 둘 왕' : `${list.length}명`} 한 장 정리</h1>
          ${R.rhyme ? `<p class="rh">🎵 ${R.rhyme.map(esc).join(' · ')}</p>` : ''}
          ${R.groups.map((g, gi) => `${R.groups.length > 1 ? `<h2>${g.emoji} ${esc(g.name)}</h2>` : ''}<div class="pgrid">${list.filter((k) => k.gi === gi).map((k) => `<div class="pc2 ${k.keyKing ? 'key' : ''}" style="--kc:${g.color}"><span class="no">${esc(k.no)}</span> <b>${esc(k.name)}</b><span class="em">${k.em}</span><p>${esc(k.line)}</p><small>${esc(k.years)}</small></div>`).join('')}</div>`).join('')}
          <p class="foot">🧭 역사 탐험대 · 🟧 테두리는 꼭 알아 둘 왕</p>
        </section>`;
      document.getElementById('pr').onclick = () => window.print();
    };

    return views;
  };
})();
