import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Undo2, X } from 'lucide-react';

export interface ToastOptions {
  message: string;
  tone?: 'success' | 'error' | 'info';
  /** When provided, the toast shows an Undo button that invokes this callback. */
  onUndo?: () => void;
  durationMs?: number;
}

interface ToastRecord extends Required<Pick<ToastOptions, 'message'>> {
  id: number;
  tone: 'success' | 'error' | 'info';
  onUndo?: () => void;
}

type ShowToast = (options: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Fire a toast from anywhere below <ToastProvider>. */
export const useToast = () => useContext(ToastContext);

const TONE_STYLES: Record<ToastRecord['tone'], { icon: React.ElementType; iconClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-[#30d158]' },
  error: { icon: AlertTriangle, iconClass: 'text-[#ff453a]' },
  info: { icon: Info, iconClass: 'text-[#f5c24c]' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ShowToast>(({ message, tone = 'success', onUndo, durationMs }) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone, onUndo }]);
    // Undo toasts stay longer so users have time to react.
    const ttl = durationMs ?? (onUndo ? 7000 : 4000);
    timers.current.set(id, setTimeout(() => dismiss(id), ttl));
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Above the mobile bottom nav (56px + safe area); bottom-right on desktop */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 lg:items-end lg:pr-6"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {toasts.map((toast) => {
          const { icon: Icon, iconClass } = TONE_STYLES[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className="apple-toast pointer-events-auto w-full max-w-sm animate-toast-in font-apple"
            >
              <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
              <span className="min-w-0 flex-1 leading-snug">{toast.message}</span>
              {toast.onUndo && (
                <button
                  type="button"
                  onClick={() => { toast.onUndo?.(); dismiss(toast.id); }}
                  className="btn-pill btn-pill-gold btn-pill-xs !min-h-[28px]"
                >
                  <Undo2 className="h-3 w-3" /> Undo
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
