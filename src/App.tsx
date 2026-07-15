import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  BarChart3, Bell, CalendarDays, Church, Command,
  HeartHandshake, LayoutDashboard, Menu, Music2, Search,
  Sparkles, Star, UserPlus, UsersRound, X, BookOpen, BookText,
} from 'lucide-react';
import { Announcement, ChoirEvent, Language, Mass, Member, MemberStatus, Payment, Rehearsal, AttendanceRecord, Role, Song, Tab, TenantScopedRecord } from './types';
import { RoleSelector } from './components/RoleSelector';
import { AuthPanel } from './components/AuthPanel';
import { AccessDenied } from './components/AccessDenied';
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS, MOCK_MASSES, MOCK_MEMBERS, MOCK_PAYMENTS, MOCK_REHEARSALS } from './data/mockData';
import { useSyncedCollection } from './hooks/useSyncedCollection';
import { useMembersWithPrivateData } from './hooks/useMembersWithPrivateData';
import { hasMinimumRole, useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useRoleGuard } from './hooks/useRoleGuard';
import { createRecordMetadata, DEFAULT_TENANT_CONTEXT, type TenantContext } from './services/recordMetadata';
import { ARCHDIOCESE_ID, activeParishes, findParishById } from './data/madrasMylaporeParishes';
import { pushTabPath, replaceTabPath, tabFromPath } from './routes/AppRoutes';
import { ToastProvider, useToast } from './components/feedback/ToastProvider';
import { PageTransition } from './components/interactions/PageTransition';
import { ParishProvider } from './features/parish/ParishContext';
import { ParishSidebarCard, ParishOnboardingModal } from './features/parish/ParishSelector';
import { useParish } from './features/parish/ParishContext';
import { apiFetch } from './services/apiClient';


const TAB_REQUIRED_ROLE: Record<Tab, Role> = {
  landing: 'public_user',
  calendar: 'public_user',
  bible: 'public_user',
  song_library: 'public_user',
  registration: 'public_user',
  catholic_hub: 'public_user',
  liturgical_planner: 'choir_member',
  dashboard_member: 'choir_member',
  masses: 'choir_member',
  ai_hub: 'choir_member',
  gamification: 'choir_member',
  analytics: 'choir_admin',
  rehearsals: 'choir_member',
};

// ─── Lazy Imports ─────────────────────────────────────────────────────────────
const RehearsalManager = React.lazy(() => import('./components/RehearsalManager').then((m) => ({ default: m.RehearsalManager })));

const LandingPage = React.lazy(() => import('./components/LandingPage').then((m) => ({ default: m.LandingPage })));
const MarketingLanding = React.lazy(() => import('./components/marketing/MarketingLanding').then((m) => ({ default: m.MarketingLanding })));
const MemberRegistration = React.lazy(() => import('./components/MemberRegistration').then((m) => ({ default: m.MemberRegistration })));
const DashboardMember = React.lazy(() => import('./components/DashboardMember').then((m) => ({ default: m.DashboardMember })));
const MassManagement = React.lazy(() => import('./components/MassManagement').then((m) => ({ default: m.MassManagement })));
const BibleViewer = React.lazy(() => import('./components/BibleViewer').then((m) => ({ default: m.BibleViewer })));
const SongLibraryWidget = React.lazy(() => import('./components/SongLibraryWidget').then((m) => ({ default: m.SongLibraryWidget })));
const AiToolsHub = React.lazy(() => import('./components/AiToolsHub').then((m) => ({ default: m.AiToolsHub })));
const UnifiedCalendar = React.lazy(() => import('./components/UnifiedCalendar').then((m) => ({ default: m.UnifiedCalendar })));
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));
const CatholicKnowledgeHub = React.lazy(() => import('./components/CatholicKnowledgeHub').then((m) => ({ default: m.CatholicKnowledgeHub })));
const LiturgicalPlanner = React.lazy(() => import('./components/LiturgicalPlanner').then((m) => ({ default: m.LiturgicalPlanner })));
const GamificationProfileView = React.lazy(() => import('./components/GamificationProfile').then((m) => ({ default: m.GamificationProfileView })));

// ─── Nav Config ──────────────────────────────────────────────────────────────
const navItems: { id: Tab; label: string; icon: React.ElementType; minRole: Role }[] = [
  { id: 'landing',             label: 'Overview',         icon: LayoutDashboard, minRole: 'public_user' },
  { id: 'calendar',            label: 'Calendar',         icon: CalendarDays,    minRole: 'public_user' },
  { id: 'masses',              label: 'Liturgy & Masses', icon: Church,          minRole: 'choir_member' },
  { id: 'bible',               label: 'Bible',            icon: BookText,        minRole: 'public_user' },
  { id: 'song_library',        label: 'Music Library',    icon: Music2,          minRole: 'public_user' },
  { id: 'registration',        label: 'People',           icon: UsersRound,      minRole: 'public_user' },
  { id: 'dashboard_member',    label: 'My Ministry',      icon: HeartHandshake,  minRole: 'choir_member' },
  { id: 'catholic_hub',        label: 'Catholic Hub',     icon: BookOpen,        minRole: 'public_user' },
  { id: 'liturgical_planner',  label: 'AI Mass Planner',  icon: Sparkles,        minRole: 'choir_member' },
  { id: 'gamification',        label: 'My Achievements',  icon: Star,            minRole: 'choir_member' },
  { id: 'analytics',           label: 'Insights',         icon: BarChart3,       minRole: 'choir_admin' },
  { id: 'rehearsals',          label: 'Rehearsals',       icon: Music2,          minRole: 'choir_member' },
];

const languages: { id: Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ta', label: 'Tamil' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'te', label: 'Telugu' },
  { id: 'hi', label: 'Hindi' },
];

const ModuleSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse rounded-3xl border border-[#18392f]/08 bg-white/70 p-6">
        <div className="h-4 w-1/3 rounded-full bg-[#18392f]/10" />
        <div className="mt-3 h-3 w-2/3 rounded-full bg-[#18392f]/[0.06]" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-[#18392f]/[0.06]" />
      </div>
    ))}
  </div>
);

const NoMemberProfile = () => (
  <div className="apple-empty apple-card font-apple">
    <UsersRound className="h-10 w-10 text-[#c7c7cc]" />
    <h3>No member profile yet</h3>
    <p>Create or approve a real choir member profile to unlock the member dashboard.</p>
  </div>
);

// Reads parish from context for breadcrumb — defined here to avoid prop drilling
const BreadcrumbParishLabel: React.FC = () => {
  const { selectedParish } = useParish();
  const name = selectedParish ? selectedParish.parishName : 'Archdiocese of Madras-Mylapore';
  return (
    <p className="apple-caption text-[#86868b]">
      {name} / Choir
    </p>
  );
};

// AppInner lives inside <ParishProvider> so useParish() works.
function AppInner() {
  const { selectedParish, archdioceseId, selectParish } = useParish();
  const authState = useFirebaseAuth();
  const showToast = useToast();

  const claimRole = (authState.claims.role ?? 'public_user') as Role;
  const isAdminViewer = hasMinimumRole(claimRole, 'choir_admin');

  // Seed parish from JWT only when nothing is selected yet (do not force admins
  // back to DEFAULT parish — that hid Pending applicants under other parishes).
  useEffect(() => {
    if (selectedParish) return;
    const claimedParishId = authState.claims.parishId;
    if (claimedParishId && findParishById(claimedParishId)) {
      selectParish(claimedParishId);
    }
  }, [authState.claims.parishId, selectedParish, selectParish]);

  // Admins: keep JWT parish claims aligned with the sidebar parish so Firestore
  // rules + Approval listeners both see that parish's Pending applications.
  useEffect(() => {
    if (!authState.user || authState.user.isAnonymous || !selectedParish || !isAdminViewer) return;
    if (authState.claims.parishId === selectedParish.id) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await apiFetch('/api/auth/set-parish', {
          method: 'POST',
          body: JSON.stringify({ parishId: selectedParish.id }),
        });
        if (!response.ok || cancelled) return;
        await authState.refreshToken();
      } catch {
        // Non-fatal: listener may still use selectedParish context below
      }
    })();
    return () => { cancelled = true; };
  }, [authState.user?.uid, authState.claims.parishId, selectedParish?.id, isAdminViewer]);

  // Firestore listeners MUST use JWT parish scope. Querying a different parishId
  // than the token causes "insufficient permissions" and Sync stuck on Connecting.
  // Admins switch parish via set-parish (above); once claims match, UI + query align.
  const tenantContext: TenantContext = React.useMemo(() => {
    if (authState.claims.parishId && authState.claims.tenantId && authState.claims.choirId) {
      const claimedParish = findParishById(authState.claims.parishId);
      return {
        archdioceseId: authState.claims.archdioceseId ?? claimedParish?.archdioceseId ?? archdioceseId ?? ARCHDIOCESE_ID,
        parishName: authState.claims.parishName ?? claimedParish?.displayName ?? authState.claims.parishId,
        tenantId: authState.claims.tenantId,
        parishId: authState.claims.parishId,
        choirId: authState.claims.choirId,
      };
    }
    if (selectedParish) {
      return {
        archdioceseId: selectedParish.archdioceseId,
        parishName: selectedParish.displayName,
        tenantId: archdioceseId ?? ARCHDIOCESE_ID,
        parishId: selectedParish.id,
        choirId: `${selectedParish.id}-choir`,
      };
    }
    return DEFAULT_TENANT_CONTEXT;
  }, [authState.claims, selectedParish, archdioceseId]);


  const [currentLang, setCurrentLang] = useState<Language>('en');
  // The URL is the source of truth for the active tab (deep links + back/forward).
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromPath(window.location.pathname));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>('choir_admin');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Song data (~1.4MB chunk) stays out of the main bundle: load it on demand
  // the first time the user actually types a global search query.
  const [searchableSongs, setSearchableSongs] = useState<Song[]>([]);
  const songsLoadStarted = useRef(false);
  useEffect(() => {
    if (globalSearchQuery.trim().length < 2 || songsLoadStarted.current) return;
    songsLoadStarted.current = true;
    import('./data/jebathotta-jeyageethangal')
      .then((mod) => setSearchableSongs(mod.JEBATHOTTA_JEYAGEETHANGAL_SONGS))
      .catch(() => { songsLoadStarted.current = false; });
  }, [globalSearchQuery]);

  // SECURITY: effectiveRole always from Firebase custom claims when configured.
  // demoRole only applies when Firebase is NOT configured (pure demo mode).
  const effectiveRole: Role = authState.isConfigured ? authState.effectiveRole : demoRole;
  const guard = useRoleGuard(effectiveRole);
  // Only real (non-anonymous) accounts get live Firestore sync. Anonymous
  // sessions are ignored if any leftover ones exist from older clients.
  const syncEnabled = Boolean(authState.user && !authState.user.isAnonymous);

  const { records: members, isLive: membersLive, syncError: membersSyncError, actions: memberSync } =
    useMembersWithPrivateData(MOCK_MEMBERS, syncEnabled, tenantContext);
  const { records: masses, actions: massSync } =
    useSyncedCollection<Mass>('masses', MOCK_MASSES, syncEnabled, tenantContext);
  const { records: payments, actions: paymentSync } =
    useSyncedCollection<Payment>('payments', MOCK_PAYMENTS, syncEnabled, tenantContext);
  const { records: events, actions: eventSync } =
    useSyncedCollection<ChoirEvent>('events', MOCK_EVENTS, syncEnabled, tenantContext);
  const { records: announcements } =
    useSyncedCollection<Announcement>('announcements', MOCK_ANNOUNCEMENTS, syncEnabled, tenantContext);
  const { records: rehearsals, actions: rehearsalSync } =
    useSyncedCollection<Rehearsal>('rehearsals', MOCK_REHEARSALS, syncEnabled, tenantContext);
  const { actions: attendanceSync } =
    useSyncedCollection<AttendanceRecord>('attendance', [], syncEnabled, tenantContext);

  useEffect(() => {
    if (!authState.user && TAB_REQUIRED_ROLE[activeTab] !== 'public_user') {
      setActiveTab('landing');
      replaceTabPath('landing');
    }
  }, [authState.user, activeTab]);

  // Browser back/forward: follow the URL without pushing new history entries.
  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    pushTabPath(tab);
    setMobileNavOpen(false);
    setMobileMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------------------------------------------------------------
  // GLOBAL SEARCH — searches members, songs, and masses already loaded in
  // memory. Was previously a decorative input with no logic behind it.
  // ---------------------------------------------------------------------
  type GlobalSearchResult = {
    key: string;
    category: 'People' | 'Songs' | 'Masses';
    title: string;
    subtitle: string;
    onSelect: () => void;
  };

  const globalSearchResults = useMemo<GlobalSearchResult[]>(() => {
    const query = globalSearchQuery.trim().toLowerCase();
    if (query.length < 2) return [];

    const memberResults: GlobalSearchResult[] = members
      .filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query)
        || (m.voiceType || '').toLowerCase().includes(query)
        || (m.choirName || '').toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map((m) => ({
        key: `member-${m.id}`,
        category: 'People' as const,
        title: `${m.firstName} ${m.lastName}`,
        subtitle: `${m.voiceType || 'Member'} · ${m.status}`,
        onSelect: () => navigate('registration'),
      }));

    const songResults: GlobalSearchResult[] = searchableSongs
      .filter((s) =>
        (s.displayTitle || s.title || '').toLowerCase().includes(query)
        || (s.lyrics || '').toLowerCase().includes(query)
        || (s.composer || '').toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map((s) => ({
        key: `song-${s.id}`,
        category: 'Songs' as const,
        title: s.displayTitle || s.title || 'Untitled Song',
        subtitle: `Page ${s.pageNumber ?? s.sourcePageNumber ?? '-'} · ${s.category}`,
        onSelect: () => navigate('song_library'),
      }));

    const massResults: GlobalSearchResult[] = masses
      .filter((m) =>
        (m.name || '').toLowerCase().includes(query)
        || (m.category || '').toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map((m) => ({
        key: `mass-${m.id}`,
        category: 'Masses' as const,
        title: m.name,
        subtitle: `${m.date} · ${m.time}`,
        onSelect: () => navigate('masses'),
      }));

    return [...memberResults, ...songResults, ...massResults].slice(0, 10);
  }, [globalSearchQuery, members, masses, searchableSongs]);

  useEffect(() => {
    if (!isSearchResultsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchResultsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchResultsOpen]);

  const handleSelectSearchResult = (result: GlobalSearchResult) => {
    result.onSelect();
    setGlobalSearchQuery('');
    setIsSearchResultsOpen(false);
  };

  const handleDemoRoleChange = (role: Role) => {
    setDemoRole(role);
    navigate(role === 'choir_member' ? 'dashboard_member' : role === 'public_user' ? 'registration' : 'landing');
  };

  const handleUpdateMemberStatus = (memberId: string, status: MemberStatus, note?: string) => {
    if (!guard.isAdmin) return;
    const previousStatus = members.find((m) => m.id === memberId)?.status;
    void (async () => {
      try {
        const response = await apiFetch(`/api/members/${encodeURIComponent(memberId)}/status`, {
          method: 'POST',
          body: JSON.stringify({ status, note: note ?? '' }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          showToast({ tone: 'error', message: payload?.error ?? 'Could not update member status.' });
          return;
        }
        showToast({
          message: status === 'Active Member'
            ? 'Member approved — they can now sign in with email/mobile and DOB (DDMMYYYY).'
            : `Member status set to ${status}.`,
          onUndo: previousStatus && previousStatus !== status
            ? () => void handleUpdateMemberStatus(memberId, previousStatus)
            : undefined,
        });
      } catch {
        showToast({ tone: 'error', message: 'Could not update member status.' });
      }
    })();
  };

  const currentMember = members.find((m) => m.id === authState.user?.uid);

  const activeLabel = navItems.find((item) => item.id === activeTab)?.label ?? 'Overview';
  const pendingCount = members.filter((m) => m.status === 'Pending').length;

  return (
    <>
    <ParishOnboardingModal />
    <div className="apple-skin choir-paper-bg font-apple min-h-[100dvh] overflow-x-hidden text-[#1d1d1f]">
      {/* HEADER — Apple liquid-glass bar */}
      <header className="app-header glass-panel-dark sticky top-0 z-50 border-b border-white/10 text-[#f5f5f7]">
        <div className="app-header-inner mx-auto flex max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="min-h-[44px] min-w-[44px] rounded-full p-2 transition hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button onClick={() => navigate('landing')} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300 text-[#0f2b22]">
              <Music2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-semibold leading-none tracking-[-0.02em]">Choir360</p>
              <p className="mt-0.5 hidden text-[10px] font-normal text-[#a1a1a6] sm:block">Catholic Music Ecosystem</p>
            </div>
          </button>

          <div ref={searchContainerRef} className="relative ml-auto hidden max-w-md flex-1 lg:block">
            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3.5 transition focus-within:border-white/25 focus-within:bg-white/12">
              <Search className="h-3.5 w-3.5 text-[#86868b]" />
              <input
                value={globalSearchQuery}
                onChange={(e) => { setGlobalSearchQuery(e.target.value); setIsSearchResultsOpen(true); }}
                onFocus={() => setIsSearchResultsOpen(true)}
                className="w-full bg-transparent px-2.5 py-2 text-[13px] outline-none placeholder:text-[#86868b]"
                placeholder="Search"
                aria-label="Global search"
              />
              <Command className="h-3 w-3 text-[#636366]" />
            </div>

            {isSearchResultsOpen && globalSearchQuery.trim().length >= 2 && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                {globalSearchResults.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-500">No matches for "{globalSearchQuery}".</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {globalSearchResults.map((result) => (
                      <li key={result.key}>
                        <button
                          type="button"
                          onClick={() => handleSelectSearchResult(result)}
                          className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="flex w-full items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold text-slate-900">{result.title}</span>
                            <span className="apple-badge-forest shrink-0">
                              {result.category}
                            </span>
                          </span>
                          <span className="truncate text-xs text-slate-500">{result.subtitle}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <div className="hidden items-center rounded-full bg-white/[0.08] p-0.5 md:flex">
              {languages.map((language) => (
                <button key={language.id} onClick={() => setCurrentLang(language.id)}
                  className={"rounded-full px-2.5 py-1 text-[11px] font-medium transition " + (currentLang === language.id ? 'bg-white text-[#1d1d1f]' : 'text-[#a1a1a6] hover:text-white')}>
                  {language.label}
                </button>
              ))}
            </div>
            <button className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition hover:bg-white/10" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-amber-300" />
            </button>
            {!authState.isConfigured && (
              <RoleSelector currentRole={demoRole} setRole={handleDemoRoleChange} />
            )}
            {authState.isConfigured && authState.user && (
              <div className="btn-pill btn-pill-gold btn-pill-sm !min-h-[36px] !px-3 !text-[12px]">
                {effectiveRole.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-[#0f2b22]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="mx-auto flex max-w-[1600px]">
        {/* SIDEBAR */}
        <aside className={(mobileNavOpen ? 'fixed inset-x-0 z-40 flex' : 'hidden') + ' w-64 flex-col border-r border-black/5 bg-white/80 p-3 shadow-[8px_0_32px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:sticky lg:top-[var(--app-header-offset)] lg:flex'}
          style={mobileNavOpen ? {
            top: 'var(--app-header-offset)',
            bottom: 'var(--bottom-chrome)',
            maxHeight: 'calc(100dvh - var(--app-header-offset) - var(--bottom-chrome))',
          } : undefined}
        >
          <ParishSidebarCard
            songCount={0}
            syncStatus={
              <>
                Sync:{' '}
                <span className={membersLive ? 'text-emerald-700' : syncEnabled ? 'text-amber-700' : 'text-slate-400'}>
                  {membersLive
                    ? 'Firebase live'
                    : syncEnabled
                    ? 'Connecting…'
                    : authState.user?.isAnonymous
                    ? 'Guest mode'
                    : 'Sign in required'}
                </span>
                {membersSyncError && (
                  <span className="block truncate text-rose-600" title={membersSyncError}>
                    {membersSyncError.includes('insufficient permissions')
                      ? 'Sync blocked by security rules — redeploy firestore rules or sign out/in'
                      : membersSyncError}
                  </span>
                )}
              </>
            }
          />

          <div className="mt-4">
            <AuthPanel
              user={authState.user}
              isConfigured={authState.isConfigured}
              authError={authState.authError}
              effectiveRole={authState.effectiveRole}
              onSignIn={authState.signIn}
              onLogout={authState.logout}
              onRefreshToken={authState.refreshToken}
              onOpenRegistration={() => navigate('registration')}
            />
          </div>

          <nav className="mt-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {navItems
              .filter((item) => !authState.isConfigured || guard.canAccess(item.minRole) || item.minRole === 'public_user')
              .map((item) => {
                const accessible = guard.canAccess(item.minRole);
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => { if (accessible) { navigate(item.id); setMobileNavOpen(false); } }} disabled={!accessible}
                    aria-current={isActive ? 'page' : undefined}
                    className={'relative flex min-h-[44px] w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-[15px] font-medium tracking-[-0.01em] transition ' +
                      (isActive ? 'text-white' : accessible ? 'text-[#1d1d1f] hover:bg-black/[0.04]' : 'cursor-not-allowed text-[#d2d2d7]')}>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-full bg-[#18392f]"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                    <item.icon className={'relative h-4 w-4 ' + (isActive ? 'text-amber-300' : accessible ? 'text-[#86868b]' : 'text-[#d2d2d7]')} />
                    <span className="relative">{item.label}</span>
                    {item.id === 'registration' && pendingCount > 0 && (
                      <span className="relative ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">{pendingCount}</span>
                    )}
                    {!accessible && authState.isConfigured && (
                      <span className="relative ml-auto text-[9px] text-slate-300">[locked]</span>
                    )}
                  </button>
                );
              })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!(activeTab === 'landing' && !authState.user) && (
            <div className="mb-7 flex items-center justify-between">
              <div>
                <BreadcrumbParishLabel />
                <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.025em] text-[#1d1d1f]">{activeLabel}</h1>
              </div>
              {guard.isAdmin && (
                <button onClick={() => navigate('registration')}
                  className="btn-pill btn-pill-primary hidden !text-[13px] sm:inline-flex">
                  <UserPlus className="h-3.5 w-3.5 text-amber-300" /> Add member
                </button>
              )}
            </div>
          )}

          <PageTransition pageKey={activeTab}>
          <Suspense fallback={<ModuleSkeleton />}>
            {/* Signed-out visitors get the marketing page; members get the ops dashboard. */}
            {activeTab === 'landing' && (
              authState.user ? (
                <LandingPage currentLang={currentLang} members={members} masses={masses} payments={payments}
                  events={events} announcements={announcements}
                  onNavigate={navigate} />
              ) : (
                <MarketingLanding onNavigate={navigate} parishName={selectedParish?.parishName} />
              )
            )}
            {activeTab === 'calendar' && (
              <UnifiedCalendar currentLang={currentLang} masses={masses} events={events}
                onAddEvent={(event) => {
                  if (!guard.isAdmin) return;
                  void eventSync.upsert({ ...event, ...createRecordMetadata(authState.user?.uid ?? 'admin', 'active', tenantContext) }, authState.user?.uid);
                }} />
            )}
            {activeTab === 'masses' && (
              guard.canAccess('choir_member') ? (
                <MassManagement currentLang={currentLang} masses={masses} payments={payments} members={members}
                  isAdmin={guard.isAdmin}
                  onAddMass={(mass) => {
                    if (!guard.isAdmin) {
                      return Promise.resolve({ ok: false, error: 'Admin access required.' });
                    }
                    return massSync.upsert({ ...mass, ...createRecordMetadata(authState.user?.uid ?? 'admin', 'active', tenantContext) }, authState.user?.uid);
                  }}
                  onUpdateMass={(mass) => {
                    if (!guard.isAdmin) {
                      return Promise.resolve({ ok: false, error: 'Admin access required.' });
                    }
                    return massSync.patch(mass.id, mass as any, authState.user?.uid);
                  }}
                  onDeleteMass={(massId) => {
                    if (!guard.isAdmin) return;
                    const previousStatus = (masses.find((m) => m.id === massId) as Partial<TenantScopedRecord> | undefined)?.status ?? 'active';
                    void massSync.patch(massId, { status: 'deleted' } as any, authState.user?.uid).then((result) => {
                      if (!result.ok) {
                        showToast({ tone: 'error', message: result.error ?? 'Could not delete the mass.' });
                      } else {
                        showToast({
                          message: 'Mass deleted.',
                          onUndo: () => void massSync.patch(massId, { status: previousStatus } as any, authState.user?.uid),
                        });
                      }
                    });
                  }}
                  onAddPayment={(payment) => {
                    if (!guard.isAdmin) {
                      return Promise.resolve({ ok: false, error: 'Admin access required.' });
                    }
                    return paymentSync.upsert({ ...payment, ...createRecordMetadata(authState.user?.uid ?? 'admin', payment.status, tenantContext) }, authState.user?.uid);
                  }}
                  onUpdatePayment={(id, receivedAmount, status) => {
                    if (!guard.isAdmin) return;
                    const payment = payments.find((item) => item.id === id);
                    void paymentSync.patch(id, { receivedAmount, pendingAmount: Math.max((payment?.promisedAmount ?? 0) - receivedAmount, 0), status }, authState.user?.uid);
                  }} />
              ) : <AccessDenied requiredRole="choir_member" />
            )}
            {activeTab === 'registration' && (
              <MemberRegistration currentLang={currentLang} currentUserRole={effectiveRole} members={members}
                parishId={tenantContext.parishId}
                parishName={tenantContext.parishName}
                onPersistMember={async (member) => {
                  // Prefer the parish chosen on the form (display name → id).
                  const formParish = activeParishes().find((p) => p.displayName === member.parish)
                    ?? findParishById(tenantContext.parishId);
                  const context: TenantContext = formParish
                    ? {
                        archdioceseId: formParish.archdioceseId,
                        parishName: formParish.displayName,
                        tenantId: formParish.archdioceseId,
                        parishId: formParish.id,
                        choirId: `${formParish.id}-choir`,
                      }
                    : tenantContext;
                  return memberSync.upsert(
                    {
                      ...member,
                      parish: context.parishName,
                      ...createRecordMetadata(member.id, 'Pending', context),
                    },
                    member.id,
                  );
                }}
                onUpdateMemberStatus={handleUpdateMemberStatus} />
            )}
            {activeTab === 'dashboard_member' && (
              guard.canAccess('choir_member') ? (
                currentMember ? (
                  <DashboardMember currentLang={currentLang} memberId={authState.user?.uid ?? currentMember.id}
                    members={members} events={events} masses={masses}
                    onUpdateMemberDetails={(updated) => void memberSync.upsert({ ...updated, ...createRecordMetadata(authState.user?.uid ?? updated.id, updated.status, tenantContext) }, authState.user?.uid)}
                    onUpdateEventRsvp={(eventId, memberId, status) => {
                      const event = events.find((item) => item.id === eventId);
                      if (event) void eventSync.patch(eventId, { rsvps: { ...event.rsvps, [memberId]: status } }, authState.user?.uid);
                    }} />
                ) : <NoMemberProfile />
              ) : <AccessDenied requiredRole="choir_member" />
            )}
            {activeTab === 'song_library' && <SongLibraryWidget currentLang={currentLang} />}
            {activeTab === 'bible' && <BibleViewer />}
            {activeTab === 'ai_hub' && (
              guard.canAccess('choir_member') ? (
                <AiToolsHub currentLang={currentLang} members={members} masses={masses} />
              ) : <AccessDenied requiredRole="choir_member" />
            )}
            {activeTab === 'analytics' && (
              guard.canAccess('choir_admin') ? (
                <AnalyticsDashboard currentLang={currentLang} members={members} masses={masses} payments={payments} />
              ) : <AccessDenied requiredRole="choir_admin" />
            )}
            {activeTab === 'catholic_hub' && <CatholicKnowledgeHub />}
            {activeTab === 'liturgical_planner' && (
              guard.canAccess('choir_member') ? (
                <LiturgicalPlanner />
              ) : <AccessDenied requiredRole="choir_member" />
            )}
            {activeTab === 'rehearsals' && (
              guard.canAccess('choir_member') ? (
                <RehearsalManager
                  rehearsals={rehearsals}
                  members={members}
                  isAdmin={guard.isAdmin}
                  onAddRehearsal={(r) => void rehearsalSync.upsert({ ...r, ...createRecordMetadata(authState.user?.uid ?? 'admin', r.status, tenantContext) }, authState.user?.uid)}
                  onUpdateRehearsal={(r) => void rehearsalSync.upsert({ ...r, ...createRecordMetadata(authState.user?.uid ?? 'admin', r.status, tenantContext) }, authState.user?.uid)}
                  onMarkAttendance={(rec: AttendanceRecord) => {
                    if (!guard.isAdmin) return;
                    void attendanceSync.upsert(
                      { ...rec, ...createRecordMetadata(authState.user?.uid ?? 'admin', rec.status, tenantContext) },
                      authState.user?.uid,
                    );
                  }}
                />
              ) : <AccessDenied requiredRole="choir_member" />
            )}
            {activeTab === 'gamification' && (
              guard.canAccess('choir_member') ? (
                currentMember ? (
                  <GamificationProfileView member={currentMember} allMembers={members} />
                ) : <ModuleSkeleton />
              ) : <AccessDenied requiredRole="choir_member" />
            )}
          </Suspense>
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav — 5 primary tabs + More drawer */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden" onClick={() => setMobileMoreOpen(false)}>
          <div className="absolute inset-0 bg-[#0f2b22]/35 backdrop-blur-sm" />
          <div
            className="app-more-sheet absolute left-0 right-0 rounded-t-2xl border-t border-black/5 bg-white/95 shadow-xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2">
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">More</span>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.04]"
                aria-label="Close more menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-3 pb-4">
              {([
                { id: 'bible' as Tab,             Icon: BookText,       label: 'Bible' },
                { id: 'catholic_hub' as Tab,       Icon: BookOpen,       label: 'Catholic' },
                { id: 'rehearsals' as Tab,         Icon: Sparkles,       label: 'Rehearsals' },
                { id: 'dashboard_member' as Tab,   Icon: HeartHandshake, label: 'Ministry' },
                { id: 'liturgical_planner' as Tab, Icon: Sparkles,       label: 'Planner' },
                { id: 'gamification' as Tab,       Icon: Star,           label: 'Achievements' },
                { id: 'ai_hub' as Tab,             Icon: Command,        label: 'AI Hub' },
                { id: 'analytics' as Tab,          Icon: BarChart3,      label: 'Insights' },
              ] as { id: Tab; Icon: React.ElementType; label: string }[])
                .filter(({ id }) => guard.canAccess(TAB_REQUIRED_ROLE[id]))
                .map(({ id, Icon, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button key={id} onClick={() => { navigate(id); setMobileMoreOpen(false); }}
                      className={'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl p-3 ' + (isActive ? 'bg-[#18392f]/10' : 'hover:bg-black/[0.03]')}>
                      <Icon className={'h-5 w-5 ' + (isActive ? 'text-[#18392f]' : 'text-[#86868b]')} />
                      <span className={'text-center text-[11px] font-medium leading-tight ' + (isActive ? 'text-[#18392f]' : 'text-[#86868b]')}>{label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      <nav className="app-bottom-nav glass-panel fixed bottom-0 left-0 right-0 z-50 flex border-t border-black/5 lg:hidden">
        {([
          { id: 'landing' as Tab,      Icon: LayoutDashboard, label: 'Home' },
          { id: 'calendar' as Tab,     Icon: CalendarDays,    label: 'Calendar' },
          { id: 'masses' as Tab,       Icon: Church,          label: 'Masses' },
          { id: 'song_library' as Tab, Icon: Music2,          label: 'Songs' },
          { id: 'registration' as Tab, Icon: UsersRound,      label: 'People' },
        ] as { id: Tab; Icon: React.ElementType; label: string }[])
          .filter(({ id }) => guard.canAccess(TAB_REQUIRED_ROLE[id]))
          .map(({ id, Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button key={id} onClick={() => navigate(id)}
                className="relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
                aria-current={isActive ? 'page' : undefined}>
                {isActive && (
                  <motion.span
                    layoutId="bottomnav-active-bar"
                    className="absolute top-0 h-[2px] w-8 rounded-full bg-[#18392f]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className={'h-5 w-5 ' + (isActive ? 'text-[#18392f]' : 'text-[#86868b]')} />
                <span className={'text-[11px] font-medium ' + (isActive ? 'text-[#18392f]' : 'text-[#86868b]')}>{label}</span>
              </button>
            );
          })}
        <button onClick={() => setMobileMoreOpen((o) => !o)}
          className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2.5">
          <Menu className={'h-5 w-5 ' + (mobileMoreOpen ? 'text-[#18392f]' : 'text-[#86868b]')} />
          <span className={'text-[11px] font-medium ' + (mobileMoreOpen ? 'text-[#18392f]' : 'text-[#86868b]')}>More</span>
        </button>
      </nav>
      <div className="app-bottom-spacer lg:hidden" aria-hidden="true" />
    </div>
    </>
  );
}

// =============================================================================
// App — root export. Wraps AppInner in ParishProvider so useParish() works.
// =============================================================================
export default function App() {
  return (
    // reducedMotion="user" disables transform/layout animations app-wide for
    // users with prefers-reduced-motion enabled.
    <MotionConfig reducedMotion="user">
      <ParishProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </ParishProvider>
    </MotionConfig>
  );
}
