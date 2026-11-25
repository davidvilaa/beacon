"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, Check, Layers, CalendarSync } from "lucide-react";
import { getPosterUrl } from "@/lib/providers/tmdb/client";
import { formatFullDate } from "@/lib/media/format";

export interface ListCardData {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  isPrivate?: boolean;
  isNumbered?: boolean;
  itemCount?: number;
  updatedAt?: string;
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

  const formattedDate = list.updatedAt
    ? formatFullDate(list.updatedAt.split("T")[0])
    : null;

  const content = (
    <>
      {selectable && (
        <span
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm border flex items-center justify-center shrink-0 mt-1 sm:mt-1.5 transition-all ${
            selected
              ? "bg-accent border-accent text-zinc-950"
              : "bg-zinc-950/80 border-zinc-700 group-hover:border-zinc-500"
          }`}
        >
          {selected && <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[3]" />}
        </span>
      )}

      <div className="flex items-center shrink-0">
        {slots.map((posterPath, idx) => {
          const url = posterPath ? getPosterUrl(posterPath, "w342") : null;
          return (
            <div
              key={idx}
              style={{
                zIndex: 10 - idx,
              }}
              className={`relative w-20 sm:w-24 md:w-28 lg:w-32 aspect-[2/3] rounded-sm shrink-0 shadow-md transition-transform ${
                idx > 0 ? "-ml-10 sm:-ml-12 md:-ml-14 lg:-ml-16" : ""
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
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 112px, 128px"
                  className="object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-start gap-2 pt-0.5 sm:pt-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-100 tracking-tight leading-tight group-hover:text-accent transition-colors truncate">
            {list.title}
          </h3>
          {list.isPrivate && (
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 shrink-0" />
          )}
        </div>

        {list.author && (
          <p className="text-xs sm:text-sm text-zinc-400 -mt-0.5">
            by{" "}
            <span className="text-zinc-200 font-medium group-hover:text-accent transition-colors">
              {list.author}
            </span>
          </p>
        )}

        {(typeof list.itemCount === "number" || formattedDate) && (
          <div className="flex items-center gap-2.5 text-xs text-zinc-400 flex-wrap">
            {typeof list.itemCount === "number" && (
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>{list.itemCount}</span>
              </span>
            )}
            {typeof list.itemCount === "number" && formattedDate && (
              <span>•</span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1.5" title={`Updated: ${formattedDate}`}>
                <CalendarSync className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>
        )}

        {list.description && (
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
            {list.description}
          </p>
        )}
      </div>
    </>
  );

  const containerClasses = `group flex items-start gap-5 sm:gap-7 py-5 sm:py-6 px-3 sm:px-4 hover:bg-zinc-800/40 rounded-sm transition-colors cursor-pointer select-none text-left w-full ${className}`;

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
