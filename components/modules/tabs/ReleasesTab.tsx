"use client";

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
  if (groups.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y divide-zinc-700/80">
      {groups.map((group) => (
        <div
          key={group.date}
          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors"
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
                className="inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700/80 overflow-hidden min-w-0"
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
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/50">
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
  );
}
