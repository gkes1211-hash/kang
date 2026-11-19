import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmButton from '../components/ConfirmButton';
import { Header, StageBadge, digits } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { deleteCustomerCompletely, getCustomer, listContactsByCustomer, listPurchasesByCustomer } from '../data/repo';
import { CONTACT_METHODS } from '../types';
import { fmtDate, relativeLabel, today } from '../lib/date';

export default function CustomerDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const c = useQuery(() => getCustomer(id).then((x) => x ?? null), [id]);
  const purchases = useQuery(() => listPurchasesByCustomer(id), [id]);
  const contacts = useQuery(() => listContactsByCustomer(id), [id]);

  if (c === undefined) return null;
  if (c === null)
    return (
      <>
        <Header title="고객" back />
        <div className="empty">고객을 찾을 수 없어요.</div>
      </>
    );

  async function onDelete() {
    if (!c) return;
    await deleteCustomerCompletely(c.id);
    nav('/customers', { replace: true });
  }

  const methodLabel = CONTACT_METHODS.find((m) => m.value === c.preferredMethod)?.label;
  const late = c.nextContactDate && c.nextContactDate < today();

  return (
    <>
      <Header title={c.name} back right={<Link className="btn small-btn" to={`/customers/${c.id}/edit`}>수정</Link>} />

      {(c.takingMedication || c.pregnantOrNursing) && (
        <div className="alert">
          ⚠️ {[c.takingMedication && '약 복용 중', c.pregnantOrNursing && '임신·수유 중'].filter(Boolean).join(', ')}인 고객이에요.
          제품을 안내하기 전에 <b>의사·약사와 상담</b>하시도록 권해 주세요.
        </div>
      )}

      <div className="card">
        <div className="row-between">
          <StageBadge stage={c.stage} />
          {c.subscription && <span className="badge">정기 주문</span>}
        </div>
        <a className="phone" href={`tel:${digits(c.phone)}`}>{c.phone}</a>
        <div className="btn-row">
          <a className="btn" href={`tel:${digits(c.phone)}`}>📞 전화</a>
          <a className="btn" href={`sms:${digits(c.phone)}`}>💬 문자</a>
        </div>
      </div>

      <div className="card">
        <h3>다음 연락일</h3>
        <p className={'big ' + (late ? 'late' : '')}>
          {c.nextContactDate ? `${fmtDate(c.nextContactDate)} (${relativeLabel(c.nextContactDate)})` : '정해지지 않음'}
        </p>
      </div>

      <div className="card">
        <h3>기본 정보</h3>
        <dl className="info">
          <dt>생일</dt><dd>{fmtDate(c.birthday) || '-'}</dd>
          <dt>알게 된 경로</dt><dd>{c.referrer || '-'}</dd>
          <dt>선호 연락</dt><dd>{[methodLabel, c.preferredTime].filter(Boolean).join(' · ') || '-'}</dd>
          <dt>메모</dt><dd className="pre">{c.memo || '-'}</dd>
        </dl>
      </div>

      <div className="card">
        <h3>건강 정보 동의</h3>
        {c.consent ? (
          <>
            <p>✅ 동의함 {c.consentDate && <span className="muted">({fmtDate(c.consentDate)})</span>}</p>
            <div className="chips">
              {c.interestTags.length === 0 && <span className="muted">관심사 태그 없음</span>}
              {c.interestTags.map((t) => <span key={t} className="chip on static">{t}</span>)}
            </div>
            <button className="btn block" disabled title="4단계에서 추가돼요">관심사 맞는 제품 보기 (준비 중)</button>
          </>
        ) : (
          <p className="muted">🔒 동의 전이라 관심사를 저장하지 않아요.</p>
        )}
      </div>

      <div className="card">
        <h3>구매 이력</h3>
        {purchases?.length === 0 && <p className="muted">구매 기록이 없어요. (구매 추가는 2단계에서 만들어요)</p>}
        {purchases?.map((p) => (
          <div key={p.id} className="small">{fmtDate(p.purchaseDate)} · 수량 {p.quantity}</div>
        ))}
      </div>

      <div className="card">
        <h3>연락 기록</h3>
        {contacts?.length === 0 && <p className="muted">연락 기록이 없어요. (연락 기록 추가는 3단계에서 만들어요)</p>}
        {contacts?.map((x) => (
          <div key={x.id} className="small">{fmtDate(x.date)} · {x.content}</div>
        ))}
      </div>

      <ConfirmButton
        label="이 고객 정보 완전히 삭제"
        question={`${c.name} 님의 정보를 완전히 삭제할까요?\n구매 기록과 연락 기록도 함께 지워지고, 되돌릴 수 없어요.`}
        confirmLabel="완전히 삭제"
        onConfirm={onDelete}
      />
    </>
  );
}
