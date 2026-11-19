import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, StageBadge, digits } from '../components/ui';
import ContactSheet from '../components/ContactSheet';
import { useQuery } from '../data/useQuery';
import { listAllContacts, listCustomers, listTasks } from '../data/repo';
import { buildTodos, buildUpcoming, type TodoItem } from '../lib/todo';
import { fmtDate, relativeLabel, today } from '../lib/date';

export default function Home() {
  const data = useQuery(async () => {
    const [customers, tasks, contacts] = await Promise.all([listCustomers(), listTasks(), listAllContacts()]);
    return { customers, tasks, contacts };
  }, []);
  const [active, setActive] = useState<TodoItem | null>(null);
  const t = today();

  if (!data) return null;
  const { overdue, groups, total } = buildTodos(data.customers, data.tasks, data.contacts, t);
  const upcoming = buildUpcoming(data.customers, data.tasks, t);

  return (
    <>
      <Header title="오늘 할 일" />
      <p className="today-line">{fmtDate(t)} · 연락할 곳 {total}건</p>

      {data.customers.length === 0 && (
        <div className="empty">
          아직 고객이 없어요.<br />
          <Link to="/customers/new">고객을 추가</Link>하거나, 설정에서 테스트용 고객을 넣어 보세요.
        </div>
      )}

      {overdue.length > 0 && (
        <section className="section">
          <h2 className="late">밀린 연락 <span className="count">{overdue.length}</span></h2>
          {overdue.map((i) => <TodoCard key={i.key} item={i} onDone={() => setActive(i)} />)}
        </section>
      )}

      {groups.map((g) => (
        <section key={g.title} className="section">
          <h2>{g.title} <span className="count">{g.items.length}</span></h2>
          {g.items.map((i) => <TodoCard key={i.key} item={i} onDone={() => setActive(i)} />)}
        </section>
      ))}

      {data.customers.length > 0 && total === 0 && (
        <div className="empty">🎉 오늘 연락할 곳을 모두 챙겼어요.</div>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <h2>이번 주 예정 <span className="count">{upcoming.length}</span></h2>
          <div className="card">
            {upcoming.map((u) => (
              <Link key={u.key} to={`/customers/${u.customer.id}`} className="upcoming">
                <span className="up-date">{fmtDate(u.dueDate).slice(5)}<br /><small>{relativeLabel(u.dueDate)}</small></span>
                <span><b>{u.customer.name}</b><br /><span className="muted small">{u.title}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {active && <ContactSheet customer={active.customer} item={active} onClose={() => setActive(null)} />}
    </>
  );
}

function TodoCard({ item, onDone }: { item: TodoItem; onDone: () => void }) {
  const c = item.customer;
  return (
    <div className="card task">
      <Link to={`/customers/${c.id}`} className="task-main">
        <div className="row-between">
          <b className="name">{c.name}</b>
          <StageBadge stage={c.stage} />
        </div>
        <div className="small">{item.title}</div>
        {item.overdue && <div className="late small">{fmtDate(item.dueDate)} ({relativeLabel(item.dueDate)})</div>}
      </Link>
      <div className="btn-row">
        <a className="btn" href={`tel:${digits(c.phone)}`}>📞 전화</a>
        <Link className="btn" to={`/customers/${c.id}/message?kind=${item.kind}${item.note ? `&product=${encodeURIComponent(item.note)}` : ''}`}>💬 메시지</Link>
        <button className="btn primary" onClick={onDone}>✓ 완료</button>
      </div>
    </div>
  );
}
