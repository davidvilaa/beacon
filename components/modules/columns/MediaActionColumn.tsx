"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  ChevronDown,
  Eye,
  Bookmark,
  Heart,
  PlayCircle,
  PauseCircle,
  XCircle,
  Film,
} from "lucide-react";

export type MediaStatus =
  | "watched"
  | "watching"
  | "paused"
  | "dropped"
  | "watchlist"
  | null;

interface MediaActionColumnProps {
  posterUrl: string | null;
  title: string;
  hasMultiplePosters?: boolean;
  onOpenPosterPicker?: () => void;
  mediaType: "movie" | "tv";
  status: MediaStatus;
  isFavorite: boolean;
  onOpenLogModal: () => void;
  onQuickStatusChange: (newStatus: MediaStatus) => void;
  onToggleFavorite: () => void;
  children?: React.ReactNode;
  className?: string;
}

export default function MediaActionColumn({
  posterUrl,
  title,
  hasMultiplePosters = false,
  onOpenPosterPicker,
  mediaType,
  status,
  isFavorite,
  onOpenLogModal,
  onQuickStatusChange,
  onToggleFavorite,
  children,
  className = "",
}: MediaActionColumnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isClickable = hasMultiplePosters && Boolean(onOpenPosterPicker);

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

  const movieOptions = [
    { statusKey: "watched" as const, label: "Watched", icon: Eye },
    { statusKey: "watchlist" as const, label: "Watchlist", icon: Bookmark },
  ];

  const tvOptions = [
    { statusKey: "watched" as const, label: "Watched", icon: Eye },
    { statusKey: "watching" as const, label: "Watching", icon: PlayCircle },
    { statusKey: "paused" as const, label: "Paused", icon: PauseCircle },
    { statusKey: "dropped" as const, label: "Dropped", icon: XCircle },
    { statusKey: "watchlist" as const, label: "Watchlist", icon: Bookmark },
  ];

  const statusOptions = mediaType === "movie" ? movieOptions : tvOptions;
  const iconSizeClass =
    mediaType === "movie"
      ? "w-6 h-6"
      : "w-4.5 h-4.5 sm:w-5 sm:h-5";

  return (
    <div className={`relative w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center ${className}`}>
      {children}

      <div
        onClick={isClickable ? onOpenPosterPicker : undefined}
        title={isClickable ? "Click to change poster" : undefined}
        className={`relative aspect-[2/3] w-56 sm:w-full rounded-t-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl ${
          isClickable ? "cursor-pointer group" : ""
        }`}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 640px) 224px, 288px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
            <Film className="w-12 h-12 mb-2" />
            <span className="text-xs text-zinc-500">No poster</span>
          </div>
        )}

        {isClickable && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
      </div>

      <div ref={containerRef} className="relative w-56 sm:w-full">
        <div className="flex items-stretch bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl overflow-hidden shadow-xl">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenLogModal();
            }}
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
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                isOpen ? "rotate-180 text-[#a8dadc]" : ""
              }`}
            />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen
              ? "grid-rows-[1fr] opacity-100 mt-2"
              : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex items-stretch divide-x divide-zinc-800 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isOpen
                  ? "translate-y-0 scale-100"
                  : "-translate-y-3 scale-95"
              }`}
            >
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.statusKey;
                return (
                  <button
                    key={opt.statusKey}
                    type="button"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => onQuickStatusChange(isSelected ? null : opt.statusKey)}
                    title={opt.label}
                    className={`flex-1 flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer group ${
                      isSelected
                        ? "text-[#a8dadc] bg-zinc-800/80"
                        : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                    }`}
                  >
                    <Icon
                      className={`${iconSizeClass} transition-transform group-hover:scale-110 ${
                        isSelected
                          ? opt.statusKey === "watchlist"
                            ? "fill-[#a8dadc] stroke-[2]"
                            : "stroke-[2.2]"
                          : "stroke-[1.75]"
                      }`}
                    />
                  </button>
                );
              })}

              <button
                type="button"
                tabIndex={isOpen ? 0 : -1}
                onClick={onToggleFavorite}
                title="Favourite"
                className={`flex-1 flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer group ${
                  isFavorite
                    ? "text-[#a8dadc] bg-zinc-800/80"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <Heart
                  className={`${iconSizeClass} transition-transform group-hover:scale-110 ${
                    isFavorite
                      ? "fill-[#a8dadc] stroke-[2]"
                      : "stroke-[1.75]"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
