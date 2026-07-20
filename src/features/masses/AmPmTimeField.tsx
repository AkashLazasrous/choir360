import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

export type Meridiem = 'AM' | 'PM';

export type ParsedAmPmTime = {
  hour12: number;
  minute: number;
  meridiem: Meridiem;
};

const TIME_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;

/** Parse display times like "06:30 AM", "4:00 PM", or 24h "16:00". */
export function parseAmPmTime(value: string): ParsedAmPmTime {
  const trimmed = value.trim();
  const match = TIME_RE.exec(trimmed);
  if (!match) {
    return { hour12: 6, minute: 30, meridiem: 'AM' };
  }
  let hour = Number(match[1]);
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  const periodRaw = match[3]?.toUpperCase() as Meridiem | undefined;

  if (periodRaw === 'AM' || periodRaw === 'PM') {
    if (hour === 0) hour = 12;
    if (hour > 12) hour = hour % 12 || 12;
    return { hour12: hour, minute, meridiem: periodRaw };
  }

  const meridiem: Meridiem = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { hour12, minute, meridiem };
}

export function formatAmPmTime(parts: ParsedAmPmTime): string {
  const h = Math.min(12, Math.max(1, parts.hour12));
  const m = Math.min(59, Math.max(0, parts.minute));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${parts.meridiem}`;
}

function toInputTimeValue(parts: ParsedAmPmTime): string {
  let hour24 = parts.hour12 % 12;
  if (parts.meridiem === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

function fromInputTimeValue(value: string, fallback: ParsedAmPmTime): ParsedAmPmTime {
  const [hRaw, mRaw] = value.split(':');
  const hour24 = Number(hRaw);
  const minute = Number(mRaw);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return fallback;
  const meridiem: Meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, meridiem };
}

type AmPmTimeFieldProps = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Start-time control: readable HH:MM field, separate clock button, AM/PM toggle.
 */
export const AmPmTimeField: React.FC<AmPmTimeFieldProps> = ({
  value,
  onChange,
  label = 'Start Time',
  id,
  className = '',
  disabled = false,
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const clockInputRef = useRef<HTMLInputElement>(null);
  const parts = useMemo(() => parseAmPmTime(value), [value]);
  const [draft, setDraft] = useState(
    () => `${String(parts.hour12).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`,
  );

  useEffect(() => {
    setDraft(`${String(parts.hour12).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`);
  }, [parts.hour12, parts.minute]);

  const commit = (next: Partial<ParsedAmPmTime>) => {
    onChange(formatAmPmTime({ ...parts, ...next }));
  };

  const openClock = () => {
    const el = clockInputRef.current;
    if (!el || disabled) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        // Fall through.
      }
    }
    el.click();
    el.focus();
  };

  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      {label ? (
        <label htmlFor={fieldId} className="text-[10px] font-bold uppercase text-slate-400">
          {label}
        </label>
      ) : null}

      <div className="flex min-h-[44px] w-full min-w-0 flex-wrap items-stretch gap-2">
        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const match = /^(\d{1,2}):(\d{2})$/.exec(draft.trim());
            if (!match) {
              setDraft(`${String(parts.hour12).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`);
              return;
            }
            let hour12 = Number(match[1]);
            const minute = Math.min(59, Math.max(0, Number(match[2])));
            if (hour12 === 0) hour12 = 12;
            if (hour12 > 12) hour12 = hour12 % 12 || 12;
            commit({ hour12, minute });
          }}
          className="apple-input min-h-[44px] min-w-[5.5rem] flex-1 basis-[5.5rem] text-sm tabular-nums tracking-wide"
          placeholder="06:30"
          aria-label={`${label} hours and minutes`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={openClock}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-black/[0.04] text-[#0e3d4c] transition hover:bg-black/[0.08] disabled:opacity-40"
          aria-label="Open clock to choose time"
          title="Choose time"
        >
          <Clock className="h-4 w-4" />
        </button>

        <input
          ref={clockInputRef}
          type="time"
          tabIndex={-1}
          disabled={disabled}
          value={toInputTimeValue(parts)}
          onChange={(e) => {
            if (!e.target.value) return;
            onChange(formatAmPmTime(fromInputTimeValue(e.target.value, parts)));
          }}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          aria-hidden
        />

        <div
          role="group"
          aria-label="AM or PM"
          className="inline-flex h-11 shrink-0 overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.04] p-0.5"
        >
          {(['AM', 'PM'] as const).map((period) => {
            const selected = parts.meridiem === period;
            return (
              <button
                key={period}
                type="button"
                disabled={disabled}
                onClick={() => commit({ meridiem: period })}
                aria-pressed={selected}
                className={`min-w-[44px] px-3 text-[12px] font-bold tracking-wide transition ${
                  selected
                    ? 'rounded-lg bg-[#0e3d4c] text-amber-200 shadow-sm'
                    : 'text-[#334155] hover:text-[#0e3d4c]'
                } disabled:opacity-40`}
              >
                {period}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
