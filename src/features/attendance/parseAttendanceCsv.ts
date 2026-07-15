import { ActivityKind, AttendanceStatus } from '../../types';
import { parseCsvMark, parseSheetDate } from '../../utils/attendanceActivity';

export interface CsvImportRow {
  memberName: string;
  date: string;
  status: AttendanceStatus;
}

export interface CsvImportResult {
  kind: ActivityKind;
  rows: CsvImportRow[];
  dateCount: number;
  memberCount: number;
  skippedCells: number;
}

/** Parse a choir attendance matrix CSV (Ambattur OT format). */
export function parseAttendanceMatrixCsv(text: string, kind: ActivityKind): CsvImportResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { kind, rows: [], dateCount: 0, memberCount: 0, skippedCells: 0 };
  }

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
      rows.push({ memberName, date, status });
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

/** Match CSV member name to roster member id (case-insensitive full name). */
export function matchMemberByName(
  memberName: string,
  members: { id: string; firstName: string; lastName: string }[],
): string | null {
  const normalized = memberName.trim().toLowerCase();
  const hit = members.find(
    (m) => `${m.firstName} ${m.lastName}`.trim().toLowerCase() === normalized,
  );
  return hit?.id ?? null;
}

/** Keep one mark per member + date (last cell wins). */
export function dedupeImportRows(rows: CsvImportRow[]): CsvImportRow[] {
  const map = new Map<string, CsvImportRow>();
  for (const row of rows) {
    map.set(`${row.memberName.toLowerCase()}::${row.date}`, row);
  }
  return [...map.values()];
}
