"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Check,
  ChevronDown,
  Eye,
  Bookmark,
  Heart,
  PlayCircle,
  PauseCircle,
  XCircle,
  ListPlus,
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
  hasLog?: boolean;
  onOpenLogModal: () => void;
  onQuickStatusChange: (newStatus: MediaStatus) => void;
  onToggleFavorite: () => void;
  onOpenListModal?: () => void;
  children?: React.ReactNode;
  isReleased?: boolean;
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
  hasLog,
  onOpenLogModal,
  onQuickStatusChange,
  onToggleFavorite,
  onOpenListModal,
  children,
  isReleased = true,
  className = "",
}: MediaActionColumnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isClickable = hasMultiplePosters && Boolean(onOpenPosterPicker);
  const isLogged = hasLog !== undefined ? hasLog : Boolean(status);

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
    <div
      ref={containerRef}
      className={`relative w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center ${className}`}
    >
      <div className="relative w-56 sm:w-full">
        {children}

        <div
          onClick={isClickable ? onOpenPosterPicker : undefined}
          title={isClickable ? "Click to change poster" : undefined}
          className={`relative aspect-[2/3] w-full rounded-t-sm overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl ${
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
            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-zinc-900">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 leading-snug line-clamp-4 select-none">
                {title}
              </span>
            </div>
          )}

          {isClickable && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          )}
        </div>

        <div className="flex items-stretch bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-sm overflow-hidden shadow-xl">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenLogModal();
            }}
            title={isLogged ? "Edit log" : "Log entry"}
            className={`flex-1 flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer group ${
              isLogged
                ? "text-[#a8dadc] bg-zinc-800/70 hover:bg-zinc-800/90"
                : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
            }`}
          >
            {isLogged ? (
              <Check className="w-5 h-5 stroke-[2.2] group-hover:scale-110 transition-transform" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2] group-hover:scale-110 transition-transform" />
            )}
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
      </div>

      <div className="w-56 sm:w-full">
        <div
          className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen
              ? "grid-rows-[1fr] opacity-100 mt-2"
              : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`w-full bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden shadow-xl flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isOpen
                  ? "translate-y-0 scale-100"
                  : "-translate-y-3 scale-95"
              }`}
            >
              <div className="flex items-stretch divide-x divide-zinc-800">
                {statusOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = status === opt.statusKey;
                  const isAllowed = isReleased ? true : opt.statusKey === "watchlist";
                  return (
                    <button
                      key={opt.statusKey}
                      type="button"
                      disabled={!isAllowed}
                      tabIndex={isOpen ? 0 : -1}
                      onClick={() => {
                        if (!isAllowed) return;
                        onQuickStatusChange(isSelected ? null : opt.statusKey);
                      }}
                      title={!isAllowed ? "Not released yet" : opt.label}
                      className={`flex-1 flex items-center justify-center py-3 sm:py-3.5 transition-colors group ${
                        !isAllowed
                          ? "opacity-25 cursor-not-allowed text-zinc-600"
                          : isSelected
                          ? "text-[#a8dadc] bg-zinc-800/80 cursor-pointer"
                          : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70 cursor-pointer"
                      }`}
                    >
                      <Icon
                        className={`${iconSizeClass} transition-transform ${isAllowed ? "group-hover:scale-110" : ""} ${
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

              {onOpenListModal && (
                <button
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => {
                    setIsOpen(false);
                    onOpenListModal();
                  }}
                  title="Add to list"
                  aria-label="Add to list"
                  className="w-full border-t border-zinc-800 flex items-center justify-center py-2.5 sm:py-3 text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                >
                  <ListPlus className="w-5 h-5 stroke-[1.9] transition-transform group-hover:scale-110" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
