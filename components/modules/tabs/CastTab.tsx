"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb";
import CardGradientBorder from "@/components/ui/CardGradientBorder";

interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

interface CastTabProps {
  cast: CastMember[];
  emptyMessage?: string;
}

export default function CastTab({
  cast,
  emptyMessage = "No cast information available.",
}: CastTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedCast = isExpanded ? cast : cast.slice(0, 12);

  if (cast.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
        {displayedCast.map((actor, idx) => {
          const profileUrl = actor.profile_path
            ? getPosterUrl(actor.profile_path, "w185")
            : null;

          return (
            <Link
              key={`${actor.id}-${idx}`}
              href={`/person/${actor.id}`}
              className="relative flex items-stretch rounded-lg bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0 overflow-hidden h-10 sm:h-11"
            >
              <CardGradientBorder roundedClassName="rounded-lg" />
              <div className="relative h-full aspect-square w-10 sm:w-11 shrink-0 bg-zinc-900 border-r border-zinc-700/60 overflow-hidden flex items-center justify-center">
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
              <div className="flex-1 min-w-0 px-2 sm:px-2.5 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate leading-tight">
                  {actor.name}
                </p>
                {actor.character && (
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
                    as <span className="text-zinc-300 font-medium">{actor.character}</span>
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {cast.length > 12 && (
        <div className="flex justify-start mt-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
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
