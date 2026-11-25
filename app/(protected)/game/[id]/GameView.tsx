"use client";

import { useState, useMemo } from "react";
import { getIgdbImageUrl } from "@/lib/providers/igdb/client";
import type { IGDBGameDetail, IGDBRelatedGame } from "@/lib/providers/igdb/types";
import MediaLayout from "@/components/media/MediaLayout";
import MediaActionColumn from "@/components/media/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/media/columns/MediaInfoColumn";
import MediaReviewModal from "@/components/media/modals/MediaReviewModal";
import ListModal from "@/components/lists/ListModal";
import ArtworkPickerModal from "@/components/media/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/media/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/media/tabs/MediaTabsNav";
import DetailsTab from "@/components/media/tabs/DetailsTab";
import FranchiseSlider, { FranchiseItem } from "@/components/media/FranchiseSlider";
import { isMediaReleased } from "@/lib/media/release";
import { gameCacheInput } from "@/lib/media/cache";
import { useMediaLog } from "@/hooks/useMediaLog";
import { useArtworkOptions } from "@/hooks/useArtworkOptions";
import type { InitialMediaLog } from "@/lib/media/log";

type OpenModal = "poster" | "backdrop" | "log" | "list" | null;

interface GameViewProps {
  game: IGDBGameDetail;
  initialLog: InitialMediaLog;
  randomPoster: string | null;
  randomBackdrop: string | null;
  posterCount: number;
  backdropCount: number;
}

export default function GameView({
  game,
  initialLog,
  randomPoster,
  randomBackdrop,
  posterCount,
  backdropCount,
}: GameViewProps) {
  const id = String(game.id);
  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [activeTab, setActiveTab] = useState<string>("details");

  const releaseDateStr = useMemo(() => {
    if (!game.first_release_date) return null;
    return new Date(game.first_release_date * 1000).toISOString().split("T")[0];
  }, [game]);

  const releaseYear = useMemo(() => {
    if (!game.first_release_date) return null;
    return new Date(game.first_release_date * 1000).getFullYear();
  }, [game]);

  const isReleased = useMemo(() => {
    if (!game) return true;
    return isMediaReleased("game", null, releaseDateStr);
  }, [game, releaseDateStr]);

  const developersList = useMemo(() => {
    return (game.involved_companies || [])
      .filter((c) => c.developer)
      .map((c) => c.company.name);
  }, [game.involved_companies]);

  const publishersList = useMemo(() => {
    return (game.involved_companies || [])
      .filter((c) => c.publisher)
      .map((c) => c.company.name);
  }, [game.involved_companies]);

  const platformsList = useMemo(() => {
    return (game.platforms || []).map((p) => p.name);
  }, [game.platforms]);

  const trailerVideo = useMemo(() => {
    if (!game.videos || game.videos.length === 0) return null;
    const trailer = game.videos.find((v) =>
      v.name?.toLowerCase().includes("trailer")
    );
    return trailer || game.videos[0];
  }, [game.videos]);

  const dlcItems = useMemo<FranchiseItem[]>(() => {
    if (!game) return [];
    const allDlcs = [
      ...(game.dlcs || []),
      ...(game.expansions || []),
      ...(game.remakes || []),
      ...(game.remasters || []),
    ];
    const seen = new Set<number>();
    const items: FranchiseItem[] = [];
    for (const d of allDlcs) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        const year = d.first_release_date
          ? new Date(d.first_release_date * 1000).getFullYear()
          : null;
        items.push({
          id: d.id,
          title: d.name,
          posterPath: getIgdbImageUrl(d.cover?.image_id, "1080p"),
          mediaType: "game",
          year,
        });
      }
    }
    return items;
  }, [game]);

  const franchiseItems = useMemo<FranchiseItem[]>(() => {
    if (!game) return [];
    const gamesInFranchise: IGDBRelatedGame[] = [];
    for (const f of game.franchises || []) {
      if (f.games) gamesInFranchise.push(...f.games);
    }
    for (const c of game.collections || []) {
      if (c.games) gamesInFranchise.push(...c.games);
    }
    const seen = new Set<number>();
    const items: FranchiseItem[] = [];
    for (const g of gamesInFranchise) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        const year = g.first_release_date
          ? new Date(g.first_release_date * 1000).getFullYear()
          : null;
        items.push({
          id: g.id,
          title: g.name,
          posterPath: getIgdbImageUrl(g.cover?.image_id, "1080p"),
          mediaType: "game",
          year,
        });
      }
    }
    return items.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  }, [game]);

  const tabs = useMemo(() => {
    const list: { key: string; label: string }[] = [
      { key: "details", label: "Details" },
    ];
    if (trailerVideo) {
      list.push({ key: "trailer", label: "Trailer" });
    }
    if (dlcItems.length > 0) {
      list.push({ key: "dlcs", label: "DLCs & Expansions" });
    }
    if (franchiseItems.length > 1) {
      list.push({ key: "franchise", label: "Franchise" });
    }
    return list;
  }, [trailerVideo, dlcItems.length, franchiseItems.length]);

  const artwork = useArtworkOptions({
    postersUrl: `/api/game/${id}/posters`,
    backdropsUrl: `/api/game/${id}/backdrops`,
  });

  const cacheInput = useMemo(() => gameCacheInput(game), [game]);

  const defaultPoster = getIgdbImageUrl(game.cover?.image_id, "1080p");
  const defaultBackdrop = getIgdbImageUrl(
    game.artworks?.[0]?.image_id || game.screenshots?.[0]?.image_id,
    "1080p"
  );

  const log = useMediaLog({
    mediaType: "game",
    mediaId: game.id,
    cacheInput,
    isReleased,
    defaultPoster: randomPoster || defaultPoster || null,
    defaultBackdrop: randomBackdrop || defaultBackdrop || null,
    initial: initialLog,
  });

  const openWithArtwork = (modal: Exclude<OpenModal, null>) => {
    if ((modal === "log" || modal === "list") && !log.requireAccount()) return;
    artwork.load();
    setOpenModal(modal);
  };

  const posterUrl = log.poster;
  const backdropUrl = log.backdrop;

  const hasMultiplePosters = Math.max(posterCount, artwork.posters.length) > 1;
  const hasMultipleBackdrops = Math.max(backdropCount, artwork.backdrops.length) > 1;

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={game.name}
        isBackdropLoaded={loadedBackdrop === backdropUrl}
        onBackdropLoaded={() => setLoadedBackdrop(backdropUrl)}
        hasMultipleBackdrops={hasMultipleBackdrops}
        onOpenBackdropPicker={() => openWithArtwork("backdrop")}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={game.name}
            hasMultiplePosters={hasMultiplePosters}
            onOpenPosterPicker={() => openWithArtwork("poster")}
            mediaType="game"
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
          typeLabel="Game"
          title={game.name}
          originalTitle={game.name}
          releaseDate={releaseDateStr}
          tagline={null}
          overview={game.summary || game.storyline || null}
        >
          <MediaTabsNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key)}
          />

          {activeTab === "details" && (
            <DetailsTab
              developers={developersList}
              publishers={publishersList}
              platforms={platformsList}
              genres={game.genres?.map((g) => g.name) || []}
              gameModes={game.game_modes?.map((m) => m.name) || []}
              themes={game.themes?.map((t) => t.name) || []}
              storyline={
                game.storyline && game.storyline !== game.summary
                  ? game.storyline
                  : null
              }
            />
          )}

          {activeTab === "trailer" && trailerVideo && (
            <div className="aspect-video w-full max-w-4xl rounded-sm overflow-hidden border border-zinc-800 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerVideo.video_id}`}
                title="Game Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {activeTab === "dlcs" && dlcItems.length > 0 && (
            <div className="mt-4">
              <FranchiseSlider
                parts={dlcItems}
                currentMovieId={game.id}
                mediaType="game"
              />
            </div>
          )}

          {activeTab === "franchise" && franchiseItems.length > 0 && (
            <div className="mt-4">
              <FranchiseSlider
                parts={franchiseItems}
                currentMovieId={game.id}
                mediaType="game"
              />
            </div>
          )}
        </MediaInfoColumn>
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={openModal === "poster"}
        onClose={() => setOpenModal(null)}
        title="CHANGE COVER"
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
        images={artwork.backdrops}
        selectedImage={log.backdrop}
        onSelectImage={log.setBackdrop}
        isLoading={artwork.loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={openModal === "log"}
        onClose={() => setOpenModal(null)}
        title={game.name}
        typeLabel="Game"
        year={releaseYear}
        releaseDate={releaseDateStr}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="game"
        status={log.status}
        hasLog={log.hasLog}
        isFavorite={log.isFavorite}
        canAddFavorite={log.canAddFavorite}
        rating={log.rating}
        review={log.review}
        hasSpoilers={log.hasSpoilers}
        startDate={log.startDate}
        endDate={log.endDate}
        hoursPlayed={log.hoursPlayed}
        isSaving={log.isSaving}
        onSave={async (data) => {
          if (await log.saveReview(data)) setOpenModal(null);
        }}
        onDelete={async () => {
          if (await log.deleteLog()) setOpenModal(null);
        }}
        availablePosters={artwork.posters}
        availableBackdrops={artwork.backdrops}
        selectedPoster={log.poster}
        selectedBackdrop={log.backdrop}
        loadingPosters={artwork.loadingPosters}
        loadingBackdrops={artwork.loadingBackdrops}
        isReleased={isReleased}
      />

      <ListModal
        isOpen={openModal === "list"}
        onClose={() => setOpenModal(null)}
        media={{
          mediaType: "game",
          mediaId: game.id,
          title: game.name,
          overview: game.summary || null,
          posterPath: defaultPoster,
          backdropPath: defaultBackdrop,
          customPosterPath: log.poster,
          customBackdropPath: log.backdrop,
        }}
        availablePosters={artwork.posters}
        availableBackdrops={artwork.backdrops}
        selectedPoster={log.poster}
        selectedBackdrop={log.backdrop}
        loadingPosters={artwork.loadingPosters}
        loadingBackdrops={artwork.loadingBackdrops}
      />
    </>
  );
}
