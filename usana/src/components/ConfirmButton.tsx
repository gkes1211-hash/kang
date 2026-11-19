import { useState } from 'react';

/** 한 번 누르면 "정말 할까요?" 확인 칸이 나오고, 거기서 한 번 더 눌러야 실행되는 버튼 */
export default function ConfirmButton({ label, question, confirmLabel, onConfirm }: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return <button className="btn danger block" onClick={() => setAsking(true)}>{label}</button>;
  return (
    <div className="confirm">
      <p className="pre">{question}</p>
      <div className="btn-row">
        <button className="btn" onClick={() => setAsking(false)}>취소</button>
        <button className="btn danger-fill" onClick={async () => { setAsking(false); await onConfirm(); }}>{confirmLabel}</button>
      </div>
    </div>
  );
}
