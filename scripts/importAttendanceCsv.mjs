/**
 * One-time import of Ambattur OT attendance CSV matrices into Firestore.
 *
 * Usage:
 *   node scripts/importAttendanceCsv.mjs \
 *     "C:/Users/dev-a/Downloads/Mass (1 jan - 15 jul).csv" \
 *     "C:/Users/dev-a/Downloads/Practise Session (1 jan - 15 jul).csv" \
 *     "C:/Users/dev-a/Downloads/Special Mass (1 jan - 15 jul).csv"
 *
 * Requires Firebase Admin credentials (.env.local or GOOGLE_APPLICATION_CREDENTIALS).
 */

import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { getAdminFirestore } from './firebaseAdmin.mjs';

config({ path: '.env.local', override: false });

const TENANT_ID = process.env.VITE_DEFAULT_TENANT_ID || 'madras-mylapore';
const PARISH_ID = process.env.VITE_DEFAULT_PARISH_ID || 'church-of-sts-joseph-the-worker-philip-ambattur-ot';
const CHOIR_ID = process.env.VITE_DEFAULT_CHOIR_ID || `${PARISH_ID}-choir`;
const NOW = new Date().toISOString();

const KIND_FROM_FILE = [
  { test: (name) => /practis|practice/i.test(name), kind: 'practice' },
  { test: (name) => /special/i.test(name), kind: 'special_mass' },
  { test: (name) => /saturday|sat mass|sat-/i.test(name), kind: 'saturday_mass' },
  { test: (name) => /mass|sunday/i.test(name), kind: 'sunday_mass' },
];

function parseSheetDate(header) {
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(header.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseCsvMark(cell) {
  const value = (cell ?? '').trim().toUpperCase();
  if (!value) return null;
  if (value === 'A') return 'Present';
  if (value === 'X') return 'Absent';
  if (value === 'L') return 'Late';
  if (value === '*') return 'Excused';
  return null;
}

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function activityEntityId(kind, date) {
  const prefix = kind === 'practice' ? 'rehearsal' : 'mass';
  return `${prefix}-${kind}-${date}`;
}

function attendanceRecordId(entityId, memberId) {
  return `att-${entityId}-${memberId}`;
}

function parseMatrix(text, kind) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = splitCsvLine(lines[0]);
  const dateColumns = header
    .map((cell, index) => ({ index, date: parseSheetDate(cell) }))
    .filter((col) => col.date);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const memberName = (cells[1] ?? '').trim();
    if (!memberName || /symbology|rules|attendances/i.test(memberName)) continue;
    for (const { index, date } of dateColumns) {
      const status = parseCsvMark(cells[index]);
      if (!status) continue;
      rows.push({ memberName, date, status });
    }
  }
  const deduped = new Map();
  for (const row of rows) {
    deduped.set(`${row.memberName.toLowerCase()}::${row.date}`, row);
  }
  return [...deduped.values()];
}

function detectKind(path) {
  const name = path.split(/[/\\]/).pop() ?? path;
  const hit = KIND_FROM_FILE.find((entry) => entry.test(name));
  return hit?.kind ?? null;
}

function tenantEnvelope(status = 'active') {
  return {
    tenantId: TENANT_ID,
    parishId: PARISH_ID,
    choirId: CHOIR_ID,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: 'import-attendance-csv',
    updatedBy: 'import-attendance-csv',
    status,
    deletedAt: null,
    deletedBy: null,
  };
}

async function loadMembers(db) {
  const snap = await db.collection('members')
    .where('parishId', '==', PARISH_ID)
    .where('tenantId', '==', TENANT_ID)
    .get();

  const byName = new Map();
  for (const doc of snap.docs) {
    const data = doc.data();
    const name = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim().toLowerCase();
    if (name) byName.set(name, { id: doc.id, ...data });
  }
  return byName;
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Provide one or more CSV file paths.');
    process.exit(1);
  }

  const db = getAdminFirestore();
  const membersByName = await loadMembers(db);
  console.log(`Loaded ${membersByName.size} parish members for name matching.`);

  let batch = db.batch();
  let ops = 0;
  let importedRecords = 0;
  let unmatchedNames = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const filePath of files) {
    const kind = detectKind(filePath);
    if (!kind) {
      console.warn(`Skipping ${filePath} — could not detect activity kind.`);
      continue;
    }

    const text = readFileSync(filePath, 'utf8');
    const rows = parseMatrix(text, kind);
    console.log(`\n${filePath} → ${kind}: ${rows.length} marks`);

    const sessions = new Map();
    for (const row of rows) {
      const member = membersByName.get(row.memberName.toLowerCase());
      if (!member) {
        unmatchedNames += 1;
        continue;
      }
      const key = `${kind}::${row.date}`;
      if (!sessions.has(key)) sessions.set(key, { kind, date: row.date, marks: new Map() });
      sessions.get(key).marks.set(member.id, { status: row.status, memberName: `${member.firstName} ${member.lastName}`.trim() });
    }

    for (const session of sessions.values()) {
      const entityId = activityEntityId(session.kind, session.date);
      const entityType = session.kind === 'practice' ? 'Rehearsal' : 'Mass';
      const entityName = session.kind === 'practice'
        ? `Practice · ${session.date}`
        : session.kind === 'special_mass'
          ? `Special Mass · ${session.date}`
          : session.kind === 'saturday_mass'
            ? `Saturday Mass · ${session.date}`
            : `Sunday Mass · ${session.date}`;

      const attendingIds = [...session.marks.entries()]
        .filter(([, mark]) => mark.status === 'Present' || mark.status === 'Late')
        .map(([memberId]) => memberId);

      if (session.kind === 'practice') {
        batch.set(db.collection('rehearsals').doc(entityId), {
          id: entityId,
          name: entityName,
          type: 'Regular Practice',
          date: session.date,
          startTime: '18:00',
          endTime: '19:30',
          venue: 'Church Hall',
          attendingMemberIds: attendingIds,
          activityKind: 'practice',
          status: 'Completed',
          ...tenantEnvelope('Completed'),
        }, { merge: true });
      } else {
        batch.set(db.collection('masses').doc(entityId), {
          id: entityId,
          name: entityName,
          category: session.kind === 'special_mass' ? 'Special Mass' : session.kind === 'saturday_mass' ? 'Saturday Mass' : 'Sunday Mass',
          date: session.date,
          time: session.kind === 'special_mass' ? '10:00' : session.kind === 'saturday_mass' ? '18:00' : '07:00',
          language: 'Tamil',
          attendingMemberIds: attendingIds,
          activityKind: session.kind,
          ...tenantEnvelope('active'),
        }, { merge: true });
      }
      ops += 1;

      for (const [memberId, mark] of session.marks) {
        const recordId = attendanceRecordId(entityId, memberId);
        batch.set(db.collection('attendance').doc(recordId), {
          id: recordId,
          entityId,
          entityType,
          activityKind: session.kind,
          entityName,
          date: session.date,
          memberId,
          memberName: mark.memberName,
          status: mark.status,
          ...tenantEnvelope(mark.status),
        }, { merge: true });
        ops += 1;
        importedRecords += 1;
        if (ops >= 400) await commitBatch();
      }
      if (ops >= 400) await commitBatch();
    }
  }

  await commitBatch();
  console.log(`\nDone. Imported ${importedRecords} attendance records.`);
  if (unmatchedNames) console.log(`Unmatched name cells: ${unmatchedNames} (register members first).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
