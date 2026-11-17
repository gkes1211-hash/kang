import { useEffect, useRef, useState } from 'react';
import { MissionMode } from './modes/MissionMode';
import { WorkshopMode, type Guard } from './modes/WorkshopMode';
import { TheaterMode } from './modes/TheaterMode';
import { DialogProvider, Modal, useDialog } from './components/Dialog';
import { Icon } from './components/Icon';
import { HatLogo, Mascot } from './components/MiniGrid';
import { loadProgress, loadSettings, save, saveSettings, type Progress, type Settings } from './lib/storage';
import { titleFor, MAX_STARS } from './lib/scoring';
import { setMuted, sfx } from './lib/sound';

type Mode = 'mission' | 'workshop' | 'theater';

const MODES: { id: Mode; name: string; sub: string; icon: string }[] = [
  { id: 'mission', name: '마법 따라 그리기', sub: '코딩 미션', icon: 'map' },
  { id: 'workshop', name: '자유 픽셀 공방', sub: '나만의 작품', icon: 'palette' },
  { id: 'theater', name: '움직이는 픽셀 극장', sub: '애니메이션', icon: 'film' },
];

export default function App() {
  return (
    <DialogProvider>
      <Lab />
    </DialogProvider>
  );
}

function Lab() {
  const dialog = useDialog();
  const [mode, setMode] = useState<Mode>('mission');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [help, setHelp] = useState(!settings.seenHelp);
  const workshopGuard = useRef<Guard | null>(null);
  const theaterGuard = useRef<Guard | null>(null);

  useEffect(() => {
    saveSettings(settings);
    setMuted(settings.muted);
  }, [settings]);

  // 저장하지 않은 작품이 있을 때 창을 닫으려 하면 브라우저가 한 번 더 물어봄
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (workshopGuard.current?.isDirty() || theaterGuard.current?.isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, []);

  const totalStars = Object.values(progress).reduce((a, r) => a + r.stars, 0);

  const record = (id: string, stars: number, used: number) => {
    setProgress((p) => {
      const old = p[id];
      const next = { ...p, [id]: { stars: Math.max(old?.stars ?? 0, stars), best: old?.best ? Math.min(old.best, used) : used, doneAt: Date.now() } };
      save('progress', next);
      return next;
    });
  };

  const switchMode = async (m: Mode) => {
    if (m === mode) return;
    const g = mode === 'workshop' ? workshopGuard.current : mode === 'theater' ? theaterGuard.current : null;
    if (g?.isDirty()) {
      const r = await dialog.choose({
        title: '아직 저장하지 않았어요',
        message: (
          <>
            지금 만들던 작품을 저장할까요?
            <br />
            <small className="muted">저장하지 않아도 이 컴퓨터에서 돌아오면 이어서 할 수 있어요.</small>
          </>
        ),
        ok: '저장하고 이동',
        alt: '나중에 저장',
        cancel: '머무르기',
        icon: 'save',
      });
      if (r === 'cancel') return;
      if (r === 'ok' && !g.save()) return;
    }
    sfx.click();
    setMode(m);
  };

  const fullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } catch {
      /* 지원하지 않는 브라우저 */
    }
  };

  const upd = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <HatLogo size={42} />
          <div>
            <div className="brand-name">픽셀 마법사 연구소</div>
            <div className="brand-sub">작은 픽셀에 마법을 걸어봐!</div>
          </div>
        </div>
        <nav className="mode-tabs" role="tablist" aria-label="모드 선택">
          {MODES.map((m) => (
            <button key={m.id} role="tab" aria-selected={mode === m.id} className={'mode-tab t-' + m.id + (mode === m.id ? ' on' : '')} onClick={() => switchMode(m.id)}>
              <Icon name={m.icon} size={22} />
              <span>
                <b>{m.name}</b>
                <small>{m.sub}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="top-right">
          <div className="title-badge" title={`모은 별 ${totalStars} / ${MAX_STARS}`}>
            <Icon name="star" size={20} className="star on" />
            <b>{totalStars}</b>
            <span>{titleFor(totalStars)}</span>
          </div>
          <button className="icon-btn" onClick={() => upd({ muted: !settings.muted })} aria-label={settings.muted ? '소리 켜기' : '소리 끄기'} title={settings.muted ? '소리 켜기' : '소리 끄기'}>
            <Icon name={settings.muted ? 'mute' : 'sound'} size={22} />
          </button>
          <button className="icon-btn" onClick={fullscreen} aria-label="전체 화면" title="전체 화면">
            <Icon name="fullscreen" size={22} />
          </button>
          <button className="icon-btn" onClick={() => setHelp(true)} aria-label="사용 방법" title="사용 방법">
            <Icon name="help" size={22} />
          </button>
        </div>
      </header>

      <main className="stage-area">
        <div className={'mode-pane' + (mode === 'mission' ? ' on' : '')} hidden={mode !== 'mission'}>
          <MissionMode
            active={mode === 'mission'}
            progress={progress}
            onRecord={record}
            speed={settings.speed}
            onSpeed={(n) => upd({ speed: n })}
            unlockAll={settings.unlockAll}
            onUnlockAll={(v) => upd({ unlockAll: v })}
          />
        </div>
        <div className={'mode-pane' + (mode === 'workshop' ? ' on' : '')} hidden={mode !== 'workshop'}>
          <WorkshopMode active={mode === 'workshop'} speed={settings.speed} onSpeed={(n) => upd({ speed: n })} guard={workshopGuard} />
        </div>
        <div className={'mode-pane' + (mode === 'theater' ? ' on' : '')} hidden={mode !== 'theater'}>
          <TheaterMode active={mode === 'theater'} speed={settings.speed} onSpeed={(n) => upd({ speed: n })} guard={theaterGuard} />
        </div>
      </main>

      {help && (
        <Modal
          title="픽셀 마법사 연구소에 온 걸 환영해요!"
          icon="wand"
          wide
          onClose={() => {
            setHelp(false);
            upd({ seenHelp: true });
          }}
          footer={
            <button
              className="btn primary"
              data-autofocus
              onClick={() => {
                setHelp(false);
                upd({ seenHelp: true });
              }}
            >
              <Icon name="wand" size={20} /> 마법 시작!
            </button>
          }
        >
          <div className="help">
            <div className="speech">
              <Mascot size={56} />
              <p>
                나는 연구소의 마법사 <b>도토</b>야. 주문 블록을 차례대로 놓으면 <b>마법 펜</b>이 그대로 움직이며 픽셀을 칠해 줘!
              </p>
            </div>
            <ol className="help-steps">
              <li>
                <span className="hs-icon k-move">
                  <Icon name="wand" size={26} />
                </span>
                <b>1. 블록 넣기</b>
                <small>왼쪽 블록 상자에서 블록을 누르면 주문서에 쌓여요. 끌어서 순서를 바꿀 수 있어요.</small>
              </li>
              <li>
                <span className="hs-icon k-paint">
                  <Icon name="play" size={26} />
                </span>
                <b>2. 실행하기</b>
                <small>실행 버튼을 누르면 위에서부터 한 블록씩 실행돼요. "한 단계씩"으로 천천히 볼 수도 있어요.</small>
              </li>
              <li>
                <span className="hs-icon k-repeat">
                  <Icon name="loop" size={26} />
                </span>
                <b>3. 고치고 다시!</b>
                <small>틀려도 괜찮아요. 빨간 블록과 ✕ 칸을 보고 고친 다음 다시 실행해요.</small>
              </li>
            </ol>
            <div className="help-rules">
              <span>
                <Icon name="target" size={18} /> 펜은 왼쪽 위 <b>(0,0)</b>에서 출발해요
              </span>
              <span>
                <Icon name="brush" size={18} /> <b>색칠하기</b> 블록을 만나야 칸이 칠해져요
              </span>
              <span>
                <Icon name="save" size={18} /> 작품은 이 컴퓨터의 브라우저에 저장돼요
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
