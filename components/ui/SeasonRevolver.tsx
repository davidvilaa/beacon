"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TvSeasonSummary } from "@/lib/tmdb";

interface SeasonRevolverProps {
  seasons: TvSeasonSummary[];
  activeSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
  className?: string;
}

const ITEM_HEIGHT = 40;
const CONTAINER_HEIGHT = 200;

export default function SeasonRevolver({
  seasons,
  activeSeason,
  onSelectSeason,
  className = "",
}: SeasonRevolverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const sortedSeasons = useMemo(() => {
    return (seasons || [])
      .filter((s) => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
  }, [seasons]);

  const currentIndex = useMemo(() => {
    const idx = sortedSeasons.findIndex((s) => s.season_number === activeSeason);
    return idx >= 0 ? idx : 0;
  }, [sortedSeasons, activeSeason]);

  const handleStep = useCallback(
    (direction: "up" | "down") => {
      if (sortedSeasons.length <= 1) return;
      if (direction === "up" && currentIndex > 0) {
        onSelectSeason(sortedSeasons[currentIndex - 1].season_number);
      } else if (direction === "down" && currentIndex < sortedSeasons.length - 1) {
        onSelectSeason(sortedSeasons[currentIndex + 1].season_number);
      }
    },
    [currentIndex, sortedSeasons, onSelectSeason]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sortedSeasons.length <= 1) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    dragStartYRef.current = e.clientY;
    hasDraggedRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    if (e.buttons === 0) {
      handlePointerUp(e);
      return;
    }
    let delta = e.clientY - dragStartYRef.current;
    if (Math.abs(delta) > 4) {
      hasDraggedRef.current = true;
    }
    if (
      (currentIndex === 0 && delta > 0) ||
      (currentIndex === sortedSeasons.length - 1 && delta < 0)
    ) {
      delta *= 0.35;
    }
    setDragOffset(delta);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const delta = e.clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (Math.abs(delta) >= 18) {
      if (delta > 0) {
        handleStep("up");
      } else {
        handleStep("down");
      }
    }

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  if (!sortedSeasons || sortedSeasons.length === 0) {
    return null;
  }

  const centerOffset = CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2;
  const trackTranslateY = centerOffset - currentIndex * ITEM_HEIGHT + dragOffset;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <button
        type="button"
        onClick={() => handleStep("up")}
        disabled={currentIndex <= 0}
        aria-label="Previous Season"
        className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-15 disabled:cursor-not-allowed transition-colors cursor-pointer mb-1"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-16 sm:w-20 h-[200px] flex items-center justify-center overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-10 rounded-lg border border-[#a8dadc]/60 bg-zinc-800/80 pointer-events-none z-0" />

        <div
          className="absolute inset-x-0 top-0 flex flex-col w-full z-10"
          style={{
            transform: `translateY(${trackTranslateY}px)`,
            transition: isDragging
              ? "none"
              : "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {sortedSeasons.map((s, idx) => {
            const diff = idx - currentIndex;
            const isSelected = diff === 0;
            const label = `S${String(s.season_number).padStart(2, "0")}`;

            const scale =
              diff === 0
                ? 1.06
                : Math.abs(diff) === 1
                ? 0.95
                : Math.abs(diff) === 2
                ? 0.82
                : 0.7;

            const opacity =
              diff === 0
                ? 1
                : Math.abs(diff) === 1
                ? 0.75
                : Math.abs(diff) === 2
                ? 0.4
                : 0.15;

            return (
              <button
                key={s.id || s.season_number}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasDraggedRef.current && idx !== currentIndex) {
                    onSelectSeason(s.season_number);
                  }
                }}
                title={s.name}
                className={`w-full h-10 flex items-center justify-center rounded-md transition-colors ${
                  isSelected
                    ? "text-[#a8dadc] font-black text-sm sm:text-base tracking-wider cursor-default"
                    : "text-zinc-400 font-bold text-xs sm:text-sm tracking-wider hover:text-white cursor-pointer"
                }`}
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  transition: isDragging
                    ? "none"
                    : "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms ease, color 200ms ease",
                }}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleStep("down")}
        disabled={currentIndex >= sortedSeasons.length - 1}
        aria-label="Next Season"
        className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-15 disabled:cursor-not-allowed transition-colors cursor-pointer mt-1"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
