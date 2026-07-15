import { describe, expect, it } from 'vitest';
import { isSongChromeLine, stripSongSiteChrome } from './songLyricsClean';

describe('stripSongSiteChrome', () => {
  it('removes the catholictamil download watermark line', () => {
    const raw = [
      '♫ பாடலைக் கேட்க / பதிவிறக்கம் செய்ய... ⇩ ♪',
      'அடைக்கலப் பாறையான இயேசுவே தி.பா.71',
      'அடைக்கலப் பாறையான இயேசுவே எனக்குத் துணை',
    ].join('\n');

    const cleaned = stripSongSiteChrome(raw);
    expect(cleaned).not.toMatch(/பாடலைக் கேட்க/);
    expect(cleaned).not.toMatch(/பதிவிறக்கம்/);
    expect(cleaned).toContain('அடைக்கலப் பாறையான இயேசுவே எனக்குத் துணை');
  });

  it('removes the older spelling variant (பதிவிரக்கம்)', () => {
    expect(isSongChromeLine('♪ பாடலைக் கேட்க / பதிவிரக்கம் செய்ய...')).toBe(true);
  });

  it('keeps real lyric lines intact', () => {
    const line = 'ஆண்டவரே உம்மைப் பாடுவோம்';
    expect(isSongChromeLine(line)).toBe(false);
    expect(stripSongSiteChrome(line)).toBe(line);
  });
});
