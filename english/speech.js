// 소리 내어 읽어 주기(TTS)와 말한 것 알아듣기(음성 인식), 그리고 말한 문장 채점.
// 모두 브라우저 기능만 쓴다. 음성 인식은 브라우저(크롬·사파리)가 자체적으로 처리한다.
'use strict';

const Speech = (() => {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const Rec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  let voices = [];
  let voiceName = '';
  let rate = 0.8;

  function loadVoices() {
    if (!synth) return [];
    voices = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
    return voices;
  }
  if (synth) {
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
  }

  // 미국 영어의 자연스러운 목소리를 먼저 고른다
  function pickVoice() {
    if (!voices.length) loadVoices();
    if (voiceName) {
      const v = voices.find((x) => x.name === voiceName);
      if (v) return v;
    }
    const us = voices.filter((v) => /en[-_]US/i.test(v.lang));
    const pool = us.length ? us : voices;
    const good = /(Samantha|Google US English|Aria|Jenny|Ava|Allison|Natural|Premium|Enhanced)/i;
    return pool.find((v) => good.test(v.name)) || pool.find((v) => v.localService) || pool[0] || null;
  }

  function say(text, opts = {}) {
    if (!synth) return Promise.resolve();
    return new Promise((resolve) => {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = v?.lang || 'en-US';
      u.rate = opts.rate ?? rate;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      // 일부 브라우저는 cancel 직후 바로 말하면 소리를 삼킨다
      setTimeout(() => synth.speak(u), 40);
      // onend 가 오지 않는 브라우저 대비
      setTimeout(resolve, 1200 + text.length * 140 / (u.rate || 1));
    });
  }

  function stop() { synth?.cancel(); }

  // 한 번 듣고 들은 문장 후보들을 돌려준다
  let active = null;
  function listen() {
    if (!Rec) return Promise.reject(new Error('unsupported'));
    stop();
    if (active) { try { active.abort(); } catch { /* 무시 */ } }
    return new Promise((resolve, reject) => {
      const r = new Rec();
      active = r;
      r.lang = 'en-US';
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.continuous = false;
      let got = null;
      r.onresult = (e) => {
        const res = e.results[0];
        got = [];
        for (let i = 0; i < res.length; i++) got.push(res[i].transcript);
      };
      r.onerror = (e) => { active = null; reject(new Error(e.error || 'error')); };
      r.onend = () => {
        active = null;
        if (got && got.length) resolve(got);
        else reject(new Error('no-speech'));
      };
      try { r.start(); } catch (err) { active = null; reject(err); }
    });
  }
  function stopListening() { if (active) { try { active.stop(); } catch { /* 무시 */ } } }

  return {
    say, stop, listen, stopListening,
    canSpeak: !!synth,
    canListen: !!Rec,
    get voices() { return loadVoices(); },
    get rate() { return rate; },
    set rate(v) { rate = v; },
    get voiceName() { return voiceName; },
    set voiceName(v) { voiceName = v || ''; },
  };
})();

// ---------- 채점 ----------
// 음성 인식 결과는 "I am" / "I'm", "5" / "five" 처럼 모양이 달라질 수 있어서 같은 모양으로 맞춘 뒤 비교한다.
const Grade = (() => {
  const CONTR = {
    "i'm": 'i am', "it's": 'it is', "that's": 'that is', "what's": 'what is', "here's": 'here is', "there's": 'there is',
    "i'll": 'i will', "you're": 'you are', "we're": 'we are', "don't": 'do not', "doesn't": 'does not', "can't": 'can not',
    "cannot": 'can not', "i'd": 'i would', "let's": 'let us', "where's": 'where is', "isn't": 'is not',
  };
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  // 소리가 같아서 인식기가 바꿔 쓰는 말
  const SAME = { to: 'two', too: 'two', for: 'four', won: 'one', okay: 'ok', 'o.k.': 'ok', wifi: 'wi fi', checkin: 'check in', checkout: 'check out', bye: 'goodbye', hi: 'hello', thanks: 'thank you' };

  function words(text) {
    let t = String(text).toLowerCase().replace(/[’‘`]/g, "'").replace(/-/g, ' ');
    t = t.replace(/[^a-z0-9' ]+/g, ' ');
    let out = [];
    for (let w of t.split(/\s+/)) {
      if (!w) continue;
      w = w.replace(/^'+|'+$/g, '');
      if (CONTR[w]) { out.push(...CONTR[w].split(' ')); continue; }
      w = w.replace(/'s$/, '');
      out.push(...(SAME[w] || w).split(' '));
    }
    // 숫자 말 → 숫자 ("five" → 5, "twenty five" → 25, "five oh three" → 503)
    const toks = [];
    for (let i = 0; i < out.length; i++) {
      const w = out[i];
      const oi = ONES.indexOf(w);
      const prev = toks[toks.length - 1];
      const nextIsDigit = ONES.indexOf(out[i + 1] || '') >= 0 && ONES.indexOf(out[i + 1]) < 10;
      if (/^\d+$/.test(w)) toks.push({ v: w, one: w.length === 1 });
      else if (oi >= 0) toks.push({ v: String(oi), one: oi < 10 });
      else if (TENS[w] != null) {
        const next = ONES.indexOf(out[i + 1] || '');
        if (next > 0 && next < 10) { toks.push({ v: String(TENS[w] + next) }); i++; } else toks.push({ v: String(TENS[w]) });
      } else if ((w === 'oh' || w === 'o') && prev?.one && nextIsDigit) toks.push({ v: '0', one: true });
      else toks.push({ v: w });
    }
    const num = [];
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].one && i > 0 && toks[i - 1].one) num[num.length - 1] += toks[i].v;
      else num.push(toks[i].v);
    }
    return num;
  }

  // 가장 긴 공통 부분열로 맞힌 낱말을 찾는다
  function lcs(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    const hitA = new Array(m).fill(false);
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { hitA[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
    }
    return { len: dp[0][0], hitA };
  }

  // 목표 문장(target)과 들은 문장(said)을 비교해 0~1 점수를 준다
  function score(target, said) {
    const t = words(target), s = words(said);
    if (!t.length || !s.length) return { score: 0 };
    const { len } = lcs(t, s);
    const recall = len / t.length;
    const precision = len / s.length;
    const sc = (recall * 0.75) + (precision * 0.25);
    return { score: Math.round(sc * 100) / 100 };
  }

  // 정답 후보 여러 개 × 들은 후보 여러 개 중 가장 잘 맞는 것
  function best(answers, heard) {
    let top = { score: -1 };
    for (const a of answers) {
      for (const h of heard) {
        const r = score(a, h);
        if (r.score > top.score) top = { score: r.score, answer: a, heard: h };
      }
    }
    return top;
  }

  // 화면에 보여 줄 때: 목표 문장의 낱말마다 맞았는지 표시 (원래 글자 모양 유지)
  function marks(target, said) {
    const display = String(target).split(/\s+/).filter(Boolean);
    if (score(target, said).score >= 0.99) return display.map((w) => ({ w, ok: true }));
    const s = words(said);
    const norm = display.map((w) => words(w));
    const flat = [];
    const owner = [];
    norm.forEach((ws, i) => ws.forEach((w) => { flat.push(w); owner.push(i); }));
    const { hitA } = lcs(flat, s);
    return display.map((w, i) => {
      const idx = owner.map((o, k) => (o === i ? k : -1)).filter((k) => k >= 0);
      const ok = idx.length === 0 || idx.every((k) => hitA[k]);
      return { w, ok };
    });
  }

  return { words, score, best, marks };
})();

if (typeof module !== 'undefined') module.exports = { Grade };
