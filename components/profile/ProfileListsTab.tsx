"use client";

import { Plus } from "lucide-react";
import ListCard from "@/components/ui/ListCard";

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
  isNumbered?: boolean;
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
      {isOwner && onCreateList && (
        <div className="mb-6 flex items-center justify-start">
          <button
            type="button"
            onClick={onCreateList}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#8ec5c8] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>New list</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="divide-y divide-zinc-700/80">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-5 sm:gap-7 py-5 sm:py-6 px-3 sm:px-4 animate-pulse"
            >
              <div className="flex items-center shrink-0">
                {Array.from({ length: 5 }).map((__, idx) => (
                  <div
                    key={idx}
                    className={`relative w-20 sm:w-24 md:w-28 lg:w-32 aspect-[2/3] rounded-sm bg-zinc-800/40 border border-zinc-800/60 shrink-0 ${
                      idx > 0 ? "-ml-10 sm:-ml-12 md:-ml-14 lg:-ml-16" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 space-y-3 min-w-0 pt-0.5 sm:pt-1">
                <div className="h-6 sm:h-8 w-2/5 bg-zinc-800/60 rounded-sm" />
                <div className="h-4 sm:h-5 w-3/4 bg-zinc-800/40 rounded-sm" />
                <div className="h-4 sm:h-5 w-1/2 bg-zinc-800/30 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? null : (
        <div className="divide-y divide-zinc-700/80">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={{
                id: list.id,
                title: list.title,
                description: list.description,
                isPrivate: list.isPrivate,
                isNumbered: list.isNumbered,
                itemCount: list.itemCount,
                updatedAt: list.updatedAt,
                previewPosters: list.previewItems.map((p) => p.posterPath),
              }}
              href={`/lists/${list.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
