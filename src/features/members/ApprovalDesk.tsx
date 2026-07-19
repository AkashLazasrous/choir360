import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, MapPin, PhoneCall, RefreshCw, UserPlus } from 'lucide-react';
import { Member, MemberStatus } from '../../types';
import { ApprovalControls } from './ApprovalControls';
import { AdminMemberEditor } from './AdminMemberEditor';
import { apiFetch } from '../../services/apiClient';
import { auth } from '../../services/firebase';

interface ElsewherePending {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  parish: string;
  parishId: string;
  status: string;
  photoUrl: string;
}

interface ApprovalDeskProps {
  members: Member[];
  parishId?: string;
  parishName?: string;
  onUpdateMemberStatus: (memberId: string, status: MemberStatus, note?: string) => void;
  onEditMember?: (member: Member) => Promise<{ ok: boolean; error?: string }>;
  onRemoveMember?: (member: Member) => Promise<{ ok: boolean; error?: string }>;
}

const STATUS_ORDER: Record<string, number> = {
  Pending: 0,
  'Correction Requested': 1,
  Approved: 2,
  'Active Member': 3,
  Admin: 4,
  Inactive: 5,
  Rejected: 6,
};

/** Admin approval desk: loads roster from API (reliable) + merges live listener data. */
export const ApprovalDesk: React.FC<ApprovalDeskProps> = ({
  members: liveMembers,
  parishId,
  parishName,
  onUpdateMemberStatus,
  onEditMember,
  onRemoveMember,
}) => {
  const [apiMembers, setApiMembers] = useState<Member[] | null>(null);
  const [elsewhere, setElsewhere] = useState<ElsewherePending[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adoptingId, setAdoptingId] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const loadRoster = useCallback(async () => {
    if (!parishId) return;
    setLoading(true);
    setLoadError('');
    try {
      const fetchRoster = () => apiFetch(`/api/members/roster?parishId=${encodeURIComponent(parishId)}`);
      let response = await fetchRoster();
      if (response.status === 403) {
        // Align JWT parish with the desk parish, then retry once.
        await apiFetch('/api/auth/set-parish', {
          method: 'POST',
          body: JSON.stringify({ parishId }),
        });
        await auth?.currentUser?.getIdToken(true);
        response = await fetchRoster();
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || `Could not load applications (${response.status}).`);
      }
      setApiMembers(Array.isArray(payload.members) ? (payload.members as Member[]) : []);
      setElsewhere(Array.isArray(payload.pendingElsewhere) ? (payload.pendingElsewhere as ElsewherePending[]) : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, [parishId]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  // Prefer API roster for PII, but overlay fresher public fields (esp. photoUrl)
  // from the Firestore listener so Admin SDK / client patches show immediately.
  const members = useMemo(() => {
    const ts = (m: Member) => String((m as Member & { updatedAt?: string }).updatedAt || '');
    const liveById = new Map(liveMembers.map((m) => [m.id, m]));
    const base = apiMembers ?? liveMembers;
    return base
      .map((m) => {
        const live = liveById.get(m.id);
        if (!live) return m;
        const liveTs = ts(live);
        const apiTs = ts(m);
        const liveIsFresher = Boolean(liveTs && (!apiTs || liveTs >= apiTs));
        if (!liveIsFresher) {
          return {
            ...m,
            photoUrl: m.photoUrl || live.photoUrl || '',
          };
        }
        return {
          ...m,
          photoUrl: live.photoUrl || m.photoUrl || '',
          firstName: live.firstName || m.firstName,
          lastName: live.lastName || m.lastName,
          gender: live.gender || m.gender,
          memberType: live.memberType || m.memberType,
          voiceType: live.voiceType || m.voiceType,
          skills: live.skills ?? m.skills,
          experience: live.experience ?? m.experience,
          status: live.status || m.status,
          relationshipStatus: live.relationshipStatus || m.relationshipStatus,
        };
      })
      .filter((m) => (m.status as string) !== 'deleted');
  }, [apiMembers, liveMembers]);

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const byStatus = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        if (byStatus !== 0) return byStatus;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }),
    [members],
  );

  const handleStatus = (memberId: string, status: MemberStatus, note?: string) => {
    onUpdateMemberStatus(memberId, status, note);
    // Keep desk roster in sync immediately (API + live listener may lag briefly).
    setApiMembers((prev) =>
      prev
        ? prev.map((m) =>
          m.id === memberId
            ? { ...m, status, correctionNote: note ?? m.correctionNote }
            : m,
        )
        : prev,
    );
    window.setTimeout(() => void loadRoster(), 800);
  };

  const handleSaveEdit = async (updated: Member) => {
    if (!onEditMember) return;
    setSavingEdit(true);
    setEditError('');
    const result = await onEditMember(updated);
    setSavingEdit(false);
    if (!result.ok) {
      setEditError(result.error ?? 'Could not save profile.');
      return;
    }
    // Optimistic local roster update so the card photo flips before refetch.
    const stamped = { ...updated, updatedAt: new Date().toISOString() } as Member & { updatedAt: string };
    setApiMembers((prev) => {
      if (!prev) return [stamped];
      const exists = prev.some((m) => m.id === stamped.id);
      return exists
        ? prev.map((m) => (m.id === stamped.id ? { ...m, ...stamped } : m))
        : [stamped, ...prev];
    });
    setEditingMember(null);
    window.setTimeout(() => void loadRoster(), 600);
  };

  const handleRemove = async (member: Member) => {
    if (!onRemoveMember) return;
    setLoadError('');
    const result = await onRemoveMember(member);
    if (!result.ok) {
      setLoadError(result.error ?? 'Could not permanently delete member.');
      return;
    }
    // Hard delete — drop from API roster immediately, then refresh.
    setApiMembers((prev) => (prev ? prev.filter((m) => m.id !== member.id) : prev));
    window.setTimeout(() => void loadRoster(), 400);
  };

  const adoptMember = async (memberId: string) => {
    if (!parishId) return;
    setAdoptingId(memberId);
    setLoadError('');
    try {
      const response = await apiFetch(`/api/members/${encodeURIComponent(memberId)}/adopt`, {
        method: 'POST',
        body: JSON.stringify({ parishId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not move application to this parish.');
      }
      await loadRoster();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not move application.');
    } finally {
      setAdoptingId('');
    }
  };

  return (
    <div className="apple-card font-apple space-y-5 p-6" id="admin-dashboard-view">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-black/[0.06] pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e3d4c]">
            <ClipboardCheck className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
              Choral Registrar Verification
            </h3>
            <p className="text-[12px] text-[#86868b]">
              {parishName
                ? `Applications for ${parishName}`
                : 'Approve, reject or request corrections for applicants'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="apple-badge-gold">
            {members.filter((m) => m.status === 'Pending').length} Pending
          </span>
          <span className="apple-badge-forest">
            {members.filter((m) => m.status === 'Active Member' || m.status === 'Admin').length} Active
          </span>
          <span className="apple-badge-muted">
            {members.filter((m) => m.status === 'Inactive').length} Inactive
          </span>
          <span className="apple-badge-danger">
            {members.filter((m) => m.status === 'Rejected').length} Rejected
          </span>
          <button
            type="button"
            onClick={() => void loadRoster()}
            disabled={loading || !parishId}
            className="btn-pill btn-pill-secondary !min-h-[36px] !px-3 !text-[12px]"
            title="Refresh applications"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{loadError}</p>
      )}

      {elsewhere.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-[14px] font-semibold text-amber-950">
            Pending applications under another parish ({elsewhere.length})
          </p>
          <p className="mt-1 text-[12px] text-amber-900/80">
            These were saved with a different parish id (often from an earlier bug). Move them into this parish to approve.
          </p>
          <ul className="mt-3 space-y-2">
            {elsewhere.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[#1d1d1f]">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="truncate text-[12px] text-[#86868b]">
                    {item.email || item.mobile || item.id} · listed as {item.parish || item.parishId || 'unknown parish'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={adoptingId === item.id}
                  onClick={() => void adoptMember(item.id)}
                  className="btn-pill btn-pill-primary !min-h-[40px] !px-3 !text-[13px]"
                >
                  {adoptingId === item.id ? 'Moving…' : 'Move to this parish'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && apiMembers === null ? (
        <div className="apple-empty">
          <RefreshCw className="h-8 w-8 animate-spin text-[#0e3d4c]" />
          <h3>Loading applications…</h3>
          <p>Fetching the parish roster from the server.</p>
        </div>
      ) : members.length === 0 ? (
        <div className="apple-empty">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.06]">
            <UserPlus className="h-6 w-6 text-[#86868b]" />
          </div>
          <h3>No applications for this parish</h3>
          <p>
            {elsewhere.length > 0
              ? 'Use Move to this parish above for pending apps found under another parish id.'
              : parishName
                ? `No member records found for ${parishName}. Ask the applicant to confirm the parish on their form, then tap Refresh.`
                : 'Select a parish in the sidebar, then open Approval Desk again.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((m) => {
            const statusCfg = {
              'Active Member': { bg: 'bg-[rgba(14,61,76,0.06)]', border: 'border-[rgba(14,61,76,0.14)]', badge: 'apple-badge-forest', dot: 'bg-[#0e3d4c]' },
              Admin: { bg: 'bg-[rgba(245,194,76,0.12)]', border: 'border-[rgba(245,194,76,0.35)]', badge: 'apple-badge-gold', dot: 'bg-[#f5c24c]' },
              Pending: { bg: 'bg-[rgba(245,194,76,0.1)]', border: 'border-[rgba(245,194,76,0.28)]', badge: 'apple-badge-gold', dot: 'bg-[#e8a820]' },
              Inactive: { bg: 'bg-[rgba(100,116,139,0.1)]', border: 'border-[rgba(100,116,139,0.28)]', badge: 'apple-badge-muted', dot: 'bg-[#64748b]' },
              Rejected: { bg: 'bg-[rgba(255,59,48,0.06)]', border: 'border-[rgba(255,59,48,0.2)]', badge: 'apple-badge-danger', dot: 'bg-[#d70015]' },
              'Correction Requested': { bg: 'bg-[rgba(255,149,0,0.08)]', border: 'border-[rgba(255,149,0,0.22)]', badge: 'apple-badge-gold', dot: 'bg-[#ff9500]' },
              Approved: { bg: 'bg-[rgba(41,151,255,0.08)]', border: 'border-[rgba(41,151,255,0.22)]', badge: 'apple-badge-blue', dot: 'bg-[#2997ff]' },
            }[m.status] ?? { bg: 'bg-[#f5f5f7]', border: 'border-black/[0.06]', badge: 'apple-badge-muted', dot: 'bg-[#86868b]' };

            return (
              <div key={m.id} className={`rounded-2xl border ${statusCfg.border} ${statusCfg.bg} space-y-3 p-4 transition hover:shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={m.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={m.firstName}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-xl border-2 border-white object-cover shadow-sm"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusCfg.dot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {m.email || m.id} · {m.gender}
                    </p>
                  </div>
                  <span className={`shrink-0 ${statusCfg.badge}`}>{m.status}</span>
                </div>

                <div className="space-y-1 border-t border-white/60 pt-2 text-[10px] text-slate-500">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    {m.parish}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <PhoneCall className="h-3 w-3 shrink-0 text-slate-400" />
                    {m.mobile || '—'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700">
                      {m.memberType}
                    </span>
                    {m.voiceType !== 'None' && (
                      <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                        {m.voiceType}
                      </span>
                    )}
                    <span className="text-slate-400">{m.experience}y exp</span>
                  </div>
                </div>

                {m.correctionNote && (
                  <p className="line-clamp-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-orange-700">
                    Note: &quot;{m.correctionNote}&quot;
                  </p>
                )}

                <div className="border-t border-white/60 pt-2">
                  <ApprovalControls
                    member={m}
                    members={members}
                    onUpdateMemberStatus={handleStatus}
                    onEditMember={onEditMember ? (member) => setEditingMember(member) : undefined}
                    onRemoveMember={onRemoveMember ? (member) => void handleRemove(member) : undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingMember && onEditMember && (
        <AdminMemberEditor
          member={editingMember}
          saving={savingEdit}
          error={editError}
          onClose={() => { setEditingMember(null); setEditError(''); }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};
