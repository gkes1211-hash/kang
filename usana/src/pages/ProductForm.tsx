import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/ui';
import { addProduct, getProduct, listProducts, updateProduct } from '../data/repo';
import { useQuery } from '../data/useQuery';
import { DEFAULT_INTEREST_TAGS, type NewRecord, type Product } from '../types';
import { toNumber } from '../lib/calc';
import { findBanned } from '../lib/compliance';

// 숫자 칸은 입력 중에 문자열로 들고 있다가 저장할 때 숫자로 바꿈
interface FormState extends Omit<NewRecord<Product>, 'daysPerUnit' | 'price'> {
  daysPerUnit: string;
  price: string;
}

const empty: FormState = {
  name: '', category: '', functionalClaim: '', dailyDose: '', unitSize: '',
  daysPerUnit: '', price: '', interestTags: [], cautions: '',
};


export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<FormState>(empty);
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState('');
  const all = useQuery(listProducts, []);
  const categories = [...new Set((all ?? []).map((p) => p.category).filter(Boolean))];

  useEffect(() => {
    if (!id) return;
    getProduct(id).then((p) => {
      if (p) setF({ ...p, daysPerUnit: String(p.daysPerUnit), price: p.price ? p.price.toLocaleString('ko-KR') : '' });
      setLoaded(true);
    });
  }, [id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleTag = (t: string) =>
    set('interestTags', f.interestTags.includes(t) ? f.interestTags.filter((x) => x !== t) : [...f.interestTags, t]);

  const banned = findBanned(f.functionalClaim);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError('제품명을 적어 주세요.');
    const days = toNumber(f.daysPerUnit);
    if (!days) return setError('1통 섭취 기간(일)을 적어 주세요. 소진일 계산에 꼭 필요해요.');
    const data: NewRecord<Product> = {
      name: f.name.trim(),
      category: f.category.trim(),
      functionalClaim: f.functionalClaim.trim(),
      dailyDose: f.dailyDose.trim(),
      unitSize: f.unitSize.trim(),
      daysPerUnit: days,
      price: toNumber(f.price),
      interestTags: f.interestTags,
      cautions: f.cautions?.trim(),
    };
    if (id) {
      await updateProduct(id, data);
      nav(`/products/${id}`, { replace: true });
    } else {
      const p = await addProduct(data);
      nav(`/products/${p.id}`, { replace: true });
    }
  }

  if (!loaded) return null;

  return (
    <>
      <Header title={id ? '제품 수정' : '제품 추가'} back />
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span>제품명 *</span>
          <input id="p-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
        </label>
        <label className="field">
          <span>분류</span>
          <input id="p-cat" className="input" list="cat-list" placeholder="예: 종합 영양" value={f.category} onChange={(e) => set('category', e.target.value)} />
          <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="field">
          <span>기능성 문구 (식약처 인정, 라벨 그대로)</span>
          <textarea id="p-claim" className="input" rows={3} value={f.functionalClaim} onChange={(e) => set('functionalClaim', e.target.value)} />
          {banned.length > 0 && (
            <p className="warn small">⚠️ "{banned.join('", "')}" 같은 표현은 건강기능식품 광고 규정에 어긋날 수 있어요. 라벨에 적힌 문구만 그대로 넣어 주세요.</p>
          )}
        </label>
        <div className="grid2">
          <label className="field">
            <span>1일 섭취량</span>
            <input id="p-dose" className="input" placeholder="예: 1일 2정" value={f.dailyDose} onChange={(e) => set('dailyDose', e.target.value)} />
          </label>
          <label className="field">
            <span>1통 용량</span>
            <input id="p-size" className="input" placeholder="예: 56정" value={f.unitSize} onChange={(e) => set('unitSize', e.target.value)} />
          </label>
          <label className="field">
            <span>1통 섭취 기간(일) *</span>
            <input id="p-days" className="input" inputMode="numeric" placeholder="예: 28" value={f.daysPerUnit} onChange={(e) => set('daysPerUnit', e.target.value.replace(/[^0-9]/g, ''))} />
          </label>
          <label className="field">
            <span>가격(원)</span>
            <input id="p-price" className="input" inputMode="numeric" placeholder="예: 45,000" value={f.price}
              onChange={(e) => { const n = toNumber(e.target.value); set('price', n ? n.toLocaleString('ko-KR') : ''); }} />
          </label>
        </div>
        <div className="field">
          <span>관심사 태그</span>
          <div className="chips">
            {DEFAULT_INTEREST_TAGS.map((t) => (
              <button type="button" key={t} className={'chip' + (f.interestTags.includes(t) ? ' on' : '')} onClick={() => toggleTag(t)}>{t}</button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>주의사항</span>
          <textarea id="p-caution" className="input" rows={3} value={f.cautions ?? ''} onChange={(e) => set('cautions', e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" type="submit">저장</button>
      </form>
    </>
  );
}
