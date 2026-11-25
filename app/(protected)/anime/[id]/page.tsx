"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AnimeMedia,
  getAnimeTitle,
  getAnimePosterUrl,
  getAnimeBackdropUrl,
  stripHtml,
} from "@/lib/anilist";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import MediaLayout from "@/components/modules/MediaLayout";
import MediaActionColumn from "@/components/modules/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/modules/columns/MediaInfoColumn";
import MediaReviewModal from "@/components/modules/modals/MediaReviewModal";
import ListModal from "@/components/modules/modals/ListModal";
import ArtworkPickerModal from "@/components/modules/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/modules/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import CastTab, { CastMember } from "@/components/modules/tabs/CastTab";
import DetailsTab from "@/components/modules/tabs/DetailsTab";
import EpisodesTab, { Episode } from "@/components/modules/tabs/EpisodesTab";
import FranchiseSlider, { FranchiseItem } from "@/components/ui/FranchiseSlider";
import { isMediaReleased } from "@/lib/media-utils";
import { animeCacheInput } from "@/lib/media/cache";
import { useMediaLog } from "@/hooks/useMediaLog";
import { useArtworkOptions } from "@/hooks/useArtworkOptions";

type AnimeTab = "cast" | "details" | "episodes" | "trailer";
type OpenModal = "poster" | "backdrop" | "log" | "list" | null;

function AnimeDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [activeTab, setActiveTab] = useState<AnimeTab>("cast");
  const [selectedFranchiseCategory, setSelectedFranchiseCategory] = useState<string>("main");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [loadedId, setLoadedId] = useState(id);

  if (loadedId !== id) {
    setLoadedId(id);
    setSelectedFranchiseCategory("main");
  }

  const releaseDateStr = useMemo(() => {
    if (!anime?.startDate?.year) return null;
    const y = anime.startDate.year;
    const m = String(anime.startDate.month || 1).padStart(2, "0");
    const d = String(anime.startDate.day || 1).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [anime]);

  const isReleased = useMemo(() => {
    if (!anime) return true;
    return isMediaReleased("anime", anime.status, releaseDateStr);
  }, [anime, releaseDateStr]);

  const totalRuntimeMinutes = useMemo(() => {
    if (!anime?.duration) return null;
    if (anime.episodes && anime.episodes > 1) {
      return anime.duration * anime.episodes;
    }
    return anime.duration;
  }, [anime]);

  const castList: CastMember[] = useMemo(() => {
    return (anime?.characters?.edges || []).map((edge) => {
      const char = edge.node;
      const va = edge.voiceActors?.[0];
      return {
        id: va?.id || char.id,
        name: va?.name.full || "Unknown Voice",
        character: char.name.full,
        profile_path: va?.image?.medium || va?.image?.large || null,
        character_image: char.image?.large || char.image?.medium || null,
        href: va?.id ? `/person/al-${va.id}` : undefined,
      };
    });
  }, [anime?.characters?.edges]);

  const studioList = useMemo(() => {
    return (anime?.studios?.nodes || []).map((s) => ({
      id: s.id,
      name: s.name,
      href: `/company/al-${s.id}`,
    }));
  }, [anime?.studios?.nodes]);

  const franchiseItems: (FranchiseItem & { category: string; sortKey: number })[] = useMemo(() => {
    if (!anime) return [];

    const validRelations = (anime.relations?.edges || []).filter(
      (r) =>
        r.node?.format !== "MANGA" &&
        r.node?.format !== "NOVEL" &&
        r.node?.format !== "ONE_SHOT"
    );

    const getSortKey = (
      startDate?: { year?: number | null; month?: number | null; day?: number | null } | null
    ) => {
      if (!startDate?.year) return 99999999;
      const y = startDate.year;
      const m = startDate.month || 1;
      const d = startDate.day || 1;
      return y * 10000 + m * 100 + d;
    };

    const getCategory = (
      type: string
    ): "main" | "spin_off" | "side_story" | "alternative" | "other" => {
      switch (type) {
        case "CURRENT":
        case "PREQUEL":
        case "SEQUEL":
        case "PARENT":
          return "main";
        case "SIDE_STORY":
          return "side_story";
        case "SPIN_OFF":
        case "CHARACTER":
          return "spin_off";
        case "ALTERNATIVE":
          return "alternative";
        default:
          return "other";
      }
    };

    const itemsMap = new Map<number, FranchiseItem & { category: string; sortKey: number }>();

    itemsMap.set(anime.id, {
      id: anime.id,
      title: getAnimeTitle(anime.title),
      posterPath: getAnimePosterUrl(anime),
      mediaType: "anime",
      category: "main",
      sortKey: getSortKey(anime.startDate),
    });

    for (const r of validRelations) {
      if (!itemsMap.has(r.node.id)) {
        const title = r.node.title.english || r.node.title.romaji || "Untitled";
        const poster =
          r.node.coverImage?.extraLarge ||
          r.node.coverImage?.large ||
          r.node.coverImage?.medium ||
          null;

        itemsMap.set(r.node.id, {
          id: r.node.id,
          title,
          posterPath: poster,
          mediaType: "anime",
          category: getCategory(r.relationType),
          sortKey: getSortKey(r.node.startDate),
        });
      }
    }

    return Array.from(itemsMap.values()).sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.id - b.id;
    });
  }, [anime]);

  const franchiseCategories = useMemo(() => {
    if (franchiseItems.length <= 1) return [];

    const defs = [
      { id: "main", label: "Main" },
      { id: "side_story", label: "Side Story" },
      { id: "spin_off", label: "Spin-Off" },
      { id: "alternative", label: "Alternative" },
      { id: "other", label: "Other" },
    ];

    return defs
      .map((def) => {
        const count = franchiseItems.filter((item) => item.category === def.id).length;
        return { ...def, count };
      })
      .filter((cat) => cat.count > 0);
  }, [franchiseItems]);

  const displayedFranchiseItems = useMemo(() => {
    const filtered = franchiseItems.filter(
      (item) => item.category === selectedFranchiseCategory
    );
    if (filtered.length > 0) return filtered;
    return franchiseItems.filter((item) => item.category === "main");
  }, [franchiseItems, selectedFranchiseCategory]);

  const artwork = useArtworkOptions({
    postersUrl: id ? `/api/anime/${id}/posters` : null,
    backdropsUrl: id ? `/api/anime/${id}/backdrops` : null,
    eagerPosters: true,
    eagerBackdrops: true,
  });

  const cacheInput = useMemo(() => (anime ? animeCacheInput(anime) : null), [anime]);

  const log = useMediaLog({
    mediaType: "anime",
    mediaId: Number(id) || null,
    cacheInput,
    isReleased,
    episodeCount: anime?.episodes || 0,
    defaultPoster: artwork.randomPoster || (anime ? getAnimePosterUrl(anime) : null),
    defaultBackdrop: artwork.randomBackdrop || (anime ? getAnimeBackdropUrl(anime) : null),
  });

  const openWithArtwork = (modal: Exclude<OpenModal, null>) => {
    artwork.load();
    setOpenModal(modal);
  };

  useEffect(() => {
    let ignore = false;
    async function fetchAnime() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/anime/${id}`);
        if (!res.ok) throw new Error("Failed to fetch anime");
        const data: AnimeMedia = await res.json();
        if (!ignore) {
          setAnime(data);
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

    fetchAnime();
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function fetchEpisodes() {
      if (!id || !anime || anime.format === "MOVIE" || anime.episodes === 1) {
        setEpisodes([]);
        return;
      }
      try {
        setLoadingEpisodes(true);
        const res = await fetch(`/api/anime/${id}/episodes`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.episodes?.length) {
            setEpisodes(data.episodes);
          } else if (!ignore) {
            setEpisodes([]);
          }
        }
      } catch {
        if (!ignore) setEpisodes([]);
      } finally {
        if (!ignore) setLoadingEpisodes(false);
      }
    }

    fetchEpisodes();

    return () => {
      ignore = true;
    };
  }, [id, anime]);

  if (loading) {
    return <Loading />;
  }

  if (!anime) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 text-center font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-2xl font-bold text-zinc-300">Anime not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs font-bold uppercase tracking-wider text-accent hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const title = getAnimeTitle(anime.title);
  const posterUrl = getPosterUrl(log.poster, "w500");
  const backdropUrl = getBackdropUrl(log.backdrop, "original");

  const hasTrailer = Boolean(
    anime.trailer?.id && anime.trailer?.site?.toLowerCase() === "youtube"
  );

  const hasEpisodes = episodes.length > 0;

  const tabs = [
    { key: "cast", label: "Cast" },
    { key: "details", label: "Details" },
    ...(hasEpisodes ? [{ key: "episodes", label: "Episodes" }] : []),
    ...(hasTrailer ? [{ key: "trailer", label: "Trailer" }] : []),
  ];

  const hasMultiplePosters = artwork.posters.length > 1;
  const hasMultipleBackdrops = artwork.backdrops.length > 1;

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={title}
        isBackdropLoaded={loadedBackdrop === backdropUrl}
        onBackdropLoaded={() => setLoadedBackdrop(backdropUrl)}
        hasMultipleBackdrops={hasMultipleBackdrops}
        onOpenBackdropPicker={() => openWithArtwork("backdrop")}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={title}
            hasMultiplePosters={hasMultiplePosters}
            onOpenPosterPicker={() => openWithArtwork("poster")}
            mediaType="anime"
            status={log.status}
            isFavorite={log.isFavorite}
            hasLog={log.hasLog}
            isReleased={isReleased}
            onOpenLogModal={() => openWithArtwork("log")}
            onOpenListModal={() => openWithArtwork("list")}
            currentEpisode={log.lastWatchedEpisode}
            totalEpisodes={anime.episodes}
            onEpisodeChange={log.changeEpisode}
            onQuickStatusChange={log.setStatus}
            onToggleFavorite={log.toggleFavorite}
          />
        }
      >
        <MediaInfoColumn
          typeLabel="Anime"
          title={title}
          originalTitle={anime.title.native || anime.title.romaji}
          releaseDate={releaseDateStr}
          runtimeMinutes={totalRuntimeMinutes}
          episodesCount={anime.episodes}
          tagline={anime.tagline || null}
          overview={stripHtml(anime.description)}
        >
          <MediaTabsNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as AnimeTab)}
          />

          {activeTab === "cast" && <CastTab cast={castList} />}
          {activeTab === "details" && (
            <DetailsTab
              productionCompanies={studioList}
              originalTitle={anime.title.romaji || anime.title.native}
              status={anime.status?.toLowerCase()}
              format={anime.format || "TV"}
              season={
                anime.season && anime.seasonYear
                  ? `${anime.season.toLowerCase()} ${anime.seasonYear}`
                  : null
              }
              episodesCount={anime.episodes}
              genres={anime.genres}
            />
          )}

          {activeTab === "episodes" && hasEpisodes && (
            <EpisodesTab
              episodes={episodes}
              isLoading={loadingEpisodes}
            />
          )}

          {activeTab === "trailer" && hasTrailer && (
            <div className="aspect-video w-full max-w-4xl rounded-sm overflow-hidden border border-zinc-800 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${anime.trailer!.id}`}
                title="Anime Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {franchiseItems.length > 1 && (
            <div className="mt-12 sm:mt-14">
              <div className="relative border-b border-zinc-800/60">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-100 block pb-3">
                  Franchise
                </span>
              </div>

              {franchiseCategories.length > 1 && (
                <div className="border-b border-zinc-700/80 rounded-b-sm py-3 px-2 flex items-center gap-6 overflow-x-auto scrollbar-none mb-6">
                  {franchiseCategories.map((cat) => {
                    const isActive = selectedFranchiseCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedFranchiseCategory(cat.id)}
                        className={`text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                          isActive
                            ? "text-accent"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <FranchiseSlider
                parts={displayedFranchiseItems}
                currentMovieId={anime.id}
                mediaType="anime"
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
        images={artwork.backdrops}
        selectedImage={log.backdrop}
        onSelectImage={log.setBackdrop}
        isLoading={artwork.loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={openModal === "log"}
        onClose={() => setOpenModal(null)}
        title={title}
        typeLabel="Anime"
        year={anime.startDate?.year}
        releaseDate={releaseDateStr}
        runtimeMinutes={totalRuntimeMinutes}
        episodesCount={anime.episodes}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="anime"
        status={log.status}
        hasLog={log.hasLog}
        isFavorite={log.isFavorite}
        canAddFavorite={log.canAddFavorite}
        rating={log.rating}
        review={log.review}
        hasSpoilers={log.hasSpoilers}
        startDate={log.startDate}
        endDate={log.endDate}
        availablePosters={artwork.posters}
        availableBackdrops={artwork.backdrops}
        selectedPoster={log.poster}
        selectedBackdrop={log.backdrop}
        loadingPosters={artwork.loadingPosters}
        loadingBackdrops={artwork.loadingBackdrops}
        isSaving={log.isSaving}
        isReleased={isReleased}
        onSave={async (data) => {
          if (await log.saveReview(data)) setOpenModal(null);
        }}
        onDelete={async () => {
          if (await log.deleteLog()) setOpenModal(null);
        }}
      />

      <ListModal
        isOpen={openModal === "list"}
        onClose={() => setOpenModal(null)}
        media={{
          mediaType: "anime",
          mediaId: anime.id,
          title,
          overview: stripHtml(anime.description) || null,
          posterPath: getAnimePosterUrl(anime),
          backdropPath: getAnimeBackdropUrl(anime),
          customPosterPath: log.poster,
          customBackdropPath: log.backdrop,
          numberOfEpisodes: anime.episodes || 0,
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

export default function AnimeDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AnimeDetailContent />
    </Suspense>
  );
}
