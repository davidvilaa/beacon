"use client";

import Link from "next/link";
import { Film, Star, StarHalf, AlignJustify } from "lucide-react";
import Select, { Option } from "@/components/ui/Select";
import MediaCard from "@/components/ui/MediaCard";

export interface ProfileMediaItem {
  id: number | string;
  entryLogId?: string;
  title: string;
  posterPath: string | null;
  href?: string;
  mediaType: "movie" | "tv";
  rating?: number | null;
  review?: string | null;
  seasonNumber?: number;
  hasSpoilers?: boolean;
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
      <div className="mb-6 flex items-center gap-2.5 flex-wrap">
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
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3">
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="flex flex-col min-w-0">
              <div className="aspect-[2/3] w-full rounded-sm bg-zinc-900/40 border border-zinc-800/40 animate-pulse" />
              <div className="flex items-center justify-between mt-1.5 px-0.5 animate-pulse">
                <div className="h-3 w-16 bg-zinc-800/50 rounded-sm" />
                <div className="h-3.5 w-3.5 bg-zinc-800/50 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 rounded-sm border border-zinc-800/40 bg-zinc-900/10 flex flex-col items-center justify-center text-center p-6 min-h-[260px]">
          <Film className="w-10 h-10 text-zinc-700 mb-3 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-zinc-300 mb-1">{emptyTitle}</h4>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3">
          {items.map((item) => (
            <div key={`${item.mediaType}-${item.id}`} className="flex flex-col min-w-0">
              <MediaCard
                id={item.id}
                mediaType={item.mediaType}
                title={item.title}
                posterPath={item.posterPath}
                href={item.href}
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 125px"
              />

              <div className="flex items-center justify-between mt-1.5 px-0.5 w-full">
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  title={item.rating ? `Rating: ${item.rating} / 5` : "Unrated"}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const val = Number(item.rating) || 0;
                    const isFull = val >= star;
                    const isHalf = !isFull && val >= star - 0.5;

                    return (
                      <div key={star} className="relative w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0">
                        <Star className="w-full h-full text-zinc-700/80 stroke-[1.5]" />
                        {isFull && (
                          <div className="absolute inset-0">
                            <Star className="w-full h-full text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                          </div>
                        )}
                        {isHalf && (
                          <StarHalf className="absolute inset-0 w-full h-full text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {item.entryLogId ? (
                  <Link
                    href={`/review/${item.entryLogId}?type=${item.mediaType}`}
                    title={item.review ? "Read review" : "View review"}
                    className={`p-0.5 transition-colors cursor-pointer shrink-0 ${
                      item.review
                        ? "text-zinc-400 hover:text-[#a8dadc]"
                        : "text-zinc-600 hover:text-[#a8dadc]"
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0 opacity-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
