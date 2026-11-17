"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";
import { formatRuntime, formatFullDate } from "@/lib/media-utils";

interface MediaInfoColumnProps {
  typeLabel: string;
  title: string;
  originalTitle?: string | null;
  releaseDate?: string | null;
  runtimeMinutes?: number | null;
  episodesCount?: number | null;
  tagline?: string | null;
  overview?: string | null;
  children?: React.ReactNode;
  className?: string;
}

export default function MediaInfoColumn({
  typeLabel,
  title,
  originalTitle,
  releaseDate,
  runtimeMinutes,
  episodesCount,
  tagline,
  overview,
  children,
  className = "",
}: MediaInfoColumnProps) {
  const formattedDate = formatFullDate(releaseDate);

  return (
    <div className={`flex-1 min-w-0 w-full ${className}`}>
      <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">
        {typeLabel}
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
        {title}
      </h1>

      {originalTitle && originalTitle !== title && (
        <p className="text-sm text-zinc-500 italic mt-1">
          {originalTitle}
        </p>
      )}

      <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-3 pb-3 border-b border-zinc-800/80 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>{formattedDate}</span>
        </span>
        {typeof runtimeMinutes === "number" && runtimeMinutes > 0 && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatRuntime(runtimeMinutes)}</span>
            </span>
          </>
        )}
        {typeof episodesCount === "number" && episodesCount > 0 && (
          <>
            <span>•</span>
            <span>{episodesCount} Episodes</span>
          </>
        )}
      </div>

      <div className="mt-5 space-y-2 max-w-2xl">
        {tagline && (
          <p className="text-sm italic font-medium text-[#a8dadc]">
            &ldquo;{tagline}&rdquo;
          </p>
        )}
        <p className="text-sm text-zinc-300 leading-relaxed">
          {overview || "No overview available."}
        </p>
      </div>

      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
