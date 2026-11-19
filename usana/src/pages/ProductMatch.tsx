import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { getCustomer, listProducts, listPurchasesByCustomer } from '../data/repo';
import { DISCLAIMER } from '../lib/compliance';
import { won } from '../lib/calc';
import { today } from '../lib/date';

export default function ProductMatch() {
  const { id = '' } = useParams();
  const data = useQuery(async () => {
    const [customer, products, purchases] = await Promise.all([getCustomer(id), listProducts(), listPurchasesByCustomer(id)]);
    return { customer, products, purchases };
  }, [id]);

  if (!data) return null;
  const { customer: c, products, purchases } = data;
  if (!c) return (<><Header title="관심사 맞는 제품" back /><div className="empty">고객을 찾을 수 없어요.</div></>);

  const t = today();
  // 소진일이 아직 안 지난 구매 = 복용 중
  const taking = new Set(purchases.filter((p) => p.runOutDate >= t).map((p) => p.productId));

  const ranked = products
    .map((p) => ({ p, hits: p.interestTags.filter((tag) => c.interestTags.includes(tag)) }))
    .filter((x) => x.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length || a.p.name.localeCompare(b.p.name, 'ko'));

  return (
    <>
      <Header title="관심사 맞는 제품" back />
      <div className="match-page">
        <p className="muted small">{c.name} 님의 관심사</p>
        <div className="chips">
          {c.interestTags.map((tag) => <span key={tag} className="chip on static">{tag}</span>)}
        </div>

        {!c.consent && <div className="empty">🔒 건강 정보 동의를 받은 뒤 관심사를 넣으면 제품을 찾아 드려요.</div>}
        {c.consent && c.interestTags.length === 0 && (
          <div className="empty">관심사 태그가 없어요. 고객 정보 [수정]에서 관심사를 골라 주세요.</div>
        )}

        {(c.takingMedication || c.pregnantOrNursing) && (
          <div className="alert">
            ⚠️ {[c.takingMedication && '약 복용 중', c.pregnantOrNursing && '임신·수유 중'].filter(Boolean).join(', ')}인 고객이에요.
            제품을 안내하기 전에 <b>의사·약사와 상담</b>하시도록 권해 주세요.
          </div>
        )}

        {c.interestTags.length > 0 && ranked.length === 0 && (
          <div className="empty">관심사가 겹치는 제품이 없어요. 제품에 관심사 태그를 달아 두면 여기에 나와요.</div>
        )}

        {ranked.map(({ p, hits }) => (
          <Link key={p.id} to={`/products/${p.id}`} className="card list-item">
            <div className="row-between">
              <b className="name">{p.name}</b>
              {taking.has(p.id) ? <span className="badge taking">복용 중</span> : <span className="badge">{hits.length}개 겹침</span>}
            </div>
            <div className="chips tight">
              {hits.map((h) => <span key={h} className="mini-tag">{h}</span>)}
            </div>
            <p className="claim">{p.functionalClaim || '기능성 문구 없음'}</p>
            <div className="muted small">1통 {p.daysPerUnit}일분 · {won(p.price)}</div>
          </Link>
        ))}
      </div>
      <div className="disclaimer-bar">{DISCLAIMER}</div>
    </>
  );
}
