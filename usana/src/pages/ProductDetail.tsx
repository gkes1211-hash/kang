import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmButton from '../components/ConfirmButton';
import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { countPurchasesOfProduct, deleteProduct, getProduct } from '../data/repo';
import { won } from '../lib/calc';
import { DISCLAIMER } from '../lib/compliance';


export default function ProductDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const p = useQuery(() => getProduct(id).then((x) => x ?? null), [id]);
  const used = useQuery(() => countPurchasesOfProduct(id), [id]);

  if (p === undefined) return null;
  if (p === null)
    return (
      <>
        <Header title="제품" back />
        <div className="empty">제품을 찾을 수 없어요.</div>
      </>
    );

  return (
    <>
      <Header title={p.name} back right={<Link className="btn small-btn" to={`/products/${p.id}/edit`}>수정</Link>} />

      <div className="card">
        {p.category && <span className="badge">{p.category}</span>}
        <h3 style={{ marginTop: 12 }}>기능성 (라벨 문구)</h3>
        <p className="pre">{p.functionalClaim || '-'}</p>
      </div>

      <div className="card">
        <dl className="info">
          <dt>1일 섭취량</dt><dd>{p.dailyDose || '-'}</dd>
          <dt>1통 용량</dt><dd>{p.unitSize || '-'}</dd>
          <dt>1통 섭취 기간</dt><dd>{p.daysPerUnit}일</dd>
          <dt>가격</dt><dd>{won(p.price)}</dd>
          <dt>관심사</dt><dd>{p.interestTags.length ? p.interestTags.join(', ') : '-'}</dd>
        </dl>
      </div>

      {p.cautions && (
        <div className="card">
          <h3>주의사항</h3>
          <p className="pre">{p.cautions}</p>
        </div>
      )}

      <p className="disclaimer">{DISCLAIMER}</p>

      <ConfirmButton
        label="이 제품 삭제"
        question={`${p.name}을(를) 삭제할까요?${used ? `\n이 제품의 구매 기록 ${used}건은 남아 있지만 제품 이름 대신 "삭제된 제품"으로 보여요.` : ''}`}
        confirmLabel="삭제"
        onConfirm={async () => {
          await deleteProduct(p.id);
          nav('/products', { replace: true });
        }}
      />
    </>
  );
}
