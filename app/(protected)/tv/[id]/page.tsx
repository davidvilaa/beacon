"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  TvDetails,
  TvSeasonDetails,
  getPosterUrl,
  getBackdropUrl,
  getBestTmdbTrailer,
} from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import SeasonRevolver from "@/components/ui/SeasonRevolver";
import MediaLayout from "@/components/modules/MediaLayout";
import MediaActionColumn from "@/components/modules/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/modules/columns/MediaInfoColumn";
import MediaReviewModal from "@/components/modules/modals/MediaReviewModal";
import ListModal from "@/components/modules/modals/ListModal";
import ArtworkPickerModal from "@/components/modules/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/modules/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import CastTab from "@/components/modules/tabs/CastTab";
import CrewTab from "@/components/modules/tabs/CrewTab";
import DetailsTab from "@/components/modules/tabs/DetailsTab";
import EpisodesTab from "@/components/modules/tabs/EpisodesTab";
import { getTvCrewSections, isMediaReleased } from "@/lib/media-utils";
import { tvCacheInput } from "@/lib/media/cache";
import { pickRandomBackdrop } from "@/lib/artwork/pick";
import { useMediaLog } from "@/hooks/useMediaLog";
import { useArtworkOptions } from "@/hooks/useArtworkOptions";

type TvTab = "cast" | "crew" | "details" | "episodes" | "trailer";
type OpenModal = "poster" | "backdrop" | "log" | "list" | null;

function TvDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const initialSeasonParam = parseInt(searchParams.get("season") || "1", 10);
  const startingSeason = isNaN(initialSeasonParam) ? 1 : initialSeasonParam;

  const [tv, setTv] = useState<TvDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeSeason, setActiveSeason] = useState<number>(startingSeason);
  const [seasonCache, setSeasonCache] = useState<Record<number, TvSeasonDetails>>({});
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);

  const [randomBackdrop, setRandomBackdrop] = useState<string | null>(null);
  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [activeTab, setActiveTab] = useState<TvTab>("cast");

  const regularSeasons = useMemo(() => {
    if (!tv?.seasons) return [];
    return tv.seasons
      .filter((s) => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
  }, [tv]);

  const currentSeasonSummary = useMemo(() => {
    return tv?.seasons?.find((s) => s.season_number === activeSeason) || null;
  }, [tv, activeSeason]);

  const currentSeasonDetails = seasonCache[activeSeason] || null;

  const currentSeasonEpisodeCount =
    currentSeasonDetails?.episodes?.length || currentSeasonSummary?.episode_count || 0;

  const trailer = useMemo(() => {
    return (
      getBestTmdbTrailer(currentSeasonDetails?.videos) ||
      getBestTmdbTrailer(tv?.videos)
    );
  }, [currentSeasonDetails?.videos, tv?.videos]);

  const hasTrailer = Boolean(trailer?.key);

  useEffect(() => {
    if (activeTab === "trailer" && !hasTrailer) {
      setActiveTab("cast");
    }
  }, [activeTab, hasTrailer]);

  const rawDate =
    currentSeasonDetails?.air_date ||
    currentSeasonSummary?.air_date ||
    tv?.first_air_date;

  const isReleased = useMemo(() => {
    if (!tv) return true;
    return isMediaReleased("tv", tv.status, rawDate);
  }, [tv, rawDate]);

  const artwork = useArtworkOptions({
    postersUrl: id ? `/api/tv/${id}/posters?season=${activeSeason}` : null,
    backdropsUrl: id ? `/api/tv/${id}/backdrops` : null,
    eagerPosters: true,
    randomPool: 5,
  });

  const cacheInput = useMemo(() => (tv ? tvCacheInput(tv) : null), [tv]);

  const log = useMediaLog({
    mediaType: "tv",
    mediaId: Number(id) || null,
    seasonNumber: activeSeason,
    cacheInput,
    isReleased,
    episodeCount: currentSeasonEpisodeCount,
    defaultPoster:
      artwork.randomPoster ||
      currentSeasonDetails?.poster_path ||
      currentSeasonSummary?.poster_path ||
      tv?.poster_path ||
      null,
    defaultBackdrop: randomBackdrop ?? tv?.backdrop_path ?? null,
  });

  const openWithArtwork = (modal: Exclude<OpenModal, null>) => {
    artwork.load();
    setOpenModal(modal);
  };

  useEffect(() => {
    let ignore = false;

    async function fetchTv() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tv/${id}`);
        if (!res.ok) throw new Error("Failed to fetch tv details");
        const data: TvDetails = await res.json();

        if (ignore) return;
        setTv(data);
        setRandomBackdrop(pickRandomBackdrop(data.images?.backdrops, data.backdrop_path));

        const regular = (data.seasons || []).filter((s) => s.season_number > 0);
        setActiveSeason((current) =>
          regular.some((s) => s.season_number === current)
            ? current
            : regular[0]?.season_number ?? 1
        );
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
      fetchTv();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    const seasonParam = parseInt(searchParams.get("season") || "", 10);
    if (!isNaN(seasonParam) && seasonParam > 0 && seasonParam !== activeSeason) {
      setActiveSeason(seasonParam);
    }
  }, [searchParams, activeSeason]);

  const handleSelectSeason = useCallback(
    async (seasonNum: number) => {
      if (seasonNum === activeSeason) return;

      setActiveSeason(seasonNum);
      window.history.replaceState(null, "", `/tv/${id}?season=${seasonNum}`);

      if (seasonCache[seasonNum]) {
        return;
      }

      try {
        setIsSeasonLoading(true);
        const res = await fetch(`/api/tv/${id}/season/${seasonNum}`);
        if (res.ok) {
          const seasonData: TvSeasonDetails = await res.json();
          setSeasonCache((prev) => ({ ...prev, [seasonNum]: seasonData }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSeasonLoading(false);
      }
    },
    [activeSeason, id, seasonCache]
  );

  useEffect(() => {
    if (!id || seasonCache[activeSeason]) return;

    let ignore = false;

    async function fetchInitialSeason() {
      try {
        setIsSeasonLoading(true);
        const res = await fetch(`/api/tv/${id}/season/${activeSeason}`);
        if (res.ok) {
          const data: TvSeasonDetails = await res.json();
          if (!ignore) {
            setSeasonCache((prev) => ({ ...prev, [activeSeason]: data }));
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setIsSeasonLoading(false);
        }
      }
    }

    fetchInitialSeason();

    return () => {
      ignore = true;
    };
  }, [id, activeSeason, seasonCache]);

  const totalRuntimeMinutes = useMemo(() => {
    if (!currentSeasonDetails?.episodes) return 0;
    return currentSeasonDetails.episodes.reduce((acc, ep) => acc + (ep.runtime || 0), 0);
  }, [currentSeasonDetails]);

  const castList = useMemo(() => {
    return currentSeasonDetails?.credits?.cast || tv?.credits?.cast || [];
  }, [currentSeasonDetails, tv]);

  const crewList = useMemo(() => {
    return currentSeasonDetails?.credits?.crew || tv?.credits?.crew || [];
  }, [currentSeasonDetails, tv]);

  const crewSections = useMemo(() => {
    return getTvCrewSections(crewList, tv?.created_by);
  }, [crewList, tv?.created_by]);

  const posterUrl = getPosterUrl(log.poster, "w500");
  const backdropUrl = getBackdropUrl(log.backdrop, "original");

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!tv) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">TV Show could not be found.</p>
        <Link href="/search" className="text-xs text-accent hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const overviewText =
    currentSeasonDetails?.overview || currentSeasonSummary?.overview || tv.overview || "";

  const episodesCount =
    currentSeasonDetails?.episodes?.length ?? currentSeasonSummary?.episode_count ?? 0;

  const seasonYear = currentSeasonSummary?.air_date
    ? new Date(currentSeasonSummary.air_date).getFullYear()
    : tv.first_air_date
    ? new Date(tv.first_air_date).getFullYear()
    : "—";

  const backdropOptions = artwork.backdropsLoaded
    ? artwork.backdrops
    : (tv.images?.backdrops || []).slice(0, 80);

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={tv.name}
        isBackdropLoaded={loadedBackdrop === backdropUrl}
        onBackdropLoaded={() => setLoadedBackdrop(backdropUrl)}
        hasMultipleBackdrops={(tv.images?.backdrops?.length || 0) > 1}
        onOpenBackdropPicker={() => openWithArtwork("backdrop")}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={tv.name}
            hasMultiplePosters={true}
            onOpenPosterPicker={() => openWithArtwork("poster")}
            mediaType="tv"
            status={log.status}
            isFavorite={log.isFavorite}
            hasLog={log.hasLog}
            isReleased={isReleased}
            onOpenLogModal={() => openWithArtwork("log")}
            onOpenListModal={() => openWithArtwork("list")}
            currentEpisode={log.lastWatchedEpisode}
            totalEpisodes={currentSeasonEpisodeCount}
            onEpisodeChange={log.changeEpisode}
            onQuickStatusChange={log.setStatus}
            onToggleFavorite={log.toggleFavorite}
          >
            {regularSeasons.length > 0 && (
              <>
                <div className="hidden sm:flex absolute -left-20 sm:-left-24 lg:-left-26 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
                  <SeasonRevolver
                    seasons={regularSeasons}
                    activeSeason={activeSeason}
                    onSelectSeason={handleSelectSeason}
                  />
                </div>
                <div className="sm:hidden flex items-center justify-center mb-3 p-1 rounded-sm bg-zinc-900 border border-zinc-800">
                  <SeasonRevolver
                    seasons={regularSeasons}
                    activeSeason={activeSeason}
                    onSelectSeason={handleSelectSeason}
                  />
                </div>
              </>
            )}
          </MediaActionColumn>
        }
      >
        <MediaInfoColumn
          typeLabel="Series"
          title={tv.name}
          originalTitle={tv.original_name}
          releaseDate={rawDate}
          runtimeMinutes={totalRuntimeMinutes}
          episodesCount={episodesCount}
          tagline={tv.tagline}
          overview={overviewText}
        >
          <MediaTabsNav
            tabs={[
              { key: "cast", label: "Cast" },
              { key: "crew", label: "Crew" },
              { key: "details", label: "Details" },
              { key: "episodes", label: "Episodes" },
              ...(hasTrailer ? [{ key: "trailer", label: "Trailer" }] : []),
            ]}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as TvTab)}
          />

          {activeTab === "cast" && (
            <CastTab
              cast={castList}
              emptyMessage="No cast information available for this season."
            />
          )}
          {activeTab === "crew" && <CrewTab sections={crewSections} />}
          {activeTab === "details" && (
            <DetailsTab
              productionCompanies={tv.production_companies}
              originalTitle={tv.original_name}
              status={tv.status}
              originalLanguage={tv.original_language}
              seasonsCount={tv.number_of_seasons}
              episodesCount={tv.number_of_episodes}
              genres={tv.genres}
            />
          )}
          {activeTab === "episodes" && (
            <EpisodesTab episodes={currentSeasonDetails?.episodes} isLoading={isSeasonLoading} />
          )}
          {activeTab === "trailer" && trailer?.key && (
            <div className="aspect-video w-full max-w-4xl rounded-sm overflow-hidden border border-zinc-800 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={`${tv.name} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
        typeLabel="Series"
        title={tv.name}
        releaseDate={rawDate}
        runtimeMinutes={totalRuntimeMinutes}
        episodesCount={episodesCount}
        year={seasonYear}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="tv"
        status={log.status}
        hasLog={log.hasLog}
        isReleased={isReleased}
        isFavorite={log.isFavorite}
        canAddFavorite={log.canAddFavorite}
        rating={log.rating}
        review={log.review}
        hasSpoilers={log.hasSpoilers}
        startDate={log.startDate}
        endDate={log.endDate}
        isSaving={log.isSaving}
        onSave={async (data) => {
          if (await log.saveReview(data)) setOpenModal(null);
        }}
        onDelete={async () => {
          if (await log.deleteLog()) setOpenModal(null);
        }}
        availablePosters={artwork.posters}
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
          mediaType: "tv",
          mediaId: tv.id,
          seasonNumber: activeSeason,
          seasonTitle: currentSeasonSummary?.name || `Season ${activeSeason}`,
          title: tv.name,
          overview: currentSeasonDetails?.overview || currentSeasonSummary?.overview || tv.overview,
          posterPath:
            currentSeasonDetails?.poster_path || currentSeasonSummary?.poster_path || tv.poster_path,
          backdropPath: tv.backdrop_path,
          customPosterPath: log.poster,
          customBackdropPath: log.backdrop,
          numberOfSeasons: tv.number_of_seasons,
          numberOfEpisodes: tv.number_of_episodes,
        }}
        availablePosters={artwork.posters}
        availableBackdrops={backdropOptions}
        selectedPoster={log.poster}
        selectedBackdrop={log.backdrop}
        loadingPosters={artwork.loadingPosters}
        loadingBackdrops={artwork.loadingBackdrops}
      />
    </>
  );
}

export default function TvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <TvDetailContent />
    </Suspense>
  );
}
