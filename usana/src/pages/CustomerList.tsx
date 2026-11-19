import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, StageBadge } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { listCustomers } from '../data/repo';
import { STAGES, type Stage } from '../types';
import { fmtDate, relativeLabel, today } from '../lib/date';

export default function CustomerList() {
  const customers = useQuery(listCustomers, []);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<Stage | 'all'>('all');

  const shown = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const qDigits = qq.replace(/[^0-9]/g, '');
    return (customers ?? [])
      .filter((c) => stage === 'all' || c.stage === stage)
      .filter((c) => {
        if (!qq) return true;
        if (c.name.toLowerCase().includes(qq)) return true;
        return qDigits.length > 0 && c.phone.replace(/[^0-9]/g, '').includes(qDigits);
      })
      // 다음 연락일이 빠른 순, 날짜 없는 고객은 맨 뒤
      .sort((a, b) => (a.nextContactDate ?? '9999').localeCompare(b.nextContactDate ?? '9999') || a.name.localeCompare(b.name, 'ko'));
  }, [customers, q, stage]);

  const t = today();

  return (
    <>
      <Header title="고객" right={<Link className="btn primary small-btn" to="/customers/new">+ 고객 추가</Link>} />
      <input
        className="input search"
        type="search"
        placeholder="이름이나 전화번호로 찾기"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips scroll">
        <button className={'chip' + (stage === 'all' ? ' on' : '')} onClick={() => setStage('all')}>전체</button>
        {STAGES.map((s) => (
          <button key={s.value} className={'chip' + (stage === s.value ? ' on' : '')} onClick={() => setStage(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      {customers && shown.length === 0 && <div className="empty">해당하는 고객이 없어요.</div>}

      {shown.map((c) => (
        <Link key={c.id} to={`/customers/${c.id}`} className="card list-item">
          <div className="row-between">
            <b className="name">{c.name}</b>
            <StageBadge stage={c.stage} />
          </div>
          <div className="muted small">{c.phone}</div>
          <div className={'small ' + (c.nextContactDate && c.nextContactDate < t ? 'late' : 'muted')}>
            {c.nextContactDate
              ? `다음 연락 ${fmtDate(c.nextContactDate)} (${relativeLabel(c.nextContactDate)})`
              : '다음 연락일 없음'}
          </div>
        </Link>
      ))}
    </>
  );
}
