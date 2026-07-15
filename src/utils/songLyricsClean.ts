/**
 * Strip site chrome / download watermarks from Catholic Hub song lyrics.
 * Used at scrape time, API read time, and client display time so existing
 * Firestore documents are cleaned without a full re-sync.
 */

const CHROME_LINE_PATTERNS: RegExp[] = [
  /^posted by/i,
  /^labels?:/i,
  /^இதற்கு குழுசேர்/,
  /^முகப்பு$/,
  /^நமது தளங்கள்/,
  /^♫\s*பாடல்கள்/,
  // "♫ பாடலைக் கேட்க / பதிவிறக்கம் செய்ய... ⇩ ♪" (and spelling variants)
  /^[♫♪\s⇩.…]*பாடலைக்/i,
  /♫\s*பாடலைக்/i,
  /♪\s*பாடலைக்/i,
  /பாடலைக்\s*கேட்க/i,
  /பதிவிறக்கம்\s*செய்ய/i,
  /பதிவிரக்கம்\s*செய்ய/i,
  /கேட்க\s*\/\s*பதிவ/i,
  /^⇩/,
  /^♪\s*♪/,
  /^-->/,
  /^<!--/,
  /^Site Info/i,
  /^Search in/i,
  /^Compare Bible/i,
  /^Font Converter/i,
  /Bible in Tamil/i,
  /^\d+\s*Dif\.\s*Bible/i,
];

/** Returns true when a line is site chrome, not song lyrics. */
export function isSongChromeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return CHROME_LINE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** Remove watermark / site chrome lines from a lyrics block. */
export function stripSongSiteChrome(lyrics: string): string {
  if (!lyrics) return '';

  const cleaned = lyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isSongChromeLine(line))
    .join('\n')
    // Collapse runs of blank lines left after stripping
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}
