import React, { useState } from 'react';
import { BookOpen, Star, Calendar, Heart, Music2 } from 'lucide-react';
import { DailyReadingsCard } from './bible/DailyReadingsCard';
import { HubSongsTab } from '../features/catholicHub/HubSongsTab';
import { HubSaintsTab } from '../features/catholicHub/HubSaintsTab';
import { HubPrayersTab } from '../features/catholicHub/HubPrayersTab';
import { HubCalendarTab } from '../features/catholicHub/HubCalendarTab';

type HubTab = 'gospel' | 'saints' | 'prayers' | 'calendar' | 'updates';

const TABS: { id: HubTab; label: string; icon: React.ElementType }[] = [
  { id: 'gospel',   label: 'Daily Gospel',    icon: BookOpen },
  { id: 'updates',  label: 'Songs',           icon: Music2 },
  { id: 'saints',   label: 'Saints',          icon: Star },
  { id: 'prayers',  label: 'Prayers',         icon: Heart },
  { id: 'calendar', label: 'Liturgical Year', icon: Calendar },
];

export const CatholicKnowledgeHub: React.FC = () => {
  // Deep links land on the songs tab when a #song- hash is present.
  const [tab, setTab] = useState<HubTab>(() =>
    window.location.hash.startsWith('#song-') ? 'updates' : 'gospel',
  );

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

        {/* Tabs */}
        <div className="apple-segmented mb-4 w-full overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 ${tab === t.id ? 'is-active' : ''}`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
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
