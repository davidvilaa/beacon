"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Film, ChevronDown, ChevronUp } from "lucide-react";
import Loading from "@/components/ui/Loading";
import { getPosterUrl } from "@/lib/providers/tmdb/client";
import { formatFullDate } from "@/lib/media/format";
import type { Episode } from "@/lib/media/types";

interface EpisodesTabProps {
  episodes?: Episode[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function EpisodesTab({
  episodes,
  isLoading = false,
  emptyMessage = "No episode information available.",
}: EpisodesTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [episodes]);

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  const displayedEpisodes = isExpanded ? episodes : episodes.slice(0, 6);

  return (
    <div>
      <div className="divide-y divide-zinc-700/80">
        {displayedEpisodes.map((ep) => {
          const stillUrl = getPosterUrl(ep.still_path || null, "w500");

          return (
            <div
              key={ep.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors"
            >
              <div className="flex-1 min-w-0 pr-0 sm:pr-6">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-200">
                  E{String(ep.episode_number).padStart(2, "0")}. {ep.name}
                </h4>

                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                  <span>{formatFullDate(ep.air_date)}</span>
                  {ep.runtime ? (
                    <>
                      <span>•</span>
                      <span>{ep.runtime}m</span>
                    </>
                  ) : null}
                </div>

                {ep.overview && (
                  <p className="text-xs text-zinc-400 line-clamp-2 sm:line-clamp-3 mt-2 leading-relaxed">
                    {ep.overview}
                  </p>
                )}
              </div>

              <div className="relative w-full sm:w-44 md:w-48 aspect-video rounded-sm overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800/80">
                {stillUrl ? (
                  <Image
                    src={stillUrl}
                    alt={ep.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-zinc-600 bg-zinc-900">
                    <Film className="w-6 h-6 mb-1 text-zinc-700" />
                    <span className="text-[10px] text-zinc-500 font-semibold truncate max-w-[140px]">
                      {ep.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {episodes.length > 6 && (
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
