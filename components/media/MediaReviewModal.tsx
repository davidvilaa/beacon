"use client";

import Image from "next/image";
import {
  X,
  Calendar,
  Eye,
  Bookmark,
  Heart,
  ImageIcon,
  Film,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";
import StarRating from "./StarRating";
import { MediaStatus } from "./MediaActionBar";

interface MediaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  year?: string | number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  mediaType: "movie" | "tv";
  status: MediaStatus;
  isFavorite: boolean;
  rating: number;
  review: string;
  hasSpoilers: boolean;
  watchedDate: string;
  isSaving?: boolean;
  onStatusChange: (status: MediaStatus) => void;
  onFavoriteChange: (fav: boolean) => void;
  onRatingChange: (rating: number) => void;
  onReviewChange: (review: string) => void;
  onSpoilersChange: (hasSpoilers: boolean) => void;
  onWatchedDateChange: (date: string) => void;
  onSave: () => void;
  onOpenPosterPicker?: () => void;
  onOpenBackdropPicker?: () => void;
}

export default function MediaReviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  year,
  posterUrl,
  backdropUrl,
  mediaType,
  status,
  isFavorite,
  rating,
  review,
  hasSpoilers,
  watchedDate,
  isSaving = false,
  onStatusChange,
  onFavoriteChange,
  onRatingChange,
  onReviewChange,
  onSpoilersChange,
  onWatchedDateChange,
  onSave,
  onOpenPosterPicker,
  onOpenBackdropPicker,
}: MediaReviewModalProps) {
  if (!isOpen) return null;

  const movieStatusOptions: {
    key: MediaStatus;
    label: string;
    icon: typeof Eye;
  }[] = [
    { key: "watched", label: "Watched", icon: Eye },
    { key: "watchlist", label: "Watchlist", icon: Bookmark },
  ];

  const tvStatusOptions: {
    key: MediaStatus;
    label: string;
    icon: typeof Eye;
  }[] = [
    { key: "watched", label: "Watched", icon: Eye },
    { key: "watching", label: "Watching", icon: PlayCircle },
    { key: "paused", label: "Paused", icon: PauseCircle },
    { key: "dropped", label: "Dropped", icon: XCircle },
    { key: "watchlist", label: "Watchlist", icon: Bookmark },
  ];

  const statusOptions =
    mediaType === "movie" ? movieStatusOptions : tvStatusOptions;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="relative h-32 sm:h-40 w-full bg-zinc-900 overflow-hidden group">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt="Media banner"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/20" />

          {onOpenBackdropPicker && (
            <button
              type="button"
              onClick={onOpenBackdropPicker}
              className="absolute bottom-2.5 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-zinc-700/60 text-[11px] font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Change banner</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-6">
          <div className="flex gap-4 sm:gap-5 items-start -mt-12 sm:-mt-16 relative z-10 mb-5">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div
                onClick={onOpenPosterPicker}
                className={`relative w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border-2 border-zinc-800 shadow-2xl group ${
                  onOpenPosterPicker ? "cursor-pointer" : ""
                }`}
              >
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Film className="w-8 h-8" />
                  </div>
                )}
                {onOpenPosterPicker && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center">
                    <ImageIcon className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-medium leading-tight">
                      Change poster
                    </span>
                  </div>
                )}
              </div>

              <StarRating value={rating} onChange={onRatingChange} />
            </div>

            <div className="flex-1 min-w-0 pt-12 sm:pt-16">
              <h2 className="text-lg sm:text-xl font-black text-zinc-100 tracking-tight leading-tight truncate">
                {title}
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {[subtitle, year].filter(Boolean).join(" • ") || "—"}
              </p>

              <div className="flex items-center gap-2 mt-3.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="date"
                  value={watchedDate}
                  onChange={(e) => onWatchedDateChange(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-[#a8dadc] transition-colors cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    onWatchedDateChange(new Date().toISOString().split("T")[0])
                  }
                  className="text-[11px] text-[#a8dadc] hover:underline cursor-pointer font-medium"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex-wrap">
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = status === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          onStatusChange(isSelected ? null : opt.key)
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#a8dadc] text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onFavoriteChange(!isFavorite)}
                  title={
                    isFavorite ? "Remove from favorites" : "Mark as favorite"
                  }
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isFavorite
                      ? "border-[#a8dadc]/60 bg-[#a8dadc]/15 text-[#a8dadc]"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-[#a8dadc] hover:border-zinc-700"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite ? "fill-[#a8dadc]" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={review}
              onChange={(e) => onReviewChange(e.target.value)}
              placeholder="Write a review or thoughts... (optional)"
              rows={4}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#a8dadc] transition-colors resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={hasSpoilers}
                  onChange={(e) => onSpoilersChange(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#a8dadc] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-[#a8dadc] cursor-pointer"
                />
                <span>Review contains spoilers</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#a8dadc]/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
