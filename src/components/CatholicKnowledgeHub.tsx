import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Star, Calendar, Heart, Music2 } from 'lucide-react';
import { DailyReadingsCard } from './bible/DailyReadingsCard';
import { HubSongsTab } from '../features/catholicHub/HubSongsTab';
import { HubSaintsTab } from '../features/catholicHub/HubSaintsTab';
import { HubPrayersTab } from '../features/catholicHub/HubPrayersTab';
import { HubCalendarTab } from '../features/catholicHub/HubCalendarTab';

type HubTab = 'gospel' | 'saints' | 'prayers' | 'calendar' | 'updates';

const TABS: { id: HubTab; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: 'gospel',   label: 'Daily Gospel',    shortLabel: 'Gospel',   icon: BookOpen },
  { id: 'updates',  label: 'Songs',           shortLabel: 'Songs',    icon: Music2 },
  { id: 'saints',   label: 'Saints',          shortLabel: 'Saints',   icon: Star },
  { id: 'prayers',  label: 'Prayers',         shortLabel: 'Prayers',  icon: Heart },
  { id: 'calendar', label: 'Liturgical Year', shortLabel: 'Calendar', icon: Calendar },
];

export const CatholicKnowledgeHub: React.FC = () => {
  // Deep links land on the songs tab when a #song- hash is present.
  const [tab, setTab] = useState<HubTab>(() =>
    window.location.hash.startsWith('#song-') ? 'updates' : 'gospel',
  );
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-3 py-4 font-apple sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1360px]">
        {/* Header */}
        <div className="apple-hero-soft mb-6 p-6">
          <div className="choir-hero-ambient" aria-hidden />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              ✝
            </div>
            <div>
              <h1 className="apple-title text-[#f5f5f7]">Catholic Knowledge Hub</h1>
              <p className="apple-caption text-[#a1a1a6]">Daily Gospel · Songs · Saints · Tamil Prayers · Liturgical Year</p>
            </div>
          </div>
        </div>

        {/* Tabs — short labels always visible, horizontal scroll pills */}
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#f5f5f7] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#f5f5f7] to-transparent" />
          <div
            className="reading-tabs-scroll flex gap-2 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Catholic Knowledge Hub sections"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={tab === t.id ? activeTabRef : undefined}
                type="button"
                role="tab"
                onClick={() => setTab(t.id)}
                aria-selected={tab === t.id}
                aria-label={t.label}
                className={`flex min-h-[44px] shrink-0 snap-start items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  tab === t.id
                    ? 'bg-[#0e3d4c] text-white shadow-sm'
                    : 'border border-black/[0.08] bg-white text-[#1d1d1f]'
                }`}
              >
                <t.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gospel Tab — live-synced reading card (single source of truth for the
            daily reading date, shared with the Bible section). */}
        {tab === 'gospel' && (
          <div className="grid gap-4">
            <DailyReadingsCard />
          </div>
        )}

        {tab === 'updates' && <HubSongsTab />}
        {tab === 'saints' && <HubSaintsTab />}
        {tab === 'prayers' && <HubPrayersTab />}
        {tab === 'calendar' && <HubCalendarTab />}
      </div>
    </div>
  );
};
