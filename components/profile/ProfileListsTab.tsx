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
        <div className="flex flex-col gap-6 sm:gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-5 sm:gap-7 p-3.5 sm:p-5 rounded-2xl animate-pulse">
              <div className="flex items-center shrink-0">
                {Array.from({ length: 5 }).map((__, idx) => (
                  <div
                    key={idx}
                    className={`relative w-20 sm:w-24 md:w-28 lg:w-32 aspect-[2/3] rounded-xl bg-zinc-800/40 border border-zinc-800/60 shrink-0 ${
                      idx > 0 ? "-ml-10 sm:-ml-12 md:-ml-14 lg:-ml-16" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <div className="h-6 sm:h-8 w-2/5 bg-zinc-800/60 rounded-md" />
                <div className="h-4 sm:h-5 w-3/4 bg-zinc-800/40 rounded" />
                <div className="h-4 sm:h-5 w-1/2 bg-zinc-800/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? null : (
        <div className="flex flex-col gap-6 sm:gap-8">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={{
                id: list.id,
                title: list.title,
                description: list.description,
                isPrivate: list.isPrivate,
                itemCount: list.itemCount,
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
