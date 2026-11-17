import type { Runner } from '../lib/useRunner';
import { SPEEDS } from '../lib/useRunner';
import { colorHex, colorName } from '../engine/palette';
import { Icon } from './Icon';

const STATUS_TEXT = {
  ready: '준비 완료',
  running: '마법 실행 중',
  paused: '잠깐 멈춤',
  done: '실행 끝!',
  error: '앗, 멈췄어요',
};

/** 실행 / 일시정지 / 한 단계씩 / 처음부터 / 지우기 / 속도 */
export function RunBar({ runner, speed, onSpeed, emptyProgram }: { runner: Runner; speed: number; onSpeed: (n: number) => void; emptyProgram?: boolean }) {
  const { status } = runner;
  const running = status === 'running';
  const playLabel = status === 'paused' ? '이어서 실행' : status === 'done' || status === 'error' ? '다시 실행' : '실행하기';
  return (
    <div className="run-bar">
      {running ? (
        <button className="btn run-btn pausing" onClick={runner.pause}>
          <Icon name="pause" size={24} /> 일시정지
        </button>
      ) : (
        <button className="btn run-btn" onClick={runner.play} disabled={emptyProgram}>
          <Icon name="play" size={24} /> {playLabel}
        </button>
      )}
      <button className="btn mint" onClick={runner.stepOnce} disabled={emptyProgram || running} title="블록을 하나씩 실행해요">
        <Icon name="step" size={20} /> 한 단계씩
      </button>
      <button className="btn butter icon-only" onClick={runner.restart} disabled={emptyProgram} title="처음부터 다시 실행" aria-label="처음부터 다시 실행">
        <Icon name="restart" size={20} />
      </button>
      <button className="btn ghost icon-only" onClick={runner.reset} disabled={status === 'ready'} title="실행 결과 지우고 처음 상태로" aria-label="실행 결과 초기화">
        <Icon name="broom" size={20} />
      </button>
      <div className="speed" title="실행 속도">
        <Icon name="turtle" size={20} />
        <input type="range" min={0} max={SPEEDS.length - 1} step={1} value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="실행 속도" aria-valuetext={SPEEDS[speed].name} />
        <Icon name="rabbit" size={20} />
      </div>
    </div>
  );
}

export function RunStatus({ runner, extra }: { runner: Runner; extra?: string }) {
  const { pen, status, count, total } = runner;
  return (
    <div className={'run-status st-' + status}>
      <span className="st-chip">
        <i className="dot" />
        {STATUS_TEXT[status]}
      </span>
      <span className="st-item">
        마법 펜 위치 <b>({pen.x}, {pen.y})</b>
      </span>
      <span className="st-item">
        펜 색 <span className="sw" style={{ background: colorHex(pen.color) }} /> <b>{colorName(pen.color)}</b>
      </span>
      <span className="st-item">
        단계 <b>{count}</b> / {total}
      </span>
      {extra && <span className="st-item">{extra}</span>}
    </div>
  );
}
