// 여러 단원에서 같이 쓰는 문제 스타일 (기획서 6번 B)
//   oxWhy:    O/X 판단 + 이유를 객관식으로 고르기
//   lineFind: 친구 풀이에서 처음으로 틀린 줄 찾기
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const W = M5.words, T = M5.text;
  const j = T.j;

  // O/X 판단 + 이유
  // gen(r, lv) → { statement, truth, why, wrong: [그럴듯하지만 틀린 이유 2개], hint, key, data }
  // 보기 4개: (맞는 판단, 맞는 이유) / (맞는 판단, 틀린 이유) / (틀린 판단, 틀린 이유 2개)
  function oxWhy({ id, unit, sub, levels = [1, 4], gen, check }) {
    return {
      id, unit, sub, style: 'B', styleName: 'O/X와 이유', levels,
      build(r, lv) {
        const g = gen(r, lv);
        if (!g) return null;
        const yes = g.truth ? 'O' : 'X', no = g.truth ? 'X' : 'O';
        const [w1, w2] = g.wrong;
        if (new Set([g.why, w1, w2]).size < 3) return null;
        const opts = [
          { text: `${yes}, ${g.why}`, correct: true },
          { text: `${yes}, ${w1}`, correct: false, pattern: { cause: 'concept', msg: `판단은 맞았지만 이유가 달라요. ${g.why}` } },
          { text: `${no}, ${w1}`, correct: false, pattern: { cause: 'concept', msg: `이 말은 ${g.truth ? '맞아요' : '틀려요'}. ${g.why}` } },
          { text: `${no}, ${w2}`, correct: false, pattern: { cause: 'concept', msg: `이 말은 ${g.truth ? '맞아요' : '틀려요'}. ${g.why}` } },
        ];
        return {
          text: `다음 말이 맞으면 O, 틀리면 X로 판단하고, 알맞은 이유까지 함께 고르세요.\n"${g.statement}"`,
          answer: { type: 'choice', options: opts },
          hints: [
            '먼저 맞는 말인지 틀린 말인지 판단해요. 작은 수로 예를 들어 직접 확인해 보면 좋아요.',
            g.hint || '판단한 다음, 그 판단을 뒷받침하는 이유를 골라요.',
            `${yes} → ${g.why}`,
          ],
          solution: [`${g.truth ? '맞는 말이에요 (O).' : '틀린 말이에요 (X).'} ${g.why}`],
          key: `${id}|${g.key}`,
          data: Object.assign({ truth: g.truth }, g.data || {}),
        };
      },
      verify(p) {
        const opt = p.answer.options[p.answer.value];
        if (!opt.text.startsWith(p.data.truth ? 'O,' : 'X,')) return false;
        return check ? check(p) : true;
      },
    };
  }

  // 친구 풀이에서 처음으로 틀린 줄 찾기
  // gen(r, lv) → { problem, lines: [바른 줄들], bad: { i, line, msg }, after: [틀린 줄 뒤에 이어지는 줄들], key, data }
  //   친구의 풀이 = lines[0..i-1] + bad.line + after
  function lineFind({ id, unit, sub, levels = [1, 4], gen, check }) {
    return {
      id, unit, sub, style: 'B', styleName: '틀린 줄 찾기', levels,
      build(r, lv) {
        const g = gen(r, lv);
        if (!g) return null;
        const fname = r.pick(W.names);
        const shown = [...g.lines.slice(0, g.bad.i), g.bad.line, ...g.after];
        if (new Set(shown).size !== shown.length || shown.length < 3) return null;
        const opts = shown.map((line, k) => Object.assign(
          { key: `${k}|${line}`, text: line, correct: k === g.bad.i },
          k === g.bad.i ? {} : { pattern: k < g.bad.i
            ? { cause: 'concept', msg: '이 줄은 맞게 했어요. 그 다음 줄들을 하나씩 다시 확인해 봐요.' }
            : { cause: 'concept', msg: '이 줄도 이상하지만, 처음으로 틀린 줄은 이보다 앞에 있어요. 앞에서 생긴 실수가 이어진 거예요.' } },
        ));
        return {
          text: `${j(fname, '이/가')} ${g.problem} ${g.verb || '계산한'} 풀이예요.\n처음으로 틀린 줄을 고르세요.`,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: [
            '풀이를 맨 위 줄부터 한 줄씩 직접 계산해서 확인해요.',
            `${g.lines.length}줄 중에서 ${g.bad.i === 0 ? '첫째' : g.bad.i === 1 ? '둘째' : '셋째'} 줄까지 차근차근 봐요.`,
            `${g.bad.msg} 바르게 고치면: ${g.lines[g.bad.i]}`,
          ],
          solution: [`처음으로 틀린 줄: ${g.bad.line}`, g.bad.msg, `바른 풀이: ${g.lines.join('  →  ')}`],
          key: `${id}|${g.key}|${g.bad.i}`,
          data: Object.assign({ badIndex: g.bad.i }, g.data || {}),
        };
      },
      verify(p) {
        if (p.answer.value !== p.data.badIndex) return false;
        return check ? check(p) : true;
      },
    };
  }

  M5.tb = { oxWhy, lineFind };
})();
