import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { Mascot } from './MiniGrid';

/** 연구소 디자인으로 통일한 팝업 */
export function Modal({
  title,
  icon,
  onClose,
  children,
  footer,
  wide,
  className,
  tone,
}: {
  title: ReactNode;
  icon?: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  className?: string;
  tone?: 'lav' | 'mint' | 'pink' | 'butter';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], .modal-foot .btn, .modal-close')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`modal tone-${tone ?? 'lav'} ${wide ? 'wide' : ''} ${className ?? ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          {icon && (
            <span className="modal-icon">
              <Icon name={icon} size={22} />
            </span>
          )}
          <h2>{title}</h2>
          {onClose && (
            <button className="modal-close" onClick={onClose} aria-label="닫기">
              <Icon name="close" size={20} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmOpts {
  title: string;
  message: ReactNode;
  ok?: string;
  cancel?: string;
  /** 세 번째 선택지 (예: 저장하지 않고 이동) */
  alt?: string;
  danger?: boolean;
  icon?: string;
}
type ConfirmResult = 'ok' | 'alt' | 'cancel';

interface DialogApi {
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  choose: (o: ConfirmOpts) => Promise<ConfirmResult>;
  toast: (msg: string, tone?: 'ok' | 'warn') => void;
}

const Ctx = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOpts & { resolve: (r: ConfirmResult) => void }) | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: string }[]>([]);

  const choose = useCallback((o: ConfirmOpts) => new Promise<ConfirmResult>((resolve) => setPending({ ...o, resolve })), []);
  const confirm = useCallback(async (o: ConfirmOpts) => (await choose(o)) === 'ok', [choose]);
  const toast = useCallback((msg: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const finish = (r: ConfirmResult) => {
    pending?.resolve(r);
    setPending(null);
  };

  return (
    <Ctx.Provider value={{ confirm, choose, toast }}>
      {children}
      {pending && (
        <Modal
          title={pending.title}
          icon={pending.icon ?? (pending.danger ? 'trash' : 'help')}
          tone={pending.danger ? 'pink' : 'lav'}
          onClose={() => finish('cancel')}
          footer={
            <>
              <button className="btn ghost" onClick={() => finish('cancel')}>
                {pending.cancel ?? '취소'}
              </button>
              {pending.alt && (
                <button className="btn butter" onClick={() => finish('alt')}>
                  {pending.alt}
                </button>
              )}
              <button className={'btn ' + (pending.danger ? 'pink' : 'primary')} onClick={() => finish('ok')} data-autofocus>
                {pending.ok ?? '확인'}
              </button>
            </>
          }
        >
          <div className="confirm-body">
            <Mascot size={56} />
            <div>{pending.message}</div>
          </div>
        </Modal>
      )}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + t.tone}>
            <Icon name={t.tone === 'ok' ? 'check' : 'help'} size={18} />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useDialog(): DialogApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('DialogProvider 가 필요해요');
  return c;
}
