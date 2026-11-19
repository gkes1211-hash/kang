import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { addPurchase, getCustomer, listProducts } from '../data/repo';
import { calcRunOutDate, toNumber, won } from '../lib/calc';
import { daysBetween, fmtDate, today } from '../lib/date';
import type { Product } from '../types';

export default function PurchaseForm() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const customer = useQuery(() => getCustomer(id), [id]);
  const products = useQuery(listProducts, []);

  const [q, setQ] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [error, setError] = useState('');

  const pick = (p: Product) => {
    setProduct(p);
    if (!amountTouched) setAmount((p.price * quantity).toLocaleString('ko-KR'));
  };
  const changeQty = (n: number) => {
    const qn = Math.max(1, n);
    setQuantity(qn);
    if (product && !amountTouched) setAmount((product.price * qn).toLocaleString('ko-KR'));
  };

  const runOut = product && date ? calcRunOutDate(date, product.daysPerUnit, quantity, people) : '';
  const list = (products ?? [])
    .filter((p) => !q.trim() || p.name.includes(q.trim()) || p.category.includes(q.trim()))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return setError('제품을 골라 주세요.');
    if (!date) return setError('구매일을 정해 주세요.');
    await addPurchase({
      customerId: id,
      productId: product.id,
      quantity,
      people,
      purchaseDate: date,
      amount: toNumber(amount),
    });
    nav(`/customers/${id}`, { replace: true });
  }

  return (
    <>
      <Header title={customer ? `${customer.name} 님 구매 추가` : '구매 추가'} back />
      <form onSubmit={onSubmit} className="form">
        <div className="field">
          <span>① 제품</span>
          {product ? (
            <div className="picked">
              <div>
                <b>{product.name}</b>
                <div className="muted small">1통 {product.daysPerUnit}일분 · {won(product.price)}</div>
              </div>
              <button type="button" className="btn small-btn" onClick={() => setProduct(null)}>바꾸기</button>
            </div>
          ) : (
            <>
              <input id="pf-search" className="input" type="search" placeholder="제품명으로 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
              {products?.length === 0 && <p className="muted small">등록된 제품이 없어요. 제품 탭에서 먼저 추가해 주세요.</p>}
              <div className="pick-list">
                {list.map((p) => (
                  <button type="button" key={p.id} className="pick-item" onClick={() => pick(p)}>
                    <b>{p.name}</b>
                    <span className="muted small">{p.category} · {p.daysPerUnit}일분 · {won(p.price)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid2">
          <div className="field">
            <span>② 수량(통)</span>
            <Stepper value={quantity} onChange={changeQty} />
          </div>
          <div className="field">
            <span>섭취 인원</span>
            <Stepper value={people} onChange={(n) => setPeople(Math.max(1, n))} />
          </div>
        </div>

        <label className="field">
          <span>③ 구매일</span>
          <input id="pf-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="field">
          <span>금액(원)</span>
          <input id="pf-amount" className="input" inputMode="numeric" value={amount}
            onChange={(e) => { setAmountTouched(true); const n = toNumber(e.target.value); setAmount(n ? n.toLocaleString('ko-KR') : ''); }} />
        </label>

        <div className="result">
          <span>④ 소진 예정일 (자동 계산)</span>
          {runOut ? (
            <>
              <b className="big">{fmtDate(runOut)}</b>
              <span className="muted small">
                {product!.daysPerUnit}일 × {quantity}통 ÷ {people}명 = {daysBetween(date, runOut)}일분
              </span>
            </>
          ) : (
            <span className="muted">제품을 고르면 계산돼요.</span>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn primary block" type="submit">저장</button>
      </form>
    </>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" className="btn" onClick={() => onChange(value - 1)} aria-label="하나 줄이기">−</button>
      <b>{value}</b>
      <button type="button" className="btn" onClick={() => onChange(value + 1)} aria-label="하나 늘리기">+</button>
    </div>
  );
}
