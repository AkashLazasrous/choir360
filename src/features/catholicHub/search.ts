// Tamil-aware search helpers for the Catholic Hub song index.

/** Phonetic (romanised) hints mapped to Tamil spellings, so "anbe" finds "அன்பே". */
const tamilPhoneticHints: Record<string, string[]> = {
  anbe: ['அன்பே', 'அன்பு'],
  arul: ['அருள்', 'அருட்'],
  yesu: ['இயேசு', 'யேசு'],
  yesuve: ['இயேசுவே', 'யேசுவே'],
  varugai: ['வருகை', 'வருகைப்', 'வாருங்கள்'],
  thiru: ['திரு', 'திருப்பாடல்'],
  thiyanam: ['தியானம்', 'தியானப்'],
  dhiyanam: ['தியானம்', 'தியானப்'],
};

export function normalizeHubSearch(value: string) {
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandHubSearchQuery(query: string) {
  const normalized = normalizeHubSearch(query);
  const hints = Object.entries(tamilPhoneticHints)
    .filter(([key]) => normalized.includes(key))
    .flatMap(([, words]) => words.map(normalizeHubSearch));
  return [normalized, ...hints].filter(Boolean);
}
