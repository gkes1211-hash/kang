// 🏰 숫자 성 (수학) — 문제를 학년에 맞게 그때그때 새로 만든다 (같은 문제가 거의 다시 안 나온다)
import { C, N, X, ri, pickOne, shuffle } from './h.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const FRUITS = ['🍎', '🍓', '🍊', '🍌', '🍇', '🍑', '🍒', '🥝'];
const KIDS = ['민준', '서연', '지호', '하은', '도윤', '수아', '예준', '지우'];
const kid = () => pickOne(KIDS);

// 시계 문제: 바늘 시계를 보고 몇 시 몇 분인지 고르기
const hm = (h, m) => (m === 0 ? `${h}시` : `${h}시 ${m}분`);
function clock(step, ex = '') {
  const h = ri(1, 12);
  const m = step === 60 ? 0 : ri(0, 60 / step - 1) * step;
  const right = hm(h, m);
  const wrong = new Set();
  const h2 = (h % 12) + 1;
  const cands = [hm(h2, m), hm(h, (m + step) % 60), hm(Math.round(m / 5) || 12, (h * 5) % 60), hm(h === 1 ? 12 : h - 1, m), hm(h, (m + 60 - step) % 60)];
  for (const c of shuffle(cands)) if (c !== right && wrong.size < 3) wrong.add(c);
  return { type: 'clock', h, m, q: '시계를 보고 몇 시 몇 분인지 골라요. ⏰', opts: [right, ...wrong], a: 0, ex: ex || `짧은바늘은 "시", 긴바늘은 "분"을 가리켜요.`, hint: '짧은바늘을 먼저 봐요!' };
}

const MATH = {
  1: [
    () => { const a = ri(2, 5); const b = ri(1, 4); const f = pickOne(FRUITS); return N(`${f.repeat(a)}  ${f.repeat(b)}\n모두 몇 개일까요?`, a + b, `${a} + ${b} = ${a + b}`, '하나씩 세어 봐요.'); },
    () => { const a = ri(5, 9); const b = ri(1, a - 1); return N(`🍬 사탕이 ${a}개 있었는데 ${b}개를 먹었어요.\n남은 사탕은 몇 개일까요?`, a - b, `${a} - ${b} = ${a - b}`); },
    () => { const a = ri(1, 9); return N(`🐞 무당벌레 점이 ${a}개 있어요.\n10개가 되려면 몇 개가 더 있어야 할까요?`, 10 - a, `${a} + ${10 - a} = 10`, '손가락 10개로 생각해 봐요.'); },
    () => { const a = ri(11, 49); let b = ri(11, 49); while (b === a) b = ri(11, 49); return C('더 큰 수는?', [String(Math.max(a, b)), String(Math.min(a, b))], 0, '십의 자리부터 비교해요.'); },
    () => { const a = ri(3, 9); const b = ri(2, 9); return N(`🐸 연못에 개구리 ${a}마리가 있었는데\n${b}마리가 더 왔어요. 모두 몇 마리일까요?`, a + b, `${a} + ${b} = ${a + b}`); },
    () => clock(60),
    () => { const pats = [['🔴', '🔵'], ['🍎', '🍌', '🍎'], ['⭐', '⭐', '🌙']]; const p = pickOne(pats); const seq = Array.from({ length: 6 }, (_, i) => p[i % p.length]); const next = p[6 % p.length]; const opts = [...new Set([next, ...p, '🟢'])].slice(0, 3); return C(`규칙을 찾아요!\n${seq.join(' ')} ❓\n❓에 올 것은?`, [next, ...opts.filter((o) => o !== next)], 0, '되풀이되는 묶음을 찾아봐요.'); },
    () => { const n = ri(3, 8); return C(`${'🔺'.repeat(n)}\n세모는 모두 몇 개일까요?`, [String(n), String(n + 1), String(n - 1)], 0); },
  ],
  2: [
    () => { const a = ri(15, 59); const b = ri(15, 39); return N(`📚 도서관에 동화책 ${a}권, 그림책 ${b}권이 있어요.\n모두 몇 권일까요?`, a + b, `${a} + ${b} = ${a + b}`, '일의 자리부터 더하고, 10이 넘으면 받아올려요.'); },
    () => { const a = ri(41, 90); const b = ri(12, a - 10); return N(`🎈 풍선 ${a}개 중 ${b}개가 터졌어요.\n남은 풍선은 몇 개일까요?`, a - b, `${a} - ${b} = ${a - b}`, '일의 자리에서 뺄 수 없으면 받아내림해요.'); },
    () => { const a = ri(2, 9); const b = ri(2, 9); return N(`🧺 바구니마다 사과가 ${a}개씩 들어 있어요.\n${b}바구니에는 사과가 모두 몇 개일까요?`, a * b, `${a} × ${b} = ${a * b}`, `${a}단 곱셈구구를 외워 봐요.`); },
    () => { const b = ri(3, 6); return N(`🐞 무당벌레 한 마리의 다리는 6개예요.\n무당벌레 ${b}마리의 다리는 모두 몇 개일까요?`, 6 * b, `6 × ${b} = ${6 * b}`); },
    () => pickOne([N('1m는 몇 cm일까요?', 100), N('1시간은 몇 분일까요?', 60), N('하루는 몇 시간일까요?', 24), N('1주일은 며칠일까요?', 7)]),
    () => { const a = ri(1, 9) * 10; return N(`${a}에 얼마를 더하면 100이 될까요?`, 100 - a, `${a} + ${100 - a} = 100`); },
    () => clock(5),
    () => { const s = ri(2, 5); const st = ri(1, 10); const seq = [0, 1, 2, 3].map((i) => st + s * i); return N(`규칙을 찾아요!\n${seq.join(', ')}, ❓`, st + s * 4, `${s}씩 커져요.`); },
    () => { const h = ri(1, 5); const t = ri(1, 9); return N(`🪙 100원짜리 ${h}개와 10원짜리 ${t}개가 있어요.\n모두 몇 원일까요?`, h * 100 + t * 10, `${h * 100} + ${t * 10} = ${h * 100 + t * 10}`); },
  ],
  3: [
    () => { const a = ri(120, 599); const b = ri(110, 399); return N(`🚂 기차에 ${a}명이 타고 있었는데 다음 역에서 ${b}명이 더 탔어요.\n모두 몇 명일까요?`, a + b); },
    () => { const a = ri(400, 900); const b = ri(110, a - 50); return N(`📄 색종이 ${a}장 중 ${b}장을 썼어요.\n남은 색종이는 몇 장일까요?`, a - b); },
    () => { const a = ri(12, 49); const b = ri(3, 6); return N(`🥚 달걀이 한 판에 ${a}개씩 ${b}판 있어요.\n달걀은 모두 몇 개일까요?`, a * b, `${a} × ${b} = ${a * b}`, '십의 자리와 일의 자리로 나눠 곱해 봐요.'); },
    () => { const b = ri(3, 9); const q = ri(3, 9); return N(`🍪 쿠키 ${b * q}개를 ${b}명이 똑같이 나눠 먹으면\n한 명이 몇 개씩 먹을까요?`, q, `${b * q} ÷ ${b} = ${q}`, `${b}단 곱셈구구에서 ${b * q}를 찾아봐요.`); },
    () => { const d = ri(3, 8); const n = ri(1, d - 1); const opts = [...new Set([`${n}/${d}`, `${d}/${n}`, `${n}/${d + 1}`, `${d - n}/${d}`, `${n + 1}/${d}`])].slice(0, 4); return C(`🍕 피자를 똑같이 ${d}조각으로 나눠 ${n}조각을 먹었어요.\n먹은 양을 분수로 나타내면?`, opts, 0, `전체 ${d}조각 중 ${n}조각 → ${n}/${d}`); },
    () => clock(1),
    () => { const h = ri(1, 3); const m = ri(5, 55); return N(`⏱️ ${h}시간 ${m}분은 모두 몇 분일까요?`, h * 60 + m, `${h} × 60 + ${m} = ${h * 60 + m}`); },
    () => { const r = ri(2, 9); return N(`⭕ 반지름이 ${r}cm인 원의 지름은 몇 cm일까요?`, r * 2, '지름 = 반지름 × 2'); },
    () => pickOne([N('1km는 몇 m일까요?', 1000), N('1분은 몇 초일까요?', 60), N('1cm는 몇 mm일까요?', 10), N('1L는 몇 mL일까요?', 1000)]),
  ],
  4: [
    () => { const a = ri(120, 480); const b = ri(12, 39); return N(`📦 한 상자에 사과가 ${a}개씩, ${b}상자가 있어요.\n사과는 모두 몇 개일까요?`, a * b); },
    () => { const b = ri(12, 30); const q = ri(11, 30); return N(`🚌 학생 ${b * q}명이 버스에 똑같이 나눠 타요.\n한 버스에 ${b}명씩 타면 버스는 몇 대 필요할까요?`, q, `${b * q} ÷ ${b} = ${q}`); },
    () => { const d = ri(5, 12); const a = ri(1, d - 3); const b = ri(1, d - a - 1); return N(`${a}/${d} + ${b}/${d} = □/${d}\n□에 알맞은 수는?`, a + b, '분모가 같으면 분자끼리 더해요.'); },
    () => pickOne([N('직각은 몇 도일까요?', 90), N('삼각형 세 각의 크기를 모두 더하면 몇 도일까요?', 180), N('사각형 네 각의 크기를 모두 더하면 몇 도일까요?', 360), N('일직선(평각)은 몇 도일까요?', 180)]),
    () => { const a = ri(30, 80); const b = ri(20, 150 - a); return N(`📐 삼각형의 두 각이 ${a}°, ${b}°예요.\n나머지 한 각은 몇 도일까요?`, 180 - a - b, `180 - ${a} - ${b} = ${180 - a - b}`, '삼각형 세 각의 합은 180°!'); },
    () => { const sides = pickOne([['오각형', 5], ['육각형', 6], ['팔각형', 8], ['칠각형', 7]]); return N(`⬡ ${sides[0]}의 변은 몇 개일까요?`, sides[1]); },
    () => { const a = ri(1, 9); const b = ri(1, 9); const s = (a + b) / 10; return N(`0.${a} + 0.${b} = ?`, String(s), `0.1이 ${a + b}개 → ${s}`, '0.1이 몇 개인지 세어 봐요.'); },
    () => pickOne([N('1억은 1000만의 몇 배일까요?', 10), N('10000은 1000의 몇 배일까요?', 10), N('1조는 1000억의 몇 배일까요?', 10)]),
    () => { const t = pickOne([12, 15, 18, 21]); const d = ri(3, 12); const say = Math.random() < 0.5 ? d : d + pickOne([-2, 2, 5]); return X(`🌡️ 아침 기온이 ${t}℃, 낮 기온이 ${t + d}℃예요.\n낮이 아침보다 ${say}℃ 더 높아요.`, say === d, `${t + d} - ${t} = ${d}`); },
  ],
  5: [
    () => { const g = ri(2, 9); let a = ri(2, 6); let b = ri(2, 6); while (gcd(a, b) !== 1 || a === b) { a = ri(2, 7); b = ri(2, 7); } return N(`🍬 사탕 ${g * a}개와 젤리 ${g * b}개를 남김없이 똑같이 나눠 주려고 해요.\n최대 몇 명에게 나눠 줄 수 있을까요?`, g, `${g * a}과(와) ${g * b}의 최대공약수 = ${g}`, '두 수를 똑같이 나눌 수 있는 가장 큰 수를 찾아요.'); },
    () => { let a = ri(2, 9); let b = ri(2, 9); while (a === b) b = ri(2, 9); return N(`🚌 A 버스는 ${a}분마다, B 버스는 ${b}분마다 와요.\n두 버스가 함께 떠난 뒤 처음 다시 함께 오는 건 몇 분 뒤일까요?`, (a * b) / gcd(a, b), '최소공배수를 구해요.', '두 수의 배수를 차례로 적어 봐요.'); },
    () => { const w = ri(3, 15); const h = ri(3, 12); return N(`🟩 가로 ${w}m, 세로 ${h}m인 텃밭의 넓이는 몇 m²일까요?`, w * h, '넓이 = 가로 × 세로'); },
    () => { const b = ri(2, 10) * 2; const h = ri(3, 12); return N(`🔺 밑변 ${b}cm, 높이 ${h}cm인 삼각형의 넓이는 몇 cm²일까요?`, (b * h) / 2, '삼각형 넓이 = 밑변 × 높이 ÷ 2'); },
    () => { const a = ri(2, 9); const b = ri(2, 9); const c = ri(2, 9); return N(`${a} + ${b} × ${c} = ?`, a + b * c, '곱셈을 먼저 계산해요!', '덧셈보다 곱셈이 먼저예요.'); },
    () => { const m = ri(5, 15); const d = ri(1, 3); const xs = shuffle([m - d, m, m + d]); return N(`📊 세 친구의 줄넘기 기록: ${xs.join('번, ')}번\n평균은 몇 번일까요?`, m, '평균 = 모두 더한 값 ÷ 사람 수'); },
    () => { const k = ri(2, 4); const n = ri(1, 4); const d = n + ri(1, 4); if (gcd(n, d) !== 1) return C('2/4를 기약분수로 나타내면?', ['1/2', '2/2', '1/4', '4/2'], 0); const opts = [...new Set([`${n}/${d}`, `${n * k}/${d}`, `${n}/${d * k}`, `${n + 1}/${d}`, `${n}/${d + 1}`, `${d}/${n}`])].slice(0, 4); return C(`${n * k}/${d * k}을(를) 기약분수로 나타내면?`, opts, 0, `분모와 분자를 ${k}(으)로 나눠요.`); },
    () => { const a = pickOne([0.2, 0.4, 0.5, 1.5, 2.5]); const b = pickOne([2, 4, 6, 8]); const v = Math.round(a * b * 10) / 10; return N(`${a} × ${b} = ?`, String(v), '', '소수점 위치를 잘 보세요.'); },
  ],
  6: [
    () => { const p = pickOne([10, 20, 25, 50]); const n = pickOne([40, 60, 80, 200, 120]); return N(`🏷️ ${n * 100}원짜리 장난감을 ${p}% 할인해요.\n얼마를 깎아 줄까요? (원)`, n * p, `${n * 100} × ${p}/100 = ${n * p}`); },
    () => { const a = ri(2, 5); const b = ri(a + 1, 9); const k = ri(2, 5); return N(`🧃 주스와 물을 ${a} : ${b}로 섞어요.\n주스를 ${a * k}컵 넣으면 물은 몇 컵 넣어야 할까요?`, b * k, `${a} : ${b} = ${a * k} : ${b * k}`, '비의 앞과 뒤에 같은 수를 곱해요.'); },
    () => { const a = ri(2, 6); const b = ri(2, 6); const c = ri(2, 6); return N(`📦 가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 상자의 부피는 몇 cm³일까요?`, a * b * c, '부피 = 가로 × 세로 × 높이'); },
    () => { const r = ri(2, 6); return N(`⭕ 반지름이 ${r}cm인 원의 넓이는? (원주율 3)`, 3 * r * r, '원의 넓이 = 반지름 × 반지름 × 원주율'); },
    () => { const d = pickOne([2, 3, 4, 5]); const n = d * ri(1, 4); return N(`🧁 케이크 ${n}개를 1/${d}개씩 나누면 몇 조각이 될까요?`, n * d, `${n} ÷ 1/${d} = ${n} × ${d}`); },
    () => { const a = pickOne([1.2, 2.4, 3.6, 4.8]); const b = pickOne([2, 4]); const v = Math.round((a / b) * 10) / 10; return N(`${a} ÷ ${b} = ?`, String(v), '', '자연수 나눗셈처럼 하고 소수점 위치를 맞춰요.'); },
    () => { const all = pickOne([20, 25, 40, 50]); const part = all * pickOne([0.2, 0.4, 0.6]); return N(`🎯 화살 ${all}발 중 ${part}발을 맞혔어요.\n맞힌 비율은 몇 %일까요?`, (part / all) * 100, `${part} ÷ ${all} × 100`); },
    () => { const r = ri(2, 6); return N(`⭕ 반지름이 ${r}cm인 원의 둘레는? (원주율 3)`, 2 * r * 3, '원주 = 지름 × 원주율'); },
  ],
};
export default MATH;
