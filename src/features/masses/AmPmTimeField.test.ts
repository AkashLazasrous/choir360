import { describe, expect, it } from 'vitest';
import { formatAmPmTime, parseAmPmTime } from './AmPmTimeField';

describe('parseAmPmTime / formatAmPmTime', () => {
  it('parses 12-hour strings with meridiem', () => {
    expect(parseAmPmTime('04:00 PM')).toEqual({ hour12: 4, minute: 0, meridiem: 'PM' });
    expect(parseAmPmTime('06:30 AM')).toEqual({ hour12: 6, minute: 30, meridiem: 'AM' });
  });

  it('parses 24-hour strings without meridiem', () => {
    expect(parseAmPmTime('16:00')).toEqual({ hour12: 4, minute: 0, meridiem: 'PM' });
    expect(parseAmPmTime('00:15')).toEqual({ hour12: 12, minute: 15, meridiem: 'AM' });
  });

  it('formats padded display strings', () => {
    expect(formatAmPmTime({ hour12: 4, minute: 0, meridiem: 'PM' })).toBe('04:00 PM');
    expect(formatAmPmTime({ hour12: 6, minute: 5, meridiem: 'AM' })).toBe('06:05 AM');
  });
});
