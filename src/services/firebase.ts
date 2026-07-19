import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { DEFAULT_TENANT_CONTEXT, createRecordMetadata, updateRecordMetadata, type TenantContext } from './recordMetadata';
import { TenantScopedRecord } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasRequiredFirebaseConfig(config: Partial<FirebaseOptions>) {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

function normalizeFirebaseConfig(config: Partial<FirebaseOptions>): FirebaseOptions {
  return {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };
}

function createFirebaseApp(config?: Partial<FirebaseOptions>): FirebaseApp | null {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;
  if (!config || !hasRequiredFirebaseConfig(config)) return null;
  return initializeApp(normalizeFirebaseConfig(config));
}

let firebaseApp = createFirebaseApp(firebaseConfig);
export let isFirebaseConfigured = Boolean(firebaseApp);
export let auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export let db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
let firebaseConfigPromise: Promise<boolean> | null = null;

function applyFirebaseApp(app: FirebaseApp | null) {
  firebaseApp = app;
  isFirebaseConfigured = Boolean(firebaseApp);
  auth = firebaseApp ? getAuth(firebaseApp) : null;
  db = firebaseApp ? getFirestore(firebaseApp) : null;
  return isFirebaseConfigured;
}

export async function ensureFirebaseConfigured() {
  if (isFirebaseConfigured) return true;
  if (typeof window === 'undefined') return false;
  if (!firebaseConfigPromise) {
    firebaseConfigPromise = fetch('/__/firebase/init.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return false;
        const hostingConfig = await response.json() as Partial<FirebaseOptions>;
        return applyFirebaseApp(createFirebaseApp(hostingConfig));
      })
      .catch(() => false);
  }
  return firebaseConfigPromise;
}

export const COLLECTIONS = {
  members: 'members',
  privateMembers: 'privateMembers',
  choirs: 'choirs',
  masses: 'masses',
  events: 'events',
  attendance: 'attendance',
  payments: 'payments',
  paymentShares: 'paymentShares',
  songs: 'songs',
  calendars: 'calendars',
  notifications: 'notifications',
  announcements: 'announcements',
  approvalWorkflows: 'approvalWorkflows',
  auditLogs: 'auditLogs',
  appSettings: 'appSettings',
  dailyReadings: 'dailyReadings',
  rehearsals: 'rehearsals',
  media: 'cloudinaryMedia',
  choirChatMessages: 'choirChatMessages',
} as const;

type CollectionName = keyof typeof COLLECTIONS;

function requireDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values to enable real-time sync.');
  }
  return db;
}

/**
 * Firestore rejects writes containing `undefined` field values. Optional
 * fields in our record types (e.g. Payment.receiptNo) are often set to
 * `undefined` when left blank, so drop them before writing.
 */
function stripUndefined<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as T;
}

function tenantContextFromRecord(record: Partial<TenantScopedRecord>): TenantContext {
  return {
    archdioceseId: record.archdioceseId || DEFAULT_TENANT_CONTEXT.archdioceseId,
    parishName: record.parishName || DEFAULT_TENANT_CONTEXT.parishName,
    tenantId: record.tenantId || DEFAULT_TENANT_CONTEXT.tenantId,
    parishId: record.parishId || DEFAULT_TENANT_CONTEXT.parishId,
    choirId: record.choirId || DEFAULT_TENANT_CONTEXT.choirId,
  };
}

export function listenToTenantCollection<T>(
  collectionName: CollectionName,
  onChange: (records: T[]) => void,
  onError?: (error: Error) => void,
  extraConstraints: QueryConstraint[] = [],
  pageSize = 50,
  tenantContext?: TenantContext,
): Unsubscribe {
  if (!db) return () => undefined;

  // Always use the dynamically provided context — fall back to env-var defaults
  // only when no parish has been selected yet (onboarding flow).
  const ctx = tenantContext ?? DEFAULT_TENANT_CONTEXT;

  const constraints = [
    where('archdioceseId', '==', ctx.archdioceseId),
    where('tenantId', '==', ctx.tenantId),
    where('parishId', '==', ctx.parishId),
    limit(pageSize),
    ...extraConstraints,
  ];

  return onSnapshot(
    query(collection(db, COLLECTIONS[collectionName]), ...constraints),
    (snapshot) => {
      const records = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as unknown as T & {
          status?: string;
          updatedAt?: string;
          deletedAt?: string | null;
        })
        .filter((item) => item.status !== 'deleted' && !item.deletedAt)
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        .slice(0, pageSize) as T[];
      onChange(records);
    },
    (error) => onError?.(error),
  );
}

export async function upsertTenantRecord<T extends { id: string } & Partial<TenantScopedRecord>>(
  collectionName: CollectionName,
  record: T,
  userId = auth?.currentUser?.uid || 'system',
) {
  const database = requireDb();
  const payload = stripUndefined({
    ...record,
    ...(record.createdAt
      ? updateRecordMetadata(record, userId)
      : createRecordMetadata(userId, record.status || 'active', tenantContextFromRecord(record))),
  });
  await setDoc(doc(database, COLLECTIONS[collectionName], record.id), payload, { merge: true });
}

export async function updateTenantRecord<T extends Partial<TenantScopedRecord>>(
  collectionName: CollectionName,
  recordId: string,
  patch: T,
  userId = auth?.currentUser?.uid || 'system',
) {
  const database = requireDb();
  await updateDoc(doc(database, COLLECTIONS[collectionName], recordId), stripUndefined(updateRecordMetadata(patch, userId) as DocumentData));
}

/** Hard-delete a tenant document (used for ephemeral choir chat TTL purge). */
export async function deleteTenantRecord(collectionName: CollectionName, recordId: string) {
  const database = requireDb();
  await deleteDoc(doc(database, COLLECTIONS[collectionName], recordId));
}

/** Hard-delete many docs in batches of 400. */
export async function deleteTenantRecords(collectionName: CollectionName, recordIds: string[]) {
  if (recordIds.length === 0) return;
  const database = requireDb();
  const col = COLLECTIONS[collectionName];
  for (let i = 0; i < recordIds.length; i += 400) {
    const chunk = recordIds.slice(i, i + 400);
    const batch = writeBatch(database);
    chunk.forEach((id) => batch.delete(doc(database, col, id)));
    await batch.commit();
  }
}

export async function batchUpsertTenantRecords<T extends { id: string } & Partial<TenantScopedRecord>>(
  collectionName: CollectionName,
  records: T[],
  userId = auth?.currentUser?.uid || 'system',
) {
  const database = requireDb();
  const batch = writeBatch(database);

  records.forEach((record) => {
    const payload = stripUndefined({
      ...record,
      ...(record.createdAt
        ? updateRecordMetadata(record, userId)
        : createRecordMetadata(userId, record.status || 'active', tenantContextFromRecord(record))),
    });
    batch.set(doc(database, COLLECTIONS[collectionName], record.id), payload, { merge: true });
  });

  await batch.commit();
}
