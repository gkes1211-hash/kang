import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Header, digits } from '../components/ui';
import { useQuery } from '../data/useQuery';
import { getCustomer, listProducts, listPurchasesByCustomer, listTemplates } from '../data/repo';
import { fillTemplate, situationForTask } from '../lib/templates';
import { findBanned } from '../lib/compliance';
import { copyText } from '../lib/copy';
import type { TaskKind } from '../types';

export default function MessagePage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const recommended = situationForTask(params.get('kind') as TaskKind | null);
  const presetProduct = params.get('product') ?? undefined;

  const data = useQuery(async () => {
    const [customer, templates, products, purchases] = await Promise.all([
      getCustomer(id), listTemplates(), listProducts(), listPurchasesByCustomer(id),
    ]);
    return { customer, templates, products, purchases };
  }, [id]);

  const [templateId, setTemplateId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [text, setText] = useState('');
  const [toast, setToast] = useState('');

  // 고객이 산 제품 (최근 순, 중복 없이)
  const boughtNames = useMemo(() => {
    if (!data) return [];
    const names = data.purchases.map((p) => data.products.find((x) => x.id === p.productId)?.name).filter(Boolean) as string[];
    return [...new Set(names)];
  }, [data]);

  const ordered = useMemo(() => {
    if (!data) return [];
    return [...data.templates].sort((a, b) => Number(b.situation === recommended) - Number(a.situation === recommended));
  }, [data, recommended]);

  // 처음 열 때: 추천 템플릿, 최근 제품을 골라 둠
  useEffect(() => {
    if (!data || templateId) return;
    if (ordered[0]) setTemplateId(ordered[0].id);
    setProductName(presetProduct ?? boughtNames[0] ?? '');
  }, [data, ordered, boughtNames, templateId, presetProduct]);

  const tpl = data?.templates.find((x) => x.id === templateId);
  useEffect(() => {
    if (tpl && data?.customer) setText(fillTemplate(tpl.body, data.customer.name, productName));
  }, [tpl, productName, data?.customer]);

  if (!data) return null;
  const c = data.customer;
  if (!c) return (<><Header title="메시지" back /><div className="empty">고객을 찾을 수 없어요.</div></>);

  const needsProduct = tpl?.body.includes('{제품명}');
  const banned = findBanned(text);

  async function onCopy() {
    const ok = await copyText(text);
    setToast(ok ? '복사했어요. 카톡 대화방에 붙여넣기 하세요.' : '복사가 안 됐어요. 아래 글을 길게 눌러 직접 복사해 주세요.');
    window.setTimeout(() => setToast(''), 3000);
  }

  return (
    <>
      <Header title={`${c.name} 님께`} back right={<Link className="btn small-btn" to="/templates">템플릿 관리</Link>} />

      <div className="field">
        <span className="label">템플릿 고르기</span>
        <div className="chips">
          {ordered.map((t) => (
            <button key={t.id} className={'chip' + (t.id === templateId ? ' on' : '')} onClick={() => setTemplateId(t.id)}>
              {t.situation === recommended ? '★ ' : ''}{t.title}
            </button>
          ))}
          {ordered.length === 0 && <p className="muted">템플릿이 없어요. [템플릿 관리]에서 만들어 주세요.</p>}
        </div>
        {recommended && <p className="muted small">★ 오늘 할 일에 맞는 추천 템플릿</p>}
      </div>

      {needsProduct && (
        <div className="field">
          <span className="label">{'{제품명}'}에 넣을 제품</span>
          <div className="chips">
            {boughtNames.map((n) => (
              <button key={n} className={'chip' + (productName === n ? ' on' : '')} onClick={() => setProductName(n)}>{n}</button>
            ))}
            {data.products.filter((p) => !boughtNames.includes(p.name)).length > 0 && (
              <select className="input select" value={boughtNames.includes(productName) ? '' : productName} onChange={(e) => setProductName(e.target.value)}>
                <option value="">다른 제품…</option>
                {data.products.filter((p) => !boughtNames.includes(p.name)).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      <label className="field">
        <span className="label">보낼 글 (고쳐 써도 돼요)</span>
        <textarea id="msg-text" className="input msg" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {banned.length > 0 && (
        <p className="warn small">⚠️ "{banned.join('", "')}" 같은 표현은 건강기능식품 광고 규정에 어긋날 수 있어요.</p>
      )}

      <div className="btn-row msg-actions">
        <button className="btn primary" onClick={onCopy}>📋 복사 (카톡용)</button>
        <a className="btn" href={`sms:${digits(c.phone)}?body=${encodeURIComponent(text)}`}>💬 문자로 보내기</a>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
