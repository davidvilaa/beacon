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

export default function SeasonRevolver({
  seasons,
  activeSeason,
  onSelectSeason,
  className = "",
}: SeasonRevolverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  const sortedSeasons = useMemo(() => {
    const regular = (seasons || [])
      .filter((s) => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
    const specials = (seasons || []).filter((s) => s.season_number === 0);
    return [...regular, ...specials];
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (Math.abs(e.deltaY) < 15) return;
    if (e.deltaY > 0) {
      handleStep("down");
    } else {
      handleStep("up");
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartY(e.clientY);
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartY === null) return;
    const currentDelta = e.clientY - dragStartY;

    if (currentDelta > 26) {
      handleStep("up");
      setDragStartY(e.clientY);
    } else if (currentDelta < -26) {
      handleStep("down");
      setDragStartY(e.clientY);
    }
  };

  const handlePointerUp = () => {
    setDragStartY(null);
  };

  if (!sortedSeasons || sortedSeasons.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      onWheel={handleWheel}
    >
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
        className="relative w-16 sm:w-20 h-[210px] flex items-center justify-center overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        style={{ perspective: "500px" }}
      >
        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-zinc-950/90 to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-zinc-950/90 to-transparent pointer-events-none z-20" />

        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-9 rounded-lg border border-[#a8dadc]/60 bg-zinc-800/80 pointer-events-none z-10" />

        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {sortedSeasons.map((s, idx) => {
            const diff = idx - currentIndex;
            const isVisible = Math.abs(diff) <= 2;
            if (!isVisible) return null;

            const translateY = diff * 38;
            const rotateX = diff * -16;
            const scale = diff === 0 ? 1.05 : Math.abs(diff) === 1 ? 0.92 : 0.8;
            const opacity = diff === 0 ? 1 : Math.abs(diff) === 1 ? 0.85 : 0.35;

            const isSelected = diff === 0;
            const label =
              s.season_number === 0
                ? "S00"
                : `S${String(s.season_number).padStart(2, "0")}`;

            return (
              <button
                key={s.id || s.season_number}
                type="button"
                onClick={() => onSelectSeason(s.season_number)}
                title={s.name}
                className={`absolute inset-x-1 flex items-center justify-center py-1.5 rounded-md transition-all duration-300 ${
                  isSelected
                    ? "text-[#a8dadc] font-black text-sm sm:text-base tracking-wider cursor-default z-20"
                    : "text-zinc-300 font-bold text-xs sm:text-sm tracking-wider hover:text-white hover:bg-zinc-800/50 cursor-pointer z-10"
                }`}
                style={{
                  transform: `translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale})`,
                  opacity,
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
