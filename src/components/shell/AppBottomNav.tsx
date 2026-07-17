import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, X } from 'lucide-react';
import type { Tab } from '../../types';
import {
  BOTTOM_NAV_SHORT_LABEL,
  moreSectionsForRole,
  primaryTabsForRole,
  type NavItem,
} from './navConfig';
import type { Role } from '../../types';

type AppBottomNavProps = {
  activeTab: Tab;
  canAccess: (role: Role) => boolean;
  navLabel: (id: Tab) => string;
  onNavigate: (tab: Tab) => void;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  pendingPeopleCount?: number;
};

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  canAccess,
  navLabel,
  onNavigate,
  moreOpen,
  onMoreOpenChange,
  pendingPeopleCount = 0,
}) => {
  const primary = primaryTabsForRole(canAccess);
  const primaryIds = primary.map((p) => p.id);
  const sections = moreSectionsForRole(canAccess, primaryIds);
  const moreActive =
    moreOpen ||
    sections.some((s) => s.items.some((item) => item.id === activeTab));

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-[55] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onMoreOpenChange(false)}
          >
            <div className="absolute inset-0 bg-[#050a14]/40 backdrop-blur-[6px]" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More destinations"
              className="app-more-sheet absolute left-0 right-0 overflow-hidden rounded-t-[1.75rem] border-t border-[var(--choir-separator)] bg-[var(--choir-paper)]/96 shadow-[0_-12px_48px_rgba(5,10,20,0.18)] backdrop-blur-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center pt-2.5">
                <div className="app-sheet-grabber" aria-hidden />
              </div>
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <div>
                  <p className="text-[20px] font-semibold tracking-[-0.025em] text-[var(--choir-ink)]">
                    More
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--choir-ink-secondary)]">
                    Ministry tools & library
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onMoreOpenChange(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--choir-fill)] text-[var(--choir-ink-secondary)] transition active:scale-95"
                  aria-label="Close more menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mobile-scroll-contain max-h-[min(62dvh,520px)] space-y-5 overflow-y-auto px-4 pb-5">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                      {section.title}
                    </p>
                    <div className="overflow-hidden rounded-2xl bg-white/90 shadow-[0_1px_0_rgba(14,61,76,0.06)] ring-1 ring-black/[0.04]">
                      {section.items.map((item, idx) => (
                        <MoreRow
                          key={item.id}
                          item={item}
                          isActive={activeTab === item.id}
                          label={
                            item.id === 'ai_hub' ? 'AI Hub' : navLabel(item.id)
                          }
                          showDivider={idx < section.items.length - 1}
                          badge={
                            item.id === 'registration' && pendingPeopleCount > 0
                              ? pendingPeopleCount
                              : undefined
                          }
                          onSelect={() => {
                            onNavigate(item.id);
                            onMoreOpenChange(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className="app-bottom-nav app-bottom-nav-frosted fixed bottom-0 left-0 right-0 z-50 flex lg:hidden"
        aria-label="Primary"
      >
        {primary.map(({ id, icon: Icon }) => {
          const isActive = activeTab === id && !moreOpen;
          const short = BOTTOM_NAV_SHORT_LABEL[id] ?? navLabel(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onMoreOpenChange(false);
                onNavigate(id);
              }}
              className="app-tab-btn relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active-pill"
                  className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-[var(--choir-forest)]/12"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative flex flex-col items-center gap-0.5">
                <Icon
                  className={
                    'h-6 w-6 transition-colors ' +
                    (isActive ? 'text-[var(--choir-forest)]' : 'text-[var(--choir-ink-tertiary)]')
                  }
                  strokeWidth={isActive ? 2.4 : 1.6}
                />
                <span
                  className={
                    'text-[10px] tracking-[-0.01em] ' +
                    (isActive
                      ? 'font-bold text-[var(--choir-forest)]'
                      : 'font-medium text-[var(--choir-ink-tertiary)]')
                  }
                >
                  {short}
                </span>
                {id === 'registration' && pendingPeopleCount > 0 && (
                  <span className="absolute -right-2 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--choir-gold)] px-1 text-[9px] font-bold text-[var(--choir-forest-deep)]">
                    {pendingPeopleCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onMoreOpenChange(!moreOpen)}
          className="app-tab-btn relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
          aria-expanded={moreOpen}
          aria-current={moreActive && !primaryIds.includes(activeTab) ? 'page' : undefined}
        >
          {moreActive && !primaryIds.includes(activeTab) && (
            <motion.span
              layoutId="bottomnav-active-pill"
              className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-[var(--choir-forest)]/12"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative flex flex-col items-center gap-0.5">
            <LayoutGrid
              className={
                'h-6 w-6 ' +
                (moreActive ? 'text-[var(--choir-forest)]' : 'text-[var(--choir-ink-tertiary)]')
              }
              strokeWidth={moreActive ? 2.4 : 1.6}
            />
            <span
              className={
                'text-[10px] tracking-[-0.01em] ' +
                (moreActive
                  ? 'font-bold text-[var(--choir-forest)]'
                  : 'font-medium text-[var(--choir-ink-tertiary)]')
              }
            >
              More
            </span>
          </span>
        </button>
      </nav>
      <div className="app-bottom-spacer lg:hidden" aria-hidden="true" />
    </>
  );
};

const MoreRow: React.FC<{
  item: NavItem;
  label: string;
  isActive: boolean;
  showDivider: boolean;
  badge?: number;
  onSelect: () => void;
}> = ({ item, label, isActive, showDivider, badge, onSelect }) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        'flex min-h-[52px] w-full items-center gap-3.5 px-4 py-3 text-left transition active:bg-black/[0.04] ' +
        (showDivider ? 'border-b border-black/[0.05]' : '') +
        (isActive ? ' bg-[#0e3d4c]/[0.06]' : '')
      }
    >
      <span
        className={
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' +
          (isActive
            ? 'bg-[#0e3d4c] text-amber-300'
            : 'bg-[#0e3d4c]/[0.08] text-[#0e3d4c]')
        }
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.015em] text-[#1d1d1f]">
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
          {badge}
        </span>
      )}
      {isActive && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
      )}
    </button>
  );
};
