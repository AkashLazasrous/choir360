/**
 * Import Ambattur OT attendance CSV matrices into Firestore.
 *
 * Usage:
 *   npm run firebase:import-attendance -- --dry-run ^
 *     "C:/Users/dev-a/Downloads/Mass (1 jan - 15 jul).csv" ^
 *     "C:/Users/dev-a/Downloads/Practise Session (1 jan - 15 jul).csv" ^
 *     "C:/Users/dev-a/Downloads/Special Mass (1 jan - 15 jul).csv"
 *
 *   npm run firebase:import-attendance -- ^
 *     "C:/Users/dev-a/Downloads/Mass (1 jan - 15 jul).csv" ^
 *     "C:/Users/dev-a/Downloads/Practise Session (1 jan - 15 jul).csv" ^
 *     "C:/Users/dev-a/Downloads/Special Mass (1 jan - 15 jul).csv"
 *
 * Flags:
 *   --dry-run     Parse + match only; no Firestore writes
 *   --write-json  Also write scripts/data/attendance-import-normalized.json
 *
 * Requires Firebase Admin credentials for live import:
 *   - serviceAccountKey.json in repo root, or
 *   - GOOGLE_APPLICATION_CREDENTIALS, or
 *   - FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *
 * Idempotent doc ids: mass|rehearsal-{kind}-{date}, att-{entityId}-{memberId}
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { getAdminFirestore } from './firebaseAdmin.mjs';

config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

/** Ambattur OT choir — do not inherit demo VITE_DEFAULT_* (often St Thomas Cathedral). */
const DEFAULT_TENANT_ID = 'madras-mylapore';
const DEFAULT_PARISH_ID = 'church-of-sts-joseph-the-worker-philip-ambattur-ot';
const DEFAULT_CHOIR_ID = `${DEFAULT_PARISH_ID}-choir`;
const NOW = new Date().toISOString();
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const KIND_FROM_FILE = [
  { test: (name) => /practis|practice/i.test(name), kind: 'practice', splitMass: false },
  { test: (name) => /special/i.test(name), kind: 'special_mass', splitMass: false },
  { test: (name) => /novena/i.test(name), kind: 'novena', splitMass: false },
  { test: (name) => /feast/i.test(name), kind: 'feast_day', splitMass: false },
  { test: (name) => /weekday|ferial/i.test(name), kind: 'weekday_mass', splitMass: false },
  { test: (name) => /saturday|sat mass|sat-/i.test(name), kind: 'saturday_mass', splitMass: false },
  { test: (name) => /sunday/i.test(name), kind: 'sunday_mass', splitMass: false },
  { test: (name) => /mass/i.test(name), kind: 'sunday_mass', splitMass: true },
];

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function parseSheetDate(header) {
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(header.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function massKindForIsoDate(isoDate) {
  const day = new Date(`${isoDate}T12:00:00.000Z`).getUTCDay();
  if (day === 6) return 'saturday_mass';
  if (day === 0) return 'sunday_mass';
  return 'weekday_mass';
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

function normalizePersonName(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function memberNameKeys(member) {
  const first = normalizePersonName(member.firstName ?? '');
  const last = normalizePersonName(member.lastName ?? '');
  return new Set([`${first} ${last}`.trim(), `${last} ${first}`.trim()].filter(Boolean));
}

function matchMember(memberName, members) {
  const normalized = normalizePersonName(memberName);
  if (!normalized) return null;

  for (const member of members) {
    if (memberNameKeys(member).has(normalized)) return member;
  }

  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length < 2) return null;
  const lastToken = parts[parts.length - 1];
  const firstPart = parts.slice(0, -1).join(' ');

  const candidates = members.filter((member) => {
    const first = normalizePersonName(member.firstName ?? '');
    const last = normalizePersonName(member.lastName ?? '');
    if (!first || !last) return false;
    if (first === firstPart && (last === lastToken || last.startsWith(lastToken) || (lastToken.length === 1 && last.startsWith(lastToken)))) {
      return true;
    }
    if (last === firstPart && (first === lastToken || first.startsWith(lastToken) || (lastToken.length === 1 && first.startsWith(lastToken)))) {
      return true;
    }
    return false;
  });

  return candidates.length === 1 ? candidates[0] : null;
}

function activityEntityId(kind, date) {
  const prefix = kind === 'practice' ? 'rehearsal' : 'mass';
  return `${prefix}-${kind}-${date}`;
}

function attendanceRecordId(entityId, memberId) {
  return `att-${entityId}-${memberId}`;
}

function detectKind(path) {
  const name = basename(path);
  const hit = KIND_FROM_FILE.find((entry) => entry.test(name));
  return hit ?? null;
}

function parseMatrix(text, baseKind, splitMass) {
  const lines = stripBom(text).split(/\r?\n/).filter((l) => l.trim());
  const header = splitCsvLine(lines[0] ?? '');
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
      const kind = splitMass ? massKindForIsoDate(date) : baseKind;
      rows.push({ memberName, date, status, kind });
    }
  }
  const deduped = new Map();
  for (const row of rows) {
    deduped.set(`${row.kind}::${row.memberName.toLowerCase()}::${row.date}`, row);
  }
  return { rows: [...deduped.values()], dateCount: dateColumns.length };
}

function tenantEnvelope(ctx, overrides = {}) {
  return {
    tenantId: ctx.tenantId,
    parishId: ctx.parishId,
    choirId: ctx.choirId,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: 'import-attendance-csv',
    updatedBy: 'import-attendance-csv',
    status: 'active',
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function entityNameFor(kind, date) {
  const labels = {
    practice: 'Practice Session',
    special_mass: 'Special Mass',
    saturday_mass: 'Saturday Mass',
    sunday_mass: 'Sunday Mass',
    weekday_mass: 'Weekday Mass',
    feast_day: 'Feast Day',
    novena: 'Novena',
  };
  return `${labels[kind] ?? 'Mass'} · ${date}`;
}

async function loadMembers(db, ctx) {
  const snap = await db.collection('members')
    .where('parishId', '==', ctx.parishId)
    .where('tenantId', '==', ctx.tenantId)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function parseArgs(argv) {
  const files = [];
  let dryRun = false;
  let writeJson = false;
  let tenantId = process.env.ATTENDANCE_IMPORT_TENANT_ID || DEFAULT_TENANT_ID;
  let parishId = process.env.ATTENDANCE_IMPORT_PARISH_ID || DEFAULT_PARISH_ID;
  let choirId = process.env.ATTENDANCE_IMPORT_CHOIR_ID || DEFAULT_CHOIR_ID;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--write-json') writeJson = true;
    else if (arg === '--tenant-id') tenantId = argv[++i];
    else if (arg === '--parish-id') parishId = argv[++i];
    else if (arg === '--choir-id') choirId = argv[++i];
    else if (!arg.startsWith('-')) files.push(arg);
  }
  return { files, dryRun, writeJson, tenantId, parishId, choirId };
}

async function main() {
  const { files, dryRun, writeJson, tenantId, parishId, choirId } = parseArgs(process.argv.slice(2));
  const ctx = { tenantId, parishId, choirId };

  if (!files.length) {
    console.error('Provide one or more CSV file paths.');
    console.error('Example: npm run firebase:import-attendance -- --dry-run "C:/path/Mass.csv"');
    process.exit(1);
  }

  console.log(`Parish: ${ctx.parishId}`);
  console.log(`Tenant: ${ctx.tenantId}`);
  console.log(`Choir:  ${ctx.choirId}`);
  console.log(dryRun ? 'Mode:   DRY RUN (no writes)' : 'Mode:   LIVE import');

  let db = null;
  let members = [];
  try {
    db = getAdminFirestore();
    members = await loadMembers(db, ctx);
    console.log(`Loaded ${members.length} parish members for name matching.`);
  } catch (err) {
    if (!dryRun) throw err;
    console.warn(`\nNo Firebase Admin credentials — parse-only dry run (name matching skipped).`);
    console.warn(String(err.message || err));
  }

  const unmatchedNames = new Set();
  const matchedNames = new Set();
  const normalizedExport = [];
  const sessions = new Map();
  let totalMarks = 0;
  let matchedMarks = 0;

  for (const filePath of files) {
    const detected = detectKind(filePath);
    if (!detected) {
      console.warn(`Skipping ${filePath} — could not detect activity kind.`);
      continue;
    }

    const text = readFileSync(filePath, 'utf8');
    const { rows, dateCount } = parseMatrix(text, detected.kind, detected.splitMass);
    console.log(`\n${basename(filePath)} → base ${detected.kind}${detected.splitMass ? ' (split Sat/Sun)' : ''}`);
    console.log(`  date columns: ${dateCount}, marks: ${rows.length}`);

    const kindCounts = {};
    const csvNamesInFile = new Set();
    for (const row of rows) {
      totalMarks += 1;
      kindCounts[row.kind] = (kindCounts[row.kind] || 0) + 1;
      csvNamesInFile.add(row.memberName.trim());
      if (!members.length) continue;

      const member = matchMember(row.memberName, members);
      if (!member) {
        unmatchedNames.add(row.memberName.trim());
        continue;
      }
      matchedMarks += 1;
      matchedNames.add(`${member.firstName} ${member.lastName}`.trim());
      const key = `${row.kind}::${row.date}`;
      if (!sessions.has(key)) sessions.set(key, { kind: row.kind, date: row.date, marks: new Map() });
      sessions.get(key).marks.set(member.id, {
        status: row.status,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
      });
      normalizedExport.push({
        sourceFile: basename(filePath),
        kind: row.kind,
        date: row.date,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
        csvName: row.memberName,
        status: row.status,
        recordId: attendanceRecordId(activityEntityId(row.kind, row.date), member.id),
      });
    }
    console.log(`  by kind: ${JSON.stringify(kindCounts)}`);
    console.log(`  CSV names: ${[...csvNamesInFile].sort().join(', ')}`);
  }

  if (!members.length) {
    console.log(`\nParsed ${totalMarks} marks. Member matching skipped (no Admin credentials / empty roster).`);
  } else {
    console.log(`\nMatched marks: ${matchedMarks}/${totalMarks}`);
    console.log(`Matched roster names (${matchedNames.size}): ${[...matchedNames].sort().join(', ') || '(none)'}`);
    if (unmatchedNames.size) {
      console.log(`\nUNMATCHED CSV names (${unmatchedNames.size}) — register these or fix spelling before re-import:`);
      for (const name of [...unmatchedNames].sort((a, b) => a.localeCompare(b))) {
        console.log(`  - ${name}`);
      }
    } else {
      console.log('\nAll CSV names matched an existing member.');
    }
  }

  if (writeJson) {
    const outPath = resolve(SCRIPT_DIR, 'data', 'attendance-import-normalized.json');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify({
      generatedAt: NOW,
      tenantId: ctx.tenantId,
      parishId: ctx.parishId,
      choirId: ctx.choirId,
      unmatchedNames: [...unmatchedNames].sort((a, b) => a.localeCompare(b)),
      sessions: [...sessions.values()].map((s) => ({
        kind: s.kind,
        date: s.date,
        entityId: activityEntityId(s.kind, s.date),
        marks: Object.fromEntries([...s.marks.entries()].map(([id, mark]) => [id, mark])),
      })),
      records: normalizedExport,
    }, null, 2)}\n`);
    console.log(`\nWrote normalized JSON: ${outPath}`);
  }

  if (dryRun) {
    console.log(`\nDry run complete. Would upsert ${sessions.size} sessions / ${matchedMarks} attendance docs.`);
    return;
  }

  if (!db) {
    throw new Error('Firestore unavailable — cannot import.');
  }

  let batch = db.batch();
  let ops = 0;
  let importedRecords = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const session of sessions.values()) {
    const entityId = activityEntityId(session.kind, session.date);
    const entityType = session.kind === 'practice' ? 'Rehearsal' : 'Mass';
    const entityName = entityNameFor(session.kind, session.date);
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
        ...tenantEnvelope(ctx, { status: 'Completed' }),
      }, { merge: true });
    } else {
      batch.set(db.collection('masses').doc(entityId), {
        id: entityId,
        name: entityName,
        category: session.kind === 'special_mass'
          ? 'Special Mass'
          : session.kind === 'saturday_mass'
            ? 'Saturday Mass'
            : session.kind === 'weekday_mass'
              ? 'Weekday Mass'
              : session.kind === 'feast_day'
                ? 'Feast Day'
                : session.kind === 'novena'
                  ? 'Novena'
                  : 'Sunday Mass',
        date: session.date,
        time: session.kind === 'saturday_mass'
          ? '18:00'
          : session.kind === 'sunday_mass'
            ? '07:00'
            : session.kind === 'weekday_mass'
              ? '06:30'
              : '10:00',
        language: 'Tamil',
        attendingMemberIds: attendingIds,
        activityKind: session.kind,
        ...tenantEnvelope(ctx),
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
        ...tenantEnvelope(ctx, { status: mark.status }),
      }, { merge: true });
      ops += 1;
      importedRecords += 1;
      if (ops >= 400) await commitBatch();
    }
    if (ops >= 400) await commitBatch();
  }

  await commitBatch();
  console.log(`\nDone. Upserted ${importedRecords} attendance records across ${sessions.size} sessions.`);
  if (unmatchedNames.size) {
    console.log('Re-run after fixing unmatched names; existing matched rows stay idempotent.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
