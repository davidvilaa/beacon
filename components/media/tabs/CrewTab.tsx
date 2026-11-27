"use client";

import Link from "next/link";

interface CrewSection {
  key?: string;
  label: string;
  people: { id: number; name: string }[];
}

interface CrewTabProps {
  sections: CrewSection[];
  emptyMessage?: string;
}

export default function CrewTab({
  sections,
  emptyMessage = "No crew information available.",
}: CrewTabProps) {
  if (sections.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y divide-zinc-700/80">
      {sections.map((section, idx) => (
        <div
          key={section.key || `${section.label}-${idx}`}
          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors"
        >
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              {section.label}
            </span>
          </div>

          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {section.people.map((person) => (
              <Link
                key={person.id}
                href={`/person/${person.id}`}
                className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-700 border border-zinc-600/70 hover:brightness-75 transition cursor-pointer"
              >
                <span className="text-xs font-medium text-zinc-100">
                  {person.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
