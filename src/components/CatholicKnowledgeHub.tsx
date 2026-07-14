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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50 px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1360px]">
        {/* Header */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-900 p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              ✝
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Catholic Knowledge Hub</h1>
              <p className="text-xs text-amber-200">Daily Gospel · Songs · Saints · Tamil Prayers · Liturgical Year</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-amber-800 text-white shadow'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
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
