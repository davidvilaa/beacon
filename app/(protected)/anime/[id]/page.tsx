"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AnimeMedia,
  getAnimeTitle,
  getAnimePosterUrl,
  getAnimeBackdropUrl,
  stripHtml,
} from "@/lib/anilist";
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
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import MediaCard from "@/components/ui/MediaCard";
import CardGradientBorder from "@/components/ui/CardGradientBorder";
import { isMediaReleased, formatFullDate } from "@/lib/media-utils";
import { User, ChevronUp, ChevronDown, Plus, Minus } from "lucide-react";

function formatRelationLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function AnimeDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [loading, setLoading] = useState(true);
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
    "characters" | "relations" | "details" | "trailer"
  >("characters");

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

      const title = getAnimeTitle(anime.title);
      const posterUrl = getAnimePosterUrl(anime);
      const backdropUrl = getAnimeBackdropUrl(anime);

      const { error: animeError } = await supabase.from("animes").upsert({
        id: anime.id,
        title,
        overview: stripHtml(anime.description) || null,
        poster_path: posterUrl,
        backdrop_path: backdropUrl,
        format: anime.format || null,
        episodes: anime.episodes || 0,
        status: anime.status || null,
      });

      if (animeError) throw animeError;

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

      const title = getAnimeTitle(anime.title);
      await supabase.from("animes").upsert({
        id: anime.id,
        title,
        overview: stripHtml(anime.description) || null,
        poster_path: getAnimePosterUrl(anime),
        backdrop_path: getAnimeBackdropUrl(anime),
        format: anime.format || null,
        episodes: anime.episodes || 0,
        status: anime.status || null,
      });

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

      const title = getAnimeTitle(anime.title);
      const posterUrl = getAnimePosterUrl(anime);
      const backdropUrl = getAnimeBackdropUrl(anime);

      const { error: animeError } = await supabase.from("animes").upsert({
        id: anime.id,
        title,
        overview: stripHtml(anime.description) || null,
        poster_path: posterUrl,
        backdrop_path: backdropUrl,
        format: anime.format || null,
        episodes: anime.episodes || 0,
        status: anime.status || null,
      });

      if (animeError) throw animeError;

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
        },
        { onConflict: "user_id,anime_id" }
      );

      if (userError) throw userError;

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
  const posterUrl = getAnimePosterUrl(anime);
  const backdropUrl = getAnimeBackdropUrl(anime);
  const hasTrailer = Boolean(
    anime.trailer?.id && anime.trailer?.site?.toLowerCase() === "youtube"
  );
  const relations = (anime.relations?.edges || []).filter(
    (r) => r.node?.format !== "MANGA" && r.node?.format !== "NOVEL"
  );
  const characters = anime.characters?.edges || [];

  const tabs = [
    { key: "characters", label: "Characters" },
    { key: "relations", label: `Relations (${relations.length})` },
    { key: "details", label: "Details" },
    ...(hasTrailer ? [{ key: "trailer", label: "Trailer" }] : []),
  ];

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={title}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        hasMultipleBackdrops={false}
        posterColumn={
          <div className="w-full flex flex-col items-center">
            <MediaActionColumn
              posterUrl={posterUrl}
              title={title}
              hasMultiplePosters={false}
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
            />

            {animeStatus && animeStatus !== "watchlist" && (
              <div className="w-56 sm:w-full mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded-sm">
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
            )}
          </div>
        }
      >
        <MediaInfoColumn
          typeLabel={`Anime • ${anime.format || "TV"}`}
          title={title}
          originalTitle={anime.title.romaji || anime.title.native}
          releaseDate={releaseDateStr}
          runtimeMinutes={anime.duration}
          episodesCount={anime.episodes}
          tagline={
            anime.studios?.nodes?.[0]?.name
              ? `Animated by ${anime.studios.nodes[0].name}`
              : null
          }
          overview={stripHtml(anime.description)}
        >
          <MediaTabsNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as any)}
          />

          {activeTab === "characters" && (
            <div>
              {characters.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4">
                  No character information available.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {characters.map((edge) => {
                    const char = edge.node;
                    const va = edge.voiceActors?.[0];
                    return (
                      <div
                        key={char.id}
                        className="relative flex items-stretch rounded-sm bg-zinc-800 border border-zinc-700/80 min-w-0 overflow-hidden h-14"
                      >
                        <CardGradientBorder roundedClassName="rounded-sm" />
                        <div className="relative h-full aspect-square w-14 shrink-0 bg-zinc-900 border-r border-zinc-700/60 overflow-hidden flex items-center justify-center">
                          {char.image?.large || char.image?.medium ? (
                            <Image
                              src={char.image.large || char.image.medium!}
                              alt={char.name.full}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-zinc-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 px-3 py-1.5 flex flex-col justify-center">
                          <p className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                            {char.name.full}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {edge.role === "MAIN" ? (
                              <span className="text-[#a8dadc] font-semibold">
                                Main
                              </span>
                            ) : (
                              <span className="text-zinc-500">Supporting</span>
                            )}
                            {va ? ` • VA: ${va.name.full}` : ""}
                          </p>
                        </div>

                        {va?.image?.medium && (
                          <div className="relative h-full aspect-square w-14 shrink-0 bg-zinc-900 border-l border-zinc-700/60 overflow-hidden">
                            <Image
                              src={va.image.medium}
                              alt={va.name.full}
                              fill
                              sizes="56px"
                              className="object-cover"
                              title={`Voice Actor: ${va.name.full}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "relations" && (
            <div>
              {relations.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4">
                  No anime relations found.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {relations.map((r) => {
                    const relNode = r.node;
                    const relTitle =
                      relNode.title.english || relNode.title.romaji || "Untitled";
                    const relCover =
                      relNode.coverImage?.extraLarge ||
                      relNode.coverImage?.large ||
                      relNode.coverImage?.medium ||
                      null;
                    const relType = formatRelationLabel(r.relationType);

                    return (
                      <MediaCard
                        key={`${relNode.id}-${r.relationType}`}
                        id={relNode.id}
                        mediaType="anime"
                        href={`/anime/${relNode.id}`}
                        title={relTitle}
                        posterPath={relCover}
                        subtitle={`${relType} • ${relNode.format || "Anime"}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-sm border border-zinc-800 bg-zinc-900/40">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1 capitalize">
                    {anime.status?.toLowerCase() || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Season
                  </p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1 capitalize">
                    {anime.season && anime.seasonYear
                      ? `${anime.season.toLowerCase()} ${anime.seasonYear}`
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Average Score
                  </p>
                  <p className="text-sm font-mono font-semibold text-[#a8dadc] mt-1">
                    {anime.averageScore ? `${anime.averageScore}%` : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Format
                  </p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">
                    {anime.format || "TV"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Episodes
                  </p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">
                    {anime.episodes || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Duration
                  </p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">
                    {anime.duration ? `${anime.duration} mins/ep` : "—"}
                  </p>
                </div>
              </div>

              {anime.genres && anime.genres.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-sm text-xs font-medium bg-zinc-800 border border-zinc-700/80 text-zinc-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anime.studios?.nodes && anime.studios.nodes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Studios
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.studios.nodes.map((s) => (
                      <span
                        key={s.id}
                        className="px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-200"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {isLogModalOpen && (
        <MediaReviewModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          title={title}
          typeLabel="Anime"
          year={anime.startDate?.year}
          releaseDate={releaseDateStr}
          runtimeMinutes={anime.duration}
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
          isSaving={isSaving}
          isReleased={isReleased}
          onSave={handleSaveModal}
          onDelete={handleDeleteModal}
        />
      )}

      {isListModalOpen && (
        <ListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          media={{
            mediaType: "anime",
            mediaId: anime.id,
            title,
            overview: stripHtml(anime.description) || null,
            posterPath: posterUrl,
            backdropPath: backdropUrl,
            numberOfEpisodes: anime.episodes || 0,
          }}
        />
      )}
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
