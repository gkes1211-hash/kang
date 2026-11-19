// 노래 연습장: 처음 쓰는 사람을 위한 안내 (마이크 켜기 → 소리 내 보기 → 화면 둘러보기), 사용법, 카톡 안 브라우저 안내.
'use strict';

const UA = navigator.userAgent;
const IS_IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(UA);
// 카카오톡·네이버·인스타그램 같은 앱 안에서 열린 브라우저 (마이크가 막히는 일이 많다)
const IN_APP = /KAKAOTALK/i.test(UA) ? '카카오톡'
  : /NAVER\(inapp|NAVER/.test(UA) && /inapp/i.test(UA) ? '네이버'
    : /Instagram/i.test(UA) ? '인스타그램'
      : /FBAN|FBAV/.test(UA) ? '페이스북'
        : /\bLine\//.test(UA) ? '라인'
          : /DaumApps/i.test(UA) ? '다음'
            : /BAND\//.test(UA) ? '밴드' : '';

function inAppBanner() {
  if (!IN_APP) return '';
  const url = location.href.split('#')[0];
  const kakao = IN_APP === '카카오톡' ? `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}` : '';
  const chrome = IS_ANDROID ? `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end` : '';
  return `<div class="card warn-card"><h2>⚠️ ${IN_APP} 안에서 열렸어요</h2>
    <p>${IN_APP} 안의 브라우저에서는 <b>마이크가 막혀서</b> 노래를 못 들을 수 있어요. ${IS_IOS ? '<b>사파리</b>' : '<b>크롬</b>'}으로 열어 주세요.</p>
    ${kakao ? `<a class="big-btn" href="${kakao}">🌐 다른 브라우저로 열기</a>` : chrome ? `<a class="big-btn" href="${chrome}">🌐 크롬으로 열기</a>` : ''}
    <p class="small" style="margin-top:10px">안 되면: 화면 ${IS_IOS ? '아래' : '위'}쪽 <b>⋮</b> 또는 <b>공유</b> 버튼 → <b>"다른 브라우저로 열기"</b>${IS_IOS ? ' / <b>"Safari로 열기"</b>' : ''}</p>
  </div>`;
}

// 마이크를 못 쓸 때, 기기에 맞는 방법 알려 주기
function micFixHtml(e) {
  if (e && e.message === 'nomic') return '이 브라우저는 마이크를 지원하지 않아요. <b>크롬</b>이나 <b>사파리</b>로 열어 주세요.';
  if (IN_APP) return `${IN_APP} 안에서 열려서 마이크가 막혔어요. 첫 화면의 <b>🌐 다른 브라우저로 열기</b>를 눌러 주세요.`;
  const busy = e && (e.name === 'NotReadableError' || e.name === 'AbortError');
  if (busy) return '다른 앱이 마이크를 쓰고 있어요. <b>통화·녹음기·영상 앱</b>을 끄고 다시 해 봐요.';
  if (e && e.name === 'NotFoundError') return '마이크를 찾지 못했어요. 컴퓨터라면 마이크(또는 마이크 달린 이어폰)를 꽂아 주세요.';
  const how = IS_IOS
    ? '<ol class="steps"><li>주소창 왼쪽 <b>가A</b>(또는 <b>ⓘ</b>) 누르기</li><li><b>웹 사이트 설정 → 마이크 → 허용</b></li><li>안 보이면: 아이폰 <b>설정 → Safari → 마이크 → 허용</b></li><li>이 페이지 새로고침</li></ol>'
    : IS_ANDROID
      ? '<ol class="steps"><li>주소창 왼쪽 <b>🔒</b>(또는 설정 모양) 누르기</li><li><b>권한 → 마이크 → 허용</b></li><li>안 되면: 휴대폰 <b>설정 → 애플리케이션 → Chrome → 권한 → 마이크 → 허용</b></li><li>이 페이지 새로고침</li></ol>'
      : '<ol class="steps"><li>주소창 왼쪽 <b>🔒</b> 누르기</li><li><b>마이크 → 허용</b></li><li>이 페이지 새로고침</li></ol>';
  return `마이크 사용이 <b>허용되지 않았어요.</b> 이렇게 바꿔 주세요:${how}`;
}

// ---------- 처음 안내: 마이크 켜고 "아~" 해 보기 ----------
async function exGuide() {
  routine = null;
  openPlay('👋 처음 쓰는 법');
  const step1 = () => {
    body(`
      <div class="guide-steps"><i class="on"></i><i></i><i></i></div>
      <div class="done-pic">🎙️</div>
      <div class="done-title">1. 마이크 켜기</div>
      <p class="guide-p">이 앱은 마이크로 <b>내 노래를 듣고</b> 무슨 음인지 알려 줘요.<br>
        아래 버튼을 누르면 <b>"마이크를 사용하시겠습니까?"</b> 창이 떠요.<br>꼭 <b class="accent-t">허용</b>을 눌러 주세요!</p>
      <div class="permit-demo" aria-hidden="true"><span>🎙️ 마이크 사용</span><b>허용</b></div>
      <p class="small muted center">🔒 소리는 이 기기 안에서만 써요. 저장하거나 어디로 보내지 않아요.</p>
      <div class="spacer"></div>
      <button type="button" class="big-btn" id="gd-mic">🎙️ 마이크 켜기</button>`);
    $('#gd-mic').onclick = async () => {
      Mic.ensureCtx();
      try { await Mic.open(); meterReset(); step2(); } catch (e) {
        body(`
          <div class="guide-steps"><i class="on"></i><i></i><i></i></div>
          <div class="done-pic">😢</div><div class="done-title">마이크를 켜지 못했어요</div>
          <div class="feedback bad guide-fix">${micFixHtml(e)}</div>
          <div class="spacer"></div>
          <button type="button" class="big-btn" id="gd-retry">↺ 다시 해 보기</button>`);
        $('#gd-retry').onclick = () => location.reload();
      }
    };
  };
  const step2 = () => {
    body(`
      <div class="guide-steps"><i class="on"></i><i class="on"></i><i></i></div>
      <div class="done-title">2. "아~" 하고 길게 소리 내 보세요</div>
      <p class="guide-p">휴대폰을 얼굴에서 <b>한 뼘</b>쯤 떨어뜨리고, <b>보통 크기</b>로 <b>"아~~~"</b> 하고 2초쯤 끌어요.<br>
        <span class="small muted">말하듯 짧게 하면 잘 안 나와요. 한 음으로 길게!</span></p>
      <div class="big-level" aria-hidden="true"><i id="gd-level"></i></div>
      <div class="note-big"><b id="gd-note">🎤</b><span id="gd-sub">기다리는 중…</span></div>
      <div class="hold"><i id="gd-hold"></i></div>
      <div class="feedback info" id="gd-help" hidden></div>
      <div class="spacer"></div>
      <button type="button" class="big-btn ghost" id="gd-skip">잘 모르겠어요, 다음으로</button>`);
    let held = 0, quiet = 0, loudSeen = false, last = null;
    $('#gd-skip').onclick = step3;
    frame((now, dt) => {
      const r = hear(now);
      const lv = clamp((20 * Math.log10(r.rms + 1e-6) + 58) / 40, 0, 1);
      $('#gd-level').style.width = `${lv * 100}%`;
      if (r.rms > Mic.gate * 1.3) loudSeen = true; else if (!loudSeen) quiet += dt;
      if (r.voiced) {
        held += dt; last = Math.round(r.midi);
        $('#gd-note').textContent = nm(last);
        $('#gd-sub').textContent = '좋아요! 그대로 쭉~';
      } else if (r.rms > Mic.gate) {
        $('#gd-sub').textContent = '소리는 들려요! "아~" 하고 한 음으로 길게 끌어 봐요';
      }
      $('#gd-hold').style.width = `${Math.min(100, (held / 1.2) * 100)}%`;
      if (quiet > 7 && $('#gd-help').hidden) {
        $('#gd-help').hidden = false;
        $('#gd-help').innerHTML = `🤔 아직 소리가 안 들려요. 이렇게 해 봐요:<ul class="steps">
          <li>조금 더 <b>크게</b>, 휴대폰 <b>아래쪽 마이크</b> 가까이에서</li>
          <li>블루투스 <b>이어폰</b>을 끼고 있으면 빼고 해 보기</li>
          <li>통화·녹음기·영상 앱이 켜져 있으면 끄기</li>
          ${IS_IOS ? '<li>화면을 한 번 <b>톡</b> 눌러 보기</li>' : ''}</ul>`;
      }
      if (held >= 1.2) {
        stopRun();
        Synth.note(72, 0.15, 0, null, 0.08); Synth.note(76, 0.15, 0.12, null, 0.08); Synth.note(79, 0.3, 0.24, null, 0.08);
        body(`
          <div class="guide-steps"><i class="on"></i><i class="on"></i><i></i></div>
          <div class="done-pic">🎉</div><div class="done-title">잘 들려요!</div>
          <div class="feedback good center">방금 낸 음은 <b>${nm(last)} (${Notes.en(last)})</b>예요.<br>이제 앱이 내 노래를 들을 수 있어요.</div>
          <div class="spacer"></div>
          <button type="button" class="big-btn" id="gd-next">다음 →</button>`);
        $('#gd-next').onclick = step3;
        return false;
      }
    });
  };
  const step3 = () => {
    stopRun();
    S.guided = true; save();
    body(`
      <div class="guide-steps"><i class="on"></i><i class="on"></i><i class="on"></i></div>
      <div class="done-title">3. 이렇게 써요</div>
      ${helpHtml(true)}
      <div class="spacer"></div>
      <button type="button" class="big-btn" data-act="close">🎤 시작하기</button>`);
  };
  step1();
}

// 사용법 내용 (안내 3단계와 ❓ 사용법 화면에서 같이 쓴다)
function helpHtml(short) {
  return `
    <div class="help">
      <div class="help-item"><span class="mm-demo"><i></i><i></i><i></i><i></i><i></i> 들려요 👍</span>
        <p>연습 화면 <b>오른쪽 위</b>에 이 표시가 있어요. 초록색이면 <b>잘 듣고 있는 것</b>, 빨간 <b>"안 들려요"</b>면 마이크를 확인해요.</p></div>
      <div class="help-item"><span class="hi-ico">▶</span><p><b>오늘의 연습</b>: 처음엔 이것만 눌러도 돼요. 5분 동안 차례로 연습해요.</p></div>
      <div class="help-item"><span class="hi-ico">🎚️</span><p><b>음정 보기</b>: 아무 노래나 부르면 무슨 음인지, 높은지(↓) 낮은지(↑) 보여 줘요.</p></div>
      <div class="help-item"><span class="hi-ico">🎯</span><p><b>음 맞추기 · 🪜 발성 연습</b>: 앱이 먼저 들려줘요(🔊). 다 듣고 <b>"🎤 불러요!"</b>가 나오면 그때 따라 불러요.</p></div>
      <div class="help-item"><span class="hi-ico">🎶</span><p><b>반주</b> 탭: 내 반주 파일을 넣고 틀어 놓고 불러요. <b>🎧 이어폰</b>을 끼면 더 정확해요.</p></div>
      ${short ? '' : `
      <div class="help-item"><span class="hi-ico">📼</span><p><b>녹음</b> 탭: 녹음해서 들어 보고, 음 높이 그래프로 흔들린 곳을 찾아요.</p></div>
      <div class="help-item"><span class="hi-ico">⚙️</span><p><b>설정</b>: 목소리 높이, 판정(쉬움·보통·어려움), 도레미/CDE를 바꿔요.</p></div>
      <h3 class="help-h">🤔 소리를 못 들을 때</h3>
      <ul class="steps">
        <li><b>"아~~~"</b> 하고 한 음으로 <b>길게</b> 불러요. 말하듯 짧게 하면 음을 못 찾아요.</li>
        <li>카카오톡·네이버 앱 안에서 열었다면 <b>${IS_IOS ? '사파리' : '크롬'}로 열기</b></li>
        <li>마이크 <b>허용</b>했는지 확인 (주소창 왼쪽 ${IS_IOS ? '가A' : '🔒'} → 마이크)</li>
        <li>블루투스 이어폰을 빼거나, 이어폰 마이크에 대고 부르기</li>
        <li>통화·녹음기·영상 앱 끄기</li>
        ${IS_IOS ? '<li>화면을 한 번 톡 누르기 (아이폰은 그때 소리를 듣기 시작해요)</li>' : ''}
      </ul>`}
    </div>`;
}
function exHelp() {
  routine = null;
  openPlay('❓ 사용법');
  body(`${helpHtml(false)}
    <div class="btn-row"><button type="button" class="big-btn ghost" data-act="guide">🎙️ 마이크 확인 다시 하기</button></div>`);
}
