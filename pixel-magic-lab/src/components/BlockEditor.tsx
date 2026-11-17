import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Block, BlockKind, ColorKey, Dir, LoopFrame, Program } from '../engine/types';
import { PALETTE, colorHex, colorName } from '../engine/palette';
import { countBlocks, findBlock, insertBlock, locate, makeBlock, moveBlock, nudgeBlock, removeBlock, updateBlock, depthOf } from '../engine/program';
import { LIMITS } from '../engine/engine';
import { Icon } from './Icon';
import { useDialog } from './Dialog';
import { sfx } from '../lib/sound';

type Cursor = { parent: string | null; index: number };
type DragSrc = { type: 'new'; kind: BlockKind; dir?: Dir } | { type: 'move'; id: string };
type DropAt = Cursor | 'trash' | null;

const DIR_LABEL: Record<Dir, string> = { up: '위로 1칸', down: '아래로 1칸', left: '왼쪽으로 1칸', right: '오른쪽으로 1칸' };

const TOOLS: { kind: BlockKind; dir?: Dir; label: string; icon: string; cls: string }[] = [
  { kind: 'move', dir: 'up', label: '위로', icon: 'up', cls: 'k-move' },
  { kind: 'move', dir: 'down', label: '아래로', icon: 'down', cls: 'k-move' },
  { kind: 'move', dir: 'left', label: '왼쪽으로', icon: 'left', cls: 'k-move' },
  { kind: 'move', dir: 'right', label: '오른쪽으로', icon: 'right', cls: 'k-move' },
  { kind: 'paint', label: '색칠하기', icon: 'brush', cls: 'k-paint' },
  { kind: 'erase', label: '지우기', icon: 'eraser', cls: 'k-erase' },
  { kind: 'color', label: '색 바꾸기', icon: 'drop', cls: 'k-color' },
  { kind: 'repeat', label: '반복하기', icon: 'loop', cls: 'k-repeat' },
];

export function blockLabel(b: Block): string {
  switch (b.kind) {
    case 'move':
      return DIR_LABEL[b.dir];
    case 'paint':
      return '색칠하기';
    case 'erase':
      return '지우기';
    case 'color':
      return `색 바꾸기: ${colorName(b.color)}`;
    case 'repeat':
      return `${b.times}번 반복하기`;
  }
}

export interface BlockEditorProps {
  program: Program;
  onChange: (p: Program, mergeKey?: string) => void;
  allowed: BlockKind[];
  activeId?: string | null;
  errorId?: string | null;
  loops?: LoopFrame[];
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  defaultColor?: ColorKey;
  /** 실행 중일 때 편집하면 실행이 처음으로 돌아간다는 안내 */
  running?: boolean;
  extraFooter?: ReactNode;
}

export function BlockEditor(props: BlockEditorProps) {
  const { program, onChange, allowed } = props;
  const dialog = useDialog();
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [colorFor, setColorFor] = useState<string | null>(null);
  const [dragView, setDragView] = useState<{ x: number; y: number; label: string; cls: string } | null>(null);
  const [dropAt, setDropAt] = useState<DropAt>(null);
  const drag = useRef<{ src: DragSrc; sx: number; sy: number; started: boolean } | null>(null);
  const suppressClick = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 커서가 가리키는 반복 블록이 사라지면 맨 끝으로
  const cur: Cursor = cursor && (cursor.parent === null || findBlock(program, cursor.parent)) ? cursor : { parent: null, index: program.length };
  const listLen = (parent: string | null) => {
    if (parent === null) return program.length;
    const b = findBlock(program, parent);
    return b && b.kind === 'repeat' ? b.body.length : 0;
  };
  const curFixed: Cursor = { parent: cur.parent, index: Math.min(cur.index, listLen(cur.parent)) };

  // 실행 중인 블록이 보이도록 스크롤
  useEffect(() => {
    if (!props.activeId && !props.errorId) return;
    const el = rootRef.current?.querySelector(`[data-bid="${props.errorId ?? props.activeId}"] > .blk`);
    (el as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' });
  }, [props.activeId, props.errorId]);

  const add = useCallback(
    (kind: BlockKind, dir?: Dir, at: Cursor = curFixed) => {
      if (kind === 'repeat' && at.parent && depthOf(program, at.parent) + 2 > LIMITS.maxDepth) {
        dialog.toast(`반복은 ${LIMITS.maxDepth}겹까지만 넣을 수 있어요`, 'warn');
        return;
      }
      if (countBlocks(program) >= 400) {
        dialog.toast('블록이 너무 많아요! 반복 블록으로 줄여 볼까요?', 'warn');
        return;
      }
      const b = makeBlock(kind, { dir, color: props.defaultColor ?? 'r', times: 3 });
      onChange(insertBlock(program, at.parent, at.index, b));
      sfx.click();
      setSelected(b.id);
      // 반복 블록을 넣으면 바로 그 안에 넣을 수 있도록
      setCursor(kind === 'repeat' ? { parent: b.id, index: 0 } : { parent: at.parent, index: at.index + 1 });
    },
    [program, onChange, curFixed, props.defaultColor, dialog],
  );

  const remove = (id: string) => {
    const loc = locate(program, id);
    onChange(removeBlock(program, id));
    setSelected(null);
    if (loc) setCursor({ parent: loc.parent, index: loc.index });
  };

  const select = (b: Block) => {
    setSelected(b.id);
    const loc = locate(program, b.id);
    if (loc) setCursor({ parent: loc.parent, index: loc.index + 1 });
  };

  // ── 끌어서 옮기기 (마우스·터치 공통 포인터 이벤트) ─────────
  const computeDrop = (x: number, y: number): DropAt => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    if (el.closest('[data-trash]')) return drag.current?.src.type === 'move' ? 'trash' : null;
    const listEl = el.closest('[data-list]') as HTMLElement | null;
    if (!listEl || !rootRef.current?.contains(listEl)) return null;
    const parent = listEl.dataset.list === 'root' ? null : listEl.dataset.list!;
    const items = Array.from(listEl.children).filter((c) => (c as HTMLElement).dataset.bi !== undefined) as HTMLElement[];
    let index = items.length;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (y < r.top + Math.min(r.height / 2, 26)) {
        index = i;
        break;
      }
    }
    if (drag.current?.src.type === 'move' && parent !== null && (parent === drag.current.src.id || isDescendant(program, drag.current.src.id, parent))) return null;
    return { parent, index };
  };

  const startDrag = (e: React.PointerEvent, src: DragSrc, label: string, cls: string, fromGrip: boolean) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch' && !fromGrip) return;
    drag.current = { src, sx: e.clientX, sy: e.clientY, started: false };
    const onMove = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.started) {
        if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 7) return;
        d.started = true;
        setColorFor(null);
      }
      ev.preventDefault();
      setDragView({ x: ev.clientX, y: ev.clientY, label, cls });
      setDropAt(computeDrop(ev.clientX, ev.clientY));
      const sc = scrollRef.current;
      if (sc) {
        const r = sc.getBoundingClientRect();
        if (ev.clientY < r.top + 30) sc.scrollTop -= 12;
        else if (ev.clientY > r.bottom - 30) sc.scrollTop += 12;
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const d = drag.current;
      drag.current = null;
      setDragView(null);
      setDropAt(null);
      if (!d || !d.started || ev.type === 'pointercancel') return;
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      const target = computeDropFor(d.src, ev.clientX, ev.clientY);
      if (!target) return;
      if (target === 'trash') {
        if (d.src.type === 'move') remove(d.src.id);
        return;
      }
      if (d.src.type === 'new') add(d.src.kind, d.src.dir, target);
      else {
        const next = moveBlock(program, d.src.id, target.parent, target.index);
        if (next !== program) {
          onChange(next);
          sfx.click();
          setSelected(d.src.id);
        }
      }
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  // computeDrop 은 drag.current 를 참고하므로 놓는 순간을 위해 잠시 되살린다
  const computeDropFor = (src: DragSrc, x: number, y: number) => {
    drag.current = { src, sx: 0, sy: 0, started: true };
    const r = computeDrop(x, y);
    drag.current = null;
    return r;
  };

  // ── 키보드: 선택한 블록 지우기/옮기기 ─────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target as HTMLElement).closest('input')) {
      e.preventDefault();
      remove(selected);
    } else if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(nudgeBlock(program, selected, -1));
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(nudgeBlock(program, selected, 1));
    }
  };

  const loopMap = new Map((props.loops ?? []).map((l) => [l.blockId, l]));

  const CursorLine = ({ parent, index }: Cursor) => {
    const isDrop = dropAt && dropAt !== 'trash' && dropAt.parent === parent && dropAt.index === index;
    const isCur = !dragView && curFixed.parent === parent && curFixed.index === index;
    if (!isDrop && !isCur) return null;
    return (
      <div className={'cursor-line' + (isDrop ? ' drop' : '')} aria-hidden>
        <span>{isDrop ? '여기에 놓기' : '다음 블록은 여기에'}</span>
      </div>
    );
  };

  const renderList = (list: Block[], parent: string | null): ReactNode => (
    <div className={parent === null ? 'block-list root' : 'block-list body'} data-list={parent ?? 'root'}>
      {list.map((b, i) => (
        <div key={b.id} className="block-item" data-bi={i} data-bid={b.id}>
          <CursorLine parent={parent} index={i} />
          {renderBlock(b)}
        </div>
      ))}
      <CursorLine parent={parent} index={list.length} />
      {parent !== null && list.length === 0 && !(dropAt && dropAt !== 'trash' && dropAt.parent === parent) && (
        <button className="empty-slot" onClick={() => setCursor({ parent, index: 0 })}>
          {curFixed.parent === parent ? '위 블록 상자에서 블록을 눌러 넣어요' : '눌러서 이 안에 블록 넣기'}
        </button>
      )}
    </div>
  );

  const renderBlock = (b: Block): ReactNode => {
    const tool = TOOLS.find((t) => t.kind === b.kind && (b.kind !== 'move' || t.dir === b.dir))!;
    const active = props.activeId === b.id;
    const isErr = props.errorId === b.id;
    const isSel = selected === b.id;
    const loop = b.kind === 'repeat' ? loopMap.get(b.id) : undefined;
    const cls = ['blk', tool.cls, active && 'is-active', isErr && 'is-error', isSel && 'is-selected', loop && 'is-looping', dragView && drag.current?.src.type === 'move' && (drag.current.src as any).id === b.id && 'is-dragging']
      .filter(Boolean)
      .join(' ');

    const head = (
      <div
        className={cls}
        role="button"
        tabIndex={0}
        aria-label={blockLabel(b) + (active ? ' (실행 중)' : '') + (isErr ? ' (오류)' : '')}
        aria-pressed={isSel}
        onPointerDown={(e) => startDrag(e, { type: 'move', id: b.id }, blockLabel(b), tool.cls, false)}
        onClick={(e) => {
          if (suppressClick.current) return;
          if ((e.target as HTMLElement).closest('button')) return;
          select(b);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select(b);
          }
        }}
      >
        <span className="grip" onPointerDown={(e) => { e.stopPropagation(); startDrag(e, { type: 'move', id: b.id }, blockLabel(b), tool.cls, true); }} title="끌어서 옮기기">
          <Icon name="grip" size={18} />
        </span>
        <span className="blk-icon">
          <Icon name={tool.icon} size={22} />
        </span>
        {b.kind === 'repeat' ? (
          <span className="blk-label repeat-label">
            <button className="mini-btn" aria-label="반복 횟수 줄이기" onClick={() => b.times > 1 && onChange(updateBlock(program, b.id, { times: b.times - 1 } as Partial<Block>), 'times' + b.id)}>
              <Icon name="minus" size={16} />
            </button>
            <span className={'times' + (b.times > LIMITS.maxRepeat ? ' too-big' : '')}>{b.times}</span>
            <button
              className="mini-btn"
              aria-label="반복 횟수 늘리기"
              onClick={() => {
                if (b.times >= LIMITS.maxRepeat) dialog.toast(`반복은 ${LIMITS.maxRepeat}번까지 할 수 있어요`, 'warn');
                else onChange(updateBlock(program, b.id, { times: b.times + 1 } as Partial<Block>), 'times' + b.id);
              }}
            >
              <Icon name="plus" size={16} />
            </button>
            번 반복
            {loop && <span className="loop-badge">{loop.iter}/{loop.times}번째</span>}
          </span>
        ) : b.kind === 'color' ? (
          <span className="blk-label">
            색 바꾸기
            <button className="swatch-btn" onClick={() => setColorFor(colorFor === b.id ? null : b.id)} aria-label={`색 고르기, 지금 ${colorName(b.color)}`}>
              <span className="sw" style={{ background: colorHex(b.color) }} />
              {colorName(b.color)}
            </button>
          </span>
        ) : (
          <span className="blk-label">{blockLabel(b)}</span>
        )}
        <span className="blk-tools">
          {isSel && (
            <>
              <button className="mini-btn" aria-label="위로 올리기" onClick={() => onChange(nudgeBlock(program, b.id, -1))}>
                <Icon name="chevUp" size={16} />
              </button>
              <button className="mini-btn" aria-label="아래로 내리기" onClick={() => onChange(nudgeBlock(program, b.id, 1))}>
                <Icon name="chevDown" size={16} />
              </button>
            </>
          )}
          <button className="mini-btn del" aria-label="블록 버리기" onClick={() => remove(b.id)}>
            <Icon name="close" size={16} />
          </button>
        </span>
        {colorFor === b.id && b.kind === 'color' && (
          <div className="color-pop" onPointerDown={(e) => e.stopPropagation()}>
            {PALETTE.map((c) => (
              <button
                key={c.key}
                className={'pal-swatch' + (c.key === b.color ? ' on' : '')}
                style={{ background: c.hex }}
                title={c.name}
                aria-label={c.name}
                onClick={() => {
                  onChange(updateBlock(program, b.id, { color: c.key } as Partial<Block>));
                  setColorFor(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );

    if (b.kind !== 'repeat') return head;
    return (
      <div className={'repeat-wrap' + (loop ? ' is-looping' : '') + (isErr ? ' is-error' : '')}>
        {head}
        <div className="repeat-body">
          {renderList(b.body, b.id)}
          {curFixed.parent === b.id && (
            <button className="exit-loop" onClick={() => select(b)}>
              <Icon name="chevDown" size={14} /> 반복 밖에 이어서 넣기
            </button>
          )}
        </div>
        <div className="repeat-foot" />
      </div>
    );
  };

  const total = countBlocks(program);
  const tools = TOOLS.filter((t) => allowed.includes(t.kind));

  return (
    <div className="block-editor" ref={rootRef} onKeyDown={onKeyDown}>
      <div className={'toolbox' + (dropAt === 'trash' ? ' trash-hot' : '')} data-trash>
        <div className="panel-title">
          <Icon name="wand" size={20} />
          마법 주문 블록
          <span className="sub">눌러서 넣기 · 끌어서 옮기기</span>
        </div>
        <div className="tool-grid">
          {tools.map((t) => (
            <button
              key={t.kind + (t.dir ?? '')}
              className={'tool ' + t.cls}
              onPointerDown={(e) => startDrag(e, { type: 'new', kind: t.kind, dir: t.dir }, t.label, t.cls, true)}
              onClick={() => !suppressClick.current && add(t.kind, t.dir)}
            >
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {dragView && drag.current?.src.type === 'move' && (
          <div className="trash-hint">
            <Icon name="trash" size={20} /> 여기에 놓으면 블록을 버려요
          </div>
        )}
      </div>

      <div className="workspace">
        <div className="panel-title small">
          <Icon name="book" size={18} />
          나의 주문서
          {props.running && <span className="run-chip">실행 중</span>}
        </div>
        <div className="workspace-scroll" ref={scrollRef} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelected(null);
            setCursor({ parent: null, index: program.length });
          }
        }}>
          <div className="start-cap">
            <Icon name="play" size={14} /> 시작
          </div>
          {renderList(program, null)}
          {program.length === 0 && (
            <div className="empty-hint">
              위에 있는 블록을 눌러 보세요.
              <br />
              블록이 이곳에 차례대로 쌓여요.
            </div>
          )}
        </div>
        <div className="workspace-foot">
          <span className="count-chip">
            블록 <b>{total}</b>개
          </span>
          <span className="spacer" />
          {props.onUndo && (
            <button className="icon-btn" onClick={props.onUndo} disabled={!props.canUndo} aria-label="실행 취소" title="실행 취소">
              <Icon name="undo" size={20} />
            </button>
          )}
          {props.onRedo && (
            <button className="icon-btn" onClick={props.onRedo} disabled={!props.canRedo} aria-label="다시 실행" title="다시 실행">
              <Icon name="redo" size={20} />
            </button>
          )}
          {props.extraFooter}
          <button
            className="icon-btn"
            disabled={program.length === 0}
            aria-label="주문서 모두 지우기"
            title="모두 지우기"
            onClick={async () => {
              if (await dialog.confirm({ title: '주문서를 비울까요?', message: '모든 블록이 사라져요. (실행 취소로 되돌릴 수 있어요)', ok: '모두 지우기', danger: true })) {
                onChange([]);
                setCursor(null);
                setSelected(null);
              }
            }}
          >
            <Icon name="trash" size={20} />
          </button>
        </div>
      </div>

      {colorFor && <div className="click-catcher" onPointerDown={() => setColorFor(null)} />}
      {dragView && (
        <div className={'drag-ghost blk ' + dragView.cls} style={{ left: dragView.x, top: dragView.y }}>
          {dragView.label}
        </div>
      )}
    </div>
  );
}

function isDescendant(p: Program, ancestorId: string, id: string): boolean {
  const a = findBlock(p, ancestorId);
  return !!a && a.kind === 'repeat' && findBlock(a.body, id) !== null;
}
