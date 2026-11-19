import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/ui';
import { addCustomer, getCustomer, updateCustomer } from '../data/repo';
import { CONTACT_METHODS, DEFAULT_INTEREST_TAGS, STAGES, type Customer, type NewRecord } from '../types';
import { addDays, fmtDate, today } from '../lib/date';

const empty = (): NewRecord<Customer> => ({
  name: '',
  phone: '',
  birthday: '',
  stage: 'prospect',
  interestTags: [],
  referrer: '',
  preferredMethod: undefined,
  preferredTime: '',
  subscription: false,
  consent: false,
  consentDate: undefined,
  takingMedication: false,
  pregnantOrNursing: false,
  nextContactDate: addDays(today(), 7),
  memo: '',
});

export default function CustomerForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<NewRecord<Customer>>(empty);
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getCustomer(id).then((c) => {
      if (c) {
        const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = c;
        setF(rest);
      }
      setLoaded(true);
    });
  }, [id]);

  const set = <K extends keyof NewRecord<Customer>>(k: K, v: NewRecord<Customer>[K]) => setF((p) => ({ ...p, [k]: v }));

  const toggleTag = (tag: string) =>
    set('interestTags', f.interestTags.includes(tag) ? f.interestTags.filter((x) => x !== tag) : [...f.interestTags, tag]);

  const setConsent = (on: boolean) =>
    setF((p) => ({ ...p, consent: on, consentDate: on ? p.consentDate || today() : undefined }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError('이름을 적어 주세요.');
    if (!f.phone.trim()) return setError('연락처를 적어 주세요.');
    const data: NewRecord<Customer> = {
      ...f,
      name: f.name.trim(),
      phone: f.phone.trim(),
      birthday: f.birthday || undefined,
      // 동의하지 않으면 건강 관련 정보는 저장하지 않음
      interestTags: f.consent ? f.interestTags : [],
      takingMedication: f.consent ? f.takingMedication : false,
      pregnantOrNursing: f.consent ? f.pregnantOrNursing : false,
    };
    if (id) {
      await updateCustomer(id, data);
      nav(`/customers/${id}`, { replace: true });
    } else {
      const c = await addCustomer(data);
      nav(`/customers/${c.id}`, { replace: true });
    }
  }

  if (!loaded) return null;

  return (
    <>
      <Header title={id ? '고객 정보 수정' : '고객 추가'} back />
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span>이름 *</span>
          <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
        </label>
        <label className="field">
          <span>연락처 *</span>
          <input className="input" type="tel" inputMode="tel" placeholder="010-0000-0000" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label className="field">
          <span>생일</span>
          <input className="input" type="date" value={f.birthday ?? ''} onChange={(e) => set('birthday', e.target.value)} />
        </label>

        <div className="field">
          <span>고객 단계</span>
          <div className="chips">
            {STAGES.map((s) => (
              <button type="button" key={s.value} className={'chip' + (f.stage === s.value ? ' on' : '')} onClick={() => set('stage', s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>다음 연락일</span>
          <input className="input" type="date" value={f.nextContactDate ?? ''} onChange={(e) => set('nextContactDate', e.target.value || undefined)} />
          <div className="chips">
            {[['1주', 7], ['2주', 14], ['1달', 30]].map(([label, d]) => (
              <button type="button" key={label} className="chip" onClick={() => set('nextContactDate', addDays(today(), d as number))}>
                {label} 뒤
              </button>
            ))}
          </div>
        </div>

        <fieldset className="box">
          <legend>건강 정보 수집 동의</legend>
          <label className="check">
            <input type="checkbox" checked={f.consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>고객이 건강 관련 정보 저장에 동의했어요</span>
          </label>
          {f.consent && (
            <label className="field">
              <span>동의일</span>
              <input className="input" type="date" value={f.consentDate ?? ''} onChange={(e) => set('consentDate', e.target.value || undefined)} />
            </label>
          )}

          <div className={'field' + (f.consent ? '' : ' locked')}>
            <span>관심사 태그 {f.consent ? '' : '🔒'}</span>
            {!f.consent && <p className="muted small">동의를 받으면 입력할 수 있어요.</p>}
            <div className="chips">
              {DEFAULT_INTEREST_TAGS.map((tag) => (
                <button type="button" key={tag} disabled={!f.consent} className={'chip' + (f.interestTags.includes(tag) ? ' on' : '')} onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <label className={'check' + (f.consent ? '' : ' locked')}>
            <input type="checkbox" disabled={!f.consent} checked={f.takingMedication} onChange={(e) => set('takingMedication', e.target.checked)} />
            <span>약을 복용 중이에요</span>
          </label>
          <label className={'check' + (f.consent ? '' : ' locked')}>
            <input type="checkbox" disabled={!f.consent} checked={f.pregnantOrNursing} onChange={(e) => set('pregnantOrNursing', e.target.checked)} />
            <span>임신 또는 수유 중이에요</span>
          </label>
        </fieldset>

        <label className="field">
          <span>알게 된 경로 (소개자)</span>
          <input className="input" value={f.referrer ?? ''} onChange={(e) => set('referrer', e.target.value)} />
        </label>

        <div className="field">
          <span>선호 연락 방법</span>
          <div className="chips">
            {CONTACT_METHODS.map((m) => (
              <button type="button" key={m.value} className={'chip' + (f.preferredMethod === m.value ? ' on' : '')} onClick={() => set('preferredMethod', f.preferredMethod === m.value ? undefined : m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>선호 연락 시간</span>
          <input className="input" placeholder="예: 평일 저녁" value={f.preferredTime ?? ''} onChange={(e) => set('preferredTime', e.target.value)} />
        </label>

        <label className="check">
          <input type="checkbox" checked={f.subscription} onChange={(e) => set('subscription', e.target.checked)} />
          <span>정기 주문 고객이에요</span>
        </label>

        <label className="field">
          <span>메모</span>
          <textarea className="input" rows={3} value={f.memo ?? ''} onChange={(e) => set('memo', e.target.value)} />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn primary block" type="submit">저장</button>
        {f.consent && f.consentDate && <p className="muted small center">동의일: {fmtDate(f.consentDate)}</p>}
      </form>
    </>
  );
}
