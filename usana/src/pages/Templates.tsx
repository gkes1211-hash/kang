import { Link } from 'react-router-dom';
import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { listTemplates } from '../data/repo';
import { SITUATIONS, situationLabel } from '../lib/templates';

export default function Templates() {
  const templates = useQuery(listTemplates, []);
  const order = (s: string) => SITUATIONS.findIndex((x) => x.value === s);
  const sorted = [...(templates ?? [])].sort((a, b) => order(a.situation) - order(b.situation));
  return (
    <>
      <Header title="메시지 템플릿" back right={<Link className="btn primary small-btn" to="/templates/new">+ 추가</Link>} />
      <p className="muted small">{'{이름}'}, {'{제품명}'}은 보낼 때 고객 이름과 제품명으로 바뀌어요.</p>
      {templates?.length === 0 && <div className="empty">템플릿이 없어요.</div>}
      {sorted.map((t) => (
        <Link key={t.id} to={`/templates/${t.id}`} className="card list-item">
          <div className="row-between">
            <b className="name">{t.title}</b>
            <span className="badge">{situationLabel(t.situation)}</span>
          </div>
          <div className="muted small clamp2">{t.body}</div>
        </Link>
      ))}
    </>
  );
}
