"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Film,
  Tv,
  User,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import MediaLayout from "@/components/modules/MediaLayout";
import CardGradientBorder from "@/components/ui/CardGradientBorder";
import SeasonRevolver from "@/components/ui/SeasonRevolver";
import MediaReviewModal, {
  MediaReviewData,
} from "@/components/modules/modals/MediaReviewModal";
import { getPosterUrl, getBackdropUrl, TvSeasonSummary } from "@/lib/tmdb";
import { formatFullDate } from "@/lib/media-utils";

interface ReviewUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ReviewRecord {
  id: string;
  user_id: string;
  media_id: number;
  media_type: "movie" | "tv";
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  custom_poster_path: string | null;
  custom_backdrop_path: string | null;
  status: "watched" | "watching" | "paused" | "dropped" | "watchlist";
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  has_spoilers: boolean;
  watched_date: string | null;
  start_date: string | null;
  end_date: string | null;
  season_number?: number | null;
  last_watched_episode?: number | null;
  created_at: string;
  updated_at: string;
  users: ReviewUser | null;
}

interface TmdbMeta {
  title?: string;
  original_title?: string;
  release_date?: string;
  runtime?: number;
  episodesCount?: number;
  genres?: string[];
  tagline?: string;
  overview?: string;
  backdrop_path?: string;
  poster_path?: string;
}

function ReviewDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id || "";
  const typeHint = searchParams.get("type");
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [review, setReview] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [tmdbMeta, setTmdbMeta] = useState<TmdbMeta | null>(null);
  const [tvSeasons, setTvSeasons] = useState<TvSeasonSummary[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadReview() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        if (!ignore && sessionData?.session?.user) {
          setCurrentUserId(sessionData.session.user.id);
        }

        let record: ReviewRecord | null = null;

        if (typeHint !== "tv") {
          const { data: movieData } = await supabase
            .from("user_movies")
            .select(`
              id,
              user_id,
              movie_id,
              status,
              is_favorite,
              rating,
              review,
              has_spoilers,
              custom_poster_path,
              custom_backdrop_path,
              watched_date,
              created_at,
              updated_at,
              users (
                id,
                username,
                avatar_url
              ),
              movies (
                id,
                title,
                overview,
                poster_path,
                backdrop_path
              )
            `)
            .eq("id", id)
            .maybeSingle();

          if (movieData) {
            const m = movieData as any;
            record = {
              id: m.id,
              user_id: m.user_id,
              media_id: m.movie_id,
              media_type: "movie",
              title: m.movies?.title || "Movie",
              overview: m.movies?.overview || null,
              poster_path: m.movies?.poster_path || null,
              backdrop_path: m.movies?.backdrop_path || null,
              custom_poster_path: m.custom_poster_path || null,
              custom_backdrop_path: m.custom_backdrop_path || null,
              status: m.status,
              is_favorite: Boolean(m.is_favorite),
              rating: m.rating ? Number(m.rating) : null,
              review: m.review || null,
              has_spoilers: Boolean(m.has_spoilers),
              watched_date: m.watched_date || null,
              start_date: null,
              end_date: null,
              created_at: m.created_at,
              updated_at: m.updated_at,
              users: m.users || null,
            };
          }
        }

        if (!record && typeHint !== "movie") {
          const { data: seriesData } = await supabase
            .from("user_series")
            .select(`
              id,
              user_id,
              series_id,
              season_number,
              status,
              is_favorite,
              rating,
              review,
              has_spoilers,
              custom_poster_path,
              custom_backdrop_path,
              last_watched_episode,
              start_date,
              end_date,
              created_at,
              updated_at,
              users (
                id,
                username,
                avatar_url
              ),
              series (
                id,
                name,
                overview,
                poster_path,
                backdrop_path,
                number_of_seasons,
                number_of_episodes
              )
            `)
            .eq("id", id)
            .maybeSingle();

          if (seriesData) {
            const s = seriesData as any;
            record = {
              id: s.id,
              user_id: s.user_id,
              media_id: s.series_id,
              media_type: "tv",
              title: s.series?.name || "Series",
              overview: s.series?.overview || null,
              poster_path: s.series?.poster_path || null,
              backdrop_path: s.series?.backdrop_path || null,
              custom_poster_path: s.custom_poster_path || null,
              custom_backdrop_path: s.custom_backdrop_path || null,
              status: s.status,
              is_favorite: Boolean(s.is_favorite),
              rating: s.rating ? Number(s.rating) : null,
              review: s.review || null,
              has_spoilers: Boolean(s.has_spoilers),
              watched_date: null,
              start_date: s.start_date || null,
              end_date: s.end_date || null,
              season_number: s.season_number || 1,
              last_watched_episode: s.last_watched_episode || 0,
              created_at: s.created_at,
              updated_at: s.updated_at,
              users: s.users || null,
            };
          }
        }

        if (!ignore) {
          setReview(record);
        }

        if (record) {
          const endpoint =
            record.media_type === "movie"
              ? `/api/movies/${record.media_id}`
              : `/api/tv/${record.media_id}?season=${record.season_number || 1}`;

          fetch(endpoint)
            .then((res) => (res.ok ? res.json() : null))
            .then((tmdb) => {
              if (ignore || !tmdb) return;
              if (Array.isArray(tmdb.seasons)) {
                setTvSeasons(tmdb.seasons);
              }
              const date = tmdb.release_date || tmdb.first_air_date || "";
              const genres = Array.isArray(tmdb.genres)
                ? tmdb.genres.map((g: any) => g.name)
                : [];
              const seasonSummary = Array.isArray(tmdb.seasons)
                ? tmdb.seasons.find(
                    (s: any) => s.season_number === (record.season_number || 1)
                  )
                : null;
              const seasonPoster =
                tmdb.initialSeason?.poster_path ||
                seasonSummary?.poster_path ||
                tmdb.poster_path;

              setTmdbMeta({
                title: tmdb.title || tmdb.name,
                original_title: tmdb.original_title || tmdb.original_name,
                release_date: date,
                runtime:
                  tmdb.runtime ||
                  (Array.isArray(tmdb.episode_run_time) && tmdb.episode_run_time.length > 0
                    ? tmdb.episode_run_time[0]
                    : undefined),
                episodesCount: tmdb.number_of_episodes,
                genres,
                tagline: tmdb.tagline || "",
                overview: tmdb.overview,
                backdrop_path: tmdb.backdrop_path,
                poster_path: seasonPoster,
              });
            })
            .catch(() => {});
        }
      } catch (err) {
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      ignore = true;
    };
  }, [id, typeHint, supabase]);

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

  const regularSeasons = useMemo(() => {
    if (review?.media_type !== "tv") return [];
    const filtered = (tvSeasons || []).filter((s) => s.season_number > 0);
    if (filtered.length > 0) return filtered;
    const seasonNum = review.season_number || 1;
    return Array.from({ length: seasonNum }, (_, idx) => ({
      id: idx + 1,
      season_number: idx + 1,
      name: `Season ${idx + 1}`,
      overview: "",
      poster_path: null,
      air_date: null,
      episode_count: 0,
    }));
  }, [review, tvSeasons]);

  const handleSaveReview = async (reviewData: MediaReviewData) => {
    if (!review || !isOwner) return;

    try {
      setIsSaving(true);
      const table = review.media_type === "movie" ? "user_movies" : "user_series";

      const payload: Record<string, any> = {
        status: reviewData.status,
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
      const table = review.media_type === "movie" ? "user_movies" : "user_series";

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

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">Review could not be found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const mediaHref =
    review.media_type === "movie"
      ? `/movie/${review.media_id}`
      : `/tv/${review.media_id}${
          review.season_number ? `?season=${review.season_number}` : ""
        }`;

  const ratingVal = review.rating ? Number(review.rating) : 0;
  const authorName = review.users?.username || "User";

  const resolvedTitle = tmdbMeta?.title || review.title;
  const resolvedTypeLabel = review.media_type === "movie" ? "Movie" : "Series";

  const posterColumnNode = (
    <div className="relative w-56 sm:w-full">
      {regularSeasons.length > 0 && (
        <>
          <div className="hidden sm:flex absolute -left-20 sm:-left-24 lg:-left-26 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
            <SeasonRevolver
              seasons={regularSeasons}
              activeSeason={review.season_number || 1}
              readOnly
            />
          </div>
          <div className="sm:hidden flex items-center justify-center mb-3 p-1 rounded-sm bg-zinc-900 border border-zinc-800">
            <SeasonRevolver
              seasons={regularSeasons}
              activeSeason={review.season_number || 1}
              readOnly
            />
          </div>
        </>
      )}

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
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-900">
            {review.media_type === "movie" ? (
              <Film className="w-12 h-12 mb-2 stroke-[1.5]" />
            ) : (
              <Tv className="w-12 h-12 mb-2 stroke-[1.5]" />
            )}
            <span className="text-xs text-zinc-500 font-semibold">No Poster</span>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="flex items-stretch bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-sm overflow-hidden shadow-xl">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            title="Edit review"
            className="w-full flex items-center justify-center py-3 sm:py-3.5 text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70 transition-colors cursor-pointer group"
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
            <Link href={mediaHref} className="hover:text-[#a8dadc] transition-colors">
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

              <div className="px-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors whitespace-nowrap">
                <span className="text-zinc-400 font-normal">by</span>
                <span>{authorName}</span>
              </div>

              <div
                title={review.status ? review.status.charAt(0).toUpperCase() + review.status.slice(1) : ""}
                className="border-l border-zinc-700/60 px-3 flex items-center justify-center text-zinc-300 shrink-0"
              >
                {review.status === "watched" && (
                  <Eye className="w-4 h-4 text-[#a8dadc]" />
                )}
                {review.status === "watching" && (
                  <PlayCircle className="w-4 h-4 text-[#a8dadc]" />
                )}
                {review.status === "paused" && (
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                )}
                {review.status === "dropped" && (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                {review.status === "watchlist" && (
                  <Bookmark className="w-4 h-4 text-[#a8dadc] fill-[#a8dadc]" />
                )}
              </div>

              {review.is_favorite && (
                <div
                  title="Favorite"
                  className="border-l border-zinc-700/60 px-2.5 flex items-center justify-center text-[#a8dadc] shrink-0"
                >
                  <Heart className="w-4 h-4 fill-[#a8dadc]" />
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
                      <Star className="w-full h-full text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                    )}
                    {isHalf && (
                      <StarHalf className="w-full h-full text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
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
          typeLabel={review.media_type === "movie" ? "Movie" : "Series"}
          year={tmdbMeta?.release_date ? tmdbMeta.release_date.split("-")[0] : undefined}
          posterUrl={posterUrl}
          backdropUrl={backdropUrl}
          mediaType={review.media_type}
          status={review.status}
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

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <ReviewDetailContent />
    </Suspense>
  );
}