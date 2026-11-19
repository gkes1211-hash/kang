import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Stage } from '../types';
import { stageLabel } from '../types';

export function Header({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="header">
      {back && (
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="뒤로">‹</button>
      )}
      <h1>{title}</h1>
      <div className="header-right">{right}</div>
    </header>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`badge stage-${stage}`}>{stageLabel(stage)}</span>;
}

/** 전화번호에서 숫자만 남김 (tel:, sms: 링크용) */
export const digits = (p: string) => p.replace(/[^0-9+]/g, '');
