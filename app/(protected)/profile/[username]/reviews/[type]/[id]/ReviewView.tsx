"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  StarHalf,
  Eye,
  Bookmark,
  PlayCircle,
  PauseCircle,
  XCircle,
  Heart,
  Pencil,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/media/MediaLayout";
import CardGradientBorder from "@/components/ui/CardGradientBorder";
import MediaReviewModal, {
  MediaReviewData,
} from "@/components/media/modals/MediaReviewModal";
import { getPosterUrl, getBackdropUrl } from "@/lib/providers/tmdb/client";
import { formatFullDate } from "@/lib/media/format";
import { sharedStatusToGame } from "@/lib/media/status";
import { getAnimeTitle } from "@/lib/providers/anilist/client";
import {
  GAME_STATUS_LABELS,
  REVIEW_TABLES,
  REVIEW_TYPE_LABELS,
  STATUS_LABELS,
  type ReviewRecord,
  type TmdbMeta,
} from "@/lib/details/review-types";
import { seasonHref } from "@/lib/media/seasons";

interface ReviewViewProps {
  initialReview: ReviewRecord;
  tmdbMeta: TmdbMeta | null;
  currentUserId: string | null;
}

export default function ReviewView({ initialReview, tmdbMeta, currentUserId }: ReviewViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [review, setReview] = useState<ReviewRecord | null>(initialReview);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);

  const isOwner = Boolean(
    currentUserId && review && currentUserId === review.user_id
  );

  const posterPath =
    review?.custom_poster_path ||
    review?.poster_path ||
    tmdbMeta?.poster_path ||
    null;

  const backdropPath =
    review?.custom_backdrop_path ||
    review?.backdrop_path ||
    tmdbMeta?.backdrop_path ||
    null;

  const posterUrl = useMemo(() => {
    return getPosterUrl(posterPath, "w500");
  }, [posterPath]);

  const backdropUrl = useMemo(() => {
    return getBackdropUrl(backdropPath, "original");
  }, [backdropPath]);

  const handleSaveReview = async (reviewData: MediaReviewData) => {
    if (!review || !isOwner) return;

    try {
      setIsSaving(true);
      const table = REVIEW_TABLES[review.media_type];

      const payload: Record<string, any> = {
        status:
          review.media_type === "game"
            ? reviewData.status && sharedStatusToGame(reviewData.status)
            : reviewData.status,
        is_favorite: reviewData.isFavorite,
        rating: reviewData.rating > 0 ? reviewData.rating : null,
        review: reviewData.review.trim() || null,
        has_spoilers: reviewData.hasSpoilers,
        custom_poster_path: reviewData.customPosterPath || null,
        custom_backdrop_path: reviewData.customBackdropPath || null,
        updated_at: new Date().toISOString(),
      };

      if (review.media_type === "movie") {
        payload.watched_date = reviewData.watchedDate || null;
      } else {
        payload.start_date = reviewData.startDate || null;
        payload.end_date = reviewData.endDate || null;
      }

      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", review.id);

      if (error) {
        addToast(error.message, "error");
        return;
      }

      setReview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: reviewData.status,
          is_favorite: reviewData.isFavorite,
          rating: reviewData.rating > 0 ? reviewData.rating : null,
          review: reviewData.review.trim() || null,
          has_spoilers: reviewData.hasSpoilers,
          custom_poster_path: reviewData.customPosterPath || null,
          custom_backdrop_path: reviewData.customBackdropPath || null,
          watched_date: reviewData.watchedDate || null,
          start_date: reviewData.startDate || null,
          end_date: reviewData.endDate || null,
        };
      });

      setIsEditModalOpen(false);
      addToast("Review updated successfully", "success");
    } catch {
      addToast("Failed to update review", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!review || !isOwner) return;

    try {
      setIsSaving(true);
      const table = REVIEW_TABLES[review.media_type];

      const { error } = await supabase.from(table).delete().eq("id", review.id);

      if (error) {
        addToast(error.message, "error");
        return;
      }

      addToast("Review deleted successfully", "info");
      setIsEditModalOpen(false);
      if (review.users?.username) {
        router.push(`/profile/${review.users.username}`);
      } else {
        router.push("/");
      }
    } catch {
      addToast("Failed to delete review", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const reviewDateText = useMemo(() => {
    if (!review) return "";
    if (review.media_type === "tv") {
      if (review.start_date && review.end_date) {
        return `${formatFullDate(review.start_date)} - ${formatFullDate(review.end_date)}`;
      }
      if (review.end_date) {
        return formatFullDate(review.end_date);
      }
      if (review.start_date) {
        return formatFullDate(review.start_date);
      }
    }
    if (review.watched_date) {
      return formatFullDate(review.watched_date);
    }
    return formatFullDate(review.created_at.split("T")[0]);
  }, [review]);

  if (!review) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">Review could not be found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-accent hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const mediaHref =
    review.media_type === "anime"
      ? `/anime/${review.media_id}`
      : review.media_type === "movie"
      ? `/movie/${review.media_id}`
      : review.media_type === "game"
      ? `/game/${review.media_id}`
      : seasonHref(review.media_id, review.season_number || 1);

  const ratingVal = review.rating ? Number(review.rating) : 0;
  const authorName = review.users?.username || "User";

  const rawTitle = tmdbMeta?.title || review.title;
  const resolvedTitle =
    typeof rawTitle === "object" && rawTitle !== null
      ? getAnimeTitle(rawTitle)
      : String(rawTitle || "Untitled");
  const resolvedTypeLabel = REVIEW_TYPE_LABELS[review.media_type];
  const statusLabels = review.media_type === "game" ? GAME_STATUS_LABELS : STATUS_LABELS;

  const posterColumnNode = (
    <div className="relative w-56 sm:w-full">
      <div
        className={`relative aspect-[2/3] w-full ${
          isOwner ? "rounded-t-sm" : "rounded-sm"
        } overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl`}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={resolvedTitle}
            fill
            priority
            sizes="(max-width: 640px) 224px, 288px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center bg-zinc-900">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 leading-snug line-clamp-4 select-none">
              {resolvedTitle}
            </span>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="flex items-stretch bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-sm overflow-hidden shadow-xl">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            title="Edit review"
            className="w-full flex items-center justify-center py-3 sm:py-3.5 text-zinc-400 hover:text-accent hover:bg-zinc-800/70 transition-colors cursor-pointer group"
          >
            <Pencil className="w-5 h-5 stroke-[2] group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={resolvedTitle}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        posterColumn={posterColumnNode}
        bottomPaddingClassName="pb-32 sm:pb-40"
      >
        <div className="flex-1 min-w-0 w-full">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">
            {resolvedTypeLabel}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
            <Link href={mediaHref} className="hover:text-accent transition-colors">
              {resolvedTitle}
            </Link>
          </h1>

          <div className="mt-5 flex items-center">
            <Link
              href={`/profile/${authorName}`}
              className="relative inline-flex items-stretch rounded-sm bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0 overflow-hidden h-10 sm:h-11 max-w-full"
            >
              <CardGradientBorder roundedClassName="rounded-sm" />
              <div className="relative h-full aspect-square w-10 sm:w-11 shrink-0 bg-zinc-900 border-r border-zinc-700/60 overflow-hidden flex items-center justify-center">
                {review.users?.avatar_url ? (
                  <img
                    src={review.users.avatar_url}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-zinc-500" />
                )}
              </div>

              <div className="px-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-accent transition-colors whitespace-nowrap">
                <span className="text-zinc-400 font-normal">by</span>
                <span>{authorName}</span>
              </div>

              <div
                title={review.status ? statusLabels[review.status] : ""}
                className="border-l border-zinc-700/60 px-3 flex items-center justify-center text-zinc-300 shrink-0"
              >
                {review.status === "watched" && (
                  <Eye className="w-4 h-4 text-accent" />
                )}
                {review.status === "watching" && (
                  <PlayCircle className="w-4 h-4 text-accent" />
                )}
                {review.status === "paused" && (
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                )}
                {review.status === "dropped" && (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                {review.status === "watchlist" && (
                  <Bookmark className="w-4 h-4 text-accent fill-accent" />
                )}
              </div>

              {review.is_favorite && (
                <div
                  title="Favorite"
                  className="border-l border-zinc-700/60 px-2.5 flex items-center justify-center text-accent shrink-0"
                >
                  <Heart className="w-4 h-4 fill-accent" />
                </div>
              )}

              <div className="border-l border-zinc-700/60 px-3 flex items-center gap-1.5 text-xs text-zinc-400 font-medium whitespace-nowrap shrink-0">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>{reviewDateText}</span>
              </div>
            </Link>
          </div>

          <div className="my-5 border-t border-zinc-800/80" />

          {ratingVal > 0 && (
            <div className="mb-5 flex items-center gap-1 shrink-0" title={`Rating: ${ratingVal} / 5`}>
              {Array.from({ length: Math.ceil(ratingVal) }).map((_, idx) => {
                const star = idx + 1;
                const isFull = ratingVal >= star;
                const isHalf = !isFull && ratingVal >= star - 0.5;

                return (
                  <div key={star} className="relative w-5 sm:w-6 h-5 sm:h-6 shrink-0">
                    {isFull && (
                      <Star className="w-full h-full text-accent fill-accent stroke-[1.5]" />
                    )}
                    {isHalf && (
                      <StarHalf className="w-full h-full text-accent fill-accent stroke-[1.5]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="max-w-3xl">
            {review.has_spoilers && (
              <div className="mb-4 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>This review contains spoilers for {resolvedTitle}.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSpoilers((prev) => !prev)}
                  className="px-2.5 py-1 rounded-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold transition-colors cursor-pointer shrink-0"
                >
                  {showSpoilers ? "Hide spoilers" : "Show review"}
                </button>
              </div>
            )}

            <p
              className={`text-zinc-200 leading-relaxed whitespace-pre-wrap text-base sm:text-lg font-normal transition-all ${
                review.has_spoilers && !showSpoilers
                  ? "blur-md select-none pointer-events-none"
                  : ""
              }`}
            >
              {review.review || "No written review was provided for this log entry."}
            </p>
          </div>
        </div>
      </MediaLayout>

      {isOwner && (
        <MediaReviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={resolvedTitle}
          typeLabel={resolvedTypeLabel}
          year={tmdbMeta?.release_date ? tmdbMeta.release_date.split("-")[0] : undefined}
          posterUrl={posterUrl}
          backdropUrl={backdropUrl}
          mediaType={review.media_type}
          status={review.status}
          hasLog
          isFavorite={review.is_favorite}
          rating={ratingVal}
          review={review.review || ""}
          hasSpoilers={review.has_spoilers}
          watchedDate={review.watched_date || undefined}
          startDate={review.start_date || undefined}
          endDate={review.end_date || undefined}
          isSaving={isSaving}
          onSave={handleSaveReview}
          onDelete={handleDeleteReview}
        />
      )}
    </>
  );
}
