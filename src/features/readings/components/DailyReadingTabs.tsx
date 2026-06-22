import React from 'react';
import { Layers } from 'lucide-react';
import { ReadingTabItem } from './MobileReadingTabs';

interface DailyReadingTabsProps<T extends string> {
  tabs: ReadingTabItem<T>[];
  activeTab: T;
  onSelect: (tab: T) => void;
}

export function DailyReadingTabs<T extends string>({ tabs, activeTab, onSelect }: DailyReadingTabsProps<T>) {
  return (
    <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
        <Layers className="h-3.5 w-3.5" />
        வாசகங்கள்
      </p>
      <nav className="flex flex-col gap-1" role="tablist" aria-label="Reading sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => onSelect(tab.key)}
            className={`rounded-lg px-3 py-2 text-left text-[13px] font-bold transition ${
              activeTab === tab.key
                ? 'bg-[#18392f] text-white'
                : tab.disabled
                  ? 'text-slate-300 hover:bg-slate-50'
                  : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
