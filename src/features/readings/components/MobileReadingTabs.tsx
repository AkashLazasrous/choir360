import React, { useEffect, useRef } from 'react';

export interface ReadingTabItem<T extends string> {
  key: T;
  label: string;
  disabled?: boolean;
}

interface MobileReadingTabsProps<T extends string> {
  tabs: ReadingTabItem<T>[];
  activeTab: T;
  onSelect: (tab: T) => void;
}

export function MobileReadingTabs<T extends string>({ tabs, activeTab, onSelect }: MobileReadingTabsProps<T>) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeTab]);

  return (
    <div className="relative lg:hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-slate-50 to-transparent" />
      <div
        className="reading-tabs-scroll flex gap-2 overflow-x-auto whitespace-nowrap pb-2"
        role="tablist"
        aria-label="Reading sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={activeTab === tab.key ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => onSelect(tab.key)}
            className={`min-h-[44px] shrink-0 scroll-ml-6 snap-start rounded-full px-4 py-2 text-[12px] font-bold transition ${
              activeTab === tab.key
                ? 'bg-[#18392f] text-white shadow-sm'
                : tab.disabled
                  ? 'border border-slate-100 bg-white text-slate-300'
                  : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
