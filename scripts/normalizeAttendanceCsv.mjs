/**
 * Offline CSV → normalized JSON (no Firebase). Useful when Admin credentials
 * are not available yet; review marks before a live import.
 *
 *   node scripts/normalizeAttendanceCsv.mjs ^
 *     "C:/Users/dev-a/Downloads/Mass (1 jan - 15 jul).csv" ^
 *     "C:/Users/dev-a/Downloads/Practise Session (1 jan - 15 jul).csv" ^
 *     "C:/Users/dev-a/Downloads/Special Mass (1 jan - 15 jul).csv"
 *
 * Writes scripts/data/attendance-import-from-csv.json
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(SCRIPT_DIR, 'data', 'attendance-import-from-csv.json');

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

function detectKind(path) {
  const name = basename(path);
  return KIND_FROM_FILE.find((entry) => entry.test(name)) ?? null;
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
      rows.push({
        memberName,
        date,
        status,
        kind: splitMass ? massKindForIsoDate(date) : baseKind,
      });
    }
  }
  return rows;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Provide CSV paths.');
  process.exit(1);
}

const records = [];
const names = new Set();
const kindCounts = {};

for (const filePath of files) {
  const detected = detectKind(filePath);
  if (!detected) {
    console.warn(`Skipping ${filePath}`);
    continue;
  }
  const rows = parseMatrix(readFileSync(filePath, 'utf8'), detected.kind, detected.splitMass);
  console.log(`${basename(filePath)}: ${rows.length} marks`);
  for (const row of rows) {
    names.add(row.memberName);
    kindCounts[row.kind] = (kindCounts[row.kind] || 0) + 1;
    records.push({ sourceFile: basename(filePath), ...row });
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  note: 'Names only — memberId resolved at import time against Firestore roster.',
  parishId: 'church-of-sts-joseph-the-worker-philip-ambattur-ot',
  kindCounts,
  csvNames: [...names].sort((a, b) => a.localeCompare(b)),
  recordCount: records.length,
  records,
}, null, 2)}\n`);

console.log(`Wrote ${OUT}`);
console.log(`Names (${names.size}): ${[...names].sort().join(', ')}`);
console.log(`Kinds: ${JSON.stringify(kindCounts)}`);
