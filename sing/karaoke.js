// 노래 연습장: 🎶 반주 맞춰 부르기.
// 반주 파일은 이 기기 안(IndexedDB)에만 담아 두고, 어디로도 보내지 않는다.
'use strict';

// ---------- 반주 보관함 (IndexedDB) ----------
const SongDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('noidb')); return; }
      const r = indexedDB.open('sing-songs', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('songs', mode);
      const req = fn(t.objectStore('songs'));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  },
  all() { return this.run('readonly', (s) => s.getAll()); },
  get(id) { return this.run('readonly', (s) => s.get(id)); },
  put(song) { return this.run('readwrite', (s) => s.put(song)); },
  del(id) { return this.run('readwrite', (s) => s.delete(id)); },
};

let songs = null; // 목록 (화면용, 파일 내용 포함)
async function loadSongs() {
  try { songs = (await SongDB.all()).sort((a, b) => b.added - a.added); } catch { songs = []; }
  if (tab === 'karaoke' && $('#play').hidden) render();
}
const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');

function viewKaraoke() {
  if (songs === null) loadSongs();
  return `
    <div class="card"><h2>🎶 반주 맞춰 부르기</h2>
      <p>가지고 있는 반주 파일(MR, mp3·m4a 등)을 넣고 틀어 놓은 채로 따라 불러요. 내가 부르는 음이 그래프로 보이고, 반주랑 같이 녹음도 돼요.</p>
      <label class="big-btn file-btn">➕ 반주 파일 넣기<input type="file" id="song-file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.mp4" hidden></label>
      <p class="small muted" style="margin-top:10px">🎧 <b>이어폰을 끼고</b> 부르면 반주 소리가 마이크로 들어가지 않아 음 그래프가 정확해요. 반주 파일은 이 기기에만 저장돼요.</p>
    </div>
    ${songs === null ? '<p class="empty">불러오는 중…</p>' : songs.length ? songs.map((s) => `
      <div class="row song">
        <button type="button" class="song-main" data-act="sing-song" data-id="${s.id}"><span class="ico">🎵</span>
          <span class="txt"><b>${esc(s.name)}</b><small>${mmss(s.dur)}${s.lyrics ? ' · 📝 가사' : ''}</small></span><span class="go">▶</span></button>
        <button type="button" class="icon-btn" data-act="del-song" data-id="${s.id}" aria-label="${esc(s.name)} 지우기">🗑️</button>
      </div>`).join('') : '<p class="empty">아직 넣은 반주가 없어요 🎶</p>'}`;
}

function audioDuration(url) {
  return new Promise((res) => {
    const a = new Audio();
    const done = (v) => { a.removeAttribute('src'); res(v); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(null);
    setTimeout(() => done(NaN), 6000);
    a.src = url;
  });
}
async function addSong(file) {
  if (!file) return;
  if (file.size > 80 * 1024 * 1024) { toast('파일이 너무 커요 (80MB까지) 😢'); return; }
  const url = URL.createObjectURL(file);
  const dur = await audioDuration(url);
  URL.revokeObjectURL(url);
  if (dur === null) { toast('이 파일은 재생할 수 없어요 😢<br><span class="small">mp3나 m4a 파일로 해 봐요</span>'); return; }
  try {
    navigator.storage?.persist?.().catch(() => {});
    await SongDB.put({ name: file.name.replace(/\.[^.]+$/, '') || '반주', blob: file, type: file.type, dur: Number.isFinite(dur) ? dur : null, added: Date.now(), lyrics: '' });
    toast('반주를 넣었어요! ▶ 눌러서 불러 봐요 🎤');
  } catch {
    toast('저장할 자리가 없어요. 안 쓰는 반주를 지워 봐요');
  }
  loadSongs();
}

// ---------- 반주 틀고 부르기 ----------
async function exKaraoke(id) {
  Mic.ensureCtx(); // 아이폰: 버튼을 누른 그 순간에 깨워야 소리를 듣는다
  const song = await SongDB.get(id).catch(() => null);
  if (!song) { toast('반주를 찾을 수 없어요'); loadSongs(); return; }
  openPlay(`🎶 ${song.name}`);
  body(`
    <div class="kk-now"><b id="kk-note">🎤</b><span id="kk-sub">재생 ▶ 을 누르고 따라 불러요</span></div>
    <canvas class="roll kk" id="kk-roll"></canvas>
    <div class="kk-time"><span id="kk-cur">0:00</span>
      <div class="kk-seekwrap"><i class="ab-zone" id="kk-zone" hidden></i><input type="range" id="kk-seek" min="0" max="1000" value="0" aria-label="재생 위치"></div>
      <span id="kk-dur">${mmss(song.dur)}</span></div>
    <div class="kk-ctrl">
      <button type="button" class="icon-btn big" id="kk-back" aria-label="5초 뒤로">⏪</button>
      <button type="button" class="kk-play" id="kk-play" aria-label="재생">▶</button>
      <button type="button" class="icon-btn big" id="kk-fwd" aria-label="5초 앞으로">⏩</button>
    </div>
    <div class="kk-ab">
      <button type="button" class="chip" id="kk-a">🅰️ 여기부터</button>
      <button type="button" class="chip" id="kk-b">🅱️ 여기까지</button>
      <button type="button" class="chip" id="kk-off" hidden>🔁 구간 풀기</button>
    </div>
    <p class="small muted center" id="kk-abtext">어려운 부분만 반복하려면 🅰️ 🅱️ 를 눌러요</p>
    <div class="card kk-opts">
      <div class="setting"><span class="lbl">빠르기</span>
        <div class="seg" id="kk-speed">${[0.7, 0.85, 1].map((v) => `<button type="button" data-v="${v}" aria-pressed="${v === 1}">${v === 1 ? '보통' : v === 0.85 ? '조금 느리게' : '🐢 느리게'}</button>`).join('')}</div></div>
      <div class="setting"><span class="lbl">반주 소리</span><input type="range" id="kk-vol" min="0" max="100" value="80" aria-label="반주 소리 크기"></div>
    </div>
    <button type="button" class="big-btn rec-btn" id="kk-rec">🎙️ 반주랑 같이 녹음</button>
    <details class="card lyrics" id="kk-lyr-box"${song.lyrics ? ' open' : ''}>
      <summary>📝 가사 ${song.lyrics ? '' : '<span class="small muted">(붙여 넣어 두면 부르면서 볼 수 있어요)</span>'}</summary>
      <textarea id="kk-lyr" placeholder="가사를 붙여 넣어요">${esc(song.lyrics || '')}</textarea>
    </details>`);
  if (!(await needMic())) return;

  const ctx = Mic.ensureCtx();
  const url = URL.createObjectURL(song.blob);
  const el = new Audio(url);
  el.preload = 'auto';
  el.preservesPitch = true; el.webkitPreservesPitch = true; el.mozPreservesPitch = true; // 느리게 해도 음 높이는 그대로
  let src = null;
  try { src = ctx.createMediaElementSource(el); } catch { /* 섞어서 녹음만 안 된다 */ }
  const music = ctx.createGain();
  music.gain.value = 0.8;
  if (src) src.connect(music).connect(ctx.destination);
  else el.volume = 0.8;

  const roll = new Roll($('#kk-roll'), laneLabel);
  let { lo, hi } = range();
  lo -= 3; hi += 3;
  roll.setRange(lo, hi);
  const t = tol();
  const trace = [];
  let A = null, B = null, seeking = false, lastShown = 0;
  let rec = null, recDest = null, recChunks = [], recT0 = 0, recTrace = [];

  const playBtn = $('#kk-play');
  const setPlayIcon = () => { playBtn.textContent = el.paused ? '▶' : '⏸'; playBtn.setAttribute('aria-label', el.paused ? '재생' : '멈춤'); };
  const dur = () => (Number.isFinite(el.duration) ? el.duration : song.dur || 0);
  const play = () => { Mic.ensureCtx(); return el.play().catch(() => toast('재생할 수 없어요 😢')); };
  el.addEventListener('play', setPlayIcon);
  el.addEventListener('pause', setPlayIcon);
  el.addEventListener('loadedmetadata', () => {
    $('#kk-dur').textContent = mmss(el.duration);
    if (Number.isFinite(el.duration) && !song.dur) { song.dur = el.duration; SongDB.put(song).catch(() => {}); }
  });
  el.addEventListener('ended', () => {
    if (A != null && B == null) { el.currentTime = A; play(); return; } // 🅰️만 정했으면 끝까지 갔다가 다시
    if (rec) stopRec();
  });

  playBtn.onclick = () => (el.paused ? play() : el.pause());
  $('#kk-back').onclick = () => { el.currentTime = Math.max(0, el.currentTime - 5); };
  $('#kk-fwd').onclick = () => { el.currentTime = Math.min(dur(), el.currentTime + 5); };
  const seek = $('#kk-seek');
  seek.addEventListener('input', () => { seeking = true; $('#kk-cur').textContent = mmss((seek.value / 1000) * dur()); });
  seek.addEventListener('change', () => { el.currentTime = (seek.value / 1000) * dur(); seeking = false; });

  // 구간 반복
  const showAB = () => {
    const d = dur() || 1;
    const zone = $('#kk-zone');
    $('#kk-off').hidden = A == null && B == null;
    if (A == null && B == null) { zone.hidden = true; $('#kk-abtext').textContent = '어려운 부분만 반복하려면 🅰️ 🅱️ 를 눌러요'; return; }
    const a = A ?? 0, b = B ?? d;
    zone.hidden = false;
    zone.style.left = `${(a / d) * 100}%`;
    zone.style.width = `${Math.max(0.5, ((b - a) / d) * 100)}%`;
    $('#kk-abtext').textContent = B != null ? `🔁 ${mmss(a)} ~ ${mmss(b)} 구간을 반복해요` : `${mmss(a)}부터 시작해요. 🅱️ 로 끝을 정해요`;
  };
  $('#kk-a').onclick = () => { A = el.currentTime; if (B != null && B <= A + 1) B = null; showAB(); };
  $('#kk-b').onclick = () => {
    const now = el.currentTime;
    if (A == null) A = Math.max(0, now - 10);
    if (now <= A + 1) { toast('🅰️ 보다 뒤에서 눌러요'); return; }
    B = now; el.currentTime = A; showAB();
    if (el.paused) play();
  };
  $('#kk-off').onclick = () => { A = B = null; showAB(); };

  // 빠르기·소리
  $('#kk-speed').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    el.playbackRate = Number(b.dataset.v);
    $('#kk-speed').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  $('#kk-vol').addEventListener('input', (e) => {
    const v = (e.target.value / 100) ** 1.5;
    if (src) music.gain.setTargetAtTime(v, ctx.currentTime, 0.03); else el.volume = v;
  });

  // 가사 저장 (쓰고 잠깐 뒤에)
  let lyrTimer = 0;
  $('#kk-lyr').addEventListener('input', (e) => {
    clearTimeout(lyrTimer);
    lyrTimer = setTimeout(() => { song.lyrics = e.target.value; SongDB.put(song).catch(() => {}); }, 600);
  });

  // 녹음: 내 목소리 + 반주를 섞어서
  const recBtn = $('#kk-rec');
  const startRec = () => {
    if (!window.MediaRecorder) { toast('이 브라우저는 녹음을 지원하지 않아요 😢'); return; }
    try {
      recDest = ctx.createMediaStreamDestination();
      Mic.src.connect(recDest);
      if (src) music.connect(recDest);
      rec = new MediaRecorder(recDest.stream);
    } catch { toast('녹음을 시작할 수 없어요'); rec = null; return; }
    recChunks = []; recTrace = [];
    rec.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
    const r = rec, name = song.name, chunks = recChunks, tr = recTrace, t0 = nowS();
    r.onstop = () => {
      const type = r.mimeType || chunks[0]?.type || 'audio/webm';
      const d = new Date();
      recordings.unshift({ url: URL.createObjectURL(new Blob(chunks, { type })), type, dur: nowS() - t0, trace: tr, name: `🎶 ${name}`,
        at: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` });
    };
    rec.start();
    recT0 = t0;
    recBtn.classList.add('on');
    recBtn.textContent = '■ 녹음 멈추기';
    if (el.paused) play();
  };
  const stopRec = (quiet) => {
    if (!rec) return;
    if (rec.state === 'recording') rec.stop();
    try { Mic.src.disconnect(recDest); } catch { /* 무시 */ }
    try { if (src) music.disconnect(recDest); } catch { /* 무시 */ }
    rec = null; recDest = null;
    recBtn.classList.remove('on');
    recBtn.textContent = '🎙️ 반주랑 같이 녹음';
    if (!quiet) toast('녹음했어요! 📼 녹음 탭에서 들어 봐요');
  };
  recBtn.onclick = () => (rec ? stopRec() : startRec());

  Run.stopFns.push(() => {
    stopRec(true);
    el.pause();
    clearTimeout(lyrTimer);
    const ly = $('#kk-lyr');
    if (ly && ly.value !== (song.lyrics || '')) { song.lyrics = ly.value; SongDB.put(song).catch(() => {}); }
    songs = null; // 목록을 새로 읽는다 (가사·길이가 바뀌었을 수 있다)
    try { if (src) src.disconnect(); music.disconnect(); } catch { /* 무시 */ }
    el.removeAttribute('src');
    URL.revokeObjectURL(url);
  });

  frame((now) => {
    if (B != null && el.currentTime >= B) el.currentTime = A ?? 0;
    const r = hear(now);
    if (r.voiced) {
      const n = Math.round(r.midi), ok = Math.abs((r.midi - n) * 100) <= t;
      trace.push({ t: now, m: r.midi, ok });
      if (rec) recTrace.push({ t: now - recT0, m: r.midi, ok: false });
      if (r.midi < lo + 1 || r.midi > hi - 1) { lo = Math.min(lo, Math.floor(r.midi) - 2); hi = Math.max(hi, Math.ceil(r.midi) + 2); roll.setRange(lo, hi); }
      if (now - lastShown > 0.06) {
        lastShown = now;
        $('#kk-note').textContent = nm(n);
        $('#kk-note').classList.toggle('ok', ok);
        $('#kk-sub').textContent = nm2(n);
      }
    } else if (now - lastShown > 0.8) {
      $('#kk-note').classList.remove('ok');
      $('#kk-sub').textContent = rec ? '🔴 녹음 중' : el.paused ? '재생 ▶ 을 누르고 따라 불러요' : '🎵';
    }
    while (trace.length && trace[0].t < now - 8) trace.shift();
    roll.draw({ t0: now - 6, t1: now + 0.3, now, trace });
    const d = dur();
    if (!seeking && d) { seek.value = String(Math.round((el.currentTime / d) * 1000)); $('#kk-cur').textContent = mmss(el.currentTime); }
  });
}
