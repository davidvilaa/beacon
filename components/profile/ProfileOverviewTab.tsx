"use client";

import Link from "next/link";
import MediaCard from "@/components/ui/MediaCard";

export interface FavoriteMediaItem {
  id: number | string;
  title: string;
  posterPath: string | null;
  href?: string;
  mediaType: "movie" | "tv";
  subtitle?: string | React.ReactNode;
}

interface ProfileOverviewTabProps {
  title: string;
  items: FavoriteMediaItem[];
  viewAllHref?: string;
  isLoading?: boolean;
}

export default function ProfileOverviewTab({
  title,
  items,
  viewAllHref,
  isLoading = false,
}: ProfileOverviewTabProps) {
  const slots = Array.from({ length: 5 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          {title}
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold text-zinc-500 hover:text-[#a8dadc] transition-colors cursor-pointer"
          >
            View all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
        {isLoading
          ? slots.map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] w-full rounded-xl bg-zinc-900/40 border border-zinc-800/40 animate-pulse"
              />
            ))
          : slots.map((_, index) => {
              const item = items[index];
              if (item) {
                return (
                  <MediaCard
                    key={item.id}
                    id={item.id}
                    mediaType={item.mediaType}
                    title={item.title}
                    posterPath={item.posterPath}
                    href={item.href}
                    subtitle={item.subtitle}
                  />
                );
              }
              return (
                <div
                  key={index}
                  className="aspect-[2/3] w-full rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/10"
                />
              );
            })}
      </div>
    </div>
  );
}
