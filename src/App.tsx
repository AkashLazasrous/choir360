import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { UserPlus, UsersRound } from 'lucide-react';
import { Announcement, ChoirEvent, Language, Mass, Member, MemberStatus, Payment, Rehearsal, AttendanceRecord, Role, Song, Tab, TenantScopedRecord } from './types';
import { RoleSelector } from './components/RoleSelector';
import { AccessDenied } from './components/AccessDenied';
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS, MOCK_MASSES, MOCK_MEMBERS, MOCK_PAYMENTS, MOCK_REHEARSALS } from './data/mockData';
import { useSyncedCollection } from './hooks/useSyncedCollection';
import { useMembersWithPrivateData } from './hooks/useMembersWithPrivateData';
import { hasMinimumRole, useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useRoleGuard } from './hooks/useRoleGuard';
import { createRecordMetadata, DEFAULT_TENANT_CONTEXT, updateRecordMetadata, type TenantContext } from './services/recordMetadata';
import {
  applyDocumentLanguage,
  loadStoredLanguage,
  NAV_LABEL_KEYS,
  storeLanguage,
  t,
} from './i18n/ui';
import { dedupeImportSessions } from './utils/attendanceActivity';
import type { ActivityAttendanceImportPayload, ActivityAttendanceSavePayload } from './features/attendance/ActivityAttendance';
import { ARCHDIOCESE_ID, activeParishes, findParishById } from './data/madrasMylaporeParishes';
import { pushTabPath, replaceTabPath, tabFromPath } from './routes/AppRoutes';
import { ToastProvider, useToast } from './components/feedback/ToastProvider';
import { PageTransition } from './components/interactions/PageTransition';
import { ParishProvider } from './features/parish/ParishContext';
import { ParishOnboardingModal } from './features/parish/ParishSelector';
import { useParish } from './features/parish/ParishContext';
import { apiFetch } from './services/apiClient';
import { TAB_REQUIRED_ROLE } from './components/shell/navConfig';
import { AppHeader, MobileSearchSheet } from './components/shell/AppHeader';
import { AppSidebar } from './components/shell/AppSidebar';
import { AppBottomNav } from './components/shell/AppBottomNav';
import { AppAccountSheet } from './components/shell/AppAccountSheet';
import { buildContextualAlerts } from './components/mobileDashboard/dashboardMetrics';
import { WebsitePageShell } from './components/website/WebsitePageShell';
import { WEBSITE_PAGE_META } from './components/website/pageMeta';
import { useDesktopAppScroll } from './features/website/motion/desktopMotion';

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
const ActivityAttendance = React.lazy(() => import('./features/attendance/ActivityAttendance').then((m) => ({ default: m.ActivityAttendance })));

const ModuleSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse rounded-3xl border border-[#0e3d4c]/08 bg-white/70 p-6">
        <div className="h-4 w-1/3 rounded-full bg-[#0e3d4c]/10" />
        <div className="mt-3 h-3 w-2/3 rounded-full bg-[#0e3d4c]/[0.06]" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-[#0e3d4c]/[0.06]" />
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

  /* One Lenis instance for all desktop routes (marketing + ops). */
  useDesktopAppScroll(true);

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


  const [currentLang, setCurrentLang] = useState<Language>(() => loadStoredLanguage());

  useEffect(() => {
    applyDocumentLanguage(currentLang);
    storeLanguage(currentLang);
  }, [currentLang]);
  // The URL is the source of truth for the active tab (deep links + back/forward).
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromPath(window.location.pathname));
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    useMembersWithPrivateData(MOCK_MEMBERS, syncEnabled, tenantContext, {
      viewerUid: authState.user?.uid ?? null,
      // Parish-wide privateMembers queries are admin-only (rules: own doc or adminRole).
      canReadParishPrivate: guard.isAdmin,
    });
  const { records: masses, actions: massSync } =
    useSyncedCollection<Mass>('masses', MOCK_MASSES, syncEnabled, tenantContext, 1000);
  const { records: payments, actions: paymentSync } =
    useSyncedCollection<Payment>('payments', MOCK_PAYMENTS, syncEnabled, tenantContext);
  const { records: events, actions: eventSync } =
    useSyncedCollection<ChoirEvent>('events', MOCK_EVENTS, syncEnabled, tenantContext);
  const { records: announcements } =
    useSyncedCollection<Announcement>('announcements', MOCK_ANNOUNCEMENTS, syncEnabled, tenantContext);
  const { records: rehearsals, actions: rehearsalSync } =
    useSyncedCollection<Rehearsal>('rehearsals', MOCK_REHEARSALS, syncEnabled, tenantContext, 1000);
  const { records: attendanceRecords, actions: attendanceSync } =
    useSyncedCollection<AttendanceRecord>('attendance', [], syncEnabled, tenantContext, 8000);

  // Wait for Firebase session restore before kicking unsigned users off
  // protected deep links (otherwise a hard refresh on /attendance etc. races
  // auth and bounces to Overview).
  useEffect(() => {
    if (!authState.isReady) return;
    if (!authState.user && TAB_REQUIRED_ROLE[activeTab] !== 'public_user') {
      setActiveTab('landing');
      replaceTabPath('landing');
    }
  }, [authState.isReady, authState.user, activeTab]);

  // Browser back/forward: follow the URL without pushing new history entries.
  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const mainScrollRef = useRef<HTMLElement | null>(null);

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    pushTabPath(tab);
    setMobileMoreOpen(false);
    setAccountSheetOpen(false);
    setMobileSearchOpen(false);
    setIsSearchResultsOpen(false);
    // Desktop shell scrolls inside <main>; mobile/tablet still use the window.
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Attendance writes go through Admin SDK APIs. Client upserts rewrite
  // immutable createdAt/createdBy/tenant fields and Firestore rules deny them
  // ("Missing or insufficient permissions") — same pattern as member profile edit.
  const persistActivitySession = async (
    payload: ActivityAttendanceSavePayload,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!guard.isAdmin) return { ok: false, error: 'Admin access required.' };
    try {
      const response = await apiFetch('/api/attendance/session', {
        method: 'POST',
        body: JSON.stringify({
          session: payload,
          parishId: tenantContext.parishId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: data?.error ?? 'Save failed.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Save failed.' };
    }
  };

  const importActivitySessions = async (
    payload: ActivityAttendanceImportPayload,
  ): Promise<{
    ok: boolean;
    error?: string;
    imported?: number;
    skipped?: number;
    sessionsWritten?: number;
    attendanceWritten?: number;
    marksInserted?: number;
    marksUpdated?: number;
    duplicatesRemoved?: number;
    emptySkipped?: number;
    unmatchedNames?: string[];
    parishId?: string;
  }> => {
    if (!guard.isAdmin) return { ok: false, error: 'Admin access required.' };
    const sessions = dedupeImportSessions(payload.sessions);
    if (sessions.length === 0) {
      return { ok: false, error: 'No sessions to import (all CSV names unmatched?).', imported: 0, skipped: 0 };
    }
    try {
      const response = await apiFetch('/api/attendance/import', {
        method: 'POST',
        body: JSON.stringify({
          sessions,
          parishId: tenantContext.parishId,
          unmatchedNames: payload.unmatchedNames ?? [],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: data?.error ?? 'Import failed.', imported: 0, skipped: 0 };
      }
      const attendanceWritten = typeof data.attendanceWritten === 'number'
        ? data.attendanceWritten
        : typeof data.writtenRecords === 'number' ? data.writtenRecords : 0;
      const imported = typeof data.imported === 'number' ? data.imported : 0;
      const skipped = typeof data.skipped === 'number' ? data.skipped : 0;
      const ok = data.ok !== false && (attendanceWritten > 0 || skipped > 0);
      return {
        ok,
        error: ok ? undefined : (data?.error ?? 'Import wrote 0 attendance records.'),
        imported,
        skipped,
        sessionsWritten: typeof data.sessionsWritten === 'number' ? data.sessionsWritten : imported,
        attendanceWritten,
        marksInserted: typeof data.marksInserted === 'number' ? data.marksInserted : undefined,
        marksUpdated: typeof data.marksUpdated === 'number' ? data.marksUpdated : undefined,
        duplicatesRemoved: typeof data.duplicatesRemoved === 'number' ? data.duplicatesRemoved : undefined,
        emptySkipped: typeof data.emptySkipped === 'number' ? data.emptySkipped : 0,
        unmatchedNames: Array.isArray(data.unmatchedNames) ? data.unmatchedNames : payload.unmatchedNames,
        parishId: typeof data.parishId === 'string' ? data.parishId : tenantContext.parishId,
      };
    } catch {
      return { ok: false, error: 'Import failed.' };
    }
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

  const handleEditMember = async (updated: Member): Promise<{ ok: boolean; error?: string }> => {
    if (!guard.isAdmin) return { ok: false, error: 'Admin access required.' };
    // Admin Desk edits go through the API (Admin SDK). Client Firestore upserts
    // were denied because createRecordMetadata rewrote immutable audit/tenant fields.
    try {
      const response = await apiFetch(`/api/members/${encodeURIComponent(updated.id)}/profile`, {
        method: 'POST',
        body: JSON.stringify({
          firstName: updated.firstName,
          lastName: updated.lastName,
          gender: updated.gender,
          dob: updated.dob,
          mobile: updated.mobile,
          whatsapp: updated.whatsapp,
          email: updated.email,
          address: updated.address,
          bloodGroup: updated.bloodGroup || '',
          relationshipStatus: updated.relationshipStatus || '',
          memberType: updated.memberType,
          voiceType: updated.voiceType,
          experience: updated.experience,
          skills: updated.skills,
          photoUrl: updated.photoUrl || '',
          emergencyContact: updated.emergencyContact,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = payload?.error ?? 'Could not save profile.';
        showToast({ tone: 'error', message: msg });
        return { ok: false, error: msg };
      }

      // Keep local roster in sync immediately. Also write public fields (incl.
      // photoUrl) via client SDK so photos persist even if Render's API build
      // predates the photoUrl profile patch.
      const savedPhotoUrl =
        (typeof payload?.photoUrl === 'string' && payload.photoUrl.trim())
          || updated.photoUrl
          || '';
      const publicFields: Partial<Member> & { updatedAt: string } = {
        firstName: updated.firstName,
        lastName: updated.lastName,
        gender: updated.gender,
        relationshipStatus: updated.relationshipStatus || '',
        memberType: updated.memberType,
        voiceType: updated.voiceType,
        skills: updated.skills,
        experience: updated.experience,
        photoUrl: savedPhotoUrl,
        updatedAt: new Date().toISOString(),
      };
      memberSync.applyLocal(updated.id, publicFields);
      const clientWrite = await memberSync.patch(updated.id, publicFields, authState.user?.uid);
      if (!clientWrite.ok) {
        // patch() rolls back optimistic state on failure — restore card UI.
        memberSync.applyLocal(updated.id, publicFields);
      }

      showToast({ message: `Profile updated for ${updated.firstName} ${updated.lastName}.` });
      return { ok: true };
    } catch {
      showToast({ tone: 'error', message: 'Could not save profile.' });
      return { ok: false, error: 'Could not save profile.' };
    }
  };

  const handleRemoveMember = async (member: Member): Promise<{ ok: boolean; error?: string }> => {
    if (!guard.isAdmin) return { ok: false, error: 'Admin access required.' };
    try {
      const response = await apiFetch(`/api/members/${encodeURIComponent(member.id)}/remove`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = payload?.error ?? 'Could not remove member.';
        showToast({ tone: 'error', message: msg });
        return { ok: false, error: msg };
      }
      showToast({ message: `${member.firstName} ${member.lastName} removed from the roster.` });
      return { ok: true };
    } catch {
      const msg = 'Could not remove member.';
      showToast({ tone: 'error', message: msg });
      return { ok: false, error: msg };
    }
  };

  const currentMember = members.find((m) => m.id === authState.user?.uid);

  const navLabel = (id: Tab) => t(currentLang, NAV_LABEL_KEYS[id] ?? 'navOverview');
  const activeLabel = navLabel(activeTab);
  const pendingCount = members.filter((m) => m.status === 'Pending').length;
  const showPageChrome = !(activeTab === 'landing' && !authState.user);
  const websiteMode = activeTab === 'landing' && !authState.user;
  /** Deep Sea website chrome for every non-marketing desktop route */
  const websiteApp = !websiteMode;
  const pageMeta = WEBSITE_PAGE_META[activeTab];
  const pageShellActions =
    websiteApp && guard.isAdmin ? (
      <button
        type="button"
        onClick={() => navigate('registration')}
        className="btn-pill btn-pill-primary !text-[13px]"
      >
        <UserPlus className="h-3.5 w-3.5" /> Add member
      </button>
    ) : null;
  const avatarInitials = currentMember
    ? `${currentMember.firstName?.[0] ?? ''}${currentMember.lastName?.[0] ?? ''}`.toUpperCase() || 'C'
    : (authState.user?.displayName?.[0] ?? authState.user?.email?.[0] ?? 'C').toUpperCase();

  const headerAlerts = useMemo(
    () =>
      authState.user
        ? buildContextualAlerts({
            members,
            masses,
            payments,
            variant: guard.isAdmin ? 'admin' : 'member',
            member: currentMember ?? null,
          })
        : [],
    [authState.user, members, masses, payments, guard.isAdmin, currentMember],
  );

  const syncStatusNode = (
    <>
      Sync:{' '}
      <span className={membersLive ? 'text-emerald-700' : syncEnabled ? 'text-amber-700' : 'text-slate-400'}>
        {membersLive
          ? t(currentLang, 'syncLive')
          : syncEnabled
          ? t(currentLang, 'syncConnecting')
          : t(currentLang, 'syncSignIn')}
      </span>
      {membersSyncError && (
        <span className="block truncate text-rose-600" title={membersSyncError}>
          {membersSyncError}
        </span>
      )}
    </>
  );

  const searchResultsList = (
    <>
      {globalSearchQuery.trim().length < 2 ? (
        <p className="px-4 py-4 text-sm text-slate-500">Type at least 2 characters…</p>
      ) : globalSearchResults.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500">No matches for &ldquo;{globalSearchQuery}&rdquo;.</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {globalSearchResults.map((result) => (
            <li key={result.key}>
              <button
                type="button"
                onClick={() => {
                  handleSelectSearchResult(result);
                  setMobileSearchOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-slate-900">{result.title}</span>
                  <span className="apple-badge-forest shrink-0">{result.category}</span>
                </span>
                <span className="truncate text-xs text-slate-500">{result.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <>
    <ParishOnboardingModal />
    <div
      className={
        'app-shell apple-skin choir-paper-bg font-apple min-h-[100dvh] overflow-x-hidden text-[#1d1d1f]' +
        (websiteMode ? ' is-website-mode' : '') +
        (websiteApp ? ' is-website-app' : '')
      }
    >
      <AppHeader
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        onNavigateHome={() => navigate('landing')}
        onOpenAccount={() => setAccountSheetOpen(true)}
        onOpenSearch={() => {
          setMobileSearchOpen(true);
          setIsSearchResultsOpen(true);
        }}
        searchQuery={globalSearchQuery}
        onSearchQueryChange={(q) => {
          setGlobalSearchQuery(q);
          setIsSearchResultsOpen(true);
        }}
        searchContainerRef={searchContainerRef}
        avatarUrl={currentMember?.photoUrl || authState.user?.photoURL || null}
        avatarInitials={avatarInitials}
        contextualAlerts={headerAlerts}
        onAlertNavigate={navigate}
        notificationDot={headerAlerts.length === 0 && pendingCount > 0}
        roleChip={authState.isConfigured && authState.user ? effectiveRole.replace('_', ' ') : null}
        websiteMode={websiteMode}
        demoRoleSlot={
          !authState.isConfigured ? (
            <RoleSelector currentRole={demoRole} setRole={handleDemoRoleChange} />
          ) : null
        }
        searchResultsSlot={
          isSearchResultsOpen && globalSearchQuery.trim().length >= 2 ? (
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden border border-white/10 bg-[#050a14] text-[#f5f5f7] shadow-2xl">
              {searchResultsList}
            </div>
          ) : null
        }
      />

      <MobileSearchSheet
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        query={globalSearchQuery}
        onQueryChange={(q) => {
          setGlobalSearchQuery(q);
          setIsSearchResultsOpen(true);
        }}
        results={searchResultsList}
      />

      <AppAccountSheet
        open={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        lang={currentLang}
        changeParishLabel={t(currentLang, 'changeParish')}
        syncStatus={syncStatusNode}
        user={authState.user}
        isConfigured={authState.isConfigured}
        authError={authState.authError}
        effectiveRole={authState.effectiveRole}
        onSignIn={authState.signIn}
        onLogout={authState.logout}
        onRefreshToken={authState.refreshToken}
        onOpenRegistration={() => navigate('registration')}
      />

      <div className="app-shell-body mx-auto flex w-full max-w-[1600px]">
        <AppSidebar
          activeTab={activeTab}
          navLabel={navLabel}
          canAccess={guard.canAccess}
          isConfigured={authState.isConfigured}
          onNavigate={navigate}
          pendingCount={pendingCount}
          lang={currentLang}
          changeParishLabel={t(currentLang, 'changeParish')}
          syncStatus={syncStatusNode}
          user={authState.user}
          authError={authState.authError}
          effectiveRole={authState.effectiveRole}
          onSignIn={authState.signIn}
          onLogout={authState.logout}
          onRefreshToken={authState.refreshToken}
          onOpenRegistration={() => navigate('registration')}
          websiteMode={websiteMode}
        />

        {/* MAIN CONTENT */}
        <main
          ref={mainScrollRef}
          className={
            'app-main min-w-0 flex-1 px-4 pb-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:py-8' +
            (websiteMode ? ' !px-0 !py-0' : '') +
            (websiteApp ? ' lg:!pt-0' : '')
          }
        >
          {/* Single content root so Lenis measures the full page height (not the progress bar). */}
          <div className="app-main-scroll">
          {websiteApp && (
            <div className="website-app-progress hidden lg:block" aria-hidden>
              <span id="website-scroll-progress" />
            </div>
          )}
          {showPageChrome && (
            <div className="app-page-heading mb-5 hidden items-center justify-between md:flex lg:mb-7">
              <div className="min-w-0">
                <BreadcrumbParishLabel />
                <h1 className="mt-1 truncate text-[28px] font-semibold tracking-[-0.025em] text-[#1d1d1f]">
                  {activeLabel}
                </h1>
              </div>
              {guard.isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('registration')}
                  className="btn-pill btn-pill-primary !text-[13px]"
                >
                  <UserPlus className="h-3.5 w-3.5 text-amber-300" /> Add member
                </button>
              )}
            </div>
          )}

          <div className="app-content-rail">
          <PageTransition pageKey={activeTab}>
          <Suspense fallback={<ModuleSkeleton />}>
            {/* Hold protected deep links until auth+claims finish restoring. */}
            {authState.isConfigured && !authState.isReady && TAB_REQUIRED_ROLE[activeTab] !== 'public_user' ? (
              <ModuleSkeleton />
            ) : websiteMode ? (
            <>
            <MarketingLanding lang={currentLang} onNavigate={navigate} parishName={selectedParish?.parishName} />
            </>
            ) : (
            <WebsitePageShell
              key={activeTab}
              eyebrow={pageMeta.eyebrow}
              title={activeLabel}
              lede={pageMeta.lede}
              hideHero={activeTab === 'landing'}
              actions={pageShellActions}
            >
            <>
            {activeTab === 'landing' && (
              <LandingPage currentLang={currentLang} members={members} masses={masses} payments={payments}
                events={events} announcements={announcements} attendanceRecords={attendanceRecords}
                loading={authState.isConfigured && !authState.isReady}
                onNavigate={navigate} />
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
                onUpdateMemberStatus={handleUpdateMemberStatus}
                onEditMember={handleEditMember}
                onRemoveMember={handleRemoveMember} />
            )}
            {activeTab === 'dashboard_member' && (
              guard.canAccess('choir_member') ? (
                currentMember ? (
                  <DashboardMember currentLang={currentLang} memberId={authState.user?.uid ?? currentMember.id}
                    members={members} events={events} masses={masses} payments={payments} attendanceRecords={attendanceRecords}
                    loading={authState.isConfigured && !authState.isReady}
                    onNavigate={navigate}
                    onUpdateMemberDetails={(updated) => void memberSync.upsert(updateRecordMetadata(updated, authState.user?.uid ?? updated.id), authState.user?.uid)}
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
                <AnalyticsDashboard currentLang={currentLang} members={members} masses={masses} payments={payments} attendanceRecords={attendanceRecords} />
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
            {activeTab === 'attendance' && (
              guard.canAccess('choir_member') ? (
                <ActivityAttendance
                  members={members}
                  masses={masses}
                  payments={payments}
                  rehearsals={rehearsals}
                  attendanceRecords={attendanceRecords}
                  isAdmin={guard.isAdmin}
                  viewerMemberId={authState.user?.uid ?? currentMember?.id ?? null}
                  onSaveSession={persistActivitySession}
                  onImportSessions={importActivitySessions}
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
            </>
            </WebsitePageShell>
            )}
          </Suspense>
          </PageTransition>
          </div>
          </div>
        </main>
      </div>

      <AppBottomNav
        activeTab={activeTab}
        canAccess={guard.canAccess}
        navLabel={navLabel}
        onNavigate={navigate}
        moreOpen={mobileMoreOpen}
        onMoreOpenChange={setMobileMoreOpen}
        pendingPeopleCount={pendingCount}
      />
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
