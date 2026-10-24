"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { Movie, getPosterUrl } from "@/lib/tmdb";

interface FranchiseSliderProps {
  parts: Movie[];
  currentMovieId: number;
}

export default function FranchiseSlider({
  parts,
  currentMovieId,
}: FranchiseSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const currentPosterRef = useRef<HTMLAnchorElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPercent, setThumbWidthPercent] = useState(30);
  const [canScroll, setCanScroll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
  }, [currentMovieId]);

  const updateScrollFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current || !scrollRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = ratio * maxScroll;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateScrollFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateScrollFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
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
          const isCurrent = item.id === currentMovieId;
          const posterUrl = getPosterUrl(item.poster_path, "w342");

          return (
            <Link
              key={item.id}
              ref={isCurrent ? currentPosterRef : null}
              href={`/movie/${item.id}`}
              title={item.title}
              className={`group relative aspect-[2/3] w-28 sm:w-32 md:w-36 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
                isCurrent
                  ? "border-2 border-[#a8dadc]"
                  : "border border-zinc-800 hover:border-[#a8dadc]/60 hover:scale-[1.03]"
              }`}
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-zinc-900">
                  <Film className="w-6 h-6 text-zinc-700 mb-1" />
                  <span className="text-[10px] text-zinc-500 font-semibold line-clamp-2">
                    {item.title}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {canScroll && (
        <div className="flex items-center justify-center gap-2 mt-3 pt-1">
          <button
            type="button"
            onClick={() => handleStep("left")}
            disabled={scrollProgress <= 0.01}
            aria-label="Scroll left"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-36 sm:w-48 h-1.5 bg-zinc-900 border border-zinc-800/80 rounded-full cursor-pointer select-none touch-none"
          >
            <div
              className={`absolute top-0 bottom-0 rounded-full transition-colors ${
                isDragging ? "bg-[#a8dadc]" : "bg-zinc-600 hover:bg-[#a8dadc]"
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
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
