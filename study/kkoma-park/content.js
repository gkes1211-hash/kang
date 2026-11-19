// 꼬마 탐험대 공원: 놀이 구역과 문제 고르기.
// 문제는 content/ 폴더에 과목별로 있다. 문제를 더 넣으려면 그 파일의 학년 목록에 한 줄씩 더하면 된다.
import KOR from './content/kor.js';
import SOC from './content/soc.js';
import SCI from './content/sci.js';
import MATH from './content/math.js';
import { WORDS, SENT } from './content/eng.js';
import { MELODIES, MUSIC, PAINTS, MIXES, ART, PE_MOVES, PE } from './content/arts.js';
import { LEVELS, CODE_Q } from './content/code.js';
import { pickOne, shuffle } from './content/h.js';

export { shuffle, PAINTS, MIXES };

// 놀이 구역. host = 구역을 지키는 동물 친구, hello = 들어갈 때 하는 말
export const SUBJECTS = [
  { id: 'kor', name: '이야기 숲 도서관', short: '국어', emoji: '📚', color: '#ff8a7a', host: '🦉', hostName: '부엉이 박사', hello: '책 요정이 글자를 몽땅 숨겼어! 보물 상자 3개의 수수께끼를 풀어 줄래?' },
  { id: 'eng', name: 'ABC 놀이터', short: '영어', emoji: '🔤', color: '#5aa9f0', host: '🦜', hostName: '앵무새 헬로', hello: 'Hello! 영어 단어가 미끄럼틀에서 굴러떨어졌어. 같이 찾아 줘!' },
  { id: 'math', name: '숫자 성', short: '수학', emoji: '🏰', color: '#f4b33a', host: '🦁', hostName: '사자 임금님', hello: '성문 자물쇠는 숫자로 열린단다. 셈 박사님, 도와주겠나?' },
  { id: 'soc', name: '세계 여행 기차역', short: '사회', emoji: '🚂', color: '#3fbf7f', host: '🐻', hostName: '곰 역장님', hello: '칙칙폭폭! 여행 기차표를 받으려면 퀴즈 3개를 맞혀야 해요!' },
  { id: 'sci', name: '반짝 별 실험실', short: '과학', emoji: '🔬', color: '#2bb5c8', host: '🐙', hostName: '문어 박사', hello: '실험실이 엉망진창이야! 과학 수수께끼를 풀어서 정리해 줘!' },
  { id: 'code', name: '삐뽀 로봇 공장', short: '코딩', emoji: '🤖', color: '#7b6cf0', host: '🐧', hostName: '펭귄 공장장', hello: '삐뽀삐뽀! 로봇이 길을 잃었어. 명령 블록으로 열쇠까지 데려가 줘!' },
  { id: 'music', name: '딩동 음악 무대', short: '음악', emoji: '🎤', color: '#f06aa8', host: '🐦', hostName: '꾀꼬리 가수', hello: '오늘 밤 공연인데 악보가 흩어졌어! 노래로 금고를 열어 줘!' },
  { id: 'art', name: '무지개 물감 공방', short: '미술', emoji: '🌈', color: '#ff9346', host: '🦊', hostName: '여우 화가', hello: '무지개 색이 사라졌어! 물감을 섞어서 색을 되찾아 줄래?' },
  { id: 'pe', name: '튼튼 운동장', short: '체육', emoji: '⚽', color: '#5cbf3c', host: '🐯', hostName: '호랑이 코치', hello: '어흥! 몸을 움직여야 상자가 열린다! 준비됐지?' },
];
export const SUBJECT = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
export const STAMPS_TO_FLY = SUBJECTS.length; // 모든 구역 도장을 모으면 열기구를 탈 수 있다

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
export function puzzlesFor(subj, grade) {
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
      const lv = draw(`code:${g}`, LEVELS[g], 2).map((l) => ({ type: 'code', ...l, q: '블록을 놓아 로봇을 열쇠까지 데려가요.' }));
      return [lv[0], ...draw(`codeq:${g}`, CODE_Q[g], 1), lv[1]];
    }
    default: return draw(`kor:${g}`, KOR[g], 3);
  }
}

// 열기구 탈출장: 여러 구역에서 하나씩 (몸 움직이기·코딩 판은 빼고 머리로 푸는 것만)
export function finalPuzzles(grade) {
  const g = g6(grade);
  const pools = [
    ['kor', () => draw(`kor:${g}`, KOR[g])[0]], ['math', () => draw(`math:${g}`, MATH[g])[0]()], ['sci', () => draw(`sci:${g}`, SCI[g])[0]],
    ['soc', () => draw(`soc:${g}`, SOC[g])[0]], ['eng', () => englishPuzzle('listen', g)], ['music', () => draw(`music:${g}`, MUSIC[g])[0]],
    ['art', () => draw(`art:${g}`, ART[g])[0]], ['pe', () => draw(`pe:${g}`, PE[g])[0]], ['code', () => draw(`codeq:${g}`, CODE_Q[g])[0]],
  ];
  return shuffle(pools).slice(0, 4).map(([subj, f]) => ({ ...f(), subj }));
}

// 시험용
export const BANK = { KOR, SOC, SCI, MATH, WORDS, SENT, MELODIES, MUSIC, ART, PE, PE_MOVES, LEVELS, CODE_Q };
export { pickOne };
