"use client";

import { useState, useMemo } from "react";
import { getPosterUrl, getBackdropUrl, getBestTmdbTrailer } from "@/lib/providers/tmdb/client";
import type { TvDetails } from "@/lib/providers/tmdb/types";
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
import EpisodesTab from "@/components/media/tabs/EpisodesTab";
import { getTvCrewSections } from "@/lib/media/credits";
import { isMediaReleased } from "@/lib/media/release";
import type { InitialMediaLog } from "@/lib/media/log";
import { useMediaLog } from "@/hooks/useMediaLog";
import { useArtworkOptions } from "@/hooks/useArtworkOptions";
import { regularSeasons as getRegularSeasons, seasonHref, seasonTitle } from "@/lib/media/seasons";

type TvTab = "cast" | "crew" | "details" | "episodes" | "trailer";
type OpenModal = "poster" | "backdrop" | "log" | "list" | null;

interface TvViewProps {
  tv: TvDetails;
  initialSeason: number;
  initialLog: InitialMediaLog;
  randomPoster: string | null;
  randomBackdrop: string | null;
}

export default function TvView({ tv, initialSeason, initialLog, randomPoster, randomBackdrop }: TvViewProps) {
  const id = String(tv.id);
  const activeSeason = initialSeason;
  const currentSeasonDetails = tv.initialSeason ?? null;

  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [selectedTab, setActiveTab] = useState<TvTab>("cast");

  const regularSeasons = useMemo(() => getRegularSeasons(tv.seasons), [tv]);

  const currentSeasonSummary = useMemo(() => {
    return tv.seasons?.find((s) => s.season_number === activeSeason) || null;
  }, [tv, activeSeason]);

  const displayTitle = seasonTitle(tv.name, currentSeasonSummary, regularSeasons.length);

  const currentSeasonEpisodeCount =
    currentSeasonDetails?.episodes?.length || currentSeasonSummary?.episode_count || 0;

  const trailer = useMemo(() => {
    return (
      getBestTmdbTrailer(currentSeasonDetails?.videos) ||
      getBestTmdbTrailer(tv.videos)
    );
  }, [currentSeasonDetails?.videos, tv.videos]);

  const hasTrailer = Boolean(trailer?.key);

  const activeTab: TvTab = selectedTab === "trailer" && !hasTrailer ? "cast" : selectedTab;

  const rawDate =
    currentSeasonDetails?.air_date ||
    currentSeasonSummary?.air_date ||
    tv.first_air_date;

  const isReleased = useMemo(() => isMediaReleased("tv", tv.status, rawDate), [tv, rawDate]);

  const artwork = useArtworkOptions({
    postersUrl: `/api/tv/${id}/posters?season=${activeSeason}`,
    backdropsUrl: `/api/tv/${id}/backdrops`,
    randomPool: 5,
  });

  const log = useMediaLog({
    mediaType: "tv",
    mediaId: tv.id,
    seasonNumber: activeSeason,
    isReleased,
    episodeCount: currentSeasonEpisodeCount,
    defaultPoster:
      randomPoster ||
      currentSeasonDetails?.poster_path ||
      currentSeasonSummary?.poster_path ||
      tv.poster_path ||
      null,
    defaultBackdrop: randomBackdrop ?? tv.backdrop_path ?? null,
    initial: initialLog,
  });

  const openWithArtwork = (modal: Exclude<OpenModal, null>) => {
    if ((modal === "log" || modal === "list") && !log.requireAccount()) return;
    artwork.load();
    setOpenModal(modal);
  };

  const totalRuntimeMinutes = useMemo(() => {
    if (!currentSeasonDetails?.episodes) return 0;
    return currentSeasonDetails.episodes.reduce((acc, ep) => acc + (ep.runtime || 0), 0);
  }, [currentSeasonDetails]);

  const castList = useMemo(() => {
    return currentSeasonDetails?.credits?.cast || tv.credits?.cast || [];
  }, [currentSeasonDetails, tv]);

  const crewList = useMemo(() => {
    return currentSeasonDetails?.credits?.crew || tv.credits?.crew || [];
  }, [currentSeasonDetails, tv]);

  const crewSections = useMemo(() => {
    return getTvCrewSections(crewList, tv.created_by);
  }, [crewList, tv.created_by]);

  const posterUrl = getPosterUrl(log.poster, "w500");
  const backdropUrl = getBackdropUrl(log.backdrop, "original");

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
        backdropAlt={displayTitle}
        isBackdropLoaded={loadedBackdrop === backdropUrl}
        onBackdropLoaded={() => setLoadedBackdrop(backdropUrl)}
        hasMultipleBackdrops={log.isSignedIn && (tv.images?.backdrops?.length || 0) > 1}
        onOpenBackdropPicker={() => openWithArtwork("backdrop")}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={displayTitle}
            hasMultiplePosters={log.isSignedIn}
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
          />
        }
      >
        <MediaInfoColumn
          typeLabel="Series"
          title={displayTitle}
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
            <EpisodesTab episodes={currentSeasonDetails?.episodes} isLoading={false} />
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
          {regularSeasons.length > 1 && (
            <div className="mt-12 sm:mt-14">
              <div className="relative border-b border-zinc-800/60 mb-6 pb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  Seasons
                </span>
              </div>

              <FranchiseSlider
                parts={regularSeasons.map((season) => ({
                  id: season.season_number,
                  title: season.name || `Season ${season.season_number}`,
                  posterPath: season.poster_path || tv.poster_path,
                  href: seasonHref(tv.id, season.season_number),
                  mediaType: "tv" as const,
                }))}
                currentMovieId={activeSeason}
                mediaType="tv"
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
        title={displayTitle}
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
          title: displayTitle,
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
