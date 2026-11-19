import { Link } from 'react-router-dom';
import { Header, StageBadge, digits } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { listCustomers } from '../data/repo';
import { fmtDate, relativeLabel, today } from '../lib/date';
import type { Customer } from '../types';

export default function Home() {
  const customers = useQuery(listCustomers, []);
  const t = today();
  const due = (customers ?? []).filter((c) => c.nextContactDate === t);
  const late = (customers ?? [])
    .filter((c) => c.nextContactDate && c.nextContactDate < t)
    .sort((a, b) => a.nextContactDate!.localeCompare(b.nextContactDate!));

  return (
    <>
      <Header title="오늘 할 일" />
      <p className="today-line">{fmtDate(t)}</p>

      {customers && customers.length === 0 && (
        <div className="empty">
          아직 고객이 없어요.<br />
          <Link to="/customers/new">고객을 추가</Link>하거나, 설정에서 테스트용 고객을 넣어 보세요.
        </div>
      )}

      <Section title="오늘 연락할 고객" list={due} emptyText="오늘 정해 둔 연락은 없어요." />
      {late.length > 0 && <Section title="밀린 연락" list={late} late />}

      <p className="hint">소진 임박·첫 구매 후 일정·생일 알림은 다음 단계에서 추가돼요.</p>
    </>
  );
}

function Section({ title, list, emptyText, late }: { title: string; list: Customer[]; emptyText?: string; late?: boolean }) {
  return (
    <section className="section">
      <h2 className={late ? 'late' : ''}>{title} <span className="count">{list.length}</span></h2>
      {list.length === 0 && emptyText && <p className="muted">{emptyText}</p>}
      {list.map((c) => (
        <div key={c.id} className="card task">
          <Link to={`/customers/${c.id}`} className="task-main">
            <div className="row-between">
              <b className="name">{c.name}</b>
              <StageBadge stage={c.stage} />
            </div>
            <div className={late ? 'late small' : 'muted small'}>
              다음 연락일 {fmtDate(c.nextContactDate)} ({relativeLabel(c.nextContactDate!)})
            </div>
          </Link>
          <div className="btn-row">
            <a className="btn" href={`tel:${digits(c.phone)}`}>📞 전화</a>
            <a className="btn" href={`sms:${digits(c.phone)}`}>💬 문자</a>
          </div>
        </div>
      ))}
    </section>
  );
}
