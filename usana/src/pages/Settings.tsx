import { useState } from 'react';
import { Header } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { clearAll, countAll } from '../data/repo';
import { addSampleData } from '../data/seed';

export default function Settings() {
  const counts = useQuery(countAll, []);
  const [msg, setMsg] = useState('');

  async function onSeed() {
    await addSampleData();
    setMsg('테스트용 고객 5명과 제품 3개를 넣었어요.');
  }

  async function onClear() {
    if (!window.confirm('이 폰에 저장된 모든 고객·제품·기록을 지울까요? 되돌릴 수 없어요.')) return;
    await clearAll();
    setMsg('모든 데이터를 지웠어요.');
  }

  return (
    <>
      <Header title="설정" />

      <div className="card">
        <h3>저장된 데이터</h3>
        {counts && (
          <p>고객 {counts.customers}명 · 제품 {counts.products}개 · 구매 {counts.purchases}건 · 연락 {counts.contacts}건</p>
        )}
        <p className="muted small">데이터는 이 폰(브라우저) 안에만 저장돼요.</p>
      </div>

      <div className="card">
        <h3>테스트</h3>
        <button className="btn block" onClick={onSeed}>테스트용 가짜 고객 5명 · 제품 3개 넣기</button>
        <button className="btn danger block" onClick={onClear}>모든 데이터 지우기</button>
        {msg && <p className="ok">{msg}</p>}
      </div>

      <p className="hint">백업·불러오기, 엑셀 내보내기, 단계 기준일 조정은 다음 단계에서 추가돼요.</p>
    </>
  );
}
