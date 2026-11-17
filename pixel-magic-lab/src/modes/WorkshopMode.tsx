import { useEffect, useMemo, useState } from 'react';
import type { ColorKey, Program } from '../engine/types';
import { runProgram } from '../engine/engine';
import { PALETTE, colorName } from '../engine/palette';
import { countBlocks, cloneProgram } from '../engine/program';
import { gridToProgram } from '../engine/autoProgram';
import { BlockEditor } from '../components/BlockEditor';
import { PixelCanvas } from '../components/PixelCanvas';
import { RunBar, RunStatus } from '../components/RunBar';
import { Icon } from '../components/Icon';
import { MiniGrid } from '../components/MiniGrid';
import { Modal, useDialog } from '../components/Dialog';
import { useRunner } from '../lib/useRunner';
import { useHistory } from '../lib/useHistory';
import { loadWorks, saveWorks, load, save, type Work } from '../lib/storage';
import { downloadPng } from '../lib/exporter';
import { appendGoTo } from '../lib/studio';
import { sfx } from '../lib/sound';
import { stepSound } from './MissionMode';

export const START_COLOR: ColorKey = 'd';
const ALL_KINDS = ['move', 'paint', 'erase', 'color', 'repeat'] as const;

export interface Guard {
  isDirty: () => boolean;
  save: () => boolean;
}

interface Meta {
  id: string | null;
  name: string;
  width: number;
  height: number;
}

const snapshot = (m: Meta, p: Program) => JSON.stringify([m.name.trim(), m.width, m.height, p]);

export function WorkshopMode({ active, speed, onSpeed, guard }: { active: boolean; speed: number; onSpeed: (n: number) => void; guard: React.MutableRefObject<Guard | null> }) {
  const dialog = useDialog();
  // 새로고침해도 작업 중이던 내용이 남도록 임시 저장본을 쓴다
  const draft = useMemo(() => load<{ meta: Meta; program: Program; saved: string } | null>('workshopDraft', null), []);
  const [meta, setMeta] = useState<Meta>(draft?.meta ?? { id: null, name: '', width: 8, height: 8 });
  const hist = useHistory<Program>(draft?.program ?? []);
  const program = hist.value;
  const [saved, setSaved] = useState(draft?.saved ?? snapshot({ id: null, name: '', width: 8, height: 8 }, []));
  const [brush, setBrush] = useState<ColorKey | 'erase'>('p');
  const [helper, setHelper] = useState(true);
  const [gallery, setGallery] = useState<Work[] | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const trace = useMemo(() => runProgram(program, { width: meta.width, height: meta.height, startColor: START_COLOR }), [program, meta.width, meta.height]);
  const runner = useRunner(trace, speed, { active, onStep: stepSound, onFinish: (s) => s === 'error' && sfx.error() });

  const dirty = snapshot(meta, program) !== saved && (program.length > 0 || meta.name.trim() !== '');

  useEffect(() => {
    // 바로 저장해 두어야 곧바로 새로고침해도 사라지지 않는다
    save('workshopDraft', { meta, program, saved });
  }, [meta, program, saved]);

  const idle = runner.status === 'ready';
  const grid = idle ? trace.final.grid : runner.grid;
  const pen = idle ? { x: trace.final.x, y: trace.final.y, color: trace.final.color } : runner.pen;
  const errorId = (idle || runner.status === 'error') && trace.error ? trace.error.blockId ?? null : null;
  const activeId = !idle && runner.current && !runner.current.error ? runner.current.blockId : null;

  const doSave = (): boolean => {
    const name = meta.name.trim() || `나의 픽셀 작품 ${new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
    const id = meta.id ?? 'w' + Date.now().toString(36);
    const works = loadWorks();
    const w: Work = { id, name, width: meta.width, height: meta.height, program, pixels: trace.final.grid, updatedAt: Date.now() };
    const list = [w, ...works.filter((x) => x.id !== id)];
    if (!saveWorks(list)) {
      dialog.toast('저장 공간이 부족해서 저장하지 못했어요. 오래된 작품을 지워 주세요.', 'warn');
      return false;
    }
    const m = { ...meta, id, name };
    setMeta(m);
    setSaved(snapshot(m, program));
    sfx.save();
    dialog.toast(`"${name}" 저장했어요!`);
    return true;
  };

  guard.current = { isDirty: () => dirty, save: doSave };

  /** 저장 안 된 작업이 있으면 먼저 물어본다 */
  const leaveOk = async (): Promise<boolean> => {
    if (!dirty) return true;
    const r = await dialog.choose({
      title: '저장하지 않은 작품이 있어요',
      message: '지금 작품을 저장할까요?',
      ok: '저장하기',
      alt: '저장하지 않기',
      cancel: '돌아가기',
      icon: 'save',
    });
    if (r === 'cancel') return false;
    if (r === 'ok') return doSave();
    return true;
  };

  const openWork = async (w: Work) => {
    if (!(await leaveOk())) return;
    const m = { id: w.id, name: w.name, width: w.width, height: w.height };
    setMeta(m);
    hist.reset(w.program);
    setSaved(snapshot(m, w.program));
    setGallery(null);
    dialog.toast(`"${w.name}" 을(를) 열었어요`);
  };

  const newCanvas = async (size: number) => {
    if (!(await leaveOk())) return;
    const m = { id: null, name: '', width: size, height: size };
    setMeta(m);
    hist.reset([]);
    setSaved(snapshot(m, []));
    setNewOpen(false);
  };

  const deleteWork = async (w: Work) => {
    const ok = await dialog.confirm({ title: '작품을 지울까요?', message: <>"{w.name}" 작품을 지우면 되돌릴 수 없어요.</>, ok: '지우기', danger: true });
    if (!ok) return;
    const list = loadWorks().filter((x) => x.id !== w.id);
    saveWorks(list);
    setGallery(list);
    if (meta.id === w.id) setMeta({ ...meta, id: null });
    dialog.toast('작품을 지웠어요');
  };

  const onCellClick = (x: number, y: number) => {
    if (!helper) return;
    if (trace.error) {
      dialog.toast('주문서에 오류가 있어요. 빨간 블록을 먼저 고쳐 주세요!', 'warn');
      return;
    }
    const r = appendGoTo(program, trace, x, y, brush);
    if (countBlocks(r.program) > 400) {
      dialog.toast('블록이 너무 많아요! "주문 줄이기 마법"을 써 보세요.', 'warn');
      return;
    }
    hist.set(r.program);
    runner.reset();
    sfx.paint();
  };

  const shrink = async () => {
    const shorter = gridToProgram(trace.final.grid, meta.width, meta.height, START_COLOR);
    const before = countBlocks(program);
    const after = countBlocks(shorter);
    if (after >= before) {
      dialog.toast('지금 주문이 이미 충분히 짧아요!');
      return;
    }
    const ok = await dialog.confirm({
      title: '주문 줄이기 마법',
      message: (
        <>
          같은 그림을 그리는 더 짧은 주문으로 바꿀까요?
          <br />
          블록 <b>{before}개 → {after}개</b> (반복 블록을 써서 줄여요)
        </>
      ),
      ok: '바꾸기',
      icon: 'wand',
    });
    if (ok) hist.set(cloneProgram(shorter));
  };

  return (
    <div className="mode-grid">
      <section className="col-left card">
        <BlockEditor
          program={program}
          onChange={hist.set}
          allowed={[...ALL_KINDS]}
          activeId={activeId}
          errorId={errorId}
          loops={runner.status === 'running' || runner.status === 'paused' ? runner.current?.loops : undefined}
          canUndo={hist.canUndo}
          canRedo={hist.canRedo}
          onUndo={hist.undo}
          onRedo={hist.redo}
          defaultColor={brush === 'erase' ? 'p' : brush}
          running={runner.status === 'running'}
        />
      </section>

      <section className="col-center card">
        <div className="center-head">
          <div className="work-name">
            <Icon name="palette" size={22} />
            <input value={meta.name} maxLength={30} placeholder="작품 이름을 지어 주세요" onChange={(e) => setMeta({ ...meta, name: e.target.value })} aria-label="작품 이름" />
            <span className="size-chip">
              {meta.width}×{meta.height}
            </span>
            {dirty ? <span className="dirty-chip">저장 안 됨</span> : meta.id ? <span className="saved-chip">저장됨</span> : null}
          </div>
        </div>
        <div className="canvas-frame">
          <PixelCanvas
            width={meta.width}
            height={meta.height}
            grid={grid}
            pen={pen}
            penError={!!trace.error && (idle || runner.status === 'error')}
            flash={!idle && runner.current?.change ? { i: runner.current.change.i, key: runner.count } : null}
            moveMs={Math.min(runner.speedMs * 0.8, 260)}
            onCellClick={helper && runner.status !== 'running' ? onCellClick : undefined}
            label="자유 픽셀 도화지"
          />
          {trace.error && (idle || runner.status === 'error') && (
            <div className="bubble error" role="alert">
              <Icon name="help" size={22} />
              <div>
                <b>{trace.error.message}</b>
                <small>빨갛게 표시된 블록을 고쳐 보세요.</small>
              </div>
            </div>
          )}
          {idle && program.length > 0 && !trace.error && <div className="preview-tag">미리 보기 · 실행하면 펜이 차례대로 그려요</div>}
        </div>
        <RunBar runner={runner} speed={speed} onSpeed={onSpeed} emptyProgram={program.length === 0} />
        <RunStatus runner={runner} />
      </section>

      <aside className="col-right card">
        <div className="panel-title small">
          <Icon name="pointer" size={18} /> 그리기 도우미
          <label className="switch">
            <input type="checkbox" checked={helper} onChange={(e) => setHelper(e.target.checked)} />
            <span />
          </label>
        </div>
        <p className="help-text">{helper ? '도화지 칸을 누르면 그 칸까지 가서 칠하는 블록이 주문서에 생겨요.' : '도우미가 꺼져 있어요. 블록으로만 그려요.'}</p>
        <div className={'brush-palette' + (helper ? '' : ' off')}>
          {PALETTE.map((c) => (
            <button key={c.key} className={'pal-swatch big' + (brush === c.key ? ' on' : '')} style={{ background: c.hex }} onClick={() => setBrush(c.key)} aria-label={c.name} title={c.name} />
          ))}
          <button className={'pal-swatch big eraser' + (brush === 'erase' ? ' on' : '')} onClick={() => setBrush('erase')} aria-label="지우개" title="지우개">
            <Icon name="eraser" size={20} />
          </button>
        </div>
        <p className="brush-name">
          붓: <b>{brush === 'erase' ? '지우개' : colorName(brush)}</b>
        </p>

        <div className="divider" />
        <div className="action-list">
          <button className="btn primary" onClick={doSave}>
            <Icon name="save" size={20} /> 작품 저장하기
          </button>
          <button className="btn mint" onClick={() => setGallery(loadWorks())}>
            <Icon name="folder" size={20} /> 내 작품 보관함
          </button>
          <button className="btn pink" onClick={() => downloadPng(trace.final.grid, meta.width, meta.height, meta.name || '픽셀작품').then(() => dialog.toast('PNG 그림 파일을 내려받았어요'))} disabled={!trace.final.grid.some(Boolean)}>
            <Icon name="download" size={20} /> PNG 그림 받기
          </button>
          <button className="btn butter" onClick={shrink} disabled={!trace.final.grid.some(Boolean) || !!trace.error}>
            <Icon name="wand" size={20} /> 주문 줄이기 마법
          </button>
          <button className="btn ghost" onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={20} /> 새 도화지
          </button>
        </div>
      </aside>

      {newOpen && (
        <Modal title="새 도화지 만들기" icon="plus" tone="mint" onClose={() => setNewOpen(false)}>
          <p className="center-text">도화지 크기를 골라 주세요.</p>
          <div className="size-picker">
            {[8, 10, 16].map((s) => (
              <button key={s} className="size-card" onClick={() => newCanvas(s)}>
                <MiniGrid grid={new Array(s * s).fill(null)} width={s} height={s} size={72} />
                <b>
                  {s}×{s}
                </b>
                <small>{s === 8 ? '처음 그릴 때' : s === 10 ? '조금 더 크게' : '자세한 그림'}</small>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {gallery && (
        <Modal title="내 작품 보관함" icon="folder" wide onClose={() => setGallery(null)}>
          {gallery.length === 0 ? (
            <p className="center-text muted">아직 저장한 작품이 없어요. 그림을 그리고 "작품 저장하기"를 눌러 보세요!</p>
          ) : (
            <div className="gallery">
              {gallery.map((w) => (
                <div key={w.id} className={'gallery-card' + (w.id === meta.id ? ' current' : '')}>
                  <MiniGrid grid={runProgram(w.program, { width: w.width, height: w.height, startColor: START_COLOR }).final.grid} width={w.width} height={w.height} size={96} />
                  <b className="g-name">{w.name}</b>
                  <small>
                    {w.width}×{w.height} · 블록 {countBlocks(w.program)}개 · {new Date(w.updatedAt).toLocaleDateString('ko-KR')}
                  </small>
                  <div className="g-actions">
                    <button className="btn mini primary" onClick={() => openWork(w)}>
                      열기
                    </button>
                    <button className="btn mini pink" onClick={() => downloadPng(runProgram(w.program, { width: w.width, height: w.height, startColor: START_COLOR }).final.grid, w.width, w.height, w.name)} aria-label={`${w.name} PNG 받기`}>
                      <Icon name="download" size={16} />
                    </button>
                    <button className="btn mini ghost" onClick={() => deleteWork(w)} aria-label={`${w.name} 지우기`}>
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

