"use client";

import { Film } from "lucide-react";
import Select, { Option } from "@/components/ui/Select";
import MediaCard from "@/components/ui/MediaCard";

export interface ProfileMediaItem {
  id: number | string;
  title: string;
  posterPath: string | null;
  href?: string;
  mediaType: "movie" | "tv";
}

interface ProfileMediaTabProps {
  items: ProfileMediaItem[];
  statusValue: string;
  onStatusChange: (val: string) => void;
  statusOptions: Option[];
  sortValue: string;
  onSortChange: (val: string) => void;
  sortOptions: Option[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function ProfileMediaTab({
  items,
  statusValue,
  onStatusChange,
  statusOptions,
  sortValue,
  onSortChange,
  sortOptions,
  isLoading = false,
  emptyTitle = "No media found",
  emptyDescription = "There are no entries matching your current filters.",
}: ProfileMediaTabProps) {
  return (
    <div>
      <div className="pb-4 mb-6 border-b border-zinc-800/80 flex items-center gap-2.5 flex-wrap">
        <Select
          value={statusValue}
          onChange={onStatusChange}
          options={statusOptions}
          variant="compact"
          className="w-36 sm:w-40"
        />

        <Select
          value={sortValue}
          onChange={onSortChange}
          options={sortOptions}
          variant="compact"
          className="w-40 sm:w-44"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 min-[460px]:grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))] gap-2 sm:gap-2.5">
          {Array.from({ length: 30 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] w-full rounded-xl bg-zinc-900/40 border border-zinc-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex flex-col items-center justify-center text-center p-6 min-h-[260px]">
          <Film className="w-10 h-10 text-zinc-700 mb-3 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-zinc-300 mb-1">{emptyTitle}</h4>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 min-[460px]:grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))] gap-2 sm:gap-2.5">
          {items.map((item) => (
            <MediaCard
              key={`${item.mediaType}-${item.id}`}
              id={item.id}
              mediaType={item.mediaType}
              title={item.title}
              posterPath={item.posterPath}
              href={item.href}
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 85px"
            />
          ))}
        </div>
      )}
    </div>
  );
}
