"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, Plus, Film } from "lucide-react";
import CardGradientBorder from "@/components/ui/CardGradientBorder";
import { getPosterUrl } from "@/lib/tmdb";

export interface ProfileListPreviewItem {
  id: string;
  mediaType: string;
  mediaId: number;
  title: string;
  posterPath: string | null;
}

export interface ProfileListCard {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  itemCount: number;
  updatedAt: string;
  previewItems: ProfileListPreviewItem[];
}

interface ProfileListsTabProps {
  lists: ProfileListCard[];
  isOwner: boolean;
  isLoading?: boolean;
  onCreateList?: () => void;
}

export default function ProfileListsTab({
  lists,
  isOwner,
  isLoading = false,
  onCreateList,
}: ProfileListsTabProps) {
  return (
    <div>
      {isOwner && onCreateList && !isLoading && (
        <div className="mb-6 flex items-center justify-end">
          <button
            type="button"
            onClick={onCreateList}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#8ec5c8] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New list</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 overflow-hidden animate-pulse"
            >
              <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-zinc-950/60 border-b border-zinc-800/60">
                {Array.from({ length: 4 }).map((__, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="aspect-[2/3] w-full rounded-md bg-zinc-800/50"
                  />
                ))}
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 bg-zinc-800/60 rounded" />
                <div className="h-3 w-1/3 bg-zinc-800/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((list) => {
            const slots = Array.from({ length: 4 });

            return (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="relative flex flex-col rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/80 transition-all overflow-hidden group cursor-pointer"
              >
                <CardGradientBorder roundedClassName="rounded-xl" />

                <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-zinc-950/60 border-b border-zinc-800/70">
                  {slots.map((_, index) => {
                    const item = list.previewItems[index];
                    if (item) {
                      const posterUrl = getPosterUrl(item.posterPath, "w342");
                      return (
                        <div
                          key={item.id}
                          className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-zinc-900 border border-zinc-800/80"
                        >
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={item.title}
                              fill
                              sizes="(max-width: 640px) 22vw, (max-width: 1024px) 11vw, 90px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                              <Film className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className="aspect-[2/3] w-full rounded-md border border-dashed border-zinc-800/70 bg-zinc-900/20"
                      />
                    );
                  })}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-zinc-200 group-hover:text-[#a8dadc] transition-colors truncate">
                        {list.title}
                      </h4>
                      {list.isPrivate && (
                        <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      )}
                    </div>

                    {list.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-1">
                        {list.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 pt-1">
                    <span>
                      {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                    </span>
                    {list.isPrivate && <span>Private</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
