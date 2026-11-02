"use client";

import { Film } from "lucide-react";
import ProfileMediaCard, { ProfileMediaCardProps } from "./ProfileMediaCard";

interface ProfileMediaGridProps {
  items: ProfileMediaCardProps[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function ProfileMediaGrid({
  items,
  isLoading = false,
  emptyTitle = "No media found",
  emptyDescription = "There are no entries matching your current filters.",
}: ProfileMediaGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[2/3] w-full rounded-xl bg-zinc-900/40 border border-zinc-800/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex flex-col items-center justify-center text-center p-6 min-h-[260px]">
        <Film className="w-10 h-10 text-zinc-700 mb-3 stroke-[1.5]" />
        <h4 className="text-sm font-bold text-zinc-300 mb-1">{emptyTitle}</h4>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
      {items.map((item) => (
        <ProfileMediaCard
          key={`${item.mediaType}-${item.id}`}
          id={item.id}
          title={item.title}
          posterPath={item.posterPath}
          href={item.href}
          mediaType={item.mediaType}
          rating={item.rating}
          status={item.status}
          isFavorite={item.isFavorite}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  );
}
