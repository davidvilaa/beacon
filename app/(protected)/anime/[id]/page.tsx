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
import { getPosterUrl, getBackdropUrl, MovieImage } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/modules/MediaLayout";
import MediaActionColumn, {
  MediaStatus,
} from "@/components/modules/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/modules/columns/MediaInfoColumn";
import MediaReviewModal, {
  MediaReviewData,
} from "@/components/modules/modals/MediaReviewModal";
import ListModal from "@/components/modules/modals/ListModal";
import ArtworkPickerModal from "@/components/modules/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/modules/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import CastTab, { CastMember } from "@/components/modules/tabs/CastTab";
import DetailsTab from "@/components/modules/tabs/DetailsTab";
import RelationsTab from "@/components/modules/tabs/RelationsTab";
import EpisodesTab, { Episode } from "@/components/modules/tabs/EpisodesTab";
import { isMediaReleased } from "@/lib/media-utils";
import { Plus, Minus } from "lucide-react";

async function syncAnimeRecord(supabaseClient: any, currentAnime: AnimeMedia) {
  const { error } = await supabaseClient.from("animes").upsert({
    id: currentAnime.id,
    title: getAnimeTitle(currentAnime.title),
    overview: stripHtml(currentAnime.description) || null,
    poster_path: getAnimePosterUrl(currentAnime),
    backdrop_path: getAnimeBackdropUrl(currentAnime),
    format: currentAnime.format || null,
    episodes: currentAnime.episodes || 0,
    status: currentAnime.status || null,
  });
  if (error) throw error;
}

function AnimeDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [customPoster, setCustomPoster] = useState<string | null>(null);
  const [customBackdrop, setCustomBackdrop] = useState<string | null>(null);
  const [fallbackPoster, setFallbackPoster] = useState<string | null>(null);
  const [fallbackBackdrop, setFallbackBackdrop] = useState<string | null>(null);
  const [availablePosters, setAvailablePosters] = useState<MovieImage[]>([]);
  const [availableBackdrops, setAvailableBackdrops] = useState<MovieImage[]>([]);
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [loadingBackdrops, setLoadingBackdrops] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  const [animeStatus, setAnimeStatus] = useState<MediaStatus>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [canAddFavorite, setCanAddFavorite] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "cast" | "relations" | "details" | "episodes" | "trailer"
  >("cast");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

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

  useEffect(() => {
    let ignore = false;
    async function fetchUserLog() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || !id) return;

        const { data } = await supabase
          .from("user_animes")
          .select("*")
          .eq("anime_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (ignore) return;

        if (data) {
          setAnimeStatus(data.status);
          setIsFavorite(Boolean(data.is_favorite));
          setRating(data.rating ? Number(data.rating) : 0);
          setReview(data.review || "");
          setHasSpoilers(Boolean(data.has_spoilers));
          setStartDate(data.start_date || "");
          setEndDate(data.end_date || "");
          setLastWatchedEpisode(data.last_watched_episode || 0);
          if (data.custom_poster_path) setCustomPoster(data.custom_poster_path);
          if (data.custom_backdrop_path) setCustomBackdrop(data.custom_backdrop_path);
        } else {
          setAnimeStatus(null);
          setIsFavorite(false);
          setRating(0);
          setReview("");
          setHasSpoilers(false);
          setStartDate("");
          setEndDate("");
          setLastWatchedEpisode(0);
        }

        const { count: favCount } = await supabase
          .from("user_animes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("is_favorite", true);

        const currentIsFav = Boolean(data?.is_favorite);
        setCanAddFavorite(currentIsFav || (favCount || 0) < 5);
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      }
    }

    fetchUserLog();
    return () => {
      ignore = true;
    };
  }, [id, supabase]);

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
    setFallbackPoster(null);
    setFallbackBackdrop(null);
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function fetchPosters() {
      if (!id) return;
      try {
        setLoadingPosters(true);
        const res = await fetch(`/api/anime/${id}/posters`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.posters?.length) {
            setAvailablePosters(data.posters);
            const candidates = data.posters.slice(0, 10);
            const picked =
              candidates[Math.floor(Math.random() * candidates.length)]?.file_path;
            if (picked) {
              setFallbackPoster(picked);
            }
          }
        }
      } catch {
      } finally {
        if (!ignore) setLoadingPosters(false);
      }
    }

    async function fetchBackdrops() {
      if (!id) return;
      try {
        setLoadingBackdrops(true);
        const res = await fetch(`/api/anime/${id}/backdrops`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.backdrops?.length) {
            setAvailableBackdrops(data.backdrops);
            const candidates = data.backdrops.slice(0, 10);
            const picked =
              candidates[Math.floor(Math.random() * candidates.length)]?.file_path;
            if (picked) {
              setFallbackBackdrop(picked);
            }
          }
        }
      } catch {
      } finally {
        if (!ignore) setLoadingBackdrops(false);
      }
    }

    fetchPosters();
    fetchBackdrops();

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

  const handleSelectPoster = (filePath: string) => {
    setCustomPoster(filePath);
    setIsPosterPickerOpen(false);
  };

  const handleSelectBackdrop = (filePath: string) => {
    setCustomBackdrop(filePath);
    setIsBackdropPickerOpen(false);
  };

  const handleQuickAction = async (
    newStatus: MediaStatus,
    newFavorite: boolean
  ) => {
    if (!anime) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to track anime", "error");
        return;
      }

      if (newFavorite && !canAddFavorite && !isFavorite) {
        addToast("You can only have up to 5 favorite anime", "error");
        return;
      }

      if (!isReleased && newStatus && newStatus !== "watchlist") {
        addToast("This anime has not aired yet", "error");
        return;
      }

      const prevStatus = animeStatus;
      const prevFav = isFavorite;

      setAnimeStatus(newStatus);
      setIsFavorite(newFavorite);

      await syncAnimeRecord(supabase, anime);

      if (!newStatus) {
        const { error: deleteError } = await supabase
          .from("user_animes")
          .delete()
          .eq("anime_id", anime.id)
          .eq("user_id", session.user.id);

        if (deleteError) throw deleteError;
        setRating(0);
        setReview("");
        setHasSpoilers(false);
        setStartDate("");
        setEndDate("");
        setLastWatchedEpisode(0);
        addToast("Removed from your library", "success");
        return;
      }

      const { error: userError } = await supabase.from("user_animes").upsert(
        {
          user_id: session.user.id,
          anime_id: anime.id,
          status: newStatus,
          is_favorite: newFavorite,
          rating: rating || null,
          review: review || null,
          has_spoilers: hasSpoilers,
          start_date: startDate || null,
          end_date: endDate || null,
          last_watched_episode: lastWatchedEpisode,
          custom_poster_path: customPoster,
          custom_backdrop_path: customBackdrop,
        },
        { onConflict: "user_id,anime_id" }
      );

      if (userError) {
        setAnimeStatus(prevStatus);
        setIsFavorite(prevFav);
        throw userError;
      }

      addToast("Updated library", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || "Error updating anime", "error");
    }
  };

  const handleEpisodeChange = async (delta: number) => {
    if (!anime) return;
    const maxEpisodes = anime.episodes || 9999;
    const nextEpisode = Math.max(0, Math.min(maxEpisodes, lastWatchedEpisode + delta));
    if (nextEpisode === lastWatchedEpisode) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to update progress", "error");
        return;
      }

      setLastWatchedEpisode(nextEpisode);

      const nextStatus =
        anime.episodes && nextEpisode >= anime.episodes
          ? "watched"
          : animeStatus || "watching";

      if (nextStatus !== animeStatus) {
        setAnimeStatus(nextStatus);
      }

      await syncAnimeRecord(supabase, anime);

      const { error } = await supabase.from("user_animes").upsert(
        {
          user_id: session.user.id,
          anime_id: anime.id,
          status: nextStatus,
          is_favorite: isFavorite,
          rating: rating || null,
          review: review || null,
          has_spoilers: hasSpoilers,
          start_date: startDate || null,
          end_date: endDate || null,
          last_watched_episode: nextEpisode,
          custom_poster_path: customPoster,
          custom_backdrop_path: customBackdrop,
        },
        { onConflict: "user_id,anime_id" }
      );

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      addToast("Failed to update episode count", "error");
    }
  };

  const handleSaveModal = async (data: MediaReviewData) => {
    if (!anime) return;
    try {
      setIsSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to save review", "error");
        return;
      }

      if (data.isFavorite && !canAddFavorite && !isFavorite) {
        addToast("You can only have up to 5 favorite anime", "error");
        return;
      }

      await syncAnimeRecord(supabase, anime);

      const chosenPoster =
        data.customPosterPath !== undefined ? data.customPosterPath : customPoster;
      const chosenBackdrop =
        data.customBackdropPath !== undefined ? data.customBackdropPath : customBackdrop;

      const { error: userError } = await supabase.from("user_animes").upsert(
        {
          user_id: session.user.id,
          anime_id: anime.id,
          status: data.status,
          is_favorite: data.isFavorite,
          rating: data.rating > 0 ? data.rating : null,
          review: data.review ? data.review.trim() : null,
          has_spoilers: data.hasSpoilers,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          last_watched_episode:
            data.status === "watched" && anime.episodes
              ? anime.episodes
              : lastWatchedEpisode,
          custom_poster_path: chosenPoster,
          custom_backdrop_path: chosenBackdrop,
        },
        { onConflict: "user_id,anime_id" }
      );

      if (userError) throw userError;

      if (chosenPoster !== undefined) setCustomPoster(chosenPoster);
      if (chosenBackdrop !== undefined) setCustomBackdrop(chosenBackdrop);

      setAnimeStatus(data.status);
      setIsFavorite(data.isFavorite);
      setRating(data.rating);
      setReview(data.review);
      setHasSpoilers(data.hasSpoilers);
      setStartDate(data.startDate || "");
      setEndDate(data.endDate || "");
      if (data.status === "watched" && anime.episodes) {
        setLastWatchedEpisode(anime.episodes);
      }

      setIsLogModalOpen(false);
      addToast("Saved successfully", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || "Failed to save review", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModal = async () => {
    if (!anime) return;
    try {
      setIsSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("user_animes")
        .delete()
        .eq("anime_id", anime.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      setAnimeStatus(null);
      setIsFavorite(false);
      setRating(0);
      setReview("");
      setHasSpoilers(false);
      setStartDate("");
      setEndDate("");
      setLastWatchedEpisode(0);
      setCustomPoster(null);
      setCustomBackdrop(null);

      setIsLogModalOpen(false);
      addToast("Removed from library", "success");
    } catch (err: any) {
      console.error(err);
      addToast("Failed to remove anime", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!anime) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 text-center font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-2xl font-bold text-zinc-300">Anime not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs font-bold uppercase tracking-wider text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const title = getAnimeTitle(anime.title);
  const defaultPoster = getAnimePosterUrl(anime);
  const defaultBackdrop = getAnimeBackdropUrl(anime);

  const activePosterPath = customPoster || fallbackPoster || defaultPoster || null;
  const posterUrl = activePosterPath
    ? activePosterPath.startsWith("http")
      ? activePosterPath
      : getPosterUrl(activePosterPath, "w500")
    : null;

  const activeBackdropPath = customBackdrop || fallbackBackdrop || defaultBackdrop || null;
  const backdropUrl = activeBackdropPath
    ? activeBackdropPath.startsWith("http")
      ? activeBackdropPath
      : getBackdropUrl(activeBackdropPath, "original")
    : null;

  const hasTrailer = Boolean(
    anime.trailer?.id && anime.trailer?.site?.toLowerCase() === "youtube"
  );
  const relations = (anime.relations?.edges || []).filter(
    (r) => r.node?.format !== "MANGA" && r.node?.format !== "NOVEL"
  );

  const hasEpisodes = episodes.length > 0;

  const tabs = [
    { key: "cast", label: "Cast" },
    { key: "relations", label: `Relations (${relations.length})` },
    { key: "details", label: "Details" },
    ...(hasEpisodes ? [{ key: "episodes", label: "Episodes" }] : []),
    ...(hasTrailer ? [{ key: "trailer", label: "Trailer" }] : []),
  ];

  const hasMultiplePosters = availablePosters.length > 1;
  const hasMultipleBackdrops = availableBackdrops.length > 1;

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={title}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        hasMultipleBackdrops={hasMultipleBackdrops}
        onOpenBackdropPicker={() => setIsBackdropPickerOpen(true)}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={title}
            hasMultiplePosters={hasMultiplePosters}
            onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
            mediaType="anime"
            status={animeStatus}
            isFavorite={isFavorite}
            hasLog={Boolean(animeStatus)}
            isReleased={isReleased}
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onOpenListModal={() => setIsListModalOpen(true)}
            onQuickStatusChange={(newStatus) => {
              handleQuickAction(newStatus, isFavorite);
            }}
            onToggleFavorite={() => {
              const nextFav = !isFavorite;
              if (nextFav && !canAddFavorite) {
                addToast("You can only have up to 5 favorite anime", "error");
                return;
              }
              const nextStatus =
                animeStatus || (isReleased ? "watched" : "watchlist");
              handleQuickAction(nextStatus, nextFav);
            }}
            footerContent={
              animeStatus && animeStatus !== "watchlist" ? (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    <span>Progress</span>
                    <span className="font-mono text-zinc-300">
                      {lastWatchedEpisode} / {anime.episodes || "?"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEpisodeChange(-1)}
                      disabled={lastWatchedEpisode <= 0}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-800 hover:bg-zinc-700/80 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-bold rounded-sm transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>-1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEpisodeChange(1)}
                      disabled={
                        Boolean(anime.episodes) &&
                        lastWatchedEpisode >= (anime.episodes || 0)
                      }
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-800 hover:bg-zinc-700/80 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-bold rounded-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1</span>
                    </button>
                  </div>
                </div>
              ) : null
            }
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
            onChange={(key) => setActiveTab(key as any)}
          />

          {activeTab === "cast" && <CastTab cast={castList} />}
          {activeTab === "relations" && <RelationsTab relations={relations} />}
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
        </MediaInfoColumn>
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={isPosterPickerOpen}
        onClose={() => setIsPosterPickerOpen(false)}
        title="CHANGE ARTWORK"
        type="poster"
        images={availablePosters}
        selectedImage={activePosterPath}
        onSelectImage={handleSelectPoster}
        isLoading={loadingPosters}
      />

      <BackdropPickerModal
        isOpen={isBackdropPickerOpen}
        onClose={() => setIsBackdropPickerOpen(false)}
        title="CHANGE BANNER"
        images={availableBackdrops}
        selectedImage={activeBackdropPath}
        onSelectImage={handleSelectBackdrop}
        isLoading={loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={title}
        typeLabel="Anime"
        year={anime.startDate?.year}
        releaseDate={releaseDateStr}
        runtimeMinutes={totalRuntimeMinutes}
        episodesCount={anime.episodes}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="anime"
        status={animeStatus}
        isFavorite={isFavorite}
        canAddFavorite={canAddFavorite}
        rating={rating}
        review={review}
        hasSpoilers={hasSpoilers}
        startDate={startDate}
        endDate={endDate}
        availablePosters={availablePosters}
        availableBackdrops={availableBackdrops}
        selectedPoster={activePosterPath}
        selectedBackdrop={activeBackdropPath}
        loadingPosters={loadingPosters}
        loadingBackdrops={loadingBackdrops}
        isSaving={isSaving}
        isReleased={isReleased}
        onSave={handleSaveModal}
        onDelete={handleDeleteModal}
      />

      <ListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        media={{
          mediaType: "anime",
          mediaId: anime.id,
          title,
          overview: stripHtml(anime.description) || null,
          posterPath: activePosterPath,
          backdropPath: activeBackdropPath,
          customPosterPath: activePosterPath,
          customBackdropPath: activeBackdropPath,
          numberOfEpisodes: anime.episodes || 0,
        }}
        availablePosters={availablePosters}
        availableBackdrops={availableBackdrops}
        selectedPoster={activePosterPath}
        selectedBackdrop={activeBackdropPath}
        loadingPosters={loadingPosters}
        loadingBackdrops={loadingBackdrops}
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
