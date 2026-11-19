import { useState, type FormEvent } from 'react';
import { recordContact, skipTask } from '../data/repo';
import { CONTACT_METHODS, type ContactMethod, type Customer } from '../types';
import type { TodoItem } from '../lib/todo';
import { addDays, fmtDate, today } from '../lib/date';

type NextChoice = '7' | '14' | '30' | 'custom' | 'none';

/** 화면 아래에서 올라오는 "연락 기록" 입력 칸. 할 일 [완료]와 고객 카드 [+ 연락 기록]에서 같이 씀 */
export default function ContactSheet({ customer, item, onClose }: {
  customer: Customer;
  item?: TodoItem;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<ContactMethod>(customer.preferredMethod ?? 'phone');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(today());
  const [next, setNext] = useState<NextChoice>('30');
  const [customDate, setCustomDate] = useState(addDays(today(), 3));
  const [saving, setSaving] = useState(false);

  const nextDate = next === 'none' ? null : next === 'custom' ? customDate : addDays(today(), Number(next));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await recordContact({
      customerId: customer.id,
      date,
      method,
      content: content.trim() || (item ? item.title : '연락함'),
      nextContactDate: nextDate,
      taskId: item?.taskId,
      virtualTask: item && !item.taskId ? { kind: item.kind, dueDate: item.dueDate } : undefined,
    });
    onClose();
  }

  async function onSkip() {
    if (!item?.taskId) return;
    await skipTask(item.taskId);
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="row-between">
          <h2>{customer.name} 님 연락 기록</h2>
          <button type="button" className="icon-btn close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        {item && <p className="muted small sheet-task">할 일: {item.title}</p>}

        <div className="field">
          <span>방법</span>
          <div className="chips">
            {CONTACT_METHODS.map((m) => (
              <button type="button" key={m.value} className={'chip' + (method === m.value ? ' on' : '')} onClick={() => setMethod(m.value)}>{m.label}</button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>한 줄 메모</span>
          <input id="cs-content" className="input" placeholder="예: 잘 드시고 계심, 다음 달 재구매 예정" value={content} onChange={(e) => setContent(e.target.value)} autoComplete="off" />
        </label>

        <label className="field">
          <span>연락한 날</span>
          <input id="cs-date" className="input" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
        </label>

        <div className="field">
          <span>다음 연락일</span>
          <div className="chips">
            {([['7', '1주 뒤'], ['14', '2주 뒤'], ['30', '1달 뒤'], ['custom', '날짜 고르기'], ['none', '정하지 않음']] as [NextChoice, string][]).map(([v, label]) => (
              <button type="button" key={v} className={'chip' + (next === v ? ' on' : '')} onClick={() => setNext(v)}>{label}</button>
            ))}
          </div>
          {next === 'custom' && (
            <input id="cs-next" className="input" type="date" min={today()} value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          )}
          <p className="muted small">{nextDate ? `→ ${fmtDate(nextDate)}` : '다음 연락일 없이 저장해요. 모든 고객에게 다음 연락일을 정해 두는 걸 권해요.'}</p>
        </div>

        <button className="btn primary block" type="submit" disabled={saving}>저장</button>
        {item?.taskId && (
          <button type="button" className="link-btn" onClick={onSkip}>연락하지 않고 이 할 일 넘기기</button>
        )}
      </form>
    </div>
  );
}
