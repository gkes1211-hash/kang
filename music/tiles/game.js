// 반짝 건반: 내려오는 타일을 박자에 맞춰 누르면 그 음이 울리는 리듬 게임.
// 소리는 모두 Web Audio로 기기 안에서 만든다(녹음 파일 없음).
(() => {
  'use strict';

  // ---------- 음 ----------
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (s) => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(s);
    if (!m) throw new Error('음 이름이 이상해요: ' + s);
    return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SOLFA = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
  // 음악 시간에 쓰는 음 이름 색(도 빨강, 레 주황, 미 노랑, 파 연두, 솔 초록, 라 보라, 시 분홍)
  const PCOLOR = ['#ff6b6b', '#ff6b6b', '#ffa14a', '#ffa14a', '#ffe05a', '#a6e85a', '#a6e85a', '#3fd6b0', '#3fd6b0', '#a596ff', '#a596ff', '#ff86c8'];
  const CHORDS = { C: [0, 4, 7], F: [5, 9, 12], G: [7, 11, 14], Am: [9, 12, 16], Dm: [2, 5, 9], Em: [4, 7, 11], D: [2, 6, 9], E: [4, 8, 11] };

  // ---------- 곡 ----------
  const CATS = [
    { id: 'kids', name: '동요', em: '🧸', about: '다 같이 부르는 어린이 노래', c: '#ffb36b' },
    { id: 'pop', name: '가요', em: '🎤', about: '가요 느낌으로 새로 지은 노래', c: '#ff86c8' },
    { id: 'classic', name: '멜로디', em: '🎻', about: '귀에 익은 클래식 멜로디', c: '#8fd6ff' },
  ];
  // mel: "음:박" (박을 빼면 1박, R은 쉼표), ch: 반주 화음 "화음:박" (N은 반주 쉼)
  const SONGS = [
    // ----- 동요 -----
    { id: 'star', cat: 'kids', title: '작은 별', about: '반짝반짝 작은 별, 아름답게 비치네', bpm: 92, level: 1,
      mel: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2',
      ch: 'C:2 C:2 F:2 C:2 F:2 C:2 G:2 C:2 C:2 F:2 C:2 G:2 C:2 F:2 C:2 G:2 C:2 C:2 F:2 C:2 F:2 C:2 G:2 C:2' },
    { id: 'plane', cat: 'kids', title: '떴다 떴다 비행기', about: '날아라 날아라 높이 높이 날아라', bpm: 100, level: 1,
      mel: 'E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4:2 D4 D4 E4 D4 C4:4',
      ch: 'C:4 C:4 G:4 C:4 C:4 C:4 G:4 C:4' },
    { id: 'nabi', cat: 'kids', title: '나비야', about: '나비야 나비야 이리 날아오너라', bpm: 104, level: 1,
      mel: 'G4 E4 E4:2 F4 D4 D4:2 C4 D4 E4 F4 G4 G4 G4:2 G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 E4 E4 E4:2 D4 D4 D4 D4 D4 E4 F4:2 E4 E4 E4 E4 E4 F4 G4:2 G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 C4:4',
      ch: 'C:4 G:4 C:4 C:4 C:4 G:4 C:4 C:4 G:4 G:4 C:4 C:4 C:4 G:4 C:4 C:4' },
    { id: 'bear', cat: 'kids', title: '곰 세 마리', about: '아빠 곰, 엄마 곰, 애기 곰', bpm: 100, level: 1,
      mel: 'C4 C4:0.5 C4:0.5 C4 C4 E4 G4:0.5 G4:0.5 E4 C4 G4:0.5 G4:0.5 E4 G4:0.5 G4:0.5 E4 C4 C4 C4:2 G4 G4 E4 C4 G4 G4 G4:2 G4 G4 E4 C4 G4 G4 G4:2 G4 G4 E4 C4 G4:0.5 G4:0.5 G4:0.5 A4:0.5 G4:2 C5:0.5 G4:0.5 C5:0.5 G4:0.5 E4:0.5 D4:0.5 C4:2',
      ch: 'C:4 C:4 C:4 C:4 C:4 C:4 C:4 C:4 C:4 C:4 C:2 G:1 C:2' },
    { id: 'london', cat: 'kids', title: '런던 다리', about: '런던 다리 무너진다 무너진다', bpm: 108, level: 2,
      mel: 'G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2 G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2 D4:2 G4:2 E4 C4:3',
      ch: 'C:4 C:4 G:4 C:4 C:4 C:4 G:4 C:4' },
    { id: 'farm', cat: 'kids', title: '맥도날드 할아버지 농장', about: '이 아이 이 아이 오', bpm: 112, level: 2,
      mel: 'C4 C4 C4 G3 A3 A3 G3:2 E4 E4 D4 D4 C4:3 G3 C4 C4 C4 G3 A3 A3 G3:2 E4 E4 D4 D4 C4:4',
      ch: 'C:4 F:2 C:2 C:2 G:2 C:4 C:4 F:2 C:2 C:2 G:2 C:4' },
    { id: 'jingle', cat: 'kids', title: '징글벨', about: '종소리 울려라 종소리 울려', bpm: 112, level: 2,
      mel: 'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 E4 D4 D4 E4 D4:2 G4:2 E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 G4 G4 F4 D4 C4:4',
      ch: 'C:4 C:4 C:4 C:4 F:4 C:4 G:4 G:4 C:4 C:4 C:4 C:4 F:4 C:4 G:4 C:4' },
    { id: 'bday', cat: 'kids', title: '생일 축하 노래', about: '세 박자 노래, 친구 생일에 쳐 줘요', bpm: 96, level: 2, meter: 3, off: 1,
      mel: 'G3:0.5 G3:0.5 A3 G3 C4 B3:2 G3:0.5 G3:0.5 A3 G3 D4 C4:2 G3:0.5 G3:0.5 G4 E4 C4 B3 A3 F4:0.5 F4:0.5 E4 C4 D4 C4:3',
      ch: 'C:1 C:3 G:3 G:3 C:3 C:3 F:3 C:1.5 G:1.5 C:3' },
    // ----- 가요 (이 게임을 위해 새로 지은 곡) -----
    { id: 'meteor', cat: 'pop', title: '별똥별 행진', about: '씩씩하게 걷는 행진곡', bpm: 116, level: 1,
      mel: 'C4 E4 G4 E4 A4 G4 E4:2 D4 E4 G4 A4 G4:4 A4 C5 A4 G4 E4 G4 D4:2 C4 D4 E4 G4 D4:4 C4 E4 G4 E4 A4 G4 E4:2 D4 E4 G4 A4 G4:4 A4 C5 A4 G4 E4 G4 D4 E4 G4 A4 G4 E4 C4:4',
      ch: 'C:4 Am:2 C:2 G:4 C:4 F:4 C:2 G:2 C:4 G:4 C:4 Am:2 C:2 G:4 C:4 F:4 C:2 G:2 C:4 C:4' },
    { id: 'sea', cat: 'pop', title: '여름 바다로', about: '창문 열고 달리는 신나는 여름 노래', bpm: 120, level: 2,
      mel: 'E4:0.5 G4:0.5 A4 G4:0.5 E4:0.5 C4 D4:0.5 E4:0.5 C4 A3:2 F4:0.5 A4:0.5 C5 A4:0.5 G4:0.5 F4 G4:3 R:1 E4:0.5 G4:0.5 C5 B4:0.5 A4:0.5 G4 A4:0.5 G4:0.5 E4 C4:2 D4:0.5 E4:0.5 F4 A4:0.5 G4:0.5 F4 E4:0.5 D4:0.5 C4:3 C5 C5:0.5 B4:0.5 A4 G4 A4:0.5 B4:0.5 C5 E5:2 D5 C5:0.5 A4:0.5 G4 E4 G4:2 R:2 C5 C5:0.5 B4:0.5 A4 G4 A4:0.5 B4:0.5 C5 E5:2 D5:0.5 C5:0.5 B4 D5:0.5 C5:0.5 B4 C5:4',
      ch: 'C:4 Am:4 F:4 G:4 C:4 Am:4 F:2 G:2 C:4 F:4 C:4 Dm:4 G:4 F:4 C:4 G:4 C:4' },
    { id: 'rain', cat: 'pop', title: '비 오는 날 우산', about: '창밖에 비가 오는 날의 잔잔한 노래', bpm: 92, level: 2,
      mel: 'A4 C5:0.5 B4:0.5 A4 E4 F4 A4:0.5 G4:0.5 F4:2 E4 G4:0.5 F4:0.5 E4 C4 D4:3 R:1 A4 C5:0.5 B4:0.5 A4 E4 F4 A4:0.5 B4:0.5 C5:2 B4:0.5 A4:0.5 G4 B4:0.5 A4:0.5 G4 A4:4 C5:1.5 B4:0.5 A4 C5 D5:1.5 C5:0.5 B4:2 C5 B4:0.5 A4:0.5 G4 E4 F4:2 G4:2 A4:1.5 G4:0.5 A4 C5 B4:1.5 A4:0.5 G4:2 A4:0.5 B4:0.5 C5 B4 G4 A4:4',
      ch: 'Am:4 F:4 C:4 G:4 Am:4 F:4 G:4 Am:4 F:4 G:4 C:4 F:2 G:2 F:4 G:4 F:2 G:2 Am:4' },
    { id: 'dance', cat: 'pop', title: '신나는 댄스 타임', about: '엇박자가 많은 빠른 댄스곡', bpm: 124, level: 3,
      mel: 'C5:0.5 C5:0.5 R:0.5 C5:0.5 B4:0.5 A4:0.5 G4 A4:0.5 A4:0.5 R:0.5 A4:0.5 G4:0.5 E4:0.5 D4 E4:0.5 G4:0.5 A4:0.5 C5:0.5 R:0.5 A4:0.5 G4 E4:0.5 D4:0.5 C4 R:2 C5:0.5 C5:0.5 R:0.5 C5:0.5 B4:0.5 A4:0.5 G4 A4:0.5 A4:0.5 R:0.5 A4:0.5 G4:0.5 E4:0.5 D4 E4:0.5 G4:0.5 A4:0.5 C5:0.5 R:0.5 D5:0.5 E5 D5:0.5 C5:0.5 C5:3 E5 D5:0.5 C5:0.5 R:0.5 C5:0.5 D5 E5:0.5 D5:0.5 C5 A4:2 G4:0.5 A4:0.5 C5:0.5 D5:0.5 R:0.5 E5:0.5 D5 C5:4 E5 D5:0.5 C5:0.5 R:0.5 C5:0.5 D5 E5:0.5 D5:0.5 C5 A4:2 G4:0.5 A4:0.5 C5:0.5 D5:0.5 R:0.5 E5:0.5 D5 C5:4',
      ch: 'C:4 Am:4 F:4 G:4 C:4 Am:4 F:4 G:2 C:2 C:4 Am:4 F:2 G:2 C:4 C:4 Am:4 F:2 G:2 C:4' },
    // ----- 멜로디 (옛 작곡가의 곡) -----
    { id: 'joy', cat: 'classic', title: '기쁨의 노래', about: '베토벤 · 교향곡 9번', bpm: 112, level: 1,
      mel: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2 D4 D4 E4 C4 D4 E4:0.5 F4:0.5 E4 C4 D4 E4:0.5 F4:0.5 E4 D4 C4 D4 G3:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2',
      ch: 'C:4 G:4 C:4 G:4 C:4 G:4 C:4 G:2 C:2 G:4 C:4 G:4 C:2 G:2 C:4 G:4 C:4 G:2 C:2' },
    { id: 'canon', cat: 'classic', title: '캐논', about: '파헬벨 · 긴 타일을 꾹 누르는 연습', bpm: 72, level: 2,
      mel: 'E5:2 D5:2 C5:2 B4:2 A4:2 G4:2 A4:2 B4:2 C5:2 B4:2 A4:2 G4:2 F4:2 E4:2 F4:2 D4:2 E4 G4 D4 G4 C4 E4 B3 E4 A3 C4 G3 C4 A3 C4 B3 D4 C4:4',
      ch: 'C:2 G:2 Am:2 Em:2 F:2 C:2 F:2 G:2 C:2 G:2 Am:2 Em:2 F:2 C:2 F:2 G:2 C:2 G:2 Am:2 Em:2 F:2 C:2 F:2 G:2 C:4' },
    { id: 'minuet', cat: 'classic', title: '미뉴에트 G장조', about: '바흐 · 안나 막달레나의 음악 노트', bpm: 100, level: 2, meter: 3,
      mel: 'D5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5 G4 G4 E5 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5 G4 G4 C5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4 C5:0.5 B4:0.5 A4:0.5 G4:0.5 F#4 G4:0.5 A4:0.5 B4:0.5 G4:0.5 A4:3 D5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5 G4 G4 E5 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5 G4 G4 C5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4 C5:0.5 B4:0.5 A4:0.5 G4:0.5 A4 B4:0.5 A4:0.5 G4:0.5 F#4:0.5 G4:3',
      ch: 'G:3 G:3 C:3 G:3 C:3 G:3 D:3 D:3 G:3 G:3 C:3 G:3 C:3 G:3 D:3 G:3' },
    { id: 'elise', cat: 'classic', title: '엘리제를 위하여', about: '베토벤 · 검은 건반 음이 나와요', bpm: 84, level: 3, meter: 3, off: 1,
      mel: 'E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 E4:0.5 G#4:0.5 B4:0.5 C5:1.5 E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 E4:0.5 C5:0.5 B4:0.5 A4:3',
      ch: 'N:1 N:3 Am:3 E:3 Am:3 N:3 Am:3 E:3 Am:3' },
    { id: 'turkish', cat: 'classic', title: '터키 행진곡', about: '모차르트 · 빠르고 신나는 곡', bpm: 84, level: 3,
      mel: 'B4:0.5 A4:0.5 G#4:0.5 A4:0.5 C5:2 D5:0.5 C5:0.5 B4:0.5 C5:0.5 E5:2 F5:0.5 E5:0.5 D#5:0.5 E5:0.5 B5:0.5 A5:0.5 G#5:0.5 A5:0.5 B5:0.5 A5:0.5 G#5:0.5 A5:0.5 C6:2 A5 C6 B5 A5 G5 A5 B5 A5 G5 A5 B5 A5 G5 F#5 E5:2',
      ch: 'Am:4 Am:4 Am:4 Am:4 Am:2 G:4 C:4 G:4 Em:2' },
  ];

  function parse(song) {
    const read = (str) => str.trim().split(/\s+/).map((tok) => { const [n, d] = tok.split(':'); return [n, d ? parseFloat(d) : 1]; });
    const notes = []; let b = 0;
    for (const [n, d] of read(song.mel)) { if (n !== 'R') notes.push({ m: midi(n), beat: b, dur: d }); b += d; }
    const chords = []; let cb = 0;
    for (const [n, d] of read(song.ch)) { chords.push({ name: n, beat: cb, dur: d }); cb += d; }
    return { notes, chords };
  }

  // ---------- 저장(이 기기 안에만) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('banjjak-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('banjjak-' + k, JSON.stringify(v)); } catch (e) { /* 저장 못 해도 게임은 된다 */ } },
  };
  const opt = Object.assign({ hearts: '3', band: 'on' }, store.get('opt', {}));
  if (!opt.diff) opt.diff = opt.speed === '1.25' ? 'normal' : 'easy'; // 예전 '빠르기' 설정을 새 난이도로 옮긴다
  delete opt.speed;
  // 난이도: 빠르기, 두 개 동시에 누르기가 나오는 간격(마디), 판정 너그러움(초: 최고·좋아요·괜찮아요)
  const DIFF = {
    easy: { name: '쉬움', sp: 1.0, every: 4, win: [0.07, 0.13, 0.2], tileTap: true },
    normal: { name: '보통', sp: 1.25, every: 2, win: [0.065, 0.12, 0.18], tileTap: true },
    hard: { name: '어려움', sp: 1.4, every: 1, win: [0.055, 0.1, 0.15], tileTap: false },
  };
  if (!DIFF[opt.diff]) opt.diff = 'easy';
  let selId = store.get('song', 'star');
  if (!SONGS.some((x) => x.id === selId)) selId = 'star';
  let cat = null; // 처음에는 갈래(동요·가요·멜로디)부터 고른다
  const curSong = () => SONGS.find((x) => x.id === selId) || SONGS[0];
  const best = store.get('best', {});

  // ---------- 소리 ----------
  let ac = null, master = null;
  function ensureAudio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      const comp = ac.createDynamicsCompressor();
      master = ac.createGain(); master.gain.value = 0.9;
      master.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function newBus() { const b = ac.createGain(); b.connect(master); return b; }

  // 건반 소리: 삼각파에 배음을 조금 섞고, 치자마자 밝았다가 차츰 어두워진다
  function pluck(bus, m, t, vol, len) {
    const f = hz(m);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.2), t + Math.min(len, 1.2));
    for (const [h, type, a] of [[1, 'triangle', 1], [2, 'sine', 0.3], [3, 'sine', 0.1], [4.01, 'sine', 0.05]]) {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = f * h;
      const og = ac.createGain(); og.gain.value = a;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + len + 0.05);
    }
    lp.connect(g); g.connect(bus);
    return g;
  }
  function pad(bus, name, t, dur) {
    const iv = CHORDS[name] || CHORDS.C;
    for (const i of iv) {
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(48 + i);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.3, dur * 0.9));
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  // ---------- 배경 밴드: 베이스, 펼친 화음, 드럼 ----------
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ac.createBufferSource(); s.buffer = noiseBuf; return s;
  }
  function env(bus, t, peak, dec) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    g.connect(bus); return g;
  }
  function kick(bus, t) {
    const o = ac.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(env(bus, t, 0.45, 0.22)); o.start(t); o.stop(t + 0.25);
  }
  function snare(bus, t, v) {
    const s = noise(), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
    s.connect(f); f.connect(env(bus, t, v, 0.14)); s.start(t); s.stop(t + 0.16);
  }
  function hat(bus, t, v) {
    const s = noise(), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    s.connect(f); f.connect(env(bus, t, v, 0.04)); s.start(t); s.stop(t + 0.06);
  }
  function bassNote(bus, m, t, d) {
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    o.connect(lp); lp.connect(env(bus, t, 0.28, Math.max(0.2, d))); o.start(t); o.stop(t + d + 0.05);
  }
  function arpNote(bus, m, t) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m);
    o.connect(env(bus, t, 0.07, 0.35)); o.start(t); o.stop(t + 0.4);
  }
  // 배경 멜로디 1: 곡의 노래 선율을 부드러운 피리 소리로 (내가 누르는 건반 소리 밑에 깔린다)
  function flute(bus, m, t, d) {
    const f = hz(m), len = Math.max(0.15, d * 0.92);
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    const vib = ac.createOscillator(); vib.frequency.value = 5.2;
    const vg = ac.createGain(); vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const g2 = ac.createGain(); g2.gain.value = 0.25; o2.connect(g2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.085, t + 0.05);
    g.gain.setValueAtTime(0.085, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08);
    o.connect(g); g2.connect(g); g.connect(bus);
    for (const x of [o, o2, vib]) { x.start(t); x.stop(t + len + 0.12); }
  }
  // 배경 멜로디 2: 높은 현악기 소리가 화음을 따라 천천히 움직인다
  function strings(bus, m, t, d) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.028, t + Math.min(0.25, d * 0.3));
    g.gain.setValueAtTime(0.028, t + d * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15);
    for (const det of [-6, 6]) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + d + 0.2);
    }
    lp.connect(g); g.connect(bus);
  }
  function backMelody(g) {
    const ns = G.notes;
    while (G.mi < ns.length && ns[G.mi].t <= g + 0.3) {
      const n = ns[G.mi++];
      if (n.mate || n.t + n.d * 0.5 < g) continue;
      flute(G.bus, n.m, Math.max(ac.currentTime, at(n.t)), n.d);
    }
    while (G.ci < G.chords.length && G.chords[G.ci].t <= g + 0.3) {
      const c = G.chords[G.ci++];
      if (c.name === 'N' || !CHORDS[c.name] || c.t + c.d < g) continue;
      // 바로 앞 음과 가장 가까운 화음 음으로 부드럽게 이어 간다
      let bestM = 76, bd = 99;
      for (let m = 69; m <= 81; m++) {
        if (!CHORDS[c.name].some((i) => i % 12 === m % 12)) continue;
        const dd = Math.abs(m - G.strM);
        if (dd < bd) { bd = dd; bestM = m; }
      }
      G.strM = bestM;
      strings(G.bus, bestM, Math.max(ac.currentTime, at(c.t)), c.d);
    }
  }
  function band(g) {
    backMelody(g);
    const spb = G.spb, half = spb / 2;
    while (G.hb * 0.5 < G.endBeats && G.hb * half <= g + 0.3) {
      const beat = G.hb * 0.5, k = G.hb; G.hb++;
      if (beat * spb + half < g) continue; // 멈췄다 다시 할 때 지난 박은 건너뛴다
      const c = chordAt(G.chordsB, beat);
      if (!c || c.name === 'N' || !CHORDS[c.name]) continue;
      const t = Math.max(ac.currentTime, at(beat * spb));
      const iv = CHORDS[c.name], root = iv[0] % 12;
      const rel = ((beat - G.off) % G.meter + G.meter) % G.meter, onBeat = Math.abs(beat - Math.round(beat)) < 1e-6;
      const drums = G.song.cat !== 'classic';
      // 펼친 화음(낮은 자리): 1-3-5-3
      const tones = iv.map((i) => 48 + (i % 12)).sort((a, b) => a - b);
      arpNote(G.bus, tones[[0, 1, 2, 1][k % 4]], t);
      if (onBeat) {
        const r = Math.round(rel);
        if (r === 0) bassNote(G.bus, 36 + root, t, spb * 0.9);
        else if (G.meter === 4 && r === 2) bassNote(G.bus, 36 + ((root + 7) % 12) - (root + 7 >= 12 ? 0 : 0), t, spb * 0.9);
        if (drums) {
          if (r === 0 || (G.meter === 4 && r === 2)) kick(G.bus, t);
          if ((G.meter === 4 && (r === 1 || r === 3)) || (G.meter === 3 && r > 0)) snare(G.bus, t, G.meter === 3 ? 0.06 : 0.12);
        }
      }
      if (drums) hat(G.bus, t, onBeat ? 0.05 : 0.03);
    }
  }
  function tick(bus, t, hi) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hi ? 1568 : 1046;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.1);
  }
  function thud(bus) {
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const g = ac.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.16);
  }

  function chime(bus, m) { // 끝까지 누르면 한 옥타브 위에서 반짝
    const t = ac.currentTime;
    pluck(bus, m + 12, t, 0.22, 0.6); pluck(bus, m + 19, t + 0.08, 0.16, 0.6);
  }
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* 진동 없는 기기 */ } };

  // ---------- 화면 ----------
  const $ = (s) => document.querySelector(s);
  const cv = $('#board'), cx = cv.getContext('2d');
  let W = 0, H = 0, boardX = 0, boardW = 0, laneW = 0, hitY = 0;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // 보이는 화면 크기. 폰에서 가로가 넓게 잡히는 경우를 막으려고 가장 작은 값을 쓴다
    const de = document.documentElement, vv = window.visualViewport;
    W = Math.round(Math.min(window.innerWidth, de.clientWidth || 1e9, vv ? vv.width * (vv.scale || 1) : 1e9));
    H = Math.round(Math.min(window.innerHeight, de.clientHeight || 1e9, vv ? vv.height * (vv.scale || 1) : 1e9));
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; // 화면에 보이는 크기는 CSS 픽셀로 고정(폰에서 2~3배로 커지지 않게)
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boardW = Math.min(W, 480); boardX = (W - boardW) / 2; laneW = boardW / 4;
    const sab = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    hitY = H - sab - Math.max(84, Math.min(130, H * 0.15));
  }
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  let FAM = getComputedStyle(document.body).fontFamily;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { FAM = getComputedStyle(document.body).fontFamily; });
  const STARS = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6 }));
  const fineMouse = window.matchMedia && matchMedia('(pointer: fine)').matches;
  let keyboardUsed = fineMouse;

  // ---------- 게임 상태 ----------
  let PERF = 0.07, GOOD = 0.13, OK = 0.2;
  let state = 'menu'; // menu | play | paused | resume | end
  let G = null;
  let perf0 = 0, audio0 = 0, pausedAt = null, resumeT0 = 0;
  const pnow = () => performance.now() / 1000;
  const gnow = () => (pausedAt !== null ? pausedAt : pnow() - perf0);
  const at = (g) => audio0 + g;

  function buildRun(song) {
    const D = DIFF[opt.diff];
    [PERF, GOOD, OK] = D.win;
    const sp = D.sp;
    const spb = 60 / (song.bpm * sp);
    const p = parse(song);
    let prevLane = 1, prevM = null;
    const notes = p.notes.map((n) => {
      let lane = 1;
      if (prevM !== null) {
        // 음이 올라가면 오른쪽, 내려가면 왼쪽으로. 같은 음은 두 칸 건너뛴다. 바로 앞 타일과 같은 줄은 피한다.
        const d = n.m - prevM;
        const step = d === 0 ? 2 : Math.sign(d) * (Math.abs(d) >= 5 ? 2 : 1);
        lane = prevLane + step;
        if (lane < 0 || lane > 3) lane = prevLane - step;
        lane = Math.max(0, Math.min(3, lane));
        if (lane === prevLane) lane = (prevLane + 2) % 4;
      }
      prevLane = lane; prevM = n.m;
      return { m: n.m, lane, beat: n.beat, dur: n.dur, t: n.beat * spb, d: n.dur * spb, hold: n.dur >= 2, hit: false, miss: false, holding: false, hitAt: 0, endAt: 0, voice: null, earned: 0, full: false };
    });
    addPairs(song, p, notes, D);
    notes.sort((a, b) => a.t - b.t || (a.mate ? 1 : 0) - (b.mate ? 1 : 0));
    const last = notes.reduce((a, n) => (n.t + n.d > a.t + a.d ? n : a), notes[0]);
    const meter = song.meter || 4, off = song.off || 0;
    return {
      meter, off, chordsB: p.chords, hb: 0, mi: 0, ci: 0, strM: 76, endBeats: p.chords.reduce((a, c) => a + c.dur, 0),
      song, sp, spb, notes,
      chords: p.chords.map((c) => ({ name: c.name, t: c.beat * spb, d: c.dur * spb, sched: false })),
      lead: 4 * spb, end: last.t + last.d,
      travel: 2.0 / Math.pow(sp, 0.6),
      score: 0, combo: 0, maxCombo: 0, pts: 0,
      hearts: opt.hearts === '3' ? 3 : Infinity,
      counts: { p: 0, g: 0, o: 0, m: 0 },
      scan: 0, ticks: -4, judge: null, flash: [null, null, null, null], laneCol: ['#fff', '#fff', '#fff', '#fff'], parts: [], rips: [], over: false,
      holds: notes.filter((n) => n.hold).length, holdsFull: 0, diff: D,
      bus: newBus(),
    };
  }

  // 두 개 동시에: 마디 첫 박(어려움은 마디 가운데도)에 화음 음 타일을 하나 더 놓는다
  function chordAt(chords, beat) {
    for (const c of chords) if (beat >= c.beat - 1e-6 && beat < c.beat + c.dur - 1e-6) return c;
    return null;
  }
  function addPairs(song, p, notes, D) {
    const meter = song.meter || 4, off = song.off || 0;
    const mains = notes.slice();
    for (const n of mains) {
      if (n.dur < 1) continue;
      const rel = n.beat - off;
      if (Math.abs(rel - Math.round(rel)) > 1e-6 || rel < 0) continue;
      const bar = Math.floor(rel / meter), pos = Math.round(rel) % meter;
      const ok = (pos === 0 && bar % D.every === 0) || (D.every === 1 && meter === 4 && pos === 2 && bar % 2 === 1);
      if (!ok) continue;
      const c = chordAt(p.chords, n.beat);
      if (!c || !CHORDS[c.name]) continue;
      // 멜로디보다 낮은 화음 음 중 가장 가까운 것
      let pm = null;
      for (let m = n.m - 3; m >= 48 && pm === null; m--) if (CHORDS[c.name].some((i) => i % 12 === m % 12) && m % 12 !== n.m % 12) pm = m;
      if (pm === null) continue;
      const lanes = [0, 1, 2, 3].filter((l) => l !== n.lane).sort((a, b) => Math.abs(b - n.lane) - Math.abs(a - n.lane));
      const free = lanes.find((l) => !notes.some((o) => o.lane === l && o.t < n.t + n.d + 0.05 && o.t + o.d > n.t - 0.05));
      if (free === undefined) continue;
      notes.push(Object.assign({}, n, { m: pm, lane: free, mate: n }));
    }
  }

  // ---------- 메뉴 ----------
  const songsEl = $('#songs');
  $('#legend').innerHTML = [0, 2, 4, 5, 7, 9, 11].map((pc) => `<i style="--c:${PCOLOR[pc]}">${SOLFA[pc]}</i>`).join('');
  function starText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
  const catsEl = $('#cats');
  function renderCats() {
    catsEl.innerHTML = CATS.map((c) => {
      const list = SONGS.filter((x) => x.cat === c.id);
      const stars = list.reduce((a, x) => a + (best[x.id] ? best[x.id].stars : 0), 0);
      return `<button type="button" class="cat" data-cat="${c.id}" style="--c:${c.c}">
        <span class="em" aria-hidden="true">${c.em}</span>
        <span class="tx"><b>${c.name}</b><small>${c.about}</small></span>
        <span class="n">${list.length}곡<br>★ ${stars}/${list.length * 3}</span></button>`;
    }).join('');
  }
  function showView() {
    show('#catView', !cat); show('#songView', !!cat);
    if (cat) {
      const c = CATS.find((x) => x.id === cat);
      $('#catName').textContent = c.em + ' ' + c.name;
      $('#catName').style.color = c.c;
      renderSongs();
    } else renderCats();
  }
  catsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.cat'); if (!b) return;
    cat = b.dataset.cat;
    if (curSong().cat !== cat) { selId = SONGS.find((x) => x.cat === cat).id; store.set('song', selId); }
    showView();
    $('#menu').scrollTop = 0;
  });
  $('#catBack').addEventListener('click', () => { cat = null; showView(); });
  function renderSongs() {
    songsEl.innerHTML = SONGS.filter((x) => x.cat === cat).map((s) => {
      const b = best[s.id], on = s.id === selId;
      return `<button type="button" class="song${on ? ' on' : ''}" data-id="${s.id}" aria-pressed="${on}">
        <b>${s.title}</b><span class="lv" aria-label="어려움 ${s.level}">${'●'.repeat(s.level)}${'○'.repeat(3 - s.level)}</span>
        <small>${s.about}</small><span class="best">${b ? starText(b.stars) + ' ' + b.score : ''}</span></button>`;
    }).join('');
  }
  songsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.song'); if (!b) return;
    selId = b.dataset.id; store.set('song', selId); renderSongs();
    ensureAudio();
    if (ac) { // 고른 곡의 첫 소절을 살짝 들려준다
      const song = curSong(), p = parse(song), spb = 60 / song.bpm, bus = newBus(), t0 = ac.currentTime + 0.05;
      p.notes.slice(0, 4).forEach((n) => pluck(bus, n.m, t0 + n.beat * spb, 0.3, 0.7));
      setTimeout(() => bus.disconnect(), 4000);
    }
  });
  function renderOpts() {
    document.querySelectorAll('.seg').forEach((seg) => {
      const k = seg.dataset.opt;
      seg.querySelectorAll('button').forEach((b) => { const on = b.dataset.val === opt[k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    });
  }
  document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    opt[seg.dataset.opt] = b.dataset.val; store.set('opt', opt); renderOpts();
  }));
  showView(); renderOpts();
  const ver = document.getElementById('ver');
  const showVer = () => { if (ver) ver.textContent = `버전 6 · 화면 ${W}×${H}`; };
  showVer(); window.addEventListener('resize', showVer);

  // ---------- 화면 전환 ----------
  function show(id, on) { $(id).hidden = !on; }
  let wakeLock = null;
  async function lockScreen() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { wakeLock = null; } }
  function unlockScreen() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* 무시 */ } wakeLock = null; }

  function stopRun() {
    if (G) { try { G.bus.disconnect(); } catch (e) { /* 이미 끊김 */ } }
    G = null; pausedAt = null;
    activeLanes.clear();
  }
  function startSong() {
    ensureAudio();
    if (!ac) { alertNoAudio(); return; }
    stopRun();
    G = buildRun(curSong());
    if (ac.state === 'suspended') ac.resume();
    perf0 = pnow() + G.lead + 0.15; audio0 = ac.currentTime + G.lead + 0.15;
    state = 'play';
    show('#menu', false); show('#pause', false); show('#result', false); show('#hud', true);
    $('#hudTitle').textContent = G.song.title + ' · ' + G.diff.name;
    updateHud();
    lockScreen();
  }
  function alertNoAudio() { $('.tip').textContent = '이 브라우저는 소리를 낼 수 없어서 게임을 시작할 수 없어요. 다른 브라우저로 열어 주세요.'; }
  function toMenu() {
    stopRun(); state = 'menu';
    if (ac && ac.state === 'suspended') ac.resume();
    show('#hud', false); show('#pause', false); show('#result', false); show('#menu', true);
    showView(); unlockScreen();
  }
  function pauseGame() {
    if (state !== 'play' || !G) return;
    pausedAt = gnow();
    for (const n of G.notes) if (n.holding) finishHold(n, pausedAt);
    activeLanes.clear();
    if (ac) ac.suspend();
    state = 'paused'; show('#pause', true);
  }
  function resumeGame() {
    if (state !== 'paused') return;
    show('#pause', false); state = 'resume'; resumeT0 = pnow();
  }
  $('#startBtn').addEventListener('click', startSong);
  $('#againBtn').addEventListener('click', startSong);
  $('#restartBtn2').addEventListener('click', startSong);
  $('#menuBtn').addEventListener('click', toMenu);
  $('#menuBtn2').addEventListener('click', toMenu);
  $('#pauseBtn').addEventListener('click', pauseGame);
  $('#resumeBtn').addEventListener('click', () => { ensureAudio(); resumeGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  // ---------- 판정 ----------
  const JUDGE = {
    p: { text: '최고!', color: '#ffe27a', pts: 3 },
    g: { text: '좋아요!', color: '#8fe3ff', pts: 2 },
    o: { text: '괜찮아요', color: '#c9b8ff', pts: 1 },
    m: { text: '놓쳤어요', color: '#ff7a8a', pts: 0 },
  };
  function setJudge(text, color) { G.judge = { text, color, t: pnow() }; }
  function laneCenter(l) { return boardX + laneW * l + laneW / 2; }

  function press(lane, y) {
    if (state !== 'play' || !G || G.over) return;
    const g = gnow();
    let pick = null, bd = 1e9;
    for (let i = G.scan; i < G.notes.length; i++) {
      const n = G.notes[i];
      if (n.t - g > OK) break;
      if (n.hit || n.miss || n.lane !== lane) continue;
      const d = Math.abs(n.t - g);
      if (d <= OK && d < bd) { bd = d; pick = n; }
    }
    if (!pick && y != null && g >= 0 && G.diff.tileTap) {
      // 선에 닿기 전이라도 그 줄의 다음 타일 자체를 손가락으로 누르면 인정한다(점수는 '괜찮아요')
      const pps = (hitY + 30) / G.travel;
      for (let i = G.scan; i < G.notes.length; i++) {
        const n = G.notes[i];
        if (n.hit || n.miss || n.lane !== lane) continue;
        const bottom = hitY - (n.t - g) * pps, top = bottom - Math.max(46, n.d * pps - 6);
        if (y >= top - 24 && y <= bottom + 24 && n.t - g < 1.2) { pick = n; bd = OK; }
        break; // 그 줄에서 가장 먼저 올 타일만 본다
      }
    }
    if (!pick) {
      // 빈 곳을 눌러도 꾸중하지 않는다: 줄만 살짝 빛난다
      G.flash[lane] = { t: pnow(), bad: false, soft: true };
      return;
    }
    const kind = bd <= PERF ? 'p' : bd <= GOOD ? 'g' : 'o';
    const J = JUDGE[kind];
    G.counts[kind]++; G.pts += J.pts; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.score += J.pts * 100 + Math.min(G.combo, 30) * 5;
    pick.hit = true; pick.hitAt = g;
    pick.voice = pluck(G.bus, pick.m, ac.currentTime, pick.mate ? 0.34 : 0.5, pick.hold ? pick.d + 0.35 : 1.1);
    if (pick.hold) pick.holding = true; else pick.endAt = g;
    const col = PCOLOR[pick.m % 12];
    G.flash[lane] = { t: pnow(), bad: false };
    G.laneCol[lane] = col;
    G.rips.push({ x: laneCenter(lane), t: pnow(), c: col });
    burst(laneCenter(lane), hitY, col, 16);
    buzz(pick.hold ? 18 : 12);
    setJudge(J.text, J.color);
    updateHud();
  }
  function release(lane) {
    if (!G) return;
    const g = gnow();
    for (const n of G.notes) if (n.holding && n.lane === lane) finishHold(n, g);
  }
  // 긴 타일: 누르고 있는 동안 1박마다 50점씩 쌓이고, 끝까지 누르면 길이만큼 큰 보너스
  function holdTick(n, g) {
    const held = Math.max(0, Math.min(g, n.t + n.d) - n.t);
    const want = Math.floor((held / G.spb) * 50);
    if (want > n.earned) { G.score += want - n.earned; n.earned = want; updateHud(); }
  }
  function finishHold(n, g) {
    holdTick(n, g);
    const left = n.t + n.d - g;
    const full = left <= 0.15 || (g - n.t) / n.d >= 0.93;
    n.holding = false; n.endAt = g;
    if (full) {
      const bonus = Math.round(n.d / G.spb) * 100 + 100;
      G.score += bonus; G.holdsFull++; n.full = true;
      setJudge('끝까지 꾹! +' + bonus, '#ffe27a');
      burst(laneCenter(n.lane), hitY, '#ffe27a', 28);
      G.rips.push({ x: laneCenter(n.lane), t: pnow(), c: '#ffe27a', big: true });
      buzz([20, 40, 30]);
      if (ac) chime(G.bus, n.m);
    } else {
      if (n.voice && ac) {
        const t = ac.currentTime;
        try { n.voice.gain.cancelScheduledValues(t); n.voice.gain.setTargetAtTime(0.0001, t, 0.05); } catch (e) { /* 무시 */ }
      }
      if (state === 'play') setJudge('조금만 더 꾹~', '#8fe3ff');
    }
    updateHud();
  }
  function doMiss(n) {
    n.miss = true; G.counts.m++; G.combo = 0;
    setJudge(JUDGE.m.text, JUDGE.m.color);
    if (G.hearts !== Infinity) {
      G.hearts--;
      const hud = $('#hud'); hud.classList.remove('shake'); void hud.offsetWidth; hud.classList.add('shake');
      if (G.hearts <= 0) { updateHud(); finish(false); return; }
    }
    updateHud();
  }
  function finish(clear) {
    if (G.over) return;
    G.over = true; state = 'end';
    for (const n of G.notes) if (n.holding) finishHold(n, gnow());
    const N = G.notes.length, acc = G.pts / (3 * N);
    const stars = !clear ? 0 : acc >= 0.9 ? 3 : acc >= 0.72 ? 2 : 1;
    const id = G.song.id, prev = best[id];
    const isNew = clear && (!prev || G.score > prev.score);
    if (clear) {
      best[id] = { stars: Math.max(stars, prev ? prev.stars : 0), score: Math.max(G.score, prev ? prev.score : 0) };
      store.set('best', best);
    }
    const done = G.notes.filter((n) => n.hit || n.miss).length;
    $('#resTitle').textContent = clear ? (stars === 3 ? '완벽해요!' : '끝까지 쳤어요!') : '아쉬워요!';
    $('#resStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('#resScore').innerHTML = `${G.score}${isNew ? '<small>새 최고 점수!</small>' : ''}`;
    $('#resCounts').innerHTML = [['p', '최고'], ['g', '좋아요'], ['o', '괜찮아요'], ['m', '놓침']]
      .map(([k, l]) => `<div><b>${G.counts[k]}</b><span>${l}</span></div>`).join('');
    $('#resNote').textContent = clear
      ? `가장 긴 콤보 ${G.maxCombo} · 정확도 ${Math.round(acc * 100)}%` + (G.holds ? ` · 끝까지 꾹 ${G.holdsFull}/${G.holds}` : '')
      : `${Math.round((done / N) * 100)}%까지 쳤어요. '끝까지 연습'을 켜면 하트 없이 칠 수 있어요.`;
    setTimeout(() => { if (state === 'end') { show('#hud', false); show('#result', true); unlockScreen(); } }, clear ? 900 : 700);
  }
  function updateHud() {
    if (!G) return;
    $('#hudScore').textContent = G.score;
    $('#hudHearts').textContent = G.hearts === Infinity ? '연습' : '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(3 - Math.max(0, G.hearts));
  }

  // ---------- 입력 ----------
  const activeLanes = new Map(); // 손가락/키 → 줄
  const laneAt = (x) => Math.max(0, Math.min(3, Math.floor((x - boardX) / laneW)));
  function down(id, x, y) {
    if (state !== 'play') return;
    if (ac && ac.state === 'suspended') ac.resume(); // 아이폰은 소리가 잠들어 있을 수 있다
    const lane = laneAt(x);
    activeLanes.set(id, lane);
    press(lane, y);
  }
  const lift = (id) => {
    if (!activeLanes.has(id)) return;
    const lane = activeLanes.get(id); activeLanes.delete(id);
    for (const l of activeLanes.values()) if (l === lane) return; // 같은 줄을 다른 손가락이 아직 누르고 있다
    release(lane);
  };
  // 손가락은 터치 이벤트로 받는다(폰에서 가장 확실하다). 마우스·펜은 포인터 이벤트로.
  cv.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) down('t' + t.identifier, t.clientX, t.clientY);
  }, { passive: false });
  ['touchend', 'touchcancel'].forEach((ev) => cv.addEventListener(ev, (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) lift('t' + t.identifier);
  }, { passive: false }));
  cv.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    down('p' + e.pointerId, e.clientX, e.clientY);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => cv.addEventListener(ev, (e) => { if (e.pointerType !== 'touch') lift('p' + e.pointerId); }));
  const KEYS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); return; }
    if (!(e.code in KEYS) || e.repeat) return;
    keyboardUsed = true;
    activeLanes.set('k' + e.code, KEYS[e.code]);
    press(KEYS[e.code]);
  });
  window.addEventListener('keyup', (e) => { if (e.code in KEYS) lift('k' + e.code); });
  window.addEventListener('blur', () => { for (const id of [...activeLanes.keys()]) lift(id); });

  // ---------- 진행 ----------
  function update(g) {
    // 시작 전 네 번 똑딱
    while (G.ticks < 0 && G.ticks * G.spb <= g + 0.15) {
      tick(G.bus, Math.max(ac.currentTime, at(G.ticks * G.spb)), G.ticks === -4);
      G.ticks++;
    }
    if (opt.band === 'on') {
      band(g);
      for (const c of G.chords) {
        if (c.sched) continue;
        if (c.t > g + 0.25) break;
        c.sched = true;
        if (c.name !== 'N' && c.t + c.d > g) pad(G.bus, c.name, Math.max(ac.currentTime, at(c.t)), c.d);
      }
    }
    for (const n of G.notes) {
      if (!n.holding) continue;
      if (g >= n.t + n.d) { finishHold(n, n.t + n.d); continue; }
      holdTick(n, g);
      if (Math.random() < 0.5) G.parts.push({ x: laneCenter(n.lane) + (Math.random() - 0.5) * laneW * 0.6, y: hitY, vx: (Math.random() - 0.5) * 60, vy: -120 - Math.random() * 200, life: 0.5, age: 0, r: 1.5 + Math.random() * 2, color: PCOLOR[n.m % 12] });
    }
    for (let i = G.scan; i < G.notes.length; i++) {
      const n = G.notes[i];
      if (n.t + OK >= g) break;
      if (!n.hit && !n.miss) { doMiss(n); if (G.over) return; }
    }
    while (G.scan < G.notes.length && (G.notes[G.scan].hit || G.notes[G.scan].miss)) G.scan++;
    if (g > G.end + 0.6 && !G.notes.some((n) => n.holding)) finish(true);
  }

  // ---------- 그리기 ----------
  function hexA(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    if (hex.length === 4) return `rgba(${((v >> 8) & 15) * 17},${((v >> 4) & 15) * 17},${(v & 15) * 17},${a})`;
    return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
  }
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    cx.beginPath();
    cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath();
  }
  function burst(x, y, color, n) {
    if (!G) return;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 160 + Math.random() * 320;
      G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.55 + Math.random() * 0.3, age: 0, r: 2 + Math.random() * 3, color });
    }
  }

  function drawSky(rt) {
    const bg = cx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d0a22'); bg.addColorStop(0.65, '#1a1545'); bg.addColorStop(1, '#2b1f55');
    cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
    for (const s of STARS) {
      cx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(rt * s.s + s.p));
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(s.x * W, s.y * H, s.r, 0, 6.283); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  function drawBoard(rt) {
    cx.fillStyle = 'rgba(255,255,255,0.035)'; cx.fillRect(boardX, 0, boardW, H);
    cx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i <= 4; i++) cx.fillRect(Math.round(boardX + laneW * i) - 0.5, 0, 1, H);
    // 누른 줄 빛: 손가락을 대고 있는 동안 계속 켜져 있고, 막 쳤을 때 더 밝게 번쩍
    const down = new Set(state === 'play' ? activeLanes.values() : []);
    if (G) for (let l = 0; l < 4; l++) {
      const f = G.flash[l];
      const fa = f ? Math.max(0, 1 - (rt - f.t) / (f.soft ? 0.15 : 0.3)) : 0;
      const a = Math.max(down.has(l) ? 0.55 : 0, fa * (f && f.soft ? 0.5 : 1));
      if (a <= 0) continue;
      const hgt = 160 + 140 * fa;
      const gr = cx.createLinearGradient(0, hitY - hgt, 0, hitY);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, hexA(f && !f.soft ? G.laneCol[l] : '#ffffff', 0.38 * a));
      cx.fillStyle = gr; cx.fillRect(boardX + laneW * l, hitY - hgt, laneW, hgt);
    }
    // 치는 선
    const lg = cx.createLinearGradient(boardX, 0, boardX + boardW, 0);
    lg.addColorStop(0, '#ff86c8'); lg.addColorStop(0.5, '#ffd75e'); lg.addColorStop(1, '#3fd6b0');
    cx.shadowColor = 'rgba(255,215,94,0.8)'; cx.shadowBlur = 14;
    cx.fillStyle = lg; cx.fillRect(boardX, hitY - 2, boardW, 4);
    cx.shadowBlur = 0;
    // 선 아래: 키 표시
    cx.fillStyle = 'rgba(10,8,28,0.45)'; cx.fillRect(boardX, hitY + 2, boardW, H - hitY);
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.font = '15px ' + FAM;
    for (let l = 0; l < 4; l++) {
      const x = laneCenter(l), y = hitY + Math.min(40, (H - hitY) / 2);
      const on = down.has(l);
      if (on) { // 눌린 버튼: 안쪽이 채워지고 조금 작아진다
        cx.fillStyle = hexA(G ? G.laneCol[l] : '#ffffff', 0.55);
        cx.shadowColor = G ? G.laneCol[l] : '#fff'; cx.shadowBlur = 18;
        cx.beginPath(); cx.arc(x, y + 2, 15, 0, 6.283); cx.fill(); cx.shadowBlur = 0;
      }
      cx.strokeStyle = on ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)'; cx.lineWidth = on ? 3 : 2;
      cx.beginPath(); cx.arc(x, y + (on ? 2 : 0), on ? 15 : 17, 0, 6.283); cx.stroke();
      if (keyboardUsed) { cx.fillStyle = 'rgba(255,255,255,0.6)'; cx.fillText('DFJK'[l], x, y + 1 + (on ? 2 : 0)); }
    }
  }
  function drawTiles(g) {
    const pps = (hitY + 30) / G.travel;
    const font = 'bold 19px ' + FAM;
    cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
    for (let i = Math.max(0, G.scan - 12); i < G.notes.length; i++) {
      const n = G.notes[i];
      const bottom = hitY - (n.t - g) * pps;
      if (bottom < -20) break; // 아직 화면 위
      const h = Math.max(46, n.d * pps - 6);
      let top = bottom - h;
      if (top > H) continue;
      const x = boardX + laneW * n.lane + 5, w = laneW - 10;
      const col = PCOLOR[n.m % 12];
      if (n.mate && !n.hit && !n.miss && !n.mate.hit && !n.mate.miss) { // 같이 누를 두 타일을 잇는 줄
        const x1 = laneCenter(n.lane), x2 = laneCenter(n.mate.lane);
        cx.fillStyle = 'rgba(255,255,255,0.55)';
        cx.fillRect(Math.min(x1, x2), bottom - 24, Math.abs(x2 - x1), 4);
      }
      if (n.hit && !n.holding) {
        // 친 타일: 그 자리에서 꾹 눌려 납작해지며 하얗게 번쩍이고 사라진다
        const age = g - n.endAt, k = age / 0.3; if (k >= 1) continue;
        const tb = n.hold ? hitY : hitY - (n.t - n.endAt) * pps;
        const th = n.hold ? Math.min(60, Math.max(20, tb - top)) : h;
        const hh = th * (1 - 0.6 * k), ww = w * (1 + 0.18 * Math.sin(Math.min(1, k * 2) * Math.PI / 2));
        cx.globalAlpha = 1 - k;
        cx.fillStyle = col; rr(x + w / 2 - ww / 2, tb - hh, ww, hh, 12); cx.fill();
        cx.globalAlpha = (1 - k) * (age < 0.08 ? 0.9 : 0.45); cx.fillStyle = '#ffffff';
        rr(x + w / 2 - ww / 2, tb - hh, ww, hh, 12); cx.fill();
        cx.globalAlpha = 1; continue;
      }
      let drawBottom = bottom;
      if (n.holding) drawBottom = Math.min(bottom, hitY);
      if (drawBottom - top < 2) continue;
      cx.globalAlpha = n.miss ? 0.28 : 1;
      // 몸통
      cx.shadowColor = col; cx.shadowBlur = n.holding ? 26 : 10;
      cx.fillStyle = col; rr(x, top, w, drawBottom - top, 12); cx.fill();
      cx.shadowBlur = 0;
      const shine = cx.createLinearGradient(0, top, 0, top + Math.min(40, drawBottom - top));
      shine.addColorStop(0, 'rgba(255,255,255,0.45)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      cx.fillStyle = shine; rr(x, top, w, drawBottom - top, 12); cx.fill();
      if (n.hold) {
        // 긴 타일: 가운데 줄로 "꾹 누르기" 표시
        cx.fillStyle = 'rgba(27,21,48,0.28)';
        rr(x + w / 2 - 4, top + 12, 8, Math.max(0, drawBottom - top - 46), 4); cx.fill();
      }
      if (n.miss) { cx.strokeStyle = '#ff7a8a'; cx.lineWidth = 2; rr(x, top, w, drawBottom - top, 12); cx.stroke(); }
      if (!n.holding) { cx.fillStyle = 'rgba(27,21,48,0.85)'; cx.font = font; cx.fillText(SOLFA[n.m % 12], x + w / 2, bottom - 14); }
      cx.globalAlpha = 1;
      if (n.holding) { // 누르는 동안: 타일이 숨 쉬듯 빛나고, 얼마나 남았는지 위에 표시
        const prog = Math.max(0, Math.min(1, (g - n.t) / n.d));
        cx.globalAlpha = 0.25 + 0.15 * Math.sin(g * 18); cx.fillStyle = '#ffffff';
        rr(x, top, w, drawBottom - top, 12); cx.fill(); cx.globalAlpha = 1;
        cx.fillStyle = 'rgba(255,255,255,0.95)'; cx.beginPath(); cx.arc(x + w / 2, hitY, 11 + 3 * Math.sin(g * 30), 0, 6.283); cx.fill();
        cx.strokeStyle = '#ffe27a'; cx.lineWidth = 4; cx.lineCap = 'round';
        cx.beginPath(); cx.arc(x + w / 2, hitY, 20, -Math.PI / 2, -Math.PI / 2 + prog * 6.283); cx.stroke();
        if (drawBottom - top > 40) { cx.fillStyle = 'rgba(27,21,48,0.8)'; cx.font = font; cx.fillText('꾹', x + w / 2, top + 30); }
      }
    }
  }
  function drawParts(dt) {
    const ps = G.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.age += dt;
      if (p.age >= p.life) { ps.splice(i, 1); continue; }
      p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      cx.globalAlpha = 1 - p.age / p.life; cx.fillStyle = p.color;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  function drawText(rt, g) {
    const fam = FAM;
    const cxm = boardX + boardW / 2;
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    if (G.judge) {
      const age = rt - G.judge.t;
      if (age < 0.7) {
        const sc = age < 0.08 ? 0.7 + age / 0.08 * 0.45 : 1.15 - Math.min(0.15, (age - 0.08) * 1.2);
        cx.save(); cx.globalAlpha = age < 0.5 ? 1 : 1 - (age - 0.5) / 0.2;
        cx.translate(cxm, hitY * 0.55); cx.scale(sc, sc);
        cx.font = (G.judge.text.length > 7 ? '28px ' : '34px ') + fam; cx.lineWidth = 6; cx.strokeStyle = 'rgba(13,10,34,0.8)';
        cx.strokeText(G.judge.text, 0, 0); cx.fillStyle = G.judge.color; cx.fillText(G.judge.text, 0, 0);
        cx.restore();
      }
    }
    if (G.combo >= 3) {
      cx.font = '20px ' + fam; cx.fillStyle = 'rgba(255,255,255,0.85)';
      cx.fillText(G.combo + ' 콤보', cxm, hitY * 0.55 + 36);
    }
    let big = null;
    if (state === 'play' && g < 0) {
      const b = Math.floor(g / G.spb); // -5..-1
      big = b <= -4 ? '준비' : String(-b);
    } else if (state === 'resume') {
      const left = 1.5 - (rt - resumeT0);
      big = String(Math.max(1, Math.ceil(left / 0.5)));
    }
    if (big) {
      cx.font = '64px ' + fam; cx.lineWidth = 8; cx.strokeStyle = 'rgba(13,10,34,0.8)';
      cx.strokeText(big, cxm, H * 0.4); cx.fillStyle = '#ffd75e'; cx.fillText(big, cxm, H * 0.4);
    }
  }

  let lastRt = pnow();
  function frame() {
    const rt = pnow(); const dt = Math.min(0.05, rt - lastRt); lastRt = rt;
    if (state === 'resume' && rt - resumeT0 >= 1.5 && G) {
      state = 'resuming';
      const go = () => { perf0 = pnow() - pausedAt; audio0 = ac.currentTime - pausedAt; pausedAt = null; if (state === 'resuming') state = 'play'; };
      ac.resume().then(go, go);
    }
    const g = G ? gnow() : 0;
    if (state === 'play' && G && !G.over) update(g);
    drawSky(rt);
    drawBoard(rt);
    if (G) {
      drawTiles(g);
      drawParts(dt);
      for (let i = G.rips.length - 1; i >= 0; i--) { // 친 자리에 퍼지는 동그라미
        const r = G.rips[i], age = rt - r.t, life = r.big ? 0.55 : 0.38;
        if (age >= life) { G.rips.splice(i, 1); continue; }
        const k = age / life;
        cx.globalAlpha = 1 - k; cx.strokeStyle = r.c; cx.lineWidth = (r.big ? 5 : 3) * (1 - k) + 1;
        cx.beginPath(); cx.arc(r.x, hitY, 14 + k * (r.big ? 110 : 60), 0, 6.283); cx.stroke();
      }
      cx.globalAlpha = 1;
      drawText(rt, g);
      if (state === 'play' || state === 'end') $('#hudBar').style.width = Math.max(0, Math.min(100, (g / G.end) * 100)) + '%';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
