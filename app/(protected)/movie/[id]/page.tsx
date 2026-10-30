"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { MovieDetails, MovieImage, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import FranchiseSlider from "@/components/ui/FranchiseSlider";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/modules/MediaLayout";
import MediaActionColumn, { MediaStatus } from "@/components/modules/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/modules/columns/MediaInfoColumn";
import MediaReviewModal from "@/components/modules/modals/MediaReviewModal";
import ArtworkPickerModal from "@/components/modules/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/modules/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import CastTab from "@/components/modules/tabs/CastTab";
import CrewTab from "@/components/modules/tabs/CrewTab";
import DetailsTab from "@/components/modules/tabs/DetailsTab";
import ReleasesTab from "@/components/modules/tabs/ReleasesTab";
import { getMovieCrewSections, getReleaseDateGroups } from "@/lib/media-utils";

function MovieDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState<string | null>(null);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  const [movieStatus, setMovieStatus] = useState<MediaStatus>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [watchedDate, setWatchedDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"cast" | "staff" | "details" | "releases">("cast");

  useEffect(() => {
    let ignore = false;
    async function fetchUserLog() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !id) return;

        const { data } = await supabase
          .from("user_movies")
          .select("*")
          .eq("movie_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (ignore || !data) return;

        setMovieStatus(data.status);
        setIsFavorite(Boolean(data.is_favorite));
        setRating(data.rating ? Number(data.rating) : 0);
        setReview(data.review || "");
        setHasSpoilers(Boolean(data.has_spoilers));
        setWatchedDate(data.watched_date || "");
        if (data.custom_poster_path) setSelectedPoster(data.custom_poster_path);
        if (data.custom_backdrop_path) setSelectedBackdrop(data.custom_backdrop_path);
      } catch (err) {
      }
    }
    fetchUserLog();
    return () => {
      ignore = true;
    };
  }, [id, supabase]);

  const handleQuickAction = async (newStatus: MediaStatus, newFavorite: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !movie) return;

      await supabase.from("movies").upsert({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
      });

      await supabase.from("user_movies").upsert(
        {
          user_id: session.user.id,
          movie_id: movie.id,
          status: newStatus,
          is_favorite: newFavorite,
          custom_poster_path: selectedPoster,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,movie_id" }
      );
    } catch (err) {
    }
  };

  const handleSaveReview = async () => {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to save your review", "error");
        setIsSaving(false);
        return;
      }

      if (!movie) return;

      const { error: movieError } = await supabase.from("movies").upsert({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
      });

      if (movieError) {
        addToast("Error saving movie data", "error");
        setIsSaving(false);
        return;
      }

      const { error: logError } = await supabase.from("user_movies").upsert(
        {
          user_id: session.user.id,
          movie_id: movie.id,
          status: movieStatus,
          is_favorite: isFavorite,
          rating: rating > 0 ? rating : null,
          review: review.trim() || null,
          has_spoilers: hasSpoilers,
          watched_date: watchedDate || null,
          custom_poster_path: selectedPoster,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,movie_id" }
      );

      if (logError) {
        addToast("Error saving review", "error");
        setIsSaving(false);
        return;
      }

      addToast("Review saved successfully", "success");
      setIsLogModalOpen(false);
    } catch (err) {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function fetchMovie() {
      try {
        setLoading(true);
        const res = await fetch(`/api/movies/${id}`);
        if (!res.ok) throw new Error("Failed to fetch movie");
        const data: MovieDetails = await res.json();

        if (!ignore) {
          const rawBackdrops = data.images?.backdrops || [];
          const validBackdrops = rawBackdrops.filter(
            (b) =>
              Boolean(b.file_path) &&
              (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
          );

          const defaultBackdrop = data.backdrop_path;
          const highQualityScenic = validBackdrops
            .filter(
              (b) =>
                b.file_path !== defaultBackdrop &&
                (b.width ?? 0) >= 1920 &&
                (b.iso_639_1 === null || b.iso_639_1 === "en")
            )
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

          let chosenBackdrop = defaultBackdrop;

          if (highQualityScenic.length > 0) {
            const topCandidates = highQualityScenic.slice(0, 10);
            chosenBackdrop =
              topCandidates[Math.floor(Math.random() * topCandidates.length)].file_path;
          } else {
            const withoutDefault = validBackdrops
              .filter((b) => b.file_path !== defaultBackdrop)
              .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

            if (withoutDefault.length > 0) {
              const topCandidates = withoutDefault.slice(0, 10);
              chosenBackdrop =
                topCandidates[Math.floor(Math.random() * topCandidates.length)].file_path;
            } else if (validBackdrops.length > 0) {
              chosenBackdrop = validBackdrops[0].file_path;
            }
          }

          const rawPosters = data.images?.posters || [];
          const validPosters = rawPosters.filter(
            (p) =>
              Boolean(p.file_path) &&
              (!p.aspect_ratio || (p.aspect_ratio >= 0.6 && p.aspect_ratio <= 0.75))
          );

          const sortedPosters = [...validPosters].sort((a, b) => {
            const langA = a.iso_639_1 === "en" ? 2 : a.iso_639_1 === null ? 1 : 0;
            const langB = b.iso_639_1 === "en" ? 2 : b.iso_639_1 === null ? 1 : 0;
            if (langA !== langB) return langB - langA;
            return (b.vote_count ?? 0) - (a.vote_count ?? 0);
          });

          const chosenPoster = sortedPosters[0]?.file_path || data.poster_path;

          setSelectedBackdrop(chosenBackdrop);
          setSelectedPoster(chosenPoster);
          setMovie(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchMovie();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    setIsBackdropLoaded(false);
  }, [selectedBackdrop]);

  const [dedupedPosters, setDedupedPosters] = useState<MovieImage[] | null>(null);
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [dedupedBackdrops, setDedupedBackdrops] = useState<MovieImage[] | null>(null);
  const [loadingBackdrops, setLoadingBackdrops] = useState(false);

  useEffect(() => {
    setDedupedPosters(null);
    setDedupedBackdrops(null);
  }, [id]);

  useEffect(() => {
    if (!id || dedupedPosters) return;

    let ignore = false;

    async function fetchPosters() {
      try {
        setLoadingPosters(true);
        const res = await fetch(`/api/movies/${id}/posters`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.posters?.length) {
            setDedupedPosters(data.posters);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoadingPosters(false);
        }
      }
    }

    fetchPosters();

    return () => {
      ignore = true;
    };
  }, [id, dedupedPosters]);

  useEffect(() => {
    if (!id || dedupedBackdrops) return;

    let ignore = false;

    async function fetchBackdrops() {
      try {
        setLoadingBackdrops(true);
        const res = await fetch(`/api/movies/${id}/backdrops`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.backdrops?.length) {
            setDedupedBackdrops(data.backdrops);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoadingBackdrops(false);
        }
      }
    }

    fetchBackdrops();

    return () => {
      ignore = true;
    };
  }, [id, dedupedBackdrops]);

  const handleSelectPoster = async (path: string) => {
    setSelectedPoster(path);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && movie && movieStatus) {
        await supabase
          .from("user_movies")
          .update({ custom_poster_path: path })
          .eq("user_id", session.user.id)
          .eq("movie_id", movie.id);
      }
    } catch {}
  };

  const handleSelectBackdrop = async (path: string) => {
    setSelectedBackdrop(path);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && movie && movieStatus) {
        await supabase
          .from("user_movies")
          .update({ custom_backdrop_path: path })
          .eq("user_id", session.user.id)
          .eq("movie_id", movie.id);
      }
    } catch {}
  };

  const sectionCrew = useMemo(() => {
    return getMovieCrewSections(movie?.credits?.crew);
  }, [movie]);

  const releaseDateGroups = useMemo(() => {
    return getReleaseDateGroups(movie?.release_dates?.results);
  }, [movie]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">Movie could not be found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const backdropUrl = getBackdropUrl(selectedBackdrop, "original");
  const posterUrl = getPosterUrl(selectedPoster, "w500");
  const hasMultiplePosters = (dedupedPosters?.length || movie.images?.posters?.length || 0) > 1;
  const hasMultipleBackdrops = (dedupedBackdrops?.length || movie.images?.backdrops?.length || 0) > 1;

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={movie.title}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        hasMultipleBackdrops={hasMultipleBackdrops}
        onOpenBackdropPicker={() => setIsBackdropPickerOpen(true)}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={movie.title}
            hasMultiplePosters={hasMultiplePosters}
            onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
            mediaType="movie"
            status={movieStatus}
            isFavorite={isFavorite}
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onQuickStatusChange={(newStatus) => {
              setMovieStatus(newStatus);
              handleQuickAction(newStatus, isFavorite);
            }}
            onToggleFavorite={() => {
              const nextFav = !isFavorite;
              setIsFavorite(nextFav);
              handleQuickAction(movieStatus, nextFav);
            }}
          />
        }
      >
        <MediaInfoColumn
          typeLabel="Movie"
          title={movie.title}
          originalTitle={movie.original_title}
          releaseDate={movie.release_date}
          runtimeMinutes={movie.runtime}
          tagline={movie.tagline}
          overview={movie.overview}
        >
          <MediaTabsNav
            tabs={[
              { key: "cast", label: "Cast" },
              { key: "staff", label: "Crew" },
              { key: "details", label: "Details" },
              { key: "releases", label: "Releases" },
            ]}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as any)}
          />

          {activeTab === "cast" && <CastTab cast={movie.credits?.cast || []} />}
          {activeTab === "staff" && <CrewTab sections={sectionCrew} />}
          {activeTab === "details" && (
            <DetailsTab
              productionCompanies={movie.production_companies}
              originalTitle={movie.original_title}
              status={movie.status}
              originalLanguage={movie.original_language}
              budget={movie.budget}
              revenue={movie.revenue}
              genres={movie.genres}
            />
          )}
          {activeTab === "releases" && <ReleasesTab groups={releaseDateGroups} />}

          {movie.collection?.parts && movie.collection.parts.length > 0 && (
            <div className="mt-12 sm:mt-14">
              <div className="relative border-b border-zinc-800/60 mb-6 pb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  Franchise
                </span>
              </div>

              <FranchiseSlider
                parts={movie.collection.parts}
                currentMovieId={movie.id}
              />
            </div>
          )}
        </MediaInfoColumn>
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={isPosterPickerOpen}
        onClose={() => setIsPosterPickerOpen(false)}
        title="CHANGE ARTWORK"
        type="poster"
        images={dedupedPosters || []}
        selectedImage={selectedPoster}
        onSelectImage={handleSelectPoster}
        isLoading={loadingPosters}
      />

      <BackdropPickerModal
        isOpen={isBackdropPickerOpen}
        onClose={() => setIsBackdropPickerOpen(false)}
        title="CHANGE BANNER"
        images={dedupedBackdrops || (movie.images?.backdrops || []).slice(0, 30)}
        selectedImage={selectedBackdrop}
        onSelectImage={handleSelectBackdrop}
        isLoading={loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={movie.title}
        year={movie.release_date ? new Date(movie.release_date).getFullYear() : "—"}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="movie"
        status={movieStatus}
        isFavorite={isFavorite}
        rating={rating}
        review={review}
        hasSpoilers={hasSpoilers}
        watchedDate={watchedDate}
        isSaving={isSaving}
        onStatusChange={setMovieStatus}
        onFavoriteChange={setIsFavorite}
        onRatingChange={setRating}
        onReviewChange={setReview}
        onSpoilersChange={setHasSpoilers}
        onWatchedDateChange={setWatchedDate}
        onSave={handleSaveReview}
      />
    </>
  );
}

export default function MovieDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <MovieDetailContent />
    </Suspense>
  );
}
