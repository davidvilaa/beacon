"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPosterUrl, getBackdropUrl, getBestTmdbTrailer } from "@/lib/providers/tmdb/client";
import type { MovieDetails } from "@/lib/providers/tmdb/types";
import Loading from "@/components/ui/Loading";
import FranchiseSlider from "@/components/media/FranchiseSlider";
import MediaLayout from "@/components/media/MediaLayout";
import MediaActionColumn from "@/components/media/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/media/columns/MediaInfoColumn";
import MediaReviewModal from "@/components/media/modals/MediaReviewModal";
import ListModal from "@/components/lists/ListModal";
import ArtworkPickerModal from "@/components/media/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/media/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/media/tabs/MediaTabsNav";
import CastTab from "@/components/media/tabs/CastTab";
import CrewTab from "@/components/media/tabs/CrewTab";
import DetailsTab from "@/components/media/tabs/DetailsTab";
import ReleasesTab from "@/components/media/tabs/ReleasesTab";
import { getMovieCrewSections, getReleaseDateGroups } from "@/lib/media/credits";
import { isMediaReleased } from "@/lib/media/release";
import { movieCacheInput } from "@/lib/media/cache";
import { pickRandomBackdrop, pickRandomPoster } from "@/lib/artwork/pick";
import { useMediaLog } from "@/hooks/useMediaLog";
import { useArtworkOptions } from "@/hooks/useArtworkOptions";

type MovieTab = "cast" | "staff" | "details" | "releases" | "trailer";
type OpenModal = "poster" | "backdrop" | "log" | "list" | null;

function MovieDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [randomPoster, setRandomPoster] = useState<string | null>(null);
  const [randomBackdrop, setRandomBackdrop] = useState<string | null>(null);
  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [activeTab, setActiveTab] = useState<MovieTab>("cast");

  const trailer = useMemo(() => {
    if (!movie?.videos) return null;
    return getBestTmdbTrailer(movie.videos);
  }, [movie?.videos]);

  const hasTrailer = Boolean(trailer?.key);

  useEffect(() => {
    if (activeTab === "trailer" && !hasTrailer) {
      setActiveTab("cast");
    }
  }, [activeTab, hasTrailer]);

  const isReleased = useMemo(() => {
    if (!movie) return true;
    return isMediaReleased("movie", movie.status, movie.release_date);
  }, [movie]);

  const cacheInput = useMemo(() => (movie ? movieCacheInput(movie) : null), [movie]);

  const log = useMediaLog({
    mediaType: "movie",
    mediaId: Number(id) || null,
    cacheInput,
    isReleased,
    defaultPoster: randomPoster ?? movie?.poster_path ?? null,
    defaultBackdrop: randomBackdrop ?? movie?.backdrop_path ?? null,
  });

  const artwork = useArtworkOptions({
    postersUrl: id ? `/api/movie/${id}/posters` : null,
    backdropsUrl: id ? `/api/movie/${id}/backdrops` : null,
  });

  const openWithArtwork = (modal: Exclude<OpenModal, null>) => {
    artwork.load();
    setOpenModal(modal);
  };

  useEffect(() => {
    let ignore = false;

    async function fetchMovie() {
      try {
        setLoading(true);
        const res = await fetch(`/api/movie/${id}`);
        if (!res.ok) throw new Error("Failed to fetch movie");
        const data: MovieDetails = await res.json();

        if (!ignore) {
          setRandomBackdrop(pickRandomBackdrop(data.images?.backdrops, data.backdrop_path));
          setRandomPoster(pickRandomPoster(data.images?.posters, data.poster_path));
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

  const sectionCrew = useMemo(() => {
    return getMovieCrewSections(movie?.credits?.crew);
  }, [movie]);

  const releaseDateGroups = useMemo(() => {
    return getReleaseDateGroups(movie?.release_dates?.results);
  }, [movie]);

  const posterUrl = getPosterUrl(log.poster, "w500");
  const backdropUrl = getBackdropUrl(log.backdrop, "original");

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
          className="text-xs text-accent hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const posterOptions = artwork.postersLoaded
    ? artwork.posters
    : (movie.images?.posters || []).slice(0, 80);
  const backdropOptions = artwork.backdropsLoaded
    ? artwork.backdrops
    : (movie.images?.backdrops || []).slice(0, 80);
  const hasMultiplePosters = (movie.images?.posters?.length || 0) > 1;
  const hasMultipleBackdrops = (movie.images?.backdrops?.length || 0) > 1;

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={movie.title}
        isBackdropLoaded={loadedBackdrop === backdropUrl}
        onBackdropLoaded={() => setLoadedBackdrop(backdropUrl)}
        hasMultipleBackdrops={hasMultipleBackdrops}
        onOpenBackdropPicker={() => openWithArtwork("backdrop")}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={movie.title}
            hasMultiplePosters={hasMultiplePosters}
            onOpenPosterPicker={() => openWithArtwork("poster")}
            mediaType="movie"
            status={log.status}
            isFavorite={log.isFavorite}
            hasLog={log.hasLog}
            isReleased={isReleased}
            onOpenLogModal={() => openWithArtwork("log")}
            onOpenListModal={() => openWithArtwork("list")}
            onQuickStatusChange={log.setStatus}
            onToggleFavorite={log.toggleFavorite}
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
              ...(hasTrailer ? [{ key: "trailer", label: "Trailer" }] : []),
            ]}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as MovieTab)}
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

          {activeTab === "trailer" && trailer?.key && (
            <div className="aspect-video w-full max-w-4xl rounded-sm overflow-hidden border border-zinc-800 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={`${movie.title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

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
        isOpen={openModal === "poster"}
        onClose={() => setOpenModal(null)}
        title="CHANGE ARTWORK"
        type="poster"
        images={artwork.posters}
        selectedImage={log.poster}
        onSelectImage={log.setPoster}
        isLoading={artwork.loadingPosters}
      />

      <BackdropPickerModal
        isOpen={openModal === "backdrop"}
        onClose={() => setOpenModal(null)}
        title="CHANGE BANNER"
        images={backdropOptions}
        selectedImage={log.backdrop}
        onSelectImage={log.setBackdrop}
        isLoading={artwork.loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={openModal === "log"}
        onClose={() => setOpenModal(null)}
        typeLabel="Movie"
        title={movie.title}
        releaseDate={movie.release_date}
        runtimeMinutes={movie.runtime}
        year={movie.release_date ? new Date(movie.release_date).getFullYear() : "—"}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="movie"
        status={log.status}
        hasLog={log.hasLog}
        isReleased={isReleased}
        isFavorite={log.isFavorite}
        canAddFavorite={log.canAddFavorite}
        rating={log.rating}
        review={log.review}
        hasSpoilers={log.hasSpoilers}
        watchedDate={log.watchedDate}
        isSaving={log.isSaving}
        onSave={async (data) => {
          if (await log.saveReview(data)) setOpenModal(null);
        }}
        onDelete={async () => {
          if (await log.deleteLog()) setOpenModal(null);
        }}
        availablePosters={posterOptions}
        availableBackdrops={backdropOptions}
        selectedPoster={log.poster}
        selectedBackdrop={log.backdrop}
        loadingPosters={artwork.loadingPosters}
        loadingBackdrops={artwork.loadingBackdrops}
      />

      <ListModal
        isOpen={openModal === "list"}
        onClose={() => setOpenModal(null)}
        media={{
          mediaType: "movie",
          mediaId: movie.id,
          title: movie.title,
          overview: movie.overview,
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          customPosterPath: log.poster,
          customBackdropPath: log.backdrop,
        }}
        availablePosters={posterOptions}
        availableBackdrops={backdropOptions}
        selectedPoster={log.poster}
        selectedBackdrop={log.backdrop}
        loadingPosters={artwork.loadingPosters}
        loadingBackdrops={artwork.loadingBackdrops}
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
