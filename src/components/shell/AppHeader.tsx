import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Languages, Music2, Search, X } from 'lucide-react';
import type { Language, Tab } from '../../types';
import { useParish } from '../../features/parish/ParishContext';
import type { ContextualAlert } from '../mobileDashboard/types';

const languages: { id: Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ta', label: 'தமிழ்' },
  { id: 'ml', label: 'മല' },
  { id: 'te', label: 'తె' },
  { id: 'hi', label: 'हिं' },
];

type AppHeaderProps = {
  currentLang: Language;
  setCurrentLang: (lang: Language) => void;
  onNavigateHome: () => void;
  onOpenAccount: () => void;
  onOpenSearch?: () => void;
  searchOpen?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  searchResultsSlot?: React.ReactNode;
  searchContainerRef?: React.RefObject<HTMLDivElement | null>;
  notificationDot?: boolean;
  /** Pattern 9 — contextual alert previews for the Bell */
  contextualAlerts?: ContextualAlert[];
  onAlertNavigate?: (tab: Tab) => void;
  avatarUrl?: string | null;
  avatarInitials?: string;
  roleChip?: string | null;
  demoRoleSlot?: React.ReactNode;
  /** Hide large desktop search — mobile uses icon */
  activeTab?: Tab;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentLang,
  setCurrentLang,
  onNavigateHome,
  onOpenAccount,
  onOpenSearch,
  searchQuery = '',
  onSearchQueryChange,
  searchResultsSlot,
  searchContainerRef,
  notificationDot = true,
  contextualAlerts = [],
  onAlertNavigate,
  avatarUrl,
  avatarInitials = 'C',
  roleChip,
  demoRoleSlot,
}) => {
  const { selectedParish } = useParish();
  const parishLabel = selectedParish?.parishName ?? 'Choir360';
  const [mobileLangOpen, setMobileLangOpen] = React.useState(false);
  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const hasAlerts = contextualAlerts.length > 0;

  return (
    <header className="app-header glass-panel-dark sticky top-0 z-50 shrink-0 border-b border-white/10 text-[#f5f5f7] lg:static">
      <div className="app-header-inner mx-auto flex max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-6">
        {/* Brand — mobile: mark only; tablet+: full lockup */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex min-h-[44px] min-w-0 items-center gap-2.5 rounded-full pr-1 transition active:opacity-80"
          aria-label="Choir360 home"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-[#050a14] shadow-[0_0_0_1px_rgba(245,194,76,0.35)]">
            <Music2 className="h-3.5 w-3.5" />
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-[15px] font-semibold leading-none tracking-[-0.02em] lg:text-[17px]">
              Choir360
            </p>
            <p className="mt-0.5 hidden truncate text-[10px] font-normal text-[#a1a1a6] md:block">
              {parishLabel}
            </p>
          </div>
        </button>

        {/* Mobile parish context (replaces sidebar cram) */}
        <div className="min-w-0 flex-1 sm:hidden">
          <p className="truncate text-[13px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">
            {parishLabel}
          </p>
          <p className="truncate text-[10px] text-[#86868b]">Parish choir</p>
        </div>

        {/* Desktop search */}
        <div
          ref={searchContainerRef}
          className="relative ml-auto hidden max-w-md flex-1 lg:block"
        >
          <div className="flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3.5 transition focus-within:border-white/25 focus-within:bg-white/12">
            <Search className="h-3.5 w-3.5 text-[#86868b]" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange?.(e.target.value)}
              onFocus={() => onSearchQueryChange?.(searchQuery)}
              className="w-full bg-transparent px-2.5 py-2 text-[13px] outline-none placeholder:text-[#86868b]"
              placeholder="Search members, masses, songs…"
              aria-label="Search"
            />
          </div>
          {searchResultsSlot}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 lg:ml-0">
          {/* Mobile search affordance */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:bg-white/10 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Language — tablet+ inline; phone via sheet toggle */}
          <div className="hidden items-center rounded-full bg-white/[0.08] p-0.5 md:flex">
            {languages.map((language) => (
              <button
                key={language.id}
                type="button"
                onClick={() => setCurrentLang(language.id)}
                className={
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition ' +
                  (currentLang === language.id
                    ? 'bg-white text-[#1d1d1f]'
                    : 'text-[#a1a1a6] hover:text-white')
                }
              >
                {language.label}
              </button>
            ))}
          </div>

          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMobileLangOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:bg-white/10"
              aria-label="Language"
              aria-expanded={mobileLangOpen}
            >
              <Languages className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {mobileLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute right-0 top-[calc(100%+6px)] z-50 flex gap-1 rounded-2xl border border-white/10 bg-[#0a1628]/95 p-1.5 shadow-2xl backdrop-blur-xl"
                >
                  {languages.map((language) => (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => {
                        setCurrentLang(language.id);
                        setMobileLangOpen(false);
                      }}
                      className={
                        'min-h-[36px] rounded-xl px-2.5 text-[11px] font-semibold ' +
                        (currentLang === language.id
                          ? 'bg-amber-300 text-[#050a14]'
                          : 'text-[#a1a1a6]')
                      }
                    >
                      {language.id.toUpperCase()}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:bg-white/10"
              aria-label={hasAlerts ? `${contextualAlerts.length} alerts` : 'Notifications'}
              aria-expanded={alertsOpen}
              onClick={() => setAlertsOpen((o) => !o)}
            >
              <Bell className="h-4 w-4" />
              {(hasAlerts || notificationDot) && (
                <span
                  className={
                    hasAlerts
                      ? 'absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-300 px-1 text-[9px] font-bold text-[#050a14]'
                      : 'absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-amber-300'
                  }
                >
                  {hasAlerts ? contextualAlerts.length : null}
                </span>
              )}
            </button>
            <AnimatePresence>
              {alertsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(18.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#050a14]/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <p className="text-[12px] font-semibold text-[#f5f5f7]">Alerts</p>
                    <button type="button" aria-label="Close alerts" onClick={() => setAlertsOpen(false)}>
                      <X className="h-4 w-4 text-[#86868b]" />
                    </button>
                  </div>
                  {hasAlerts ? (
                    <ul className="max-h-64 overflow-y-auto py-1">
                      {contextualAlerts.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5"
                            onClick={() => {
                              setAlertsOpen(false);
                              onAlertNavigate?.(a.tab);
                            }}
                          >
                            <span
                              className={
                                'mt-1 h-2 w-2 shrink-0 rounded-full ' +
                                (a.tone === 'gold'
                                  ? 'bg-amber-300'
                                  : a.tone === 'warn'
                                    ? 'bg-orange-400'
                                    : 'bg-teal-300')
                              }
                            />
                            <span className="min-w-0">
                              <span className="block text-[13px] font-semibold text-[#f5f5f7]">
                                {a.title}
                              </span>
                              <span className="block text-[11px] text-[#86868b]">{a.body}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-[12px] text-[#86868b]">No new alerts</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {demoRoleSlot}

          {roleChip && (
            <div className="btn-pill btn-pill-gold btn-pill-sm !hidden !min-h-[36px] !px-3 !text-[12px] sm:!inline-flex">
              {roleChip}
            </div>
          )}

          {/* Avatar — opens account sheet on mobile; also useful on desktop */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="ml-0.5 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Account and parish"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-2 ring-amber-300/40"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-[12px] font-semibold text-amber-200 ring-2 ring-white/15">
                {avatarInitials}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

/** Lightweight mobile search sheet */
export const MobileSearchSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  results: React.ReactNode;
}> = ({ open, onClose, query, onQueryChange, results }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[60] lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#050a14]/50 backdrop-blur-sm"
          aria-label="Close search"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="absolute left-0 right-0 top-0 border-b border-white/10 bg-[#0a1628]/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center rounded-2xl border border-white/12 bg-white/[0.08] px-3">
              <Search className="h-4 w-4 text-[#86868b]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="w-full bg-transparent px-2.5 py-3 text-[15px] text-[#f5f5f7] outline-none placeholder:text-[#86868b]"
                placeholder="Search…"
                aria-label="Search"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#a1a1a6] hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 max-h-[60dvh] overflow-y-auto rounded-2xl bg-white text-slate-800 shadow-xl">
            {results}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
