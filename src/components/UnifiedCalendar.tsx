import React, { useEffect, useMemo, useState } from 'react';
import { Mass, ChoirEvent, Language, EventCategory } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
  MoreHorizontal,
  PlusCircle,
  Award,
  Music,
  Users,
} from 'lucide-react';
import { INDIAN_RC_HOLIDAYS_2026, MULTILINGUAL_DICTIONARY } from '../data/mockData';

interface UnifiedCalendarProps {
  currentLang: Language;
  masses: Mass[];
  events: ChoirEvent[];
  onAddEvent: (evt: ChoirEvent) => void;
}

/** A mass or choir event normalized for calendar display. */
interface CalendarItem {
  kind: 'mass' | 'event';
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string;
  place: string;
  category: string;
  detail?: string;
}

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  currentLang,
  masses,
  events,
  onAddEvent
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;

  const todayIso = toIsoDate(new Date());

  // Calendar navigation — agenda/day-first on phone; month on larger screens.
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'day' : 'month',
  );
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [syncMenuOpen, setSyncMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => {
      if (mq.matches) setCurrentView((v) => (v === 'month' ? 'day' : v));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // New event form
  const [newEventName, setNewEventName] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>('Choir Practice');
  const [newEventDate, setNewEventDate] = useState(todayIso);
  const [newEventTime, setNewEventTime] = useState('06:00 PM');
  const [newEventLocation, setNewEventLocation] = useState('Parish choir loft');
  const [addMsg, setAddMsg] = useState('');

  // Normalize masses + events into a date-keyed map so every real record
  // shows up on the grid.
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    const push = (item: CalendarItem) => {
      if (!item.date) return;
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    };

    masses.forEach((m) => push({
      kind: 'mass',
      id: m.id,
      name: m.name,
      date: m.date,
      time: m.time,
      place: m.venue || 'Parish church',
      category: m.category,
      detail: [m.celebrant && `Celebrant: ${m.celebrant}`, m.notes].filter(Boolean).join(' • ') || undefined,
    }));

    events.forEach((e) => push({
      kind: 'event',
      id: e.id,
      name: e.name,
      date: e.date,
      time: e.time,
      place: e.location,
      category: e.category,
      detail: e.description || undefined,
    }));

    map.forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [masses, events]);

  const monthGrid = useMemo(() => {
    const firstDayOffset = new Date(cursor.year, cursor.month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<string | null> = Array.from({ length: firstDayOffset }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(`${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    return cells;
  }, [cursor]);

  const monthItemCount = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;
    let count = 0;
    itemsByDate.forEach((list, date) => { if (date.startsWith(prefix)) count += list.length; });
    return count;
  }, [itemsByDate, cursor]);

  // Upcoming agenda for the current month (mobile day view).
  const monthAgenda = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;
    const dates = Array.from(itemsByDate.keys())
      .filter((d) => d.startsWith(prefix))
      .sort();
    return dates.flatMap((date) =>
      (itemsByDate.get(date) ?? []).map((item) => ({ date, item })),
    );
  }, [itemsByDate, cursor]);

  // Dates shown in the agenda panel: the selected day, or its whole week.
  const agendaDates = useMemo(() => {
    if (currentView !== 'week') return [selectedDate];
    const base = new Date(`${selectedDate}T00:00:00`);
    const weekStart = new Date(base);
    weekStart.setDate(base.getDate() - base.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return toIsoDate(d);
    });
  }, [currentView, selectedDate]);

  const goToMonth = (delta: number) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const selectDay = (dateIso: string) => {
    setSelectedDate(dateIso);
  };

  const formatFriendly = (dateIso: string) => {
    const d = new Date(`${dateIso}T00:00:00`);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName) return;

    const newEvt: ChoirEvent = {
      id: `EV${Date.now().toString(36)}`,
      name: newEventName,
      category: newEventCategory,
      date: newEventDate,
      time: newEventTime,
      location: newEventLocation,
      description: "Soprano & Tenors presence requested for four-part rehearsals.",
      bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400",
      rsvps: {}
    };

    onAddEvent(newEvt);
    setNewEventName('');
    // Jump the calendar to the event's month and select its day so the
    // user immediately sees it on the grid.
    const evtDate = new Date(`${newEventDate}T00:00:00`);
    setCursor({ year: evtDate.getFullYear(), month: evtDate.getMonth() });
    setSelectedDate(newEventDate);
    setAddMsg(`Successfully logged choir event: ${newEvt.name}`);
    setTimeout(() => setAddMsg(''), 4000);
  };

  const handleSyncCalendar = (platform: string) => {
    alert(`Establishing secure synchronization with ${platform} Calendar...\n\nSyncing ${events.length} upcoming Choral rehearsals and ${masses.length} Liturgical parish services.\n\nChoir360 background pipelines are active!`);
  };

  const renderAgendaItem = (item: CalendarItem) => (
    <div
      key={`${item.kind}-${item.id}`}
      className="apple-card space-y-2 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h5 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold tracking-[-0.015em]">
          {item.kind === 'mass'
            ? <Music className="h-4 w-4 shrink-0 text-[#f5c24c]" />
            : <Users className="h-4 w-4 shrink-0 text-[#18392f]" />}
          <span className="truncate">{item.name}</span>
        </h5>
        <span className={`shrink-0 ${item.kind === 'mass' ? 'apple-badge-gold' : 'apple-badge-forest'}`}>
          {item.category}
        </span>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#86868b]">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.time || 'Time TBA'}</span>
        <span className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" />{item.place}</span>
      </p>
      {item.detail && (
        <p className="text-[13px] leading-relaxed text-[#86868b]">{item.detail}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8 font-apple text-[#1d1d1f]" id="unified-calendar-container">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-3 gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#18392f]" />
          <div>
            <h2 className="apple-title">{dict.calendarTitle}</h2>
            <p className="apple-caption">Universal diocesan calendar integration and Google/Outlook sync links</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {/* Sync overflow on phone */}
          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setSyncMenuOpen((o) => !o)}
              className="btn-pill btn-pill-secondary !min-h-[44px]"
              aria-label="Sync calendars"
            >
              <MoreHorizontal className="h-4 w-4" /> Sync
            </button>
            {syncMenuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-10" aria-label="Close" onClick={() => setSyncMenuOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[12rem] overflow-hidden rounded-2xl border border-black/[0.08] bg-white py-1 shadow-lg">
                  <button type="button" onClick={() => { handleSyncCalendar('Google'); setSyncMenuOpen(false); }}
                    className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    <ExternalLink className="h-4 w-4 text-[#18392f]" /> Google Calendar
                  </button>
                  <button type="button" onClick={() => { handleSyncCalendar('Outlook'); setSyncMenuOpen(false); }}
                    className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    <ExternalLink className="h-4 w-4 text-[#2997ff]" /> Outlook
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => handleSyncCalendar('Google')}
            className="btn-pill btn-pill-secondary btn-pill-sm hidden items-center gap-1 md:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#18392f]" />
            Sync Google
          </button>
          <button
            onClick={() => handleSyncCalendar('Outlook')}
            className="btn-pill btn-pill-secondary btn-pill-sm hidden items-center gap-1 md:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#2997ff]" />
            Sync Outlook
          </button>

          <div className="apple-segmented">
            {(['day', 'week', 'month'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                aria-selected={currentView === view}
                className={`min-h-[36px] capitalize ${currentView === view ? 'is-active' : ''}`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {addMsg && (
        <div className="apple-badge-forest p-3.5 text-xs font-medium">
          {addMsg}
        </div>
      )}

      {/* 2. Main structure: grid for calendar visual & side planner list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Calendar visual card */}
        <div className="lg:col-span-2 apple-card p-6 space-y-6" id="calendar-visual-grid-box">
          <div className="flex items-center justify-between">
            <h3 className="apple-title flex items-center gap-1.5 text-sm">
              {MONTH_NAMES[cursor.month]} {cursor.year}
              <span className="apple-badge-forest text-[10px] font-mono">
                {monthItemCount} scheduled
              </span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToMonth(-1)}
                aria-label="Previous month"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCursor({ year: now.getFullYear(), month: now.getMonth() });
                  setSelectedDate(todayIso);
                  setCurrentView('day');
                }}
                className="btn-pill btn-pill-secondary !min-h-[44px] !px-3"
              >
                Today
              </button>
              <button
                onClick={() => goToMonth(1)}
                aria-label="Next month"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Compact month dots — always available as a picker on phone */}
          {(currentView === 'month' || currentView === 'day') && (
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#86868b] md:text-[13px]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {monthGrid.map((dateIso, idx) => {
                  if (!dateIso) {
                    return <div key={`pad-${idx}`} className="aspect-square md:h-20 md:aspect-auto" />;
                  }

                  const dayItems = itemsByDate.get(dateIso) ?? [];
                  const hasMass = dayItems.some((i) => i.kind === 'mass');
                  const isToday = dateIso === todayIso;
                  const isSelected = dateIso === selectedDate;
                  const dayNum = Number(dateIso.slice(-2));

                  let cellClass = 'bg-white border border-black/[0.06] text-[#1d1d1f]';
                  if (dayItems.length > 0) {
                    cellClass = hasMass
                      ? 'bg-[rgba(245,194,76,0.16)] text-[#8a6a10] border border-[rgba(245,194,76,0.35)]'
                      : 'bg-[rgba(24,57,47,0.08)] text-[#18392f] border border-[rgba(24,57,47,0.18)]';
                  }
                  if (isSelected) cellClass += ' ring-2 ring-[#18392f]';
                  else if (isToday) cellClass += ' ring-2 ring-black/15';

                  return (
                    <button
                      key={dateIso}
                      type="button"
                      onClick={() => { selectDay(dateIso); if (window.matchMedia('(max-width: 767px)').matches) setCurrentView('day'); }}
                      title={dayItems.map((i) => `${i.time} ${i.name}`).join('\n') || undefined}
                      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl transition md:aspect-auto md:h-20 md:items-stretch md:justify-start md:p-2 ${cellClass}`}
                    >
                      <span className={`text-[14px] font-semibold md:text-left md:text-[13px] ${isToday ? 'text-[#18392f]' : ''}`}>
                        {dayNum}
                      </span>
                      {/* Phone: dots only. Desktop month: event labels. */}
                      <span className="flex items-center justify-center gap-0.5 md:hidden">
                        {dayItems.slice(0, 3).map((item) => (
                          <span
                            key={`${item.kind}-${item.id}`}
                            className={`h-1.5 w-1.5 rounded-full ${item.kind === 'mass' ? 'bg-[#f5c24c]' : 'bg-[#18392f]'}`}
                          />
                        ))}
                      </span>
                      <span className="hidden flex-col gap-0.5 overflow-hidden md:flex">
                        {dayItems.slice(0, 2).map((item) => (
                          <span
                            key={`${item.kind}-${item.id}`}
                            className={`truncate rounded px-0.5 text-left text-[11px] font-medium leading-tight ${
                              item.kind === 'mass' ? 'bg-[rgba(245,194,76,0.25)]' : 'bg-[rgba(24,57,47,0.15)]'
                            }`}
                          >
                            {item.name}
                          </span>
                        ))}
                        {dayItems.length > 2 && (
                          <span className="text-left text-[11px] font-medium text-[#86868b]">+{dayItems.length - 2}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agenda — primary on phone */}
          <div className="apple-inset space-y-4 p-4" id="agenda-viewer">
            {currentView === 'day' && (
              <>
                <h4 className="text-[15px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
                  {formatFriendly(selectedDate)}
                  {selectedDate === todayIso && <span className="ml-2 apple-badge-forest">Today</span>}
                </h4>
                {(itemsByDate.get(selectedDate) ?? []).length === 0 ? (
                  <p className="text-[14px] text-[#86868b]">Nothing scheduled this day.</p>
                ) : (
                  <div className="space-y-3">{(itemsByDate.get(selectedDate) ?? []).map(renderAgendaItem)}</div>
                )}
                {monthAgenda.length > 0 && (
                  <div className="space-y-3 border-t border-black/[0.06] pt-4 md:hidden">
                    <p className="apple-label">This month</p>
                    {monthAgenda.slice(0, 8).map(({ date, item }) => (
                      <button
                        key={`${date}-${item.kind}-${item.id}`}
                        type="button"
                        onClick={() => selectDay(date)}
                        className="flex w-full items-start gap-3 rounded-2xl bg-white p-3 text-left"
                      >
                        <span className="w-12 shrink-0 text-[12px] font-semibold text-[#86868b]">
                          {date.slice(8)}/{date.slice(5, 7)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-[#1d1d1f]">{item.name}</span>
                          <span className="text-[12px] text-[#86868b]">{item.time}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {currentView !== 'day' && agendaDates.map((dateIso) => {
              const dayItems = itemsByDate.get(dateIso) ?? [];
              if (currentView === 'week' && dayItems.length === 0) return null;
              return (
                <div key={dateIso} className="space-y-3">
                  <h4 className="text-[15px] font-semibold text-[#1d1d1f]">
                    {formatFriendly(dateIso)}
                    {dateIso === todayIso && <span className="ml-2 apple-badge-forest">Today</span>}
                  </h4>
                  {dayItems.length === 0 ? (
                    <p className="text-[14px] text-[#86868b]">Nothing scheduled.</p>
                  ) : (
                    <div className="space-y-3">{dayItems.map(renderAgendaItem)}</div>
                  )}
                </div>
              );
            })}
            {currentView === 'week' && agendaDates.every((d) => (itemsByDate.get(d) ?? []).length === 0) && (
              <p className="text-[14px] text-[#86868b]">Nothing scheduled this week.</p>
            )}
          </div>
        </div>

        {/* Dynamic Scheduler Add Form & Diocese Holidays card */}
        <div className="space-y-6" id="planner-form-card">

          {/* HOLIDAYS OF THE DIOCESE */}
          <div className="apple-hero-soft p-5 space-y-3">
            <h4 className="apple-label flex items-center gap-1.5 text-[#f5c24c]">
              <Award className="w-5 h-5" />
              Diocese Marian Feasts
            </h4>
            <div className="divide-y divide-white/10 space-y-2 text-xs">
              {INDIAN_RC_HOLIDAYS_2026.map((h, i) => (
                <div key={i} className="pt-2 flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div>
                    <p className="font-semibold tracking-tight text-[#f5f5f7]">{h.name}</p>
                    <p className="apple-caption font-mono">Holiday Mode • {h.date}</p>
                  </div>
                  <span className="apple-badge-gold text-[9px] font-mono font-semibold">
                    Feast
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ADMIN CONSOLE: LOG EVENT REHEARSALS (ROLE DESKTOP) */}
          <div className="apple-card p-6 space-y-4" id="rehearsal-creator">
            <h4 className="apple-title flex items-center gap-1 text-sm">
              <PlusCircle className="w-4 h-4 text-[#18392f]" />
              Log Choral Event / Rehearsal
            </h4>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs" id="calendar-event-form">
              <div className="space-y-1">
                <label className="apple-label">Event Title / Purpose</label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  placeholder="e.g. Marian Devotional Alto Rehearsal"
                  className="apple-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="apple-label">Liturgical Date</label>
                  <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="apple-input text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="apple-label">Start Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={e => setNewEventTime(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className="apple-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="apple-label">Vibe Category</label>
                <select
                  value={newEventCategory}
                  onChange={e => setNewEventCategory(e.target.value as EventCategory)}
                  className="apple-select text-xs"
                >
                  <option value="Choir Practice">Choir Practice (Practice)</option>
                  <option value="Feast">Feast Day Masses</option>
                  <option value="Retreat">Retreat Preparation</option>
                  <option value="Parish Event">Parish General Assembly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="apple-label">Location / Rehearsal Venue</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={e => setNewEventLocation(e.target.value)}
                  className="apple-input text-xs"
                />
              </div>

              <button
                type="submit"
                id="create-event-btn"
                className="btn-pill btn-pill-primary w-full"
              >
                Log Choral Session
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
