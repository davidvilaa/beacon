"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/lib/tmdb";
import MediaCard from "@/components/ui/MediaCard";

export interface FranchiseItem {
  id: number;
  title: string;
  poster_path?: string | null;
  posterPath?: string | null;
  mediaType?: "movie" | "tv" | "anime" | "game";
  subtitle?: string | React.ReactNode;
  href?: string;
  year?: string | number | null;
}

interface FranchiseSliderProps {
  parts: (Movie | FranchiseItem)[];
  currentMovieId: number;
  mediaType?: "movie" | "tv" | "anime" | "game";
}

export default function FranchiseSlider({
  parts,
  currentMovieId,
  mediaType = "movie",
}: FranchiseSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const currentPosterRef = useRef<HTMLAnchorElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPercent, setThumbWidthPercent] = useState(30);
  const [canScroll, setCanScroll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ clientX: number; scrollLeft: number } | null>(null);

  const updateMetrics = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 2) {
      setCanScroll(false);
      setScrollProgress(0);
      return;
    }

    setCanScroll(true);
    const visibleRatio = clientWidth / scrollWidth;
    const calculatedThumbWidth = Math.max(20, Math.min(80, visibleRatio * 100));
    setThumbWidthPercent(calculatedThumbWidth);
    setScrollProgress(Math.max(0, Math.min(1, scrollLeft / maxScroll)));
  }, []);

  useEffect(() => {
    updateMetrics();

    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(Math.max(0, Math.min(1, el.scrollLeft / maxScroll)));
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateMetrics);
    };
  }, [updateMetrics, parts]);

  useEffect(() => {
    if (currentPosterRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const target = currentPosterRef.current;
      const targetLeft = target.offsetLeft - container.offsetLeft;
      const targetCenter = targetLeft - container.clientWidth / 2 + target.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetCenter),
        behavior: "smooth",
      });
    }
  }, [currentMovieId, parts]);

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!scrollRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !trackRef.current || !scrollRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const thumbWidthPx = trackWidth * (thumbWidthPercent / 100);
    const travelWidth = trackWidth - thumbWidthPx;
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;

    if (travelWidth > 0 && maxScroll > 0) {
      const deltaX = e.clientX - dragStartRef.current.clientX;
      const scrollDelta = deltaX * (maxScroll / travelWidth);
      scrollRef.current.scrollLeft = dragStartRef.current.scrollLeft + scrollDelta;
    }
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !scrollRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const thumbWidthPx = trackWidth * (thumbWidthPercent / 100);
    const travelWidth = trackWidth - thumbWidthPx;
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;

    if (travelWidth > 0 && maxScroll > 0) {
      const clickX = e.clientX - trackRect.left;
      const targetThumbLeft = clickX - thumbWidthPx / 2;
      const ratio = Math.max(0, Math.min(1, targetThumbLeft / travelWidth));
      scrollRef.current.scrollTo({
        left: ratio * maxScroll,
        behavior: "smooth",
      });
    }
  };

  const handleStep = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const thumbLeftPercent = scrollProgress * (100 - thumbWidthPercent);

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {parts.map((item) => {
          const poster =
            "poster_path" in item && item.poster_path !== undefined
              ? item.poster_path
              : (item as FranchiseItem).posterPath;
          const resolvedMediaType =
            (item as FranchiseItem).mediaType || mediaType || "movie";
          const resolvedHref =
            (item as FranchiseItem).href || `/${resolvedMediaType}/${item.id}`;
          const resolvedSubtitle = (item as FranchiseItem).subtitle;
          const isCurr = item.id === currentMovieId;

          return (
            <MediaCard
              key={item.id}
              ref={isCurr ? currentPosterRef : null}
              id={item.id}
              mediaType={resolvedMediaType}
              href={resolvedHref}
              title={item.title}
              posterPath={poster}
              subtitle={resolvedSubtitle}
              isCurrent={isCurr}
              className="w-28 sm:w-32 md:w-36 shrink-0 aspect-[2/3]"
              sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
            />
          );
        })}
      </div>

      {canScroll && (
        <div className="flex items-center justify-center gap-2.5 mt-4 pt-1">
          <button
            type="button"
            onClick={() => handleStep("left")}
            disabled={scrollProgress <= 0.01}
            aria-label="Scroll left"
            className="p-1.5 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            className="relative w-48 sm:w-64 md:w-72 h-2.5 bg-zinc-900 border border-zinc-800/80 rounded-full cursor-pointer select-none touch-none"
          >
            <div
              ref={thumbRef}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
              className={`absolute top-0 bottom-0 rounded-full transition-colors cursor-grab active:cursor-grabbing ${
                isDragging ? "bg-accent" : "bg-zinc-600 hover:bg-accent"
              }`}
              style={{
                left: `${thumbLeftPercent}%`,
                width: `${thumbWidthPercent}%`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleStep("right")}
            disabled={scrollProgress >= 0.99}
            aria-label="Scroll right"
            className="p-1.5 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
