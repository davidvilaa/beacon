"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  Eye,
  Bookmark,
  Heart,
  PlayCircle,
  PauseCircle,
  XCircle,
  Check,
} from "lucide-react";

export type MediaStatus =
  | "watched"
  | "watching"
  | "paused"
  | "dropped"
  | "watchlist"
  | null;

interface MediaActionBarProps {
  mediaType: "movie" | "tv";
  status: MediaStatus;
  isFavorite: boolean;
  onOpenLogModal: () => void;
  onQuickStatusChange: (newStatus: MediaStatus) => void;
  onToggleFavorite: () => void;
}

export default function MediaActionBar({
  mediaType,
  status,
  isFavorite,
  onOpenLogModal,
  onQuickStatusChange,
  onToggleFavorite,
}: MediaActionBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const movieOptions: {
    statusKey: MediaStatus;
    label: string;
    icon: typeof Eye;
  }[] = [
    { statusKey: "watched", label: "Watched", icon: Eye },
    { statusKey: "watchlist", label: "Watchlist", icon: Bookmark },
  ];

  const tvOptions: {
    statusKey: MediaStatus;
    label: string;
    icon: typeof Eye;
  }[] = [
    { statusKey: "watched", label: "Watched", icon: Eye },
    { statusKey: "watching", label: "Watching", icon: PlayCircle },
    { statusKey: "paused", label: "Paused", icon: PauseCircle },
    { statusKey: "dropped", label: "Dropped", icon: XCircle },
    { statusKey: "watchlist", label: "Watchlist", icon: Bookmark },
  ];

  const statusOptions = mediaType === "movie" ? movieOptions : tvOptions;

  return (
    <div ref={containerRef} className="relative w-56 sm:w-full">
      <div className="flex items-stretch bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={onOpenLogModal}
          title="Log entry"
          className="flex-1 flex items-center justify-center py-3 sm:py-3.5 text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70 transition-colors cursor-pointer group"
        >
          <Plus className="w-5 h-5 stroke-[2] group-hover:scale-110 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Quick actions"
          className={`w-11 sm:w-12 shrink-0 flex items-center justify-center border-l border-zinc-800 transition-colors cursor-pointer ${
            isOpen
              ? "text-[#a8dadc] bg-zinc-800/70"
              : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#a8dadc]" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = status === opt.statusKey;
            return (
              <button
                key={opt.statusKey}
                type="button"
                onClick={() => {
                  onQuickStatusChange(isSelected ? null : opt.statusKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#a8dadc]/15 text-[#a8dadc]"
                    : "text-zinc-300 hover:bg-zinc-850 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}

          <div className="h-px bg-zinc-800/80 my-1" />

          <button
            type="button"
            onClick={() => {
              onToggleFavorite();
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isFavorite
                ? "bg-[#a8dadc]/15 text-[#a8dadc]"
                : "text-zinc-300 hover:bg-zinc-850 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Heart
                className={`w-4 h-4 stroke-[1.75] ${
                  isFavorite ? "fill-[#a8dadc]" : ""
                }`}
              />
              <span>Favourite</span>
            </div>
            {isFavorite && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>
        </div>
      )}
    </div>
  );
}
