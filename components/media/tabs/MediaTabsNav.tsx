"use client";

import { useRef, useState, useEffect } from "react";

interface TabItem {
  key: string;
  label: string;
}

interface MediaTabsNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function MediaTabsNav({
  tabs,
  activeTab,
  onChange,
}: MediaTabsNavProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className="relative border-b border-zinc-800/60 mb-6">
      <div className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[tab.key] = el;
            }}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div
          className="absolute bottom-0 h-0.5 bg-accent transition-all duration-300 pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>
    </div>
  );
}
