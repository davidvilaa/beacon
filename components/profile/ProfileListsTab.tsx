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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3.5 sm:gap-4 p-2 -mx-2 animate-pulse">
              <div className="flex items-center shrink-0">
                {Array.from({ length: 4 }).map((__, idx) => (
                  <div
                    key={idx}
                    className={`relative w-12 sm:w-14 aspect-[2/3] rounded-lg bg-zinc-800/40 border border-zinc-800/60 shrink-0 ${
                      idx > 0 ? "-ml-6 sm:-ml-7" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-zinc-800/60 rounded" />
                <div className="h-3 w-full bg-zinc-800/40 rounded" />
                <div className="h-2.5 w-1/3 bg-zinc-800/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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
