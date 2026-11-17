import { useEffect, useMemo, useRef, useState } from 'react';
import { MISSIONS, LEVEL_INFO, type Mission, type Level } from '../data/missions';
import { parseArt, parseDsl } from '../engine/dsl';
import { diffCells, gridsEqual, runProgram } from '../engine/engine';
import { countBlocks, cloneProgram } from '../engine/program';
import type { Program, Step } from '../engine/types';
import { BlockEditor } from '../components/BlockEditor';
import { PixelCanvas } from '../components/PixelCanvas';
import { RunBar, RunStatus } from '../components/RunBar';
import { Icon } from '../components/Icon';
import { MiniGrid, Mascot } from '../components/MiniGrid';
import { Modal, useDialog } from '../components/Dialog';
import { useRunner } from '../lib/useRunner';
import { useHistory } from '../lib/useHistory';
import { loadMissionDraft, saveMissionDraft, type Progress } from '../lib/storage';
import { parOf, starsFor } from '../lib/scoring';
import { sfx } from '../lib/sound';

type Result = { kind: 'success'; stars: number; used: number; prevStars: number } | { kind: 'fail'; wrong: number[] } | null;

export function stepSound(s: Step) {
  if (s.error) return;
  if (s.kind === 'paint') sfx.paint();
  else if (s.kind === 'erase') sfx.erase();
  else if (s.kind === 'color') sfx.color();
  else sfx.move();
}

export function Stars({ n, max = 3, size = 22 }: { n: number; max?: number; size?: number }) {
  return (
    <span className="stars" aria-label={`별 ${n}개`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name="star" size={size} className={i < n ? 'star on' : 'star'} />
      ))}
    </span>
  );
}

export function MissionMode({
  active,
  progress,
  onRecord,
  speed,
  onSpeed,
  unlockAll,
  onUnlockAll,
}: {
  active: boolean;
  progress: Progress;
  onRecord: (id: string, stars: number, used: number) => void;
  speed: number;
  onSpeed: (n: number) => void;
  unlockAll: boolean;
  onUnlockAll: (v: boolean) => void;
}) {
  const dialog = useDialog();
  const firstOpen = MISSIONS.find((m) => !progress[m.id]) ?? MISSIONS[0];
  const [missionId, setMissionId] = useState(firstOpen.id);
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];
  const target = useMemo(() => parseArt(mission.art), [mission]);
  const initialProgram = (m: Mission): Program => loadMissionDraft(m.id) ?? (m.starter ? parseDsl(m.starter) : []);
  const hist = useHistory<Program>(initialProgram(mission));
  const program = hist.value;
  const [result, setResult] = useState<Result>(null);
  const [hints, setHints] = useState(0);
  const [ghost, setGhost] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [introFor, setIntroFor] = useState<string | null>(mission.id);
  const seenIntro = useRef(new Set<string>());

  const trace = useMemo(() => runProgram(program, { width: target.width, height: target.height, startColor: mission.startColor }), [program, target, mission]);

  const runner = useRunner(trace, speed, {
    active,
    onStep: stepSound,
    onFinish: (st) => {
      if (st === 'error') {
        sfx.error();
        return;
      }
      if (program.length === 0) return;
      if (gridsEqual(trace.final.grid, target.grid)) {
        const used = countBlocks(program);
        const stars = starsFor(mission, used);
        setResult({ kind: 'success', stars, used, prevStars: progress[mission.id]?.stars ?? 0 });
        onRecord(mission.id, stars, used);
        sfx.success();
      } else {
        setResult({ kind: 'fail', wrong: diffCells(trace.final.grid, target.grid) });
        sfx.almost();
      }
    },
  });

  // 다시 실행하면 이전 결과 지우기
  useEffect(() => {
    if (runner.count === 0 || runner.status === 'running') setResult((r) => (r?.kind === 'success' ? r : null));
  }, [runner.count, runner.status]);
  useEffect(() => setResult(null), [program]);

  // 작성 중인 코드는 미션별로 자동 저장
  useEffect(() => {
    saveMissionDraft(mission.id, program);
  }, [program, mission.id]);

  const openMission = (m: Mission) => {
    saveMissionDraft(mission.id, program);
    setMissionId(m.id);
    hist.reset(initialProgram(m));
    setResult(null);
    setHints(0);
    setGhost(false);
    setShowMap(false);
    if (!seenIntro.current.has(m.id)) setIntroFor(m.id);
  };

  const idx = MISSIONS.indexOf(mission);
  const isUnlocked = (i: number) => unlockAll || i === 0 || !!progress[MISSIONS[i - 1].id] || !!progress[MISSIONS[i].id];
  const prev = MISSIONS[idx - 1];
  const next = MISSIONS[idx + 1];

  const errorId = runner.status === 'error' ? trace.error?.blockId ?? null : null;
  const activeId = runner.status !== 'ready' && runner.current && !runner.current.error ? runner.current.blockId : null;
  const lastChange = runner.current?.change;
  const done = progress[mission.id];
  const par = parOf(mission);

  const showSolution = async () => {
    const ok = await dialog.confirm({
      title: '정답 코드를 볼까요?',
      message: (
        <>
          선생님 확인용 모범 답안을 주문서에 넣어요.
          <br />
          지금 주문서는 <b>실행 취소</b>로 되돌릴 수 있어요.
        </>
      ),
      ok: '정답 넣기',
      icon: 'code',
    });
    if (ok) hist.set(cloneProgram(parseDsl(mission.solution)));
  };

  return (
    <div className="mode-grid">
      <section className="col-left card">
        <BlockEditor
          program={program}
          onChange={hist.set}
          allowed={mission.allowed}
          activeId={activeId}
          errorId={errorId}
          loops={runner.status !== 'ready' && runner.status !== 'done' ? runner.current?.loops : undefined}
          canUndo={hist.canUndo}
          canRedo={hist.canRedo}
          onUndo={hist.undo}
          onRedo={hist.redo}
          defaultColor={mission.startColor}
          running={runner.status === 'running'}
        />
      </section>

      <section className="col-center card">
        <div className="center-head">
          <button className="icon-btn" onClick={() => prev && isUnlocked(idx - 1) && openMission(prev)} disabled={!prev || !isUnlocked(idx - 1)} aria-label="이전 미션">
            <Icon name="chevLeft" size={22} />
          </button>
          <div className="mission-title">
            <span className={'level-chip lv-' + mission.level}>{LEVEL_INFO[mission.level].name}</span>
            <span className="m-no">미션 {mission.no}</span>
            <h1>{mission.title}</h1>
          </div>
          <button className="icon-btn" onClick={() => next && isUnlocked(idx + 1) && openMission(next)} disabled={!next || !isUnlocked(idx + 1)} aria-label="다음 미션">
            <Icon name="chevRight" size={22} />
          </button>
        </div>

        <div className="canvas-frame">
          <PixelCanvas
            width={target.width}
            height={target.height}
            grid={runner.grid}
            pen={runner.pen}
            penError={runner.status === 'error'}
            ghost={ghost ? target.grid : null}
            wrong={result?.kind === 'fail' ? result.wrong : null}
            flash={lastChange && runner.status !== 'ready' ? { i: lastChange.i, key: runner.count } : null}
            moveMs={Math.min(runner.speedMs * 0.8, 260)}
            label={`${mission.title} 도화지`}
          />
          {runner.status === 'error' && trace.error && (
            <div className="bubble error" role="alert">
              <Icon name="help" size={22} />
              <div>
                <b>{trace.error.message}</b>
                <small>빨갛게 표시된 블록을 살펴보고 고쳐 볼까요?</small>
              </div>
            </div>
          )}
          {result?.kind === 'fail' && (
            <div className="bubble warn" role="status">
              <Icon name="eye" size={22} />
              <div>
                <b>목표 그림과 다른 칸이 {result.wrong.length}개 있어요. 다시 살펴볼까요?</b>
                <small>✕ 표시가 있는 칸이 목표와 달라요. "목표 겹쳐 보기"를 켜면 비교하기 쉬워요.</small>
              </div>
              <button className="btn mini butter" onClick={() => setHints((h) => Math.min(mission.hints.length, h + 1))}>
                힌트 보기
              </button>
            </div>
          )}
          {program.length === 0 && runner.status === 'ready' && (
            <div className="bubble hint">
              <Mascot size={36} />
              <div>
                <b>왼쪽 블록을 눌러 주문서를 만들어 봐요!</b>
              </div>
            </div>
          )}
        </div>

        <RunBar runner={runner} speed={speed} onSpeed={onSpeed} emptyProgram={program.length === 0} />
        <RunStatus runner={runner} />
      </section>

      <aside className="col-right card">
        <div className="target-card">
          <div className="panel-title small">
            <Icon name="target" size={18} /> 목표 그림
          </div>
          <div className="target-box">
            <MiniGrid grid={target.grid} width={target.width} height={target.height} size={128} label={`목표 그림: ${mission.title}`} />
            {done && (
              <div className="stamp" aria-label="완료 도장">
                <Icon name="star" size={18} />
                <span>완료</span>
              </div>
            )}
          </div>
          <div className="target-meta">
            <span>
              {target.width}×{target.height} 칸
            </span>
            {done ? <Stars n={done.stars} size={18} /> : <span className="muted">아직 도전 전</span>}
          </div>
        </div>

        <div className="goal-box">
          <span className="concept-chip">
            <Icon name="book" size={16} /> {mission.concept}
          </span>
          <p>{mission.goal}</p>
          <p className="par">별 3개 기준: 블록 {par}개 이하</p>
        </div>

        <div className="right-actions">
          <button className={'btn toggle ' + (ghost ? 'on' : '')} onClick={() => setGhost((g) => !g)} aria-pressed={ghost}>
            <Icon name="layers" size={20} /> 목표 겹쳐 보기
          </button>
          <button className="btn butter" onClick={() => setHints((h) => Math.min(mission.hints.length, h + 1))} disabled={hints >= mission.hints.length}>
            <Icon name="bulb" size={20} /> 힌트 {hints < mission.hints.length ? `(${hints}/${mission.hints.length})` : '다 봤어요'}
          </button>
        </div>
        {hints > 0 && (
          <ol className="hint-list">
            {mission.hints.slice(0, hints).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        )}

        <div className="right-bottom">
          <button className="btn primary" onClick={() => setShowMap(true)}>
            <Icon name="map" size={20} /> 미션 지도
          </button>
          <button className="btn ghost" onClick={() => setIntroFor(mission.id)}>
            <Icon name="book" size={20} /> 개념 카드
          </button>
          <button className="btn ghost small" onClick={showSolution} title="선생님 확인용">
            <Icon name="code" size={18} /> 정답 코드
          </button>
        </div>
      </aside>

      {introFor && (
        <Modal
          title={`미션 ${mission.no} · ${mission.title}`}
          icon="book"
          tone="mint"
          onClose={() => {
            seenIntro.current.add(introFor);
            setIntroFor(null);
          }}
          footer={
            <button
              className="btn primary"
              onClick={() => {
                seenIntro.current.add(introFor);
                setIntroFor(null);
              }}
              data-autofocus
            >
              <Icon name="wand" size={20} /> 시작해 볼까요?
            </button>
          }
        >
          <div className="intro">
            <div className="intro-art">
              <MiniGrid grid={target.grid} width={target.width} height={target.height} size={120} />
              <span className="concept-chip">
                <Icon name="book" size={16} /> 오늘의 개념: {mission.concept}
              </span>
            </div>
            <div className="intro-text">
              <div className="speech">
                <Mascot size={44} />
                <p>{mission.intro}</p>
              </div>
              <p className="goal-line">
                <b>미션</b> {mission.goal}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {result?.kind === 'success' && (
        <Modal
          title="마법 성공!"
          icon="star"
          tone="butter"
          className="success-modal"
          onClose={() => setResult(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setResult(null)}>
                그림 다시 보기
              </button>
              {result.stars < 3 && (
                <button className="btn butter" onClick={() => setResult(null)}>
                  더 짧게 도전
                </button>
              )}
              {next ? (
                <button className="btn primary" onClick={() => openMission(next)} data-autofocus>
                  다음 미션 <Icon name="chevRight" size={20} />
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => {
                    setResult(null);
                    setShowMap(true);
                  }}
                  data-autofocus
                >
                  <Icon name="map" size={20} /> 미션 지도
                </button>
              )}
            </>
          }
        >
          <div className="success">
            <div className="sparkles" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} style={{ ['--i' as any]: i }} />
              ))}
            </div>
            <MiniGrid grid={target.grid} width={target.width} height={target.height} size={110} />
            <div>
              <Stars n={result.stars} size={36} />
              <p className="big">{result.stars === 3 ? '최고의 마법 주문이에요!' : result.stars === 2 ? '멋지게 완성했어요!' : '그림을 완성했어요!'}</p>
              <p>
                사용한 블록 <b>{result.used}개</b> · 별 3개 기준 <b>{par}개</b>
              </p>
              <p className="muted">
                {result.stars === 3
                  ? '블록을 아주 알뜰하게 썼어요. 효율적인 알고리즘이에요!'
                  : mission.allowed.includes('repeat')
                    ? '반복 블록을 쓰면 주문이 더 짧아질지도 몰라요.'
                    : '더 짧은 길이 있는지 찾아보는 것도 재미있어요.'}
              </p>
              {result.prevStars > 0 && result.stars > result.prevStars && <p className="new-best">새 기록! 별이 늘었어요</p>}
            </div>
          </div>
        </Modal>
      )}

      {showMap && (
        <Modal title="미션 지도" icon="map" wide onClose={() => setShowMap(false)}>
          <div className="mission-map">
            {(Object.keys(LEVEL_INFO) as Level[]).map((lv) => (
              <div key={lv} className={'map-row lv-' + lv}>
                <div className="map-level">
                  <span className={'level-chip lv-' + lv}>{LEVEL_INFO[lv].name}</span>
                  <small>{LEVEL_INFO[lv].grade}</small>
                  <small>{LEVEL_INFO[lv].desc}</small>
                </div>
                <div className="map-cards">
                  {MISSIONS.filter((m) => m.level === lv).map((m) => {
                    const i = MISSIONS.indexOf(m);
                    const open = isUnlocked(i);
                    const rec = progress[m.id];
                    const art = parseArt(m.art);
                    return (
                      <button key={m.id} className={'map-card' + (m.id === mission.id ? ' current' : '') + (open ? '' : ' locked')} disabled={!open} onClick={() => openMission(m)}>
                        <span className="map-no">{m.no}</span>
                        <MiniGrid grid={art.grid} width={art.width} height={art.height} size={54} />
                        <span className="map-name">{m.title}</span>
                        <span className="map-concept">{m.concept}</span>
                        {open ? <Stars n={rec?.stars ?? 0} size={15} /> : <span className="lock"><Icon name="lock" size={16} /> 앞 미션을 끝내면 열려요</span>}
                        {rec && <span className="mini-stamp">완료</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <label className="teacher-toggle">
              <input type="checkbox" checked={unlockAll} onChange={(e) => onUnlockAll(e.target.checked)} />
              <span>선생님 모드: 모든 미션 열기</span>
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
