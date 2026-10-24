"use client";

import { useEffect, useState, useRef, useMemo, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Clock,
  Calendar,
  Film,
  Bookmark,
  Eye,
  ListPlus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
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

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mIndex = parseInt(month, 10) - 1;
  const monthName = MONTHS[mIndex] || month;
  return `${monthName} ${parseInt(day, 10)}, ${year}`;
}

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
  const [availablePosters, setAvailablePosters] = useState<Record<number, MovieImage[]>>({});
  const [loadingPosters, setLoadingPosters] = useState(false);

  const [isWatched, setIsWatched] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const [activeTab, setActiveTab] = useState<"cast" | "crew" | "details" | "episodes">("cast");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [isCastExpanded, setIsCastExpanded] = useState(false);

  const topBackdrops = useMemo(() => {
    if (!tv?.images?.backdrops) return [];
    const valid = tv.images.backdrops.filter(
      (b) =>
        Boolean(b.file_path) &&
        (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
    );
    const sorted = [...valid].sort(
      (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)
    );
    const top = sorted.slice(0, 15).map((b) => b.file_path);
    if (tv.backdrop_path && !top.includes(tv.backdrop_path)) {
      top.unshift(tv.backdrop_path);
    }
    return top;
  }, [tv]);

  const pickRandomBackdrop = useCallback(() => {
    if (topBackdrops.length === 0) return;
    const choice = topBackdrops[Math.floor(Math.random() * topBackdrops.length)];
    if (choice) {
      setIsBackdropLoaded(false);
      setSelectedBackdrop(choice);
    }
  }, [topBackdrops]);

  useEffect(() => {
    let ignore = false;

    async function fetchTv() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tv/${id}?season=${startingSeason}`);
        if (!res.ok) throw new Error("Failed to load TV show");

        const data: TvDetails = await res.json();
        if (ignore) return;

        setTv(data);

        const available = (data.seasons || []).filter((s) => s.season_number > 0);
        const resolvedSeason =
          available.find((s) => s.season_number === startingSeason)?.season_number ??
          available[0]?.season_number ??
          1;

        setActiveSeason(resolvedSeason);

        if (data.initialSeason) {
          setSeasonCache({ [resolvedSeason]: data.initialSeason });
        }

        const validBackdrops = (data.images?.backdrops || []).filter(
          (b) =>
            Boolean(b.file_path) &&
            (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
        );
        const sortedBackdrops = [...validBackdrops].sort(
          (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)
        );
        const top = sortedBackdrops.slice(0, 15).map((b) => b.file_path);
        if (data.backdrop_path && !top.includes(data.backdrop_path)) {
          top.unshift(data.backdrop_path);
        }

        let chosenBackdrop = data.backdrop_path;
        if (top.length > 0) {
          chosenBackdrop = top[Math.floor(Math.random() * top.length)];
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
  }, [id, startingSeason]);

  const handleSelectSeason = useCallback(
    async (seasonNum: number) => {
      if (seasonNum === activeSeason) return;

      setActiveSeason(seasonNum);
      setIsCastExpanded(false);
      pickRandomBackdrop();

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
    [activeSeason, id, pickRandomBackdrop, seasonCache]
  );

  useEffect(() => {
    if (!id || !isPosterPickerOpen || availablePosters[activeSeason]) return;

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
  }, [id, activeSeason, isPosterPickerOpen, availablePosters]);

  useEffect(() => {
    const currentTabEl = tabRefs.current[activeTab];
    if (currentTabEl) {
      setIndicatorStyle({
        left: currentTabEl.offsetLeft,
        width: currentTabEl.offsetWidth,
      });
    }
  }, [activeTab, tv]);

  const currentSeasonSummary = useMemo(() => {
    return (tv?.seasons || []).find((s) => s.season_number === activeSeason);
  }, [tv?.seasons, activeSeason]);

  const currentSeasonDetails = seasonCache[activeSeason];

  const totalRuntimeMinutes = useMemo(() => {
    if (!currentSeasonDetails?.episodes) return 0;
    return currentSeasonDetails.episodes.reduce(
      (acc, ep) => acc + (ep.runtime || 0),
      0
    );
  }, [currentSeasonDetails]);

  const seasonAirDate = useMemo(() => {
    return (
      currentSeasonDetails?.air_date ||
      currentSeasonSummary?.air_date ||
      currentSeasonDetails?.episodes?.[0]?.air_date ||
      tv?.first_air_date
    );
  }, [currentSeasonDetails, currentSeasonSummary, tv]);

  const formattedSeasonDate = formatFullDate(seasonAirDate);

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
    const list =
      currentSeasonDetails?.credits?.crew ||
      tv?.credits?.crew ||
      [];
    return list;
  }, [currentSeasonDetails, tv]);

  const sectionCrew = useMemo(() => {
    const directors = crewList.filter((c) => c.job === "Director");
    const writers = crewList.filter((c) =>
      ["Writer", "Screenplay", "Story", "Novel"].includes(c.job)
    );
    const execs = crewList.filter((c) =>
      ["Executive Producer", "Producer"].includes(c.job)
    );
    const dop = crewList.filter((c) =>
      ["Director of Photography", "Cinematography"].includes(c.job)
    );

    const sections = [];
    if (tv?.created_by && tv.created_by.length > 0) {
      sections.push({
        label: tv.created_by.length === 1 ? "Creator" : "Creators",
        people: tv.created_by.map((c) => ({ id: c.id, name: c.name })),
      });
    }
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
    if (execs.length > 0) {
      sections.push({
        label: "Producers",
        people: execs,
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

  return (
    <div className="relative flex-1 w-full font-[family-name:var(--font-geist-sans)] pb-20">
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-[380px] sm:h-[460px] md:h-[520px] lg:h-[560px] overflow-hidden pointer-events-none select-none -z-0">
          <div
            className="relative mx-auto w-full max-w-[1550px] h-full"
            style={{
              maskImage:
                "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 2%, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0.30) 9%, rgba(0,0,0,0.60) 13%, rgba(0,0,0,0.88) 17%, rgba(0,0,0,1) 21%, rgba(0,0,0,1) 79%, rgba(0,0,0,0.88) 83%, rgba(0,0,0,0.60) 87%, rgba(0,0,0,0.30) 91%, rgba(0,0,0,0.12) 95%, rgba(0,0,0,0.03) 98%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 2%, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0.30) 9%, rgba(0,0,0,0.60) 13%, rgba(0,0,0,0.88) 17%, rgba(0,0,0,1) 21%, rgba(0,0,0,1) 79%, rgba(0,0,0,0.88) 83%, rgba(0,0,0,0.60) 87%, rgba(0,0,0,0.30) 91%, rgba(0,0,0,0.12) 95%, rgba(0,0,0,0.03) 98%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div
              className="relative w-full h-full"
              style={{
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 98%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 98%)",
              }}
            >
              <Image
                src={backdropUrl}
                alt={tv.name}
                fill
                priority
                sizes="(max-width: 1550px) 100vw, 1550px"
                onLoad={() => setIsBackdropLoaded(true)}
                className={`object-cover object-top transition-opacity duration-500 ease-out ${
                  isBackdropLoaded ? "opacity-95 sm:opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-zinc-950/60 to-transparent pointer-events-none" />
        </div>
      )}

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-8">
        <div
          className={`flex flex-col md:flex-row gap-8 items-start ${
            backdropUrl ? "mt-64 sm:mt-80 md:mt-96 lg:mt-[460px]" : ""
          }`}
        >
          <div className="relative w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
            {tv.seasons && tv.seasons.length > 0 && (
              <div className="hidden sm:flex absolute -left-20 sm:-left-24 lg:-left-26 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
                <SeasonRevolver
                  seasons={tv.seasons}
                  activeSeason={activeSeason}
                  onSelectSeason={handleSelectSeason}
                />
              </div>
            )}

            <div
              onClick={() => setIsPosterPickerOpen(true)}
              title="Click to change poster"
              className="relative aspect-[2/3] w-56 sm:w-full rounded-t-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl cursor-pointer group"
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={tv.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 224px, 288px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                  <Film className="w-12 h-12 mb-2" />
                  <span className="text-xs text-zinc-500">No poster</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            <div className="w-56 sm:w-full grid grid-cols-3 bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl overflow-hidden shadow-xl">
              <button
                type="button"
                onClick={() => setIsWatched(!isWatched)}
                title={isWatched ? "Watched" : "Mark as watched"}
                className={`flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer ${
                  isWatched
                    ? "text-[#a8dadc] bg-[#a8dadc]/15 hover:bg-[#a8dadc]/25"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <Eye className={`w-5 h-5 ${isWatched ? "stroke-[2.5]" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsWatchlisted(!isWatchlisted)}
                title={isWatchlisted ? "On watchlist" : "Add to watchlist"}
                className={`flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer ${
                  isWatchlisted
                    ? "text-[#a8dadc] bg-[#a8dadc]/15 hover:bg-[#a8dadc]/25"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isWatchlisted ? "fill-[#a8dadc] text-[#a8dadc]" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsInList(!isInList)}
                title={isInList ? "In list" : "Add to list"}
                className={`flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer ${
                  isInList
                    ? "text-[#a8dadc] bg-[#a8dadc]/15 hover:bg-[#a8dadc]/25"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <ListPlus className={`w-5 h-5 ${isInList ? "stroke-[2.5]" : ""}`} />
              </button>
            </div>

            {tv.seasons && tv.seasons.length > 0 && (
              <div className="sm:hidden flex items-center justify-center mt-3 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                <SeasonRevolver
                  seasons={tv.seasons}
                  activeSeason={activeSeason}
                  onSelectSeason={handleSelectSeason}
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
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

              <div>
                {activeTab === "cast" && (
                  <div>
                    {displayedCast.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                          {displayedCast.map((actor) => (
                            <Link
                              key={`${actor.id}-${actor.character}`}
                              href={`/person/${actor.id}`}
                              className="flex flex-col justify-center px-3.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0"
                            >
                              <p className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate">
                                {actor.name}
                              </p>
                              {actor.character && (
                                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  as <span className="text-zinc-300 font-medium">{actor.character}</span>
                                </p>
                              )}
                            </Link>
                          ))}
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
                      <p className="text-xs text-zinc-500 py-4">No cast information available.</p>
                    )}
                  </div>
                )}

                {activeTab === "crew" && (
                  <div>
                    {sectionCrew.length > 0 ? (
                      <div className="divide-y divide-zinc-700/80">
                        {sectionCrew.map((sec) => (
                          <div
                            key={sec.label}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors"
                          >
                            <div className="w-36 sm:w-44 shrink-0">
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                                {sec.label}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-wrap gap-2 items-center">
                              {sec.people.map((person) => (
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
                      <p className="text-xs text-zinc-500 py-4">No crew information available.</p>
                    )}
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="divide-y divide-zinc-700/80">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                      <div className="w-36 sm:w-44 shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                          Platforms
                        </span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2 items-center">
                        {tv.networks && tv.networks.length > 0 ? (
                          tv.networks.map((net) => (
                            <div
                              key={net.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-default"
                            >
                              <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
                                {net.name}
                              </span>
                              {net.origin_country && (
                                <span className="ml-1.5 shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 group-hover:border-[#a8dadc]/40 transition-colors">
                                  {net.origin_country}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-500">—</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                      <div className="w-36 sm:w-44 shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                          Studios
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
                        <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-default max-w-full">
                          <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors truncate">
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
                        <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-default">
                          <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
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
                        <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-default">
                          <span className="text-xs font-bold uppercase text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
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
                        <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-default">
                          <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
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
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-default"
                            >
                              <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
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
                    {isSeasonLoading ? (
                      <div className="py-12 flex items-center justify-center">
                        <Loading />
                      </div>
                    ) : currentSeasonDetails?.episodes &&
                      currentSeasonDetails.episodes.length > 0 ? (
                      <div className="divide-y divide-zinc-700/80">
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
                                    className="object-cover"
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
                    ) : (
                      <p className="text-xs text-zinc-500 py-4">No episode information available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {isPosterPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 sm:px-5 border-b border-zinc-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                CHANGE ARTWORK
              </h3>
              <button
                type="button"
                onClick={() => setIsPosterPickerOpen(false)}
                aria-label="Close"
                className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto min-h-[300px]">
              {loadingPosters || !availablePosters[activeSeason] ? (
                <div className="flex items-center justify-center py-24">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {availablePosters[activeSeason].map((poster) => {
                    const url = getPosterUrl(poster.file_path, "w342");
                    const isSelected = posterPath === poster.file_path;
                    return (
                      <button
                        key={poster.file_path}
                        type="button"
                        onClick={() => {
                          setCustomPosters((prev) => ({
                            ...prev,
                            [activeSeason]: poster.file_path,
                          }));
                          setIsPosterPickerOpen(false);
                        }}
                        className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#a8dadc]"
                            : "border-zinc-800 hover:border-zinc-600 hover:opacity-80"
                        }`}
                      >
                        {url && (
                          <Image
                            src={url}
                            alt="Poster option"
                            fill
                            sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
                            className="object-cover"
                          />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#a8dadc] text-zinc-950 flex items-center justify-center shadow-md z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
