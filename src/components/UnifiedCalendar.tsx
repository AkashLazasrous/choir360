import React, { useMemo, useState } from 'react';
import { Mass, ChoirEvent, Language, EventCategory } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
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

  // Calendar navigation state — starts on the real current month.
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(todayIso);

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
      className="p-3.5 bg-white rounded-xl border border-slate-200/60 text-xs space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <h5 className="font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
          {item.kind === 'mass'
            ? <Music className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            : <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          <span className="truncate">{item.name}</span>
        </h5>
        <span className={`shrink-0 px-2 py-0.5 font-bold rounded text-[9px] uppercase ${
          item.kind === 'mass'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {item.category}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.time || 'Time TBA'}</span>
        <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{item.place}</span>
      </p>
      {item.detail && (
        <p className="text-[10px] text-slate-500 leading-relaxed">{item.detail}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8 text-slate-800" id="unified-calendar-container">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <h2 className="font-sans font-bold text-xl text-slate-850">{dict.calendarTitle}</h2>
            <p className="text-xs text-slate-500">Universal diocesan calendar integration and Google/Outlook sync links</p>
          </div>
        </div>

        {/* View selector and sync tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync prompts */}
          <button
            onClick={() => handleSyncCalendar('Google')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3 h-3 text-emerald-600" />
            Sync Google Calendar
          </button>

          <button
            onClick={() => handleSyncCalendar('Outlook')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3 h-3 text-sky-600" />
            Sync Outlook
          </button>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md capitalize transition cursor-pointer ${
                  currentView === view ? 'bg-white text-slate-805 shadow-xs' : 'text-slate-500 hover:text-slate-805'
                }`}
              >
                {view} View
              </button>
            ))}
          </div>
        </div>
      </div>

      {addMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-805 border border-emerald-200 rounded-xl text-xs font-semibold">
          {addMsg}
        </div>
      )}

      {/* 2. Main structure: grid for calendar visual & side planner list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Calendar visual card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6" id="calendar-visual-grid-box">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              {MONTH_NAMES[cursor.month]} {cursor.year}
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                {monthItemCount} scheduled
              </span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToMonth(-1)}
                aria-label="Previous month"
                className="p-1 text-slate-600 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCursor({ year: now.getFullYear(), month: now.getMonth() });
                  setSelectedDate(todayIso);
                }}
                className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => goToMonth(1)}
                aria-label="Next month"
                className="p-1 text-slate-600 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly view Grid representation */}
          {currentView === 'month' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthGrid.map((dateIso, idx) => {
                  if (!dateIso) {
                    return <div key={`pad-${idx}`} className="p-3 bg-slate-50 border border-slate-100 rounded-xl h-20" />;
                  }

                  const dayItems = itemsByDate.get(dateIso) ?? [];
                  const hasMass = dayItems.some((i) => i.kind === 'mass');
                  const isToday = dateIso === todayIso;
                  const isSelected = dateIso === selectedDate;
                  const dayNum = dateIso.slice(-2);

                  let cellClass = 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-700';
                  if (dayItems.length > 0) {
                    cellClass = hasMass
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200';
                  }
                  if (isSelected) cellClass += ' ring-2 ring-emerald-600';
                  else if (isToday) cellClass += ' ring-2 ring-slate-300';

                  return (
                    <div
                      key={dateIso}
                      onClick={() => selectDay(dateIso)}
                      role="button"
                      title={dayItems.map((i) => `${i.time} ${i.name}`).join('\n') || undefined}
                      className={`p-2 rounded-xl text-center h-20 flex flex-col gap-0.5 transition cursor-pointer overflow-hidden ${cellClass}`}
                    >
                      <span className={`font-mono text-xs font-bold block text-left ${isToday ? 'text-emerald-700' : ''}`}>
                        {dayNum}
                      </span>

                      {dayItems.slice(0, 2).map((item) => (
                        <span
                          key={`${item.kind}-${item.id}`}
                          className={`text-[8px] font-bold tracking-tight truncate leading-tight block text-left px-0.5 py-px rounded ${
                            item.kind === 'mass' ? 'bg-amber-600/15' : 'bg-emerald-600/15'
                          }`}
                        >
                          {item.name}
                        </span>
                      ))}
                      {dayItems.length > 2 && (
                        <span className="text-[8px] text-slate-500 font-bold text-left">+{dayItems.length - 2} more</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agenda for selected day (always visible in month view; full panel in week/day view) */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100" id="agenda-viewer">
            {agendaDates.map((dateIso) => {
              const dayItems = itemsByDate.get(dateIso) ?? [];
              if (currentView === 'week' && dayItems.length === 0) return null;
              return (
                <div key={dateIso} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {formatFriendly(dateIso)}
                    {dateIso === todayIso && <span className="ml-2 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">TODAY</span>}
                  </h4>
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nothing scheduled — use the form to log a rehearsal, or add a mass under Liturgy &amp; Masses.</p>
                  ) : (
                    <div className="space-y-3">{dayItems.map(renderAgendaItem)}</div>
                  )}
                </div>
              );
            })}
            {currentView === 'week' && agendaDates.every((d) => (itemsByDate.get(d) ?? []).length === 0) && (
              <p className="text-xs text-slate-400 italic">Nothing scheduled this week.</p>
            )}
          </div>
        </div>

        {/* Dynamic Scheduler Add Form & Diocese Holidays card */}
        <div className="space-y-6" id="planner-form-card">

          {/* HOLIDAYS OF THE DIOCESE */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-850 space-y-3">
            <h4 className="font-sans font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-5 h-5" />
              Diocese Marian Feasts
            </h4>
            <div className="divide-y divide-slate-800 space-y-2 text-xs">
              {INDIAN_RC_HOLIDAYS_2026.map((h, i) => (
                <div key={i} className="pt-2 flex justify-between items-center bg-slate-950/20 p-2 rounded">
                  <div>
                    <p className="font-bold text-white">{h.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono">Holiday Mode • {h.date}</p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-400 rounded-md font-bold">
                    FEAST
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ADMIN CONSOLE: LOG EVENT REHEARSALS (ROLE DESKTOP) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4" id="rehearsal-creator">
            <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Log Choral Event / Rehearsal
            </h4>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs" id="calendar-event-form">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Event Title / Purpose</label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  placeholder="e.g. Marian Devotional Alto Rehearsal"
                  className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Liturgical Date</label>
                  <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Start Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={e => setNewEventTime(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className="w-full p-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Vibe Category</label>
                <select
                  value={newEventCategory}
                  onChange={e => setNewEventCategory(e.target.value as EventCategory)}
                  className="w-full p-1.5 border border-slate-200 rounded"
                >
                  <option value="Choir Practice">Choir Practice (Practice)</option>
                  <option value="Feast">Feast Day Masses</option>
                  <option value="Retreat">Retreat Preparation</option>
                  <option value="Parish Event">Parish General Assembly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Location / Rehearsal Venue</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={e => setNewEventLocation(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded"
                />
              </div>

              <button
                type="submit"
                id="create-event-btn"
                className="w-full py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
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
