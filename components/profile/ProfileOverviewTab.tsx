"use client";

import MediaCard from "@/components/media/MediaCard";
import type { MediaType } from "@/lib/media/types";

export interface FavoriteMediaItem {
  id: number | string;
  title: string;
  posterPath: string | null;
  href?: string;
  mediaType: MediaType;
}

interface ProfileOverviewTabProps {
  title: string;
  items: FavoriteMediaItem[];
  isLoading?: boolean;
}

export default function ProfileOverviewTab({
  title,
  items,
  isLoading = false,
}: ProfileOverviewTabProps) {
  const slots = Array.from({ length: 5 });

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
        {isLoading
          ? slots.map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] w-full rounded-sm bg-zinc-900/40 border border-zinc-800/40 animate-pulse"
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
                  />
                );
              }
              return (
                <div
                  key={index}
                  className="aspect-[2/3] w-full rounded-sm border border-dashed border-zinc-800/80 bg-zinc-900/10"
                />
              );
            })}
      </div>
    </div>
  );
}
