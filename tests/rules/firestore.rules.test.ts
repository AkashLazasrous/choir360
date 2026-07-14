/**
 * Firestore security rules tests. Run against the emulator:
 *
 *   npm run test:rules
 *
 * (wraps `firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.ts"`)
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-choir360-rules';

const PARISH_A = 'parish-a';
const PARISH_B = 'parish-b';
const TENANT = 'madras-mylapore';

let testEnv: RulesTestEnvironment;

const envelope = (parishId: string, status = 'active') => ({
  createdAt: '2026-07-14T00:00:00.000Z',
  updatedAt: '2026-07-14T00:00:00.000Z',
  createdBy: 'seed',
  updatedBy: 'seed',
  status,
  archdioceseId: TENANT,
  parishName: `Parish ${parishId}`,
  tenantId: TENANT,
  parishId,
  choirId: `${parishId}-choir`,
});

const claims = (role: string, parishId: string) => ({
  role,
  tenantId: TENANT,
  parishId,
  choirId: `${parishId}-choir`,
});

const adminA = () => testEnv.authenticatedContext('admin-a', claims('choir_admin', PARISH_A)).firestore();
const memberA = () => testEnv.authenticatedContext('member-a', claims('choir_member', PARISH_A)).firestore();
const memberB = () => testEnv.authenticatedContext('member-b', claims('choir_member', PARISH_B)).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed one mass + one member per parish, bypassing rules.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'masses', 'mass-a'), { name: 'Sunday Mass A', ...envelope(PARISH_A) });
    await setDoc(doc(db, 'masses', 'mass-b'), { name: 'Sunday Mass B', ...envelope(PARISH_B) });
    await setDoc(doc(db, 'members', 'member-a'), {
      firstName: 'Anna', lastName: 'A', ...envelope(PARISH_A, 'Pending'),
    });
    await setDoc(doc(db, 'payments', 'payment-a'), {
      partyName: 'Family A', promisedAmount: 5000, ...envelope(PARISH_A),
    });
  });
});

// ─── Tenant isolation ────────────────────────────────────────────────────────

describe('tenant isolation', () => {
  it('members can read masses in their own parish', async () => {
    await assertSucceeds(getDoc(doc(memberA(), 'masses', 'mass-a')));
  });

  it('members cannot read masses from another parish', async () => {
    await assertFails(getDoc(doc(memberB(), 'masses', 'mass-a')));
  });

  it('unauthenticated users cannot read masses at all', async () => {
    await assertFails(getDoc(doc(anon(), 'masses', 'mass-a')));
  });

  it('admins cannot create records in another parish', async () => {
    await assertFails(
      setDoc(doc(adminA(), 'masses', 'mass-x'), { name: 'Cross-parish', ...envelope(PARISH_B) }),
    );
  });

  it('admins can create records in their own parish', async () => {
    await assertSucceeds(
      setDoc(doc(adminA(), 'masses', 'mass-y'), { name: 'Own parish', ...envelope(PARISH_A) }),
    );
  });
});

// ─── Role escalation ─────────────────────────────────────────────────────────

describe('role escalation prevention', () => {
  it('members cannot change their own status field', async () => {
    await assertFails(
      setDoc(doc(memberA(), 'members', 'member-a'), {
        firstName: 'Anna', lastName: 'A', ...envelope(PARISH_A, 'Active Member'),
      }),
    );
  });

  it('members can update their own record when status is unchanged', async () => {
    await assertSucceeds(
      setDoc(doc(memberA(), 'members', 'member-a'), {
        firstName: 'Anna Maria', lastName: 'A', ...envelope(PARISH_A, 'Pending'),
      }),
    );
  });

  it('admins can approve members (change status)', async () => {
    await assertSucceeds(
      setDoc(doc(adminA(), 'members', 'member-a'), {
        firstName: 'Anna', lastName: 'A', ...envelope(PARISH_A, 'Active Member'),
      }),
    );
  });

  it('members cannot create masses (admin-only collection)', async () => {
    await assertFails(
      setDoc(doc(memberA(), 'masses', 'mass-z'), { name: 'Rogue mass', ...envelope(PARISH_A) }),
    );
  });

  it('members cannot read payments (financial data is admin-only)', async () => {
    await assertFails(getDoc(doc(memberA(), 'payments', 'payment-a')));
  });

  it('admins can read payments in their parish', async () => {
    await assertSucceeds(getDoc(doc(adminA(), 'payments', 'payment-a')));
  });
});

// ─── Immutable envelope ──────────────────────────────────────────────────────

describe('immutable audit fields', () => {
  it('rejects updates that rewrite tenant scope', async () => {
    await assertFails(
      updateDoc(doc(adminA(), 'masses', 'mass-a'), {
        parishId: PARISH_B,
        updatedAt: '2026-07-14T01:00:00.000Z',
        updatedBy: 'admin-a',
      }),
    );
  });

  it('rejects updates that rewrite createdAt', async () => {
    await assertFails(
      setDoc(doc(adminA(), 'masses', 'mass-a'), {
        name: 'Sunday Mass A',
        ...envelope(PARISH_A),
        createdAt: '2020-01-01T00:00:00.000Z',
      }),
    );
  });
});

// ─── Server-only collections ─────────────────────────────────────────────────

describe('server-only collections', () => {
  it('no client can write audit logs', async () => {
    await assertFails(
      setDoc(doc(adminA(), 'auditLogs', 'log-1'), { action: 'test', ...envelope(PARISH_A) }),
    );
  });

  it('no client can write catholic hub songs', async () => {
    await assertFails(
      setDoc(doc(adminA(), 'catholicHubSongs', 'song-1'), { title: 'Song', status: 'active' }),
    );
  });

  it('attendance creates are admin-only', async () => {
    await assertFails(
      setDoc(doc(memberA(), 'attendance', 'att-1'), {
        entityId: 'mass-a', memberId: 'member-a', ...envelope(PARISH_A, 'Present'),
      }),
    );
    await assertSucceeds(
      setDoc(doc(adminA(), 'attendance', 'att-2'), {
        entityId: 'mass-a', memberId: 'member-a', ...envelope(PARISH_A, 'Present'),
      }),
    );
  });
});
