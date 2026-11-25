"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReleaseCountry {
  code: string;
  country: string;
  certification?: string;
}

interface ReleaseGroup {
  date: string;
  formattedDate: string;
  countries: ReleaseCountry[];
}

interface ReleasesTabProps {
  groups: ReleaseGroup[];
  emptyMessage?: string;
}

export default function ReleasesTab({
  groups,
  emptyMessage = "No release date information available.",
}: ReleasesTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedGroups = isExpanded ? groups : groups.slice(0, 10);

  if (groups.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="divide-y divide-zinc-700/80">
        {displayedGroups.map((group) => (
          <div
            key={group.date}
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors"
          >
            <div className="w-32 sm:w-36 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                {group.formattedDate}
              </span>
            </div>

            <div className="flex-1 flex flex-wrap gap-2 items-center">
              {group.countries.map((c) => (
                <div
                  key={c.code}
                  className="inline-flex items-center rounded-sm bg-zinc-800 border border-zinc-700/80 overflow-hidden min-w-0"
                >
                  <img
                    src={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png`}
                    alt=""
                    className="w-6 self-stretch object-cover shrink-0 border-r border-zinc-700/60"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="flex items-center gap-1.5 px-2.5 py-1 min-w-0">
                    <span
                      className="text-xs font-medium text-zinc-200 truncate max-w-[140px] sm:max-w-[180px]"
                      title={c.country}
                    >
                      {c.country}
                    </span>
                    {c.certification && (
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded-sm bg-zinc-700/60 text-zinc-300 border border-zinc-600/50">
                        {c.certification}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {groups.length > 10 && (
        <div className="flex justify-start mt-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-accent/60 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <span>{isExpanded ? "less..." : "more..."}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
