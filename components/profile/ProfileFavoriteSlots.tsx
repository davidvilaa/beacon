"use client";

import Link from "next/link";
import ProfileMediaCard, { ProfileMediaCardProps } from "./ProfileMediaCard";

export interface FavoriteSlotItem {
  id: number | string;
  title: string;
  posterPath: string | null;
  href: string;
  mediaType: "movie" | "tv";
  rating?: number | null;
  subtitle?: string | null;
}

interface ProfileFavoriteSlotsProps {
  title: string;
  items: FavoriteSlotItem[];
  viewAllHref?: string;
  isLoading?: boolean;
}

export default function ProfileFavoriteSlots({
  title,
  items,
  viewAllHref,
  isLoading = false,
}: ProfileFavoriteSlotsProps) {
  const slots = Array.from({ length: 5 });

  return (
    <section>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
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
                  <ProfileMediaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    href={item.href}
                    mediaType={item.mediaType}
                    rating={item.rating}
                    subtitle={item.subtitle}
                    isFavorite={true}
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
    </section>
  );
}
