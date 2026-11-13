"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, Check } from "lucide-react";
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

const SLOTS_COUNT = 5;
const OPACITIES = [1, 0.88, 0.76, 0.65, 0.55];

export default function ListCard({
  list,
  href,
  onClick,
  selected = false,
  selectable = false,
  className = "",
}: ListCardProps) {
  const slots = Array.from({ length: SLOTS_COUNT }).map(
    (_, idx) => list.previewPosters?.[idx] ?? null
  );

  const content = (
    <>
      {selectable && (
        <span
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border flex items-center justify-center shrink-0 transition-all ${
            selected
              ? "bg-[#a8dadc] border-[#a8dadc] text-zinc-950"
              : "bg-zinc-950/80 border-zinc-700 group-hover:border-zinc-500"
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
        </span>
      )}

      <div className="flex items-center shrink-0">
        {slots.map((posterPath, idx) => {
          const url = posterPath ? getPosterUrl(posterPath, "w342") : null;
          return (
            <div
              key={idx}
              style={{
                opacity: OPACITIES[idx] ?? 0.55,
                zIndex: 10 - idx,
              }}
              className={`relative w-14 sm:w-18 md:w-20 aspect-[2/3] rounded-lg shrink-0 shadow-md transition-transform ${
                idx > 0 ? "-ml-7 sm:-ml-9 md:-ml-10" : ""
              } ${
                url
                  ? "overflow-hidden border border-zinc-800/90 bg-zinc-900"
                  : "border border-zinc-700 bg-zinc-800"
              }`}
            >
              {url && (
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 56px, (max-width: 768px) 72px, 80px"
                  className="object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-base sm:text-lg font-bold text-zinc-200 group-hover:text-[#a8dadc] transition-colors truncate">
            {list.title}
          </h4>
          {list.isPrivate && (
            <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          )}
        </div>

        {list.description && (
          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
            {list.description}
          </p>
        )}

        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
        </p>
      </div>
    </>
  );

  const containerClasses = `group flex items-center gap-4 sm:gap-5 p-3 rounded-xl hover:bg-zinc-900/40 transition-colors cursor-pointer select-none text-left w-full ${className}`;

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
