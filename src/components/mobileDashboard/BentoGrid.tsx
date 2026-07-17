import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  GripVertical,
  IndianRupee,
  Link2,
  Pencil,
  TrendingUp,
  UsersRound,
  Flame,
  Check,
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { calculateChoirHealth, isActiveMember, sumPendingCollections } from '../../utils/choirStats';
import type { Mass, Member, Payment, Tab } from '../../types';
import {
  ADMIN_BENTO_DEFAULT,
  BENTO_SPANS,
  MEMBER_BENTO_DEFAULT,
  type BentoWidgetKey,
  type DashboardVariant,
} from './types';

const STORAGE_PREFIX = 'choir360.md.bento.';

type BentoGridProps = {
  variant: DashboardVariant;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  streakDays: number;
  onNavigate: (tab: Tab) => void;
  onOpenSheet: (key: BentoWidgetKey) => void;
};

function loadOrder(variant: DashboardVariant): BentoWidgetKey[] {
  const fallback = variant === 'admin' ? ADMIN_BENTO_DEFAULT : MEMBER_BENTO_DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + variant);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as BentoWidgetKey[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    const known = new Set(Object.keys(BENTO_SPANS) as BentoWidgetKey[]);
    const cleaned = parsed.filter((k) => known.has(k));
    for (const k of fallback) {
      if (!cleaned.includes(k)) cleaned.push(k);
    }
    return cleaned;
  } catch {
    return fallback;
  }
}

function saveOrder(variant: DashboardVariant, order: BentoWidgetKey[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + variant, JSON.stringify(order));
  } catch {
    /* quota / private mode */
  }
}

/**
 * Pattern 1 — Customizable widget bento grid with localStorage + edit/reorder.
 */
export const BentoGrid: React.FC<BentoGridProps> = ({
  variant,
  members,
  masses,
  payments,
  streakDays,
  onNavigate,
  onOpenSheet,
}) => {
  const [order, setOrder] = useState<BentoWidgetKey[]>(() => loadOrder(variant));
  const [editMode, setEditMode] = useState(false);
  const [dragKey, setDragKey] = useState<BentoWidgetKey | null>(null);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrder(loadOrder(variant));
  }, [variant]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = () => {
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      setEditMode(true);
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            navigator.vibrate(12);
          }
        }
      } catch {
        /* no-op */
      }
    }, 480);
  };

  const active = useMemo(() => members.filter(isActiveMember), [members]);
  const pendingMembers = useMemo(
    () => members.filter((m) => m.status === 'Pending'),
    [members],
  );
  const nextMass = masses[0];
  const pendingInr = sumPendingCollections(payments);
  const health = calculateChoirHealth(members);

  const persist = useCallback(
    (next: BentoWidgetKey[]) => {
      setOrder(next);
      saveOrder(variant, next);
    },
    [variant],
  );

  const move = (from: BentoWidgetKey, to: BentoWidgetKey) => {
    if (from === to) return;
    const next = [...order];
    const fi = next.indexOf(from);
    const ti = next.indexOf(to);
    if (fi < 0 || ti < 0) return;
    next.splice(fi, 1);
    next.splice(ti, 0, from);
    persist(next);
  };

  const titles: Record<BentoWidgetKey, string> = {
    streak: 'Attendance streak',
    next_liturgy: 'Next liturgy',
    active_members: 'Active members',
    pending_collection: 'Pending collection',
    choir_health: 'Choir health',
    quick_links: 'Quick links',
  };

  const renderBody = (key: BentoWidgetKey) => {
    switch (key) {
      case 'streak':
        return (
          <>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">
              <Flame className="h-4 w-4" />
            </div>
            <p className="text-[26px] font-semibold tracking-[-0.03em] text-amber-200">
              {streakDays}
            </p>
            <p className="text-[12px] text-[#a1a1a6]">day streak</p>
          </>
        );
      case 'next_liturgy':
        return (
          <>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-300/15 text-teal-200">
              <CalendarDays className="h-4 w-4" />
            </div>
            {nextMass ? (
              <>
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#f5f5f7]">
                  {nextMass.name}
                </p>
                <p className="mt-1 text-[12px] text-[#86868b]">
                  {nextMass.date} · {nextMass.time}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-[#86868b]">No mass scheduled</p>
            )}
          </>
        );
      case 'active_members':
        return (
          <>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-300/15 text-teal-200">
              <UsersRound className="h-4 w-4" />
            </div>
            <p className="text-[26px] font-semibold tracking-[-0.03em] text-[#f5f5f7]">
              {active.length}
            </p>
            <p className="text-[12px] text-[#a1a1a6]">
              {pendingMembers.length > 0
                ? `+${pendingMembers.length} pending`
                : 'confirmed'}
            </p>
          </>
        );
      case 'pending_collection':
        return (
          <>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">
              <IndianRupee className="h-4 w-4" />
            </div>
            <p className="text-[20px] font-semibold tracking-[-0.03em] text-amber-200">
              {formatINR(pendingInr)}
            </p>
            <p className="text-[12px] text-[#a1a1a6]">to collect</p>
          </>
        );
      case 'choir_health':
        return (
          <>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-300/15 text-teal-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#f5f5f7]">
              {health.healthLabel}
            </p>
            <p className="mt-1 text-[12px] text-[#a1a1a6]">
              Score {health.healthScore} · avg {health.averageAttendance}%
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-300 to-amber-300"
                style={{ width: `${health.healthScore}%` }}
              />
            </div>
          </>
        );
      case 'quick_links':
        return (
          <>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#f5f5f7]">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {(variant === 'admin'
                ? [
                    { label: 'Masses', tab: 'masses' as Tab },
                    { label: 'People', tab: 'registration' as Tab },
                    { label: 'Attendance', tab: 'attendance' as Tab },
                  ]
                : [
                    { label: 'Music', tab: 'song_library' as Tab },
                    { label: 'My ID', tab: 'dashboard_member' as Tab },
                    { label: 'Calendar', tab: 'calendar' as Tab },
                  ]
              ).map((l) => (
                <span
                  key={l.label}
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(l.tab);
                  }}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-teal-100"
                >
                  {l.label}
                </span>
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <section aria-label="Dashboard widgets">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
          Your widgets
        </p>
        <button
          type="button"
          onClick={() => setEditMode((e) => !e)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/8 px-3 text-[12px] font-semibold text-amber-200"
        >
          {editMode ? (
            <>
              <Check className="h-3.5 w-3.5" /> Done
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" /> Customize
            </>
          )}
        </button>
      </div>

      {editMode && (
        <p className="mb-2 text-[11px] text-[#86868b]">
          Drag tiles by the handle to reorder. Layout is saved on this device.
        </p>
      )}

      <div className="md-bento-grid">
        {order.map((key) => {
          const span = BENTO_SPANS[key];
          return (
            <article
              key={key}
              draggable={editMode}
              onDragStart={() => setDragKey(key)}
              onDragOver={(e) => {
                if (!editMode) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragKey) move(dragKey, key);
                setDragKey(null);
              }}
              onDragEnd={() => setDragKey(null)}
              className={`md-bento-tile md-bento-span-${span} ${
                dragKey === key ? 'opacity-60' : ''
              } ${editMode ? 'ring-1 ring-amber-300/30' : ''}`}
            >
              {editMode && (
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868b]">
                    {titles[key]}
                  </span>
                  <GripVertical className="h-4 w-4 text-[#86868b]" aria-hidden />
                </div>
              )}
              <button
                type="button"
                className="w-full text-left"
                disabled={editMode}
                onClick={() => onOpenSheet(key)}
                onPointerDown={startLongPress}
                onPointerUp={clearLongPress}
                onPointerCancel={clearLongPress}
                onPointerLeave={clearLongPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEditMode(true);
                }}
              >
                {renderBody(key)}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
