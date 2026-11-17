import { useEffect, useMemo, useState } from 'react';
import type { Program } from '../engine/types';
import { runProgram } from '../engine/engine';
import { PALETTE } from '../engine/palette';
import { countBlocks, cloneProgram, newId } from '../engine/program';
import { BlockEditor } from '../components/BlockEditor';
import { PixelCanvas } from '../components/PixelCanvas';
import { RunBar } from '../components/RunBar';
import { Icon } from '../components/Icon';
import { MiniGrid } from '../components/MiniGrid';
import { Modal, useDialog } from '../components/Dialog';
import { useRunner } from '../lib/useRunner';
import { useHistory } from '../lib/useHistory';
import { loadAnims, saveAnims, load, save, type Anim, type AnimFrame } from '../lib/storage';
import { CAN_DOWNLOAD, downloadGif, downloadSpriteSheet } from '../lib/exporter';
import { appendGoTo } from '../lib/studio';
import { TEMPLATES, templatePrograms } from '../data/templates';
import { parseArt } from '../engine/dsl';
import { sfx } from '../lib/sound';
import { stepSound } from './MissionMode';
import { START_COLOR, type Guard } from './WorkshopMode';
import type { ColorKey } from '../engine/types';

const ALL_KINDS = ['move', 'paint', 'erase', 'color', 'repeat'] as const;
const MAX_FRAMES = 24;
const FPS = [
  { fps: 2, name: '느리게' },
  { fps: 4, name: '보통' },
  { fps: 8, name: '빠르게' },
];

interface Meta {
  id: string | null;
  name: string;
  width: number;
  height: number;
  fps: number;
  loop: boolean;
}

const blankFrame = (): AnimFrame => ({ id: newId(), program: [] });
const snapshot = (m: Meta, f: AnimFrame[]) => JSON.stringify([m.name.trim(), m.width, m.height, m.fps, m.loop, f.map((x) => x.program)]);
const DEFAULT_META: Meta = { id: null, name: '', width: 8, height: 8, fps: 4, loop: true };

export function TheaterMode({ active, speed, onSpeed, guard }: { active: boolean; speed: number; onSpeed: (n: number) => void; guard: React.MutableRefObject<Guard | null> }) {
  const dialog = useDialog();
  const draft = useMemo(() => load<{ meta: Meta; frames: AnimFrame[]; saved: string } | null>('theaterDraft', null), []);
  const firstFrames = useMemo(() => (draft?.frames?.length ? draft.frames : [blankFrame()]), [draft]);
  const [meta, setMeta] = useState<Meta>(draft?.meta ?? DEFAULT_META);
  const hist = useHistory<AnimFrame[]>(firstFrames);
  const frames = hist.value;
  const [cur, setCur] = useState(0);
  const [saved, setSaved] = useState(draft?.saved ?? snapshot(DEFAULT_META, [{ id: '', program: [] }]));
  const [onion, setOnion] = useState(true);
  const [brush, setBrush] = useState<ColorKey | 'erase'>('o');
  const [helper, setHelper] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [pf, setPf] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const [gallery, setGallery] = useState<Anim[] | null>(null);

  const ci = Math.min(cur, frames.length - 1);
  const frame = frames[ci];
  const spec = { width: meta.width, height: meta.height, startColor: START_COLOR };
  const grids = useMemo(() => frames.map((f) => runProgram(f.program, spec).final.grid), [frames, meta.width, meta.height]); // eslint-disable-line
  const trace = useMemo(() => runProgram(frame.program, spec), [frame.program, meta.width, meta.height]); // eslint-disable-line
  const runner = useRunner(trace, speed, { active, onStep: stepSound, onFinish: (s) => s === 'error' && sfx.error() });

  const dirty = snapshot(meta, frames) !== saved && (frames.some((f) => f.program.length > 0) || meta.name.trim() !== '');

  useEffect(() => {
    // 바로 저장해 두어야 곧바로 새로고침해도 사라지지 않는다
    save('theaterDraft', { meta, frames, saved });
  }, [meta, frames, saved]);

  // 미리보기 재생
  useEffect(() => {
    if (!playing || !active) return;
    const id = window.setInterval(() => {
      setPf((p) => {
        const n = p + 1;
        if (n >= frames.length) {
          if (meta.loop) return 0;
          setPlaying(false);
          return p;
        }
        return n;
      });
    }, 1000 / meta.fps);
    return () => window.clearInterval(id);
  }, [playing, active, meta.fps, meta.loop, frames.length]);

  const setProgram = (p: Program, mergeKey?: string) => hist.set((fs) => fs.map((f, i) => (i === ci ? { ...f, program: p } : f)), mergeKey);

  const idle = runner.status === 'ready';
  const grid = idle ? trace.final.grid : runner.grid;
  const pen = idle ? { x: trace.final.x, y: trace.final.y, color: trace.final.color } : runner.pen;
  const showErr = !!trace.error && (idle || runner.status === 'error');

  const doSave = (): boolean => {
    const name = meta.name.trim() || '나의 픽셀 애니메이션';
    const id = meta.id ?? 'a' + Date.now().toString(36);
    const a: Anim = { id, name, width: meta.width, height: meta.height, fps: meta.fps, loop: meta.loop, frames, updatedAt: Date.now() };
    if (!saveAnims([a, ...loadAnims().filter((x) => x.id !== id)])) {
      dialog.toast('저장 공간이 부족해서 저장하지 못했어요.', 'warn');
      return false;
    }
    const m = { ...meta, id, name };
    setMeta(m);
    setSaved(snapshot(m, frames));
    sfx.save();
    dialog.toast(`"${name}" 저장했어요!`);
    return true;
  };
  guard.current = { isDirty: () => dirty, save: doSave };

  const leaveOk = async () => {
    if (!dirty) return true;
    const r = await dialog.choose({ title: '저장하지 않은 애니메이션이 있어요', message: '지금 애니메이션을 저장할까요?', ok: '저장하기', alt: '저장하지 않기', cancel: '돌아가기', icon: 'save' });
    if (r === 'cancel') return false;
    if (r === 'ok') return doSave();
    return true;
  };

  const loadInto = (m: Meta, fs: AnimFrame[], markSaved: boolean) => {
    setMeta(m);
    hist.reset(fs);
    setCur(0);
    setPf(0);
    setPlaying(false);
    setSaved(markSaved ? snapshot(m, fs) : snapshot(DEFAULT_META, [{ id: '', program: [] }]));
  };

  const startBlank = async (size: number) => {
    if (!(await leaveOk())) return;
    loadInto({ ...DEFAULT_META, width: size, height: size }, [blankFrame()], true);
    setNewOpen(false);
  };

  const startTemplate = async (tid: string) => {
    const t = TEMPLATES.find((x) => x.id === tid)!;
    if (!(await leaveOk())) return;
    const progs = templatePrograms(t, START_COLOR);
    const m = { ...DEFAULT_META, name: t.name, fps: t.fps };
    loadInto(m, progs.map((p) => ({ id: newId(), program: p })), false);
    setNewOpen(false);
    setPlaying(true);
    dialog.toast(`"${t.name}" 예시를 불러왔어요. 프레임을 눌러 주문을 살펴보세요!`);
  };

  const openAnim = async (a: Anim) => {
    if (!(await leaveOk())) return;
    loadInto({ id: a.id, name: a.name, width: a.width, height: a.height, fps: a.fps, loop: a.loop }, a.frames, true);
    setGallery(null);
    dialog.toast(`"${a.name}" 을(를) 열었어요`);
  };

  const deleteAnim = async (a: Anim) => {
    if (!(await dialog.confirm({ title: '애니메이션을 지울까요?', message: <>"{a.name}" 을(를) 지우면 되돌릴 수 없어요.</>, ok: '지우기', danger: true }))) return;
    const list = loadAnims().filter((x) => x.id !== a.id);
    saveAnims(list);
    setGallery(list);
    if (meta.id === a.id) setMeta({ ...meta, id: null });
  };

  // ── 프레임 편집 ──
  const addFrame = (copy: boolean) => {
    if (frames.length >= MAX_FRAMES) {
      dialog.toast(`프레임은 ${MAX_FRAMES}장까지 만들 수 있어요`, 'warn');
      return;
    }
    const nf = copy ? { id: newId(), program: cloneProgram(frame.program) } : blankFrame();
    hist.set((fs) => [...fs.slice(0, ci + 1), nf, ...fs.slice(ci + 1)]);
    setCur(ci + 1);
    sfx.click();
  };
  const deleteFrame = async () => {
    if (frames.length <= 1) {
      dialog.toast('프레임이 최소 1장은 있어야 해요', 'warn');
      return;
    }
    if (frame.program.length > 0 && !(await dialog.confirm({ title: `${ci + 1}번 프레임을 지울까요?`, message: '실행 취소로 되돌릴 수 있어요.', ok: '지우기', danger: true }))) return;
    hist.set((fs) => fs.filter((_, i) => i !== ci));
    setCur(Math.max(0, ci - 1));
  };
  const moveFrame = (d: -1 | 1) => {
    const j = ci + d;
    if (j < 0 || j >= frames.length) return;
    hist.set((fs) => {
      const c = fs.slice();
      [c[ci], c[j]] = [c[j], c[ci]];
      return c;
    });
    setCur(j);
  };

  const onCellClick = (x: number, y: number) => {
    if (trace.error) {
      dialog.toast('주문서에 오류가 있어요. 빨간 블록을 먼저 고쳐 주세요!', 'warn');
      return;
    }
    const r = appendGoTo(frame.program, trace, x, y, brush);
    if (countBlocks(r.program) > 400) {
      dialog.toast('블록이 너무 많아요!', 'warn');
      return;
    }
    setProgram(r.program);
    runner.reset();
    sfx.paint();
  };

  const hasPixels = grids.some((g) => g.some(Boolean));
  const name = meta.name || '애니메이션';

  return (
    <div className="mode-grid">
      <section className="col-left card">
        <BlockEditor
          program={frame.program}
          onChange={setProgram}
          allowed={[...ALL_KINDS]}
          activeId={!idle && runner.current && !runner.current.error ? runner.current.blockId : null}
          errorId={showErr ? trace.error?.blockId ?? null : null}
          loops={runner.status === 'running' || runner.status === 'paused' ? runner.current?.loops : undefined}
          canUndo={hist.canUndo}
          canRedo={hist.canRedo}
          onUndo={hist.undo}
          onRedo={hist.redo}
          defaultColor={brush === 'erase' ? 'o' : brush}
          running={runner.status === 'running'}
        />
      </section>

      <section className="col-center card theater-center">
        <div className="center-head">
          <div className="work-name">
            <Icon name="film" size={22} />
            <input value={meta.name} maxLength={30} placeholder="애니메이션 이름" onChange={(e) => setMeta({ ...meta, name: e.target.value })} aria-label="애니메이션 이름" />
            <span className="size-chip">
              {ci + 1}번 프레임 / {frames.length}장
            </span>
            {dirty ? <span className="dirty-chip">저장 안 됨</span> : meta.id ? <span className="saved-chip">저장됨</span> : null}
          </div>
          <button className={'btn mini toggle ' + (onion ? 'on' : '')} onClick={() => setOnion((o) => !o)} aria-pressed={onion} title="이전 프레임을 흐리게 보여줘요">
            <Icon name="layers" size={18} /> 어니언 스킨
          </button>
        </div>
        <div className="canvas-frame">
          <PixelCanvas
            width={meta.width}
            height={meta.height}
            grid={grid}
            pen={pen}
            penError={showErr}
            onion={onion && ci > 0 ? grids[ci - 1] : null}
            flash={!idle && runner.current?.change ? { i: runner.current.change.i, key: runner.count } : null}
            moveMs={Math.min(runner.speedMs * 0.8, 260)}
            onCellClick={helper && runner.status !== 'running' ? onCellClick : undefined}
            label={`${ci + 1}번 프레임 도화지`}
          />
          {showErr && (
            <div className="bubble error" role="alert">
              <Icon name="help" size={22} />
              <div>
                <b>{trace.error!.message}</b>
                <small>빨갛게 표시된 블록을 고쳐 보세요.</small>
              </div>
            </div>
          )}
        </div>
        <RunBar runner={runner} speed={speed} onSpeed={onSpeed} emptyProgram={frame.program.length === 0} />
        <div className="frame-strip">
          <div className="frames" role="listbox" aria-label="프레임 목록">
            {frames.map((f, i) => (
              <button key={f.id} role="option" aria-selected={i === ci} className={'frame-thumb' + (i === ci ? ' on' : '') + (playing && i === pf ? ' playing' : '')} onClick={() => setCur(i)}>
                <MiniGrid grid={grids[i]} width={meta.width} height={meta.height} size={46} />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
          <div className="frame-tools">
            <button className="icon-btn" onClick={() => addFrame(false)} title="빈 프레임 추가" aria-label="빈 프레임 추가">
              <Icon name="plus" size={20} />
            </button>
            <button className="icon-btn" onClick={() => addFrame(true)} title="이 프레임 복사" aria-label="이 프레임 복사">
              <Icon name="copy" size={20} />
            </button>
            <button className="icon-btn" onClick={() => moveFrame(-1)} disabled={ci === 0} title="앞으로 옮기기" aria-label="프레임 앞으로 옮기기">
              <Icon name="chevLeft" size={20} />
            </button>
            <button className="icon-btn" onClick={() => moveFrame(1)} disabled={ci === frames.length - 1} title="뒤로 옮기기" aria-label="프레임 뒤로 옮기기">
              <Icon name="chevRight" size={20} />
            </button>
            <button className="icon-btn" onClick={deleteFrame} title="프레임 지우기" aria-label="프레임 지우기">
              <Icon name="trash" size={20} />
            </button>
          </div>
        </div>
      </section>

      <aside className="col-right card">
        <div className="stage">
          <div className="stage-curtain" aria-hidden />
          <div className="stage-screen">
            <MiniGrid grid={grids[Math.min(pf, frames.length - 1)]} width={meta.width} height={meta.height} size={104} label="애니메이션 미리 보기" />
          </div>
          <div className="stage-floor" aria-hidden />
        </div>
        <div className="stage-controls">
          <button
            className={'btn ' + (playing ? 'pink' : 'primary')}
            onClick={() => {
              if (!playing && !meta.loop && pf >= frames.length - 1) setPf(0);
              setPlaying(!playing);
            }}
          >
            <Icon name={playing ? 'pause' : 'play'} size={20} /> {playing ? '정지' : '재생'}
          </button>
          <span className="pf-label">
            {Math.min(pf, frames.length - 1) + 1} / {frames.length}
          </span>
          <label className="check-line" title="끝까지 재생하면 처음부터 다시">
            <input type="checkbox" checked={meta.loop} onChange={(e) => setMeta({ ...meta, loop: e.target.checked })} /> 반복
          </label>
        </div>
        <div className="seg" role="radiogroup" aria-label="재생 속도">
          {FPS.map((f) => (
            <button key={f.fps} role="radio" aria-checked={meta.fps === f.fps} className={meta.fps === f.fps ? 'on' : ''} onClick={() => setMeta({ ...meta, fps: f.fps })}>
              {f.name}
            </button>
          ))}
        </div>

        <div className="divider" />
        <div className="panel-title small">
          <Icon name="pointer" size={18} /> 그리기 도우미
          <label className="switch">
            <input type="checkbox" checked={helper} onChange={(e) => setHelper(e.target.checked)} />
            <span />
          </label>
        </div>
        <div className={'brush-palette compact' + (helper ? '' : ' off')}>
          {PALETTE.map((c) => (
            <button key={c.key} className={'pal-swatch' + (brush === c.key ? ' on' : '')} style={{ background: c.hex }} onClick={() => setBrush(c.key)} aria-label={c.name} title={c.name} />
          ))}
          <button className={'pal-swatch eraser' + (brush === 'erase' ? ' on' : '')} onClick={() => setBrush('erase')} aria-label="지우개" title="지우개">
            <Icon name="eraser" size={16} />
          </button>
        </div>
        <div className="action-grid three">
          <button className="btn primary" onClick={doSave}>
            <Icon name="save" size={18} /> 저장
          </button>
          <button className="btn mint" onClick={() => setGallery(loadAnims())}>
            <Icon name="folder" size={18} /> 보관함
          </button>
          <button className="btn butter" onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={18} /> 새로·예시
          </button>
          {CAN_DOWNLOAD && (
            <>
          <button
            className="btn pink"
            disabled={!hasPixels}
            onClick={() => {
              downloadGif(grids, meta.width, meta.height, meta.fps, meta.loop, name);
              dialog.toast('GIF 파일을 내려받았어요');
            }}
          >
            <Icon name="download" size={18} /> GIF 받기
          </button>
          <button
            className="btn ghost span2"
            disabled={!hasPixels}
            onClick={() => downloadSpriteSheet(grids, meta.width, meta.height, name).then(() => dialog.toast('스프라이트 시트 PNG를 내려받았어요'))}
          >
            <Icon name="image" size={18} /> 프레임 모음 PNG
          </button>
            </>
          )}
        </div>
      </aside>

      {newOpen && (
        <Modal title="새 애니메이션" icon="film" tone="mint" wide onClose={() => setNewOpen(false)}>
          <h3 className="sec-title">빈 도화지로 시작</h3>
          <div className="size-picker">
            {[8, 10, 16].map((s) => (
              <button key={s} className="size-card" onClick={() => startBlank(s)}>
                <MiniGrid grid={new Array(s * s).fill(null)} width={s} height={s} size={56} />
                <b>
                  {s}×{s}
                </b>
              </button>
            ))}
          </div>
          <h3 className="sec-title">예시 애니메이션으로 시작</h3>
          <div className="template-list">
            {TEMPLATES.map((t) => (
              <TemplateCard key={t.id} id={t.id} onPick={startTemplate} />
            ))}
          </div>
        </Modal>
      )}

      {gallery && (
        <Modal title="애니메이션 보관함" icon="folder" wide onClose={() => setGallery(null)}>
          {gallery.length === 0 ? (
            <p className="center-text muted">아직 저장한 애니메이션이 없어요.</p>
          ) : (
            <div className="gallery">
              {gallery.map((a) => (
                <div key={a.id} className={'gallery-card' + (a.id === meta.id ? ' current' : '')}>
                  <AnimThumb anim={a} />
                  <b className="g-name">{a.name}</b>
                  <small>
                    프레임 {a.frames.length}장 · {new Date(a.updatedAt).toLocaleDateString('ko-KR')}
                  </small>
                  <div className="g-actions">
                    <button className="btn mini primary" onClick={() => openAnim(a)}>
                      열기
                    </button>
                    <button className="btn mini ghost" onClick={() => deleteAnim(a)} aria-label={`${a.name} 지우기`}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/** 저절로 움직이는 작은 미리보기 */
function Looping({ grids, width, height, fps, size }: { grids: (string | null)[][]; width: number; height: number; fps: number; size: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % grids.length), 1000 / fps);
    return () => window.clearInterval(id);
  }, [grids.length, fps]);
  return <MiniGrid grid={grids[i % grids.length]} width={width} height={height} size={size} />;
}

function TemplateCard({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const t = TEMPLATES.find((x) => x.id === id)!;
  const grids = useMemo(() => t.frames.map((f) => parseArt(f).grid), [t]);
  return (
    <button className="template-card" onClick={() => onPick(id)}>
      <Looping grids={grids} width={8} height={8} fps={t.fps} size={64} />
      <b>{t.name}</b>
      <small>
        {t.frames.length}장 · {t.desc}
      </small>
    </button>
  );
}

function AnimThumb({ anim }: { anim: Anim }) {
  const grids = useMemo(() => anim.frames.map((f) => runProgram(f.program, { width: anim.width, height: anim.height, startColor: START_COLOR }).final.grid), [anim]);
  return <Looping grids={grids} width={anim.width} height={anim.height} fps={anim.fps} size={96} />;
}
