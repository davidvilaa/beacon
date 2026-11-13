"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, Film, Check } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb";

export interface ListCardData {
  id: string;
  title: string;
  description?: string | null;
  isPrivate?: boolean;
  itemCount: number;
  previewPosters?: (string | null)[];
}

interface ListCardProps {
  list: ListCardData;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  selectable?: boolean;
  className?: string;
}

const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4];

export default function ListCard({
  list,
  href,
  onClick,
  selected = false,
  selectable = false,
  className = "",
}: ListCardProps) {
  const posters = (list.previewPosters || []).slice(0, 5);

  const content = (
    <>
      {selectable && (
        <span
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
            selected
              ? "bg-[#a8dadc] border-[#a8dadc] text-zinc-950"
              : "bg-zinc-950/80 border-zinc-700 group-hover:border-zinc-500"
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </span>
      )}

      <div className="flex items-center shrink-0">
        {posters.length === 0 ? (
          <div className="relative w-12 sm:w-14 aspect-[2/3] rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 flex items-center justify-center text-zinc-700 shrink-0">
            <Film className="w-4 h-4 stroke-[1.5]" />
          </div>
        ) : (
          posters.map((posterPath, idx) => {
            const url = posterPath ? getPosterUrl(posterPath, "w342") : null;
            return (
              <div
                key={idx}
                style={{
                  opacity: OPACITIES[idx] ?? 0.4,
                  zIndex: 10 - idx,
                }}
                className={`relative w-12 sm:w-14 aspect-[2/3] rounded-lg overflow-hidden border border-zinc-800/90 bg-zinc-900 shadow-md shrink-0 transition-transform ${
                  idx > 0 ? "-ml-6 sm:-ml-7" : ""
                }`}
              >
                {url ? (
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 48px, 56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                    <Film className="w-4 h-4 stroke-[1.5]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-zinc-200 group-hover:text-[#a8dadc] transition-colors truncate">
            {list.title}
          </h4>
          {list.isPrivate && (
            <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          )}
        </div>

        {list.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {list.description}
          </p>
        )}

        <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
        </p>
      </div>
    </>
  );

  const containerClasses = `group flex items-center gap-3.5 sm:gap-4.5 p-2 -mx-2 rounded-xl hover:bg-zinc-900/30 transition-colors cursor-pointer select-none text-left ${className}`;

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={containerClasses}
    >
      {content}
    </div>
  );
}
