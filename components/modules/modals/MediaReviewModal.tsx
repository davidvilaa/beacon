"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Calendar,
  Clock,
  Eye,
  Bookmark,
  Heart,
  PlayCircle,
  PauseCircle,
  XCircle,
  Star,
} from "lucide-react";
import { MediaStatus } from "../columns/MediaActionColumn";
import { formatRuntime, formatFullDate } from "@/lib/media-utils";
import DatePicker from "@/components/ui/DatePicker";
import Checkbox from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import ArtworkPickerModal from "./ArtworkPickerModal";
import BackdropPickerModal from "./BackdropPickerModal";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = displayValue >= star;
        const isHalf = !isFull && displayValue >= star - 0.5;

        return (
          <div key={star} className="relative w-6 h-6 select-none cursor-pointer">
            <Star className="w-6 h-6 text-zinc-700 stroke-[1.5]" />

            {isFull && (
              <div className="absolute inset-0">
                <Star className="w-6 h-6 text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
              </div>
            )}

            {isHalf && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-6 h-6 text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
              </div>
            )}

            <div
              className="absolute left-0 top-0 bottom-0 w-1/2 z-10"
              onMouseEnter={() => setHoverValue(star - 0.5)}
              onClick={() => onChange(value === star - 0.5 ? 0 : star - 0.5)}
            />

            <div
              className="absolute right-0 top-0 bottom-0 w-1/2 z-10"
              onMouseEnter={() => setHoverValue(star)}
              onClick={() => onChange(value === star ? 0 : star)}
            />
          </div>
        );
      })}
    </div>
  );
}

export interface MediaReviewData {
  status: Exclude<MediaStatus, null>;
  isFavorite: boolean;
  rating: number;
  review: string;
  hasSpoilers: boolean;
  watchedDate?: string;
  startDate?: string;
  endDate?: string;
  customPosterPath?: string | null;
  customBackdropPath?: string | null;
}

interface MediaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  typeLabel?: string;
  subtitle?: string | null;
  year?: string | number | null;
  releaseDate?: string | null;
  runtimeMinutes?: number | null;
  episodesCount?: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  mediaType: "movie" | "tv";
  status: MediaStatus;
  isFavorite: boolean;
  canAddFavorite?: boolean;
  rating: number;
  review: string;
  hasSpoilers: boolean;
  watchedDate?: string;
  startDate?: string;
  endDate?: string;
  isSaving?: boolean;
  onSave: (data: MediaReviewData) => void;
  onDelete?: () => void;
  availablePosters?: { file_path: string }[];
  availableBackdrops?: { file_path: string }[];
  selectedPoster?: string | null;
  selectedBackdrop?: string | null;
  loadingPosters?: boolean;
  loadingBackdrops?: boolean;
  isReleased?: boolean;
}

export default function MediaReviewModal({
  isOpen,
  onClose,
  title,
  typeLabel,
  year,
  releaseDate,
  runtimeMinutes,
  episodesCount,
  posterUrl,
  backdropUrl,
  mediaType,
  status,
  isFavorite,
  canAddFavorite = true,
  rating,
  review,
  hasSpoilers,
  watchedDate,
  startDate,
  endDate,
  isSaving = false,
  onSave,
  onDelete,
  availablePosters,
  availableBackdrops,
  selectedPoster,
  selectedBackdrop,
  loadingPosters,
  loadingBackdrops,
  isReleased = true,
}: MediaReviewModalProps) {
  const { addToast } = useToast();
  const fallbackStatus: Exclude<MediaStatus, null> =
    isReleased ? "watched" : "watchlist";

  const [draftStatus, setDraftStatus] = useState<Exclude<MediaStatus, null>>(
    !isReleased && status !== "watchlist"
      ? "watchlist"
      : (status as Exclude<MediaStatus, null>) || fallbackStatus
  );
  const [draftFavorite, setDraftFavorite] = useState<boolean>(isFavorite);
  const [draftRating, setDraftRating] = useState<number>(rating);
  const [draftReview, setDraftReview] = useState<string>(review);
  const [draftSpoilers, setDraftSpoilers] = useState<boolean>(hasSpoilers);
  const [draftWatchedDate, setDraftWatchedDate] = useState<string>(watchedDate || "");
  const [draftStartDate, setDraftStartDate] = useState<string>(startDate || "");
  const [draftEndDate, setDraftEndDate] = useState<string>(endDate || "");
  const [draftPoster, setDraftPoster] = useState<string | null>(selectedPoster ?? null);
  const [draftBackdrop, setDraftBackdrop] = useState<string | null>(selectedBackdrop ?? null);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialStatus =
        !isReleased && status !== "watchlist"
          ? "watchlist"
          : (status as Exclude<MediaStatus, null>) || fallbackStatus;
      setDraftStatus(initialStatus);
      setDraftFavorite(isFavorite);
      setDraftRating(rating);
      setDraftReview(review);
      setDraftSpoilers(hasSpoilers);
      setDraftWatchedDate(watchedDate || "");
      setDraftStartDate(startDate || "");
      setDraftEndDate(endDate || "");
      setDraftPoster(selectedPoster ?? null);
      setDraftBackdrop(selectedBackdrop ?? null);
    }
  }, [isOpen, isReleased]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const movieStatusOptions: {
    key: Exclude<MediaStatus, null>;
    label: string;
    icon: typeof Eye;
  }[] = [
    { key: "watched", label: "Watched", icon: Eye },
    { key: "watchlist", label: "Watchlist", icon: Bookmark },
  ];

  const tvStatusOptions: {
    key: Exclude<MediaStatus, null>;
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

  const resolvedTypeLabel =
    typeLabel || (mediaType === "movie" ? "Movie" : "Series");
  const formattedDate = releaseDate
    ? formatFullDate(releaseDate)
    : year
    ? String(year)
    : null;
  const runtimeFormatted = formatRuntime(runtimeMinutes || null);

  const handleSelectPosterInternal = (filePath: string) => {
    setDraftPoster(filePath);
  };

  const handleSelectBackdropInternal = (filePath: string) => {
    setDraftBackdrop(filePath);
  };

  const currentPosterUrl = draftPoster
    ? getPosterUrl(draftPoster, "w500")
    : posterUrl;
  const currentBackdropUrl = draftBackdrop
    ? getBackdropUrl(draftBackdrop, "original")
    : backdropUrl;

  const canChangePoster = Boolean(
    (availablePosters?.length ?? 0) > 0 || loadingPosters
  );
  const canChangeBackdrop = Boolean(
    (availableBackdrops?.length ?? 0) > 0 || loadingBackdrops
  );

  const handleSaveClick = () => {
    let finalStatus: Exclude<MediaStatus, null> =
      draftStatus || fallbackStatus;
    if (!isReleased && finalStatus !== "watchlist") {
      finalStatus = "watchlist";
    }
    onSave({
      status: finalStatus,
      isFavorite: draftFavorite,
      rating: finalStatus === "watchlist" ? 0 : draftRating,
      review: draftReview,
      hasSpoilers: draftSpoilers,
      watchedDate: finalStatus === "watchlist" ? "" : draftWatchedDate,
      startDate: finalStatus === "watchlist" ? "" : draftStartDate,
      endDate: finalStatus === "watchlist" ? "" : draftEndDate,
      customPosterPath: draftPoster,
      customBackdropPath: draftBackdrop,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto overflow-x-hidden">
        <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
          <div
            onClick={canChangeBackdrop ? () => setIsBackdropPickerOpen(true) : undefined}
            title={canChangeBackdrop ? "Click to change banner" : undefined}
            className={`relative h-36 sm:h-48 md:h-52 w-full bg-zinc-900 overflow-hidden ${
              canChangeBackdrop ? "cursor-pointer group" : ""
            }`}
          >
            {currentBackdropUrl ? (
              <Image
                src={currentBackdropUrl}
                alt="Media banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/30" />

            {canChangeBackdrop && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start -mt-14 sm:-mt-20 relative z-10 mb-5">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div
                  onClick={canChangePoster ? () => setIsPosterPickerOpen(true) : undefined}
                  title={canChangePoster ? "Click to change poster" : undefined}
                  className={`relative w-28 sm:w-36 aspect-[2/3] rounded-sm overflow-hidden bg-zinc-900 border-2 border-zinc-800 shadow-2xl ${
                    canChangePoster ? "cursor-pointer group" : ""
                  }`}
                >
                  {currentPosterUrl ? (
                    <Image
                      src={currentPosterUrl}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-center bg-zinc-900">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 leading-snug line-clamp-4 select-none">
                        {title}
                      </span>
                    </div>
                  )}

                  {canChangePoster && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </div>

                <div
                  className={`mt-1 flex justify-center w-full transition-opacity ${
                    draftStatus === "watchlist" ? "opacity-30 pointer-events-none" : ""
                  }`}
                >
                  <StarRating
                    value={draftStatus === "watchlist" ? 0 : draftRating}
                    onChange={setDraftRating}
                  />
                </div>
              </div>

            <div className="flex-1 min-w-0 pt-2 sm:pt-14 md:pt-16">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {resolvedTypeLabel}
              </p>

              <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight leading-tight truncate">
                {title}
              </h2>

              <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-2 flex-wrap">
                {formattedDate && formattedDate !== "—" && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{formattedDate}</span>
                  </span>
                )}
                {runtimeFormatted && runtimeFormatted !== "—" && (
                  <>
                    {formattedDate && formattedDate !== "—" && <span>•</span>}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{runtimeFormatted}</span>
                    </span>
                  </>
                )}
                {typeof episodesCount === "number" && episodesCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{episodesCount} Episodes</span>
                  </>
                )}
              </div>

              {draftStatus !== "watchlist" && (
                mediaType === "tv" ? (
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400">Start</span>
                      <DatePicker
                        value={draftStartDate}
                        onChange={setDraftStartDate}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400">End</span>
                      <DatePicker
                        value={draftEndDate}
                        onChange={setDraftEndDate}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <DatePicker
                      value={draftWatchedDate}
                      onChange={setDraftWatchedDate}
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                )
              )}

              <div className="mt-3">
                <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-sm divide-x divide-zinc-800/80">
                  <div className="flex items-center gap-1 pr-1">
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = draftStatus === opt.key;
                      const isAllowed = isReleased ? true : opt.key === "watchlist";
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => {
                            if (!isAllowed) return;
                            setDraftStatus(opt.key);
                          }}
                          title={!isAllowed ? "Not released yet" : opt.label}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all ${
                            !isAllowed
                              ? "opacity-25 cursor-not-allowed text-zinc-600"
                              : isSelected
                              ? "bg-[#a8dadc] text-zinc-950 font-bold cursor-pointer"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 cursor-pointer"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 stroke-[2]" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pl-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!draftFavorite && canAddFavorite === false) {
                          addToast(
                            mediaType === "movie"
                              ? "You can only have up to 5 favorite movies"
                              : "You can only have up to 5 favorite series",
                            "error"
                          );
                          return;
                        }
                        setDraftFavorite(!draftFavorite);
                      }}
                      title={
                        draftFavorite ? "Remove from favourites" : "Mark as favourite"
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        draftFavorite
                          ? "bg-[#a8dadc] text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/60"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 stroke-[2] ${
                          draftFavorite ? "fill-zinc-950 text-zinc-950" : ""
                        }`}
                      />
                      <span>Favourite</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-sm overflow-hidden focus-within:border-[#a8dadc]/80 transition-colors">
              <textarea
                value={draftReview}
                onChange={(e) => setDraftReview(e.target.value)}
                placeholder="Write a review or thoughts... (optional)"
                rows={4}
                className="w-full bg-transparent p-3 sm:p-4 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed block"
              />

              <div className="border-t border-zinc-800/80 px-3.5 py-2.5 bg-zinc-900/50 flex items-center justify-between">
                <Checkbox
                  checked={draftSpoilers}
                  onChange={setDraftSpoilers}
                  label="Review contains spoilers"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5">
              <div>
                {status && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-sm text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Delete entry
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-sm text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-sm text-xs font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#8ec5c8] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {availablePosters && (
        <ArtworkPickerModal
          isOpen={isPosterPickerOpen}
          onClose={() => setIsPosterPickerOpen(false)}
          title="CHANGE ARTWORK"
          type="poster"
          images={availablePosters}
          selectedImage={draftPoster}
          onSelectImage={handleSelectPosterInternal}
          isLoading={loadingPosters}
          zIndexClassName="z-[60]"
        />
      )}

      {availableBackdrops && (
        <BackdropPickerModal
          isOpen={isBackdropPickerOpen}
          onClose={() => setIsBackdropPickerOpen(false)}
          title="CHANGE BANNER"
          images={availableBackdrops}
          selectedImage={draftBackdrop}
          onSelectImage={handleSelectBackdropInternal}
          isLoading={loadingBackdrops}
          zIndexClassName="z-[60]"
        />
      )}
    </>
  );
}
