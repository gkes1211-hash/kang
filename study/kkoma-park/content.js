// 꼬마 탐험대 공원: 마을 건물(놀이방)과 문제 고르기.
// 문제는 content/ 폴더에 과목별로 있다. 문제를 더 넣으려면 그 파일의 학년 목록에 한 줄씩 더하면 된다.
import KOR from './content/kor.js';
import SOC from './content/soc.js';
import SCI from './content/sci.js';
import MATH from './content/math.js';
import { WORDS, SENT } from './content/eng.js';
import { MELODIES, MUSIC, PAINTS, MIXES, ART, PE_MOVES, PE } from './content/arts.js';
import { LEVELS, CODE_Q } from './content/code.js';
import FIRE from './content/fire.js';
import MARKET from './content/market.js';
import POST from './content/post.js';
import TURTLE from './content/turtle.js';
import BUGS from './content/bug.js';
import { JOBS, JOB, JOB_SPECIAL, MISSIONS } from './content/job.js';
import { pickOne, shuffle } from './content/h.js';

export { shuffle, PAINTS, MIXES, JOBS, JOB };

// 놀이 구역. host = 구역을 지키는 동물 친구, hello = 들어갈 때 하는 말
export const SUBJECTS = [
  { id: 'kor', name: '이야기 숲 도서관', short: '국어', emoji: '📚', color: '#ff8a7a', host: '🦉', hostName: '부엉이 박사', hello: '책 요정이 글자를 몽땅 숨겼어! 보물 상자 3개의 수수께끼를 풀어 줄래?', island: 'study' },
  { id: 'eng', name: 'ABC 놀이터', short: '영어', emoji: '🔤', color: '#5aa9f0', host: '🦜', hostName: '앵무새 헬로', hello: 'Hello! 영어 단어가 미끄럼틀에서 굴러떨어졌어. 같이 찾아 줘!', island: 'study' },
  { id: 'math', name: '숫자 성', short: '수학', emoji: '🏰', color: '#f4b33a', host: '🦁', hostName: '사자 임금님', hello: '성문 자물쇠는 숫자로 열린단다. 셈 박사님, 도와주겠나?', island: 'study' },
  { id: 'soc', name: '세계 여행 기차역', short: '사회', emoji: '🚂', color: '#3fbf7f', host: '🐻', hostName: '곰 역장님', hello: '칙칙폭폭! 여행 기차표를 받으려면 퀴즈 3개를 맞혀야 해요!', island: 'study' },
  { id: 'sci', name: '반짝 별 실험실', short: '과학', emoji: '🔬', color: '#2bb5c8', host: '🐙', hostName: '문어 박사', hello: '실험실이 엉망진창이야! 과학 수수께끼를 풀어서 정리해 줘!', island: 'study' },
  { id: 'code', name: '삐뽀 로봇 공장', short: '코딩', emoji: '🤖', color: '#7b6cf0', host: '🐧', hostName: '펭귄 공장장', hello: '삐뽀삐뽀! 로봇이 길을 잃었어. 명령 블록으로 열쇠까지 데려가 줘!', island: 'coding', stages: true },
  { id: 'turtle', name: '거북이 그림 공방', short: '그림 코딩', emoji: '🐢', color: '#2bab6b', host: '🐢', hostName: '거북이 화가', hello: '안녕! 나는 그림 그리는 거북이야. 명령 블록으로 나를 움직여서 본보기 그림을 똑같이 그려 줘!', island: 'coding', stages: true },
  { id: 'bug', name: '버그 탐정 사무소', short: '디버깅', emoji: '🐞', color: '#e8574d', host: '🦝', hostName: '너구리 탐정', hello: '사건 발생! 프로그램에 버그가 숨었어. 블록을 하나하나 읽고 버그를 찾아 줘, 꼬마 탐정!', island: 'coding', stages: true },
  { id: 'music', name: '딩동 음악 무대', short: '음악', emoji: '🎤', color: '#f06aa8', host: '🐦', hostName: '꾀꼬리 가수', hello: '오늘 밤 공연인데 악보가 흩어졌어! 노래로 금고를 열어 줘!', island: 'play' },
  { id: 'art', name: '무지개 물감 공방', short: '미술', emoji: '🌈', color: '#ff9346', host: '🦊', hostName: '여우 화가', hello: '무지개 색이 사라졌어! 물감을 섞어서 색을 되찾아 줄래?', island: 'play' },
  { id: 'pe', name: '튼튼 운동장', short: '체육', emoji: '⚽', color: '#5cbf3c', host: '🐯', hostName: '호랑이 코치', hello: '어흥! 몸을 움직여야 상자가 열린다! 준비됐지?', island: 'play' },
  { id: 'fire', name: '삐뽀 소방서', short: '안전', emoji: '🚒', color: '#e8322d', host: '🐶', hostName: '강아지 소방관', hello: '삐뽀삐뽀! 출동 준비! 안전 퀴즈 3개를 풀면 꼬마 소방관이 될 수 있어!', island: 'life' },
  { id: 'market', name: '알뜰 꼬마 시장', short: '경제', emoji: '🛒', color: '#f2a516', host: '🐿️', hostName: '다람쥐 사장님', hello: '어서 오세요! 돈을 똑똑하게 쓰는 꼬마 손님을 찾고 있어요. 도전해 볼래요?', island: 'life' },
  { id: 'post', name: '마음 우체국', short: '마음', emoji: '💌', color: '#ff6b8b', host: '🐰', hostName: '토끼 우체부', hello: '마음 편지가 뒤죽박죽 섞였어! 친구 마음을 알아맞히고 편지를 배달해 줄래?', island: 'life' },
  { id: 'job', name: '두근두근 직업 체험관', short: '직업', emoji: '🏢', color: '#6a5ae0', host: '🐨', hostName: '코알라 진로 선생님', hello: '어서 와! 직업 카드 벽에서 해 보고 싶은 직업을 골라 봐. 미션 3개를 해내면 그 직업 배지를 줄게!', island: 'life' },
];
export const SUBJECT = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
// 열기구는 도장 10개면 탈 수 있다. 건물은 앞으로도 계속 늘어나지만 "보너스 건물"을 따로 두지 않는다:
// 새 건물도 다른 건물과 똑같이 도장을 주고, 어느 건물이든 10곳을 깨면 된다.
export const STAMPS_TO_FLY = 10;

const g6 = (g) => Math.min(6, Math.max(1, g | 0));

// ---------- 같은 문제가 바로 다시 나오지 않게: 카드 더미에서 차례로 뽑기 ----------
const decks = {};
function draw(key, list, n = 1) {
  const out = [];
  while (out.length < n && list.length) {
    let d = decks[key];
    if (!d || !d.length) {
      // 다 쓰면 다시 섞는다. 방금 나온 것들은 맨 뒤로 보낸다
      const recent = new Set(decks[`${key}:recent`] || []);
      const fresh = shuffle(list.map((_, i) => i).filter((i) => !recent.has(i)));
      d = decks[key] = [...fresh, ...shuffle([...recent])];
    }
    const i = d.shift();
    if (out.includes(list[i]) && list.length > n) continue;
    out.push(list[i]);
    const rec = decks[`${key}:recent`] = [...(decks[`${key}:recent`] || []), i];
    if (rec.length > Math.min(6, Math.floor(list.length / 2))) rec.shift();
  }
  return out;
}

function englishPuzzle(kind, g) {
  const [[w, pic, ko]] = draw(`eng:w:${g}`, WORDS[g]);
  if (kind === 'spell') return { type: 'spell', word: w, pic, ko, q: `${pic} "${ko}"을(를) 영어로 써요.`, hint: `첫 글자는 "${w[0]}"예요.`, ex: `${w} = ${ko}` };
  if (kind === 'match') {
    const four = shuffle(WORDS[g]).slice(0, 4);
    return { type: 'match', q: '영어 단어와 그림을 이어요. 🔊 단어를 누르면 소리가 나요.', pairs: four.map(([e, p]) => [e, p]), speakLeft: true, ex: four.map(([e, , k]) => `${e}=${k}`).join(', ') };
  }
  const others = shuffle(WORDS[g].filter((x) => x[0] !== w)).slice(0, 3);
  return {
    type: 'listen', say: w, q: '잘 듣고 알맞은 것을 골라요. 🔊', showPic: g <= 4,
    opts: [[w, pic], ...others.map((x) => [x[0], x[1]])], a: 0, ex: `${w} = ${ko}`, hint: `"${ko}"이라는 뜻이에요.`,
  };
}

// 구역에 들어갈 때마다 새 퍼즐 3개
// 직업 체험관: 고른 직업의 미션 3개 (학년 묶음 1·2 / 3·4 / 5·6)
const jobBand = (g) => (g <= 2 ? 1 : g <= 4 ? 2 : 3);
export function jobPuzzles(jobId, grade) {
  const g = g6(grade); const band = jobBand(g);
  const list = MISSIONS[jobId]?.[band] || [];
  const sp = JOB_SPECIAL[jobId];
  let special = null;
  if (sp === 'color') { const [mix] = draw(`mix:${g}`, MIXES.filter((m) => m.grades.includes(g))); special = { type: 'color', mix, q: `🎨 디자이너 미션! 물감을 섞어 "${mix.name}"을(를) 만들어요.`, hint: `${mix.parts.length}가지 물감을 섞어요.`, ex: `${mix.parts.join(' + ')} = ${mix.name}` }; }
  if (sp === 'melody') { const [notes] = draw(`mel:${g}`, MELODIES[g]); special = { type: 'melody', notes, q: '🎼 작곡가 미션! 계이름대로 건반을 눌러 가락을 완성해요.', hint: '🔊 들어 보기를 누르고 따라 해 봐요.' }; }
  if (sp === 'code') { const [l] = draw(`code:${g}`, LEVELS[g]); special = { type: 'code', ...l, q: '🚁 드론 조종사 미션! 블록 명령으로 드론을 열쇠까지 보내요.' }; }
  const picked = draw(`job:${jobId}:${band}`, list, special ? 2 : 3);
  return special ? [picked[0], special, picked[1]] : picked;
}

// 코딩 섬 건물은 stage(몇 번째로 깼는지)에 따라 다음 단계 문제가 차례로 나온다
const nth = (list, i) => list[((i % list.length) + list.length) % list.length];
export function puzzlesFor(subj, grade, stage = 0) {
  const g = g6(grade);
  switch (subj) {
    case 'kor': return draw(`kor:${g}`, KOR[g], 3);
    case 'soc': return draw(`soc:${g}`, SOC[g], 3);
    case 'sci': return draw(`sci:${g}`, SCI[g], 3);
    case 'math': return draw(`math:${g}`, MATH[g], 3).map((f) => f());
    case 'eng': return shuffle([englishPuzzle('listen', g), englishPuzzle(Math.random() < 0.5 ? 'spell' : 'match', g), ...draw(`eng:s:${g}`, SENT[g], 1)]);
    case 'music': {
      const [notes] = draw(`mel:${g}`, MELODIES[g]);
      return [{ type: 'melody', notes, q: '계이름대로 건반을 눌러 금고를 열어요.', hint: '🔊 들어 보기를 누르고 따라 해 봐요.' }, ...draw(`music:${g}`, MUSIC[g], 2)];
    }
    case 'art': {
      const [mix] = draw(`mix:${g}`, MIXES.filter((m) => m.grades.includes(g)));
      return [{ type: 'color', mix, q: `물감을 섞어 "${mix.name}"을(를) 만들어요.`, hint: `${mix.parts.length}가지 물감을 섞어요.`, ex: `${mix.parts.join(' + ')} = ${mix.name}` }, ...draw(`art:${g}`, ART[g], 2)];
    }
    case 'pe': {
      const m = PE_MOVES[g];
      const [a, b] = shuffle(['squat', 'jack', 'knee']);
      const word = { squat: '스쿼트', jack: '팔 벌려 뛰기', knee: '제자리 무릎 들기' };
      const how = { squat: '앉았다 일어나면 문이 올라가요!', jack: '두 팔을 머리 위로 쭉!', knee: '무릎을 번갈아 높이 올려요!' };
      const mv = (ex) => ({ type: 'move', ex, count: m[ex], q: `${word[ex]} ${m[ex]}번! ${how[ex]}` });
      return [mv(a), ...draw(`pe:${g}`, PE[g], 1), mv(b)];
    }
    case 'code': {
      const lv = [nth(LEVELS[g], stage * 2), nth(LEVELS[g], stage * 2 + 1)].map((l) => ({ type: 'code', ...l, q: '블록을 놓아 로봇을 열쇠까지 데려가요.' }));
      return [lv[0], nth(CODE_Q[g], stage), lv[1]];
    }
    case 'turtle': return [0, 1, 2].map((k) => ({ type: 'turtle', ...nth(TURTLE[g], stage * 3 + k) }));
    case 'bug': return [0, 1, 2].map((k) => nth(BUGS[g], stage * 3 + k));
    case 'job': return jobPuzzles(JOBS[Math.floor(Math.random() * JOBS.length)].id, g);
    case 'fire': return draw(`fire:${g}`, FIRE[g], 3);
    case 'market': return draw(`market:${g}`, MARKET[g], 3).map((p) => (typeof p === 'function' ? p() : p));
    case 'post': return draw(`post:${g}`, POST[g], 3);
    default: return draw(`kor:${g}`, KOR[g], 3);
  }
}

// 열기구 탈출장: 여러 건물에서 하나씩 (몸 움직이기·코딩 판은 빼고 머리로 푸는 것만)
export function finalPuzzles(grade) {
  const g = g6(grade);
  const pools = [
    ['kor', () => draw(`kor:${g}`, KOR[g])[0]], ['math', () => draw(`math:${g}`, MATH[g])[0]()], ['sci', () => draw(`sci:${g}`, SCI[g])[0]],
    ['soc', () => draw(`soc:${g}`, SOC[g])[0]], ['eng', () => englishPuzzle('listen', g)], ['music', () => draw(`music:${g}`, MUSIC[g])[0]],
    ['art', () => draw(`art:${g}`, ART[g])[0]], ['pe', () => draw(`pe:${g}`, PE[g])[0]], ['code', () => draw(`codeq:${g}`, CODE_Q[g])[0]],
    ['bug', () => draw(`bugq:${g}`, BUGS[g].filter((p) => p.type !== 'bug'))[0]],
    ['job', () => { const j = JOBS[Math.floor(Math.random() * JOBS.length)].id; return draw(`job:${j}:${jobBand(g)}`, MISSIONS[j][jobBand(g)])[0]; }],
    ['fire', () => draw(`fire:${g}`, FIRE[g])[0]], ['market', () => { const p = draw(`market:${g}`, MARKET[g])[0]; return typeof p === 'function' ? p() : p; }], ['post', () => draw(`post:${g}`, POST[g])[0]],
  ];
  return shuffle(pools).slice(0, 4).map(([subj, f]) => ({ ...f(), subj }));
}

// 시험용
export const BANK = { KOR, SOC, SCI, MATH, WORDS, SENT, MELODIES, MUSIC, ART, PE, PE_MOVES, LEVELS, CODE_Q, FIRE, MARKET, POST, TURTLE, BUGS, MISSIONS };
export { pickOne };
