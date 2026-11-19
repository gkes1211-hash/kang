import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/ui';
import ConfirmButton from '../components/ConfirmButton';
import { addTemplate, deleteTemplate, getTemplate, updateTemplate } from '../data/repo';
import { SITUATIONS, fillTemplate } from '../lib/templates';
import { findBanned } from '../lib/compliance';

export default function TemplateForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('other');
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getTemplate(id).then((t) => {
      if (t) { setTitle(t.title); setSituation(t.situation); setBody(t.body); }
      setLoaded(true);
    });
  }, [id]);

  const banned = findBanned(body + ' ' + title);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('제목을 적어 주세요.');
    if (!body.trim()) return setError('본문을 적어 주세요.');
    const data = { title: title.trim(), situation, body: body.trim() };
    if (id) await updateTemplate(id, data);
    else await addTemplate(data);
    nav('/templates', { replace: true });
  }

  const insert = (token: string) => setBody((b) => b + token);

  if (!loaded) return null;
  return (
    <>
      <Header title={id ? '템플릿 수정' : '템플릿 추가'} back />
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>제목</span>
          <input id="t-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="field">
          <span>상황</span>
          <div className="chips">
            {SITUATIONS.map((s) => (
              <button type="button" key={s.value} className={'chip' + (situation === s.value ? ' on' : '')} onClick={() => setSituation(s.value)}>{s.label}</button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>본문</span>
          <textarea id="t-body" className="input msg" rows={7} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <div className="chips">
          <button type="button" className="chip" onClick={() => insert('{이름}')}>+ {'{이름}'} 넣기</button>
          <button type="button" className="chip" onClick={() => insert('{제품명}')}>+ {'{제품명}'} 넣기</button>
        </div>
        {banned.length > 0 && (
          <p className="warn small">⚠️ "{banned.join('", "')}" 같은 표현은 건강기능식품 광고 규정에 어긋날 수 있어요. 빼 주세요.</p>
        )}
        {body && (
          <div className="card">
            <h3>미리보기</h3>
            <p className="pre">{fillTemplate(body, '홍길동', '○○ 제품')}</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" type="submit">저장</button>
      </form>
      {id && (
        <ConfirmButton label="이 템플릿 삭제" question="이 템플릿을 삭제할까요?" confirmLabel="삭제"
          onConfirm={async () => { await deleteTemplate(id); nav('/templates', { replace: true }); }} />
      )}
    </>
  );
}
