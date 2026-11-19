import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { listProducts } from '../data/repo';

export default function Products() {
  const products = useQuery(listProducts, []);
  return (
    <>
      <Header title="제품" />
      <p className="hint">제품 등록·수정은 2단계에서 만들어요.</p>
      {products?.length === 0 && <div className="empty">등록된 제품이 없어요.</div>}
      {products?.map((p) => (
        <div key={p.id} className="card">
          <div className="row-between">
            <b className="name">{p.name}</b>
            <span className="badge">{p.category}</span>
          </div>
          <p className="small">{p.functionalClaim}</p>
          <p className="muted small">1통 {p.daysPerUnit}일 · {p.price.toLocaleString('ko-KR')}원</p>
        </div>
      ))}
    </>
  );
}
