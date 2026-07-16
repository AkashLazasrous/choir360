import { ActivityKind, AttendanceStatus } from '../../types';
import { parseCsvMark, parseSheetDate } from '../../utils/attendanceActivity';

export interface CsvImportRow {
  memberName: string;
  date: string;
  status: AttendanceStatus;
  /** Resolved activity kind for this mark (Mass sheet may split Sat/Sun). */
  kind: ActivityKind;
}

export interface CsvImportResult {
  kind: ActivityKind;
  rows: CsvImportRow[];
  dateCount: number;
  memberCount: number;
  skippedCells: number;
}

export interface NameMatchMember {
  id: string;
  firstName: string;
  lastName: string;
}

/** Strip UTF-8 BOM and normalize newlines for Excel exports. */
export function stripCsvBom(text: string): string {
  return text.replace(/^\uFEFF/, '');
}

/**
 * Mass matrix CSVs often mix Saturday + Sunday (+ occasional midweek) columns.
 * Sat → saturday_mass; Sun and other weekdays → sunday_mass.
 */
export function massKindForIsoDate(isoDate: string): ActivityKind {
  const day = new Date(`${isoDate}T12:00:00.000Z`).getUTCDay();
  if (day === 6) return 'saturday_mass';
  return 'sunday_mass';
}

/** True when this filename is a mixed Mass sheet that should split by weekday. */
export function shouldSplitMassByWeekday(filename: string): boolean {
  const lower = filename.toLowerCase();
  if (lower.includes('special') || lower.includes('practis') || lower.includes('practice')) return false;
  if (lower.includes('saturday') || lower.includes('sat mass') || lower.includes('sat-')) return false;
  return lower.includes('mass') || lower.includes('sunday');
}

/** Parse a choir attendance matrix CSV (Ambattur OT format). */
export function parseAttendanceMatrixCsv(
  text: string,
  kind: ActivityKind,
  options?: { splitMassByWeekday?: boolean },
): CsvImportResult {
  const lines = stripCsvBom(text)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { kind, rows: [], dateCount: 0, memberCount: 0, skippedCells: 0 };
  }

  const splitMass = options?.splitMassByWeekday === true;
  const headerCells = splitCsvLine(lines[0]);
  const dateColumns: { index: number; date: string }[] = [];

  headerCells.forEach((cell, index) => {
    const iso = parseSheetDate(cell);
    if (iso) dateColumns.push({ index, date: iso });
  });

  const rows: CsvImportRow[] = [];
  let skippedCells = 0;
  const memberNames = new Set<string>();

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cells = splitCsvLine(lines[lineIndex]);
    const memberName = (cells[1] ?? '').trim();
    if (!memberName || /symbology|rules|attendances/i.test(memberName)) continue;

    memberNames.add(memberName);

    for (const { index, date } of dateColumns) {
      const status = parseCsvMark(cells[index]);
      if (!status) {
        if ((cells[index] ?? '').trim()) skippedCells += 1;
        continue;
      }
      const rowKind = splitMass ? massKindForIsoDate(date) : kind;
      rows.push({ memberName, date, status, kind: rowKind });
    }
  }

  const dedupedRows = dedupeImportRows(rows);

  return {
    kind,
    rows: dedupedRows,
    dateCount: dateColumns.length,
    memberCount: memberNames.size,
    skippedCells,
  };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
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

export function kindFromFilename(filename: string): ActivityKind | null {
  const lower = filename.toLowerCase();
  if (lower.includes('practis') || lower.includes('practice')) return 'practice';
  if (lower.includes('special')) return 'special_mass';
  if (lower.includes('saturday') || lower.includes('sat mass') || lower.includes('sat-')) return 'saturday_mass';
  if (lower.includes('mass') || lower.includes('sunday')) return 'sunday_mass';
  return null;
}

/** Normalize a person name for comparison (trim, case, accents, punctuation). */
export function normalizePersonName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Known CSV ↔ roster aliases for Ambattur OT sheets (and similar nicknames).
 * Keys and values are normalized via normalizePersonName.
 */
export const CSV_NAME_ALIASES: Record<string, string[]> = {
  'diana irudhayaraj': ['diana mary', 'diana mary irudhayaraj', 'diana m'],
  'jeniefer s': ['jenifer justin', 'jennifer justin', 'jenifer s', 'jeniefer justin', 'jenifer j'],
  'jansi j': ['jansi joseph', 'janci j', 'janci joseph'],
  'lincy j': ['lincy joseph', 'lincy j'],
  'sharon g': ['sharon gabriel', 'sharon g'],
  'tamizh arasi': ['tamil arasi', 'thamizh arasi', 'tamizharasi'],
  'virgin mary': ['virgin mary', 'mary virgin'],
  'stella jasper': ['stella jasper', 'stella j'],
  'pravin antony': ['pravin anthony', 'praveen antony'],
  'akash lazar': ['akash lazar', 'aakash lazar'],
};

function aliasTargets(normalizedCsvName: string): string[] {
  const direct = CSV_NAME_ALIASES[normalizedCsvName] ?? [];
  const reverse: string[] = [];
  for (const [csvAlias, rosterNames] of Object.entries(CSV_NAME_ALIASES)) {
    if (rosterNames.includes(normalizedCsvName)) reverse.push(csvAlias, ...rosterNames);
  }
  return [...new Set([normalizedCsvName, ...direct, ...reverse].map(normalizePersonName).filter(Boolean))];
}

function memberNameKeys(member: NameMatchMember): string[] {
  const first = normalizePersonName(member.firstName);
  const last = normalizePersonName(member.lastName);
  const full = `${first} ${last}`.trim();
  const swapped = `${last} ${first}`.trim();
  const keys = new Set<string>([full, swapped].filter(Boolean));
  // Also index first-only when last is a single letter (roster sometimes stores "S")
  if (first && last.length === 1) keys.add(`${first} ${last}`);
  return [...keys];
}

function namesLooselyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  // jeniefer / jenifer / jennifer
  const compact = (s: string) => s.replace(/[^a-z]/g, '');
  const ca = compact(a);
  const cb = compact(b);
  if (ca === cb) return true;
  if (ca.length >= 4 && cb.length >= 4 && (ca.startsWith(cb) || cb.startsWith(ca))) return true;
  return false;
}

/**
 * Match CSV member name to roster member id.
 * Supports exact full name, aliases, first/last swap, last-initial forms ("Sharon G"),
 * and unique first-name match when the CSV last token is an initial or alias.
 */
export function matchMemberByName(
  memberName: string,
  members: NameMatchMember[],
): string | null {
  const normalized = normalizePersonName(memberName);
  if (!normalized) return null;

  const targets = aliasTargets(normalized);

  for (const member of members) {
    const keys = memberNameKeys(member);
    if (keys.some((key) => targets.includes(key))) return member.id;
  }

  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length < 2) {
    // Single-token CSV name: unique first-name match only
    const firstOnly = members.filter((m) => normalizePersonName(m.firstName) === normalized);
    return firstOnly.length === 1 ? firstOnly[0]!.id : null;
  }

  const lastToken = parts[parts.length - 1]!;
  const firstPart = parts.slice(0, -1).join(' ');

  const candidates = members.filter((member) => {
    const first = normalizePersonName(member.firstName);
    const last = normalizePersonName(member.lastName);
    if (!first || !last) return false;

    const firstOk = namesLooselyEqual(first, firstPart) || targets.some((t) => {
      const tParts = t.split(' ');
      return tParts.length >= 2 && namesLooselyEqual(first, tParts.slice(0, -1).join(' '));
    });

    // "Sharon G" → firstName Sharon, lastName Gabriel / G
    if (firstOk && (last === lastToken || last.startsWith(lastToken) || (lastToken.length === 1 && last.startsWith(lastToken)))) {
      return true;
    }
    // swapped: "G Sharon"
    if (last === firstPart && (first === lastToken || first.startsWith(lastToken) || (lastToken.length === 1 && first.startsWith(lastToken)))) {
      return true;
    }
    // Alias / nickname: CSV "Diana Irudhayaraj" vs roster "Diana Mary"
    if (namesLooselyEqual(first, firstPart) && targets.some((t) => memberNameKeys(member).includes(t))) {
      return true;
    }
    return false;
  });

  if (candidates.length === 1) return candidates[0]!.id;

  // Unique first-name fallback when CSV last name is an initial or known alias miss
  if (lastToken.length === 1 || candidates.length === 0) {
    const byFirst = members.filter((m) => namesLooselyEqual(normalizePersonName(m.firstName), firstPart));
    if (byFirst.length === 1) return byFirst[0]!.id;
  }

  return null;
}

/** Match many CSV names; returns unique unmatched display names (sorted). */
export function collectUnmatchedNames(
  names: string[],
  members: NameMatchMember[],
): string[] {
  const unmatched = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || matchMemberByName(trimmed, members)) continue;
    const key = normalizePersonName(trimmed);
    if (!unmatched.has(key)) unmatched.set(key, trimmed);
  }
  return [...unmatched.values()].sort((a, b) => a.localeCompare(b));
}

/** Keep one mark per member + date + kind (last cell wins). */
export function dedupeImportRows(rows: CsvImportRow[]): CsvImportRow[] {
  const map = new Map<string, CsvImportRow>();
  for (const row of rows) {
    map.set(`${row.kind}::${row.memberName.toLowerCase()}::${row.date}`, row);
  }
  return [...map.values()];
}
