import { doc, getDoc } from 'firebase/firestore';
import { DailyReading } from '../types';
import { db, ensureFirebaseConfigured } from './firebase';

/** Mirrors the server's getReadingDocId: Tamil docs are keyed by bare date. */
function readingDocId(date: string, language: string) {
  return language === 'ta' ? date : `${date}_${language}`;
}

/**
 * Reads a stored daily reading directly from Firestore.
 *
 * The backend API normally serves readings (and refreshes them from the
 * source), but when it is unreachable (sleeping/free-tier spin-down, outage,
 * or not deployed) this direct read keeps the feature working: security rules
 * allow public reads of dailyReadings docs where publicDisplay == true.
 */
export async function fetchStoredDailyReading(
  date: string,
  language = 'ta',
): Promise<DailyReading | null> {
  try {
    await ensureFirebaseConfigured();
    if (!db) return null;
    const snap = await getDoc(doc(db, 'dailyReadings', readingDocId(date, language)));
    if (!snap.exists()) return null;
    const data = snap.data() as DailyReading & { status?: string };
    if (data.publicDisplay === false || data.status === 'deleted') return null;
    return data;
  } catch {
    // Rules rejection or network failure — caller falls back to bundled data.
    return null;
  }
}
