"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { getPosterUrl } from "@/lib/providers/tmdb/client";

export interface CastMember {
  id: number | string;
  name: string;
  character?: string;
  profile_path?: string | null;
  character_image?: string | null;
  href?: string;
}

export interface CastTabProps {
  cast: CastMember[];
  emptyMessage?: string;
}

const COLLAPSED_ROWS_HEIGHT = 124;
const COLLAPSED_LIMIT = 30;

export default function CastTab({
  cast,
  emptyMessage = "No cast information available.",
}: CastTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClipped, setIsClipped] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const displayedCast = isExpanded ? cast : cast.slice(0, COLLAPSED_LIMIT);
  const hasMore = isClipped || cast.length > COLLAPSED_LIMIT;
  const fillsRows = !isExpanded && hasMore;

  useEffect(() => {
    const list = listRef.current;
    if (!list || isExpanded) return;
    const observer = new ResizeObserver(() => {
      const items = list.querySelectorAll<HTMLElement>("[data-chip]");
      const last = items[items.length - 1];
      setIsClipped(Boolean(last && last.offsetTop >= COLLAPSED_ROWS_HEIGHT));
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [cast, isExpanded]);
  if (cast.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div>
      <div
        ref={listRef}
        className={`relative flex flex-wrap gap-2 ${isExpanded ? "" : "max-h-[124px] overflow-hidden"}`}
      >
        {displayedCast.map((actor, idx) => {
          const profileUrl = actor.profile_path
            ? actor.profile_path.startsWith("http")
              ? actor.profile_path
              : getPosterUrl(actor.profile_path, "w185")
            : null;

          const targetHref = actor.href || (actor.id ? `/person/${actor.id}` : null);

          const content = (
            <>
              <div className="relative w-9 self-stretch shrink-0 bg-zinc-900 border-r border-zinc-600/70 overflow-hidden flex items-center justify-center">
                {profileUrl ? (
                  <Image
                    src={profileUrl}
                    alt={actor.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <div className="flex-1 min-w-0 px-2.5 flex flex-col justify-center">
                <p className="text-xs font-semibold text-zinc-100 truncate leading-tight">
                  {actor.name}
                </p>
                {actor.character && (
                  <p className="text-[10px] text-zinc-300 truncate leading-tight mt-0.5">
                    as <span className="text-zinc-100 font-medium">{actor.character}</span>
                  </p>
                )}
              </div>
              {actor.character_image && (
                <div className="relative w-9 self-stretch shrink-0 bg-zinc-900 border-l border-zinc-600/70 overflow-hidden flex items-center justify-center">
                  <Image
                    src={actor.character_image}
                    alt={actor.character || ""}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              )}
            </>
          );

          if (targetHref) {
            return (
              <Link
                key={`${actor.id}-${idx}`}
                href={targetHref}
                data-chip
                className="grow inline-flex items-stretch max-w-full min-w-0 h-9 overflow-hidden rounded-sm bg-zinc-700/60 border border-zinc-600/50 hover:brightness-75 transition cursor-pointer"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={`${actor.id}-${idx}`}
              data-chip
              className="grow inline-flex items-stretch max-w-full min-w-0 h-9 overflow-hidden rounded-sm bg-zinc-700/60 border border-zinc-600/50"
            >
              {content}
            </div>
          );
        })}
        {!fillsRows && <span aria-hidden="true" className="h-0 grow-[999]" />}
      </div>

      {hasMore && (
        <div className="flex justify-start mt-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:brightness-75 transition cursor-pointer"
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
