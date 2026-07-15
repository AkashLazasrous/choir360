import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useSyncedCollection } from './useSyncedCollection';
import { TenantContext } from '../services/recordMetadata';
import { Member, TenantScopedRecord } from '../types';
import { db, isFirebaseConfigured, updateTenantRecord, upsertTenantRecord } from '../services/firebase';

/**
 * Fields that must never live in the broadly tenant-readable `members`
 * collection. They are stored in a separate `privateMembers/{memberId}`
 * document instead, readable only by the member themself or an admin
 * (see firestore.rules).
 */
const PRIVATE_FIELD_KEYS = ['dob', 'mobile', 'mobileNormalized', 'whatsapp', 'email', 'address', 'emergencyContact'] as const;
type PrivateFieldKey = typeof PRIVATE_FIELD_KEYS[number];
type PrivateFields = Pick<Member, PrivateFieldKey>;
type PublicMember = Omit<Member, PrivateFieldKey>;
type PrivateMemberRecord = PrivateFields & { id: string } & Partial<TenantScopedRecord>;

const EMPTY_PRIVATE_FIELDS: PrivateFields = {
  dob: '',
  mobile: '',
  mobileNormalized: '',
  whatsapp: '',
  email: '',
  address: '',
  emergencyContact: { name: '', relationship: '', phone: '' },
};

const TENANT_FIELD_KEYS = [
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'status',
  'archdioceseId',
  'parishName',
  'tenantId',
  'parishId',
  'choirId',
  'deletedAt',
  'deletedBy',
] as const;

function copyTenantEnvelope(record: Partial<TenantScopedRecord>) {
  const envelope: Partial<TenantScopedRecord> = {};
  TENANT_FIELD_KEYS.forEach((key) => {
    if (record[key] !== undefined) {
      (envelope as Record<string, unknown>)[key] = record[key];
    }
  });
  return envelope;
}

function splitMember(member: Member & Partial<TenantScopedRecord>): { publicPart: PublicMember; privatePart: PrivateMemberRecord } {
  const { dob, mobile, mobileNormalized, whatsapp, email, address, emergencyContact, ...publicPart } = member;
  return {
    publicPart,
    privatePart: {
      id: member.id,
      dob,
      mobile,
      mobileNormalized: mobileNormalized || mobile.replace(/\D/g, ''),
      whatsapp,
      email,
      address,
      emergencyContact,
      ...copyTenantEnvelope(member),
    },
  };
}

function mergeMember(pub: PublicMember, priv: PrivateFields | undefined): Member {
  return { ...pub, ...(priv ?? EMPTY_PRIVATE_FIELDS) } as Member;
}

export interface UseMembersWithPrivateDataOptions {
  /** Firebase Auth uid of the signed-in user (for own privateMembers/{uid} listen). */
  viewerUid?: string | null;
  /**
   * When true, listen to the whole parish privateMembers collection (admin).
   * Choir members must NOT do this — rules only allow reading their own private doc.
   */
  canReadParishPrivate?: boolean;
}

/**
 * Drop-in replacement for `useSyncedCollection<Member>('members', ...)` that
 * keeps PII in privateMembers. Admins get a parish-wide private listener;
 * members only subscribe to their own privateMembers/{uid} document.
 */
export function useMembersWithPrivateData(
  fallbackRecords: Member[],
  syncEnabled = true,
  tenantContext?: TenantContext,
  options: UseMembersWithPrivateDataOptions = {},
) {
  const { viewerUid = null, canReadParishPrivate = false } = options;

  const fallbackPublic = useMemo(
    () => fallbackRecords.map((m) => splitMember(m).publicPart),
    [fallbackRecords],
  );
  const fallbackPrivate = useMemo(
    () => fallbackRecords.map((m) => splitMember(m).privatePart),
    [fallbackRecords],
  );

  const publicCollection = useSyncedCollection<PublicMember>('members', fallbackPublic, syncEnabled, tenantContext);

  // Admins: parish-wide privateMembers query (allowed by rules).
  const privateCollection = useSyncedCollection<PrivateMemberRecord>(
    'privateMembers',
    fallbackPrivate,
    syncEnabled && canReadParishPrivate,
    tenantContext,
  );

  // Members: single-doc listen on own private record only.
  const [ownPrivate, setOwnPrivate] = useState<PrivateMemberRecord | null>(null);
  const [ownPrivateError, setOwnPrivateError] = useState<string | null>(null);

  useEffect(() => {
    if (!syncEnabled || canReadParishPrivate || !viewerUid || !isFirebaseConfigured || !db) {
      setOwnPrivate(null);
      setOwnPrivateError(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'privateMembers', viewerUid),
      (snapshot) => {
        if (!snapshot.exists()) {
          setOwnPrivate(null);
          setOwnPrivateError(null);
          return;
        }
        setOwnPrivate({ id: snapshot.id, ...snapshot.data() } as PrivateMemberRecord);
        setOwnPrivateError(null);
      },
      (error) => {
        setOwnPrivateError(error.message);
      },
    );
    return unsubscribe;
  }, [syncEnabled, canReadParishPrivate, viewerUid]);

  const privateById = useMemo(() => {
    const map = new Map<string, PrivateFields & { id: string }>();
    if (canReadParishPrivate) {
      privateCollection.records.forEach((p) => map.set(p.id, p));
    } else if (ownPrivate) {
      map.set(ownPrivate.id, ownPrivate);
    }
    return map;
  }, [canReadParishPrivate, privateCollection.records, ownPrivate]);

  const records = useMemo<Member[]>(
    () => publicCollection.records.map((pub) => mergeMember(pub, privateById.get(pub.id))),
    [publicCollection.records, privateById],
  );

  const upsert = async (member: Member, userId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { publicPart, privatePart } = splitMember(member);
    try {
      const publicResult = await publicCollection.actions.upsert(publicPart, userId);
      if (!publicResult.ok) return publicResult;
      if (isFirebaseConfigured && syncEnabled) {
        await upsertTenantRecord('privateMembers', privatePart, userId);
      }
      if (!canReadParishPrivate && privatePart.id === viewerUid) {
        setOwnPrivate(privatePart);
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save member.';
      return { ok: false, error: msg };
    }
  };

  const patch = async (
    id: string,
    patchData: Partial<Member & TenantScopedRecord>,
    userId?: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const privatePatch: Record<string, unknown> = {};
    const publicPatch: Record<string, unknown> = {};
    const privateKeySet: readonly string[] = PRIVATE_FIELD_KEYS;

    for (const [key, value] of Object.entries(patchData)) {
      if (privateKeySet.includes(key)) {
        privatePatch[key] = value;
      } else {
        publicPatch[key] = value;
      }
    }

    try {
      if (Object.keys(publicPatch).length) {
        const result = await publicCollection.actions.patch(
          id,
          publicPatch as Partial<PublicMember & TenantScopedRecord>,
          userId,
        );
        if (!result.ok) return result;
      }
      if (Object.keys(privatePatch).length && isFirebaseConfigured && syncEnabled) {
        await updateTenantRecord(
          'privateMembers',
          id,
          privatePatch as Partial<PrivateFields & TenantScopedRecord>,
          userId,
        );
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update member.';
      return { ok: false, error: msg };
    }
  };

  // Only surface errors that block the public roster (or admin private roster).
  // Member own-private errors are rare; parish-wide private permission errors
  // must never appear for choir_member (that was the "Sync blocked" bug).
  const syncError = publicCollection.syncError
    || (canReadParishPrivate ? privateCollection.syncError : ownPrivateError);

  return {
    records,
    isLive: publicCollection.isLive,
    syncError,
    actions: { upsert, patch },
  };
}
