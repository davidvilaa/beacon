"use client";

import { useEffect, useState, useRef, useMemo, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Clock,
  Calendar,
  Film,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import {
  TvDetails,
  TvSeasonDetails,
  MovieImage,
  getPosterUrl,
  getBackdropUrl,
} from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import SeasonRevolver from "@/components/ui/SeasonRevolver";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/media/MediaLayout";
import MediaPosterCard from "@/components/media/MediaPosterCard";
import MediaActionBar, { MediaStatus } from "@/components/media/MediaActionBar";
import MediaReviewModal from "@/components/media/MediaReviewModal";
import ArtworkPickerModal from "@/components/media/ArtworkPickerModal";
import { formatRuntime, formatFullDate } from "@/lib/media-utils";

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

  const [customPosters, setCustomPosters] = useState<Record<number, string>>({});
  const [selectedBackdrop, setSelectedBackdrop] = useState<string | null>(null);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [availablePosters, setAvailablePosters] = useState<Record<number, MovieImage[]>>({});
  const [loadingPosters, setLoadingPosters] = useState(false);

  const [seriesStatus, setSeriesStatus] = useState<MediaStatus>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [watchedDate, setWatchedDate] = useState<string>("");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<"cast" | "crew" | "details" | "episodes">("cast");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [isCastExpanded, setIsCastExpanded] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchUserSeasonLog() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !id) return;

        const { data } = await supabase
          .from("user_series")
          .select("*")
          .eq("series_id", id)
          .eq("season_number", activeSeason)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (ignore) return;

        if (data) {
          setSeriesStatus(data.status);
          setIsFavorite(Boolean(data.is_favorite));
          setRating(data.rating ? Number(data.rating) : 0);
          setReview(data.review || "");
          setHasSpoilers(Boolean(data.has_spoilers));
          setWatchedDate(data.watched_date || "");
          if (data.custom_poster_path) {
            setCustomPosters((prev) => ({
              ...prev,
              [activeSeason]: data.custom_poster_path,
            }));
          }
          if (data.custom_backdrop_path) {
            setSelectedBackdrop(data.custom_backdrop_path);
          }
        } else {
          setSeriesStatus(null);
          setIsFavorite(false);
          setRating(0);
          setReview("");
          setHasSpoilers(false);
          setWatchedDate("");
        }
      } catch (err) {
      }
    }
    fetchUserSeasonLog();
    return () => {
      ignore = true;
    };
  }, [id, activeSeason, supabase]);

  const handleQuickAction = async (newStatus: MediaStatus, newFavorite: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !tv) return;

      await supabase.from("series").upsert({
        id: tv.id,
        name: tv.name,
        overview: tv.overview,
        poster_path: tv.poster_path,
        backdrop_path: tv.backdrop_path,
        number_of_seasons: tv.number_of_seasons,
        number_of_episodes: tv.number_of_episodes,
        status: tv.status,
      });

      await supabase.from("user_series").upsert(
        {
          user_id: session.user.id,
          series_id: tv.id,
          season_number: activeSeason,
          status: newStatus,
          is_favorite: newFavorite,
          custom_poster_path: customPosters[activeSeason] || null,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,series_id,season_number" }
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

      if (!tv) return;

      const { error: seriesError } = await supabase.from("series").upsert({
        id: tv.id,
        name: tv.name,
        overview: tv.overview,
        poster_path: tv.poster_path,
        backdrop_path: tv.backdrop_path,
        number_of_seasons: tv.number_of_seasons,
        number_of_episodes: tv.number_of_episodes,
        status: tv.status,
      });

      if (seriesError) {
        addToast("Error saving series data", "error");
        setIsSaving(false);
        return;
      }

      const { error: logError } = await supabase.from("user_series").upsert(
        {
          user_id: session.user.id,
          series_id: tv.id,
          season_number: activeSeason,
          status: seriesStatus,
          is_favorite: isFavorite,
          rating: rating > 0 ? rating : null,
          review: review.trim() || null,
          has_spoilers: hasSpoilers,
          watched_date: watchedDate || null,
          custom_poster_path: customPosters[activeSeason] || null,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,series_id,season_number" }
      );

      if (logError) {
        addToast("Error saving review", "error");
        setIsSaving(false);
        return;
      }

      addToast("Season review saved successfully", "success");
      setIsLogModalOpen(false);
    } catch (err) {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
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

        const regular = (data.seasons || []).filter((s) => s.season_number > 0);
        const hasActive = regular.some((s) => s.season_number === activeSeason);
        const validSeason = hasActive ? activeSeason : (regular[0]?.season_number ?? 1);
        if (validSeason !== activeSeason) {
          setActiveSeason(validSeason);
        }

        const rawBackdrops = data.images?.backdrops || [];
        const validBackdrops = rawBackdrops.filter(
          (b) =>
            Boolean(b.file_path) &&
            (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
        );

        const defaultBackdrop = data.backdrop_path;
        let candidates: string[] = [];

        const highQualityScenic = validBackdrops
          .filter(
            (b) =>
              b.file_path !== defaultBackdrop &&
              (b.width ?? 0) >= 1920 &&
              (b.iso_639_1 === null || b.iso_639_1 === "en")
          )
          .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

        if (highQualityScenic.length > 0) {
          candidates = highQualityScenic.slice(0, 10).map((b) => b.file_path);
        } else {
          const withoutDefault = validBackdrops
            .filter((b) => b.file_path !== defaultBackdrop)
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
          candidates = withoutDefault.slice(0, 10).map((b) => b.file_path);
        }

        if (candidates.length === 0) {
          candidates = validBackdrops
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
            .slice(0, 10)
            .map((b) => b.file_path);
          if (data.backdrop_path && !candidates.includes(data.backdrop_path)) {
            candidates.unshift(data.backdrop_path);
          }
        }

        let chosenBackdrop = data.backdrop_path;
        if (candidates.length > 0) {
          chosenBackdrop = candidates[Math.floor(Math.random() * candidates.length)];
        }
        setSelectedBackdrop(chosenBackdrop);
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
      setIsCastExpanded(false);

      const newUrl = `/tv/${id}?season=${seasonNum}`;
      window.history.replaceState(null, "", newUrl);

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
    if (!id || availablePosters[activeSeason]) return;

    let ignore = false;

    async function fetchPosters() {
      try {
        setLoadingPosters(true);
        const res = await fetch(`/api/tv/${id}/posters?season=${activeSeason}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.posters?.length) {
            setAvailablePosters((prev) => ({
              ...prev,
              [activeSeason]: data.posters,
            }));
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
  }, [id, activeSeason, availablePosters]);

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

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab, tv]);

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

  const formattedSeasonDate = useMemo(() => {
    const rawDate =
      currentSeasonDetails?.air_date ||
      currentSeasonSummary?.air_date ||
      tv?.first_air_date;
    return formatFullDate(rawDate);
  }, [currentSeasonDetails, currentSeasonSummary, tv]);

  const totalRuntimeMinutes = useMemo(() => {
    if (!currentSeasonDetails?.episodes) return 0;
    return currentSeasonDetails.episodes.reduce(
      (acc, ep) => acc + (ep.runtime || 0),
      0
    );
  }, [currentSeasonDetails]);

  const displayedCast = useMemo(() => {
    const list =
      currentSeasonDetails?.credits?.cast ||
      tv?.credits?.cast ||
      [];
    return isCastExpanded ? list : list.slice(0, 12);
  }, [currentSeasonDetails, tv, isCastExpanded]);

  const allCastLength =
    (currentSeasonDetails?.credits?.cast || tv?.credits?.cast || []).length;

  const crewList = useMemo(() => {
    const seasonCrew = currentSeasonDetails?.credits?.crew;
    if (seasonCrew && seasonCrew.length > 0) return seasonCrew;
    return tv?.credits?.crew || [];
  }, [currentSeasonDetails, tv]);

  const crewSections = useMemo(() => {
    const sections: { label: string; people: { id: number; name: string }[] }[] = [];

    if (tv?.created_by && tv.created_by.length > 0) {
      sections.push({
        label: tv.created_by.length === 1 ? "Creator" : "Creators",
        people: tv.created_by.map((c) => ({ id: c.id, name: c.name })),
      });
    }

    const directors: { id: number; name: string }[] = [];
    const writers: { id: number; name: string }[] = [];
    const producers: { id: number; name: string }[] = [];
    const dop: { id: number; name: string }[] = [];

    const seenDir = new Set<number>();
    const seenWrit = new Set<number>();
    const seenProd = new Set<number>();
    const seenDop = new Set<number>();

    crewList.forEach((m) => {
      const job = m.job?.toLowerCase() || "";
      if (job.includes("director") && !job.includes("photography") && !job.includes("casting")) {
        if (!seenDir.has(m.id)) {
          seenDir.add(m.id);
          directors.push({ id: m.id, name: m.name });
        }
      } else if (job.includes("writer") || job.includes("screenplay") || job.includes("story")) {
        if (!seenWrit.has(m.id)) {
          seenWrit.add(m.id);
          writers.push({ id: m.id, name: m.name });
        }
      } else if (job.includes("producer")) {
        if (!seenProd.has(m.id)) {
          seenProd.add(m.id);
          producers.push({ id: m.id, name: m.name });
        }
      } else if (job.includes("photography") || job.includes("cinematograph")) {
        if (!seenDop.has(m.id)) {
          seenDop.add(m.id);
          dop.push({ id: m.id, name: m.name });
        }
      }
    });

    if (directors.length > 0) {
      sections.push({
        label: directors.length === 1 ? "Director" : "Directors",
        people: directors,
      });
    }
    if (writers.length > 0) {
      sections.push({
        label: writers.length === 1 ? "Writer" : "Writers",
        people: writers,
      });
    }
    if (producers.length > 0) {
      sections.push({
        label: producers.length === 1 ? "Producer" : "Producers",
        people: producers,
      });
    }
    if (dop.length > 0) {
      sections.push({
        label: "Cinematography",
        people: dop,
      });
    }
    return sections;
  }, [crewList, tv?.created_by]);

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
        <Link href="/search" className="text-xs text-[#a8dadc] hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const posterPath =
    customPosters[activeSeason] ||
    currentSeasonDetails?.poster_path ||
    currentSeasonSummary?.poster_path ||
    tv.poster_path;
  const posterUrl = getPosterUrl(posterPath, "w500");
  const backdropUrl = getBackdropUrl(selectedBackdrop, "original");

  const overviewText =
    currentSeasonDetails?.overview ||
    currentSeasonSummary?.overview ||
    tv.overview ||
    "";

  const episodesCount =
    currentSeasonDetails?.episodes?.length ??
    currentSeasonSummary?.episode_count ??
    0;

  const seasonYear = currentSeasonSummary?.air_date
    ? new Date(currentSeasonSummary.air_date).getFullYear()
    : tv.first_air_date
    ? new Date(tv.first_air_date).getFullYear()
    : "—";

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={tv.name}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        posterColumn={
          <div className="relative w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
            {regularSeasons.length > 0 && (
              <div className="hidden sm:flex absolute -left-20 sm:-left-24 lg:-left-26 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
                <SeasonRevolver
                  seasons={regularSeasons}
                  activeSeason={activeSeason}
                  onSelectSeason={handleSelectSeason}
                />
              </div>
            )}

            <MediaPosterCard
              posterUrl={posterUrl}
              title={tv.name}
              hasMultiplePosters={true}
              onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
            />

            <MediaActionBar
              mediaType="tv"
              status={seriesStatus}
              isFavorite={isFavorite}
              onOpenLogModal={() => setIsLogModalOpen(true)}
              onQuickStatusChange={(newStatus) => {
                setSeriesStatus(newStatus);
                handleQuickAction(newStatus, isFavorite);
              }}
              onToggleFavorite={() => {
                const nextFav = !isFavorite;
                setIsFavorite(nextFav);
                handleQuickAction(seriesStatus, nextFav);
              }}
            />

            {regularSeasons.length > 0 && (
              <div className="sm:hidden flex items-center justify-center mt-3 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                <SeasonRevolver
                  seasons={regularSeasons}
                  activeSeason={activeSeason}
                  onSelectSeason={handleSelectSeason}
                />
              </div>
            )}
          </div>
        }
      >
        <div className="w-full">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Series
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
            {tv.name}
          </h1>

          {tv.original_name && tv.original_name !== tv.name && (
            <p className="text-sm text-zinc-500 italic mt-1">
              {tv.original_name}
            </p>
          )}

          <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-3 pb-3 border-b border-zinc-800/80 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formattedSeasonDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatRuntime(totalRuntimeMinutes)}</span>
            </span>
            {episodesCount > 0 && (
              <>
                <span>•</span>
                <span>{episodesCount} Episodes</span>
              </>
            )}
          </div>

          <div className="mt-5 space-y-2 max-w-2xl">
            {tv.tagline && (
              <p className="text-sm italic font-medium text-[#a8dadc]">
                &ldquo;{tv.tagline}&rdquo;
              </p>
            )}
            <p className="text-sm text-zinc-300 leading-relaxed">
              {overviewText || "No overview available."}
            </p>
          </div>

          <div className="mt-8">
            <div className="relative border-b border-zinc-800/60 mb-6">
              <div className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none]">
                <button
                  type="button"
                  ref={(el) => {
                    tabRefs.current.cast = el;
                  }}
                  onClick={() => setActiveTab("cast")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer shrink-0 ${
                    activeTab === "cast"
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Cast
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    tabRefs.current.crew = el;
                  }}
                  onClick={() => setActiveTab("crew")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer shrink-0 ${
                    activeTab === "crew"
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Crew
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    tabRefs.current.details = el;
                  }}
                  onClick={() => setActiveTab("details")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer shrink-0 ${
                    activeTab === "details"
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    tabRefs.current.episodes = el;
                  }}
                  onClick={() => setActiveTab("episodes")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer shrink-0 ${
                    activeTab === "episodes"
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Episodes
                </button>

                <div
                  className="absolute bottom-0 h-0.5 bg-[#a8dadc] transition-all duration-300 pointer-events-none"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                  }}
                />
              </div>
            </div>

            {activeTab === "cast" && (
              <div>
                {displayedCast.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                      {displayedCast.map((actor, idx) => {
                        const profileUrl = actor.profile_path
                          ? getPosterUrl(actor.profile_path, "w185")
                          : null;
                        return (
                          <Link
                            key={`${actor.id}-${idx}`}
                            href={`/person/${actor.id}`}
                            className="flex items-stretch rounded-lg bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0 overflow-hidden h-10 sm:h-11"
                          >
                            <div className="relative h-full aspect-square w-10 sm:w-11 shrink-0 bg-zinc-900 border-r border-zinc-700/60 overflow-hidden flex items-center justify-center">
                              {profileUrl ? (
                                <Image
                                  src={profileUrl}
                                  alt={actor.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-zinc-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 px-2 sm:px-2.5 flex flex-col justify-center">
                              <p className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate leading-tight">
                                {actor.name}
                              </p>
                              {actor.character && (
                                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
                                  as <span className="text-zinc-300 font-medium">{actor.character}</span>
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {allCastLength > 12 && (
                      <div className="flex justify-start mt-4">
                        <button
                          type="button"
                          onClick={() => setIsCastExpanded(!isCastExpanded)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          <span>{isCastExpanded ? "less..." : "more..."}</span>
                          {isCastExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-zinc-500 py-4 col-span-full">
                    No cast information available for this season.
                  </p>
                )}
              </div>
            )}

            {activeTab === "crew" && (
              <div>
                {crewSections.length > 0 ? (
                  <div className="divide-y divide-zinc-700/80">
                    {crewSections.map((section, idx) => (
                      <div
                        key={`${section.label}-${idx}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors"
                      >
                        <div className="w-36 sm:w-44 shrink-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                            {section.label}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-wrap gap-2 items-center">
                          {section.people.map((person) => (
                            <Link
                              key={person.id}
                              href={`/person/${person.id}`}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer"
                            >
                              <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
                                {person.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">
                    No crew information available.
                  </p>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="divide-y divide-zinc-700/80">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                  <div className="w-36 sm:w-44 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      {tv.production_companies && tv.production_companies.length === 1 ? "Studio" : "Studios"}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {tv.production_companies && tv.production_companies.length > 0 ? (
                      tv.production_companies.map((company) => (
                        <Link
                          key={company.id}
                          href={`/company/${company.id}`}
                          className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer"
                        >
                          <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
                            {company.name}
                          </span>
                          {company.origin_country && (
                            <span className="ml-1.5 shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 group-hover:border-[#a8dadc]/40 transition-colors">
                              {company.origin_country}
                            </span>
                          )}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                  <div className="w-36 sm:w-44 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Original title
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 max-w-full">
                      <span
                        className="text-xs sm:text-sm font-medium text-zinc-200 truncate"
                        title={tv.original_name || "—"}
                      >
                        {tv.original_name || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                  <div className="w-36 sm:w-44 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Status
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                      <span className="text-xs sm:text-sm font-medium text-zinc-200">
                        {tv.status || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                  <div className="w-36 sm:w-44 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Original language
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                      <span className="text-xs font-bold uppercase text-zinc-200">
                        {tv.original_language?.toUpperCase() || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                  <div className="w-36 sm:w-44 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Seasons & Episodes
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                      <span className="text-xs sm:text-sm font-medium text-zinc-200">
                        {tv.number_of_seasons} Seasons • {tv.number_of_episodes} Episodes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                  <div className="w-36 sm:w-44 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Genres
                    </span>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {tv.genres && tv.genres.length > 0 ? (
                      tv.genres.map((g) => (
                        <div
                          key={g.id}
                          className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80"
                        >
                          <span className="text-xs font-medium text-zinc-200">
                            {g.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "episodes" && (
              <div>
                {currentSeasonDetails?.episodes &&
                currentSeasonDetails.episodes.length > 0 ? (
                  <div
                    className={`divide-y divide-zinc-700/80 transition-opacity duration-200 ${
                      isSeasonLoading ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {currentSeasonDetails.episodes.map((ep) => {
                      const stillUrl = getPosterUrl(ep.still_path, "w500");
                      return (
                        <div
                          key={ep.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-0 sm:pr-6">
                            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-200">
                              E{String(ep.episode_number).padStart(2, "0")}. {ep.name}
                            </h4>

                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                              <span>{formatFullDate(ep.air_date)}</span>
                              {ep.runtime ? (
                                <>
                                  <span>•</span>
                                  <span>{ep.runtime}m</span>
                                </>
                              ) : null}
                            </div>

                            {ep.overview && (
                              <p className="text-xs text-zinc-400 line-clamp-2 sm:line-clamp-3 mt-2 leading-relaxed">
                                {ep.overview}
                              </p>
                            )}
                          </div>

                          <div className="relative w-full sm:w-44 md:w-48 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800/80">
                            {stillUrl ? (
                              <Image
                                src={stillUrl}
                                alt={ep.name}
                                fill
                                sizes="(max-width: 640px) 100vw, 192px"
                                className="object-cover transition-opacity duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-zinc-600 bg-zinc-900">
                                <Film className="w-6 h-6 mb-1 text-zinc-700" />
                                <span className="text-[10px] text-zinc-500 font-semibold truncate max-w-[140px]">
                                  {ep.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : isSeasonLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loading />
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">No episode information available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={isPosterPickerOpen}
        onClose={() => setIsPosterPickerOpen(false)}
        title="CHANGE ARTWORK"
        type="poster"
        images={availablePosters[activeSeason] || []}
        selectedImage={posterPath}
        onSelectImage={(path) => {
          setCustomPosters((prev) => ({
            ...prev,
            [activeSeason]: path,
          }));
        }}
        isLoading={loadingPosters}
      />

      <ArtworkPickerModal
        isOpen={isBackdropPickerOpen}
        onClose={() => setIsBackdropPickerOpen(false)}
        title="CHANGE BANNER"
        type="backdrop"
        images={(tv.images?.backdrops || []).slice(0, 30)}
        selectedImage={selectedBackdrop}
        onSelectImage={(path) => setSelectedBackdrop(path)}
      />

      <MediaReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={tv.name}
        subtitle={currentSeasonSummary?.name || `Season ${activeSeason}`}
        year={seasonYear}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="tv"
        status={seriesStatus}
        isFavorite={isFavorite}
        rating={rating}
        review={review}
        hasSpoilers={hasSpoilers}
        watchedDate={watchedDate}
        isSaving={isSaving}
        onStatusChange={setSeriesStatus}
        onFavoriteChange={setIsFavorite}
        onRatingChange={setRating}
        onReviewChange={setReview}
        onSpoilersChange={setHasSpoilers}
        onWatchedDateChange={setWatchedDate}
        onSave={handleSaveReview}
        onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
        onOpenBackdropPicker={() => setIsBackdropPickerOpen(true)}
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
