// 열쇠 학교 함께하기: 선생님 기기가 "방장"이 되고, 아이들 기기가 수업 코드로 들어온다.
// 기기끼리 바로 이어지는 WebRTC(PeerJS)를 쓴다. 서로를 찾는 데만 PeerJS 연결 서버를 잠깐 쓰고,
// 주고받는 것은 별명·학년·캐릭터 모습·위치·푼 문제 수·열쇠와 도장 수뿐이다. 카메라 영상은 절대 보내지 않는다.
// 선생님 창을 닫으면 수업이 끝나고, 어디에도 기록이 남지 않는다.

import { cleanLook, lookColor } from './chars.js';

const PREFIX = 'kkoma-park-v1-';
const MAX_STUDENTS = 30;

// 시험할 때 ?peerhost=localhost&peerport=9000 으로 다른 연결 서버를 쓸 수 있다
function peerOptions() {
  const q = new URLSearchParams(location.search);
  const o = { debug: 0 };
  if (q.get('peerhost')) {
    o.host = q.get('peerhost');
    o.port = Number(q.get('peerport') || 9000);
    o.path = q.get('peerpath') || '/';
    o.secure = q.get('peersecure') === '1';
  }
  return o;
}
let libLoading = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  libLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('./vendor/peerjs.min.js', import.meta.url).href;
    s.onload = () => (window.Peer ? resolve(window.Peer) : reject(new Error('no peer')));
    s.onerror = () => { libLoading = null; reject(new Error('연결 프로그램을 불러오지 못했어요.')); };
    document.head.append(s);
  });
  return libLoading;
}
const ERR = {
  'peer-unavailable': '그 수업 코드를 찾지 못했어요. 선생님 화면의 숫자 4개를 다시 확인해 주세요.',
  'unavailable-id': '이 수업 코드는 이미 쓰고 있어요. 다시 만들어 볼게요.',
  network: '인터넷 연결이 끊겼어요. 와이파이를 확인해 주세요.',
  'server-error': '연결 서버에 닿지 못했어요. 잠시 뒤 다시 해 주세요.',
  'socket-error': '연결 서버에 닿지 못했어요. 학교 인터넷이 막고 있을 수 있어요.',
  'browser-incompatible': '이 브라우저는 함께하기를 못 해요. 크롬·엣지·사파리 최신 버전을 써 주세요.',
};
const errText = (e) => ERR[e?.type] || e?.message || '연결하지 못했어요.';
const SLOW = { type: 'slow', message: '연결 서버에 닿지 못했어요. 인터넷이 되는지, 학교 인터넷이 막고 있지 않은지 확인해 주세요.' };
// 연결 서버가 막혀 있으면 아무 대답이 없을 수 있어서, 15초 뒤에는 실패로 친다
function waitOpen(peer) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { peer.off('open', ok); peer.off('error', fail); reject(SLOW); }, 25000);
    const ok = () => { clearTimeout(t); peer.off('error', fail); resolve(); };
    const fail = (e) => { clearTimeout(t); peer.off('open', ok); reject(e); };
    peer.once('open', ok);
    peer.once('error', fail);
  });
}

// ============================================================
// 선생님(방장)
// ============================================================
export class Host {
  constructor({ onRoster = () => {}, onEvent = () => {}, onStatus = () => {} } = {}) {
    this.onRoster = onRoster; this.onEvent = onEvent; this.onStatus = onStatus;
    this.students = new Map(); // pid -> {pid, name, grade, color, conn, online, x,z,r,a, keys:[], right, wrong, hints, escaped, last}
    this.frozen = false;
    this.timer = null;
  }

  async open(code) {
    const Peer = await loadPeer();
    for (let tries = 0; tries < 4; tries++) {
      const c = code || String(1000 + Math.floor(Math.random() * 9000));
      try {
        const peer = new Peer(PREFIX + c, peerOptions());
        try { await waitOpen(peer); } catch (e) { peer.destroy(); throw e; }
        this.peer = peer; this.code = c;
        break;
      } catch (e) {
        if (e?.type !== 'unavailable-id' || code) throw new Error(errText(e));
      }
    }
    if (!this.peer) throw new Error('수업 코드를 만들지 못했어요. 다시 해 주세요.');
    this.peer.on('connection', (conn) => this.accept(conn));
    this.peer.on('disconnected', () => { this.onStatus('reconnecting'); setTimeout(() => { try { this.peer.reconnect(); } catch { /* 다시 시도 */ } }, 1500); });
    this.peer.on('open', () => this.onStatus('open'));
    this.peer.on('error', (e) => { if (e?.type !== 'peer-unavailable') this.onStatus('error', errText(e)); });
    this.timer = setInterval(() => this.broadcastSnap(), 125);
    return this.code;
  }

  accept(conn) {
    conn.on('data', (m) => this.receive(conn, m));
    conn.on('close', () => this.drop(conn));
    conn.on('error', () => this.drop(conn));
  }

  drop(conn) {
    for (const s of this.students.values()) {
      if (s.conn === conn) { s.online = false; s.conn = null; this.sendAll({ t: 'bye', id: s.pid }); this.onRoster(); }
    }
  }

  receive(conn, m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'hi') {
      const pid = String(m.pid || conn.peer).slice(0, 40);
      let s = this.students.get(pid);
      const onlineCount = [...this.students.values()].filter((x) => x.online).length;
      if (!s && onlineCount >= MAX_STUDENTS) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 500); return; }
      if (s?.conn && s.conn !== conn) { try { s.conn.close(); } catch { /* 이미 닫힘 */ } }
      const isNew = !s || !s.online;
      s ||= { pid, right: 0, wrong: 0, hints: 0, flights: 0, x: 0, z: 0, r: 0, a: 'plaza', joined: Date.now() };
      Object.assign(s, {
        conn, online: true, name: cleanName(m.name), grade: clampGrade(m.grade), look: cleanLook(m.look),
        keys: Math.max(0, Math.min(999, m.keys | 0)), stamps: cleanStamps(m.stamps), last: Date.now(),
      });
      s.color = lookColor(s.look);
      this.students.set(pid, s);
      conn.send({ t: 'welcome', id: pid, frozen: this.frozen });
      this.sendRoster();
      this.onRoster();
      if (isNew) this.onEvent(s, { kind: 'join' });
      return;
    }
    const s = [...this.students.values()].find((x) => x.conn === conn);
    if (!s) return;
    s.last = Date.now();
    if (m.t === 'st') {
      s.x = num(m.x); s.z = num(m.z); s.r = num(m.r); s.a = typeof m.a === 'string' ? m.a.slice(0, 20) : 'plaza';
    } else if (m.t === 'ev') {
      if (m.kind === 'solve') s.right += 1;
      if (m.kind === 'wrong') s.wrong += 1;
      if (m.kind === 'hint') s.hints += 1;
      if (m.kind === 'key') { s.keys = Math.max(0, Math.min(999, m.keys | 0)); s.stamps = cleanStamps(m.stamps); }
      if (m.kind === 'escape') s.flights += 1;
      if (m.kind === 'look') { s.look = cleanLook(m.look); s.color = lookColor(s.look); this.sendRoster(); }
      this.onEvent(s, m);
      if (m.kind === 'key' || m.kind === 'escape') { this.sendRoster(); this.sendAll({ t: 'cheer', id: s.pid, name: s.name, kind: m.kind, subj: m.subj }); }
      this.onRoster();
    } else if (m.t === 'emo') {
      const e = String(m.e || '').slice(0, 8);
      if (EMOTES.includes(e)) this.sendAll({ t: 'emo', id: s.pid, e });
      this.onEvent(s, { kind: 'emo', e });
    }
  }

  rosterList() {
    return [...this.students.values()].filter((s) => s.online).map((s) => ({ id: s.pid, n: s.name, l: s.look, g: s.grade, k: s.keys }));
  }
  sendRoster() { this.sendAll({ t: 'ros', list: this.rosterList() }); }
  broadcastSnap() {
    const p = [...this.students.values()].filter((s) => s.online).map((s) => [s.pid, s.x, s.z, s.r, s.a]);
    if (p.length) this.sendAll({ t: 'snap', p });
  }
  sendAll(m) { for (const s of this.students.values()) if (s.online && s.conn?.open) { try { s.conn.send(m); } catch { /* 다음 번에 */ } } }

  notice(text) { this.sendAll({ t: 'notice', text: String(text).slice(0, 120) }); }
  freeze(on) { this.frozen = on; this.sendAll({ t: 'freeze', on }); }
  callLobby() { this.sendAll({ t: 'call' }); }
  ranking() {
    const list = [...this.students.values()].sort((a, b) => (b.stamps.length - a.stamps.length) || (b.keys - a.keys) || (b.right - a.right)).slice(0, 5).map((s) => ({ n: s.name, k: s.keys, st: s.stamps.length, e: s.flights > 0 }));
    this.sendAll({ t: 'rank', list });
    return list;
  }
  kick(pid) {
    const s = this.students.get(pid);
    if (!s) return;
    try { s.conn?.send({ t: 'kick' }); } catch { /* 무시 */ }
    setTimeout(() => { try { s.conn?.close(); } catch { /* 무시 */ } }, 300);
    this.students.delete(pid);
    this.sendAll({ t: 'bye', id: pid });
    this.sendRoster();
    this.onRoster();
  }
  close() { clearInterval(this.timer); this.sendAll({ t: 'end' }); setTimeout(() => this.peer?.destroy(), 300); }
}

// ============================================================
// 학생
// ============================================================
export class Client {
  constructor({ onMessage = () => {}, onStatus = () => {} } = {}) {
    this.onMessage = onMessage; this.onStatus = onStatus;
    this.pid = getPid();
    this.closed = false;
    this.retries = 0;
  }

  async join(code, me) {
    this.code = String(code).replace(/\D/g, '').slice(0, 4);
    this.me = me;
    const Peer = await loadPeer();
    this.peer = new Peer(undefined, peerOptions());
    try { await waitOpen(this.peer); } catch (e) { throw new Error(errText(e)); }
    this.peer.on('disconnected', () => { if (!this.closed) setTimeout(() => { try { this.peer.reconnect(); } catch { /* 다시 시도 */ } }, 1500); });
    // 교실 와이파이가 붐비면 처음 연결이 늦을 수 있어서 한 번 더 해 본다
    try { await this.connect(true); } catch (e) {
      if (/찾지 못했어요|꽉 찼어요/.test(e.message)) throw e;
      try { this.conn?.close(); } catch { /* 무시 */ }
      await this.connect(true);
    }
  }

  connect(first = false) {
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(PREFIX + this.code, { reliable: true, serialization: 'json' });
      this.conn = conn;
      let ok = false;
      const timeout = setTimeout(() => { if (!ok) { conn.close(); fail({ type: 'timeout', message: '선생님 기기에 연결하지 못했어요. 같은 와이파이인지, 수업 코드가 맞는지 확인해 주세요.' }); } }, 20000);
      const fail = (e) => {
        clearTimeout(timeout);
        this.peer.off('error', onPeerErr);
        if (first) reject(new Error(errText(e)));
        else this.retry();
      };
      const onPeerErr = (e) => { if (!ok && (e?.type === 'peer-unavailable' || e?.type === 'network')) fail(e); };
      this.peer.on('error', onPeerErr);
      conn.on('open', () => {
        ok = true; clearTimeout(timeout); this.peer.off('error', onPeerErr);
        this.retries = 0;
        conn.send({ t: 'hi', pid: this.pid, ...this.me });
      });
      conn.on('data', (m) => {
        if (m?.t === 'welcome') { this.onStatus('online'); resolve(); }
        if (m?.t === 'full') { this.closed = true; reject(new Error('수업이 꽉 찼어요 (최대 30명).')); }
        this.onMessage(m);
      });
      conn.on('close', () => { if (ok && !this.closed) { this.onStatus('reconnecting'); this.retry(); } });
      conn.on('error', () => {});
    });
  }

  retry() {
    if (this.closed) return;
    this.retries += 1;
    if (this.retries > 20) { this.onStatus('lost'); return; }
    this.onStatus('reconnecting');
    clearTimeout(this.retryT);
    this.retryT = setTimeout(() => { if (!this.closed) this.connect(false).catch(() => {}); }, Math.min(5000, 1000 + this.retries * 500));
  }

  send(m) { if (this.conn?.open) { try { this.conn.send(m); } catch { /* 다음 번에 */ } } }
  hello(me) { this.me = me; this.send({ t: 'hi', pid: this.pid, ...me }); }
  leave() { this.closed = true; clearTimeout(this.retryT); try { this.conn?.close(); } catch { /* 무시 */ } setTimeout(() => this.peer?.destroy(), 200); }
}

export const EMOTES = ['👍', '😀', '🎉', '❤️', '🙋', '😮'];
const num = (v) => (Number.isFinite(+v) ? Math.round(+v * 100) / 100 : 0);
const clampGrade = (g) => Math.min(6, Math.max(1, Number(g) | 0 || 1));
export function cleanName(n) { return String(n || '').replace(/[<>&"'`]/g, '').trim().slice(0, 8) || '친구'; }
const SUBJ_IDS = ['kor', 'eng', 'math', 'soc', 'sci', 'code', 'music', 'art', 'pe'];
function cleanStamps(a) { return Array.isArray(a) ? [...new Set(a.map(String).filter((x) => SUBJ_IDS.includes(x)))] : []; }
function getPid() {
  try {
    let id = sessionStorage.getItem('kkoma.pid');
    if (!id) { id = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('kkoma.pid', id); }
    return id;
  } catch { return Math.random().toString(36).slice(2, 12); }
}
