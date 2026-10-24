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
  const dragStartTimeRef = useRef<number>(0);
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
    dragStartTimeRef.current = Date.now();
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
    const delta = e.clientY - dragStartYRef.current;
    if (Math.abs(delta) > 5) {
      hasDraggedRef.current = true;
    }

    const maxDragDown = currentIndex * ITEM_HEIGHT;
    const maxDragUp = (sortedSeasons.length - 1 - currentIndex) * ITEM_HEIGHT;

    let clampedDelta = delta;
    if (delta > maxDragDown) {
      clampedDelta = maxDragDown + (delta - maxDragDown) * 0.25;
    } else if (delta < -maxDragUp) {
      clampedDelta = -maxDragUp + (delta - (-maxDragUp)) * 0.25;
    }

    setDragOffset(clampedDelta);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const delta = e.clientY - dragStartYRef.current;
    const duration = Math.max(1, Date.now() - dragStartTimeRef.current);
    const velocity = delta / duration;

    const wasDrag = hasDraggedRef.current && Math.abs(delta) >= 8;

    dragStartYRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (wasDrag) {
      let stepChange = Math.round(-delta / ITEM_HEIGHT);
      if (Math.abs(velocity) > 0.5 && Math.abs(stepChange) < 1) {
        stepChange = Math.sign(-velocity);
      }
      const newIndex = Math.max(
        0,
        Math.min(sortedSeasons.length - 1, currentIndex + stepChange)
      );
      if (newIndex !== currentIndex) {
        onSelectSeason(sortedSeasons[newIndex].season_number);
      }
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clickY = e.clientY - rect.top;
        const diffFromCenter = Math.round((clickY - CONTAINER_HEIGHT / 2) / ITEM_HEIGHT);
        const clickedIndex = currentIndex + diffFromCenter;
        if (
          clickedIndex >= 0 &&
          clickedIndex < sortedSeasons.length &&
          clickedIndex !== currentIndex
        ) {
          onSelectSeason(sortedSeasons[clickedIndex].season_number);
        }
      }
    }

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  if (!sortedSeasons || sortedSeasons.length === 0) {
    return null;
  }

  const effectiveIndex = isDragging
    ? currentIndex - dragOffset / ITEM_HEIGHT
    : currentIndex;

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
          perspective: "450px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      >
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-10 rounded-lg border border-[#a8dadc]/60 bg-zinc-800/80 pointer-events-none z-0" />

        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {sortedSeasons.map((s, idx) => {
            const diff = idx - effectiveIndex;
            const isVisible = Math.abs(diff) <= 3.2;
            if (!isVisible) return null;

            const translateY = diff * 40;
            const rotateX = -diff * 22;
            const translateZ = -Math.pow(Math.abs(diff), 1.3) * 16;
            const scale = Math.max(0.68, 1.08 - Math.abs(diff) * 0.14);
            const opacity = Math.max(0, Math.min(1, 1 - Math.abs(diff) * 0.32));
            const isSelected = Math.abs(diff) < 0.4;
            const label = `S${String(s.season_number).padStart(2, "0")}`;

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
                className={`absolute inset-x-1 h-10 flex items-center justify-center rounded-md pointer-events-auto z-10 ${
                  isSelected
                    ? "text-[#a8dadc] font-black text-sm sm:text-base tracking-wider cursor-default"
                    : "text-zinc-400 font-bold text-xs sm:text-sm tracking-wider hover:text-white cursor-pointer"
                }`}
                style={{
                  top: "calc(50% - 20px)",
                  transform: `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
                  opacity,
                  transition: isDragging
                    ? "none"
                    : "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease, color 200ms ease",
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
