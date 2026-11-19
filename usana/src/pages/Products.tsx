import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { listProducts } from '../data/repo';
import { won } from '../lib/calc';

export default function Products() {
  const products = useQuery(listProducts, []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');

  const categories = useMemo(
    () => [...new Set((products ?? []).map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')),
    [products],
  );

  const shown = (products ?? [])
    .filter((p) => cat === '전체' || p.category === cat)
    .filter((p) => {
      const qq = q.trim();
      if (!qq) return true;
      return p.name.includes(qq) || p.interestTags.some((t) => t.includes(qq)) || p.category.includes(qq);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return (
    <>
      <Header title="제품" right={<Link className="btn primary small-btn" to="/products/new">+ 제품 추가</Link>} />
      <input className="input search" type="search" placeholder="제품명·분류·관심사로 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
      {categories.length > 0 && (
        <div className="chips scroll">
          {['전체', ...categories].map((c) => (
            <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      )}

      {products?.length === 0 && (
        <div className="empty">등록된 제품이 없어요.<br />[+ 제품 추가]로 실제 제품 정보를 넣어 주세요.</div>
      )}
      {products && products.length > 0 && shown.length === 0 && <div className="empty">해당하는 제품이 없어요.</div>}

      {shown.map((p) => (
        <Link key={p.id} to={`/products/${p.id}`} className="card list-item">
          <div className="row-between">
            <b className="name">{p.name}</b>
            {p.category && <span className="badge">{p.category}</span>}
          </div>
          <div className="muted small">1통 {p.daysPerUnit}일분 · {won(p.price)}</div>
          {p.interestTags.length > 0 && <div className="muted small">#{p.interestTags.join(' #')}</div>}
        </Link>
      ))}
    </>
  );
}
