"use client";

import Image from "next/image";
import { Film } from "lucide-react";

interface MediaPosterCardProps {
  posterUrl: string | null;
  title: string;
  hasMultiplePosters?: boolean;
  onOpenPosterPicker?: () => void;
}

export default function MediaPosterCard({
  posterUrl,
  title,
  hasMultiplePosters = false,
  onOpenPosterPicker,
}: MediaPosterCardProps) {
  const isClickable = hasMultiplePosters && Boolean(onOpenPosterPicker);

  return (
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
  );
}
