"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Eye,
  Bookmark,
  PlayCircle,
  PauseCircle,
  XCircle,
  Heart,
  Share2,
  Pencil,
  ArrowLeft,
  AlertTriangle,
  Film,
  Tv,
  UserCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import MediaReviewModal, {
  MediaReviewData,
} from "@/components/modules/modals/MediaReviewModal";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
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
  const [extraDetails, setExtraDetails] = useState<{
    year?: string;
    runtime?: number;
    genres?: string[];
    tagline?: string;
  } | null>(null);

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
              : `/api/tv/${record.media_id}`;

          fetch(endpoint)
            .then((res) => (res.ok ? res.json() : null))
            .then((tmdb) => {
              if (ignore || !tmdb) return;
              const date = tmdb.release_date || tmdb.first_air_date || "";
              const year = date ? date.split("-")[0] : "";
              const genres = Array.isArray(tmdb.genres)
                ? tmdb.genres.map((g: any) => g.name)
                : [];
              setExtraDetails({
                year,
                runtime: tmdb.runtime || (Array.isArray(tmdb.episode_run_time) ? tmdb.episode_run_time[0] : undefined),
                genres,
                tagline: tmdb.tagline || "",
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

  const posterUrl = useMemo(() => {
    if (!review) return null;
    return getPosterUrl(
      review.custom_poster_path || review.poster_path,
      "w500"
    );
  }, [review]);

  const backdropUrl = useMemo(() => {
    if (!review) return null;
    return getBackdropUrl(
      review.custom_backdrop_path || review.backdrop_path,
      "original"
    );
  }, [review]);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        addToast("Review link copied to clipboard", "success");
      }
    } catch {
      addToast("Failed to copy link", "error");
    }
  };

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
  const displayDate = review.watched_date
    ? `Watched on ${formatFullDate(review.watched_date)}`
    : `Logged on ${formatFullDate(review.created_at.split("T")[0])}`;

  return (
    <div className="relative flex-1 w-full min-h-[85vh] font-[family-name:var(--font-geist-sans)] pb-24">
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-[420px] overflow-hidden pointer-events-none select-none z-0">
          <div
            className="relative w-full h-full opacity-25"
            style={{
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)",
            }}
          >
            <Image
              src={backdropUrl}
              alt={review.title}
              fill
              priority
              className="object-cover object-top"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>
      )}

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-8">
        <div className="mb-6">
          <Link
            href={`/profile/${authorName}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-[#a8dadc] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {authorName}&apos;s profile</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          <aside className="w-full sm:w-56 md:w-64 lg:w-72 shrink-0 flex flex-col items-center sm:items-start">
            <div className="aspect-[2/3] w-52 sm:w-full rounded-sm overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl relative">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={review.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 208px, (max-width: 1024px) 256px, 288px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-900">
                  {review.media_type === "movie" ? (
                    <Film className="w-12 h-12 mb-2 stroke-[1.5]" />
                  ) : (
                    <Tv className="w-12 h-12 mb-2 stroke-[1.5]" />
                  )}
                  <span className="text-xs text-zinc-500 font-semibold">
                    No Poster
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 w-52 sm:w-full flex flex-col gap-2">
              <Link
                href={mediaHref}
                className="w-full py-2.5 px-3 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>
                  Go to {review.media_type === "movie" ? "Movie" : "Series"}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-sm bg-zinc-800/80 hover:bg-zinc-800 text-xs font-semibold text-[#a8dadc] border border-zinc-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Review</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 px-3 rounded-sm bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Review</span>
              </button>
            </div>

            {extraDetails?.genres && extraDetails.genres.length > 0 && (
              <div className="mt-6 w-52 sm:w-full p-4 rounded-sm bg-zinc-900/40 border border-zinc-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                  Genres
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {extraDetails.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-sm bg-zinc-800/80 border border-zinc-700/60 text-zinc-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section className="flex-1 min-w-0 w-full">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700/80 text-[#a8dadc]">
                  {review.media_type === "movie" ? "Movie" : "Series"}
                </span>
                {review.season_number && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                    Season {review.season_number}
                  </span>
                )}
                {extraDetails?.year && (
                  <span className="text-xs font-mono text-zinc-400 font-semibold">
                    {extraDetails.year}
                  </span>
                )}
              </div>

              <Link href={mediaHref} className="group inline-block">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-100 tracking-tight leading-tight group-hover:text-[#a8dadc] transition-colors">
                  {review.title}
                </h1>
              </Link>

              {extraDetails?.tagline && (
                <p className="text-sm italic text-zinc-400 mt-1">
                  &ldquo;{extraDetails.tagline}&rdquo;
                </p>
              )}
            </div>

            <div className="mt-6 p-4 sm:p-5 rounded-sm bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${authorName}`}
                  className="shrink-0 transition-opacity hover:opacity-80"
                >
                  {review.users?.avatar_url ? (
                    <img
                      src={review.users.avatar_url}
                      alt={authorName}
                      className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <UserCircle className="w-7 h-7 text-zinc-500" />
                    </div>
                  )}
                </Link>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-zinc-400 font-medium">Review by</span>
                    <Link
                      href={`/profile/${authorName}`}
                      className="text-sm sm:text-base font-bold text-zinc-100 hover:text-[#a8dadc] transition-colors"
                    >
                      {authorName}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{displayDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {review.status === "watched" && (
                    <Eye className="w-3.5 h-3.5 text-[#a8dadc]" />
                  )}
                  {review.status === "watching" && (
                    <PlayCircle className="w-3.5 h-3.5 text-[#a8dadc]" />
                  )}
                  {review.status === "paused" && (
                    <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {review.status === "dropped" && (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  {review.status === "watchlist" && (
                    <Bookmark className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" />
                  )}
                  <span className="capitalize">{review.status}</span>
                </span>

                {review.is_favorite && (
                  <span
                    title="Favorite"
                    className="p-1.5 rounded-sm bg-zinc-800 border border-zinc-700 text-[#a8dadc]"
                  >
                    <Heart className="w-4 h-4 fill-[#a8dadc]" />
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div
                className="flex items-center gap-1 shrink-0"
                title={ratingVal > 0 ? `${ratingVal} / 5` : "Unrated"}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFull = ratingVal >= star;
                  const isHalf = !isFull && ratingVal >= star - 0.5;

                  return (
                    <div key={star} className="relative w-5 sm:w-6 h-5 sm:h-6 shrink-0">
                      <Star className="w-full h-full text-zinc-700 stroke-[1.5]" />
                      {isFull && (
                        <div className="absolute inset-0">
                          <Star className="w-full h-full text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                        </div>
                      )}
                      {isHalf && (
                        <div className="absolute inset-0 overflow-hidden w-1/2">
                          <Star className="w-full h-full text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {ratingVal > 0 && (
                <span className="text-base sm:text-lg font-bold text-zinc-100 font-mono">
                  {ratingVal}
                  <span className="text-xs text-zinc-500 font-normal"> / 5</span>
                </span>
              )}
            </div>

            {review.has_spoilers && (
              <div className="mt-6 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>This review contains spoilers for {review.title}.</span>
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

            <div className="mt-4">
              <div
                className={`p-6 sm:p-8 rounded-sm bg-zinc-900/40 border border-zinc-800/80 shadow-xl transition-all ${
                  review.has_spoilers && !showSpoilers
                    ? "blur-md select-none pointer-events-none"
                    : ""
                }`}
              >
                {review.review && review.review.trim() ? (
                  <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap text-base sm:text-lg font-normal">
                    {review.review}
                  </p>
                ) : (
                  <p className="text-zinc-500 italic text-sm">
                    No written review was provided for this log entry.
                  </p>
                )}
              </div>
            </div>

            {review.media_type === "tv" && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {typeof review.last_watched_episode === "number" &&
                  review.last_watched_episode > 0 && (
                    <div className="p-3.5 rounded-sm bg-zinc-900/40 border border-zinc-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Last Watched
                      </span>
                      <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                        Episode {review.last_watched_episode}
                      </p>
                    </div>
                  )}

                {review.start_date && (
                  <div className="p-3.5 rounded-sm bg-zinc-900/40 border border-zinc-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Started
                    </span>
                    <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                      {formatFullDate(review.start_date)}
                    </p>
                  </div>
                )}

                {review.end_date && (
                  <div className="p-3.5 rounded-sm bg-zinc-900/40 border border-zinc-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Finished
                    </span>
                    <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                      {formatFullDate(review.end_date)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {isOwner && (
          <MediaReviewModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title={review.title}
            typeLabel={review.media_type === "movie" ? "Movie" : "Series"}
            year={extraDetails?.year}
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
      </main>
    </div>
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